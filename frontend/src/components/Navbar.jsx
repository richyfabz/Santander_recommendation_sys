// Navbar — sticky dark bar with pink accent and blue hover glow
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

// =====================================================================
// STAGE A COLD-START ROUTE PATHWAY REGISTRY
// Injecting the static configuration mapping pointing to /onboarding.
// Placing it between Home and Recommend for intuitive UX workflow design.
// =====================================================================
const NAV_LINKS = [
  { to: '/',            label: 'Home'          },
  { to: '/onboarding',   label: 'New Customer'  }, // <-- ADDED FOR COLD-START STAGE A
  { to: '/search',      label: 'Recommend'     },
  { to: '/metrics',     label: 'Metrics'       },
  { to: '/about',       label: 'About'         },
];

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="rgba(240,71,138,0.15)"
            stroke="rgba(240,71,138,0.4)" strokeWidth="1"/>
      <path d="M16 6C16 6 9 12 9 19a7 7 0 0014 0C23 12 16 6 16 6Z"
            fill="var(--pink-400)" opacity="0.9"/>
      <path d="M16 12C16 12 12 16 12 20a4 4 0 008 0C20 16 16 12 16 12Z"
            fill="white" opacity="0.85"/>
    </svg>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={styles.nav}
    >
      {/* grid line bg */}
      <div style={styles.gridLines} />

      <div style={styles.inner}>
        {/* Brand */}
        <Link to="/" style={styles.brand}>
          <LogoMark />
          <span style={styles.brandText}>
            <span style={styles.brandName}>RecSys</span>
            <span style={styles.brandSub}>Santander · ML</span>
          </span>
        </Link>

        {/* Links */}
        <ul style={styles.linkList}>
          {NAV_LINKS.map(({ to, label }) => {
            // Evaluates path matching to highlight the active tab state.
            // If the active URI maps directly to '/onboarding', it activates cleanly.
            const active = pathname === to ||
              (to !== '/' && pathname.startsWith(to));
            return (
              <li key={to} style={{ position: 'relative' }}>
                <Link to={to} style={{
                  ...styles.link,
                  color: active ? '#fff' : 'rgba(245,238,241,0.65)',
                  background: active
                    ? 'rgba(240,71,138,0.15)'
                    : 'transparent',
                  border: active
                    ? '1px solid rgba(240,71,138,0.35)'
                    : '1px solid transparent',
                }}
                  className="nav-link-item"
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      style={styles.activeDot}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Live indicator */}
        <div style={styles.liveChip}>
          <span style={styles.liveDot} />
          Live
        </div>
      </div>

      <style>{`
        .nav-link-item {
          transition: color 150ms ease, background 150ms ease,
                      border-color 150ms ease !important;
        }
        .nav-link-item:hover {
          color: var(--blue-200) !important;
          background: rgba(56, 189, 248, 0.10) !important;
          border-color: rgba(56, 189, 248, 0.25) !important;
        }
      `}</style>
    </motion.nav>
  );
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(17, 13, 15, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(240,71,138,0.12)',
    overflow: 'hidden',
  },
  gridLines: {
    position: 'absolute', inset: 0,
    backgroundImage:
      'linear-gradient(rgba(240,71,138,0.03) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgba(240,71,138,0.03) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
  inner: {
    maxWidth: 1160, margin: '0 auto',
    padding: '0 24px', height: 64,
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  brand: {
    display: 'flex', alignItems: 'center',
    gap: 12, textDecoration: 'none',
  },
  brandText: {
    display: 'flex', flexDirection: 'column', lineHeight: 1.15,
  },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem', fontWeight: 800,
    color: '#fff', letterSpacing: '-0.01em',
  },
  brandSub: {
    fontSize: '0.65rem', color: 'var(--text-muted)',
    fontWeight: 400, letterSpacing: '0.06em',
  },
  linkList: {
    display: 'flex', alignItems: 'center',
    gap: 4, listStyle: 'none',
  },
  link: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 16px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600, fontSize: '0.88rem',
    textDecoration: 'none',
    letterSpacing: '0.01em',
    position: 'relative',
  },
  activeDot: {
    display: 'block', width: 5, height: 5,
    borderRadius: '50%', background: 'var(--pink-400)',
    boxShadow: '0 0 8px var(--pink-400)',
  },
  liveChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 99,
    background: 'rgba(52, 211, 153, 0.08)',
    border: '1px solid rgba(52, 211, 153, 0.25)',
    fontSize: '0.75rem', fontWeight: 600,
    color: 'var(--green-400)',
    letterSpacing: '0.04em',
  },
  liveDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--green-400)',
    boxShadow: '0 0 8px var(--green-400)',
    animation: 'pulse 2s infinite',
  },
};