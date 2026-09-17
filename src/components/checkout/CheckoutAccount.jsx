import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../../redux/authSlice';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../../services/authService';
import GoogleAuthButton from './GoogleAuthButton';
import './CheckoutAccount.css';

const CheckoutAccount = ({ onAuthSuccess }) => {
  const dispatch = useDispatch();

  const [mode, setMode] = useState('signup'); // 'signup' | 'signin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validate = () => {
    const errors = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (mode === 'signup' && password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoogleAuth = () => {
    setAuthError('Google Sign-In is coming soon! Please sign in or create an account with your email and password below.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    dispatch(authStart());

    try {
      let user;
      if (mode === 'signup') {
        user = await signUpWithEmail(email, password);
      } else {
        user = await signInWithEmail(email, password);
      }
      dispatch(authSuccess(user));
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please check your credentials and try again.';
      setAuthError(msg);
      dispatch(authFailure(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
    setFormErrors({});
    setAuthError(null);
  };

  return (
    <div className="checkout-account" aria-labelledby="checkout-account-heading">
      <div className="checkout-account__header">
        <h2 id="checkout-account-heading" className="checkout-account__title">
          {mode === 'signup' ? "Almost there — let's set up your account." : 'Welcome back'}
        </h2>
        <p className="checkout-account__subtitle">
          {mode === 'signup'
            ? 'Create an account to securely save your order, track your delivery, and make future purchases faster.'
            : 'Sign in to access your saved details and complete your checkout seamlessly.'}
        </p>
      </div>

      {authError && (
        <div className="checkout-account__alert" role="alert">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{authError}</span>
        </div>
      )}

      {/* Primary Google Auth Option */}
      <div className="checkout-account__social">
        <GoogleAuthButton
          onClick={handleGoogleAuth}
          isLoading={isGoogleLoading}
          disabled={isSubmitting}
        />
      </div>

      {/* Divider */}
      <div className="checkout-account__divider" role="separator" aria-label="or divider">
        <span>OR</span>
      </div>

      {/* Email / Password Form */}
      <form className="checkout-account__form" onSubmit={handleSubmit} noValidate>
        <div className="checkout-account__field">
          <label className="checkout-account__label" htmlFor="account-email">
            Email Address <span aria-hidden="true">*</span>
          </label>
          <input
            id="account-email"
            type="email"
            className={`checkout-account__input ${
              formErrors.email ? 'checkout-account__input--error' : ''
            }`}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formErrors.email) setFormErrors((err) => ({ ...err, email: '' }));
            }}
            autoComplete="email"
            disabled={isSubmitting || isGoogleLoading}
            aria-invalid={Boolean(formErrors.email)}
            aria-describedby={formErrors.email ? 'account-email-error' : undefined}
          />
          {formErrors.email && (
            <p id="account-email-error" className="checkout-account__error" role="alert">
              {formErrors.email}
            </p>
          )}
        </div>

        <div className="checkout-account__field">
          <div className="checkout-account__label-row">
            <label className="checkout-account__label" htmlFor="account-password">
              Password <span aria-hidden="true">*</span>
            </label>
          </div>
          <div className="checkout-account__input-wrap">
            <input
              id="account-password"
              type={showPassword ? 'text' : 'password'}
              className={`checkout-account__input ${
                formErrors.password ? 'checkout-account__input--error' : ''
              }`}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formErrors.password) setFormErrors((err) => ({ ...err, password: '' }));
              }}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              disabled={isSubmitting || isGoogleLoading}
              aria-invalid={Boolean(formErrors.password)}
              aria-describedby={formErrors.password ? 'account-password-error' : undefined}
            />
            <button
              type="button"
              className="checkout-account__show-pwd"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {formErrors.password && (
            <p id="account-password-error" className="checkout-account__error" role="alert">
              {formErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="checkout-account__submit-btn"
          disabled={isSubmitting || isGoogleLoading}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <span className="checkout-account__btn-loading">
              <span className="checkout-account__spinner" aria-hidden="true" />
              <span>{mode === 'signup' ? 'Creating Account…' : 'Signing In…'}</span>
            </span>
          ) : (
            <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
          )}
        </button>
      </form>

      {/* Mode Switcher */}
      <div className="checkout-account__switch">
        {mode === 'signup' ? (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="checkout-account__switch-btn"
              onClick={toggleMode}
            >
              Sign in
            </button>
          </p>
        ) : (
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="checkout-account__switch-btn"
              onClick={toggleMode}
            >
              Create Account
            </button>
          </p>
        )}
      </div>

      {/* Return to Cart Navigation */}
      <div className="checkout-account__footer">
        <Link to="/cart" className="checkout-account__return-link">
          &larr; Return to Cart
        </Link>
      </div>
    </div>
  );
};

export default CheckoutAccount;
