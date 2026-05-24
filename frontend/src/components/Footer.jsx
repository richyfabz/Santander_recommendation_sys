// Footer — minimal, on-brand, with links and tech stack credits

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>

        {/* Brand side */}
        <div style={styles.brand}>
          <span style={styles.brandName}>RecSys</span>
          <p style={styles.brandDesc}>
            End-to-end bank product recommendation engine.<br />
            Built on the Santander Kaggle dataset.
          </p>
        </div>

        {/* Nav links */}
        <nav style={styles.nav} aria-label="Footer navigation">
          {[
            { to: '/',        label: 'Home'      },
            { to: '/search',  label: 'Recommend' },
            { to: '/metrics', label: 'Metrics'   },
            { to: '/about',   label: 'About'     },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={styles.link}
                  className="footer-link">
              {label}
            </Link>
          ))}
        </nav>

        {/* Tech stack */}
        <div style={styles.stack}>
          <span style={styles.stackLabel}>Built with</span>
          {['XGBoost', 'Flask', 'React', 'Pandas'].map(t => (
            <span key={t} style={styles.tag}>{t}</span>
          ))}
        </div>
      </div>

      {/* Divider + copyright */}
      <div style={styles.bottom}>
        <span style={styles.copy}>
          © {new Date().getFullYear()} RecSys · Santander dataset · Educational use only
        </span>
      </div>

      <style>{`
        .footer-link:hover {
          color: var(--pink-400) !important;
        }
      `}</style>
    </footer>
  );
}

const styles = {
  footer: {
    background: 'linear-gradient(135deg, var(--grey-900) 0%, #2d1a22 100%)',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: 1160,
    margin: '0 auto',
    padding: '48px 24px 32px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: { flex: '1 1 220px' },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--pink-300)',
    display: 'block',
    marginBottom: 8,
  },
  brandDesc: {
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: 'rgba(255,255,255,0.5)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: '0 0 auto',
  },
  link: {
    color: 'rgba(255,255,255,0.65)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'color 150ms ease',
  },
  stack: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    flex: '1 1 200px',
  },
  stackLabel: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    marginRight: 4,
    width: '100%',
  },
  tag: {
    background: 'rgba(240, 71, 122, 0.18)',
    border: '1px solid rgba(240, 71, 122, 0.30)',
    borderRadius: 99,
    padding: '4px 12px',
    fontSize: '0.78rem',
    color: 'var(--pink-300)',
    fontWeight: 500,
  },
  bottom: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '16px 24px',
    maxWidth: 1160,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
  },
  copy: {
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.3)',
  },
};