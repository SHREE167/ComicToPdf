# Comic To Pdf

📖 A simple desktop app to scrape comics and view them offline.
 A powerful Electron desktop app combined with a Node.js backend server for scraping and processing data efficiently.

---

## Table of Contents

- [About](#about)  
- [Features](#features)  
- [Prerequisites](#prerequisites)  
- [Installation](#installation)  
- [Usage](#usage)  
- [How It Works](#how-it-works)  
- [Troubleshooting](#troubleshooting)  
- [Performance Tips](#performance-tips)  
- [Contributing](#contributing)  
- [License](#license)

---

## About

Comic To Pdf effectively allows you to turn your favorite comics into pdfs for offline use!

---

## Features

- Automated installation of all required dependencies for both frontend and backend.  
- Simultaneous startup of backend server and Electron app with a single script.  
- Clear console logs guiding users through installation and launch processes.  
- Easy-to-use and extensible project structure. 
- Click your fav Comic just by providing links  

Current support for 2 sites: 
1.kingofshojo.com
2.https://aquareader.net/

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v16 or later recommended)  
- npm (comes bundled with Node.js)  
- Windows OS (due to batch script usage)  
- Optional: Git (for fetching git dependencies)

---

## Installation

1st method:
-Click and install the zip file!
-Unzip and click the run-app.bat file, this will install all the dependency for the application then you can see the UI in your browser! Happy Reading

2nd Method:
 **Clone the repository**

   ```bash
   git clone https://github.com/SHREE167/Comic2Pdf
   cd [to your directory]
```
Then unzip and click the run-app.bat file, this will install all the dependency for the application then you can see the UI in your browser! Happy Reading!

How It Works
Depe
ndency management: Checks if the node_modules directories exist before running npm install. This prevents redundant installs on subsequent runs.

Backend server: Runs server.js located in the backend directory, serving API endpoints for data processing.

Electron app: Uses the locally installed Electron binary to launch the desktop UI.

Troubleshooting
App stuck during startup or dependency install:

Ensure stable internet connection during the first run.

Run the batch script as Administrator to avoid permission issues.

Avoid spaces or special characters in the project path.

Manually run npm install in the root and backend folders to verify installations.

'Electron' or other commands not recognized:

Check if dependencies installed successfully in node_modules/.bin.

Delete node_modules and run the batch script again.

Windows path errors (due to spaces in folder names):
The batch script tries to handle paths with spaces by quoting them.
If errors persist, consider moving the project folder to a path without spaces (e.g., C:\RealScraper).

Performance Tips
Dependency installation speed depends mostly on your network and disk speed.

Use a wired connection for faster npm package downloads.

Keep Node.js and npm updated for best performance.

Consider using npm ci for clean installs on fresh clones.

Contributing
Contributions, issues, and feature requests are welcome! Feel free to:

Fork the repo

Create a branch for your feature (git checkout -b feature-name)

Commit your changes (git commit -m 'Add some feature')

Push to the branch (git push origin feature-name)

Open a Pull Request

License
This project is licensed under the MIT License. See the LICENSE file for details.

Contact
For questions or suggestions, contact:

Shree Kamalesh
GitHub: https://github.com/SHREE167
Email: shree.kamalesh@example.com


