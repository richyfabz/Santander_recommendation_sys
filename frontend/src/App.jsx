// This is the main application component that sets up the routing and layout for the frontend of 
// the Santander Recommender System. It uses React Router to define routes for different pages, 
// including the home page, search page, metrics page, profile page, and about page. 
// The Navbar and Footer components are included in the layout to provide consistent navigation
//  and footer across all pages. The main content area is defined within a <main> tag, where the routed components will be rendered based on the current URL path.
import { BrowserRouter, Routes, Route } from 'react-router-dom' // React Router components for client-side routing
import Navbar        from './components/Navbar' // Navigation bar component that provides links to different pages of the application
import Footer        from './components/Footer' // Footer component that displays at the bottom of the page with copyright and contact information
import HomePage      from './pages/HomePage'    // Home page component that serves as the landing page of the application, providing an overview and introduction to the Santander Recommender System
import SearchPage    from './pages/SearchPage'  // Search page component that allows users to search for products and view personalized recommendations based on their customer ID
import MetricsPage   from './pages/MetricsPage' // Metrics page component that displays performance metrics and analytics related to the recommendation system, such as click-through rates and conversion rates
import ProfilePage   from './pages/ProfilePage' // Profile page component that shows detailed information about a specific customer, including their profile details and personalized product recommendations
import AboutPage     from './pages/AboutPage'  // About page component that provides information about the project, the team behind it, and the technologies used in building the Santander Recommender System
import './index.css'

// Main application component that sets up routing and layout for the frontend of the Santander Recommender System
export default function App() {
  return (
    <BrowserRouter>
      <div className="site-shell">
        <Navbar />
        <main className="site-main">
          <Routes>
            <Route path="/"        element={<HomePage   />} />
            <Route path="/search"  element={<SearchPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/about"   element={<AboutPage  />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}