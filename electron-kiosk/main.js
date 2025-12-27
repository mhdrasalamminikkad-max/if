const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;
let formSubmitted = false; // Track if form has been submitted

// --- CONFIGURATION ---
const DOCUMENTS_PATH = app.getPath('documents');
const DATA_DIR = path.join(DOCUMENTS_PATH, 'LabLogs');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Ensure Data Directory Exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load Config
let appConfig = { defaultTime: 10 }; // Default 10 minutes
if (fs.existsSync(CONFIG_FILE)) {
  try {
    appConfig = JSON.parse(fs.readFileSync(CONFIG_FILE));
  } catch (e) {
    console.error("Error reading config", e);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true, 
    kiosk: true,      
    frame: false,     
    alwaysOnTop: true, 
    minimizable: false,
    closable: false, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, 
      contextIsolation: true, 
      devTools: false 
    }
  });

  // Load the React web app from hosted backend
  mainWindow.loadURL('https://if-2dhc.onrender.com/');
  
  // Send config to renderer when ready
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('init-config', appConfig);
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  
  // --- SECURITY: Disable keyboard shortcuts to prevent escape ---
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Block ESC key
    if (input.key.toLowerCase() === 'escape') {
      event.preventDefault();
    }
    // Block ALT+F4 (close window)
    if (input.alt && input.key.toLowerCase() === 'f4') {
      event.preventDefault();
    }
    // Block ALT+TAB (switch apps)
    if (input.alt && input.key.toLowerCase() === 'tab') {
      event.preventDefault();
    }
    // Block Windows key
    if (input.key === 'Meta') {
      event.preventDefault();
    }
    // Block CTRL+ALT+DELETE
    if (input.control && input.alt && input.key.toLowerCase() === 'delete') {
      event.preventDefault();
    }
  });
}

app.whenReady().then(createWindow);

// --- IPC HANDLERS ---

// 1. Submit Form
ipcMain.handle('submit-form', async (event, data) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `entry_${data.registrationNumber}_${timestamp}.json`;
    const filePath = path.join(DATA_DIR, filename);

    // Save individual log file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    // Also append to a master log file for easier reading
    const masterLogPath = path.join(DATA_DIR, 'master_log.json');
    let masterLog = [];
    if (fs.existsSync(masterLogPath)) {
        try { masterLog = JSON.parse(fs.readFileSync(masterLogPath)); } catch (e) {}
    }
    masterLog.push(data);
    fs.writeFileSync(masterLogPath, JSON.stringify(masterLog, null, 2));

    // Mark form as successfully submitted
    formSubmitted = true;
    return { success: true };
  } catch (error) {
    console.error('Save failed:', error);
    return { success: false, error: error.message };
  }
});

// Check if form has been submitted
ipcMain.handle('check-form-submitted', async () => {
  return formSubmitted;
});

// 2. Unlock PC (Only allowed after form submission)
ipcMain.on('unlock-pc', () => {
  if (formSubmitted) {
    // Close the kiosk window to unlock the desktop
    mainWindow.close();
  } else {
    console.warn('Unlock attempted without form submission - BLOCKED');
    mainWindow.webContents.send('unlock-blocked', { reason: 'Form not submitted' });
  }
});

// 3. System Shutdown
ipcMain.on('system-shutdown', () => {
  exec('shutdown /s /t 0 /f');
});

// 4. Admin: Get Logs
ipcMain.handle('get-logs', async () => {
  try {
    const masterLogPath = path.join(DATA_DIR, 'master_log.json');
    if (fs.existsSync(masterLogPath)) {
      return JSON.parse(fs.readFileSync(masterLogPath));
    }
    return [];
  } catch (error) {
    console.error("Error fetching logs", error);
    return [];
  }
});

// 5. Admin: Update Settings
ipcMain.handle('update-settings', async (event, newSettings) => {
  try {
    appConfig = { ...appConfig, ...newSettings };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(appConfig, null, 2));
    
    // Notify renderer of new config
    mainWindow.webContents.send('config-updated', appConfig);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
