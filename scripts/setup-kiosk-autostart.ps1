# Kiosk Auto-Start Setup Script
# This script sets up the Electron Kiosk to automatically launch on Windows startup

# Requires admin privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator!"
    exit 1
}

# Define paths
$kioskFolder = "C:\Program Files\SchoolExamKiosk"
$kioskExePath = "$kioskFolder\SchoolExamKiosk.exe"
$taskName = "Lab Kiosk Launcher"

Write-Host "=========================================="
Write-Host "Kiosk Auto-Start Setup"
Write-Host "=========================================="

# Step 1: Check if kiosk is built
if (-NOT (Test-Path $kioskExePath)) {
    Write-Host ""
    Write-Host "⚠️  WARNING: Kiosk executable not found at $kioskExePath"
    Write-Host ""
    Write-Host "You need to build the kiosk first:"
    Write-Host "  1. cd electron-kiosk"
    Write-Host "  2. npm install"
    Write-Host "  3. npm run package"
    Write-Host "  4. Copy 'SchoolExamKiosk-win32-x64' to C:\Program Files\"
    Write-Host ""
    $response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($response -ne "y") { exit 0 }
}

# Step 2: Create Task Scheduler entry
Write-Host ""
Write-Host "Setting up Task Scheduler for auto-start..."

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task '$taskName'..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create new task
$action = New-ScheduledTaskAction -Execute $kioskExePath
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserID "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force

Write-Host "✅ Task Scheduler entry created!"

# Step 3: Set up startup folder shortcut
Write-Host ""
Write-Host "Setting up startup folder shortcut..."

$startupFolder = "$env:PROGRAMDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$shortcutPath = "$startupFolder\Lab Kiosk.lnk"

# Create shortcut using COM object
$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $kioskExePath
$shortcut.WorkingDirectory = $kioskFolder
$shortcut.WindowStyle = 1  # Normal window
$shortcut.Save()

Write-Host "✅ Startup shortcut created at: $shortcutPath"

# Step 4: Summary
Write-Host ""
Write-Host "=========================================="
Write-Host "✅ Setup Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "The kiosk will now automatically launch on Windows startup."
Write-Host ""
Write-Host "To test:"
Write-Host "  1. Restart the computer"
Write-Host "  2. Kiosk should launch in full-screen kiosk mode"
Write-Host ""
Write-Host "To stop auto-launch:"
Write-Host "  1. Press WIN+R and type: taskschd.msc"
Write-Host "  2. Find and disable '$taskName'"
Write-Host ""
Write-Host "For troubleshooting, check Windows Event Viewer for errors."
Write-Host ""
