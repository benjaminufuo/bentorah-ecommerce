import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartCount } from '../../../redux/cartSlice';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  authSignOut,
} from '../../../redux/authSlice';
import { signOut as authServiceSignOut } from '../../../services/authService';
import { getCategories } from '../../../services/productService';
import { useToast } from '../../ui/Toast/ToastContext';
import AuthModal from '../../auth/AuthModal/AuthModal';
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const cartCount = useSelector(selectCartCount);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);

  const searchRef = useRef(null);
  const accountMenuRef = useRef(null);
  const categoriesMenuRef = useRef(null);

  // Load categories for dropdown
  useEffect(() => {
    getCategories().then(setCategoriesList).catch(console.error);
  }, []);

  // Open modal if redirected from protected route
  useEffect(() => {
    if (location.state?.openAuth && !isAuthenticated) {
      setAuthModalOpen(true);
    }
  }, [location.state, isAuthenticated]);

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

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(e.target)) {
        setCategoriesOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setAccountMenuOpen(false);
        setCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await authServiceSignOut();
    dispatch(authSignOut());
    setAccountMenuOpen(false);
    setMenuOpen(false);
    toast.success('Signed out successfully.');

    // If on a protected route, redirect to home
    if (location.pathname.startsWith('/orders')) {
      navigate('/');
    }
  };

  // Conditional Navigation Links:
  // Guest: Shop, Categories, Deals, New Arrivals, About
  // Logged-in: Shop, Categories, Deals, New Arrivals, Order History
  const navLinks = [
    { label: 'Shop', to: '/products' },
    { label: 'Categories', isCategories: true },
    { label: 'Deals', to: '/deals' },
    { label: 'New Arrivals', to: '/new-arrivals' },
    ...(isAuthenticated
      ? [{ label: 'Order History', to: '/orders' }]
      : [{ label: 'About', to: '/about' }]),
  ];

  // First name for greeting
  const userGreeting =
    currentUser?.firstName ||
    currentUser?.name?.split(' ')[0] ||
    'Member';

  const userInitial = (
    currentUser?.firstName?.[0] ||
    currentUser?.name?.[0] ||
    'U'
  ).toUpperCase();

  return (
    <>
      <header
        className={`bentorah-navbar${scrolled ? ' bentorah-navbar--scrolled' : ''}`}
        role="banner"
      >
        <div className="bentorah-container bentorah-navbar__inner">
          <BentorahLogo />

          {/* Desktop nav */}
          <nav className="bentorah-navbar__nav" aria-label="Main navigation">
            {navLinks.map((link) => {
              if (link.isCategories) {
                return (
                  <div
                    key="categories-dropdown"
                    className="bentorah-navbar__cat-wrap"
                    ref={categoriesMenuRef}
                  >
                    <button
                      type="button"
                      className={`bentorah-navbar__link bentorah-navbar__cat-btn ${
                        categoriesOpen ? 'bentorah-navbar__link--active' : ''
                      }`}
                      onClick={() => setCategoriesOpen((prev) => !prev)}
                      aria-expanded={categoriesOpen}
                      aria-haspopup="true"
                    >
                      <span>Categories</span>
                      <svg
                        className={`bentorah-navbar__cat-chevron ${
                          categoriesOpen ? 'bentorah-navbar__cat-chevron--open' : ''
                        }`}
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {categoriesOpen && (
                      <div className="bentorah-navbar__cat-menu" role="menu">
                        {categoriesList.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/products?category=${cat.id}`}
                            className="bentorah-navbar__cat-item"
                            role="menuitem"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            <span className="bentorah-navbar__cat-icon">{cat.icon}</span>
                            <div className="bentorah-navbar__cat-text">
                              <span className="bentorah-navbar__cat-title">{cat.label}</span>
                              <span className="bentorah-navbar__cat-count">{cat.count} products</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/products'}
                  className={({ isActive }) =>
                    `bentorah-navbar__link${
                      isActive ? ' bentorah-navbar__link--active' : ''
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="bentorah-navbar__actions">
            {/* Search — desktop */}
            <div
              className={`bentorah-navbar__search-wrap ${
                searchOpen ? 'bentorah-navbar__search-wrap--open' : ''
              }`}
            >
              {searchOpen ? (
                <form
                  className="bentorah-navbar__search-form"
                  onSubmit={handleSearch}
                  role="search"
                >
                  <label htmlFor="navbar-search" className="sr-only">
                    Search products
                  </label>
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
                  <button
                    type="submit"
                    className="bentorah-navbar__icon-btn"
                    aria-label="Submit search"
                  >
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

            {/* Authentication Action */}
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="bentorah-navbar__auth-btn"
                  onClick={() => setAuthModalOpen(true)}
                  aria-label="Sign in to your account"
                >
                  <UserIcon />
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  className="bentorah-navbar__auth-mobile-btn"
                  onClick={() => setAuthModalOpen(true)}
                  aria-label="Sign in to your account"
                >
                  <UserIcon />
                </button>
              </>
            ) : (
              <div
                className="bentorah-navbar__account-wrap"
                ref={accountMenuRef}
              >
                {/* Desktop Account Button */}
                <button
                  type="button"
                  className="bentorah-navbar__account-btn"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                  aria-label="Account menu"
                >
                  <span className="bentorah-navbar__avatar-circle">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt=""
                        className="bentorah-navbar__avatar-img"
                      />
                    ) : (
                      userInitial
                    )}
                  </span>
                  <span className="bentorah-navbar__account-name">
                    Hi, {userGreeting}
                  </span>
                  <svg
                    className={`bentorah-navbar__chevron ${
                      accountMenuOpen ? 'bentorah-navbar__chevron--open' : ''
                    }`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Mobile Account Button (Circular Avatar) */}
                <button
                  type="button"
                  className="bentorah-navbar__account-mobile-btn"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                  aria-label="Account menu"
                >
                  <span className="bentorah-navbar__avatar-circle bentorah-navbar__avatar-circle--mobile">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt=""
                        className="bentorah-navbar__avatar-img"
                      />
                    ) : (
                      userInitial
                    )}
                  </span>
                </button>

                {/* Account Dropdown */}
                {accountMenuOpen && (
                  <div
                    className="bentorah-navbar__account-dropdown"
                    role="menu"
                  >
                    <div className="bentorah-navbar__dropdown-header">
                      <strong className="bentorah-navbar__dropdown-name">
                        {currentUser?.name ||
                          `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
                          'Bentorah Member'}
                      </strong>
                      <span className="bentorah-navbar__dropdown-email">
                        {currentUser?.email}
                      </span>
                    </div>

                    <div className="bentorah-navbar__dropdown-divider" />

                    <Link
                      to="/orders"
                      className="bentorah-navbar__dropdown-link"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <svg
                        width="16"
                        height="16"
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
                      <span>Order History</span>
                    </Link>

                    <div className="bentorah-navbar__dropdown-divider" />

                    <button
                      type="button"
                      className="bentorah-navbar__dropdown-link bentorah-navbar__dropdown-link--signout"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="bentorah-navbar__cart"
              aria-label={`Shopping cart — ${cartCount} item${
                cartCount !== 1 ? 's' : ''
              }`}
            >
              <CartIcon />
              {cartCount > 0 && (
                <span
                  className="bentorah-navbar__cart-badge"
                  aria-hidden="true"
                >
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

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={navLinks}
        cartCount={cartCount}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
