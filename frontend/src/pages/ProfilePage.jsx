// ProfilePage — individual customer profile and recommendations
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getRecommendations } from '../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const PRODUCT_NAMES = {
  ind_ahor_fin_ult1: 'Saving Account',    ind_aval_fin_ult1: 'Guarantees',
  ind_cco_fin_ult1:  'Current Account',   ind_cder_fin_ult1: 'Derivada Account',
  ind_cno_fin_ult1:  'Payroll Account',   ind_ctju_fin_ult1: 'Junior Account',
  ind_ctma_fin_ult1: 'Más Particular',    ind_ctop_fin_ult1: 'Particular Account',
  ind_ctpp_fin_ult1: 'Particular Plus',   ind_deco_fin_ult1: 'Short-term Deposits',
  ind_deme_fin_ult1: 'Medium Deposits',   ind_dela_fin_ult1: 'Long-term Deposits',
  ind_ecue_fin_ult1: 'e-Account',         ind_fond_fin_ult1: 'Funds',
  ind_hip_fin_ult1:  'Mortgage',          ind_plan_fin_ult1: 'Pension Plan',
  ind_pres_fin_ult1: 'Loans',             ind_reca_fin_ult1: 'Taxes',
  ind_tjcr_fin_ult1: 'Credit Card',       ind_valo_fin_ult1: 'Securities',
  ind_viv_fin_ult1:  'Home Account',      ind_nomina_ult1:   'Payroll',
  ind_nom_pens_ult1: 'Pensions',          ind_recibo_ult1:   'Direct Debit',
};

function getProbColor(p) {
  if (p >= 0.6) return 'var(--green-400)';
  if (p >= 0.35) return 'var(--amber-400)';
  return 'var(--pink-400)';
}

export default function ProfilePage() {
  const { id } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

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
          <h1 style={styles.title}>
            Customer <span className="gradient-text">#{id}</span>
          </h1>
        </div>
      </section>

      <div className="container" style={{ padding: '48px 24px' }}>

        {/* Loading */}
        {loading && (
          <div style={styles.loadingWrap}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={styles.spinner}
            />
            <span style={{ color: 'var(--text-muted)' }}>
              Querying model...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
            <Link to="/search" style={{ color: 'var(--pink-400)',
              marginLeft: 12 }}>
              Try another ID
            </Link>
          </div>
        )}

        {/* Profile */}
        {data && !loading && (
          <motion.div
            variants={stagger} initial="hidden" animate="show"
          >
            {/* Current holdings */}
            {data.current_products?.length > 0 && (
              <motion.div variants={fadeUp} style={styles.holdingsCard}>
                <h2 style={styles.sectionHead}>Current Holdings</h2>
                <div style={styles.holdingsTags}>
                  {data.current_products.map(p => (
                    <motion.span
                      key={p}
                      whileHover={{ scale: 1.05 }}
                      style={styles.holdingTag}
                    >
                      {PRODUCT_NAMES[p] || p}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recommendations */}
            <motion.div variants={fadeUp}>
              <h2 style={{ ...styles.sectionHead, marginBottom: 16 }}>
                Top Recommendations
              </h2>
            </motion.div>

            <motion.div
              style={styles.recGrid}
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {data.recommendations?.map(({ product, probability }, i) => (
                <motion.div
                  key={product}
                  variants={fadeUp}
                  whileHover={{
                    y: -5, scale: 1.02,
                    transition: { type: 'spring', stiffness: 280, damping: 18 },
                  }}
                  className="card"
                  style={styles.recCard}
                >
                  <div style={{
                    ...styles.recAccent,
                    background: getProbColor(probability),
                  }} />
                  <span style={{
                    ...styles.rankBadge,
                    background: i === 0 ? 'var(--pink-400)' : 'var(--dark-600)',
                    color: i === 0 ? '#fff' : 'var(--text-muted)',
                  }}>#{i + 1}</span>
                  <h3 style={styles.recName}>
                    {PRODUCT_NAMES[product] || product}
                  </h3>
                  <code style={styles.recCode}>{product}</code>
                  <div style={styles.probRow}>
                    <div style={styles.probBar}>
                      <motion.div
                        style={{
                          ...styles.probFill,
                          background: getProbColor(probability),
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(probability * 100).toFixed(1)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                    <span style={{
                      ...styles.probPct,
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
    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
    fontWeight: 800, letterSpacing: '-0.02em',
    color: 'var(--text-primary)',
  },
  loadingWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16,
    padding: '80px 0', color: 'var(--text-muted)',
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid var(--border-card)',
    borderTopColor: 'var(--pink-400)',
  },
  errorBox: {
    background: 'rgba(240,71,138,0.08)',
    border: '1px solid rgba(240,71,138,0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px', color: 'var(--pink-300)',
    fontSize: '0.9rem',
  },
  holdingsCard: {
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px', marginBottom: 36,
  },
  sectionHead: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 16,
  },
  holdingsTags: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  holdingTag: {
    background: 'rgba(56,189,248,0.08)',
    border: '1px solid rgba(56,189,248,0.20)',
    borderRadius: 99, padding: '5px 14px',
    fontSize: '0.82rem', color: 'var(--blue-300)',
    fontWeight: 500, cursor: 'default',
  },
  recGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
  },
  recCard: { padding: '20px', position: 'relative', overflow: 'hidden' },
  recAccent: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, borderRadius: '20px 20px 0 0',
  },
  rankBadge: {
    display: 'inline-block', borderRadius: 99,
    padding: '2px 10px', fontSize: '0.72rem',
    fontWeight: 800, letterSpacing: '0.06em', marginBottom: 12,
  },
  recName: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.98rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 4,
  },
  recCode: {
    display: 'block', fontSize: '0.72rem',
    color: 'var(--text-muted)', marginBottom: 16,
  },
  probRow: { display: 'flex', alignItems: 'center', gap: 10 },
  probBar: {
    flex: 1, height: 6, borderRadius: 99,
    background: 'var(--dark-600)', overflow: 'hidden',
  },
  probFill: { height: '100%', borderRadius: 99 },
  probPct: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem', fontWeight: 700,
    minWidth: 44, textAlign: 'right',
  },
};