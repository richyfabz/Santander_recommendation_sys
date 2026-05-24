// SearchPage.jsx - main interface for fetching and displaying recommendations based on customer ID input.
// It includes a search input for the customer ID, displays the current holdings of the customer,
//  and shows a list of recommended products with their probabilities. Each recommendation card also 
// has feedback buttons for users to indicate whether the recommendation was relevant or not, 
// which sends feedback to the backend for model improvement. The page also handles loading states, 
// errors, and displays pipeline gate statuses and monitoring alerts when applicable.

import { useState, useCallback } from 'react'
import { useNavigate }           from 'react-router-dom'
import { getRecommendations, postFeedback } from '../services/api' 
import { useState, useCallback } from 'react'
import { useNavigate }           from 'react-router-dom'
import { getRecommendations, postFeedback } from '../services/api'

// Skeleton loader shown during inference
function SkeletonCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1,2,3,4].map(i => (
        <div
          key       = {i}
          className = "skeleton"
          style     = {{ height: 88, animationDelay: `${i * 80}ms` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// Single recommendation card with animated probability bar and feedback buttons
function RecCard({ rec, customerId, index }) {
  const [feedback, setFeedback] = useState(null)  // null | 'up' | 'down'

  
  const handleFeedback = async (clicked) => {
    setFeedback(clicked ? 'up' : 'down')
    try {
      await postFeedback(
        customerId,
        rec.product_code,
        rec.name,
        clicked
      )
    } catch {
      // Revert on failure
      setFeedback(null)
    }
  }

  // Color the bar from red (high) to orange (mid)  all on-brand
  const barColor = rec.probability > 0.55 ? '#A50034' : '#D44D6E'

  return (
    <article
      className = "card"
      style     = {{
        ...styles.recCard,
        animation: `fadeUp 0.35s ease ${index * 80}ms both`,
        borderTop: `3px solid ${barColor}`,
      }}
    >
      {/* Top row */}
      <div style={styles.recTop}>
        <div>
          <div style={styles.recRank}>#{rec.rank || index + 1} recommendation</div>
          <div style={styles.recName}>{rec.name}</div>
          <div style={styles.recCategory}>{rec.category}</div>
        </div>
        <div
          style     = {styles.feedbackGroup}
          role      = "group"
          aria-label= {`Feedback for ${rec.name}`}
        >
          <button
            onClick    = {() => handleFeedback(true)}
            aria-label = "Mark as relevant"
            aria-pressed = {feedback === 'up'}
            style      = {{
              ...styles.fbBtn,
              background  : feedback === 'up' ? 'rgba(165,0,52,0.1)' : 'transparent',
              borderColor : feedback === 'up' ? '#A50034' : 'rgba(0,0,0,0.1)',
              transform   : feedback === 'up' ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            👍
          </button>
          <button
            onClick    = {() => handleFeedback(false)}
            aria-label = "Mark as not relevant"
            aria-pressed = {feedback === 'down'}
            style      = {{
              ...styles.fbBtn,
              background  : feedback === 'down' ? 'rgba(226,75,74,0.08)' : 'transparent',
              borderColor : feedback === 'down' ? '#E24B4A' : 'rgba(0,0,0,0.1)',
              transform   : feedback === 'down' ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            👎
          </button>
        </div>
      </div>

      {/* Probability bar */}
      <div style={styles.probRow} aria-label={`Confidence ${(rec.probability * 100).toFixed(1)}%`}>
        <div className="prob-bar-bg" role="progressbar" aria-valuenow={Math.round(rec.probability * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className = "prob-bar-fill"
            style     = {{
              width           : `${rec.probability * 100}%`,
              background      : barColor,
              transitionDelay : `${index * 80 + 250}ms`,
            }}
          />
        </div>
        <span style={styles.probPct}>{(rec.probability * 100).toFixed(1)}%</span>
      </div>

      {/* Description */}
      {rec.description && (
        <p style={styles.recDesc}>{rec.description}</p>
      )}

      {/* Feedback confirmation */}
      {feedback && (
        <div
          style    = {{
            ...styles.fbConfirm,
            color: feedback === 'up' ? '#0F6E56' : '#991F1F',
          }}
          role     = "status"
          aria-live= "polite"
        >
          {feedback === 'up'
            ? '✓ Marked as relevant — thank you'
            : '✓ Marked as not relevant — noted'}
        </div>
      )}
    </article>
  )
}
// Main SearchPage component that renders the search interface for fetching and displaying
//  recommendations based on customer ID input. It manages state for the customer ID, fetched data,
//  loading status, and errors. The component includes a search input, displays current holdings,
//  shows recommended products with probabilities, and provides feedback buttons for each recommendation. 
// It also handles pipeline gate statuses and monitoring alerts when applicable.
export default function SearchPage() {
  const [customerId, setCustomerId] = useState('')
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const navigate                    = useNavigate()

  // Function to handle the search action when the user clicks the recommend button or presses Enter.
  // It validates the input, sets the loading state, and calls the getRecommendations API function. 
  // The fetched data is stored in the state, and any errors are caught and displayed to the user. 
  // Finally, it resets the loading state once the operation is complete.
  const handleSearch = useCallback(async () => {
    const id = customerId.trim()
    // Validate that the input is a non-empty numeric value before making the API call. 
    // If the input is invalid, the function returns early without performing any action.
    if (!id) return

    setLoading(true) // Set loading state to true to indicate that the recommendation fetching process has started
    setError('')    // Clear any existing error messages before making a new API call
    setData(null)  // Clear previous recommendation data to prepare for new results

    
    try {
      const result = await getRecommendations(parseInt(id))
      setData(result)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Could not fetch recommendations. Check the Flask server is running.'
      )
    } finally {
      setLoading(false)
    }
  }, [customerId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  // Navigate to full profile page for this customer
  const viewProfile = () => {
    if (data?.customer_id) navigate(`/profile/${data.customer_id}`)
  }


  // 
  return (
    <div className="page">
      <div className="page-hero">
        <h1>Get recommendations</h1>
        <p>Enter a customer ID from the Santander feature store to run the model</p>
      </div>

      {/* ── SEARCH INPUT ── */}
      <div style={styles.searchRow}>
        <input
          type        = "text"
          inputMode   = "numeric"
          placeholder = "Customer ID — try 1001, 1002, or 1005"
          value       = {customerId}
          onChange    = {e => setCustomerId(e.target.value)}
          onKeyDown   = {handleKeyDown}
          disabled    = {loading}
          className   = "input-field"
          style       = {{ flex: 1 }}
          aria-label  = "Customer ID"
          autoComplete= "off"
        />
        <button
          onClick   = {handleSearch}
          disabled  = {loading || !customerId.trim()}
          className = "btn-red"
          style     = {{ flexShrink: 0 }}
        >
          {loading ? 'Running...' : 'Recommend →'}
        </button>
      </div>

      {/* ── MONITORING ALERT — fires for customer 1005 ── */}
      {data?.pipeline_audit?.monitoring?.retrain_status?.includes('FIRED') && (
        <div style={styles.driftAlert} role="alert">
          <span style={styles.alertIcon}>⚠</span>
          <div>
            <div style={styles.alertTitle}>Drift detected — retraining queued</div>
            <div style={styles.alertBody}>
              CTR dropped from{' '}
              {data.pipeline_audit.monitoring.baseline_ctr} baseline to{' '}
              {data.pipeline_audit.monitoring.current_ctr} ({data.pipeline_audit.monitoring.ctr_drop} drop).
              Monitoring trigger fired.
            </div>
          </div>
        </div>
      )}

      {/*  ERROR  */}
      {error && (
        <div style={styles.errorBanner} role="alert">
          <span>⚠ {error}</span>
          <button onClick={() => setError('')} style={styles.dismissBtn} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/*  LOADING  */}
      {loading && <SkeletonCard />}

      {/*  RESULTS  */}
      {data && !loading && (
        <div style={styles.resultsGrid}>

          {/* Left — recommendations */}
          <div>
            {/* Holdings */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-label">Current holdings · customer {data.customer_id}</div>
              <div style={styles.tagsRow}>
                {data.holdings.length > 0
                  ? data.holdings.map((h, i) => (
                      <span key={i} style={styles.holdingTag}>{h}</span>
                    ))
                  : <span style={{ fontSize: 13, color: '#9A9890' }}>No holdings on record</span>
                }
              </div>
            </div>

            {/* Recommendation cards */}
            <div className="section-label">Top recommendations</div>
            {data.recommendations.map((rec, i) => (
              <RecCard
                key        = {rec.product_code}
                rec        = {rec}
                customerId = {data.customer_id}
                index      = {i}
              />
            ))}
          </div>

          {/* Right — sidebar */}
          <aside style={styles.sidebar}>

            {/* Demographics */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="section-label">Demographics</div>
              <dl style={styles.dl}>
                {[
                  ['Customer ID',  data.customer_id],
                  ['Age',          `${data.demographics.age} years`],
                  ['Tenure',       `${data.demographics.tenure_months} months`],
                  ['Income',       `€${data.demographics.income.toLocaleString()}`],
                ].map(([k, v]) => (
                  <div key={k} style={styles.dlRow}>
                    <dt style={styles.dt}>{k}</dt>
                    <dd style={styles.dd}>{v}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick   = {viewProfile}
                className = "btn-outline"
                style     = {{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              >
                Full profile →
              </button>
            </div>

            {/* Pipeline gates */}
            <div className="card">
              <div className="section-label">Pipeline gates</div>
              {Object.values(data.pipeline_audit.gates).map(gate => {
                const pass = gate.value >= gate.threshold
                return (
                  <div key={gate.metric} style={styles.gateRow}>
                    <span style={{ fontSize: 13, color: '#3D3D3A' }}>{gate.metric}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{gate.value}</span>
                      <span
                        className="gate-pill"
                        style={pass
                          ? { background: '#E1F5EE', color: '#0F6E56' }
                          : { background: '#FCE8E8', color: '#991F1F' }
                        }
                      >
                        {pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

          </aside>
        </div>
      )}
    </div>
  )
}

// Styles for the SearchPage component, defined as a JavaScript object.
//  These styles are applied inline to the respective elements in the JSX. The styles include layout 
// properties such as display, flexbox settings, padding, colors, and animations to create a 
// visually appealing and user-friendly interface for searching and displaying product recommendations
//  based on customer ID input.
const styles = {
  searchRow: {
    display      : 'flex',
    gap          : 10,
    marginBottom : 20,
    alignItems   : 'center',
  },
  resultsGrid: {
    display             : 'grid',
    gridTemplateColumns : '1fr 280px',
    gap                 : 16,
    alignItems          : 'start',
  },
  tagsRow: {
    display : 'flex',
    flexWrap: 'wrap',
    gap     : 7,
    marginTop: 8,
  },
  holdingTag: {
    fontSize    : 13,
    padding     : '5px 12px',
    borderRadius: 20,
    background  : 'rgba(165,0,52,0.08)',
    color       : '#A50034',
    fontWeight  : 500,
    border      : '1px solid rgba(165,0,52,0.2)',
  },
  recCard: {
    marginBottom: 10,
    transition  : 'box-shadow 0.18s ease',
  },
  recTop: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'flex-start',
    marginBottom   : 12,
  },
  recRank: {
    fontSize    : 11,
    fontWeight  : 600,
    color       : '#9A9890',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 3,
  },
  recName: {
    fontSize  : 16,
    fontWeight: 700,
    color     : '#1A1A18',
    letterSpacing: '-0.01em',
  },
  recCategory: {
    fontSize  : 12,
    color     : '#9A9890',
    marginTop : 2,
  },
  feedbackGroup: {
    display: 'flex',
    gap    : 6,
  },
  fbBtn: {
    padding     : '5px 10px',
    borderRadius: 8,
    border      : '1px solid rgba(0,0,0,0.1)',
    fontSize    : 14,
    cursor      : 'pointer',
    transition  : 'all 0.18s ease',
    lineHeight  : 1,
    background  : 'transparent',
  },
  probRow: {
    display    : 'flex',
    alignItems : 'center',
    gap        : 10,
    marginBottom: 8,
  },
  probPct: {
    fontSize  : 13,
    fontWeight: 600,
    color     : '#6B6B65',
    minWidth  : 42,
    textAlign : 'right',
  },
  recDesc: {
    fontSize : 13,
    color    : '#9A9890',
    lineHeight: 1.6,
  },
  fbConfirm: {
    fontSize  : 12,
    fontWeight: 500,
    marginTop : 10,
    paddingTop: 10,
    borderTop : '1px solid rgba(0,0,0,0.05)',
  },
  sidebar: {
    position: 'sticky',
    top     : 76,
  },
  dl: {
    display      : 'flex',
    flexDirection: 'column',
  },
  dlRow: {
    display        : 'flex',
    justifyContent : 'space-between',
    padding        : '8px 0',
    borderBottom   : '1px solid rgba(0,0,0,0.05)',
  },
  dt: {
    fontSize: 13,
    color   : '#9A9890',
  },
  dd: {
    fontSize  : 13,
    fontWeight: 600,
    color     : '#1A1A18',
  },
  gateRow: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    padding        : '8px 0',
    borderBottom   : '1px solid rgba(0,0,0,0.05)',
  },
  driftAlert: {
    display     : 'flex',
    gap         : 12,
    padding     : '14px 16px',
    borderRadius: 10,
    background  : '#FFF3E0',
    border      : '1px solid #F5A623',
    marginBottom: 16,
    animation   : 'fadeIn 0.3s ease',
  },
  alertIcon: {
    fontSize  : 20,
    flexShrink: 0,
    color     : '#BA7517',
  },
  alertTitle: {
    fontSize  : 14,
    fontWeight: 600,
    color     : '#633806',
    marginBottom: 3,
  },
  alertBody: {
    fontSize: 13,
    color   : '#854F0B',
  },
  errorBanner: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    padding        : '12px 16px',
    borderRadius   : 10,
    background     : 'rgba(226,75,74,0.08)',
    border         : '1px solid rgba(226,75,74,0.2)',
    marginBottom   : 16,
    fontSize       : 14,
    color          : '#991F1F',
  },
  dismissBtn: {
    background: 'transparent',
    border    : 'none',
    cursor    : 'pointer',
    color     : '#991F1F',
    fontSize  : 14,
    padding   : '2px 6px',
  },
}