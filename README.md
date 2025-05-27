# **Codemate - Your Productivity Powerhouse**

**Codemate** is a lightweight, free, and open-source utility application designed to streamline your workflow and boost your productivity. It helps you quickly launch applications, execute terminal commands, open websites, manage Docker containers, capture screenshots and access clipboard history

## **Features**

* **Application Launcher:** Quickly launch your favorite applications with simple shortcuts.  
* **Terminal Command Execution:** Execute terminal commands directly from the app.  
* **Website Opener:** Open frequently visited websites with ease.  
* **Docker Control:** Manage your Docker containers (start, stop) without leaving your workflow.  
* **Screenshot Capture:** Capture screenshots of your entire screen.  
* **Clipboard History:** Access your clipboard history for quick pasting of previously copied items.  
* **Custom Actions:** Define custom actions for files, folders, and websites to automate repetitive tasks.  
* **Super Simple UI:** Clean, intuitive, and easy-to-use interface.  
* **Forever Free:** This application will always be free to use.  
* **No Ads, No Data Selling:** Your privacy is important. We don't display ads or sell your data.

---

## **Getting Started (Development)**

### **Download & Install**

1. **Clone the repository:**
   ```sh
   git clone https://github.com/rkeshri04/Codemate-Official.git
   cd Codemate-Official/v1/dev/frontend
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

### **Run Locally (Development Mode)**

This will start both the React frontend and Electron in development mode with hot reload:

```sh
npm run dev
```

- The React app runs on [http://localhost:5123](http://localhost:5123) (or similar).
- Electron will open the desktop app window automatically.

### **Build for Production**

#### **Build the React and Electron code:**

```sh
npm run build
npm run transpile:electron
```

#### **Create a packaged build for your platform:**

- **macOS (Apple Silicon):**
  ```sh
  npm run dist:mac
  ```
  Output: `.dmg` file in the `dist/` directory.

- **Windows (x64):**
  ```sh
  npm run dist:win
  ```
  Output: `.exe` and `.msi` files in the `dist/` directory.

- **Linux (x64):**
  ```sh
  npm run dist:linux
  ```
  Output: `.AppImage` file in the `dist/` directory.

> **Note:** You need to have the appropriate platform (macOS, Windows, or Linux) to build for that OS natively.

---

## **Usage**

1. **Launch the Application:** Open Codemate from your applications menu or desktop shortcut.  
2. **Explore the Interface:** Familiarize yourself with the main sections of the app.  
3. **Configure Settings:** Customize the app to your preferences, including shortcuts, actions, and appearance.  
4. **Start Using the Features:** Use the application launcher, terminal command execution, and other features to streamline your workflow. Refer to the in-app help or online documentation for detailed usage instructions.

## **Bug Reports**

If you encounter any bugs or issues, please submit a bug report on the [GitHub Issue Tracker](https://github.com/rkeshri04/Codemate-Official/issues). Be sure to include detailed information about the problem, including steps to reproduce it, your operating system version, and any relevant error messages.

## **Feature Requests**

If you have any ideas for new features or improvements, please submit a feature request on the [GitHub Issue Tracker](https://github.com/rkeshri04/Codemate-Official/issues).

## **License**

Codemate is released under the [MIT License](https://opensource.org/licenses/MIT).

## **Acknowledgements**

Thank you for using Codemate\! We hope it helps you boost your productivity and streamline your workflow.