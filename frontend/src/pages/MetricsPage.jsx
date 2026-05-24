// MetricsPage — model performance dashboard
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const METRICS = [
  { label: 'MAP@7',          value: '0.699', sub: 'Validation set',    color: 'var(--pink-400)'  },
  { label: 'AUC-ROC',        value: '0.894', sub: 'Multi-class OVR',   color: 'var(--blue-400)'  },
  { label: 'Best Logloss',   value: '1.138', sub: 'Val log-loss',      color: 'var(--green-400)' },
  { label: 'Best Iteration', value: '476',   sub: 'Early stop @ 477',  color: 'var(--amber-400)' },
  { label: 'Train Rows',     value: '27,096', sub: '80% split',        color: 'var(--pink-300)'  },
  { label: 'Val Rows',       value: '6,774',  sub: '20% split',        color: 'var(--blue-300)'  },
];

const PER_PRODUCT = [
  { name: 'Current Account',      precision: 0.73, recall: 0.87, f1: 0.79, support: 609  },
  { name: 'Payroll Account',      precision: 0.37, recall: 0.57, f1: 0.45, support: 435  },
  { name: 'Junior Account',       precision: 1.00, recall: 0.88, f1: 0.93, support: 8    },
  { name: 'e-Account',            precision: 0.62, recall: 0.68, f1: 0.65, support: 487  },
  { name: 'Credit Card',          precision: 0.66, recall: 0.69, f1: 0.67, support: 840  },
  { name: 'Payroll',              precision: 0.13, recall: 0.11, f1: 0.12, support: 1055 },
  { name: 'Pensions',             precision: 0.14, recall: 0.10, f1: 0.12, support: 1096 },
  { name: 'Direct Debit',         precision: 0.79, recall: 0.72, f1: 0.75, support: 2011 },
  { name: 'Particular Account',   precision: 0.30, recall: 0.48, f1: 0.37, support: 56   },
  { name: 'Taxes',                precision: 0.10, recall: 0.36, f1: 0.15, support: 45   },
];

function F1Bar({ value, color }) {
  return (
    <div style={styles.f1Track}>
      <motion.div
        style={{ ...styles.f1Fill, background: color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${(value * 100).toFixed(0)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export default function MetricsPage() {
  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <section style={styles.header}>
        <div className="grid-bg" />
        <div style={styles.orb} />
        <div className="container" style={{ position: 'relative' }}>
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}>
              <span className="badge">Model Evaluation</span>
            </motion.div>
            <motion.h1 variants={fadeUp} style={styles.title}>
              Performance <span className="gradient-text">Metrics</span>
            </motion.h1>
            <motion.p variants={fadeUp} style={styles.sub}>
              XGBoost multi-class classifier evaluation on 6,774 validation
              rows across 24 product classes.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Top metrics ── */}
      <section className="page-section container">
        <motion.div
          variants={stagger} initial="hidden"
          whileInView="show" viewport={{ once: true, amount: 0.2 }}
          style={styles.metricsGrid}
        >
          {METRICS.map(({ label, value, sub, color }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              whileHover={{
                y: -5, scale: 1.03,
                transition: { type: 'spring', stiffness: 300, damping: 20 },
              }}
              className="card"
              style={styles.metricCard}
            >
              <div style={{ ...styles.metricAccent, background: color }} />
              <span style={{ ...styles.metricValue, color }}>{value}</span>
              <span style={styles.metricLabel}>{label}</span>
              <span style={styles.metricSub}>{sub}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Per-product table ── */}
      <section style={styles.tableSection}>
        <div className="divider" />
        <div className="container" style={{ padding: '64px 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">
              Per-Product <span className="gradient-text">Performance</span>
            </h2>
            <p className="section-subtitle">
              Precision, recall, F1-score and support for top products.
            </p>
          </motion.div>

          <div style={styles.tableWrap}>
            {/* Header */}
            <div style={styles.tableHeader}>
              <span style={{ flex: 2 }}>Product</span>
              <span style={styles.col}>Precision</span>
              <span style={styles.col}>Recall</span>
              <span style={{ ...styles.col, flex: 1.5 }}>F1</span>
              <span style={styles.col}>Support</span>
            </div>

            {/* Rows */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
            >
              {PER_PRODUCT.map(({ name, precision, recall, f1, support }) => {
                const f1Color = f1 >= 0.65
                  ? 'var(--green-400)'
                  : f1 >= 0.40
                  ? 'var(--amber-400)'
                  : 'var(--pink-400)';
                return (
                  <motion.div
                    key={name}
                    variants={fadeUp}
                    style={styles.tableRow}
                    whileHover={{
                      background: 'var(--dark-600)',
                      transition: { duration: 0.12 },
                    }}
                  >
                    <span style={{ flex: 2, color: 'var(--text-primary)',
                      fontWeight: 500, fontSize: '0.88rem' }}>
                      {name}
                    </span>
                    <span style={{ ...styles.col, color: 'var(--text-secondary)',
                      fontSize: '0.85rem' }}>
                      {precision.toFixed(2)}
                    </span>
                    <span style={{ ...styles.col, color: 'var(--text-secondary)',
                      fontSize: '0.85rem' }}>
                      {recall.toFixed(2)}
                    </span>
                    <span style={{ ...styles.col, flex: 1.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <F1Bar value={f1} color={f1Color} />
                        <span style={{ color: f1Color, fontSize: '0.82rem',
                          fontWeight: 700, minWidth: 32 }}>
                          {f1.toFixed(2)}
                        </span>
                      </div>
                    </span>
                    <span style={{ ...styles.col, color: 'var(--text-muted)',
                      fontSize: '0.82rem' }}>
                      {support.toLocaleString()}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Overall row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={styles.overallRow}
          >
            <span style={styles.overallLabel}>Overall Accuracy</span>
            <span style={styles.overallValue}>0.51</span>
            <span style={styles.overallSub}>across 6,774 validation samples</span>
          </motion.div>
        </div>
        <div className="divider" />
      </section>

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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: 18,
  },
  metricCard: {
    padding: '24px 20px',
    display: 'flex', flexDirection: 'column',
    gap: 4, position: 'relative', overflow: 'hidden',
    textAlign: 'center',
  },
  metricAccent: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, borderRadius: '20px 20px 0 0',
  },
  metricValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem', fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  metricLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem', fontWeight: 700,
    color: 'var(--text-primary)',
  },
  metricSub: {
    fontSize: '0.75rem', color: 'var(--text-muted)',
  },
  tableSection: { background: 'var(--dark-800)' },
  tableWrap: {
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex', alignItems: 'center',
    padding: '12px 20px',
    background: 'var(--dark-600)',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  tableRow: {
    display: 'flex', alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background 120ms ease',
    cursor: 'default',
  },
  col: {
    flex: 1, textAlign: 'right',
  },
  f1Track: {
    flex: 1, height: 6, borderRadius: 99,
    background: 'var(--dark-900)', overflow: 'hidden',
    minWidth: 60,
  },
  f1Fill: { height: '100%', borderRadius: 99 },
  overallRow: {
    display: 'flex', alignItems: 'center',
    gap: 16, padding: '20px',
    marginTop: 16,
    background: 'rgba(240,71,138,0.05)',
    border: '1px solid rgba(240,71,138,0.15)',
    borderRadius: 'var(--radius-md)',
  },
  overallLabel: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700, color: 'var(--text-secondary)',
  },
  overallValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem', fontWeight: 800,
    color: 'var(--pink-400)',
  },
  overallSub: {
    fontSize: '0.82rem', color: 'var(--text-muted)',
  },
};