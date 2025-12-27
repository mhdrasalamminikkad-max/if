# Lab PC Setup Guide - How to Auto-Start Application on Power On

This guide explains how to set up the School Exam Kiosk application to automatically open when the lab PC powers on.

## Overview

The application has two parts:
1. **Backend Server** - Manages student data and logs (runs on Replit)
2. **Electron Kiosk App** - The desktop application students use (runs on lab PC)

## Step-by-Step Setup Instructions

### Part 1: Build the Standalone Application

1. **On your development computer**, open terminal in the `electron-kiosk` folder
2. Run these commands:
   ```bash
   cd electron-kiosk
   npm install
   npm run package
   ```
3. This creates a folder like `SchoolExamKiosk-win32-x64` with an `.exe` file inside

### Part 2: Transfer to Lab PC

1. Copy the `SchoolExamKiosk-win32-x64` folder to the lab PC
2. Keep it in an easy location, like:
   - `C:\Program Files\SchoolExamKiosk\` 
   - Or `C:\Users\[StudentAccount]\SchoolExamKiosk\`

### Part 3: Make It Auto-Start on Power On

Choose **ONE** method below:

#### **Method A: Startup Folder (EASIEST - Recommended)**

1. Press `Win + R` on the lab PC keyboard
2. Type `shell:startup` and press Enter
3. A folder opens (Windows Startup folder)
4. Right-click in the empty space → **New** → **Shortcut**
5. In the location field, paste:
   ```
   C:\Path\To\SchoolExamKiosk\SchoolExamKiosk.exe
   ```
   (Replace with your actual path)
6. Click **Next**
7. Name it: `Lab Exam Kiosk`
8. Click **Finish**

**Now the app will auto-start when students log in!**

---

#### **Method B: Registry (For Advanced Users)**

1. Press `Win + R`, type `regedit`, press Enter
2. Navigate to:
   ```
   HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
   ```
3. Right-click → **New** → **String Value**
4. Name: `LabExamKiosk`
5. Value (double-click to edit):
   ```
   C:\Path\To\SchoolExamKiosk\SchoolExamKiosk.exe
   ```
6. Click OK and restart

---

#### **Method C: Task Scheduler (Professional - Recommended for Admins)**

This is the most reliable method for organizations:

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click **Create Basic Task** (in the right panel)
3. Fill in the details:
   - **Name:** `Lab Exam Kiosk Startup`
   - **Description:** `Auto-start exam kiosk application`
   - Click **Next**

4. **Trigger Setup:**
   - Select: **At startup**
   - Click **Next**

5. **Action Setup:**
   - Select: **Start a program**
   - Click **Next**

6. **Program Configuration:**
   - **Program/script:**
     ```
     C:\Path\To\SchoolExamKiosk\SchoolExamKiosk.exe
     ```
     (Replace with your actual path)
   - Leave **Add arguments** empty
   - Leave **Start in** empty
   - Click **Next**

7. **Summary:**
   - Review settings
   - Check: **Open the Properties dialog for this task when I click Finish**
   - Click **Finish**

8. **Additional Settings (in Properties dialog):**
   - Go to **General** tab
   - Check: **Run whether user is logged in or not**
   - Under **Security options**, select your user account
   - Go to **Conditions** tab
   - Uncheck: **Start the task only if the computer is on AC power**
   - Click **OK**

**Advantages of Task Scheduler:**
- ✓ Can run before user login (with proper permissions)
- ✓ Easy to modify or disable later
- ✓ Can set multiple conditions
- ✓ Built-in logging for troubleshooting
- ✓ Professional/Enterprise standard

---

### Part 4: Security Features

The application includes built-in security:

✓ **Full Screen Kiosk Mode** - Cannot minimize or close
✓ **Keyboard Shortcuts Blocked**:
  - ESC key (cannot exit)
  - ALT+F4 (cannot close)
  - ALT+TAB (cannot switch apps)
  - Windows key (cannot access Windows)
  - CTRL+ALT+DELETE (cannot access task manager)

✓ **Auto-Shutdown** - PC shuts down automatically when exam time ends
✓ **Secure Logging** - All entries saved to `Documents\LabLogs`

---

## Testing the Setup

1. **Restart the lab PC**
2. Application should automatically open
3. Test the form with sample data
4. Check that you cannot close the app or access Windows

## If Auto-Start Doesn't Work

- **Check the shortcut path** - Make sure the path to `.exe` is correct
- **Check Windows permissions** - Student account may need permissions
- **Use Task Scheduler** (Advanced):
  - Press `Win + R`, type `taskschd.msc`
  - Create a new task to run the `.exe` at startup
  - Set trigger: "At startup"
  - Set action: "Start a program" (your `.exe` path)

## Backend Connection

The application automatically connects to the backend at:
```
http://localhost:5000
```

Make sure this is running before students use the kiosk. On Replit, the backend runs automatically.

## Data Storage

All exam logs are saved locally on the lab PC at:
```
C:\Users\[YourUsername]\Documents\LabLogs\master_log.json
```

You can backup this file regularly to keep records safe.

---

## Quick Summary

1. Run `npm run package` in `electron-kiosk` folder
2. Copy the generated folder to lab PC
3. Create a shortcut in `shell:startup`
4. Restart PC - application opens automatically!

That's it! The app will now open on every power-on.
