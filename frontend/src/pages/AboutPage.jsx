// AboutPage — project overview, pipeline cards, tech stack
/**
 * const NOTEBOOKS = [
  { nb: 'ST', title: 'Data Ingestion',
    color: 'var(--pink-400)' },
  
  { nb: 'ST', title: 'Target Engineering',
    color: 'var(--green-400)' },

  { nb: 'ST', title: 'Feature Engineering',
    color: 'var(--amber-400)' },

  { nb: 'ST', title: 'Model Training',
    color: 'var(--blue-300)' },

  { nb: 'ST', title: 'Evaluation',
    color: 'var(--green-400)' },

  { nb: 'ST', title: 'Frontend & API',
    color: 'var(--amber-400)' },
];
 */
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.09 } } };

const NOTEBOOKS = [
  { nb: 'ST', title: 'Data Ingestion',
    color: 'var(--pink-400)' },

  { nb: 'ST', title: 'Cohort Selection',
    color: 'var(--blue-400)' },

  { nb: 'ST', title: 'Target Engineering',
    color: 'var(--green-400)' },

  { nb: 'ST', title: 'Feature Engineering',
    color: 'var(--amber-400)' },
  { nb: 'ST', title: 'Split & Formatting',
    color: 'var(--pink-300)' },
  { nb: 'ST', title: 'Model Training',
    color: 'var(--blue-300)' },
  { nb: 'ST', title: 'Evaluation',
    color: 'var(--green-400)' },
  { nb: 'ST', title: 'Monitoring Simulation',
    color: 'var(--amber-400)' },
];



export default function AboutPage() {
  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        <div className="grid-bg" />
        <div style={styles.orb} />
        <div className="container" style={{ position: 'relative' }}>
          <motion.div
            variants={stagger} initial="hidden" animate="show"
          >
            <motion.div variants={fadeUp}>
              <span className="badge">About this project</span>
            </motion.div>
            <motion.h1 variants={fadeUp} style={styles.title}>
              About <span className="gradient-text">RecSys</span>
            </motion.h1>
            <motion.p variants={fadeUp} style={styles.sub}>
              An end-to-end bank product recommendation system built on the{' '}
              <span style={{ color: 'var(--pink-300)' }}>
                Santander Product Recommendation dataset.
              </span>{' '}
              The project includes data processing, model training, evaluation, and a frontend for exploring personalized recommendations.
            </motion.p>

           
          </motion.div>
        </div>
      </section>

      {/* ── Pipeline notebooks ── */}
      <section className="page-section container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">
            Pipeline  <span className="gradient-text">8 pipeline Stages</span>
          </h2>
          <p className="section-subtitle">
            Every stage is documented, cell-by-cell, with markdown explanations
            and detailed code comments.
          </p>
        </motion.div>

        <motion.div
          style={styles.nbGrid}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {NOTEBOOKS.map(({ nb, title, desc, color }) => (
            <motion.div
              key={nb}
              variants={fadeUp}
              whileHover={{
                y: -5, scale: 1.015,
                transition: { type: 'spring', stiffness: 280, damping: 18 },
              }}
              className="card"
              style={styles.nbCard}
            >
              <div style={{ ...styles.nbAccent, background: color }} />
              <span style={{ ...styles.nbBadge, color, borderColor: color + '40' }}>
                {nb}
              </span>
              <h3 style={styles.nbTitle}>{title}</h3>
              <p style={styles.nbDesc}>{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
      

    </main>
  );
}

const styles = {
  hero: {
    position: 'relative', overflow: 'hidden',
    padding: '80px 0 72px',
    background: 'var(--dark-800)',
  },
  orb: {
    position: 'absolute', top: -100, right: -60,
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,71,138,0.12) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.2rem, 4vw, 3.6rem)',
    fontWeight: 800, lineHeight: 1.1,
    color: 'var(--text-primary)',
    margin: '20px 0 16px',
    letterSpacing: '-0.02em',
  },
  sub: {
    fontSize: '1rem', color: 'var(--text-muted)',
    maxWidth: 620, lineHeight: 1.75, marginBottom: 28,
  },
  disclaimer: {
    display: 'flex', gap: 14, alignItems: 'flex-start',
    background: 'rgba(240,71,138,0.06)',
    border: '1px solid rgba(240,71,138,0.18)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px', maxWidth: 620,
  },
  disclaimerIcon: { fontSize: '1rem', flexShrink: 0, marginTop: 1 },
  disclaimerText: {
    fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65,
  },

  /* Notebooks */
  nbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 20,
  },
  nbCard: {
    padding: '24px', position: 'relative', overflow: 'hidden',
  },
  nbAccent: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, borderRadius: '20px 20px 0 0',
  },
  nbBadge: {
    display: 'inline-block',
    fontSize: '0.72rem', fontWeight: 800,
    letterSpacing: '0.1em',
    border: '1px solid', borderRadius: 99,
    padding: '2px 10px', marginBottom: 12,
    fontFamily: 'var(--font-display)',
  },
  nbTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 8,
  },
  nbDesc: {
    fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.68,
  },

  /* Stack */
  stackSection: { background: 'var(--dark-800)' },
  stackGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
  },
  stackCard: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '20px',
    background: 'var(--dark-700)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    transition: 'border-color 150ms ease, transform 150ms ease',
    cursor: 'default',
  },
  stackName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 700,
  },
  stackRole: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },
};