// MetricsPage.jsx - A React component that displays various performance metrics and feedback statistics
// for a recommendation model.
import { useEffect, useState } from 'react'
import { getHealth, getFeedbackStats } from '../services/api'

// The MetricBar component is a reusable component that renders a horizontal bar to 
// visually represent a performance metric.
function MetricBar({ label, value, max = 1, color = '#A50034', delay = 0 }) {
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setFilled(true), delay + 300)
    return () => clearTimeout(t)
  }, [delay])

  const pct = Math.min((value / max) * 100, 100)

  return (
    <div style={styles.metricBarRow}>
      <div style={styles.metricBarLabel}>{label}</div>
      <div style={styles.metricBarTrack}>
        <div style={{
          height     : 8,
          borderRadius: 4,
          background : color,
          width      : filled ? `${pct}%` : '0%',
          transition : `width 0.75s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`,
        }} />
      </div>
      <div style={styles.metricBarValue}>{value}</div>
    </div>
  )
}

// The MetricsPage component is the main component that renders the metrics page of the application.
// It fetches health and feedback statistics from the backend API using the getHealth and getFeedbackStats 
// functions, and displays them in a structured layout. The page includes summary metric cards, deployment
// gate results, performance visualizations using the MetricBar component, live feedback click-through rates,
// and monitoring thresholds. The component also handles loading states and displays skeleton loaders while 
// fetching data from the API.

export default function MetricsPage() {
  const [health,   setHealth]   = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([getHealth(), getFeedbackStats()])
      .then(([h, f]) => { setHealth(h); setFeedback(f) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="page-hero"><h1>Metrics</h1></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 100 }} aria-hidden="true" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-hero">
        <h1>Model metrics</h1>
        <p>Live performance telemetry from the XGBoost training pipeline and feedback store</p>
      </div>

      {/* SUMMARY METRIC CARDS  */}
      {health && (
        <div className="metric-grid" style={{ marginBottom: 32 }}>
          {[
            { label: 'MAP@7',          value: health.metrics.map_at_7.toFixed(4), sub: '≥ 0.028 threshold', color: '#A50034' },
            { label: 'AUC-ROC',        value: health.metrics.auc_roc.toFixed(4),  sub: '≥ 0.70 threshold',  color: '#A50034' },
            { label: 'Catalog coverage', value: `${health.metrics.catalog_coverage}%`, sub: '≥ 50% threshold', color: '#A50034' },
            { label: 'Model version',  value: health.model_version,               sub: 'XGBoost softprob',   color: '#6B6B65' },
          ].map(({ label, value, sub, color }, i) => (
            <div
              key   = {label}
              className="metric-card"
              style = {{
                borderTop       : `3px solid ${color}`,
                animation       : `fadeUp 0.35s ease ${i * 80}ms both`,
              }}
            >
              <div className="m-label">{label}</div>
              <div className="m-value" style={{ color }}>{value}</div>
              <div className="m-sub">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* DEPLOYMENT GATES */}
      {health && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={styles.cardTitle}>Deployment gate results</h2>
          <p style={styles.cardSub}>
            All three gates must pass before the model is approved for Flask serving
          </p>
          <div style={{ marginTop: 20 }}>
            {[
              { label: 'MAP@7 ≥ 0.028',    value: health.metrics.map_at_7.toFixed(4),        pass: health.gates.map7_pass,     max: 1 },
              { label: 'AUC-ROC ≥ 0.70',   value: health.metrics.auc_roc.toFixed(4),          pass: health.gates.auc_pass,      max: 1 },
              { label: 'Coverage ≥ 50%',   value: `${health.metrics.catalog_coverage}%`,       pass: health.gates.coverage_pass, max: 100 },
            ].map(({ label, value, pass }, i) => (
              <div key={label} style={styles.gateRow}>
                <span style={styles.gateLabel}>{label}</span>
                <div style={styles.gateRight}>
                  <span style={styles.gateValue}>{value}</span>
                  <span
                    className="gate-pill"
                    style={pass
                      ? { background: '#E1F5EE', color: '#0F6E56', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }
                      : { background: '#FCE8E8', color: '#991F1F', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }
                    }
                  >
                    {pass ? '✓ PASS' : '✗ FAIL'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  MODEL PERFORMANCE BARS  */}
      {health && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={styles.cardTitle}>Performance visualisation</h2>
          <MetricBar label="MAP@7"             value={health.metrics.map_at_7}          max={1}   delay={0}   />
          <MetricBar label="AUC-ROC"           value={health.metrics.auc_roc}            max={1}   delay={100} />
          <MetricBar label="Catalog coverage"  value={health.metrics.catalog_coverage}   max={100} delay={200} />
        </div>
      )}

      {/* FEEDBACK CTR  */}
      {feedback && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={styles.cardTitle}>Live feedback CTR</h2>
          <p style={styles.cardSub}>
            Derived from thumbs-up / thumbs-down interactions in the recommend page
          </p>
          <div className="metric-grid" style={{ marginTop: 20 }}>
            {[
              { label: 'Recommendations shown', value: feedback.total_shown   },
              { label: 'Clicked (thumbs up)',    value: feedback.total_clicked },
              { label: 'CTR',                    value: `${feedback.ctr_pct}%` },
            ].map(({ label, value }) => (
              <div key={label} className="metric-card">
                <div className="m-label">{label}</div>
                <div className="m-value" style={{ color: '#A50034' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Per-product breakdown */}
          {feedback.by_product.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>By product</div>
              {feedback.by_product.map(p => (
                <div key={p.product_name} style={styles.fbProductRow}>
                  <span style={styles.fbProductName}>{p.product_name}</span>
                  <div style={styles.fbProductRight}>
                    <span style={{ fontSize: 13, color: '#6B6B65' }}>
                      {p.clicks}/{p.total} clicks
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#A50034' }}>
                      {p.ctr_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MONITORING THRESHOLDS  */}
      <div className="card">
        <h2 style={styles.cardTitle}>Monitoring thresholds</h2>
        <p style={styles.cardSub}>
          Triggers queued from Notebook 08 simulation results
        </p>
        <div style={{ marginTop: 16 }}>
          {[
            { trigger: 'PSI threshold',      value: '> 0.20',  note: 'Feature distribution shift' },
            { trigger: 'KS p-value',         value: '< 0.05',  note: 'Statistical drift detection' },
            { trigger: 'CTR drop trigger',   value: '> 10%',   note: 'Performance degradation' },
            { trigger: 'Fairness gap',       value: '> 5%',    note: 'NDCG gap across age bands' },
          ].map(({ trigger, value, note }) => (
            <div key={trigger} style={styles.thresholdRow}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A18' }}>{trigger}</div>
                <div style={{ fontSize: 12, color: '#9A9890' }}>{note}</div>
              </div>
              <span style={{
                fontSize    : 14,
                fontWeight  : 700,
                color       : '#A50034',
                background  : 'rgba(165,0,52,0.08)',
                padding     : '4px 12px',
                borderRadius: 20,
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}


const styles = {
  cardTitle: {
    fontSize    : 17,
    fontWeight  : 700,
    color       : '#1A1A18',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color   : '#9A9890',
  },
  gateRow: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    padding        : '10px 0',
    borderBottom   : '1px solid rgba(0,0,0,0.05)',
  },
  gateLabel: {
    fontSize: 14,
    color   : '#3D3D3A',
  },
  gateRight: {
    display    : 'flex',
    alignItems : 'center',
    gap        : 10,
  },
  gateValue: {
    fontSize  : 15,
    fontWeight: 700,
  },
  metricBarRow: {
    display    : 'flex',
    alignItems : 'center',
    gap        : 12,
    padding    : '8px 0',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  },
  metricBarLabel: {
    fontSize : 13,
    color    : '#6B6B65',
    minWidth : 140,
  },
  metricBarTrack: {
    flex        : 1,
    height      : 8,
    borderRadius: 4,
    background  : 'rgba(0,0,0,0.06)',
    overflow    : 'hidden',
  },
  metricBarValue: {
    fontSize  : 13,
    fontWeight: 700,
    minWidth  : 60,
    textAlign : 'right',
    color     : '#1A1A18',
  },
  fbProductRow: {
    display        : 'flex',
    justifyContent : 'space-between',
    padding        : '8px 0',
    borderBottom   : '1px solid rgba(0,0,0,0.05)',
  },
  fbProductName: {
    fontSize: 13,
    color   : '#3D3D3A',
  },
  fbProductRight: {
    display: 'flex',
    gap    : 12,
  },
  thresholdRow: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    padding        : '10px 0',
    borderBottom   : '1px solid rgba(0,0,0,0.05)',
  },
}