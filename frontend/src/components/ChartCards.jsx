import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

export default function ChartCards({ processes, alerts }) {
  
  // 1. Safe vs Suspicious Processes count
  const suspiciousCount = processes.filter(p => p.risk_level.toUpperCase() !== 'LOW').length;
  const safeCount = processes.length - suspiciousCount;
  
  const processData = [
    { name: 'Safe Processes', value: safeCount, color: '#10b981' },
    { name: 'Suspicious Processes', value: suspiciousCount, color: '#ef4444' }
  ];

  // 2. Threat Severity Count (Active Alerts)
  const severities = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  alerts.forEach(a => {
    const sev = a.severity.toUpperCase();
    if (severities[sev] !== undefined) {
      severities[sev]++;
    }
  });

  const severityData = [
    { name: 'Critical', count: severities.CRITICAL, fill: '#ef4444' },
    { name: 'High', count: severities.HIGH, fill: '#f97316' },
    { name: 'Medium', count: severities.MEDIUM, fill: '#eab308' },
    { name: 'Low', count: severities.LOW, fill: '#3b82f6' }
  ];

  // 3. Alerts timeline
  // Group alerts by time segments (e.g., last few minutes/hours)
  const getTimelineData = () => {
    const timeGroups = {};
    alerts.forEach(a => {
      try {
        const date = new Date(a.timestamp);
        // Round to minutes/hours for visual segmentation
        const label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeGroups[label] = (timeGroups[label] || 0) + 1;
      } catch {
        // Fallback
      }
    });

    const data = Object.keys(timeGroups).map(key => ({
      time: key,
      incidents: timeGroups[key]
    })).reverse().slice(-10); // last 10 ticks

    if (data.length === 0) {
      return [{ time: '12:00', incidents: 0 }];
    }
    return data;
  };

  const timelineData = getTimelineData();

  return (
    <div className="charts-grid w-full" style={{ minHeight: '360px' }}>
      {/* Line Chart: Incidents over Time */}
      <div className="glass-panel p-5 flex flex-col justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Incidents Timeline</span>
        </h3>
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={9} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ background: '#060d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                itemStyle={{ color: '#ef4444', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart: Safe vs Suspicious Processes */}
      <div className="glass-panel p-5 flex flex-col justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Processes Security Ratio</h3>
        <div className="flex-1 min-h-[220px] flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {processData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#060d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '11px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconSize={10} 
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Central Label */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Total</span>
            <span className="text-2xl font-black text-white font-mono">{processes.length}</span>
          </div>
        </div>
      </div>

      {/* Bar Chart: Threats count by Severity */}
      <div className="glass-panel p-5 flex flex-col justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Threats by Severity</h3>
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ background: '#060d1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '11px' }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
