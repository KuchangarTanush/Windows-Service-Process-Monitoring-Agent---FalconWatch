import React, { useState } from 'react';
import { Search, ShieldAlert, Layers } from 'lucide-react';

export default function ServiceTable({ services }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('service_name');
  const [sortAsc, setSortAsc] = useState(true);

  // Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtering
  const filteredServices = services.filter(s => {
    const nameMatch = s.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    const pathMatch = s.path && s.path.toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = nameMatch || pathMatch;

    const statusMatch = statusFilter === 'ALL' || s.status.toUpperCase() === statusFilter.toUpperCase();

    return searchMatch && statusMatch;
  });

  // Sort logic
  const sortedServices = [...filteredServices].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const getRiskColorClass = (level) => {
    const lvl = level ? level.toUpperCase() : "LOW";
    if (lvl === "HIGH" || lvl === "CRITICAL") return "badge-critical";
    if (lvl === "MEDIUM") return "badge-medium";
    return "badge-low";
  };

  return (
    <div className="glass-panel flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header controls */}
      <div className="section-header">
        <h2 className="section-title">
          <Layers size={15} className="text-sky-400" />
          Service Registry Audit
        </h2>

        <div className="controls-row">
          {/* Search Box */}
          <div className="search-wrapper">
            <Search size={14} className="input-icon-left" />
            <input
              type="text"
              placeholder="Search name, path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field search-input"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '11px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="RUNNING">Running</option>
            <option value="STOPPED">Stopped</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      <div className="flex-1 overflow-auto scroller">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('service_name')}>Service Name {sortField === 'service_name' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('status')}>Status {sortField === 'status' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('startup_type')}>Startup Type {sortField === 'startup_type' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('path')}>Binary Executable Path {sortField === 'path' && (sortAsc ? ' ▲' : ' ▼')}</th>
              <th onClick={() => handleSort('risk_level')}>Risk Level {sortField === 'risk_level' && (sortAsc ? ' ▲' : ' ▼')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedServices.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No registered services found matching queries.
                </td>
              </tr>
            ) : (
              sortedServices.map((s) => {
                const isSuspicious = s.risk_level.toUpperCase() === 'HIGH' || s.risk_level.toUpperCase() === 'CRITICAL';
                return (
                  <tr 
                    key={s.service_name} 
                    className={isSuspicious ? 'row-danger' : ''}
                  >
                    <td className="px-5 py-3 font-semibold text-gray-200" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none' }}>
                      {isSuspicious ? (
                        <ShieldAlert size={14} className="text-red-400 shrink-0" />
                      ) : (
                        <Layers size={13} className="text-gray-500 shrink-0" />
                      )}
                      <span>{s.service_name}</span>
                    </td>
                    <td>
                      <span className={`badge ${s.status.toLowerCase() === 'running' ? 'badge-online' : 'badge-offline'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="font-mono text-gray-400">{s.startup_type || 'N/A'}</td>
                    <td className="font-mono text-gray-500 truncate max-w-md" title={s.path}>{s.path || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getRiskColorClass(s.risk_level)}`}>
                        {s.risk_level}
                      </span>
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
