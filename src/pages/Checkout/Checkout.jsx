import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { selectCartItems, selectCartSubtotal } from '../../redux/cartSlice';
import { selectCurrentUser, selectIsAuthenticated, authSignOut } from '../../redux/authSlice';
import { signOut as authServiceSignOut } from '../../services/authService';
import { formatCurrency } from '../../utils/formatters';
import { validateCheckoutForm } from '../../utils/validators';
import CheckoutProgress from '../../components/checkout/CheckoutProgress';
import CheckoutAccount from '../../components/checkout/CheckoutAccount';
import './Checkout.css';

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT – Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

const deliveryOptions = [
  { id: 'standard', label: 'Standard Delivery', duration: '3–5 business days', price: 3500 },
  { id: 'express', label: 'Express Delivery', duration: '1–2 business days', price: 7000 },
];

const CheckoutField = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder,
  autoComplete,
  readOnly = false,
  hint,
}) => (
  <div className="checkout-field">
    <div className="checkout-field__label-row">
      <label className="checkout-field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {readOnly && (
        <span className="checkout-field__locked-badge" title="Linked to your account">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Account Info
        </span>
      )}
    </div>
    <input
      id={id}
      name={name}
      type={type}
      className={`checkout-field__input ${error ? 'checkout-field__input--error' : ''} ${
        readOnly ? 'checkout-field__input--readonly' : ''
      }`}
      value={value ?? ''}
      onChange={readOnly ? undefined : onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      required={required}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
    />
    {hint && <p className="checkout-field__hint">{hint}</p>}
    {error && (
      <p className="checkout-field__error" id={`${id}-error`} role="alert">
        {error}
      </p>
    )}
  </div>
);

const OrderSummaryPanel = ({ cartItems, selectedDelivery, subtotal, deliveryFee, total }) => (
  <aside className="checkout-summary" aria-label="Order summary">
    <h2 className="checkout-summary__title">Order Summary</h2>
    <ul className="checkout-summary__items">
      {cartItems.map((item) => (
        <li key={`${item.id}-${item.variantKey}`} className="checkout-summary__item">
          <div className="checkout-summary__item-img-wrap">
            <img src={item.image} alt={item.name} className="checkout-summary__item-img" loading="lazy" />
            <span className="checkout-summary__item-qty">{item.quantity}</span>
          </div>
          <div className="checkout-summary__item-info">
            <p className="checkout-summary__item-name">{item.name}</p>
            {item.variant && <p className="checkout-summary__item-variant">{item.variant.label}</p>}
          </div>
          <p className="checkout-summary__item-price">{formatCurrency(item.subtotal)}</p>
        </li>
      ))}
    </ul>
    <div className="checkout-summary__totals">
      <div className="checkout-summary__row">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="checkout-summary__row">
        <span>Delivery ({selectedDelivery.label})</span>
        <span>{formatCurrency(deliveryFee)}</span>
      </div>
      <div className="checkout-summary__row checkout-summary__row--total">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  </aside>
);

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // Step 1 = Account (skipped if authenticated), Step 2 = Delivery, Step 3 = Review, Step 4 = Payment (/payment)
  const [step, setStep] = useState(isAuthenticated ? 2 : 1);
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Lagos',
  });
  const [errors, setErrors] = useState({});

  // Auto-skip Step 1 if user authenticates
  useEffect(() => {
    if (isAuthenticated && step === 1) {
      setStep(2);
    }
  }, [isAuthenticated, step]);

  // Pre-fill form from authenticated user profile
  useEffect(() => {
    if (currentUser) {
      const parts = (currentUser.name || '').trim().split(' ');
      const firstName =
        currentUser.firstName ||
        parts[0] ||
        (currentUser.email ? currentUser.email.split('@')[0] : 'Shopper');
      const lastName =
        currentUser.lastName ||
        (parts.length > 1 ? parts.slice(1).join(' ') : 'Customer');

      setForm((prev) => ({
        ...prev,
        email: currentUser.email || prev.email,
        firstName: firstName || prev.firstName || 'Shopper',
        lastName: lastName || prev.lastName || 'Customer',
      }));
    }
  }, [currentUser]);

  const selectedDelivery = deliveryOptions.find((d) => d.id === deliveryOption) || deliveryOptions[0];
  const deliveryFee = selectedDelivery.price;
  const total = subtotal + deliveryFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    const errs = validateCheckoutForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const element = document.getElementById(firstKey);
      if (element) element.focus();
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchAccount = () => {
    authServiceSignOut();
    dispatch(authSignOut());
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = () => {
    navigate('/payment', {
      state: {
        form,
        deliveryOption,
        deliveryFee,
        subtotal,
        total,
        cartItems,
      },
    });
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }



  return (
    <div className="checkout-page">
      <div className="bentorah-container">
        <div className="checkout-page__header">
          <h1 className="checkout-page__title">Checkout</h1>
          <p className="checkout-page__breadcrumb">
            <Link to="/cart">Cart</Link> &rsaquo; Checkout
          </p>
        </div>

        {/* 4-Step Progress Indicator */}
        <CheckoutProgress
          currentStep={step}
          isAuthenticated={isAuthenticated}
          onStepClick={(targetStep) => {
            // Can return to earlier steps or switch between Delivery & Review
            if (targetStep < step || (targetStep === 2 && isAuthenticated)) {
              setStep(targetStep);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />

        <div className="checkout-layout">
          <div className="checkout-main">
            {/* Step 1: Account Onboarding (Shown for unauthenticated users) */}
            {step === 1 && !isAuthenticated && (
              <CheckoutAccount
                onAuthSuccess={(user) => {
                  setStep(2);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Step 2: Delivery & Shipping Address */}
            {step === 2 && (
              <form className="checkout-form" onSubmit={handleDeliverySubmit} noValidate>
                {/* Authenticated Account Info Strip */}
                {currentUser && (
                  <div className="checkout-auth-strip">
                    <div className="checkout-auth-strip__info">
                      <span className="checkout-auth-strip__avatar" aria-hidden="true">
                        {(currentUser.name || currentUser.email || 'B').charAt(0).toUpperCase()}
                      </span>
                      <div className="checkout-auth-strip__details">
                        <span className="checkout-auth-strip__caption">Signed in for checkout</span>
                        <div className="checkout-auth-strip__user-meta">
                          <span className="checkout-auth-strip__name">
                            {currentUser.name || currentUser.email}
                          </span>
                          <span className="checkout-auth-strip__dot">&bull;</span>
                          <span className="checkout-auth-strip__email" title={currentUser.email}>
                            {currentUser.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="checkout-auth-strip__switch-btn"
                      onClick={handleSwitchAccount}
                      title="Sign out or use a different account"
                    >
                      Switch account
                    </button>
                  </div>
                )}

                {/* Contact Information */}
                <div className="checkout-form__section">
                  <div className="checkout-section-header-flex">
                    <h2 className="checkout-form__heading">Contact Information</h2>
                    <span className="checkout-readonly-note">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Name &amp; email linked to your account
                    </span>
                  </div>
                  <div className="checkout-form__grid-2">
                    <CheckoutField
                      label="First Name"
                      id="firstName"
                      name="firstName"
                      value={form.firstName}
                      readOnly
                      placeholder="Alex"
                      autoComplete="given-name"
                    />
                    <CheckoutField
                      label="Last Name"
                      id="lastName"
                      name="lastName"
                      value={form.lastName}
                      readOnly
                      placeholder="Johnson"
                      autoComplete="family-name"
                    />
                  </div>
                  <CheckoutField
                    label="Email Address"
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    readOnly
                    placeholder="alex.johnson@example.com"
                    autoComplete="email"
                  />
                  <CheckoutField
                    label="Phone Number"
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    required
                    placeholder="0801 234 5678"
                    autoComplete="tel"
                    hint="Enter the phone number where our delivery rider can reach you."
                  />
                </div>

                {/* Delivery Address */}
                <div className="checkout-form__section">
                  <h2 className="checkout-form__heading">Delivery Address</h2>
                  <CheckoutField
                    label="Street Address"
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    error={errors.address}
                    required
                    placeholder="14 Awolowo Road, Ikoyi"
                    autoComplete="street-address"
                  />
                  <div className="checkout-form__grid-2">
                    <CheckoutField
                      label="City"
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      error={errors.city}
                      required
                      placeholder="Lagos"
                      autoComplete="address-level2"
                    />
                    <div className="checkout-field">
                      <label className="checkout-field__label" htmlFor="state">
                        State <span aria-hidden="true">*</span>
                      </label>
                      <select
                        id="state"
                        name="state"
                        className="checkout-field__input"
                        value={form.state}
                        onChange={handleChange}
                        autoComplete="address-level1"
                      >
                        {nigerianStates.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Delivery Method */}
                <div className="checkout-form__section">
                  <h2 className="checkout-form__heading">Delivery Method</h2>
                  <div className="checkout-delivery-options" role="radiogroup" aria-label="Delivery options">
                    {deliveryOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={`checkout-delivery-option ${
                          deliveryOption === opt.id ? 'checkout-delivery-option--active' : ''
                        }`}
                        htmlFor={`delivery-${opt.id}`}
                      >
                        <input
                          id={`delivery-${opt.id}`}
                          type="radio"
                          name="deliveryOption"
                          value={opt.id}
                          checked={deliveryOption === opt.id}
                          onChange={() => setDeliveryOption(opt.id)}
                          className="sr-only"
                        />
                        <div className="checkout-delivery-option__radio" aria-hidden="true">
                          {deliveryOption === opt.id && <div className="checkout-delivery-option__radio-fill" />}
                        </div>
                        <div className="checkout-delivery-option__info">
                          <p className="checkout-delivery-option__label">{opt.label}</p>
                          <p className="checkout-delivery-option__duration">{opt.duration}</p>
                        </div>
                        <p className="checkout-delivery-option__price">{formatCurrency(opt.price)}</p>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="checkout-form__actions">
                  <Link to="/cart" className="checkout-btn-secondary">
                    &larr; Return to Cart
                  </Link>
                  <button type="submit" className="checkout-btn-primary">
                    Continue to Review &rarr;
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <div className="checkout-review">
                <div className="checkout-form__section">
                  <h2 className="checkout-form__heading">Review Your Order</h2>

                  <div className="checkout-review__block">
                    <div className="checkout-review__block-header">
                      <h3>Account &amp; Contact</h3>
                      <button type="button" onClick={() => setStep(2)}>
                        Edit
                      </button>
                    </div>
                    <p className="checkout-review__text">
                      <strong>{form.firstName} {form.lastName}</strong> &bull; {form.email} &bull; {form.phone}
                    </p>
                  </div>

                  <div className="checkout-review__block">
                    <div className="checkout-review__block-header">
                      <h3>Delivery Address</h3>
                      <button type="button" onClick={() => setStep(2)}>
                        Edit
                      </button>
                    </div>
                    <p className="checkout-review__text">
                      {form.address}, {form.city}, {form.state}
                    </p>
                  </div>

                  <div className="checkout-review__block">
                    <div className="checkout-review__block-header">
                      <h3>Delivery Method</h3>
                      <button type="button" onClick={() => setStep(2)}>
                        Edit
                      </button>
                    </div>
                    <p className="checkout-review__text">
                      {selectedDelivery.label} &bull; {selectedDelivery.duration} &bull; {formatCurrency(deliveryFee)}
                    </p>
                  </div>
                </div>

                {/* Items preview in Review */}
                <div className="checkout-review__items">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.variantKey}`} className="checkout-review__item">
                      <img src={item.image} alt={item.name} className="checkout-review__item-img" />
                      <div className="checkout-review__item-details">
                        <p className="checkout-review__item-name">{item.name}</p>
                        {item.variant && <p className="checkout-review__item-meta">{item.variant.label}</p>}
                        <p className="checkout-review__item-meta">Qty: {item.quantity}</p>
                      </div>
                      <p className="checkout-review__item-price">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>

                <div className="checkout-review__total-bar">
                  <span>Total Amount Due</span>
                  <span className="checkout-review__total-amount">{formatCurrency(total)}</span>
                </div>

                <div className="checkout-form__actions">
                  <button type="button" className="checkout-btn-secondary" onClick={() => setStep(2)}>
                    &larr; Back to Delivery
                  </button>
                  <button type="button" className="checkout-btn-primary" onClick={handlePlaceOrder}>
                    Proceed to Payment &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          <OrderSummaryPanel
            cartItems={cartItems}
            selectedDelivery={selectedDelivery}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
