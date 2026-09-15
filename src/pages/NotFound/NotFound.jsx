import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = '404 — Page Not Found | BENTORAH';
  }, []);

  return (
    <div className="not-found-page" role="main">
      <div className="bentorah-container">
        <div className="not-found__inner">
          <div className="not-found__graphic" aria-hidden="true">
            <span className="not-found__number">4</span>
            <div className="not-found__icon-wrap">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <span className="not-found__number">4</span>
          </div>

          <h1 className="not-found__title">Page not found</h1>
          <p className="not-found__text">
            The page you're looking for has been moved, deleted, or never existed.
            Let's get you back on track.
          </p>

          <div className="not-found__actions">
            <button className="not-found__back-btn" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Go Back
            </button>
            <Link to="/" className="not-found__home-btn">Go to Homepage</Link>
            <Link to="/products" className="not-found__shop-btn">Browse Products</Link>
          </div>

          <div className="not-found__suggestions">
            <p className="not-found__suggestions-label">Popular pages:</p>
            <div className="not-found__suggestions-links">
              <Link to="/products">All Products</Link>
              <Link to="/products?category=audio">Audio</Link>
              <Link to="/products?category=wearables">Wearables</Link>
              <Link to="/products?category=work-essentials">Work Essentials</Link>
              <Link to="/about">About BENTORAH</Link>
              <Link to="/cart">Your Cart</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
