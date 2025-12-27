// STATE
let timeLeft = 10 * 60; // Default
let timerInterval;
let formSubmitted = false; // Track if form has been successfully submitted

// DOM ELEMENTS
const timerEl = document.getElementById('timer');
const timerText = document.getElementById('timerText');
const header = document.getElementById('header');
const mainCard = document.getElementById('mainCard');
const warningBox = document.getElementById('warningBox');
const submitBtn = document.getElementById('submitBtn');
const overlay = document.getElementById('overlay');
const form = document.getElementById('examForm');
const inputs = form.querySelectorAll('input');

// Admin Elements
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminDashboard = document.getElementById('adminDashboard');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const cancelLoginBtn = document.getElementById('cancelLoginBtn');
const logsTableBody = document.getElementById('logsTableBody');
const timeSettingInput = document.getElementById('timeSetting');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const appContainer = document.getElementById('appContainer');

// --- SECURITY: DISABLE ESCAPE KEY AT DOM LEVEL ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
  }
}, true); // Capture phase to intercept before other handlers

// --- INITIALIZATION ---

// Initialize time input
const timeInput = document.getElementById('time');
function updateTimeInput() {
    if (!form.submitted) {
        timeInput.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
}
updateTimeInput();
setInterval(updateTimeInput, 60000);

// Receive Config from Main Process
if (window.electronAPI) {
  window.electronAPI.onInitConfig((config) => {
    if (config.defaultTime) {
      startTimer(config.defaultTime * 60);
      timeSettingInput.value = config.defaultTime;
    }
  });

  window.electronAPI.onConfigUpdated((config) => {
    if (config.defaultTime) {
      // If timer is running, reset it with new time
      clearInterval(timerInterval);
      startTimer(config.defaultTime * 60);
      alert("Settings Updated! Timer reset.");
    }
  });
} else {
  // Fallback for browser testing
  startTimer(10 * 60);
}

// --- TIMER LOGIC ---
function startTimer(durationSeconds) {
  timeLeft = durationSeconds;
  updateTimerDisplay(); // Immediate update

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleShutdown("Time Expired");
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (timeLeft < 60) {
    // Urgent Mode
    timerEl.classList.add('urgent');
    header.classList.add('urgent');
    mainCard.classList.add('urgent');
    warningBox.classList.add('urgent');
    submitBtn.classList.add('urgent');
  } else {
    // Normal Mode (Reset styles if time increased)
    timerEl.classList.remove('urgent');
    header.classList.remove('urgent');
    mainCard.classList.remove('urgent');
    warningBox.classList.remove('urgent');
    submitBtn.classList.remove('urgent');
  }
}

// --- SHUTDOWN / UNLOCK HANDLER ---
function handleShutdown(reason) {
  if (reason === "Time Expired") {
    overlay.querySelector('h2').textContent = "TIME EXPIRED";
    overlay.querySelector('p').textContent = "Access Denied. System shutting down...";
    overlay.classList.add('visible', 'error-mode');
    if (window.electronAPI) setTimeout(() => window.electronAPI.shutdown(), 1500);
  } else {
    // Only unlock if form was successfully submitted
    if (!formSubmitted) {
      overlay.querySelector('h2').textContent = "ERROR";
      overlay.querySelector('p').textContent = "Please complete the form to unlock.";
      overlay.classList.add('visible', 'error-mode');
      setTimeout(() => {
        overlay.classList.remove('visible', 'error-mode');
      }, 2000);
      return;
    }
    
    overlay.querySelector('h2').textContent = "ACCESS GRANTED";
    overlay.querySelector('p').textContent = "Unlocking Workstation...";
    overlay.classList.add('visible', 'success-mode');
    if (window.electronAPI) setTimeout(() => window.electronAPI.unlock(), 2000);
  }
}

// --- FORM HANDLERS ---
function checkForm() {
  const allValid = Array.from(inputs).every(input => {
    if (input.type === 'checkbox') return input.checked;
    return input.value.trim() !== '';
  });
  submitBtn.disabled = !allValid;
}

inputs.forEach(input => {
  input.addEventListener('input', checkForm);
  input.addEventListener('change', checkForm);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate all fields one more time
  const allValid = Array.from(inputs).every(input => {
    if (input.type === 'checkbox') return input.checked;
    return input.value.trim() !== '';
  });

  if (!allValid) {
    alert('Please complete all fields before submitting.');
    return;
  }
  
  form.submitted = true;
  formSubmitted = true; // Mark as successfully submitted
  
  const data = {
    studentName: document.getElementById('studentName').value,
    registrationNumber: document.getElementById('registrationNumber').value,
    pcNumber: document.getElementById('pcNumber').value,
    time: document.getElementById('time').value,
    purpose: document.getElementById('purpose').value,
    timestamp: new Date().toISOString()
  };

  if (window.electronAPI) {
    try {
      const result = await window.electronAPI.submitForm(data);
      if (result.success) {
        handleShutdown("Success");
      } else {
        alert('Error saving data: ' + result.error);
        formSubmitted = false; // Reset if save failed
      }
    } catch (err) { 
      console.error(err); 
      alert('System Error'); 
      formSubmitted = false; // Reset if error
    }
  } else {
    console.log("Mock Submit:", data);
    handleShutdown("Success");
  }
});

// --- ADMIN LOGIC ---

// Open Login Modal
adminBtn.addEventListener('click', () => {
  adminModal.classList.add('visible');
  adminPasswordInput.value = '';
  adminPasswordInput.focus();
});

// Close Login Modal
cancelLoginBtn.addEventListener('click', () => {
  adminModal.classList.remove('visible');
});

// Perform Login
adminLoginBtn.addEventListener('click', async () => {
  if (adminPasswordInput.value.trim() === '786786') { // Updated admin password
    adminModal.classList.remove('visible');
    appContainer.style.display = 'none';
    adminDashboard.style.display = 'block';
    
    // Stop timer while in admin
    clearInterval(timerInterval);

    // Fetch Logs
    if (window.electronAPI) {
      const logs = await window.electronAPI.getLogs();
      renderLogs(logs);
    }
  } else {
    alert('Invalid Password');
  }
});

// Logout Admin
closeAdminBtn.addEventListener('click', () => {
  adminDashboard.style.display = 'none';
  appContainer.style.display = 'block';
  
  // Restart Timer based on current setting
  const mins = parseInt(timeSettingInput.value) || 10;
  startTimer(mins * 60);
});

// Save Settings
saveSettingsBtn.addEventListener('click', async () => {
  const newTime = parseInt(timeSettingInput.value);
  if (newTime > 0) {
    if (window.electronAPI) {
      await window.electronAPI.updateSettings({ defaultTime: newTime });
    } else {
      alert("Settings saved (Mock)");
      startTimer(newTime * 60);
    }
  } else {
    alert("Invalid time");
  }
});

function renderLogs(logs) {
  logsTableBody.innerHTML = '';
  if (logs.length === 0) {
    logsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No logs found</td></tr>';
    return;
  }
  
  // Reverse to show newest first
  logs.slice().reverse().forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.time || '-'}</td>
      <td>${log.studentName}</td>
      <td>${log.registrationNumber}</td>
      <td>${log.purpose}</td>
      <td>${log.pcNumber}</td>
    `;
    logsTableBody.appendChild(row);
  });
}
