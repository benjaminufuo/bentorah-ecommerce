import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './MobileMenu.css';

const MobileMenu = ({
  isOpen,
  onClose,
  links,
  cartCount,
  isAuthenticated,
  currentUser,
  onOpenAuth,
  onSignOut,
}) => {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const userInitial = (
    currentUser?.firstName?.[0] ||
    currentUser?.name?.[0] ||
    'U'
  ).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-menu__backdrop ${
          isOpen ? 'mobile-menu__backdrop--visible' : ''
        }`}
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
          <Link
            to="/"
            className="mobile-menu__logo"
            onClick={onClose}
            aria-label="BENTORAH — home"
          >
            <img
              src="/bentorah-logo.png"
              alt="BENTORAH"
              className="mobile-menu__logo-img"
            />
          </Link>
          <button
            className="mobile-menu__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User Card for Authenticated Users */}
        {isAuthenticated && currentUser && (
          <Link
            to="/orders"
            className="mobile-menu__user-card"
            onClick={onClose}
            aria-label="View your order history and account"
          >
            <div className="mobile-menu__avatar">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div className="mobile-menu__user-info">
              <span className="mobile-menu__user-name">
                {currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Bentorah Member'}
              </span>
              <span className="mobile-menu__user-email">{currentUser.email}</span>
              <span className="mobile-menu__user-action">View Order History &rarr;</span>
            </div>
            <svg
              className="mobile-menu__user-arrow"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}

        <div className="mobile-menu__body">
          {links.map((link, i) => {
            const targetUrl = link.isCategories ? '/products' : link.to;

            return (
              <NavLink
                key={link.to || 'categories'}
                to={targetUrl}
                end={targetUrl === '/products'}
                className={({ isActive }) =>
                  `mobile-menu__link ${
                    isActive ? 'mobile-menu__link--active' : ''
                  }`
                }
                onClick={onClose}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {link.label}
              </NavLink>
            );
          })}
        </div>

        <div className="mobile-menu__footer">
          {/* Cart Button */}
          <Link
            to="/cart"
            className="mobile-menu__cart-btn"
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span>View Cart</span>
            {cartCount > 0 && (
              <span className="mobile-menu__cart-count">{cartCount}</span>
            )}
          </Link>

          {/* Auth Action Button */}
          {!isAuthenticated ? (
            <button
              type="button"
              className="mobile-menu__auth-btn"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Sign In / Register</span>
            </button>
          ) : (
            <button
              type="button"
              className="mobile-menu__auth-btn mobile-menu__auth-btn--signout"
              onClick={() => {
                onClose();
                onSignOut();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default MobileMenu;
