// Navbar component — sticky pink navbar with smooth blue hover effects
// Active route gets a pill indicator; mobile-friendly layout

import { Link, useLocation } from 'react-router-dom';

// Navigation links — centralised so adding a route is one-line change
const NAV_LINKS = [
  { to: '/',        label: 'Home'      },
  { to: '/search',  label: 'Recommend' },
  { to: '/metrics', label: 'Metrics'   },
  { to: '/about',   label: 'About'     },
];

// Flame logo mark — uses theme pink, fits navbar contrast
function LogoMark() {
  return (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none"
         aria-hidden="true">
      {/* outer petal */}
      <path
        d="M14 2C14 2 4 10 4 19a10 10 0 0020 0C24 10 14 2 14 2Z"
        fill="rgba(255,255,255,0.25)"
        stroke="white"
        strokeWidth="1.5"
      />
      {/* inner highlight */}
      <path
        d="M14 10C14 10 9 15 9 20a5 5 0 0010 0C19 15 14 10 14 10Z"
        fill="white"
        opacity="0.85"
      />
    </svg>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>

        {/* Brand */}
        <Link to="/" style={styles.brand}>
          <span style={styles.logoWrap}><LogoMark /></span>
          <span style={styles.brandText}>
            <span style={styles.brandName}>RecSys</span>
            <span style={styles.brandSub}>Santander · ML</span>
          </span>
        </Link>

        {/* Links */}
        <ul style={styles.linkList}>
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to ||
              (to !== '/' && pathname.startsWith(to));
            return (
              <li key={to}>
                <Link
                  to={to}
                  style={{
                    ...styles.link,
                    ...(active ? styles.linkActive : {}),
                  }}
                  // inline hover handled via CSS class below
                  className="nav-link"
                >
                  {label}
                  {active && <span style={styles.activePill} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Inline scoped styles for hover — avoids extra CSS file */}
      <style>{`
        .nav-link {
          position: relative;
          transition: background 150ms ease, color 150ms ease !important;
        }
        .nav-link:hover {
          background: rgba(127, 212, 247, 0.22) !important;
          color: #dff3ff !important;
        }
      `}</style>
    </nav>
  );
}

// JS-in-CSS styles — keeps component self-contained
const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'var(--pink-500)',
    boxShadow: 'var(--shadow-nav)',
    // subtle gradient shift across pink spectrum
    backgroundImage: 'linear-gradient(135deg, var(--pink-600) 0%, var(--pink-500) 60%, var(--pink-400) 100%)',
  },
  inner: {
    maxWidth: 1160,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textDecoration: 'none',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(4px)',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
  },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  brandSub: {
    fontSize: '0.68rem',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 400,
    letterSpacing: '0.04em',
  },
  linkList: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    listStyle: 'none',
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    color: 'rgba(255,255,255,0.88)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.93rem',
    letterSpacing: '0.01em',
  },
  linkActive: {
    color: '#ffffff',
    background: 'rgba(255,255,255,0.15)',
    fontWeight: 600,
  },
  activePill: {
    display: 'block',
    width: 20,
    height: 3,
    borderRadius: 99,
    background: 'var(--blue-300)',
  },
};