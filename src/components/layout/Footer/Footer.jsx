import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bentorah-footer" role="contentinfo">
      <div className="bentorah-container">
        <div className="bentorah-footer__grid">
          {/* Brand column */}
          <div className="bentorah-footer__brand">
            <Link to="/" className="bentorah-footer__logo" aria-label="BENTORAH — home">
              <img
                src="/bentorah-logo-white.png"
                alt="BENTORAH"
                className="bentorah-footer__logo-img"
              />
            </Link>
            <p className="bentorah-footer__desc">Curated electronics and accessories for work, play, and life. Delivered with care.</p>
          </div>

          {/* Shop column */}
          <div className="bentorah-footer__col">
            <h3 className="bentorah-footer__heading">Shop</h3>
            <ul className="bentorah-footer__links">
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?category=audio">Audio</Link></li>
              <li><Link to="/products?category=wearables">Wearables</Link></li>
              <li><Link to="/products?category=gaming">Gaming</Link></li>
              <li><Link to="/products?category=work-essentials">Work Essentials</Link></li>
              <li><Link to="/new-arrivals">New Arrivals</Link></li>
              <li><Link to="/deals">Deals</Link></li>
            </ul>
          </div>

          {/* Company column */}
          <div className="bentorah-footer__col">
            <h3 className="bentorah-footer__heading">Company</h3>
            <ul className="bentorah-footer__links">
              <li><Link to="/about">About BENTORAH</Link></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>

          {/* Support column */}
          <div className="bentorah-footer__col">
            <h3 className="bentorah-footer__heading">Support</h3>
            <ul className="bentorah-footer__links">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Track Order</a></li>
              <li><a href="#">Returns &amp; Exchanges</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="bentorah-footer__bottom">
          <p className="bentorah-footer__copy">
            &copy; {currentYear} BENTORAH Technologies Ltd. All rights reserved.
          </p>
          <div className="bentorah-footer__badges">
            <span className="bentorah-footer__badge">🔒 Secure Payments</span>
            <span className="bentorah-footer__badge">🚚 Fast Delivery</span>
            <span className="bentorah-footer__badge">↩ Easy Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
