

# 📖 Comic To PDF

A simple and powerful desktop app to scrape comics and view them offline. Built with Electron and Node.js to provide a fast, smooth, and intuitive experience.

---

## 📚 Table of Contents

* [About](#about)
* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
* [How It Works](#how-it-works)
* [Troubleshooting](#troubleshooting)
* [Performance Tips](#performance-tips)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

---

## 📌 About

**Comic To PDF** is a desktop app that allows you to turn your favorite comics into downloadable PDFs for offline reading. Whether you're a fan of romance, action, or fantasy comics, this tool brings your favorite content right to your screen—offline and ready to read.

---

## 🚀 Features

* ✅ One-click dependency installation for both frontend and backend.
* ✅ Simultaneous launch of backend server and Electron app via `run-app.bat`.
* ✅ Simple, easy-to-use interface.
* ✅ Clear console logs for guidance and debugging.
* ✅ Extensible project structure for future improvements.
* ✅ Supports scraping from:

  * 🌐 [https://kingofshojo.com](https://kingofshojo.com)
  * 🌐 [https://aquareader.net](https://aquareader.net)

---

## ⚙️ Prerequisites

* [Node.js](https://nodejs.org/) (v16 or higher recommended)
* npm (comes with Node.js)
* Windows OS (Batch script is Windows-specific)
* *(Optional)* Git (for cloning repositories with Git dependencies)

---

## 🛠 Installation

### 📦 Method 1: Pre-Built Zip

1. **Download** the `.zip` file from the releases section.
2. **Unzip** the contents to a convenient location.
3. **Double-click** the `run-app.bat` file.
4. The app will install dependencies and launch automatically.
5. Start reading!

### 💻 Method 2: Clone the Repo

```bash
git clone https://github.com/SHREE167/Comic2Pdf
cd Comic2Pdf
```

Then unzip (if cloned as ZIP), and double-click `run-app.bat`. This will install all dependencies and launch the UI.

---

## 🧠 How It Works

* **Dependency Management**: Checks if `node_modules` exist before installing to save time on future launches.
* **Backend**: Launches `backend/server.js`, which handles scraping and data processing.
* **Frontend**: Uses Electron to render the UI using local packages.

---

## ❗ Troubleshooting

**App stuck or not launching? Try the following:**

* Ensure your internet is stable during first-time setup.
* Run `run-app.bat` as Administrator.
* Avoid spaces/special characters in project path.
* Run `npm install` manually in both `root/` and `backend/` folders if needed.

**'Electron' or other commands not recognized?**

* Check for `node_modules/.bin/electron.cmd`.
* Delete `node_modules` and try `run-app.bat` again.

**Path errors on Windows?**

* Move your project folder to a simpler path like `C:\Comic2Pdf` to avoid Windows CMD path issues.

---

## ⚡ Performance Tips

* Use a **wired internet connection** for faster npm installs.
* Keep **Node.js and npm updated** for best compatibility.
* For fresh clones, consider using `npm ci` instead of `npm install` for cleaner installs.

---

## 🤝 Contributing

We welcome contributions of any kind! Here's how:

1. Fork the repository.
2. Create a new branch:

```bash
git checkout -b feature-name
```

3. Commit your changes:

```bash
git commit -m "Add feature XYZ"
```

4. Push the branch:

```bash
git push origin feature-name
```

5. Open a Pull Request!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

Feel free to reach out for feedback, ideas, or collaboration:

* **GitHub**: [SHREE167](https://github.com/SHREE167)
* **Email**: [shreekamalesh167@gmail.com](mailto:shreekamalesh167@gmail.com)
* **Telegram**: [Join here](https://t.me/+hBGLgY7ZUZU2NTA9)

---
