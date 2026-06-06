import React, { useState, useMemo } from 'react';
import { Layers, ChevronRight, ChevronDown, ShieldAlert, Cpu, GitBranch } from 'lucide-react';

/**
 * ProcessTree — iterative, flat-list renderer.
 *
 * Instead of a recursive React component tree (which can cause render-cycle
 * crashes with large or cyclic data), we:
 *  1. Build the parent→children map once (useMemo).
 *  2. Walk the tree iteratively (DFS stack) to produce a flat array of
 *     { node, depth } tuples.
 *  3. Render the flat array as a simple list — zero recursion in React JSX.
 */
export default function ProcessTree({ processes }) {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (pid) => {
    setCollapsed(prev => ({ ...prev, [pid]: !prev[pid] }));
  };

  // ─── Build process map & root list ───────────────────────────────────────
  const { roots, childrenMap } = useMemo(() => {
    if (!Array.isArray(processes) || processes.length === 0) {
      return { roots: [], childrenMap: {} };
    }

    const map = {};           // pid → process object
    const childrenMap = {};   // pid → [child process objects]
    const hasParent = new Set();

    // First pass: index all valid processes
    processes.forEach(p => {
      if (p && p.pid != null) {
        map[p.pid] = p;
        childrenMap[p.pid] = [];
      }
    });

    // Second pass: wire parent→children, detecting cycles & missing parents
    processes.forEach(p => {
      if (!p || p.pid == null) return;
      const ppid = p.parent_pid;
      if (ppid != null && ppid !== p.pid && map[ppid]) {
        childrenMap[ppid].push(p);
        hasParent.add(p.pid);
      }
    });

    const roots = processes.filter(p => p && p.pid != null && !hasParent.has(p.pid));
    return { roots, childrenMap };
  }, [processes]);

  // ─── Flatten tree iteratively ─────────────────────────────────────────────
  const flatNodes = useMemo(() => {
    const result = [];
    const stack = [...roots].reverse().map(r => ({ node: r, depth: 0 }));
    const visited = new Set();

    while (stack.length > 0) {
      const { node, depth } = stack.pop();
      if (!node || node.pid == null || visited.has(node.pid)) continue;
      visited.add(node.pid);

      const children = childrenMap[node.pid] || [];
      const hasChildren = children.length > 0;
      result.push({ node, depth, hasChildren });

      // Push children (reversed so first child is processed first)
      if (hasChildren && !collapsed[node.pid]) {
        [...children].reverse().forEach(child => {
          stack.push({ node: child, depth: depth + 1 });
        });
      }
    }

    return result;
  }, [roots, childrenMap, collapsed]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getRiskLabel = (level) => {
    if (!level) return null;
    const upper = level.toUpperCase();
    if (upper === 'CRITICAL') return 'critical';
    if (upper === 'HIGH') return 'high';
    if (upper === 'MEDIUM') return 'medium';
    return null;
  };

  const isSuspicious = (level) => {
    const l = level ? level.toUpperCase() : '';
    return l === 'CRITICAL' || l === 'HIGH';
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Layers size={15} style={{ color: 'var(--sky)' }} />
            Process Tree Hierarchy
          </h2>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            Interactive parent-child lineages with real-time process tracing.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {processes?.length || 0} processes
          </span>
          <span className="badge" style={{ fontSize: '9px' }}>
            <GitBranch size={9} style={{ marginRight: '4px' }} />
            {roots.length} roots
          </span>
        </div>
      </div>

      {/* Tree Body */}
      <div className="scroller" style={{ flex: 1, padding: '16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {flatNodes.length === 0 ? (
          <div className="empty-state">
            {(!Array.isArray(processes) || processes.length === 0)
              ? 'Telemetry is loading process states...'
              : 'No processes match the current filters.'}
          </div>
        ) : (
          flatNodes.map(({ node, depth, hasChildren }) => {
            const isCollapsed = collapsed[node.pid];
            const suspicious = isSuspicious(node.risk_level);
            const riskLabel = getRiskLabel(node.risk_level);

            return (
              <div
                key={`${node.pid}-${depth}`}
                className={`tree-node${suspicious ? ' suspicious' : ''}`}
                style={{ paddingLeft: `${depth * 22 + 12}px`, cursor: hasChildren ? 'pointer' : 'default' }}
                onClick={() => hasChildren && toggleCollapse(node.pid)}
              >
                {/* Expand/Collapse Toggle */}
                <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0, marginRight: '4px' }}>
                  {hasChildren ? (
                    isCollapsed
                      ? <ChevronRight size={12} />
                      : <ChevronDown size={12} />
                  ) : (
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--border-medium)', display: 'block' }} />
                  )}
                </div>

                {/* Process Icon */}
                <div style={{
                  padding: '3px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${suspicious ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  marginRight: '10px',
                }}>
                  {suspicious
                    ? <ShieldAlert size={12} style={{ color: 'var(--red)', animation: 'pulse 2s infinite' }} />
                    : <Cpu size={12} style={{ color: 'var(--text-secondary)' }} />
                  }
                </div>

                {/* Process Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                  <span style={{ fontWeight: 600, color: suspicious ? '#f87171' : 'var(--text-primary)', fontSize: '12px' }}>
                    {node.process_name || 'unknown'}
                  </span>

                  <span style={{
                    fontSize: '9px',
                    color: 'var(--text-muted)',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1px 6px',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    PID: {node.pid}
                  </span>

                  {node.user && node.user !== 'N/A' && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      ({node.user})
                    </span>
                  )}

                  {riskLabel && riskLabel !== 'medium' && (
                    <span className={`badge badge-${riskLabel}`} style={{ fontSize: '8px', padding: '1px 6px' }}>
                      {node.risk_level}
                    </span>
                  )}
                  {riskLabel === 'medium' && (
                    <span className="badge" style={{ fontSize: '8px', padding: '1px 6px', background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)' }}>
                      {node.risk_level}
                    </span>
                  )}

                  {node.path && (
                    <span style={{ fontSize: '9px', color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }} title={node.path}>
                      {node.path}
                    </span>
                  )}
                </div>

                {/* Children indicator (when collapsed) */}
                {hasChildren && isCollapsed && (
                  <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', padding: '1px 8px', flexShrink: 0 }}>
                    +{childrenMap[node.pid]?.length || 0}
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
