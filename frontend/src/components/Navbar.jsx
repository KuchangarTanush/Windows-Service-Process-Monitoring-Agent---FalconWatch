import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Clock, Wifi, WifiOff, Zap } from 'lucide-react';

export default function Navbar({ agentStatus, lastEventTime, onRunTest, isSimulating }) {
  const isConnected = agentStatus === "Connected";
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getHeartbeatText = () => {
    if (!lastEventTime) return "Awaiting telemetry...";
    const lastTime = new Date(lastEventTime);
    const now = new Date();
    const diffSec = Math.floor((now - lastTime) / 1000);
    if (diffSec < 5) return "< 5s ago";
    if (diffSec < 60) return `${diffSec}s ago`;
    return `${Math.floor(diffSec / 60)}m ago`;
  };

  const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="topbar">
      {/* Left: Title */}
      <div className="topbar-brand">
        <Shield className="text-sky-400" size={18} strokeWidth={2.5} />
        <div>
          <span className="topbar-title">
            SOC Operations Center
          </span>
          <div className="topbar-subtitle">
            <Clock size={9} />
            <span>{dateStr} · {timeStr}</span>
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="topbar-actions">

        {/* Last Telemetry */}
        {isConnected && (
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-gray-900/40 border border-gray-800/60 rounded-lg px-3 py-1.5">
            <Zap size={10} className="text-sky-500" />
            <span>Last ping: <span className="text-gray-300">{getHeartbeatText()}</span></span>
          </div>
        )}

        {/* Security Test Button */}
        <button
          onClick={onRunTest}
          disabled={isSimulating}
          className={isSimulating ? "btn btn-ghost text-amber-400" : "btn btn-danger"}
        >
          <Terminal size={12} />
          {isSimulating ? 'Running...' : 'Run Security Test'}
        </button>

        {/* Agent Status LED */}
        <div className={`status-pill ${isConnected ? 'online' : 'offline'}`}>
          {isConnected
            ? <Wifi size={12} className="shrink-0" />
            : <WifiOff size={12} className="shrink-0" />
          }
          <span className={isConnected ? 'led-green' : 'led-red'} />
          <span>{isConnected ? 'AGENT ONLINE' : 'AGENT OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
}
