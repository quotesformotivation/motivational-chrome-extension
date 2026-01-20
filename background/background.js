const CATEGORIES = ["Clarity", "Resilience", "Drive", "Strategy"];
const DEFAULT_SETTINGS = {
  startTime: "07:00",
  stopTime: "00:00",
  intervalMinutes: 180,
  category: "Drive",
};

// Google Analytics Config
const GA_MEASUREMENT_ID = "G-PFDGT5YJRJ"; 
const GA_API_SECRET = "AtAQuXGOSTefEYF2ZpzyFg"; 

// Basic profanity filter
const BAD_WORDS = [
  "fuck", "shit", "bitch", "crap", "piss", "dick", "cock", "pussy", "asshole", 
  "f*ck", "s*it", "bullshit"
];

let pendingQuoteState = null;

// --- HELPERS (Hoisted) ---

function getSync(keys) {
  return new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
}

function setSync(items) {
  return new Promise((resolve) => chrome.storage.sync.set(items, resolve));
}

function getLocal(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function setLocal(items) {
  return new Promise((resolve) => chrome.storage.local.set(items, resolve));
}

function parseTimeToMinutes(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

// --- ANALYTICS ---

async function getOrCreateClientId() {
  const result = await getLocal(["clientId"]);
  let clientId = result.clientId;
  if (!clientId) {
    clientId = self.crypto.randomUUID();
    await setLocal({ clientId });
  }
  return clientId;
}

async function sendAnalyticsEvent(eventName, params = {}) {
  if (GA_MEASUREMENT_ID === "G-XXXXXXXXXX") return;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return; 
  }

  try {
    const clientId = await getOrCreateClientId();
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

    await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: eventName,
            params: params,
          },
        ],
      }),
    });
  } catch (error) {
    if (error.name !== 'TypeError' && error.message !== 'Failed to fetch') {
        console.error("Failed to send analytics", error);
    }
  }
}

// Approved Authors List
let ALLOWED_AUTHORS = [];

// --- QUOTES MANAGER SYSTEM ---

class QuotesManager {
  constructor() {
    this.quotes = null;
    this.history = [];
    this.HISTORY_LIMIT = 100;
    this.PILLARS = ['Clarity', 'Drive', 'Resilience', 'Strategy'];
  }

  async loadAuthors() {
    if (ALLOWED_AUTHORS.length > 0) return;
    try {
      const url = chrome.runtime.getURL('assets/authors.json');
      const response = await fetch(url);
      ALLOWED_AUTHORS = await response.json();
    } catch (e) {
      console.error('Failed to load allowed authors:', e);
      // Fallback minimal list if file fails
      ALLOWED_AUTHORS = ["Steve Jobs", "Marcus Aurelius"]; 
    }
  }

  async loadQuotes() {
    if (this.quotes) return;
    try {
      const url = chrome.runtime.getURL('assets/quotes.json');
      const response = await fetch(url);
      this.quotes = await response.json();
    } catch (e) {
      console.error('Failed to load quotes:', e);
      this.quotes = {};
    }
  }

  async init() {
    await Promise.all([this.loadQuotes(), this.loadAuthors()]);
    const data = await getLocal(['quoteHistory']);
    this.history = data.quoteHistory || [];
  }

  validateQuote(quote) {
    if (!quote || !quote.text || !quote.author) return false;
    if (quote.text.length < 10) return false;
    
    // Check Author against allowed list
    if (!ALLOWED_AUTHORS.includes(quote.author)) {
        return false;
    }

    const lowerText = quote.text.toLowerCase();
    if (BAD_WORDS.some(word => lowerText.includes(word))) return false;

    return true;
  }

  async getNextQuote(requestedCategory) {
    await this.init();

    // Default to 'Drive' if nothing valid requested
    let pillar = "Drive"; 
    
    if (requestedCategory) {
        // Normalize input: "clarity" -> "Clarity"
        const formatted = requestedCategory.charAt(0).toUpperCase() + requestedCategory.slice(1).toLowerCase();
        if (this.PILLARS.includes(formatted)) {
            pillar = formatted;
        }
    }

    // Get quotes for the selected pillar
    const pool = this.quotes[pillar] || [];
    
    // Filter out recently used quotes & validate author/content
    const validPool = pool.filter(q => !this.history.includes(q.text) && this.validateQuote(q));
    
    // Fallback if unique pool is empty: reuse quotes from the same pillar but ignore history
    let finalPool = validPool;
    if (finalPool.length === 0) {
        finalPool = pool.filter(q => this.validateQuote(q));
    }

    if (finalPool.length === 0) {
        // Absolute fallback if pillar is somehow empty
        return {
            text: "The only way to do great work is to love what you do.",
            author: "Steve Jobs",
            pillar: "Drive",
            focus_area: "Passion"
        };
    }

    // Random selection from the filtered pool
    const selectedQuote = finalPool[Math.floor(Math.random() * finalPool.length)];

    // Update history
    this.history.unshift(selectedQuote.text);
    if (this.history.length > this.HISTORY_LIMIT) {
        this.history = this.history.slice(0, this.HISTORY_LIMIT);
    }
    await setLocal({ quoteHistory: this.history });

    return {
        ...selectedQuote,
        pillar: pillar
    };
  }
}

const quotesManager = new QuotesManager();

// Wrapper to match existing function signature expected by display logic
async function fetchQuote(category) {
  return await quotesManager.getNextQuote(category);
}

// --- SCHEDULING ---

function getWindowForNow(now, startMinutes, stopMinutes) {
  const start = new Date(now);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  let end = new Date(now);
  end.setHours(Math.floor(stopMinutes / 60), stopMinutes % 60, 0, 0);

  if (stopMinutes <= startMinutes) {
    if (now < start) {
      start.setDate(start.getDate() - 1);
    }
    end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setHours(Math.floor(stopMinutes / 60), stopMinutes % 60, 0, 0);
  }

  return { start, end };
}

function getUpcomingWindow(now, startMinutes, stopMinutes) {
  const start = new Date(now);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  const end = new Date(now);
  end.setHours(Math.floor(stopMinutes / 60), stopMinutes % 60, 0, 0);

  if (stopMinutes <= startMinutes) {
    end.setDate(end.getDate() + 1);
  }

  if (now >= end) {
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

function computeNextAlarmTime(now, settings) {
  const startMinutes =
    parseTimeToMinutes(settings.startTime) ??
    parseTimeToMinutes(DEFAULT_SETTINGS.startTime);
  const stopMinutes =
    parseTimeToMinutes(settings.stopTime) ??
    parseTimeToMinutes(DEFAULT_SETTINGS.stopTime);
  const intervalMinutesRaw = Number(settings.intervalMinutes);
  const intervalMinutes =
    Number.isFinite(intervalMinutesRaw) && intervalMinutesRaw > 0
      ? intervalMinutesRaw
      : DEFAULT_SETTINGS.intervalMinutes;

  const { start, end } = getUpcomingWindow(now, startMinutes, stopMinutes);

  if (now < start || now >= end) {
    return Math.floor(start.getTime());
  }

  const elapsedMinutes = Math.floor((now - start) / 60000);
  const nextSlot = Math.floor(elapsedMinutes / intervalMinutes) + 1;
  const next = new Date(start.getTime() + nextSlot * intervalMinutes * 60000);

  if (next > end) {
    const nextStart = new Date(start);
    nextStart.setDate(nextStart.getDate() + 1);
    return Math.floor(nextStart.getTime());
  }

  return Math.floor(next.getTime());
}

function isWithinWindow(now, startMinutes, stopMinutes) {
  const { start, end } = getWindowForNow(now, startMinutes, stopMinutes);
  return now >= start && now < end;
}

function computeDisplayMs(text) {
  return 30 * 1000;
}

async function ensureDefaults() {
  const stored = await getSync([
    "startTime",
    "stopTime",
    "intervalMinutes",
    "category",
  ]);
  const updates = {};
  if (!stored.startTime) updates.startTime = DEFAULT_SETTINGS.startTime;
  if (!stored.stopTime) updates.stopTime = DEFAULT_SETTINGS.stopTime;
  if (!stored.intervalMinutes) updates.intervalMinutes = DEFAULT_SETTINGS.intervalMinutes;
  if (!stored.category) updates.category = DEFAULT_SETTINGS.category;
  
  if (Object.keys(updates).length) {
    await setSync(updates);
  }
}

async function scheduleNextAlarm() {
  const stored = await getSync([
    "startTime",
    "stopTime",
    "intervalMinutes",
    "category",
  ]);
  
  const settings = { ...DEFAULT_SETTINGS, ...stored };

  const now = new Date();
  const nextTime = computeNextAlarmTime(now, settings);
  
  if (typeof nextTime === 'number' && !Number.isNaN(nextTime)) {
    chrome.alarms.create("quoteAlarm", { when: nextTime });
  }
}

// --- DISPLAY ---

async function showQuoteNotification(isTest = false) {
  const settings = await getSync(["category"]);
  // User selects "Pillar" in settings (Drive, Clarity, etc.)
  const selectedPillar =
    settings.category && CATEGORIES.includes(settings.category)
      ? settings.category
      : DEFAULT_SETTINGS.category;
  
  let quote;
  if (pendingQuoteState && !isTest) {
    quote = pendingQuoteState.quote;
  } else {
    quote = await fetchQuote(selectedPillar);
  }
  
  const duration = computeDisplayMs(quote.text);

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (!activeTab || !activeTab.id) {
    if (!isTest) {
        pendingQuoteState = { quote, category: selectedPillar };
    }
    return { status: "no_tab" };
  }

  const url = activeTab.url || "";
  if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:") || url.startsWith("chrome-extension://") || url.startsWith("view-source:")) {
    if (!isTest) {
      pendingQuoteState = { quote, category: selectedPillar };
    }
    return { status: "restricted", url: url };
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["content/overlay.js"],
    });

    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: (data) => {
        if (window.QFM_SHOW) {
          window.QFM_SHOW(data);
        }
      },
      args: [{
        text: quote.text,
        author: quote.author,
        pillar: quote.pillar,
        category: quote.category || "", // Legacy/Fallback
        duration: duration,
        showBio: Math.random() < 0.3 
      }],
    });
    
    pendingQuoteState = null;
    
    await setLocal({
      lastQuote: quote,
      notificationDurationMs: duration,
      notificationCategory: selectedPillar,
    });
    
    // Send analytics
    sendAnalyticsEvent("quote_view", { 
        pillar: selectedPillar,
        category: quote.focus_area || "General" 
    });

    return { status: "success" };

  } catch (err) {
    console.error("Injection failed", err);
    if (!isTest) {
       pendingQuoteState = { quote, category: selectedPillar };
    }
    return { status: "error", error: err.toString() };
  }
}

// --- LISTENERS ---

async function checkPendingQuote() {
  if (!pendingQuoteState) return;
  await showQuoteNotification(false);
}

chrome.tabs.onActivated.addListener(() => {
  if (pendingQuoteState) {
    setTimeout(checkPendingQuote, 500);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (pendingQuoteState && changeInfo.status === 'complete') {
     checkPendingQuote();
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    sendAnalyticsEvent("extension_install");
  } else if (details.reason === "update") {
    sendAnalyticsEvent("extension_update");
  }
  await ensureDefaults();
  await scheduleNextAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await scheduleNextAlarm();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "settingsUpdated") {
    scheduleNextAlarm();
    sendResponse({ status: "scheduled" });
  } else if (message?.type === "showQuoteNow") {
    showQuoteNotification(true).then((result) => {
        sendResponse(result);
    });
    return true; 
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "quoteAlarm") {
    return;
  }
  const settings = await getSync(["startTime", "stopTime", "intervalMinutes"]);
  const startMinutes =
    parseTimeToMinutes(settings.startTime) ??
    parseTimeToMinutes(DEFAULT_SETTINGS.startTime);
  const stopMinutes =
    parseTimeToMinutes(settings.stopTime) ??
    parseTimeToMinutes(DEFAULT_SETTINGS.stopTime);
  const now = new Date();

  if (isWithinWindow(now, startMinutes, stopMinutes)) {
    await showQuoteNotification();
  }

  await scheduleNextAlarm();
});