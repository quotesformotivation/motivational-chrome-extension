# Quotes for Motivation: Focus & Productivity Hack

![License](https://img.shields.io/github/license/quotesformotivation/motivational-chrome-extension)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)

A lightweight, privacy-focused Chrome extension that surfaces non-intrusive motivational quotes while you work. Designed to boost focus and mental resilience without hijacking your New Tab page or disrupting your workflow.

**Official Website:** [Quotes For Motivation](https://quotesformotivation.com)

---

## 🚀 Key Features

- **Smart Scheduling:** Uses Chrome's `alarms` API to deliver quotes at optimal intervals, ensuring you stay motivated without being overwhelmed.
- **Non-Intrusive UI:** A clean, dark-mode-aware overlay that appears gracefully and dismisses easily.
- **Privacy First:** 100% offline-capable. No tracking, no external analytics, and no data collection.
- **Performance Optimized:** Built with Manifest V3 service workers for zero background memory footprint when idle.
- **Curated Database:** Includes a robust local database of categorized quotes (Stoicism, Productivity, Mindfulness, etc.).

## 📦 Installation (Developer Mode)

Since this is the source code, you can load it directly into Chrome or Edge/Brave to test or contribute.

1.  Clone this repository:
    ```bash
    git clone https://github.com/quotesformotivation/motivational-chrome-extension.git
    ```
2.  Open your browser and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** in the top-right corner.
4.  Click **Load unpacked** and select the folder where you cloned this repository.

## 🛠 Project Structure

The project follows the standard Manifest V3 architecture:

```text
/
├── assets/         # Static assets (icons, local quote databases)
├── background/     # Service worker for scheduling & events
├── content/        # Content scripts & styles for the overlay UI
├── popup/          # The popup UI logic and styling
└── manifest.json   # Extension configuration
```

## 🤝 Contributing

We welcome contributions! Please see our [Code of Conduct](CODE_OF_CONDUCT.md) for community guidelines.

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.