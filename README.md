# ODEESSA — Ethiopians Information Network 📰

![Status](https://img.shields.io/badge/Status-Active-success)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

**ODEESSA** is a modern, responsive **Progressive Web App (PWA)** that aggregates news from major Oromo media outlets (BBC Afaan Oromoo, OBN, FNN) into a single, distraction-free interface.

## 🚀 Features

*   **⚡ Real-time Aggregation:** Scrapes and consolidates news from multiple sources.
*   **📱 PWA Ready:** Installable on mobile/desktop with offline support.
*   **🌙 Dark/Light Mode:** Automatic theme detection with manual toggle.
*   **🔍 Advanced Search:** Filter by date (Recency), source, or keywords.
*   **🎨 Responsive Design:** Optimized for mobile, tablet, and desktop.

## 🛠️ Tech Stack

*   **Frontend:** HTML5, Vanilla JS, Tailwind CSS, Lucide Icons.
*   **Backend:** Node.js, Express.js.
*   **Database:** SQLite (via Sequelize).
*   **Scraping:** Cheerio / Puppeteer.

## 🏁 Quick Start

### 1. Prerequisites
Ensure you have **Node.js** installed.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/oduu-news.git

# Navigate to directory
cd oduu-news

# Install dependencies
npm install
```

### 3. Run the App
Start the backend server (API & Scraper):
```bash
node index.js
```
*The server will start on `http://localhost:3000` and perform an initial scrape.*

### 4. View the Frontend
Since the frontend is decoupled:
1.  Open `index.html` in your browser.
2.  **Recommended:** Use VS Code **Live Server** to serve `index.html` for the best PWA experience.

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/articles` | Fetch paginated news. Params: `page`, `limit`, `search`, `source`, `days`. |
| `POST` | `/scrape` | Trigger a manual scrape of all sources. |
| `GET` | `/docs` | View full Swagger API documentation. |

## 📲 How to Install (PWA)

1.  Open the app in your browser (Chrome/Edge/Safari).
2.  **Desktop:** Click the "Install" icon in the address bar.
3.  **Mobile:** Tap "Share" → "Add to Home Screen".
4.  Enjoy the native app experience!

## 🤝 Contributing

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
*Built for the Community.*
