# Quotes for Motivation: Focus & Productivity Hack

![License](https://img.shields.io/github/license/quotesformotivation/motivational-chrome-extension)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![Size](https://img.shields.io/badge/size-lightweight-success)

**The most advanced Motivation Chrome Extension for developers, writers, and deep workers.**

Unlike generic "New Tab" extensions that distract you with beautiful photos, **Quotes For Motivation** is a productivity tool first. It uses a **smart scheduling engine** to inject non-intrusive, focus-restoring quotes directly into your current workflow—without breaking your concentration.

**Official Website:** [Quotes For Motivation](https://quotesformotivation.com)  
**Chrome Web Store:** [Get the Extension](https://chromewebstore.google.com/detail/dbnkcjolcadfoomdiocimnmahjnbmobm?utm_source=item-share-cb)

---

## ⚡️ Why This is Different

Most motivation extensions are just "wallpaper changers." This is a **precision engineered** tool designed to optimize your mental state using the **4 Pillars of Focus**:

*   **🧠 Clarity:** For when you're overwhelmed.
*   **🛡 Resilience:** For when the code breaks or the deal falls through.
*   **🔥 Drive:** For when you need to push through the finish line.
*   **♟ Strategy:** For big-picture thinking.

## 🚀 Advanced Technical Features

Built by developers, for developers. This extension leverages the latest Chrome APIs for zero impact on system performance.

### 1. Smart "Pillar" Scheduling 🕰️
Instead of random noise, the extension selects quotes based on your chosen **Pillar of Focus**. It utilizes the `chrome.alarms` API to wake up **only** when needed, ensuring **0% CPU usage** while idle.

### 2. Shadow DOM Encapsulation 🛡️
We use a **closed Shadow DOM** (`attachShadow({ mode: "closed" })`) to inject the quote overlay. This means:
*   **Zero CSS Bleed:** Our styles will *never* break the website you are visiting.
*   **Zero Interference:** The website's styles (like Tailwind or Bootstrap) cannot break our overlay.
*   **Context Aware:** The overlay detects `activeTab` status and avoids restricted pages automatically.

### 3. Intelligent UX Interaction 🖱️
*   **Auto-Resume Timer:** The quote fades away automatically, but if you hover to read it, the timer **pauses instantly**. It resumes only when you look away.
*   **One-Click Copy & Share:** Instant clipboard access and X (Twitter) sharing integration.
*   **Glassmorphism UI:** A modern, dark-mode-aware aesthetic that looks native on any OS.

### 4. Privacy-First Architecture 🔒
*   **Offline Capable:** All 500+ curated quotes are stored locally.
*   **No Tracking:** We do not collect browsing history, keystrokes, or personal data.
*   **Manifest V3:** Fully compliant with Google's latest security and performance standards.

---

## 📦 Installation (Developer Mode)

If you want to inspect the source code or contribute:

1.  **Clone the Repo:**
    ```bash
    git clone https://github.com/quotesformotivation/motivational-chrome-extension.git
    ```
2.  **Open Chrome Extensions:**
    Navigate to `chrome://extensions/` in your browser.
3.  **Enable Developer Mode:**
    Toggle the switch in the top-right corner.
4.  **Load Unpacked:**
    Click "Load unpacked" and select the folder you just cloned.

## 🛠 Project Structure

```text
/
├── assets/         # Optimized icons & local JSON databases
├── background/     # Service Worker (Alarm scheduling logic)
├── content/        # Shadow DOM Injection & Overlay Logic
├── popup/          # Settings UI (Pillar selection, Time, Frequency)
└── manifest.json   # V3 Configuration
```

## 🤝 Contributing

We welcome pull requests from the community! Whether it's adding new quotes to the `assets/quotes.json` database or optimizing the scheduling algorithm.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
