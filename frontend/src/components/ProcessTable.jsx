import React, { useState } from 'react';
import { Search, AlertTriangle, Play, Trash2, ShieldAlert } from 'lucide-react';

export default function ProcessTable({ processes, onTerminateProcess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortField, setSortField] = useState('process_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [terminatingPids, setTerminatingPids] = useState({});

  // Terminate process handler with confirmation
  const handleTerminate = async (pid, name) => {
    if (window.confirm(`Are you sure you want to terminate process '${name}' (PID: ${pid})?`)) {
      setTerminatingPids(prev => ({ ...prev, [pid]: true }));
      try {
        await onTerminateProcess(pid);
      } catch (err) {
        alert(`Failed to terminate process: ${err.message}`);
      } finally {
        // Clear loading state after delay
        setTimeout(() => {
          setTerminatingPids(prev => {
            const next = { ...prev };
            delete next[pid];
            return next;
          });
        }, 1500);
      }
    }
  };

  // Sort helper
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter & Search
  const filteredProcesses = processes.filter(p => {
    const nameMatch = p.process_name.toLowerCase().includes(searchTerm.toLowerCase());
    const pathMatch = p.path && p.path.toLowerCase().includes(searchTerm.toLowerCase());
    const userMatch = p.user && p.user.toLowerCase().includes(searchTerm.toLowerCase());
    const pidMatch = p.pid.toString().includes(searchTerm);
    const searchMatch = nameMatch || pathMatch || userMatch || pidMatch;

    const riskMatch = riskFilter === 'ALL' || p.risk_level.toUpperCase() === riskFilter.toUpperCase();

    return searchMatch && riskMatch;
  });

  // Sorting logic
  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const getRiskBadgeClass = (level) => {
    const lvl = level ? level.toUpperCase() : "LOW";
    if (lvl === "CRITICAL") return "badge-critical";
    if (lvl === "HIGH") return "badge-high";
    if (lvl === "MEDIUM") return "badge-medium";
    return "badge-low";
  };

  return (
    <div className="glass-panel flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header Controls */}
      <div className="section-header">
        <h2 className="section-title">
          <AlertTriangle size={15} className="text-sky-400" />
          Process Logs
        </h2>

        <div className="controls-row">
          {/* Search Box */}
          <div className="search-wrapper">
            <Search size={14} className="input-icon-left" />
            <input
              type="text"
              placeholder="Search name, PID, path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field search-input"
            />
          </div>

          {/* Severity Filters */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '11px' }}
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto scroller">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('process_name')}>Process Name {sortField === 'process_name' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('pid')}>PID {sortField === 'pid' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('parent_name')}>Parent Process {sortField === 'parent_name' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('parent_pid')}>Parent PID {sortField === 'parent_pid' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('path')}>Path {sortField === 'path' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('user')}>User {sortField === 'user' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('risk_level')}>Risk {sortField === 'risk_level' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th className="text-center" style={{ cursor: 'default' }}>Remediation</th>
            </tr>
          </thead>
          <tbody>
            {sortedProcesses.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No active processes found matching search parameters.
                </td>
              </tr>
            ) : (
              sortedProcesses.map((p) => {
                const isCritical = p.risk_level.toUpperCase() === "CRITICAL";
                const isHigh = p.risk_level.toUpperCase() === "HIGH";
                const isMedium = p.risk_level.toUpperCase() === "MEDIUM";
                
                let rowClass = "";
                if (isCritical) rowClass = "row-danger";
                else if (isHigh) rowClass = "row-warning";
                else if (isMedium) rowClass = "row-warning";

                return (
                  <tr 
                    key={p.pid} 
                    className={rowClass}
                  >
                    <td className="px-5 py-3 font-semibold text-gray-200" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none' }}>
                      {(isCritical || isHigh) && <ShieldAlert size={13} className="text-red-400 shrink-0" />}
                      <span>{p.process_name}</span>
                    </td>
                    <td className="font-mono text-gray-400">{p.pid}</td>
                    <td>{p.parent_name || 'N/A'}</td>
                    <td className="font-mono text-gray-500">{p.parent_pid || 'N/A'}</td>
                    <td className="font-mono text-gray-500 truncate max-w-xs" title={p.path}>{p.path || 'N/A'}</td>
                    <td className="font-mono text-gray-400">{p.user || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getRiskBadgeClass(p.risk_level)}`}>
                        {p.risk_level}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleTerminate(p.pid, p.process_name)}
                        disabled={terminatingPids[p.pid]}
                        className="btn btn-danger"
                        style={{ padding: '3px 8px', fontSize: '10px', textTransform: 'none' }}
                      >
                        <Trash2 size={11} />
                        {terminatingPids[p.pid] ? 'Killing...' : 'Terminate'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
