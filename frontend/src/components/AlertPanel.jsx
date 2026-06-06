import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Clock, Search } from 'lucide-react';

export default function AlertPanel({ alerts, onResolveAlert }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('Active'); // Default show Active

  const filteredAlerts = alerts.filter(a => {
    const textMatch = a.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const severityMatch = severityFilter === 'ALL' || a.severity.toUpperCase() === severityFilter.toUpperCase();
    const statusMatch = statusFilter === 'ALL' || a.status.toLowerCase() === statusFilter.toLowerCase();

    return textMatch && severityMatch && statusMatch;
  });

  const getSeverityStyle = (severity) => {
    const sev = severity.toUpperCase();
    if (sev === 'CRITICAL') return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/5', led: 'bg-red-500 pulse-led-red' };
    if (sev === 'HIGH') return { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/5', led: 'bg-orange-500' };
    if (sev === 'MEDIUM') return { text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', led: 'bg-yellow-500' };
    return { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/5', led: 'bg-blue-500' };
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="glass-panel flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Filters Header */}
      <div className="section-header">
        <h2 className="section-title">
          <ShieldAlert className="text-red-400" size={15} />
          Security Incident Feed
        </h2>
        <span className="text-[10px] text-gray-500 font-mono">
          {filteredAlerts.length} alarm{filteredAlerts.length !== 1 ? 's' : ''} displayed
        </span>
      </div>

      <div className="p-4 border-b border-gray-800/80">
        {/* Control row */}
        <div className="controls-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', width: '100%' }}>
          {/* Search */}
          <div className="search-wrapper" style={{ maxWidth: 'none' }}>
            <Search className="input-icon-left" size={14} />
            <input
              type="text"
              placeholder="Search alert logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field search-input"
            />
          </div>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input-field"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="Active">Active Threats</option>
            <option value="Resolved">Resolved Cases</option>
            <option value="ALL">All Events</option>
          </select>
        </div>
      </div>

      {/* Alerts Scroll List */}
      <div className="flex-1 p-4 overflow-auto scroller" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            No active threat alerts in this category. System is secure.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const styles = getSeverityStyle(alert.severity);
            const isResolved = alert.status.toLowerCase() === 'resolved';
            const sev = alert.severity.toLowerCase();

            let rowClass = `alert-row ${sev}`;
            if (isResolved) rowClass = "alert-row resolved";

            return (
              <div 
                key={alert.id}
                className={rowClass}
              >
                {/* Details */}
                <div className="space-y-1" style={{ flex: '1', minWidth: '0' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={styles.led}></span>
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', margin: 0 }}>
                      {alert.alert_type}
                    </h4>
                    <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-mono font-medium leading-relaxed" style={{ marginTop: '4px' }}>
                    {alert.description}
                  </p>
                </div>

                {/* Resolve Action */}
                {!isResolved && (
                  <button
                    onClick={() => onResolveAlert(alert.id)}
                    className="btn btn-success"
                    style={{ padding: '4px 10px', fontSize: '10px' }}
                  >
                    <CheckCircle size={13} />
                    <span>Acknowledge</span>
                  </button>
                )}
                {isResolved && (
                  <span className="badge badge-low" style={{ fontSize: '9px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={11} />
                    Resolved
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
