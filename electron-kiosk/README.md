# School Exam Kiosk (Electron App)

This folder contains the source code for the Windows Desktop Kiosk Application.

## 1. Project Structure
- `main.js`: Controls the application window, kiosk mode, and system shutdown commands.
- `preload.js`: Securely bridges the frontend (renderer) and backend (main) processes.
- `index.html`: The exam form interface.
- `renderer.js`: Handles the countdown timer and form validation logic.

## 2. How to Run Locally (Development)
1. Install Node.js on your computer.
2. Open a terminal in this folder (`electron-kiosk`).
3. Run `npm install` to install dependencies.
4. Run `npm start` to launch the app.

**Note:** On a real Windows machine, the app will attempt to shut down the PC when the timer ends. 
The shutdown command is: `shutdown /s /t 0 /f`

## 3. How to Build for Windows (.exe)
To create a standalone `.exe` file that runs on school computers:

1. Open your terminal in this folder.
2. Run the package command:
   ```bash
   npm run package
   ```
   (This uses `electron-packager` to bundle the app).

3. You will find a new folder (e.g., `SchoolExamKiosk-win32-x64`) containing the `.exe`.

## 4. Auto-Start on Login
To make this app start automatically when a student logs in:

1. **Method A (Startup Folder):**
   - Press `Win + R`, type `shell:startup`, and press Enter.
   - Place a shortcut to your generated `.exe` in this folder.

2. **Method B (Registry - For Admins):**
   - Open Registry Editor (`regedit`).
   - Go to `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`.
   - Add a new String Value with the path to your `.exe`.

## 5. Security Notes
- `kiosk: true` prevents most shortcuts.
- `alwaysOnTop: true` keeps the window visible.
- The app saves submissions to `Documents/ExamSubmissions`.
