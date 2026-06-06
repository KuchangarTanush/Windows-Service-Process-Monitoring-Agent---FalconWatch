import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Layers,
  Settings,
  FileText,
  PieChart,
  LogOut,
  Radio,
  Activity,
  ChevronRight
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: Activity, desc: 'SOC Overview' },
  { id: 'processes', name: 'Process Monitor', icon: Cpu, desc: 'Live process list' },
  { id: 'tree', name: 'Process Tree', icon: Layers, desc: 'Parent-child map' },
  { id: 'services', name: 'Service Audit', icon: Settings, desc: 'Windows services' },
  { id: 'alerts', name: 'Alert Center', icon: ShieldAlert, desc: 'Security incidents' },
  { id: 'analytics', name: 'Analytics', icon: PieChart, desc: 'Threat charts' },
  { id: 'reports', name: 'Reports', icon: FileText, desc: 'Audit & export' },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, activeAlertsCount }) {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div>
        <div className="sidebar-brand">
          <div className="flex items-center gap-3">
            <div className="sidebar-brand-logo">
              <Radio className="text-sky-400" size={18} />
            </div>
            <div>
              <h1 className="sidebar-brand-title">
                FalconWatch
              </h1>
              <p className="sidebar-brand-sub">
                EDR PLATFORM
              </p>
            </div>
          </div>

          {/* Divider line with glow */}
          <div className="sidebar-divider" />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="nav-item-icon">
                    <Icon
                      size={14}
                      className={isActive ? 'text-sky-400' : 'text-gray-500'}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="nav-item-label">
                      {item.name}
                    </p>
                    <p className="nav-item-desc">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.id === 'alerts' && activeAlertsCount > 0 && (
                    <span className="nav-badge">
                      {activeAlertsCount}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={12} className="text-sky-500/60" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          onClick={onLogout}
          className="sidebar-logout"
        >
          <div className="p-1.5 rounded-lg transition-colors">
            <LogOut size={14} />
          </div>
          <span>Exit Console</span>
        </button>
      </div>
    </aside>
  );
}
