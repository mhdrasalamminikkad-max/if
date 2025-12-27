# Lab Entry Kiosk - Setup Guide for Lab PCs

## Overview
This Electron kiosk application automatically launches on PC startup and locks students into the Lab Entry form. Students cannot escape the application until they submit their lab entry.

## Security Features
✅ **ESC Key Blocked** - Cannot exit with ESC key  
✅ **ALT+F4 Blocked** - Cannot close window  
✅ **ALT+TAB Blocked** - Cannot switch applications  
✅ **Windows Key Blocked** - Cannot access start menu  
✅ **CTRL+ALT+DEL Blocked** - Cannot access task manager  
✅ **F11, F12, F5 Blocked** - Cannot enter fullscreen, dev tools, or refresh  
✅ **Full Kiosk Mode** - Complete lockdown mode  

## Installation Steps

### Step 1: Install Node.js
- Download Node.js from https://nodejs.org/ (LTS version)
- Install and verify: `node --version`

### Step 2: Set Up the Application

```bash
# Navigate to the electron-kiosk folder
cd electron-kiosk

# Install dependencies
npm install
```

### Step 3: Update Configuration
Edit `main.js` and update the web server URL:
```javascript
// Change 'index.html' to your web app URL if using remote server:
// mainWindow.loadURL('http://192.168.x.x:5000');  // Your server IP
```

### Step 4: Build the Executable
```bash
npm run package
```

This creates a folder `SchoolExamKiosk-win32-x64` with the executable.

### Step 5: Deploy to Lab PCs

#### Option A: USB Installation
1. Copy `SchoolExamKiosk-win32-x64` folder to USB drive
2. On each lab PC, copy the folder to `C:\Program Files\`
3. Continue to Step 6

#### Option B: Network Deployment
1. Create a shared network folder
2. Copy `SchoolExamKiosk-win32-x64` to the network share
3. Map the shared folder on each lab PC

### Step 6: Set Up Auto-Launch on Startup

#### Windows Task Scheduler Method:
1. Open **Task Scheduler** (Search: "Task Scheduler")
2. Click "Create Task"
3. Name: `Lab Kiosk Launcher`
4. **Triggers Tab:**
   - Click "New..."
   - Begin the task: "At startup"
   - Click OK
5. **Actions Tab:**
   - Action: "Start a program"
   - Program: `C:\Program Files\SchoolExamKiosk-win32-x64\SchoolExamKiosk.exe`
   - Click OK
6. **General Tab:**
   - Check "Run with highest privileges"
   - Check "Run whether user is logged in or not"
7. Click OK

#### Startup Folder Method (Simpler):
1. Create shortcut to: `C:\Program Files\SchoolExamKiosk-win32-x64\SchoolExamKiosk.exe`
2. Paste the shortcut in: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup\`

### Step 7: Test on a Lab PC
1. Restart the PC
2. Kiosk app should launch automatically in full-screen
3. Try pressing ESC, ALT+F4, ALT+TAB - none should work
4. Student must fill the form and click "Submit Log & Unlock PC"
5. After submission, workstation will unlock for 5 seconds then shutdown

## Admin Access
- Click the **Settings Icon** (gear) in the top-right corner
- Password: `admin123` (change in `renderer.js` line 176)
- View student logs, change timer, save configuration

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App doesn't start on reboot | Check Task Scheduler is enabled, run as admin |
| ESC key still works | Update `main.js` with latest key blocking code |
| Timer shows wrong time | Check `CONFIG_FILE` path in `main.js` |
| Students can't submit form | Ensure web server is accessible from PC |

## Security Notes
- Change the admin password in `renderer.js` line 176
- Store logs locally in `Documents/LabLogs/`
- Logs are saved as JSON for easy import to database
- Configure network access limits on the PC to prevent other activities

## Support
Contact IT support if kiosk fails to launch or security features are bypassed.
