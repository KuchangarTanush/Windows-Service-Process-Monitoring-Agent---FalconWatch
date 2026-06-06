import React, { useState, useEffect, useRef } from 'react';
import { Shield, ShieldAlert, Key, User, Activity, CheckCircle, HelpCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ThreatCard from './components/ThreatCard';
import ProcessTable from './components/ProcessTable';
import ProcessTree from './components/ProcessTree';
import ServiceTable from './components/ServiceTable';
import AlertPanel from './components/AlertPanel';
import ChartCards from './components/ChartCards';
import ReportGenerator from './components/ReportGenerator';

export default function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real-time Telemetry State
  const [agentStatus, setAgentStatus] = useState('Disconnected');
  const [lastEventTime, setLastEventTime] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total_processes: 0,
    running_services: 0,
    threats_found: 0,
    risk_score: 0
  });

  // Simulator State
  const [isSimulating, setIsSimulating] = useState(false);

  // WebSocket reference
  const wsRef = useRef(null);

  // 1. WebSocket connection management
  useEffect(() => {
    if (!token) return;

    const connectWebSocket = () => {
      console.log("Connecting to FalconWatch client WebSocket...");
      const BACKEND_WS_URL = "ws://127.0.0.1:8001/ws/client";
      const ws = new WebSocket(BACKEND_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket client connection opened.");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setAgentStatus(data.agent_status || 'Disconnected');
          setLastEventTime(data.last_event_time);
          setProcesses(data.processes || []);
          setServices(data.services || []);
          setAlerts(data.alerts || []);
          setStats(data.stats || {
            total_processes: 0,
            running_services: 0,
            threats_found: 0,
            risk_score: 0
          });
        } catch (err) {
          console.error("Error parsing WebSocket packet:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket client connection closed. Reconnecting in 3s...");
        setAgentStatus('Disconnected');
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket client connection error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  // 2. Authentication routines
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('http://localhost:8001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setLoginError(data.detail || 'Authentication failed.');
      }
    } catch (err) {
      setLoginError('EDR Backend is currently offline.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setProcesses([]);
    setServices([]);
    setAlerts([]);
    setStats({ total_processes: 0, running_services: 0, threats_found: 0, risk_score: 0 });
  };

  // 3. Actions / Remediation callbacks
  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`http://localhost:8001/api/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error("Failed to acknowledge incident.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTerminateProcess = async (pid) => {
    const res = await fetch(`http://localhost:8001/api/processes/${pid}/terminate`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Failed to terminate process.");
    }
    return data;
  };

  const handleRunSecurityTest = async () => {
    setIsSimulating(true);
    try {
      // 1. Process chain simulation
      await fetch('http://localhost:8001/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "process_detection",
          parent: "winword.exe",
          child: "powershell.exe",
          severity: "HIGH"
        })
      });
      await new Promise(r => setTimeout(r, 1000));

      // 2. File drop simulation
      await fetch('http://localhost:8001/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "file_detection",
          filename: "security_test_sample.txt",
          path: "C:\\Users\\Public\\Test\\",
          severity: "MEDIUM"
        })
      });
      await new Promise(r => setTimeout(r, 1000));

      // 3. Persistence registry simulation
      await fetch('http://localhost:8001/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "persistence_detection",
          service: "DemoUpdateService",
          path: "C:\\Demo\\TestService.exe",
          severity: "HIGH"
        })
      });
      
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearAlerts = async () => {
    if (window.confirm("Clear all processes, services, and alerts logs from EDR database?")) {
      try {
        await fetch('http://localhost:8001/api/clear-db', { method: 'POST' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 4. Render login page
  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="login-card fade-up">
          <div className="flex flex-col items-center">
            <div className="login-logo-ring">
              <Shield className="text-sky-400" size={32} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white uppercase mt-2">FalconWatch EDR</h2>
            <p className="text-[9px] font-mono tracking-widest text-sky-400 uppercase mt-1">Endpoint Monitoring Console</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-6">
            {/* Username */}
            <div className="flex flex-col">
              <label className="login-form-label">Username</label>
              <div className="relative">
                <User size={14} className="input-icon-left" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field search-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col">
              <label className="login-form-label">Secret Key</label>
              <div className="relative">
                <Key size={14} className="input-icon-left" />
                <input
                  type="password"
                  required
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field search-input"
                />
              </div>
            </div>

            {loginError && (
              <div className="login-error mt-2">
                ⚠️ {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full justify-center mt-4">
              Sign In
            </button>
          </form>

          <div className="divider mt-6 mb-4"></div>
          
          <div className="text-[10px] text-gray-500 text-center font-mono select-none">
            Demo Credentials: <span className="text-gray-300">admin</span> / <span className="text-gray-300">admin123</span>
          </div>
        </div>
      </div>
    );
  }

  // Active alarms (Active Alerts)
  const activeAlerts = alerts.filter(a => a.status.toLowerCase() === 'active');

  // 5. Render EDR main dashboard layout
  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        activeAlertsCount={activeAlerts.length}
      />

      {/* Main Panel Content Area */}
      <div className="main-content">
        {/* Top Header Navbar */}
        <Navbar 
          agentStatus={agentStatus}
          lastEventTime={lastEventTime}
          onRunTest={handleRunSecurityTest}
          isSimulating={isSimulating}
        />

        {/* View Router */}
        <main className="content-area scroller">
          {activeTab === 'dashboard' && (
            <>
              {/* Telemetry Widgets */}
              <ThreatCard stats={stats} />
              
              <div className="dashboard-grid">
                {/* Real-time incident logs */}
                <div className="flex flex-col min-h-[400px] min-w-0">
                  <AlertPanel alerts={alerts} onResolveAlert={handleResolveAlert} />
                </div>
                
                {/* Info section & Quick instructions */}
                <div className="flex flex-col gap-5">
                  {/* System Health */}
                  <div className="glass-panel p-5 flex flex-col justify-between" style={{ minHeight: '180px' }}>
                    <div>
                      <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">EDR Agent Settings</h3>
                      <p className="text-xs text-gray-400 leading-relaxed font-mono">
                        The Windows endpoint daemon gathers thread logs every 5s and transmits payloads over secured WebSockets.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="info-row">
                        <span className="info-row-label">Service Baseline:</span>
                        <span className="info-row-value" style={{ color: '#10b981' }}>Enabled</span>
                      </div>
                      <div className="info-row">
                        <span className="info-row-label">Incident Auto-Archive:</span>
                        <span className="info-row-value" style={{ color: '#6366f1' }}>Enabled</span>
                      </div>
                      <div className="info-row">
                        <span className="info-row-label">Local DB Storage:</span>
                        <span className="info-row-value" style={{ color: '#38bdf8' }}>SQLite Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Logs button */}
                  <div className="glass-panel p-5 flex flex-col justify-between items-start" style={{ minHeight: '160px' }}>
                    <div>
                      <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Incident Archiving</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Flush all logged processes, services snapshots, and fired alerts from the SQLite database.
                      </p>
                    </div>
                    <button
                      onClick={handleClearAlerts}
                      className="btn btn-danger mt-4"
                    >
                      Clear Database logs
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'processes' && (
            <ProcessTable 
              processes={processes} 
              onTerminateProcess={handleTerminateProcess} 
            />
          )}

          {activeTab === 'tree' && (
            <ProcessTree processes={processes} />
          )}

          {activeTab === 'services' && (
            <ServiceTable services={services} />
          )}

          {activeTab === 'alerts' && (
            <AlertPanel alerts={alerts} onResolveAlert={handleResolveAlert} />
          )}

          {activeTab === 'analytics' && (
            <ChartCards processes={processes} alerts={alerts} />
          )}

          {activeTab === 'reports' && (
            <ReportGenerator stats={stats} alerts={alerts} />
          )}
        </main>
      </div>
    </div>
  );
}
