// SearchPage — customer ID search, recommendation results display
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecommendations } from '../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.08 } } };

// Human-readable product name map
const PRODUCT_NAMES = {
  ind_ahor_fin_ult1:  'Saving Account',
  ind_aval_fin_ult1:  'Guarantees',
  ind_cco_fin_ult1:   'Current Account',
  ind_cder_fin_ult1:  'Derivada Account',
  ind_cno_fin_ult1:   'Payroll Account',
  ind_ctju_fin_ult1:  'Junior Account',
  ind_ctma_fin_ult1:  'Más Particular Account',
  ind_ctop_fin_ult1:  'Particular Account',
  ind_ctpp_fin_ult1:  'Particular Plus Account',
  ind_deco_fin_ult1:  'Short-term Deposits',
  ind_deme_fin_ult1:  'Medium-term Deposits',
  ind_dela_fin_ult1:  'Long-term Deposits',
  ind_ecue_fin_ult1:  'e-Account',
  ind_fond_fin_ult1:  'Funds',
  ind_hip_fin_ult1:   'Mortgage',
  ind_plan_fin_ult1:  'Pension Plan',
  ind_pres_fin_ult1:  'Loans',
  ind_reca_fin_ult1:  'Taxes',
  ind_tjcr_fin_ult1:  'Credit Card',
  ind_valo_fin_ult1:  'Securities',
  ind_viv_fin_ult1:   'Home Account',
  ind_nomina_ult1:    'Payroll',
  ind_nom_pens_ult1:  'Pensions',
  ind_recibo_ult1:    'Direct Debit',
};

// Colour coding by probability strength
function getProbColor(prob) {
  if (prob >= 0.6) return 'var(--green-400)';
  if (prob >= 0.35) return 'var(--amber-400)';
  return 'var(--pink-400)';
}

export default function SearchPage() {
  const [customerId, setCustomerId] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [results,    setResults]    = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!customerId.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const data = await getRecommendations(customerId.trim());
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations. Is the Flask API running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <section style={styles.header}>
        <div className="grid-bg" />
        <div style={styles.orb} />
        <div className="container" style={{ position: 'relative' }}>
          <motion.div
            initial="hidden" animate="show" variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <span className="badge">Model Inference</span>
            </motion.div>
            <motion.h1 variants={fadeUp} style={styles.title}>
              Product <span className="gradient-text">Recommender</span>
            </motion.h1>
            <motion.p variants={fadeUp} style={styles.sub}>
              Enter a customer ID to query the XGBoost model and retrieve
              the top-5 personalised product recommendations.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Search form ── */}
      <section className="container" style={{ padding: '56px 24px' }}>
        <motion.form
          onSubmit={handleSearch}
          style={styles.form}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div style={styles.inputRow}>
            <input
              type="text"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              placeholder="Enter customer ID  e.g. 15889"
              style={styles.input}
              className="search-input"
              disabled={loading}
            />
            <motion.button
              type="submit"
              className="btn-primary"
              disabled={loading || !customerId.trim()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ flexShrink: 0, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Querying...' : 'Get Recommendations →'}
            </motion.button>
          </div>
          <p style={styles.hint}>
            Try customer ID: <button type="button" style={styles.hintBtn}
              onClick={() => setCustomerId('15889')}>15889</button>
          </p>
        </motion.form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={styles.errorBox}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={styles.skeletonWrap}
            >
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ ...styles.skeleton,
                  animationDelay: `${i * 0.1}s` }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Customer info */}
              <motion.div
                style={styles.customerCard}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div style={styles.customerHeader}>
                  <span style={styles.customerIcon}>👤</span>
                  <div>
                    <span style={styles.customerIdLabel}>Customer ID</span>
                    <span style={styles.customerId}>{customerId}</span>
                  </div>
                </div>

                {/* Current holdings */}
                {results.current_products?.length > 0 && (
                  <div style={styles.holdings}>
                    <span style={styles.holdingsLabel}>Current holdings</span>
                    <div style={styles.holdingsTags}>
                      {results.current_products.map(p => (
                        <span key={p} style={styles.holdingTag}>
                          {PRODUCT_NAMES[p] || p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Recommendations */}
              <h2 style={styles.recTitle}>Top Recommendations</h2>
              <motion.div
                style={styles.recGrid}
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                {results.recommendations?.map(({ product, probability }, i) => (
                  <motion.div
                    key={product}
                    variants={fadeUp}
                    whileHover={{
                      y: -4, scale: 1.02,
                      transition: { type: 'spring', stiffness: 300, damping: 20 },
                    }}
                    className="card"
                    style={styles.recCard}
                  >
                    {/* Rank badge */}
                    <span style={{
                      ...styles.rankBadge,
                      background: i === 0 ? 'var(--pink-400)' : 'var(--dark-600)',
                      color: i === 0 ? '#fff' : 'var(--text-muted)',
                    }}>
                      #{i + 1}
                    </span>

                    <h3 style={styles.recName}>
                      {PRODUCT_NAMES[product] || product}
                    </h3>
                    <span style={styles.recCode}>{product}</span>

                    {/* Probability bar */}
                    <div style={styles.probRow}>
                      <div style={styles.probBar}>
                        <motion.div
                          style={{
                            ...styles.probFill,
                            background: getProbColor(probability),
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(probability * 100).toFixed(1)}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1,
                            ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span style={{
                        ...styles.probLabel,
                        color: getProbColor(probability),
                      }}>
                        {(probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <style>{`
        .search-input:focus {
          outline: none;
          border-color: var(--pink-400) !important;
          box-shadow: 0 0 0 3px rgba(240,71,138,0.15) !important;
        }
        .search-input::placeholder { color: var(--grey-500); }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </main>
  );
}

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
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
    fontWeight: 800, lineHeight: 1.1,
    color: 'var(--text-primary)',
    margin: '20px 0 14px',
    letterSpacing: '-0.02em',
  },
  sub: {
    fontSize: '1rem', color: 'var(--text-muted)',
    maxWidth: 520, lineHeight: 1.7,
  },
  form: { maxWidth: 680, marginBottom: 12 },
  inputRow: {
    display: 'flex', gap: 12, alignItems: 'center',
    marginBottom: 10, flexWrap: 'wrap',
  },
  input: {
    flex: '1 1 280px',
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  },
  hint: { fontSize: '0.82rem', color: 'var(--text-muted)' },
  hintBtn: {
    background: 'none', border: 'none',
    color: 'var(--pink-400)', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.82rem',
    textDecoration: 'underline', padding: 0,
  },
  errorBox: {
    background: 'rgba(240,71,138,0.08)',
    border: '1px solid rgba(240,71,138,0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    color: 'var(--pink-300)',
    fontSize: '0.9rem', marginBottom: 24,
    maxWidth: 680,
  },
  skeletonWrap: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680 },
  skeleton: {
    height: 72, borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(90deg, var(--dark-700) 25%, var(--dark-600) 50%, var(--dark-700) 75%)',
    backgroundSize: '400px 100%',
    animation: 'shimmer 1.4s infinite',
  },
  customerCard: {
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    marginBottom: 32, maxWidth: 680,
  },
  customerHeader: {
    display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 16,
  },
  customerIcon: { fontSize: '1.8rem' },
  customerIdLabel: {
    display: 'block', fontSize: '0.72rem',
    fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: 2,
  },
  customerId: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem', fontWeight: 700,
    color: 'var(--pink-400)',
  },
  holdings: { borderTop: '1px solid var(--border-subtle)', paddingTop: 16 },
  holdingsLabel: {
    display: 'block', fontSize: '0.72rem',
    fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: 10,
  },
  holdingsTags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  holdingTag: {
    background: 'rgba(56,189,248,0.08)',
    border: '1px solid rgba(56,189,248,0.20)',
    borderRadius: 99, padding: '4px 12px',
    fontSize: '0.78rem', color: 'var(--blue-300)',
    fontWeight: 500,
  },
  recTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 16,
  },
  recGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  recCard: { padding: '20px', position: 'relative' },
  rankBadge: {
    display: 'inline-block',
    borderRadius: 99, padding: '2px 10px',
    fontSize: '0.72rem', fontWeight: 800,
    letterSpacing: '0.06em',
    marginBottom: 12,
  },
  recName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 4,
  },
  recCode: {
    display: 'block', fontSize: '0.73rem',
    color: 'var(--text-muted)', marginBottom: 16,
    fontFamily: 'monospace',
  },
  probRow: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  probBar: {
    flex: 1, height: 6, borderRadius: 99,
    background: 'var(--dark-600)', overflow: 'hidden',
  },
  probFill: {
    height: '100%', borderRadius: 99,
    boxShadow: '0 0 8px currentColor',
  },
  probLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem', fontWeight: 700,
    minWidth: 44, textAlign: 'right',
  },
};