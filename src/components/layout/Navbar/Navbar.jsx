import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCartCount } from '../../../redux/cartSlice';
import MobileMenu from '../MobileMenu/MobileMenu';
import './Navbar.css';

const BentorahLogo = () => (
  <Link to="/" className="bentorah-navbar__logo" aria-label="BENTORAH — home">
    <img
      src="/bentorah-logo.png"
      alt="BENTORAH"
      className="bentorah-navbar__logo-img"
    />
  </Link>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const navLinks = [
  { label: 'Shop', to: '/products' },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Deals', to: '/deals' },
  { label: 'About', to: '/about' },
];

const Navbar = () => {
  const cartCount = useSelector(selectCartCount);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className={`bentorah-navbar${scrolled ? ' bentorah-navbar--scrolled' : ''}`} role="banner">
        <div className="bentorah-container bentorah-navbar__inner">
          <BentorahLogo />

          {/* Desktop nav */}
          <nav className="bentorah-navbar__nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/products'}
                className={({ isActive }) =>
                  `bentorah-navbar__link${isActive ? ' bentorah-navbar__link--active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="bentorah-navbar__actions">
            {/* Search — desktop */}
            <div className={`bentorah-navbar__search-wrap ${searchOpen ? 'bentorah-navbar__search-wrap--open' : ''}`}>
              {searchOpen ? (
                <form className="bentorah-navbar__search-form" onSubmit={handleSearch} role="search">
                  <label htmlFor="navbar-search" className="sr-only">Search products</label>
                  <input
                    id="navbar-search"
                    ref={searchRef}
                    type="search"
                    className="bentorah-navbar__search-input"
                    placeholder="Search products…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                  <button type="submit" className="bentorah-navbar__icon-btn" aria-label="Submit search">
                    <SearchIcon />
                  </button>
                </form>
              ) : (
                <button
                  className="bentorah-navbar__icon-btn hide-mobile"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                  aria-expanded={searchOpen}
                >
                  <SearchIcon />
                </button>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className="bentorah-navbar__cart" aria-label={`Shopping cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}`}>
              <CartIcon />
              {cartCount > 0 && (
                <span className="bentorah-navbar__cart-badge" aria-hidden="true">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              className="bentorah-navbar__menu-btn hide-desktop"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={navLinks}
        cartCount={cartCount}
      />
    </>
  );
};

export default Navbar;
