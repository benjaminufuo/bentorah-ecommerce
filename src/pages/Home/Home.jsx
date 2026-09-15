import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts, getNewArrivals, getCategories, getTestimonials } from '../../services/productService';
import { useToast } from '../../components/ui/Toast/ToastContext';
import ProductCard from '../../components/products/ProductCard/ProductCard';
import { formatCurrency } from '../../utils/formatters';
import './Home.css';

const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const whyItems = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Curated Selection',
    text: 'Every product is hand-picked by our team for quality, value, and reliability. No filler, no gimmicks.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    title: 'Secure Checkout',
    text: 'Bank-grade encryption protects every transaction. Pay confidently with Paystack or Flutterwave.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
    title: 'Fast Nationwide Delivery',
    text: 'Orders dispatched within 24 hours. Express 1–2 day delivery available in Lagos and Abuja.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
      </svg>
    ),
    title: '14-Day Free Returns',
    text: 'Not satisfied? Return any item within 14 days for a full refund or replacement. No questions asked.',
  },
];

const useReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('visible', 'revealed');
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible', 'revealed');
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: '80px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const ProductSkeleton = () => (
  <div className="home-skeleton-card">
    <div className="skeleton home-skeleton-card__image"></div>
    <div className="home-skeleton-card__body">
      <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '8px' }}></div>
      <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '8px' }}></div>
      <div className="skeleton" style={{ height: '12px', width: '100%', marginBottom: '12px' }}></div>
      <div className="skeleton" style={{ height: '20px', width: '40%' }}></div>
    </div>
  </div>
);

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const toast = useToast();

  const categoriesRef = useReveal();
  const featuredRef = useReveal();
  const newArrivalsRef = useReveal();
  const whyRef = useReveal();
  const promoRef = useReveal();
  const testimonialsRef = useReveal();
  const newsletterRef = useReveal();

  useEffect(() => {
    document.title = 'BENTORAH — Premium Technology, Thoughtfully Selected';
    const fetchData = async () => {
      try {
        const [featured, arrivals, cats, tests] = await Promise.all([
          getFeaturedProducts(),
          getNewArrivals(),
          getCategories(),
          getTestimonials(),
        ]);
        setFeaturedProducts(featured.slice(0, 4));
        setNewArrivals(arrivals.slice(0, 4));
        setCategories(cats);
        setTestimonials(tests);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      toast.success("You're subscribed! Welcome to BENTORAH.");
    }
  };

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <section className="home-hero" aria-label="Hero">
        <div className="bentorah-container home-hero__inner">
          <div className="home-hero__content">
            <div className="home-hero__eyebrow">
              <span className="home-hero__tag">New Arrivals Just Dropped</span>
            </div>
            <h1 className="home-hero__headline">
              Technology that fits<br />the way you live.
            </h1>
            <p className="home-hero__subtext">
              Discover thoughtfully selected gadgets and accessories built for
              work, play and everything in between.
            </p>
            <div className="home-hero__ctas">
              <Link to="/products" className="home-hero__btn home-hero__btn--primary">
                Shop Products
              </Link>
              <Link to="/new-arrivals" className="home-hero__btn home-hero__btn--secondary">
                Explore New Arrivals
              </Link>
            </div>
            <div className="home-hero__social-proof">
              <div className="home-hero__avatars" aria-hidden="true">
                <span className="home-hero__avatar">AO</span>
                <span className="home-hero__avatar">EN</span>
                <span className="home-hero__avatar">FB</span>
                <span className="home-hero__avatar">TA</span>
              </div>
              <p>Trusted by <strong>2,400+</strong> customers across Nigeria</p>
            </div>
          </div>

          <div className="home-hero__visual" aria-hidden="true">
            <div className="home-hero__image-wrap">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=85"
                alt="BENTORAH AirBeat Pro premium wireless headphones"
                className="home-hero__image"
              />
              <div className="home-hero__product-tag">
                <span className="home-hero__product-tag-label">Featured</span>
                <p className="home-hero__product-tag-name">BENTORAH AirBeat Pro</p>
                <p className="home-hero__product-tag-price">{formatCurrency(85000)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="bentorah-section home-categories" aria-labelledby="categories-heading">
        <div className="bentorah-container">
          <div ref={categoriesRef} className="reveal">
            <div className="home-section-header">
              <h2 id="categories-heading" className="home-section-title">Shop by Category</h2>
              <Link to="/products" className="home-section-link">View all &rarr;</Link>
            </div>
            <div className="home-categories__grid">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/products?category=${cat.id}`} className="home-category-card">
                  <span className="home-category-card__emoji" aria-hidden="true">{cat.icon}</span>
                  <span className="home-category-card__label">{cat.label}</span>
                  <span className="home-category-card__count">{cat.count} products</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="bentorah-section home-featured" aria-labelledby="featured-heading">
        <div className="bentorah-container">
          <div ref={featuredRef} className="reveal">
            <div className="home-section-header">
              <div>
                <h2 id="featured-heading" className="home-section-title">Featured Products</h2>
                <p className="home-section-sub">Our most popular picks, selected for quality and value.</p>
              </div>
              <Link to="/products" className="home-section-link">Browse all &rarr;</Link>
            </div>
            <div className="home-products-grid">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
                : featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── Promo Banner ── */}
      <div ref={promoRef} className="reveal">
        <section className="home-promo" aria-labelledby="promo-heading">
          <div className="bentorah-container home-promo__inner">
            <div className="home-promo__content">
              <span className="home-promo__eyebrow">Limited Time</span>
              <h2 id="promo-heading" className="home-promo__title">Upgrade Your Everyday Setup</h2>
              <p className="home-promo__text">
                Selected work essentials up to 21% off. Refresh your workspace
                with gear that keeps up with your ambitions.
              </p>
              <Link to="/products?category=work-essentials" className="home-promo__btn">
                Shop Work Essentials
              </Link>
            </div>
            <div className="home-promo__image-wrap" aria-hidden="true">
              <img
                src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80"
                alt=""
                className="home-promo__image"
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── New Arrivals ── */}
      <section className="bentorah-section home-new" aria-labelledby="new-arrivals-heading">
        <div className="bentorah-container">
          <div ref={newArrivalsRef} className="reveal">
            <div className="home-section-header">
              <div>
                <h2 id="new-arrivals-heading" className="home-section-title">New Arrivals</h2>
                <p className="home-section-sub">Fresh additions to the BENTORAH collection.</p>
              </div>
              <Link to="/new-arrivals" className="home-section-link">See all new &rarr;</Link>
            </div>
            <div className="home-products-grid">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
                : newArrivals.map((p) => <ProductCard key={p.id} product={p} />)
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── Why BENTORAH ── */}
      <section className="bentorah-section home-why" aria-labelledby="why-heading">
        <div className="bentorah-container">
          <div ref={whyRef} className="reveal">
            <div className="home-section-header home-section-header--center">
              <h2 id="why-heading" className="home-section-title">Why BENTORAH?</h2>
              <p className="home-section-sub">We take the guesswork out of buying technology.</p>
            </div>
            <div className="home-why__grid">
              {whyItems.map((item, i) => (
                <div key={i} className="home-why-card">
                  <div className="home-why-card__icon">{item.icon}</div>
                  <h3 className="home-why-card__title">{item.title}</h3>
                  <p className="home-why-card__text">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bentorah-section home-testimonials" aria-labelledby="testimonials-heading">
        <div className="bentorah-container">
          <div ref={testimonialsRef} className="reveal">
            <div className="home-section-header home-section-header--center">
              <h2 id="testimonials-heading" className="home-section-title">What our customers say</h2>
            </div>
            <div className="home-testimonials__grid">
              {testimonials.map((t) => (
                <blockquote key={t.id} className="home-testimonial">
                  <div className="home-testimonial__stars" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon key={i} filled={i < t.rating} />
                    ))}
                  </div>
                  <p className="home-testimonial__text">&ldquo;{t.text}&rdquo;</p>
                  <footer className="home-testimonial__author">
                    <div className="home-testimonial__avatar" aria-hidden="true">{t.avatar}</div>
                    <div>
                      <cite className="home-testimonial__name">{t.name}</cite>
                      <p className="home-testimonial__role">{t.role}</p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="home-newsletter" aria-labelledby="newsletter-heading">
        <div className="bentorah-container">
          <div ref={newsletterRef} className="reveal home-newsletter__inner">
            <div className="home-newsletter__content">
              <h2 id="newsletter-heading" className="home-newsletter__title">Stay in the loop</h2>
              <p className="home-newsletter__text">
                New arrivals, exclusive deals, and tech guides. Once a week, no spam.
              </p>
            </div>
            {subscribed ? (
              <div className="home-newsletter__success">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                You're subscribed. Welcome to BENTORAH!
              </div>
            ) : (
              <form className="home-newsletter__form" onSubmit={handleNewsletterSubmit} role="search">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  className="home-newsletter__input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <button type="submit" className="home-newsletter__submit">Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
