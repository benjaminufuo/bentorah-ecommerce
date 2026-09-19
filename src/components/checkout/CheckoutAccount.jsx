import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../../redux/authSlice';
import { mergeGuestCartOnLogin } from '../../redux/cartSlice';
import {
  signInWithEmail,
  signUpWithEmail,
  sendVerificationCode,
  initiateGoogleOAuth,
} from '../../services/authService';
import GoogleAuthButton from './GoogleAuthButton';
import { useToast } from '../../components/ui/Toast/ToastContext';
import './CheckoutAccount.css';

const CheckoutAccount = ({ onAuthSuccess }) => {
  const dispatch = useDispatch();
  const toast = useToast();

  const [mode, setMode] = useState('signup'); // 'signup' | 'signin'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // 60-second cooldown timer for verification code
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormErrors((prev) => ({ ...prev, email: 'Please enter a valid email address first.' }));
      return;
    }

    setIsSendingCode(true);
    setAuthError(null);

    try {
      const res = await sendVerificationCode(cleanEmail);
      setCountdown(60);
      toast.success(res?.message || 'Verification code sent to your email!');
    } catch (err) {
      setAuthError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const validate = () => {
    const errors = {};
    const cleanEmail = email.trim();

    if (mode === 'signup') {
      if (!firstName.trim()) {
        errors.firstName = 'First name is required.';
      }
      if (!lastName.trim()) {
        errors.lastName = 'Last name is required.';
      }
    }

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }

      if (!verificationCode.trim()) {
        errors.verificationCode = 'Please enter the 6-digit code sent to your email.';
      } else if (!/^\d{6}$/.test(verificationCode.trim())) {
        errors.verificationCode = 'Verification code must be exactly 6 digits.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoogleAuth = () => {
    setIsGoogleLoading(true);
    initiateGoogleOAuth();
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
        user = await signUpWithEmail(email, password, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          verificationCode: verificationCode.trim(),
        });
      } else {
        user = await signInWithEmail(email, password);
      }
      dispatch(authSuccess(user));
      dispatch(mergeGuestCartOnLogin());
      toast.success(
        mode === 'signup'
          ? `Welcome to Bentorah, ${user.firstName || user.name || 'Shopper'}!`
          : `Welcome back, ${user.firstName || user.name || 'Shopper'}!`
      );
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
          text="Continue with Google"
        />
      </div>

      {/* Divider */}
      <div className="checkout-account__divider" role="separator" aria-label="or divider">
        <span>OR</span>
      </div>

      {/* Email / Password Form */}
      <form className="checkout-account__form" onSubmit={handleSubmit} noValidate>
        {mode === 'signup' && (
          <div className="checkout-account__grid-row">
            <div className="checkout-account__field">
              <label className="checkout-account__label" htmlFor="account-firstName">
                First Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="account-firstName"
                type="text"
                className={`checkout-account__input ${
                  formErrors.firstName ? 'checkout-account__input--error' : ''
                }`}
                placeholder="e.g. Alex"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (formErrors.firstName) setFormErrors((err) => ({ ...err, firstName: '' }));
                }}
                autoComplete="given-name"
                disabled={isSubmitting || isGoogleLoading}
                aria-invalid={Boolean(formErrors.firstName)}
                aria-describedby={formErrors.firstName ? 'account-firstName-error' : undefined}
              />
              {formErrors.firstName && (
                <p id="account-firstName-error" className="checkout-account__error" role="alert">
                  {formErrors.firstName}
                </p>
              )}
            </div>

            <div className="checkout-account__field">
              <label className="checkout-account__label" htmlFor="account-lastName">
                Last Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="account-lastName"
                type="text"
                className={`checkout-account__input ${
                  formErrors.lastName ? 'checkout-account__input--error' : ''
                }`}
                placeholder="e.g. Doe"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (formErrors.lastName) setFormErrors((err) => ({ ...err, lastName: '' }));
                }}
                autoComplete="family-name"
                disabled={isSubmitting || isGoogleLoading}
                aria-invalid={Boolean(formErrors.lastName)}
                aria-describedby={formErrors.lastName ? 'account-lastName-error' : undefined}
              />
              {formErrors.lastName && (
                <p id="account-lastName-error" className="checkout-account__error" role="alert">
                  {formErrors.lastName}
                </p>
              )}
            </div>
          </div>
        )}

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

        {mode === 'signup' && (
          <>
            {/* Confirm Password Field */}
            <div className="checkout-account__field">
              <div className="checkout-account__label-row">
                <label className="checkout-account__label" htmlFor="account-confirmPassword">
                  Confirm Password <span aria-hidden="true">*</span>
                </label>
              </div>
              <div className="checkout-account__input-wrap">
                <input
                  id="account-confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`checkout-account__input ${
                    formErrors.confirmPassword ? 'checkout-account__input--error' : ''
                  }`}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (formErrors.confirmPassword) setFormErrors((err) => ({ ...err, confirmPassword: '' }));
                  }}
                  autoComplete="new-password"
                  disabled={isSubmitting || isGoogleLoading}
                  aria-invalid={Boolean(formErrors.confirmPassword)}
                  aria-describedby={formErrors.confirmPassword ? 'account-confirmPassword-error' : undefined}
                />
                <button
                  type="button"
                  className="checkout-account__show-pwd"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
              {formErrors.confirmPassword && (
                <p id="account-confirmPassword-error" className="checkout-account__error" role="alert">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* 6-digit Verification Code */}
            <div className="checkout-account__field">
              <div className="checkout-account__label-row">
                <label className="checkout-account__label" htmlFor="account-verificationCode">
                  Email Verification Code <span aria-hidden="true">*</span>
                </label>
                <span className="checkout-account__hint">6 digits</span>
              </div>
              <div className="checkout-account__code-row">
                <input
                  id="account-verificationCode"
                  type="text"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className={`checkout-account__input checkout-account__input--code ${
                    formErrors.verificationCode ? 'checkout-account__input--error' : ''
                  }`}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(val);
                    if (formErrors.verificationCode) setFormErrors((err) => ({ ...err, verificationCode: '' }));
                  }}
                  autoComplete="one-time-code"
                  disabled={isSubmitting || isGoogleLoading}
                  aria-invalid={Boolean(formErrors.verificationCode)}
                  aria-describedby={formErrors.verificationCode ? 'account-verificationCode-error' : undefined}
                />
                <button
                  type="button"
                  className={`checkout-account__send-code-btn ${
                    countdown > 0 ? 'checkout-account__send-code-btn--disabled' : ''
                  }`}
                  onClick={handleSendVerificationCode}
                  disabled={countdown > 0 || isSendingCode || isSubmitting}
                  aria-label={countdown > 0 ? `Resend code in ${countdown} seconds` : 'Send verification code'}
                >
                  {isSendingCode ? (
                    <span className="checkout-account__code-spinner" aria-hidden="true" />
                  ) : countdown > 0 ? (
                    <span>Resend in {countdown}s</span>
                  ) : (
                    <span>Send Code</span>
                  )}
                </button>
              </div>
              {formErrors.verificationCode && (
                <p id="account-verificationCode-error" className="checkout-account__error" role="alert">
                  {formErrors.verificationCode}
                </p>
              )}
            </div>
          </>
        )}

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
            <span>{mode === 'signup' ? 'Create Account & Continue' : 'Sign In & Continue'}</span>
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
