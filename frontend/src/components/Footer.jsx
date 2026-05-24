// Footer — dark, minimal, on-brand
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LINKS = [
  { to: '/',        label: 'Home'      },
  { to: '/search',  label: 'Recommend' },
  { to: '/metrics', label: 'Metrics'   },
  { to: '/about',   label: 'About'     },
];

const STACK = ['XGBoost', 'Flask', 'React', 'Pandas', 'Framer Motion'];

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="divider" />
      <div style={styles.inner}>

        {/* Brand */}
        <div style={styles.brand}>
          <span style={styles.brandName}>RecSys</span>
          <p style={styles.brandDesc}>
            End-to-end bank product recommendation engine
            built on the Santander Kaggle dataset.
            MAP@7 score of 0.699 on validation set.
          </p>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          <span style={styles.navLabel}>Pages</span>
          {LINKS.map(({ to, label }) => (
            <Link key={to} to={to} style={styles.link}
                  className="footer-link">
              {label}
            </Link>
          ))}
        </nav>

        {/* Stack */}
        <div style={styles.stackCol}>
          <span style={styles.navLabel}>Built with</span>
          <div style={styles.tags}>
            {STACK.map(t => (
              <motion.span
                key={t}
                whileHover={{ scale: 1.06, borderColor: 'var(--pink-400)' }}
                style={styles.tag}
              >
                {t}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={styles.bottom}>
        <span style={styles.copy}>
          © {new Date().getFullYear()} RecSys · Educational use only ·
          Not affiliated with Banco Santander S.A.
        </span>
      </div>

      <style>{`
        .footer-link:hover { color: var(--pink-400) !important; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </footer>
  );
}

const styles = {
  footer: {
    background: 'var(--dark-950)',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: 1160, margin: '0 auto',
    padding: '56px 24px 40px',
    display: 'flex', flexWrap: 'wrap',
    gap: 48, justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: { flex: '1 1 260px', maxWidth: 320 },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem', fontWeight: 800,
    color: 'var(--pink-400)',
    display: 'block', marginBottom: 12,
  },
  brandDesc: {
    fontSize: '0.85rem', lineHeight: 1.7,
    color: 'var(--text-muted)',
  },
  nav: {
    display: 'flex', flexDirection: 'column',
    gap: 10, flex: '0 0 auto',
  },
  navLabel: {
    fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--grey-500)', marginBottom: 4,
  },
  link: {
    color: 'var(--text-muted)',
    textDecoration: 'none', fontSize: '0.9rem',
    transition: 'color 150ms ease',
  },
  stackCol: { flex: '1 1 200px' },
  tags: {
    display: 'flex', flexWrap: 'wrap', gap: 8,
    marginTop: 8,
  },
  tag: {
    background: 'rgba(240,71,138,0.08)',
    border: '1px solid rgba(240,71,138,0.20)',
    borderRadius: 99, padding: '4px 12px',
    fontSize: '0.78rem', color: 'var(--pink-300)',
    fontWeight: 500, cursor: 'default',
    transition: 'border-color 150ms ease',
  },
  bottom: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    padding: '16px 24px',
    display: 'flex', justifyContent: 'center',
  },
  copy: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
  },
};