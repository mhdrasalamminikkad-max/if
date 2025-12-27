# Electron Kiosk Activation Guide

## Quick Start - Activate the Kiosk

### Prerequisites
- Windows 10 or Windows 11
- Administrator access
- Node.js installed (https://nodejs.org/)

### Step 1: Build the Kiosk Executable

```bash
# Navigate to the electron-kiosk directory
cd electron-kiosk

# Install dependencies
npm install

# Build the executable
npm run package
```

This creates a folder: `SchoolExamKiosk-win32-x64`

### Step 2: Deploy to Program Files

```bash
# Copy the built folder to Program Files
# You can do this via File Explorer or using PowerShell:

Copy-Item -Path "SchoolExamKiosk-win32-x64" -Destination "C:\Program Files\SchoolExamKiosk" -Recurse -Force
```

### Step 3: Set Up Auto-Launch

Run the setup script as Administrator:

```powershell
# Run as Administrator in PowerShell
.\scripts\setup-kiosk-autostart.ps1
```

This will:
✅ Create a Task Scheduler entry for auto-launch on startup  
✅ Create a startup folder shortcut  
✅ Set the kiosk to run with highest privileges  

### Step 4: Test the Kiosk

```bash
# To test manually without restarting:
cd electron-kiosk
npm start
```

Or launch directly:
```bash
C:\Program Files\SchoolExamKiosk\SchoolExamKiosk.exe
```

### Step 5: Verify Auto-Launch Setup

1. Open Task Scheduler:
   - Press `WIN+R`, type `taskschd.msc`, press Enter
   - Look for task named: **"Lab Kiosk Launcher"**
   - It should show Status: "Enabled"

2. Check Startup folder:
   - Press `WIN+R`, type `shell:startup`, press Enter
   - Look for shortcut: **"Lab Kiosk"**

### Step 6: Restart to Activate

After setup, restart the computer:

```bash
shutdown /r /t 30 /c "Kiosk will auto-launch after restart"
```

The kiosk should automatically launch in full-screen after Windows starts.

---

## Security Features (Automatically Enabled)

✅ **ESC Key** - BLOCKED  
✅ **ALT+F4** - BLOCKED  
✅ **ALT+TAB** - BLOCKED  
✅ **Windows Key** - BLOCKED  
✅ **CTRL+ALT+DELETE** - BLOCKED  
✅ **F11/F12/F5** - BLOCKED (Fullscreen/Dev Tools/Refresh)  
✅ **Full Kiosk Mode** - Complete lockdown  

Students cannot exit until they submit the form.

---

## Troubleshooting

### Problem: Kiosk doesn't launch on startup

**Solution:**
1. Check Task Scheduler:
   - Open: `taskschd.msc`
   - Find: "Lab Kiosk Launcher"
   - Verify Status is "Enabled"
   - Right-click > Properties > check "Run with highest privileges"

2. Check the executable path:
   ```powershell
   Test-Path "C:\Program Files\SchoolExamKiosk\SchoolExamKiosk.exe"
   ```

3. Check Windows Event Viewer for errors:
   - Press `WIN+R`, type `eventvwr.msc`
   - Look in: Windows Logs > System

### Problem: ESC key or ALT+F4 still works

**Solution:**
1. Update electron version in `electron-kiosk/package.json`
2. Rebuild: `npm install` then `npm run package`
3. Redeploy to Program Files

### Problem: Kiosk loads local form instead of web page

**Check main.js:**
```javascript
// Should load the web URL:
mainWindow.loadURL('https://if-2dhc.onrender.com/');
```

If it's loading a local file, update the URL and rebuild.

### Problem: Network not accessible from kiosk

1. Check internet connectivity
2. Verify firewall allows Electron app
3. Test URL in browser first:
   - Open any browser
   - Visit: https://if-2dhc.onrender.com/
   - It should load successfully

---

## Advanced Configuration

### Change the Web URL
Edit `electron-kiosk/main.js`:
```javascript
mainWindow.loadURL('https://your-url.com');
```

Then rebuild:
```bash
npm run package
```

### Auto-Shutdown After Session
The kiosk automatically shuts down 5 seconds after form submission (configurable in the web app).

### Store Logs Locally
Logs are automatically saved to:
```
C:\Users\[Username]\Documents\LabLogs\
```

---

## Disable Auto-Launch (When Needed)

**Via Task Scheduler:**
1. Open `taskschd.msc`
2. Find "Lab Kiosk Launcher"
3. Right-click > Disable

**Via Startup Folder:**
1. Press `WIN+R`, type `shell:startup`
2. Delete shortcut "Lab Kiosk"

---

## Support

For issues:
1. Check Windows Event Viewer: `eventvwr.msc`
2. Look for errors in System logs
3. Check that network URL is accessible
4. Verify Node.js and Electron are properly installed

