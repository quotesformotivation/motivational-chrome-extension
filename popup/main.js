const DEFAULT_SETTINGS = {
  startTime: "07:00",
  stopTime: "00:00",
  intervalMinutes: 180,
  category: "Drive",
  theme: "dark",
};

const startInput = document.getElementById("startTime");
const stopInput = document.getElementById("stopTime");
const frequencySelect = document.getElementById("frequency");
const categorySelect = document.getElementById("category");
const themeSelect = document.getElementById("theme");
const saveButton = document.getElementById("saveBtn");
const showNowButton = document.getElementById("showNowBtn");
const statusText = document.getElementById("status");
const frequencyNote = document.getElementById("frequencyNote");

const getSync = (keys) =>
  new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
const setSync = (items) =>
  new Promise((resolve) => chrome.storage.sync.set(items, resolve));

function showStatus(message, duration = 3500) {
  statusText.textContent = message;
  if (!message) {
    return;
  }
  // Clear any existing timeout if user clicks rapidly
  if (window.statusTimeout) clearTimeout(window.statusTimeout);
  
  window.statusTimeout = setTimeout(() => {
    statusText.textContent = "";
  }, duration);
}

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
}

async function loadSettings() {
  const stored = await getSync([
    "startTime",
    "stopTime",
    "intervalMinutes",
    "category",
    "theme",
  ]);
  const startTime = stored.startTime || DEFAULT_SETTINGS.startTime;
  const stopTime = stored.stopTime || DEFAULT_SETTINGS.stopTime;
  const intervalMinutes =
    stored.intervalMinutes || DEFAULT_SETTINGS.intervalMinutes;
  const category = stored.category || DEFAULT_SETTINGS.category;
  const theme = stored.theme || DEFAULT_SETTINGS.theme;

  startInput.value = startTime;
  stopInput.value = stopTime;
  frequencySelect.value = String(intervalMinutes);
  categorySelect.value = category;
  themeSelect.value = theme;
  
  applyTheme(theme);
  updateFrequencyNote();

  if (
    !stored.startTime ||
    !stored.stopTime ||
    !stored.intervalMinutes ||
    !stored.category ||
    !stored.theme
  ) {
    await setSync({
      startTime,
      stopTime,
      intervalMinutes,
      category,
      theme,
    });
  }
}

function updateFrequencyNote() {
  const minutes = Number.parseInt(frequencySelect.value, 10);
  
  if (minutes < 60) {
    frequencyNote.textContent = `Every ${minutes} ${minutes === 1 ? "minute" : "minutes"} between your selected times.`;
  } else {
    const hours = minutes / 60;
    frequencyNote.textContent = `Every ${hours} ${hours === 1 ? "hour" : "hours"} between your selected times.`;
  }
}

saveButton.addEventListener("click", async () => {
  const startTime = startInput.value || DEFAULT_SETTINGS.startTime;
  const stopTime = stopInput.value || DEFAULT_SETTINGS.stopTime;
  const intervalMinutes =
    Number.parseInt(frequencySelect.value, 10) ||
    DEFAULT_SETTINGS.intervalMinutes;
  const category = categorySelect.value || DEFAULT_SETTINGS.category;
  const theme = themeSelect.value || DEFAULT_SETTINGS.theme;

  await setSync({ startTime, stopTime, intervalMinutes, category, theme });
  
  applyTheme(theme);
  chrome.runtime.sendMessage({ type: "settingsUpdated" });
  showStatus("Settings Saved");
});

showNowButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "showQuoteNow" }, (response) => {
    if (chrome.runtime.lastError) {
      showStatus("Something went wrong. Please refresh the page.");
      return;
    }
    
    if (response && response.status === "success") {
      showStatus("Quote sent! Check your active tab.");
    } else if (response && response.status === "restricted") {
      showStatus("Quotes can't appear on system pages (chrome://). Please visit a new website tab and try again.");
    } else if (response && response.status === "no_tab") {
       showStatus("No active tab found. Switch to a webpage first.");
    } else {
      showStatus("Failed to send quote.");
    }
  });
});

frequencySelect.addEventListener("change", updateFrequencyNote);

loadSettings();
