import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './MobileMenu.css';

const MobileMenu = ({ isOpen, onClose, links, cartCount }) => {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-menu__backdrop ${isOpen ? 'mobile-menu__backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        id="mobile-menu"
        className={`mobile-menu ${isOpen ? 'mobile-menu--open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
      >
        <div className="mobile-menu__header">
          <Link to="/" className="mobile-menu__logo" onClick={onClose} aria-label="BENTORAH — home">
            <img
              src="/bentorah-logo.png"
              alt="BENTORAH"
              className="mobile-menu__logo-img"
            />
          </Link>
          <button className="mobile-menu__close" onClick={onClose} aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="mobile-menu__body">
          {links.map((link, i) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/products'}
              className={({ isActive }) =>
                `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`
              }
              onClick={onClose}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="mobile-menu__footer">
          <Link to="/cart" className="mobile-menu__cart-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            View Cart
            {cartCount > 0 && <span className="mobile-menu__cart-count">{cartCount}</span>}
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileMenu;
