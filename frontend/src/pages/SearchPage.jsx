// SearchPage — customer ID search with live XGBoost inference
// Data shape from Flask: { customer_id, demographics, holdings, recommendations, pipeline_audit }
import { useState }              from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate }            from 'react-router-dom';
import { getRecommendations, postFeedback } from '../services/api';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

// ── Colour helper — maps probability strength to design token ─────────────────
function getProbColor(prob) {
  if (prob >= 0.50) return 'var(--green-400)';
  if (prob >= 0.30) return 'var(--amber-400)';
  return 'var(--pink-400)';
}

// ── Category colour map — matches product categories from recommendation_engine
const CATEGORY_COLORS = {
  Accounts    : { bg: 'rgba(56,189,248,0.10)',  text: 'var(--blue-400)',  border: 'rgba(56,189,248,0.20)'  },
  Credit      : { bg: 'rgba(240,71,138,0.10)',  text: 'var(--pink-300)',  border: 'rgba(240,71,138,0.25)'  },
  Investments : { bg: 'rgba(52,211,153,0.10)',  text: 'var(--green-400)', border: 'rgba(52,211,153,0.20)'  },
  Utilities   : { bg: 'rgba(251,191,36,0.10)',  text: 'var(--amber-400)', border: 'rgba(251,191,36,0.20)'  },
};

// ── Single recommendation card ────────────────────────────────────────────────
function RecCard({ rec, rank, customerId }) {
  // rec fields: product_code, name, category, description, probability
  const [feedback, setFeedback] = useState(null); // null | 'up' | 'down'
  const prob    = rec.probability || 0;
  const probPct = (prob * 100).toFixed(1);
  const color   = getProbColor(prob);
  const catStyle = CATEGORY_COLORS[rec.category] || CATEGORY_COLORS.Utilities;
  const isTop   = rank === 1;

  const handleFeedback = async (clicked) => {
    // Optimistic update — show confirmation immediately
    setFeedback(clicked ? 'up' : 'down');
    try {
      await postFeedback(customerId, rec.product_code, rec.name, clicked);
    } catch {
      // Revert on failure
      setFeedback(null);
    }
  };

  return (
    <motion.article
      variants    = {fadeUp}
      whileHover  = {{
        y: -5, scale: 1.015,
        transition: { type: 'spring', stiffness: 280, damping: 22 },
      }}
      className   = "card"
      style       = {{
        ...styles.recCard,
        // Gold border on top recommendation
        border: isTop
          ? '1px solid rgba(240,71,138,0.45)'
          : '1px solid var(--border-card)',
      }}
    >
      {/* Top row — rank + category badge + feedback */}
      <div style={styles.recTop}>
        <div style={styles.recTopLeft}>
          {/* Rank badge */}
          <span style={{
            ...styles.rankBadge,
            background: isTop ? 'var(--pink-400)' : 'var(--dark-600)',
            color      : isTop ? '#fff' : 'var(--text-muted)',
            boxShadow  : isTop ? '0 0 12px rgba(240,71,138,0.4)' : 'none',
          }}>
            #{rank}
          </span>
          {/* Category badge */}
          {rec.category && (
            <span style={{
              ...styles.catBadge,
              background  : catStyle.bg,
              color       : catStyle.text,
              border      : `1px solid ${catStyle.border}`,
            }}>
              {rec.category}
            </span>
          )}
        </div>

        {/* Feedback buttons */}
        <div style={styles.feedbackRow} role="group" aria-label={`Feedback for ${rec.name}`}>
          <button
            onClick    = {() => handleFeedback(true)}
            aria-label = "Relevant"
            aria-pressed = {feedback === 'up'}
            style      = {{
              ...styles.fbBtn,
              background  : feedback === 'up' ? 'rgba(52,211,153,0.15)' : 'transparent',
              borderColor : feedback === 'up' ? 'var(--green-400)' : 'var(--border-card)',
              transform   : feedback === 'up' ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            👍
          </button>
          <button
            onClick    = {() => handleFeedback(false)}
            aria-label = "Not relevant"
            aria-pressed = {feedback === 'down'}
            style      = {{
              ...styles.fbBtn,
              background  : feedback === 'down' ? 'rgba(240,71,138,0.12)' : 'transparent',
              borderColor : feedback === 'down' ? 'var(--pink-400)' : 'var(--border-card)',
              transform   : feedback === 'down' ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            👎
          </button>
        </div>
      </div>

      {/* Product name — MUST be readable, large enough */}
      <h3 style={styles.recName}>{rec.name}</h3>

      {/* Product code — monospace, muted */}
      <code style={styles.recCode}>{rec.product_code}</code>

      {/* Description */}
      {rec.description && (
        <p style={styles.recDesc}>{rec.description}</p>
      )}

      {/* Probability bar + label */}
      <div style={styles.probRow}>
        <div
          style       = {styles.probTrack}
          role        = "progressbar"
          aria-valuenow = {Math.round(prob * 100)}
          aria-valuemin = {0}
          aria-valuemax = {100}
        >
          <motion.div
            style      = {{
              ...styles.probFill,
              background: color,
              boxShadow : `0 0 8px ${color}`,
            }}
            initial    = {{ width: 0 }}
            animate    = {{ width: `${probPct}%` }}
            transition = {{ duration: 0.85, delay: rank * 0.08,
                            ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span style={{ ...styles.probLabel, color }}>{probPct}%</span>
      </div>

      {/* Feedback confirmation message */}
      {/* 
        Feedback confirmation space ALWAYS reserved using visibility.
        Using visibility instead of conditional render means the element
        always occupies its fixed height in the layout no card shift.
        AnimatePresence removed because it was animating height 0→auto
        which was the direct cause of the card growing on click.
      */}
      <p
        style={{
          ...styles.fbConfirm,
          visibility: feedback ? 'visible' : 'hidden',
          color: feedback === 'up'
            ? 'var(--green-400)'
            : 'var(--pink-300)',
        }}
        role="status"
        aria-live="polite"
      >
        {feedback === 'up'
          ? '✓ Marked as relevant — recorded'
          : '✓ Marked as not relevant — noted'}
      </p>
    </motion.article>
  );
}

// ── Monitoring alert — fires for customer 1005 (drift simulation) ─────────────
function MonitoringAlert({ audit }) {
  if (!audit?.monitoring) return null;
  const { retrain_status, baseline_ctr, current_ctr, ctr_drop } = audit.monitoring;
  if (!retrain_status?.includes('FIRED')) return null;

  return (
    <motion.div
      initial = {{ opacity: 0, y: -8 }}
      animate = {{ opacity: 1, y: 0 }}
      style   = {styles.driftAlert}
      role    = "alert"
    >
      <span style={{ fontSize: '1.2rem' }}>⚠️</span>
      <div>
        <div style={styles.alertTitle}>Drift detected — retraining queued</div>
        <div style={styles.alertBody}>
          CTR dropped from {baseline_ctr} baseline to {current_ctr} ({ctr_drop} drop).
          Notebook 08 monitoring trigger fired.
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [customerId, setCustomerId] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [results,    setResults]    = useState(null);
  const navigate                    = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    const id = customerId.trim();
    if (!id) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const data = await getRecommendations(id);
      setResults(data);
    } catch (err) {
      // Extract the most useful error message from Flask response
      const msg = err.response?.data?.message
        || err.message
        || 'Failed to fetch. Is Flask running on port 5000?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Quick-fill buttons for the three seeded customers
  const QUICK_IDS = ['1001', '1002', '1005'];

  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Page header ── */}
      <section style={styles.header}>
        <div className="grid-bg" />
        <div style={styles.orb} />
        <div className="container" style={{ position: 'relative' }}>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="badge">Model Inference</span>
            </motion.div>
            <motion.h1 variants={fadeUp} style={styles.pageTitle}>
              Product <span className="gradient-text">Recommender</span>
            </motion.h1>
            <motion.p variants={fadeUp} style={styles.pageSub}>
              Enter a customer ID to query the XGBoost model and retrieve
              top product recommendations ranked by probability.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Search section ── */}
      <div className="container" style={{ padding: '48px 24px 0' }}>

        {/* Search form */}
        <motion.form
          onSubmit   = {handleSearch}
          style      = {styles.form}
          initial    = {{ opacity: 0, y: 20 }}
          animate    = {{ opacity: 1, y: 0 }}
          transition = {{ duration: 0.5, delay: 0.2 }}
        >
          <div style={styles.inputRow}>
            <input
              type        = "text"
              value       = {customerId}
              onChange    = {e => setCustomerId(e.target.value)}
              placeholder = "Customer ID — e.g. 1001"
              style       = {styles.input}
              className   = "search-input"
              disabled    = {loading}
              aria-label  = "Customer ID"
              autoComplete= "off"
            />
            <motion.button
              type       = "submit"
              className  = "btn-primary"
              disabled   = {loading || !customerId.trim()}
              whileHover = {{ scale: 1.03 }}
              whileTap   = {{ scale: 0.97 }}
              style      = {{ flexShrink: 0, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Querying model...' : 'Get Recommendations →'}
            </motion.button>
          </div>

          {/* Quick-fill hint — shows the three seeded customer IDs */}
          <div style={styles.hintRow}>
            <span style={styles.hintText}>Seeded customers:</span>
            {QUICK_IDS.map(id => (
              <button
                key      = {id}
                type     = "button"
                style    = {styles.hintBtn}
                onClick  = {() => setCustomerId(id)}
              >
                {id}
              </button>
            ))}
          </div>
        </motion.form>

        {/* ── Error state ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial = {{ opacity: 0, y: -8 }}
              animate = {{ opacity: 1, y: 0 }}
              exit    = {{ opacity: 0 }}
              style   = {styles.errorBox}
              role    = "alert"
            >
              <span>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Request failed
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{error}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading skeletons ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial = {{ opacity: 0 }}
              animate = {{ opacity: 1 }}
              exit    = {{ opacity: 0 }}
              style   = {{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 860 }}
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key   = {i}
                  style = {{
                    height         : 88,
                    borderRadius   : 'var(--radius-md)',
                    background     : 'linear-gradient(90deg, var(--dark-700) 25%, var(--dark-600) 50%, var(--dark-700) 75%)',
                    backgroundSize : '400px 100%',
                    animation      : 'shimmer 1.4s infinite',
                    animationDelay : `${i * 0.1}s`,
                  }}
                  aria-hidden="true"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {results && !loading && (
            <motion.div
              initial = {{ opacity: 0 }}
              animate = {{ opacity: 1 }}
              exit    = {{ opacity: 0 }}
            >
              {/* Drift alert — only visible for customer 1005 */}
              <MonitoringAlert audit={results.pipeline_audit} />

              {/* Two-column layout on wide screens */}
              <div style={styles.resultsLayout}>

                {/* ── LEFT: recommendations ── */}
                <div style={styles.mainCol}>

                  {/* Customer card — demographics + holdings */}
                  <motion.div
                    initial    = {{ opacity: 0, y: 16 }}
                    animate    = {{ opacity: 1, y: 0 }}
                    transition = {{ duration: 0.4 }}
                    style      = {styles.customerCard}
                  >
                    <div style={styles.customerHeader}>
                      {/* Avatar circle */}
                      <div style={styles.avatar}>
                        {String(results.customer_id).slice(-2)}
                      </div>
                      <div>
                        <div style={styles.customerIdLabel}>Customer ID</div>
                        <div style={styles.customerId}>{results.customer_id}</div>
                      </div>
                    </div>

                    {/* Holdings tags */}
                    {results.holdings?.length > 0 && (
                      <div style={styles.holdingsSection}>
                        <div style={styles.holdingsLabel}>Current holdings</div>
                        <div style={styles.holdingsTags}>
                          {results.holdings.map(name => (
                            <span key={name} style={styles.holdingTag}>
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Recommendation cards */}
                  <h2 style={styles.recSectionTitle}>Top Recommendations</h2>
                  <motion.div
                    style    = {styles.recGrid}
                    variants = {stagger}
                    initial  = "hidden"
                    animate  = "show"
                  >
                    {results.recommendations?.map((rec, i) => (
                      <RecCard
                        key        = {rec.product_code}
                        rec        = {rec}
                        rank       = {i + 1}
                        customerId = {results.customer_id}
                      />
                    ))}
                  </motion.div>
                </div>

                {/* ── RIGHT: sidebar — demographics + pipeline gates ── */}
                <aside style={styles.sidebar}>

                  {/* Demographics */}
                  <div style={styles.sideCard}>
                    <div style={styles.sideCardTitle}>Demographics</div>
                    <dl style={styles.dl}>
                      {results.demographics && [
                        ['Age',    `${results.demographics.age} years`],
                        ['Tenure', `${results.demographics.tenure_months} months`],
                        ['Income', `€${results.demographics.income?.toLocaleString()}`],
                      ].map(([k, v]) => (
                        <div key={k} style={styles.dlRow}>
                          <dt style={styles.dlKey}>{k}</dt>
                          <dd style={styles.dlVal}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <button
                      onClick   = {() => navigate(`/profile/${results.customer_id}`)}
                      className = "btn-ghost"
                      style     = {{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                    >
                      Full profile →
                    </button>
                  </div>

                  {/* Pipeline gates */}
                  <div style={{ ...styles.sideCard, marginTop: 14 }}>
                    <div style={styles.sideCardTitle}>Pipeline gates</div>
                    {results.pipeline_audit?.gates && Object.values(results.pipeline_audit.gates).map(gate => {
                      const pass = gate.value >= gate.threshold;
                      return (
                        <div key={gate.metric} style={styles.gateRow}>
                          <span style={styles.gateLabel}>{gate.metric}</span>
                          <div style={styles.gateRight}>
                            <span style={styles.gateValue}>{gate.value}</span>
                            <span style={{
                              ...styles.gatePill,
                              background: pass ? 'rgba(52,211,153,0.12)' : 'rgba(240,71,138,0.12)',
                              color     : pass ? 'var(--green-400)'       : 'var(--pink-300)',
                              border    : `1px solid ${pass ? 'rgba(52,211,153,0.25)' : 'rgba(240,71,138,0.25)'}`,
                            }}>
                              {pass ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </aside>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state — no search yet */}
        {!results && !loading && !error && (
          <motion.div
            initial    = {{ opacity: 0 }}
            animate    = {{ opacity: 1 }}
            transition = {{ delay: 0.4 }}
            style      = {styles.emptyState}
          >
            <div style={styles.emptyIcon} aria-hidden="true">⚡</div>
            <p style={styles.emptyTitle}>Ready to recommend</p>
            <p style={styles.emptySub}>
              Select a customer ID above or type your own to run inference
            </p>
          </motion.div>
        )}
      </div>

      {/* Inject keyframes for shimmer + input focus */}
      <style>{`
        .search-input:focus {
          outline: none;
          border-color: var(--pink-400) !important;
          box-shadow: 0 0 0 3px rgba(240,71,138,0.15) !important;
        }
        .search-input::placeholder { color: var(--grey-500); }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
      `}</style>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  header: {
    position: 'relative', overflow: 'hidden',
    padding: '72px 0 56px',
    background: 'var(--dark-800)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  orb: {
    position: 'absolute', top: -80, right: -60,
    width: 360, height: 360, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,71,138,0.12) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
    fontWeight: 800, lineHeight: 1.1,
    color: 'var(--text-primary)',
    margin: '20px 0 14px',
    letterSpacing: '-0.02em',
  },
  pageSub: {
    fontSize: '1rem', color: 'var(--text-muted)',
    maxWidth: 520, lineHeight: 1.75,
  },

  /* Form */
  form    : { maxWidth: 760, marginBottom: 16 },
  inputRow: {
    display: 'flex', gap: 12,
    alignItems: 'center', flexWrap: 'wrap',
    marginBottom: 10,
  },
  input: {
    flex: '1 1 260px',
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    transition: 'border-color 150ms, box-shadow 150ms',
  },
  hintRow: {
    display: 'flex', gap: 8, alignItems: 'center',
    flexWrap: 'wrap',
  },
  hintText: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },
  hintBtn: {
    background: 'rgba(240,71,138,0.08)',
    border: '1px solid rgba(240,71,138,0.20)',
    borderRadius: 99,
    padding: '3px 12px',
    color: 'var(--pink-300)',
    fontSize: '0.8rem', fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 150ms',
  },

  /* Error */
  errorBox: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: 'rgba(240,71,138,0.08)',
    border: '1px solid rgba(240,71,138,0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 18px',
    color: 'var(--pink-300)',
    marginBottom: 24, maxWidth: 760,
  },

  /* Results layout */
  resultsLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: 20, alignItems: 'start',
    paddingBottom: 64,
  },
  mainCol: { display: 'flex', flexDirection: 'column', gap: 0 },

  /* Customer card */
  customerCard: {
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '22px 24px',
    marginBottom: 24,
  },
  customerHeader: {
    display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--pink-400)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 800, color: '#fff',
    flexShrink: 0,
    boxShadow: '0 0 16px rgba(240,71,138,0.35)',
  },
  customerIdLabel: {
    fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 2,
  },
  customerId: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem', fontWeight: 700,
    color: 'var(--pink-400)',
  },
  holdingsSection: {
    borderTop: '1px solid var(--border-subtle)',
    paddingTop: 14,
  },
  holdingsLabel: {
    fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 10,
    display: 'block',
  },
  holdingsTags: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  holdingTag: {
    background: 'rgba(56,189,248,0.08)',
    border: '1px solid rgba(56,189,248,0.20)',
    borderRadius: 99, padding: '4px 12px',
    fontSize: '0.78rem', color: 'var(--blue-400)',
    fontWeight: 500,
  },

  /* Rec section */
  recSectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem', fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: 14,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  recGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 14,
  },

  /* Rec card */
  recCard: {
    padding: '18px 20px',
    background: 'var(--dark-700)',
    position: 'relative',
    cursor: 'default',
  },
  recTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  recTopLeft: { display: 'flex', gap: 8, alignItems: 'center' },
  rankBadge: {
    display: 'inline-block',
    borderRadius: 99, padding: '2px 10px',
    fontSize: '0.72rem', fontWeight: 800,
    letterSpacing: '0.06em',
    transition: 'all 150ms',
  },
  catBadge: {
    display: 'inline-block',
    borderRadius: 99, padding: '2px 10px',
    fontSize: '0.7rem', fontWeight: 600,
    letterSpacing: '0.04em',
  },
  feedbackRow: { display: 'flex', gap: 6 },
  fbBtn: {
    padding: '4px 9px', borderRadius: 8,
    border: '1px solid var(--border-card)',
    fontSize: '0.85rem', cursor: 'pointer',
    lineHeight: 1, background: 'transparent',
    transition: 'all 150ms ease',
  },

  /* Product info */
  recName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-primary)',   /* ← explicit white — fixes invisible text */
    marginBottom: 4, lineHeight: 1.25,
  },
  recCode: {
    display: 'block',
    fontSize: '0.72rem', fontFamily: 'monospace',
    color: 'var(--text-muted)',
    marginBottom: 8,
  },
  recDesc: {
    fontSize: '0.82rem', color: 'var(--text-muted)',
    lineHeight: 1.65, marginBottom: 14,
  },

  /* Probability */
  probRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginTop: 4,
  },
  probTrack: {
    flex: 1, height: 6, borderRadius: 99,
    background: 'var(--dark-600)', overflow: 'hidden',
  },
  probFill: {
    height: '100%', borderRadius: 99,
  },
  probLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem', fontWeight: 700,
    minWidth: 44, textAlign: 'right',
  },
  fbConfirm: {
  fontSize  : '0.75rem',
  fontWeight: 500,
  marginTop : 8,
  paddingTop: 8,
  height    : 24,        // fixed height — always takes up space
  borderTop : '1px solid var(--border-subtle)',
  overflow  : 'hidden',
  transition: 'color 200ms ease',
},

  /* Sidebar */
  sidebar: { position: 'sticky', top: 80 },
  sideCard: {
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
  },
  sideCardTitle: {
    fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 14,
  },
  dl: { display: 'flex', flexDirection: 'column' },
  dlRow: {
    display: 'flex', justifyContent: 'space-between',
    padding: '7px 0',
    borderBottom: '1px solid var(--border-subtle)',
  },
  dlKey: { fontSize: '0.82rem', color: 'var(--text-muted)' },
  dlVal: {
    fontSize: '0.82rem', fontWeight: 600,
    color: 'var(--text-primary)',
  },
  gateRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '8px 0',
    borderBottom: '1px solid var(--border-subtle)',
  },
  gateLabel: { fontSize: '0.82rem', color: 'var(--text-muted)' },
  gateRight: { display: 'flex', alignItems: 'center', gap: 8 },
  gateValue: {
    fontSize: '0.82rem', fontWeight: 700,
    color: 'var(--text-primary)',
  },
  gatePill: {
    fontSize: '0.75rem', fontWeight: 700,
    padding: '2px 8px', borderRadius: 99,
  },

  /* Drift alert */
  driftAlert: {
    display: 'flex', gap: 12,
    padding: '14px 16px', borderRadius: 'var(--radius-md)',
    background: 'rgba(251,191,36,0.08)',
    border: '1px solid rgba(251,191,36,0.25)',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: '0.9rem', fontWeight: 700,
    color: 'var(--amber-400)', marginBottom: 4,
  },
  alertBody: {
    fontSize: '0.82rem', color: 'var(--text-muted)',
    lineHeight: 1.6,
  },

  /* Empty state */
  emptyState: {
    textAlign: 'center', padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '2.5rem', marginBottom: 16, opacity: 0.4,
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem', fontWeight: 700,
    color: 'var(--text-secondary)', marginBottom: 8,
  },
  emptySub: {
    fontSize: '0.9rem', color: 'var(--text-muted)',
  },
};