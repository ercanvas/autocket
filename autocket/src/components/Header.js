import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const user = auth.currentUser;
  // Ortada başlık sadece landing page'de gösterilecek
  const isLanding = location.pathname === '/' || location.pathname === '/home';

  return (
    <header className="main-header">
      <nav className="header-nav">
        <div className="header-left">
          <Link to="/" className="header-logo">autocket 23</Link>
          <Link to="/add-vehicle" className="header-link">Add Vehicle</Link>
        </div>
        <div className="header-center">
          {/* Ortada başlık sadece landingde */}
        </div>
        <div className="header-right">
        <Link to="/vehicles" className="header-link">Vehicles</Link>
          {user ? (
            <Link to="/profile" className="header-btn">Profile</Link>
          ) : (
            <Link to="/auth" className="header-btn">Sign In</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
