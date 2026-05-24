
import { Link, useLocation } from 'react-router-dom' // React Router components for navigation and accessing current URL path

// Custom flame-inspired SVG icon — original design, Santander red, legally safe
// The FlameIcon component defines a simple SVG graphic that resembles a flame, using the Santander red color.
//  It consists of two path elements: the first path creates the main flame shape, 
// while the second path adds a subtle highlight to give it depth. The icon is designed to be used in the Navbar as part of the branding for the Santander Recommender System frontend application.
function FlameIcon() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden="true">
      <path
        d="M11 2C11 2 16 7 16 13C16 16.3 14.2 18.5 11 19.5C7.8 18.5 6 16.3 6 13C6 10 8 7.5 9 6C9 6 8 9 10 11C10 8 11 2 11 2Z"
        fill="#A50034"
      />
      <path
        d="M11 19.5C8.5 20.5 7 22.5 7 24.5H15C15 22.5 13.5 20.5 11 19.5Z"
        fill="#A50034"
        opacity="0.6"
      />
    </svg>
  )
}
// Navigation bar component that provides links to different pages of the application, 
// including Home, Recommend, Metrics, and About.
const NAV_LINKS = [
  { to: '/',        label: 'Home'     },
  { to: '/search',  label: 'Recommend' },
  { to: '/metrics', label: 'Metrics'  },
  { to: '/about',   label: 'About'    },
]

// The Navbar component renders a header element that contains the brand logo and name on the left, 
// and a navigation menu on the right. 
export default function Navbar() {
  const { pathname } = useLocation()

  // The component uses the useLocation hook from React Router to access the current URL path,
  //  which allows it to determine which navigation link should be highlighted as active.
  return (
    <header style={styles.header} role="banner">
      <div style={styles.inner}>

        {/* BRAND */}
        <Link to="/" style={styles.brand} aria-label="Home">
          <FlameIcon />
          <div>
            <div style={styles.brandName}>RecSys</div>
            <div style={styles.brandSub}>Santander dataset · ML project</div>
          </div>
        </Link>

        {/*  NAV LINKS  */}
        <nav style={styles.nav} aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to
            return (
              <Link
                key   = {to}
                to    = {to}
                style = {{
                  ...styles.link,
                  color          : active ? '#A50034' : '#3D3D3A',
                  fontWeight     : active ? 600 : 400,
                  borderBottom   : active ? '2px solid #A50034' : '2px solid transparent',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

      </div>
    </header>
  )
}
// Styles for the Navbar component, defined as a JavaScript object. 
// These styles are applied inline to the respective elements in the JSX. 
// The styles include layout properties such as display, flexbox settings, padding, 
// and colors to create a visually appealing and responsive navigation bar.
const styles = {
  header: {
    background  : '#FFFFFF',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    position    : 'sticky',
    top         : 0,
    zIndex      : 100,
    boxShadow   : '0 1px 8px rgba(0,0,0,0.06)',
  },
  inner: {
    maxWidth      : 1080,
    margin        : '0 auto',
    padding       : '0 24px',
    height        : 60,
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display        : 'flex',
    alignItems     : 'center',
    gap            : 10,
    textDecoration : 'none',
  },
  brandName: {
    fontSize    : 17,
    fontWeight  : 700,
    color       : '#1A1A18',
    lineHeight  : 1.1,
    letterSpacing: '-0.01em',
  },
  brandSub: {
    fontSize: 11,
    color   : '#9A9890',
  },
  nav: {
    display: 'flex',
    gap    : 4,
  },
  link: {
    padding       : '4px 12px',
    borderRadius  : '6px 6px 0 0',
    fontSize      : 14,
    textDecoration: 'none',
    transition    : 'color 0.15s ease',
    paddingBottom : 6,
  },
}