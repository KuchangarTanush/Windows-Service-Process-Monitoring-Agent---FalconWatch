import React, { useState, useEffect } from 'react';
import { FileDown, Printer, Shield, FileSpreadsheet, CheckCircle } from 'lucide-react';

export default function ReportGenerator({ stats, alerts }) {
  const [summary, setSummary] = useState({
    total_scans: 1,
    processes_checked: 0,
    services_analyzed: 0,
    threats_detected: 0,
    active_threats: 0
  });

  useEffect(() => {
    // Dynamic summary calculations based on state
    setSummary({
      total_scans: stats ? 1 : 0,
      processes_checked: stats?.total_processes || 0,
      services_analyzed: stats?.running_services || 0,
      threats_detected: alerts.length,
      active_threats: stats?.threats_found || 0
    });
  }, [stats, alerts]);

  // Trigger system print dialog
  const handlePrint = () => {
    window.print();
  };

  // CSV download helper using standard REST endpoint
  const handleDownloadCSV = () => {
    window.open('http://localhost:8001/api/reports/export-csv', '_blank');
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-6 w-full min-h-[300px]">
      {/* Header controls */}
      <div className="section-header" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 className="section-title">
            Reports & Auditing
          </h2>
          <p className="text-[10px] text-gray-500 font-mono mt-1">Generate compliance reports and export incidents databases.</p>
        </div>

        <div className="controls-row">
          {/* CSV export */}
          <button
            onClick={handleDownloadCSV}
            className="btn btn-primary"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>

          {/* Printer trigger */}
          <button
            onClick={handlePrint}
            className="btn btn-ghost"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Grid summary */}
      <div className="stat-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px' }}>
          <span className="stat-label">Total Scans Run</span>
          <span className="stat-value" style={{ marginTop: '8px', fontSize: '24px' }}>{summary.total_scans}</span>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px' }}>
          <span className="stat-label">Processes Audited</span>
          <span className="stat-value" style={{ marginTop: '8px', fontSize: '24px' }}>{summary.processes_checked}</span>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px' }}>
          <span className="stat-label">Active Services Checked</span>
          <span className="stat-value" style={{ marginTop: '8px', fontSize: '24px' }}>{summary.services_analyzed}</span>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px' }}>
          <span className="stat-label">Incidents Detected</span>
          <span className="stat-value" style={{ marginTop: '8px', fontSize: '24px', color: 'var(--red)' }}>{summary.threats_detected}</span>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px' }}>
          <span className="stat-label">Active Threats Unresolved</span>
          <span className="stat-value" style={{ marginTop: '8px', fontSize: '24px', color: summary.active_threats > 0 ? 'var(--red)' : 'var(--green)' }}>
            {summary.active_threats}
          </span>
        </div>
      </div>

      {/* Styled Printable Section */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0, 0, 0, 0.2)' }}>
        <div className="flex items-center gap-3">
          <Shield className="text-sky-400" size={24} />
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest">FalconWatch EDR Compliance Audit</h3>
            <p className="text-[9px] text-gray-500 font-mono">Generated on: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="divider" />

        <div className="text-xs font-mono leading-relaxed text-gray-300" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p>This report documents the security posture of the endpoint monitored by FalconWatch EDR agent.</p>
          <p>
            During the audit, <strong>{summary.processes_checked}</strong> processes were scanned for suspicious parent-child trees and blacklisted processes. 
            A total of <strong>{summary.services_analyzed}</strong> Windows system services were audited for registry path integrity.
          </p>
          <p>
            Status assessment: {summary.active_threats > 0 ? (
              <span className="badge badge-critical" style={{ fontSize: '10px', padding: '4px 8px', marginTop: '4px' }}>WARNING: {summary.active_threats} active unresolved threat indicators found. Remediation required.</span>
            ) : (
              <span className="badge badge-low" style={{ fontSize: '10px', padding: '4px 8px', marginTop: '4px' }}>COMPLIANT: No active threats found. Endpoint is secure.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
