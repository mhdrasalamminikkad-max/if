# Complete Lab Kiosk Deployment Guide - Start to End

## What You're Building
A locked student kiosk that:
- Opens automatically when lab PC powers on
- Students fill out entry form to unlock PC
- Date filters for admin reports
- Admins access admin panel by typing `786786`

---

## **STEP 1: Build the Kiosk Application (.exe file)**

### Using VS Code (Developer Machine):

1. **Open the project in VS Code**
   - Open VS Code
   - Click **File → Open Folder**
   - Select your project folder

2. **Open VS Code Terminal**
   - Press `Ctrl + Backtick` (`` ` `` - key below Esc)
   - OR click **Terminal → New Terminal** at top menu
   - Terminal appears at bottom of VS Code

3. **Navigate to electron-kiosk folder**
   - In terminal, type:
   ```
   cd electron-kiosk
   ```
   - Press Enter

4. **Install dependencies**
   - Type in terminal:
   ```
   npm install
   ```
   - Press Enter
   - Wait for it to finish (may take 2-5 minutes)
   - You'll see "added X packages" when done

5. **Build the .exe file**
   - Type in terminal:
   ```
   npm run package
   ```
   - Press Enter
   - Wait for it to finish (may take 3-5 minutes)
   - You'll see message when done

6. **Find your .exe file**
   - Your built folder is at:
   ```
   C:\Users\mhdra\OneDrive\Documents\if\electron-kiosk\SchoolExamKiosk-win32-x64
   ```
   - Inside this folder is: `SchoolExamKiosk.exe`
   - This is your final product!

---

## **STEP 2: Copy to Lab PC**

### On Each Lab Computer:

1. **On your computer**, find the built folder:
   ```
   C:\Users\mhdra\OneDrive\Documents\if\electron-kiosk\SchoolExamKiosk-win32-x64
   ```

2. **Copy this entire `SchoolExamKiosk-win32-x64` folder**

3. **On each lab PC, create a folder:**
   - Right-click on Desktop → New → Folder
   - Name it: `SchoolExamKiosk`

4. **Paste the `SchoolExamKiosk-win32-x64` folder** into `C:\SchoolExamKiosk\`

   **Result should look like:**
   ```
   C:\SchoolExamKiosk\SchoolExamKiosk-win32-x64\SchoolExamKiosk.exe
   ```

---

## **STEP 3: Make it Auto-Start on Power-On**

### On Each Lab Computer:

1. **Press Windows Key + R** on keyboard
2. **Type:** `shell:startup` (exactly)
3. **Press Enter**
   - A folder opens (Windows Startup folder)

4. **Create shortcut to .exe file:**
   - Right-click in empty space → **New** → **Shortcut**
   - Paste this path:
     ```
     C:\SchoolExamKiosk\SchoolExamKiosk-win32-x64\SchoolExamKiosk.exe
     ```
   - Click **Next**
   - Name it: `Lab Exam Kiosk`
   - Click **Finish**

5. **Test it:**
   - Restart the lab PC
   - **The kiosk app should open automatically!**

---

## **STEP 4: How Students Use It**

When kiosk opens:

1. **Student sees form** with fields:
   - Student Name
   - Registration Number
   - PC Number
   - Time In (auto-filled)
   - Purpose (Research/Exam/Assignment)
   - Confirmation checkbox

2. **Student fills ALL fields** and checks confirmation box

3. **Student clicks "Submit Log & Unlock PC"**

4. **PC unlocks and student can use it**

**IMPORTANT:** Student CANNOT exit or close the app without submitting the form!

---

## **STEP 5: Admin Access (For Lab Staff)**

### How to Access Admin Dashboard:

**Method 1: On Same Kiosk PC**
1. While student form is showing
2. **Type on keyboard:** `786786`
3. Admin panel opens with all features:
   - Students management
   - Lab entry logs with **DATE FILTERS**
   - Banned students with **DATE FILTERS**
   - Overused students with **DATE FILTERS**
   - Summary report with **DATE FILTERS**
4. Use date filters to view:
   - Today's logs
   - This week's data
   - This month's data
   - Custom date ranges
5. Click **Logout** to return to student form

**Method 2: Separate Admin PC**
1. On any computer with internet
2. Open web browser
3. Go to your Replit project URL (given to you separately)
4. Login with password: `786786`
5. Access full admin dashboard with all features

---

## **STEP 6: What You Can Do in Admin Panel**

### **Students Tab**
- See all registered students
- Ban/Unban students
- Edit monthly quota
- Add new students
- Delete students

### **Log Times Tab** (with DATE FILTERS)
- View all lab entry records
- Filter by: Today, This Week, This Month, Custom dates
- See who entered, when, and how long they stayed

### **Banned Tab** (with DATE FILTERS)
- View all banned students
- Filter by: Today, This Week, This Month, Custom dates
- Unban students if needed

### **Overused Tab** (with DATE FILTERS)
- See students who exceeded quota
- Filter by: Today, This Week, This Month
- Ban overused students if needed

### **Summary Tab** (with DATE FILTERS)
- Complete report of all students
- Filter by: All Students, Active Today, Active This Week, Active This Month
- Download as PDF or Image

### **Bulk Import Tab**
- Upload Excel file with student data
- Auto-populate student database

---

## **QUICK REFERENCE**

| Feature | How to Access |
|---------|---------------|
| **Student Kiosk** | Auto-starts when PC powers on |
| **Admin Panel** | Type `786786` on kiosk OR visit Replit URL |
| **Date Filters** | In Admin panel → Log Times, Banned, Overused, Summary tabs |
| **Exit Kiosk** | Student must submit form to unlock PC |
| **Admin Logout** | Click "Logout" button in admin panel |

---

## **TROUBLESHOOTING**

**Problem:** Kiosk doesn't start on power-on
- **Solution:** Check if shortcut is in `shell:startup` folder correctly

**Problem:** Can't access admin with 786786
- **Solution:** Make sure you're typing it on the kiosk form screen

**Problem:** Date filters not working
- **Solution:** Make sure app is latest version (check browser cache)

**Problem:** Students can minimize or close app
- **Solution:** Kiosk mode should prevent this - restart PC

---

## **FINAL CHECKLIST**

Before opening lab to students:

- [ ] Built .exe file successfully (npm run package)
- [ ] Copied folder to each lab PC
- [ ] Created shortcut in shell:startup on each PC
- [ ] Tested auto-start (restarted PC)
- [ ] Tested student form submission
- [ ] Tested admin access (type 786786)
- [ ] Tested date filters in admin panel
- [ ] Tested that students can't close app
- [ ] Trained staff on admin panel

---

## **SUPPORT**

If something doesn't work:
1. Check the troubleshooting section above
2. Restart the lab PC
3. Make sure you copied the entire SchoolExamKiosk-win32-x64 folder

**You're ready to deploy!** 🎉
