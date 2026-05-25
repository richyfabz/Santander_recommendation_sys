// ProfilePage — full customer profile using same RecCard pattern as SearchPage
import { useParams, Link }        from 'react-router-dom';
import { useState, useEffect }    from 'react';
import { motion }                 from 'framer-motion';
import { getRecommendations }     from '../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.08 } } };

// Colour helper — maps probability to design token
function getProbColor(p) {
  if (p >= 0.50) return 'var(--green-400)';
  if (p >= 0.30) return 'var(--amber-400)';
  return 'var(--pink-400)';
}

// Category colour map — same as SearchPage
const CATEGORY_COLORS = {
  Accounts    : { bg: 'rgba(56,189,248,0.10)',  text: 'var(--blue-400)',  border: 'rgba(56,189,248,0.20)'  },
  Credit      : { bg: 'rgba(240,71,138,0.10)',  text: 'var(--pink-300)',  border: 'rgba(240,71,138,0.25)'  },
  Investments : { bg: 'rgba(52,211,153,0.10)',  text: 'var(--green-400)', border: 'rgba(52,211,153,0.20)'  },
  Utilities   : { bg: 'rgba(251,191,36,0.10)',  text: 'var(--amber-400)', border: 'rgba(251,191,36,0.20)'  },
};

// Recommendation card — identical layout to SearchPage RecCard
function RecCard({ rec, rank }) {
  const [feedback, setFeedback] = useState(null);
  const prob     = rec.probability || 0;
  const probPct  = (prob * 100).toFixed(1);
  const color    = getProbColor(prob);
  const catStyle = CATEGORY_COLORS[rec.category] || CATEGORY_COLORS.Utilities;
  const isTop    = rank === 1;

  return (
    <motion.article
      variants   = {fadeUp}
      whileHover = {{
        y: -5, scale: 1.015,
        transition: { type: 'spring', stiffness: 280, damping: 22 },
      }}
      className  = "card"
      style      = {{
        ...styles.recCard,
        border: isTop
          ? '1px solid rgba(240,71,138,0.45)'
          : '1px solid var(--border-card)',
      }}
    >
      {/* Top row — rank + category + feedback */}
      <div style={styles.recTop}>
        <div style={styles.recTopLeft}>
          <span style={{
            ...styles.rankBadge,
            background: isTop ? 'var(--pink-400)' : 'var(--dark-600)',
            color:      isTop ? '#fff' : 'var(--text-muted)',
            boxShadow:  isTop ? '0 0 12px rgba(240,71,138,0.4)' : 'none',
          }}>
            #{rank}
          </span>
          {rec.category && (
            <span style={{
              ...styles.catBadge,
              background: catStyle.bg,
              color:      catStyle.text,
              border:    `1px solid ${catStyle.border}`,
            }}>
              {rec.category}
            </span>
          )}
        </div>

        {/* Feedback buttons */}
        <div style={styles.feedbackRow}>
          <button
            onClick    = {() => setFeedback('up')}
            aria-label = "Relevant"
            style      = {{
              ...styles.fbBtn,
              background:  feedback === 'up' ? 'rgba(52,211,153,0.15)' : 'transparent',
              borderColor: feedback === 'up' ? 'var(--green-400)' : 'var(--border-card)',
              transform:   feedback === 'up' ? 'scale(1.2)' : 'scale(1)',
            }}
          >👍</button>
          <button
            onClick    = {() => setFeedback('down')}
            aria-label = "Not relevant"
            style      = {{
              ...styles.fbBtn,
              background:  feedback === 'down' ? 'rgba(240,71,138,0.12)' : 'transparent',
              borderColor: feedback === 'down' ? 'var(--pink-400)' : 'var(--border-card)',
              transform:   feedback === 'down' ? 'scale(1.2)' : 'scale(1)',
            }}
          >👎</button>
        </div>
      </div>

      {/* Product details */}
      <h3 style={styles.recName}>{rec.name}</h3>
      <code style={styles.recCode}>{rec.product_code}</code>
      {rec.description && (
        <p style={styles.recDesc}>{rec.description}</p>
      )}

      {/* Probability bar */}
      <div style={styles.probRow}>
        <div style={styles.probTrack}>
          <motion.div
            style      = {{
              ...styles.probFill,
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
            initial    = {{ width: 0 }}
            animate    = {{ width: `${probPct}%` }}
            transition = {{ duration: 0.85, delay: rank * 0.08,
                            ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span style={{ ...styles.probLabel, color }}>{probPct}%</span>
      </div>

      {/* Feedback confirmation */}
      <p style={{
        fontSize  : '0.75rem',
        fontWeight: 500,
        marginTop : 8,
        paddingTop: 8,
        minHeight : 24,
        borderTop : '1px solid var(--border-subtle)',
        overflow  : 'hidden',
        transition: 'opacity 300ms ease, color 200ms ease',
        opacity   : feedback ? 1 : 0,
        color     : feedback === 'up'
          ? 'var(--green-400)'
          : 'var(--pink-300)',
      }}>
        {feedback === 'up'
          ? '✓ Marked as relevant'
          : '✓ Not relevant — noted'}
      </p>
    </motion.article>
  );
}

export default function ProfilePage() {
  const { id }                    = useParams();
  const [data,    setData]        = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await getRecommendations(id);
        setData(res);
      } catch (e) {
        setError(e.message || 'Failed to load customer profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <section style={styles.header}>
        <div className="grid-bg" />
        <div className="container" style={{ position: 'relative' }}>
          <Link to="/search" style={styles.backLink}>← Back to search</Link>
          <motion.h1
            initial    = {{ opacity: 0, y: 16 }}
            animate    = {{ opacity: 1, y: 0 }}
            transition = {{ duration: 0.5 }}
            style      = {styles.title}
          >
            Customer <span className="gradient-text">#{id}</span>
          </motion.h1>
        </div>
      </section>

      <div className="container" style={{ padding: '40px 24px 64px' }}>

        {/* Loading spinner */}
        {loading && (
          <div style={styles.loadingWrap}>
            <motion.div
              animate    = {{ rotate: 360 }}
              transition = {{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style      = {styles.spinner}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Querying model...
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={styles.errorBox}>
            <span>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Failed to load profile
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{error}</div>
            </div>
            <Link to="/search" style={{
              color: 'var(--pink-400)', fontSize: '0.88rem',
              textDecoration: 'none', marginLeft: 'auto',
            }}>
              Try another ID →
            </Link>
          </div>
        )}

        {/* Profile content */}
        {data && !loading && (
          <motion.div
            variants = {stagger}
            initial  = "hidden"
            animate  = "show"
          >
            {/* Two column layout */}
            <div style={styles.layout}>

              {/* LEFT — customer info + recommendations */}
              <div style={styles.mainCol}>

                {/* Customer info card */}
                <motion.div variants={fadeUp} style={styles.customerCard}>
                  <div style={styles.customerHeader}>
                    <div style={styles.avatar}>
                      {String(data.customer_id).slice(-2)}
                    </div>
                    <div>
                      <div style={styles.idLabel}>Customer ID</div>
                      <div style={styles.idValue}>{data.customer_id}</div>
                    </div>
                  </div>

                  {/* Holdings */}
                  {data.holdings?.length > 0 && (
                    <div style={styles.holdingsSection}>
                      <div style={styles.holdingsLabel}>Current holdings</div>
                      <div style={styles.holdingsTags}>
                        {data.holdings.map(name => (
                          <span key={name} style={styles.holdingTag}>
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Recommendations */}
                <motion.h2 variants={fadeUp} style={styles.recHeading}>
                  Top Recommendations
                </motion.h2>

                <motion.div
                  style    = {styles.recGrid}
                  variants = {stagger}
                  initial  = "hidden"
                  animate  = "show"
                >
                  {data.recommendations?.map((rec, i) => (
                    <RecCard
                      key  = {rec.product_code}
                      rec  = {rec}
                      rank = {i + 1}
                    />
                  ))}
                </motion.div>
              </div>

              {/* RIGHT — demographics + pipeline gates */}
              <aside style={styles.sidebar}>

                {/* Demographics */}
                {data.demographics && (
                  <motion.div variants={fadeUp} style={styles.sideCard}>
                    <div style={styles.sideCardTitle}>Demographics</div>
                    <dl style={styles.dl}>
                      {[
                        ['Age',    `${data.demographics.age} years`],
                        ['Tenure', `${data.demographics.tenure_months} months`],
                        ['Income', `€${data.demographics.income?.toLocaleString()}`],
                      ].map(([k, v]) => (
                        <div key={k} style={styles.dlRow}>
                          <dt style={styles.dlKey}>{k}</dt>
                          <dd style={styles.dlVal}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                )}

                {/* Pipeline gates */}
                {data.pipeline_audit?.gates && (
                  <motion.div
                    variants = {fadeUp}
                    style    = {{ ...styles.sideCard, marginTop: 14 }}
                  >
                    <div style={styles.sideCardTitle}>Pipeline gates</div>
                    {Object.values(data.pipeline_audit.gates).map(gate => {
                      const pass = gate.value >= gate.threshold;
                      return (
                        <div key={gate.metric} style={styles.gateRow}>
                          <span style={styles.gateLabel}>{gate.metric}</span>
                          <div style={styles.gateRight}>
                            <span style={styles.gateValue}>{gate.value}</span>
                            <span style={{
                              ...styles.gatePill,
                              background: pass
                                ? 'rgba(52,211,153,0.12)'
                                : 'rgba(240,71,138,0.12)',
                              color: pass
                                ? 'var(--green-400)'
                                : 'var(--pink-300)',
                              border: `1px solid ${pass
                                ? 'rgba(52,211,153,0.25)'
                                : 'rgba(240,71,138,0.25)'}`,
                            }}>
                              {pass ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </aside>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

const styles = {
  header: {
    position: 'relative', overflow: 'hidden',
    padding: '56px 0 44px',
    background: 'var(--dark-800)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  backLink: {
    display: 'inline-block', marginBottom: 16,
    color: 'var(--text-muted)', textDecoration: 'none',
    fontSize: '0.88rem', fontWeight: 500,
    transition: 'color 150ms ease',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800, letterSpacing: '-0.02em',
    color: 'var(--text-primary)', lineHeight: 1.1,
  },
  loadingWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16,
    padding: '80px 0',
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid var(--border-card)',
    borderTopColor: 'var(--pink-400)',
  },
  errorBox: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: 'rgba(240,71,138,0.08)',
    border: '1px solid rgba(240,71,138,0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 18px',
    color: 'var(--pink-300)', fontSize: '0.9rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: 20, alignItems: 'start',
  },
  mainCol: { display: 'flex', flexDirection: 'column', gap: 0 },
  customerCard: {
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '22px 24px', marginBottom: 24,
  },
  customerHeader: {
    display: 'flex', alignItems: 'center',
    gap: 14, marginBottom: 16,
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
  idLabel: {
    fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 2,
  },
  idValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem', fontWeight: 700,
    color: 'var(--pink-400)',
  },
  holdingsSection: {
    borderTop: '1px solid var(--border-subtle)', paddingTop: 14,
  },
  holdingsLabel: {
    fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 10, display: 'block',
  },
  holdingsTags: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  holdingTag: {
    background: 'rgba(56,189,248,0.08)',
    border: '1px solid rgba(56,189,248,0.20)',
    borderRadius: 99, padding: '4px 12px',
    fontSize: '0.78rem', color: 'var(--blue-400)',
    fontWeight: 500,
  },
  recHeading: {
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
  recCard: {
    padding: '18px 20px',
    background: 'var(--dark-700)',
    position: 'relative', cursor: 'default',
  },
  recTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  recTopLeft: { display: 'flex', gap: 8, alignItems: 'center' },
  rankBadge: {
    display: 'inline-block', borderRadius: 99,
    padding: '2px 10px', fontSize: '0.72rem',
    fontWeight: 800, letterSpacing: '0.06em',
    transition: 'all 150ms',
  },
  catBadge: {
    display: 'inline-block', borderRadius: 99,
    padding: '2px 10px', fontSize: '0.7rem', fontWeight: 600,
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
  recName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 4, lineHeight: 1.25,
  },
  recCode: {
    display: 'block', fontSize: '0.72rem',
    fontFamily: 'monospace', color: 'var(--text-muted)',
    marginBottom: 8,
  },
  recDesc: {
    fontSize: '0.82rem', color: 'var(--text-muted)',
    lineHeight: 1.65, marginBottom: 14,
  },
  probRow: {
    display: 'flex', alignItems: 'center',
    gap: 10, marginTop: 4,
  },
  probTrack: {
    flex: 1, height: 6, borderRadius: 99,
    background: 'var(--dark-600)', overflow: 'hidden',
  },
  probFill: { height: '100%', borderRadius: 99 },
  probLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem', fontWeight: 700,
    minWidth: 44, textAlign: 'right',
  },
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
};