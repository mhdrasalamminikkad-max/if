# KIOSK APP - WINDOWS DEPLOYMENT GUIDE

**App URL:** https://if-8amo.onrender.com/  
**Status:** Ready for Production  
**Batch File:** `scripts/kiosk-startup.bat`

---

## 🎯 COMPLETE WINDOWS SETUP (15 MINUTES)

### STEP 1: Build the App (5 min)
```bash
npm run build
```
✅ Creates production-ready files in `dist/` folder

### STEP 2: Test Locally (5 min)
```bash
npm run preview
```
- Opens: http://localhost:5000
- Test student form
- Test admin panel (type: `786786`)
- Press Ctrl+C when done

### STEP 3: Deploy to Windows Labs (5 min)

**Per Computer:**
1. Copy `scripts/kiosk-startup.bat` to USB drive
2. Paste on lab computer: `C:\kiosk-startup.bat`
3. Press Windows + R → Type: `shell:startup` → Press Enter
4. Right-click → New → Shortcut
5. Paste: `C:\kiosk-startup.bat`
6. Name: "Lab Kiosk Auto-Start"
7. Click Finish
8. Restart computer

**Result:** Kiosk auto-launches on power-on ✅

---

## 📋 BATCH FILE DETAILS

**File:** `scripts/kiosk-startup.bat`

**What it does:**
- Waits 5 seconds for Windows to load
- Launches Chrome in fullscreen
- Opens: https://if-8amo.onrender.com/
- Prevents student from accessing desktop

**Browser launched:** Google Chrome in fullscreen app mode
- No address bar
- No browser chrome
- Full kiosk experience

---

## 🚀 STUDENT WORKFLOW (Per Login)

```
1. Computer powers on
2. (5 second wait)
3. Batch file runs
4. Chrome launches fullscreen
5. Kiosk form appears
6. Student fills form:
   - Name: [from student list]
   - Registration: [student ID]
   - PC: Lab1-PC-01
   - Purpose: Research/Assignment
7. Checks declaration
8. Clicks "Submit Log & Unlock PC"
9. Clicks "Exit to Workstation"
10. Floating button appears in bottom-right
11. Student uses lab freely
12. When done: Clicks button → "End Session"
13. Session recorded in admin panel ✅
```

---

## 📊 ADMIN MONITORING

**From anywhere:**
1. Go to: https://if-8amo.onrender.com/
2. Type: `786786` (admin code)
3. View:
   - All student sessions
   - Time in/out
   - Quota usage
   - Student status
   - Logs and reports

---

## 🔒 OPTIONAL: SECURITY LOCKDOWN

**Prevent students from escaping:**

### Disable Alt+Tab (Registry)
1. Press Windows + R
2. Type: `regedit`
3. Navigate to:
   ```
   HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Policies\System
   ```
4. Right-click → New → DWORD (32-bit)
5. Name: `DisableAltTab`
6. Value: `1`
7. Restart

### Disable Windows Key (Registry)
1. Same location as above
2. Create DWORD: `DisableWindowsKey`
3. Value: `1`
4. Restart

### Hide Taskbar
1. Right-click taskbar
2. Taskbar settings
3. Toggle ON: "Automatically hide the taskbar"

---

## 📱 MULTI-DEVICE DEPLOYMENT

### For 5+ Lab Computers:

**Method 1: USB Distribution**
1. Copy batch file to USB
2. Insert on each computer
3. Copy to `C:\kiosk-startup.bat`
4. Add to startup (shell:startup)
5. Restart all

**Method 2: Network Distribution (IT Admin)**
1. Share batch file on network drive
2. Use Group Policy to deploy
3. All devices auto-configure
4. No manual setup needed

**Method 3: Batch Script Installer**
Create installer script:
```batch
@echo off
REM Automated kiosk deployment script
copy kiosk-startup.bat C:\
echo Kiosk installed. Please restart.
pause
```

---

## ✅ DEPLOYMENT CHECKLIST

### Before Deployment:
- [ ] Run `npm run build`
- [ ] Test with `npm run preview`
- [ ] Verify form works
- [ ] Verify admin panel works
- [ ] Check student quota system
- [ ] Check ban functionality

### On Each Lab Computer:
- [ ] Copy `C:\kiosk-startup.bat`
- [ ] Add to startup folder (shell:startup)
- [ ] Restart computer
- [ ] Verify kiosk launches
- [ ] Test student login
- [ ] Check admin logs

### Final Verification:
- [ ] All computers auto-launch
- [ ] Form submits correctly
- [ ] Sessions record in admin
- [ ] Admin can view all logs
- [ ] Ready for student use

---

## 🔧 TROUBLESHOOTING

### Kiosk doesn't auto-launch
**Check:**
- Batch file exists: `C:\kiosk-startup.bat`
- Startup shortcut created in `shell:startup`
- Computer restarted

**Fix:**
- Copy batch file again
- Create shortcut again
- Test batch file manually

### Chrome doesn't open fullscreen
**Check:**
- Chrome installed: C:\Program Files\Google\Chrome\
- URL is correct: https://if-8amo.onrender.com/
- Flags are present: --app --fullscreen

**Fix:**
- Update Chrome to latest version
- Verify path in batch file
- Run batch manually to test

### Student can escape fullscreen
**Check:**
- Alt+Tab disabled
- Windows key disabled
- Taskbar hidden

**Fix:**
- Enable all security settings
- Restart computer
- Test again

### Form not submitting
**Check:**
- Internet connection
- Student name in database
- Admin panel working

**Fix:**
- Add student to admin panel
- Refresh browser
- Check network connection

---

## 📞 SUPPORT REFERENCE

| Issue | Solution |
|-------|----------|
| Kiosk not launching | Check batch file path and startup folder |
| Chrome not fullscreen | Verify --fullscreen flag in batch |
| Can't access admin | Type `786786` on form page |
| Student can't find name | Add to admin panel first |
| Session not recorded | Check database connection |
| Quota not deducting | Check admin settings |

---

## 🎯 PRODUCTION SETUP COMPLETE

Your kiosk system is ready:
- ✅ Auto-launches on power-on
- ✅ Fullscreen locked mode
- ✅ Form validation
- ✅ Session tracking
- ✅ Admin monitoring
- ✅ Quota management
- ✅ Student bans
- ✅ Excel import

**Deploy to labs today!** 🚀

---

## 📁 PROJECT FILES

```
scripts/
├── kiosk-startup.bat          # Windows auto-startup script
├── BUILD_INSTRUCTIONS.md      # Build and test guide
└── WINDOWS_DEPLOYMENT_GUIDE.md # This file

dist/                           # Production files (after npm run build)
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
```

---

## 🚀 NEXT STEPS

1. **Build:** `npm run build`
2. **Test:** `npm run preview`
3. **Deploy:** Copy batch file to labs
4. **Monitor:** Use admin panel
5. **Done!** ✅

**Questions?** Check the documentation files in `scripts/` folder.
