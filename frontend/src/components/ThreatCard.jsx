import React from 'react';
import { Cpu, ShieldAlert, Layers, ShieldCheck, TrendingUp, Activity } from 'lucide-react';

export default function ThreatCard({ stats }) {
  const { total_processes = 0, running_services = 0, threats_found = 0, risk_score = 0 } = stats || {};

  const getRiskDetails = (score) => {
    if (score === 0)  return { label: 'Secure', color: '#10b981', glow: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' };
    if (score < 30)   return { label: 'Low Risk', color: '#38bdf8', glow: 'rgba(56,189,248,0.25)', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)' };
    if (score < 60)   return { label: 'Medium Risk', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' };
    if (score < 85)   return { label: 'High Danger', color: '#f97316', glow: 'rgba(249,115,22,0.25)', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' };
    return { label: 'Critical Breach', color: '#ef4444', glow: 'rgba(239,68,68,0.35)', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' };
  };

  const risk = getRiskDetails(risk_score);

  const cards = [
    {
      label: 'Total Processes',
      value: total_processes,
      icon: Cpu,
      iconColor: '#60a5fa',
      glowColor: 'rgba(96,165,250,0.15)',
      borderColor: 'rgba(96,165,250,0.15)',
      bgColor: 'rgba(96,165,250,0.08)',
    },
    {
      label: 'Running Services',
      value: running_services,
      icon: Layers,
      iconColor: '#818cf8',
      glowColor: 'rgba(129,140,248,0.15)',
      borderColor: 'rgba(129,140,248,0.15)',
      bgColor: 'rgba(129,140,248,0.08)',
    },
    {
      label: 'Active Threats',
      value: threats_found,
      icon: threats_found > 0 ? ShieldAlert : ShieldCheck,
      iconColor: threats_found > 0 ? '#f87171' : '#34d399',
      glowColor: threats_found > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.15)',
      borderColor: threats_found > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.15)',
      bgColor: threats_found > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(52,211,153,0.06)',
      valueColor: threats_found > 0 ? '#f87171' : '#34d399',
      pulse: threats_found > 0,
    },
  ];

  return (
    <div className="stat-cards-grid w-full shrink-0">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="stat-card fade-up"
            style={{ borderColor: card.borderColor }}
          >
            <div>
              <p className="stat-label">
                {card.label}
              </p>
              <h3
                className="stat-value"
                style={{ color: card.valueColor || 'var(--text-primary)' }}
              >
                {card.value}
              </h3>
            </div>
            <div
              className="stat-card-icon"
              style={{
                background: card.bgColor,
                borderColor: card.borderColor,
                boxShadow: `0 0 14px ${card.glowColor}`,
                color: card.iconColor
              }}
            >
              <Icon
                size={20}
                className={card.pulse ? 'animate-pulse' : ''}
              />
            </div>
          </div>
        );
      })}

      {/* Risk Score Card */}
      <div
        className="stat-card fade-up"
        style={{
          borderColor: risk.border,
          boxShadow: `0 0 16px ${risk.glow}, var(--shadow-panel)`,
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity size={13} style={{ color: risk.color }} />
            <p className="stat-label" style={{ margin: 0 }}>Threat Risk Score</p>
          </div>
          <span
            className="badge font-mono"
            style={{
              background: risk.bg,
              color: risk.color,
              borderColor: risk.border,
              fontSize: '9px',
              padding: '1px 6px'
            }}
          >
            {risk.label}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <h3 className="stat-value" style={{ color: risk.color }}>{risk_score}</h3>
          <span className="text-[10px] text-gray-500 font-mono">/100</span>
        </div>

        {/* Segmented progress bar */}
        <div className="risk-bar-track">
          {Array.from({ length: 20 }).map((_, i) => {
            const threshold = (i + 1) * 5;
            const filled = risk_score >= threshold;
            return (
              <div
                key={i}
                className="risk-bar-segment"
                style={{
                  background: filled
                    ? risk_score < 30
                      ? 'var(--green)'
                      : risk_score < 60
                      ? 'var(--amber)'
                      : 'var(--red)'
                    : 'rgba(255,255,255,0.04)',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
