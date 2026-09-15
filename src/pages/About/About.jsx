import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const teamMembers = [
  { initials: 'AO', name: 'Benjamin Ufuoma', role: 'Founder & CEO', bio: 'Former product lead at a fintech firm. Started BENTORAH to fix the broken tech retail experience in Nigeria.' },
  { initials: 'CI', name: 'Nosa David', role: 'Head of Curation', bio: 'Gadget obsessive with 10 years experience reviewing consumer electronics for major tech publications.' },
  { initials: 'FK', name: 'Yentonyon Amos', role: 'Customer Experience', bio: 'Believes every customer interaction is an opportunity to build a relationship, not just complete a transaction.' },
  { initials: 'EM', name: 'Victor Dike', role: 'Operations & Logistics', bio: 'Built the delivery network that gets your orders from warehouse to doorstep in record time.' },
];

const values = [
  {
    icon: '🎯',
    title: 'Ruthless Curation',
    text: 'We test and review every product before listing it. If we wouldn\'t use it ourselves, it doesn\'t make it to the store.',
  },
  {
    icon: '🤝',
    title: 'Honest Pricing',
    text: 'No artificial inflation, no fake "original prices". The price you see is the best we can offer.',
  },
  {
    icon: '🚀',
    title: 'Fast Everything',
    text: 'Fast site, fast checkout, fast delivery. Your time is valuable and we treat it that way.',
  },
  {
    icon: '💬',
    title: 'Real Support',
    text: 'Real humans, not bots. Our support team picks up within the hour during business days.',
  },
];

const stats = [
  { number: '2,400+', label: 'Happy Customers' },
  { number: '14', label: 'Curated Products' },
  { number: '6', label: 'Product Categories' },
  { number: '4.7★', label: 'Average Rating' },
];

const About = () => {
  useEffect(() => {
    document.title = 'About BENTORAH — Premium Technology, Thoughtfully Selected';
  }, []);

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero" aria-labelledby="about-hero-heading">
        <div className="bentorah-container about-hero__inner">
          <div className="about-hero__content">
            <span className="about-hero__eyebrow">Our Story</span>
            <h1 id="about-hero-heading" className="about-hero__title">
              We believe buying technology<br />should feel great.
            </h1>
            <p className="about-hero__text">
              BENTORAH was built because buying quality tech in Nigeria felt like a gamble —
              overpriced imports, dubious sellers, and zero post-purchase support. We set
              out to change that by building a store we'd actually want to buy from.
            </p>
            <Link to="/products" className="about-hero__cta">Shop the Collection</Link>
          </div>
          <div className="about-hero__image-wrap" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700&q=85"
              alt=""
              className="about-hero__image"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats" aria-label="BENTORAH by the numbers">
        <div className="bentorah-container">
          <ul className="about-stats__grid">
            {stats.map((stat, i) => (
              <li key={i} className="about-stat">
                <span className="about-stat__number">{stat.number}</span>
                <span className="about-stat__label">{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mission */}
      <section className="bentorah-section about-mission" aria-labelledby="mission-heading">
        <div className="bentorah-container about-mission__inner">
          <div className="about-mission__content">
            <span className="about-mission__eyebrow">Our Mission</span>
            <h2 id="mission-heading" className="about-mission__title">
              Premium technology, thoughtfully selected.
            </h2>
            <p className="about-mission__text">
              That's not just our tagline — it's our operating principle. Every product
              in the BENTORAH catalog has been vetted by our curation team, tested against
              our quality benchmarks, and priced fairly.
            </p>
            <p className="about-mission__text">
              We're not a marketplace. We don't list thousands of products and let you
              figure it out. We list the right products and make it easy to choose.
            </p>
          </div>
          <div className="about-mission__visual" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80"
              alt=""
              className="about-mission__image"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bentorah-section about-values" aria-labelledby="values-heading">
        <div className="bentorah-container">
          <div className="about-section-header">
            <h2 id="values-heading" className="about-section-title">What we stand for</h2>
            <p className="about-section-sub">Four principles that guide every decision we make.</p>
          </div>
          <div className="about-values__grid">
            {values.map((v, i) => (
              <div key={i} className="about-value-card">
                <span className="about-value-card__icon" aria-hidden="true">{v.icon}</span>
                <h3 className="about-value-card__title">{v.title}</h3>
                <p className="about-value-card__text">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bentorah-section about-team" aria-labelledby="team-heading">
        <div className="bentorah-container">
          <div className="about-section-header">
            <h2 id="team-heading" className="about-section-title">The people behind BENTORAH</h2>
            <p className="about-section-sub">A small team with a singular obsession: making tech retail better.</p>
          </div>
          <div className="about-team__grid">
            {teamMembers.map((member, i) => (
              <div key={i} className="about-team-card">
                <div className="about-team-card__avatar" aria-hidden="true">{member.initials}</div>
                <h3 className="about-team-card__name">{member.name}</h3>
                <p className="about-team-card__role">{member.role}</p>
                <p className="about-team-card__bio">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta" aria-labelledby="about-cta-heading">
        <div className="bentorah-container about-cta__inner">
          <h2 id="about-cta-heading" className="about-cta__title">Ready to experience the difference?</h2>
          <p className="about-cta__text">Browse our curated collection of premium technology products.</p>
          <div className="about-cta__actions">
            <Link to="/products" className="about-cta__btn about-cta__btn--primary">Shop Now</Link>
            <a href="mailto:hello@bentorah.ng" className="about-cta__btn about-cta__btn--secondary">Get in Touch</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
