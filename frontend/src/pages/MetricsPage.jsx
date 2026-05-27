// MetricsPage — model performance dashboard
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.08 } } };



const PER_PRODUCT = [
  { name: 'Current Account',      model_accuracy: 0.73, percentage_of_remembrance: 0.87, harmonic_mean: 0.79, support: 609  },
  { name: 'Payroll Account',      model_accuracy: 0.37, percentage_of_remembrance: 0.57, harmonic_mean: 0.45, support: 435  },
  { name: 'Junior Account',       model_accuracy: 1.00, percentage_of_remembrance: 0.88, harmonic_mean: 0.93, support: 8    },
  { name: 'e-Account',            model_accuracy: 0.62, percentage_of_remembrance: 0.68, harmonic_mean: 0.65, support: 487  },
  { name: 'Credit Card',          model_accuracy: 0.66, percentage_of_remembrance: 0.69, harmonic_mean: 0.67, support: 840  },
  { name: 'Payroll',              model_accuracy: 0.13, percentage_of_remembrance: 0.11, harmonic_mean: 0.12, support: 1055 },
  { name: 'Pensions',             model_accuracy: 0.14, percentage_of_remembrance: 0.10, harmonic_mean: 0.12, support: 1096 },
  { name: 'Direct Debit',         model_accuracy: 0.79, percentage_of_remembrance: 0.72, harmonic_mean: 0.75, support: 2011 },
  { name: 'Particular Account',   model_accuracy: 0.30, percentage_of_remembrance: 0.48, harmonic_mean: 0.37, support: 56   },
  { name: 'Taxes',                model_accuracy: 0.10, percentage_of_remembrance: 0.36, harmonic_mean: 0.15, support: 45   },
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
              model accuracy, percentage of remembrance, harmonic mean and support for top products.
            </p>
          </motion.div>

          <div style={styles.tableWrap}>
            {/* Header */}
            <div style={styles.tableHeader}>
              <span style={{ flex: 2 }}>Product</span>
              <span style={styles.col}>Model Accuracy</span>
              <span style={styles.col}>Percentage of Remembrance</span>
              <span style={{ ...styles.col, flex: 1.5 }}>Harmonic Mean</span>
              <span style={styles.col}>Support</span>
            </div>

            {/* Rows */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
            >
              {PER_PRODUCT.map(({ name, model_accuracy, percentage_of_remembrance, harmonic_mean, support }) => {
                const f1Color = harmonic_mean >= 0.65
                  ? 'var(--green-400)'
                  : harmonic_mean >= 0.40
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
                      {model_accuracy.toFixed(2)}
                    </span>
                    <span style={{ ...styles.col, color: 'var(--text-secondary)',
                      fontSize: '0.85rem' }}>
                      {percentage_of_remembrance.toFixed(2)}
                    </span>
                    <span style={{ ...styles.col, flex: 1.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <F1Bar value={harmonic_mean} color={f1Color} />
                        <span style={{ color: f1Color, fontSize: '0.82rem',
                          fontWeight: 700, minWidth: 32 }}>
                          {harmonic_mean.toFixed(2)}
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