# KIOSK APP - BUILD & PACKAGE INSTRUCTIONS

**App URL:** https://if-8amo.onrender.com/  
**Batch File:** `scripts/kiosk-startup.bat`

---

## 🚀 QUICK START (5 MINUTES)

### 1. Build the App
```bash
npm run build
```
- Compiles code → production-ready files
- Creates `dist/` folder
- Takes ~30 seconds

### 2. Test Locally
```bash
npm run preview
```
- Opens: http://localhost:5000
- Test the form and admin panel
- Press Ctrl+C to stop

### 3. Deploy to Windows Labs
- Copy `scripts/kiosk-startup.bat` to USB drive
- Paste on each lab computer: `C:\kiosk-startup.bat`
- Add to startup folder: `shell:startup`
- Restart computers

**Result:** Kiosk auto-launches on power-on ✅

---

## 📦 BUILD PROCESS EXPLAINED

### What `npm run build` Does:
1. **Compiles TypeScript** → JavaScript
2. **Bundles React** → Single HTML file
3. **Minifies code** → Smaller file size
4. **Creates `dist/`** → Production folder

### Build Output:
```
dist/
├── index.html          (Main file - open in browser)
├── assets/
│   ├── index-[hash].js (JavaScript code)
│   ├── index-[hash].css (Styling)
│   └── ...
└── [other files]
```

**How to use dist folder:**
- Upload to web server
- Or: Run `npm run preview` to test locally

---

## 🖥️ WINDOWS DEPLOYMENT STEPS

### Step 1: Prepare Files
```bash
npm run build           # Creates dist/ folder
```

### Step 2: Create Startup Script
File already exists: `scripts/kiosk-startup.bat`

**What it does:**
- Waits 5 seconds for Windows to load
- Launches Chrome in fullscreen
- Opens: https://if-8amo.onrender.com/

### Step 3: Deploy to Lab Computers

#### Per Computer:
1. **Copy batch file** to: `C:\kiosk-startup.bat`
2. **Add to startup:**
   - Press: Windows + R
   - Type: `shell:startup`
   - Create shortcut to: `C:\kiosk-startup.bat`
3. **Restart computer**
4. **✅ Kiosk auto-launches**

#### Multiple Computers:
1. Copy batch file to USB
2. Paste on each lab PC
3. Add to startup on each
4. Restart all

---

## ⚙️ COMMON COMMANDS

| Command | What It Does |
|---------|--------------|
| `npm run build` | Build for production |
| `npm run preview` | Test build locally (http://localhost:5000) |
| `npm run dev` | Development mode (auto-reload) |
| `npm run db:push` | Sync database schema |
| `npm install` | Install dependencies |

---

## 🔧 TROUBLESHOOTING

### Build fails with errors:
```bash
# Clear cache and rebuild
rm -rf dist/
npm run build
```

### App doesn't load locally:
```bash
# Check if port 5000 is available
npm run preview
# Try different port if needed
```

### Batch file doesn't run:
- Check path: `C:\kiosk-startup.bat` exists
- Check startup folder has shortcut
- Try running batch file manually to test
- Restart computer

### Chrome doesn't launch fullscreen:
- Verify Chrome path: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Check URL is correct: `https://if-8amo.onrender.com/`
- Ensure `--fullscreen` flag is present

---

## 📱 DEPLOYMENT CHECKLIST

- [ ] Run `npm run build`
- [ ] Test with `npm run preview`
- [ ] Verify form works
- [ ] Check admin panel (type `786786`)
- [ ] Copy batch file to USB
- [ ] Test on one lab computer
- [ ] Copy to all lab computers
- [ ] Restart all computers
- [ ] Verify kiosk auto-launches
- [ ] Test student form submission
- [ ] Monitor from admin panel

---

## 🎯 YOUR SETUP

**Current Status:**
- ✅ App built and deployed on Render
- ✅ Live at: https://if-8amo.onrender.com/
- ✅ Batch file created: `scripts/kiosk-startup.bat`
- ⏳ Ready to deploy to Windows labs

**Next Steps:**
1. Copy batch file to USB
2. Paste on lab computers
3. Add to startup folder
4. Restart computers
5. Done! ✅

---

## 🚀 READY FOR PRODUCTION

Your kiosk system is complete and ready for Windows labs:
- Automatic startup on power-on
- Fullscreen locked mode
- All sessions tracked
- Admin panel for monitoring
- Multi-device deployment

**Deploy today!** 🎉
