# FalconWatch: Real-Time EDR Monitoring System

FalconWatch is an enterprise-grade endpoint security solution featuring a Python telemetry agent, a FastAPI SQLite-backed server, and a sleek glassmorphic React dashboard for Security Operations Centers (SOC).

## 🚀 Getting Started

To run and verify the EDR platform, follow these simple steps:

### 1. Install Dependencies
Open a Command Prompt or PowerShell in the root directory:
```cmd
pip install -r requirements.txt
```

### 2. Launch the Backend Server
Navigate to the root directory and start the FastAPI webserver:
```cmd
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
```
The REST APIs and WebSockets hub will run on `http://127.0.0.1:8001`.

### 3. Launch the Endpoint Telemetry Agent
In a separate terminal, launch the defensive monitoring agent:
```cmd
python agent/agent.py
```
This agent monitors active processes and Windows startup services every 5 seconds, streaming them in real time to the FastAPI server. It also accepts remediation commands (e.g. process termination) sent from the dashboard.

### 4. Build and Launch the React Dashboard
In a third terminal, navigate to the `frontend/` directory, install packages, and start the development server:
```cmd
cd frontend
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:3000` (or the port specified by Vite).

*   **Credentials**: Log in using Username: `admin` and Secret Key: `admin123`.

---

## ⚗️ Security Attack Simulator (Demo Mode)

FalconWatch includes a simulated attack environment to verify your EDR rules are executing correctly.

### Option A: From the Dashboard (Recommended)
1.  Log in to the SOC dashboard.
2.  Click the **"Run Security Test"** button in the top navigation bar.
3.  Observe the real-time websocket broadcast:
    *   🚨 A critical alert will trigger for **winword.exe spawning powershell.exe** (Office App Shell spawn heuristic).
    *   ⚠️ A warning alert will trigger for a **Suspicious File Drop** in the Public path.
    *   ⚙️ A persistence alert will trigger for a **New Startup Service (`DemoUpdateService`)**.
4.  Navigate to the **Analytics** or **Process Tree** tabs to view the threat ratios and parent-child tree mapping.

### Option B: Standalone Python Script
With the backend server running, execute the standalone simulator from the root directory:
```cmd
python security_test_simulator.py
```
This streams the threat triggers directly into the server database.

---

## 🛠️ Heuristic Detection Rules

Heuristics are loaded from `agent/rules.json`. The EDR server analyzes the following indicators:
1.  **Process Spawn Chains**: Flags any Office applications (`winword.exe`, `excel.exe`, etc.) spawning terminal shells (`cmd.exe`, `powershell.exe`, `mshta.exe`).
2.  **High-Risk Paths**: Identifies binaries executing from Temp directories or Public folders.
3.  **Blacklisted Process Names**: Triggers high alerts on names like `mimikatz.exe`, `psexec.exe`, `nc.exe`.
4.  **Rogue Startup Services**: Flags any new startup service compared to baseline logs.
