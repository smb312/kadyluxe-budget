import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Download, RotateCcw, ChevronDown, ChevronRight, AlertCircle, TrendingUp, Lock, Edit3 } from 'lucide-react';

// ============================================================================
// DATA MODEL — designed to port cleanly to Vercel/Postgres later
// ============================================================================

const DTC_GOAL = 3000000;
const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

// Seasonality weights — KADYLUXE-specific based on actual revenue shape
// Build phase (May-Jul) ~15%, Peak (Aug-Jan) ~75%, Maintenance (Feb-Apr) ~10%
const SEASONALITY_WEIGHTS = {
  May: 0.03, Jun: 0.04, Jul: 0.07,
  Aug: 0.13, Sep: 0.17, Oct: 0.14, Nov: 0.18, Dec: 0.10, Jan: 0.07,
  Feb: 0.04, Mar: 0.02, Apr: 0.01,
};

const DEFAULT_SCENARIOS = {
  option1: {
    name: 'Option 1 — Maintenance',
    pct: 10,
    realisticDtc: '$1.5–1.8M',
    hitsGoal: 'No',
    note: "Math doesn't work. After fixed costs, only ~$32K of working media for the entire year.",
    color: '#B23A48',
  },
  option2: {
    name: 'Option 2 — Foundation',
    pct: 15,
    realisticDtc: '$2.2–2.6M',
    hitsGoal: 'Maybe',
    note: 'Plausible if Q3/Q4 over-perform. No safety net.',
    color: '#C97B2A',
  },
  option3: {
    name: 'Option 3 — Growth (Recommended)',
    pct: 20,
    realisticDtc: '$2.8–3.3M',
    hitsGoal: 'Yes',
    note: 'Funds full Phase 1+2 stack with reserve. Build the engine for 2027.',
    color: '#2D5F3F',
  },
};

// Base partners — same for all scenarios, but inclusion/cost varies
const createDefaultPartners = (scenario) => {
  const base = [
    { id: 'broncos', name: 'Broncos Sponsorship', category: 'Licensing/Access', cost: 150000, type: 'annual', locked: false, included: true, notes: 'Year 2 commit. Flag: could be carved out as license cost.' },
    { id: 'marketer', name: 'Marketer.com', category: 'Paid Media Mgmt', cost: 3900, type: 'monthly', locked: false, included: true, notes: '90-day pilot active. Meta + Google + TikTok.' },
    { id: 'kait', name: 'Kait', category: 'SEO + GMC + Amazon', cost: 4000, type: 'monthly', locked: false, included: true, notes: '$3K SEO + $1K Amazon storefront.' },
    { id: 'email', name: 'Email Vendor (Josh or Homestead)', category: 'Email/SMS', cost: 5000, type: 'monthly', locked: false, included: true, notes: 'Avg of off-season $4.5K + peak $5.5K. SMS layer adds $1.5K starting Aug.' },
    { id: 'paz', name: 'PAZ Analytics', category: 'Tracking/Pixel Audit', cost: 15000, type: 'annual', locked: false, included: true, notes: 'Audit + light retainer.' },
  ];

  if (scenario === 'option1') {
    return [
      ...base.map(p => p.id === 'paz' ? { ...p, cost: 10000 } : p),
    ];
  }

  if (scenario === 'option2') {
    return [
      ...base.map(p => p.id === 'paz' ? { ...p, cost: 12000 } : p),
      { id: 'd2c', name: 'D2C Design', category: 'CRO + Landing Pages', cost: 9000, type: 'monthly', months: 6, locked: false, included: true, notes: 'Coast network. Jun-Nov only.' },
    ];
  }

  // option3
  return [
    ...base,
    { id: 'd2c', name: 'D2C Design', category: 'CRO + Landing Pages', cost: 9000, type: 'monthly', months: 7, locked: false, included: true, notes: 'Coast network. Jun-Dec.' },
    { id: '10pm', name: '10pm Curfew', category: 'Influencer/Creator Program', cost: 6500, type: 'monthly', months: 6, locked: false, included: true, notes: 'Coast network. Jul-Dec. Cheerleader + NIL + sorority creators.' },
    { id: 'creative', name: 'Incremental Creative Production', category: 'Photo/Video', cost: 25000, type: 'annual', locked: false, included: true, notes: 'Project-based shoots, UGC sourcing.' },
  ];
};

// Variable spend defaults per scenario (paid + influencer activations + reserve)
const createDefaultVariable = (scenario) => {
  if (scenario === 'option1') {
    // Total ~$32K — barely functional
    return { May: 1000, Jun: 1500, Jul: 2000, Aug: 4000, Sep: 5500, Oct: 5000, Nov: 6000, Dec: 3500, Jan: 2500, Feb: 500, Mar: 250, Apr: 250 };
  }
  if (scenario === 'option2') {
    // Total ~$116K
    return { May: 4000, Jun: 6000, Jul: 7000, Aug: 13000, Sep: 17000, Oct: 17000, Nov: 20000, Dec: 14000, Jan: 10000, Feb: 4000, Mar: 2000, Apr: 2000 };
  }
  // option3 — total ~$200K (variable + reserve)
  return { May: 7000, Jun: 12000, Jul: 21000, Aug: 37000, Sep: 46000, Oct: 39000, Nov: 45000, Dec: 28000, Jan: 21000, Feb: 6000, Mar: 2000, Apr: 0 };
};

// ============================================================================
// CALCULATIONS
// ============================================================================

const calculateAnnualCost = (partner) => {
  if (!partner.included) return 0;
  if (partner.type === 'annual') return partner.cost;
  const months = partner.months || 12;
  return partner.cost * months;
};

const calculateTotals = (partners, variable) => {
  const fixed = partners.reduce((sum, p) => sum + calculateAnnualCost(p), 0);
  const variableTotal = Object.values(variable).reduce((sum, v) => sum + (v || 0), 0);
  return { fixed, variable: variableTotal, total: fixed + variableTotal };
};

const formatCurrency = (n) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const formatCurrencyExact = (n) => `$${Math.round(n).toLocaleString()}`;

// ============================================================================
// COMPONENT
// ============================================================================

export default function MarketingBudgetTool() {
  const [activeScenario, setActiveScenario] = useState('option3');
  const [scenarios, setScenarios] = useState({
    option1: { partners: createDefaultPartners('option1'), variable: createDefaultVariable('option1') },
    option2: { partners: createDefaultPartners('option2'), variable: createDefaultVariable('option2') },
    option3: { partners: createDefaultPartners('option3'), variable: createDefaultVariable('option3') },
  });
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  const current = scenarios[activeScenario];
  const meta = DEFAULT_SCENARIOS[activeScenario];
  const totals = useMemo(() => calculateTotals(current.partners, current.variable), [current]);
  const targetBudget = (DTC_GOAL * meta.pct) / 100;
  const variance = totals.total - targetBudget;

  const updatePartner = (id, field, value) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: {
        ...prev[activeScenario],
        partners: prev[activeScenario].partners.map(p =>
          p.id === id ? { ...p, [field]: value } : p
        ),
      },
    }));
  };

  const removePartner = (id) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: {
        ...prev[activeScenario],
        partners: prev[activeScenario].partners.filter(p => p.id !== id),
      },
    }));
  };

  const addPartner = (partner) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: {
        ...prev[activeScenario],
        partners: [...prev[activeScenario].partners, { ...partner, id: `custom-${Date.now()}` }],
      },
    }));
    setShowAddPartner(false);
  };

  const updateVariable = (month, value) => {
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: {
        ...prev[activeScenario],
        variable: { ...prev[activeScenario].variable, [month]: parseFloat(value) || 0 },
      },
    }));
  };

  const resetScenario = () => {
    if (!confirm(`Reset ${meta.name} to defaults? Your edits will be lost.`)) return;
    setScenarios(prev => ({
      ...prev,
      [activeScenario]: {
        partners: createDefaultPartners(activeScenario),
        variable: createDefaultVariable(activeScenario),
      },
    }));
  };

  const exportData = () => {
    const data = {
      generated: new Date().toISOString(),
      dtc_goal: DTC_GOAL,
      scenarios: Object.keys(scenarios).reduce((acc, key) => {
        const s = scenarios[key];
        const t = calculateTotals(s.partners, s.variable);
        acc[key] = {
          name: DEFAULT_SCENARIOS[key].name,
          pct_of_dtc: DEFAULT_SCENARIOS[key].pct,
          target_budget: (DTC_GOAL * DEFAULT_SCENARIOS[key].pct) / 100,
          partners: s.partners,
          monthly_variable: s.variable,
          totals: t,
        };
        return acc;
      }, {}),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kadyluxe-marketing-budget-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F1EA',
      fontFamily: '"Inter", -apple-system, sans-serif',
      color: '#1A1A1A',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * { box-sizing: border-box; }

        .display-font { font-family: 'Fraunces', Georgia, serif; }
        .mono-font { font-family: 'JetBrains Mono', monospace; }

        .scenario-tab {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .scenario-tab:hover {
          transform: translateY(-1px);
        }

        .partner-row {
          transition: background 0.15s ease;
        }

        .partner-row:hover {
          background: rgba(0,0,0,0.02);
        }

        .editable-input {
          background: transparent;
          border: 1px solid transparent;
          padding: 4px 8px;
          border-radius: 3px;
          transition: all 0.15s ease;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }

        .editable-input:hover {
          border-color: rgba(0,0,0,0.15);
          background: rgba(255,255,255,0.6);
        }

        .editable-input:focus {
          outline: none;
          border-color: #1A1A1A;
          background: white;
        }

        .grain {
          position: relative;
        }

        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.5;
        }

        .month-bar {
          transition: all 0.3s ease;
        }

        button {
          font-family: 'Inter', sans-serif;
        }

        .btn-primary {
          background: #1A1A1A;
          color: #F4F1EA;
          border: none;
          padding: 8px 14px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary:hover {
          background: #333;
        }

        .btn-secondary {
          background: transparent;
          color: #1A1A1A;
          border: 1px solid rgba(0,0,0,0.2);
          padding: 8px 14px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-secondary:hover {
          border-color: #1A1A1A;
          background: rgba(0,0,0,0.04);
        }

        .btn-icon {
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: rgba(0,0,0,0.4);
          transition: color 0.15s ease;
          display: inline-flex;
          align-items: center;
        }

        .btn-icon:hover {
          color: #B23A48;
        }

        .checkbox {
          width: 16px;
          height: 16px;
          accent-color: #1A1A1A;
          cursor: pointer;
        }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#F4F1EA' }} className="grain">
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 32px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="mono-font" style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: '8px' }}>
                KADYLUXE × COAST / FRACTIONAL CMO
              </div>
              <h1 className="display-font" style={{ fontSize: '44px', fontWeight: 500, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>
                2026 Marketing <em style={{ fontStyle: 'italic', fontWeight: 400 }}>North Star</em>
              </h1>
              <div style={{ marginTop: '12px', fontSize: '14px', color: 'rgba(0,0,0,0.6)', maxWidth: '640px', lineHeight: 1.5 }}>
                Three budget scenarios against a $3M DTC goal. Edit partners, costs, and monthly spend live. All numbers recalculate. Export when locked.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={resetScenario} className="btn-secondary">
                <RotateCcw size={14} /> Reset scenario
              </button>
              <button onClick={exportData} className="btn-primary">
                <Download size={14} /> Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>

        {/* SCENARIO TABS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {Object.entries(DEFAULT_SCENARIOS).map(([key, s]) => {
            const t = calculateTotals(scenarios[key].partners, scenarios[key].variable);
            const isActive = activeScenario === key;
            return (
              <div
                key={key}
                onClick={() => setActiveScenario(key)}
                className="scenario-tab"
                style={{
                  background: isActive ? '#1A1A1A' : 'white',
                  color: isActive ? '#F4F1EA' : '#1A1A1A',
                  padding: '20px 22px',
                  borderRadius: '4px',
                  border: isActive ? '1px solid #1A1A1A' : '1px solid rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '4px', height: '100%',
                  background: s.color,
                }}/>
                <div className="mono-font" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: isActive ? 'rgba(244,241,234,0.6)' : 'rgba(0,0,0,0.5)', marginBottom: '6px' }}>
                  {s.pct}% of DTC
                </div>
                <div className="display-font" style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px', lineHeight: 1.2 }}>
                  {s.name}
                </div>
                <div className="mono-font" style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {formatCurrency(t.total)}
                </div>
                <div style={{ fontSize: '11px', color: isActive ? 'rgba(244,241,234,0.7)' : 'rgba(0,0,0,0.55)', marginTop: '8px', lineHeight: 1.4 }}>
                  Realistic DTC: {s.realisticDtc} · Hits goal: <strong>{s.hitsGoal}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* CURRENT SCENARIO HEADER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', marginBottom: '24px', overflow: 'hidden' }}>
          {[
            { label: 'Target Budget', value: formatCurrency(targetBudget), sub: `${meta.pct}% of $3M DTC goal` },
            { label: 'Current Total', value: formatCurrency(totals.total), sub: `${formatCurrencyExact(totals.total)}` },
            { label: 'Variance', value: (variance >= 0 ? '+' : '') + formatCurrency(variance), sub: variance >= 0 ? 'Over target' : 'Under target', color: Math.abs(variance) > targetBudget * 0.05 ? '#B23A48' : '#2D5F3F' },
            { label: 'Fixed / Variable', value: `${formatCurrency(totals.fixed)} / ${formatCurrency(totals.variable)}`, sub: `${((totals.fixed / totals.total) * 100).toFixed(0)}% fixed` },
          ].map((kpi, i) => (
            <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
              <div className="mono-font" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: '8px' }}>
                {kpi.label}
              </div>
              <div className="display-font" style={{ fontSize: '28px', fontWeight: 500, color: kpi.color || '#1A1A1A', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', marginTop: '6px' }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        {/* RECOMMENDATION NOTE */}
        <div style={{ background: 'white', borderLeft: `3px solid ${meta.color}`, padding: '14px 20px', marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertCircle size={18} style={{ color: meta.color, flexShrink: 0, marginTop: '1px' }}/>
          <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'rgba(0,0,0,0.75)' }}>
            <strong style={{ color: '#1A1A1A' }}>{meta.name}.</strong> {meta.note}
          </div>
        </div>

        {/* PARTNERS TABLE */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
            <div>
              <h2 className="display-font" style={{ fontSize: '24px', fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>
                Partners & Fixed Costs
              </h2>
              <div className="mono-font" style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', marginTop: '4px', letterSpacing: '0.05em' }}>
                {current.partners.filter(p => p.included).length} ACTIVE · {formatCurrency(totals.fixed)} ANNUAL
              </div>
            </div>
            <button onClick={() => setShowAddPartner(true)} className="btn-primary">
              <Plus size={14} /> Add partner
            </button>
          </div>

          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 100px 100px 80px 1fr 80px', padding: '12px 16px', background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)', alignItems: 'center' }}>
              {['', 'Partner', 'Category', 'Cost', 'Type', 'Months', 'Annual', ''].map((h, i) => (
                <div key={i} className="mono-font" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)', fontWeight: 500 }}>
                  {h}
                </div>
              ))}
            </div>
            {current.partners.map((p) => {
              const annual = calculateAnnualCost(p);
              return (
                <div key={p.id}>
                  <div className="partner-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 2fr 1.5fr 100px 100px 80px 1fr 80px',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    alignItems: 'center',
                    opacity: p.included ? 1 : 0.4,
                  }}>
                    <input
                      type="checkbox"
                      checked={p.included}
                      onChange={(e) => updatePartner(p.id, 'included', e.target.checked)}
                      className="checkbox"
                    />
                    <div>
                      <input
                        className="editable-input"
                        style={{ fontSize: '14px', fontFamily: 'Inter', fontWeight: 500, width: '100%' }}
                        value={p.name}
                        onChange={(e) => updatePartner(p.id, 'name', e.target.value)}
                      />
                    </div>
                    <input
                      className="editable-input"
                      style={{ width: '100%' }}
                      value={p.category}
                      onChange={(e) => updatePartner(p.id, 'category', e.target.value)}
                    />
                    <input
                      type="number"
                      className="editable-input"
                      style={{ width: '90px', textAlign: 'right' }}
                      value={p.cost}
                      onChange={(e) => updatePartner(p.id, 'cost', parseFloat(e.target.value) || 0)}
                    />
                    <select
                      className="editable-input"
                      style={{ width: '90px' }}
                      value={p.type}
                      onChange={(e) => updatePartner(p.id, 'type', e.target.value)}
                    >
                      <option value="annual">annual</option>
                      <option value="monthly">monthly</option>
                    </select>
                    <input
                      type="number"
                      className="editable-input"
                      style={{ width: '60px', textAlign: 'right' }}
                      value={p.months || (p.type === 'monthly' ? 12 : '')}
                      onChange={(e) => updatePartner(p.id, 'months', parseFloat(e.target.value) || 12)}
                      disabled={p.type === 'annual'}
                      placeholder="—"
                    />
                    <div className="mono-font" style={{ fontSize: '14px', fontWeight: 500, textAlign: 'right', paddingRight: '12px' }}>
                      {formatCurrency(annual)}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setExpandedNotes({ ...expandedNotes, [p.id]: !expandedNotes[p.id] })}
                        className="btn-icon"
                        title="Toggle notes"
                      >
                        {expandedNotes[p.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <button
                        onClick={() => removePartner(p.id)}
                        className="btn-icon"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {expandedNotes[p.id] && (
                    <div style={{ padding: '12px 16px 12px 56px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <textarea
                        value={p.notes || ''}
                        onChange={(e) => updatePartner(p.id, 'notes', e.target.value)}
                        placeholder="Add notes about this partner..."
                        style={{
                          width: '100%',
                          minHeight: '60px',
                          padding: '8px 10px',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '3px',
                          fontFamily: 'Inter',
                          fontSize: '13px',
                          background: 'white',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {current.partners.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(0,0,0,0.4)', fontSize: '14px' }}>
                No partners yet. Click "Add partner" to start.
              </div>
            )}
          </div>
        </div>

        {/* ADD PARTNER MODAL */}
        {showAddPartner && <AddPartnerForm onAdd={addPartner} onCancel={() => setShowAddPartner(false)} />}

        {/* MONTHLY VARIABLE SPEND */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 className="display-font" style={{ fontSize: '24px', fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>
              Monthly Variable Spend
            </h2>
            <div className="mono-font" style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', marginTop: '4px', letterSpacing: '0.05em' }}>
              PAID MEDIA · INFLUENCER ACTIVATIONS · RESERVE · {formatCurrency(totals.variable)} ANNUAL
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', padding: '24px' }}>
            {/* Visual bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '8px', marginBottom: '16px', alignItems: 'flex-end', height: '160px' }}>
              {MONTHS.map((m) => {
                const v = current.variable[m] || 0;
                const max = Math.max(...Object.values(current.variable));
                const heightPct = max > 0 ? (v / max) * 100 : 0;
                const isPeak = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'].includes(m);
                return (
                  <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div className="mono-font" style={{ fontSize: '10px', color: 'rgba(0,0,0,0.5)', marginBottom: '4px' }}>
                      {formatCurrency(v)}
                    </div>
                    <div className="month-bar" style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: isPeak ? meta.color : 'rgba(0,0,0,0.25)',
                      borderRadius: '2px 2px 0 0',
                      minHeight: v > 0 ? '4px' : '0',
                    }}/>
                  </div>
                );
              })}
            </div>

            {/* Editable inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px' }}>
              {MONTHS.map((m) => {
                const isPeak = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'].includes(m);
                return (
                  <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div className="mono-font" style={{ fontSize: '11px', fontWeight: 600, color: isPeak ? meta.color : '#1A1A1A', letterSpacing: '0.05em' }}>
                      {m.toUpperCase()}
                    </div>
                    <input
                      type="number"
                      value={current.variable[m] || 0}
                      onChange={(e) => updateVariable(m, e.target.value)}
                      className="editable-input"
                      style={{ width: '100%', textAlign: 'center', fontSize: '12px' }}
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
              <div>
                <span className="mono-font" style={{ letterSpacing: '0.05em' }}>BUILD MAY-JUL: </span>
                <strong style={{ color: '#1A1A1A' }}>{formatCurrency(['May','Jun','Jul'].reduce((s,m) => s + (current.variable[m] || 0), 0))}</strong>
              </div>
              <div>
                <span className="mono-font" style={{ letterSpacing: '0.05em' }}>PEAK AUG-JAN: </span>
                <strong style={{ color: meta.color }}>{formatCurrency(['Aug','Sep','Oct','Nov','Dec','Jan'].reduce((s,m) => s + (current.variable[m] || 0), 0))}</strong>
              </div>
              <div>
                <span className="mono-font" style={{ letterSpacing: '0.05em' }}>MAINT FEB-APR: </span>
                <strong style={{ color: '#1A1A1A' }}>{formatCurrency(['Feb','Mar','Apr'].reduce((s,m) => s + (current.variable[m] || 0), 0))}</strong>
              </div>
              <div>
                <span className="mono-font" style={{ letterSpacing: '0.05em' }}>PEAK % OF TOTAL: </span>
                <strong style={{ color: '#1A1A1A' }}>
                  {totals.variable > 0 ? ((['Aug','Sep','Oct','Nov','Dec','Jan'].reduce((s,m) => s + (current.variable[m] || 0), 0) / totals.variable) * 100).toFixed(0) : 0}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* SCENARIO COMPARISON */}
        <div style={{ marginBottom: '40px' }}>
          <h2 className="display-font" style={{ fontSize: '24px', fontWeight: 500, margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>
            Side-by-side comparison
          </h2>
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 20px', background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="mono-font" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)' }}>Metric</div>
              {Object.entries(DEFAULT_SCENARIOS).map(([k, s]) => (
                <div key={k} className="mono-font" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: activeScenario === k ? '#1A1A1A' : 'rgba(0,0,0,0.55)', fontWeight: activeScenario === k ? 700 : 500 }}>
                  {s.pct}% — {s.pct === 20 ? 'Growth' : s.pct === 15 ? 'Foundation' : 'Maintenance'}
                </div>
              ))}
            </div>
            {[
              { label: 'Total Budget', getValue: (k) => formatCurrency(calculateTotals(scenarios[k].partners, scenarios[k].variable).total) },
              { label: 'Fixed Costs', getValue: (k) => formatCurrency(calculateTotals(scenarios[k].partners, scenarios[k].variable).fixed) },
              { label: 'Variable Working Spend', getValue: (k) => formatCurrency(calculateTotals(scenarios[k].partners, scenarios[k].variable).variable) },
              { label: 'Active Partners', getValue: (k) => scenarios[k].partners.filter(p => p.included).length.toString() },
              { label: 'Realistic DTC', getValue: (k) => DEFAULT_SCENARIOS[k].realisticDtc },
              { label: 'Hits $3M Goal?', getValue: (k) => DEFAULT_SCENARIOS[k].hitsGoal },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.05)' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.7)' }}>{row.label}</div>
                {Object.keys(DEFAULT_SCENARIOS).map((k) => (
                  <div key={k} className="mono-font" style={{
                    fontSize: '14px',
                    fontWeight: activeScenario === k ? 700 : 500,
                    color: activeScenario === k ? '#1A1A1A' : 'rgba(0,0,0,0.7)',
                  }}>
                    {row.getValue(k)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div className="mono-font" style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>
            KADYLUXE × COAST · INTERNAL TOOL · FRACTIONAL CMO ENGAGEMENT
          </div>
          <div className="mono-font" style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>
            EDITS LIVE IN-SESSION · EXPORT JSON TO PERSIST
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADD PARTNER FORM
// ============================================================================

function AddPartnerForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    cost: 0,
    type: 'monthly',
    months: 12,
    included: true,
    notes: '',
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert('Partner name is required');
      return;
    }
    onAdd(form);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#F4F1EA',
        borderRadius: '4px',
        padding: '32px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h3 className="display-font" style={{ fontSize: '24px', fontWeight: 500, margin: '0 0 20px 0', letterSpacing: '-0.01em' }}>
          Add new partner
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Partner Name">
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Somerce"
              style={inputStyle}
            />
          </Field>
          <Field label="Category">
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. TikTok Shop / Affiliate"
              style={inputStyle}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Field label="Cost">
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
              />
            </Field>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={inputStyle}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </Field>
            <Field label="Months">
              <input
                type="number"
                value={form.months}
                onChange={(e) => setForm({ ...form, months: parseFloat(e.target.value) || 12 })}
                disabled={form.type === 'annual'}
                style={{ ...inputStyle, opacity: form.type === 'annual' ? 0.4 : 1 }}
              />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Context, scope, status..."
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            />
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">
            <Plus size={14} /> Add partner
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: '3px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  background: 'white',
  outline: 'none',
};

function Field({ label, children }) {
  return (
    <div>
      <div className="mono-font" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)', marginBottom: '6px', fontWeight: 500 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
