import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../../../redux/authSlice';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} from '../../../services/authService';
import GoogleAuthButton from '../../checkout/GoogleAuthButton';
import { useToast } from '../../ui/Toast/ToastContext';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const dispatch = useDispatch();
  const toast = useToast();

  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrors({});
      setAuthError(null);
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  // Lock body scroll and focus first input
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, mode]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) {
      setAuthError(null);
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === 'signup') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required.';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required.';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (mode === 'signup' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    dispatch(authStart());

    try {
      const user = await signInWithGoogle();
      dispatch(authSuccess(user));
      toast.success(`Welcome, ${user.firstName || user.name}!`);
      onClose();
    } catch (err) {
      const msg = err.message || 'Google sign-in could not be completed. Please try again.';
      setAuthError(msg);
      dispatch(authFailure(msg));
    } finally {
      setIsGoogleLoading(false);
    }
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
        user = await signUpWithEmail(formData.email, formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        });
        toast.success(`Account created! Welcome to Bentorah, ${user.firstName || user.name}!`);
      } else {
        user = await signInWithEmail(formData.email, formData.password);
        toast.success(`Welcome back, ${user.firstName || user.name}!`);
      }

      dispatch(authSuccess(user));
      onClose();
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      setAuthError(msg);
      dispatch(authFailure(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrors({});
    setAuthError(null);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose} aria-hidden="true">
      <div
        className="auth-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal__close"
          onClick={onClose}
          aria-label="Close authentication modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="auth-modal__header">
          <div className="auth-modal__logo-mark" aria-hidden="true">
            <span>B</span>
          </div>
          <h2 id="auth-modal-title" className="auth-modal__title">
            {mode === 'signin' ? 'Welcome to Bentorah' : 'Create your Bentorah account'}
          </h2>
          <p className="auth-modal__subtitle">
            {mode === 'signin'
              ? 'Sign in to track your orders and enjoy a faster checkout experience.'
              : 'Join Bentorah for seamless order tracking, express checkout, and saved preferences.'}
          </p>
        </div>

        {/* Global error banner */}
        {authError && (
          <div className="auth-modal__alert" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{authError}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <div className="auth-modal__social">
          <GoogleAuthButton
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            disabled={isSubmitting}
            text="Continue with Google"
          />
        </div>

        {/* Divider */}
        <div className="auth-modal__divider" role="separator" aria-label="or divider">
          <span>OR</span>
        </div>

        {/* Credentials Form */}
        <form className="auth-modal__form" onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <div className="auth-modal__grid-row">
              <div className="auth-modal__field">
                <label className="auth-modal__label" htmlFor="modal-firstName">
                  First Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="modal-firstName"
                  ref={firstInputRef}
                  name="firstName"
                  type="text"
                  className={`auth-modal__input ${errors.firstName ? 'auth-modal__input--error' : ''}`}
                  placeholder="e.g. Alex"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting || isGoogleLoading}
                  autoComplete="given-name"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? 'modal-fn-err' : undefined}
                />
                {errors.firstName && (
                  <p id="modal-fn-err" className="auth-modal__field-error" role="alert">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="auth-modal__field">
                <label className="auth-modal__label" htmlFor="modal-lastName">
                  Last Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="modal-lastName"
                  name="lastName"
                  type="text"
                  className={`auth-modal__input ${errors.lastName ? 'auth-modal__input--error' : ''}`}
                  placeholder="e.g. Johnson"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isSubmitting || isGoogleLoading}
                  autoComplete="family-name"
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? 'modal-ln-err' : undefined}
                />
                {errors.lastName && (
                  <p id="modal-ln-err" className="auth-modal__field-error" role="alert">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="auth-modal__field">
            <label className="auth-modal__label" htmlFor="modal-email">
              Email Address <span aria-hidden="true">*</span>
            </label>
            <input
              id="modal-email"
              ref={mode === 'signin' ? firstInputRef : null}
              name="email"
              type="email"
              className={`auth-modal__input ${errors.email ? 'auth-modal__input--error' : ''}`}
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting || isGoogleLoading}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'modal-email-err' : undefined}
            />
            {errors.email && (
              <p id="modal-email-err" className="auth-modal__field-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="auth-modal__field">
            <div className="auth-modal__label-row">
              <label className="auth-modal__label" htmlFor="modal-password">
                Password <span aria-hidden="true">*</span>
              </label>
            </div>
            <div className="auth-modal__password-wrap">
              <input
                id="modal-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`auth-modal__input ${errors.password ? 'auth-modal__input--error' : ''}`}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting || isGoogleLoading}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'modal-pwd-err' : undefined}
              />
              <button
                type="button"
                className="auth-modal__toggle-pwd"
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
            {errors.password && (
              <p id="modal-pwd-err" className="auth-modal__field-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="auth-modal__submit-btn"
            disabled={isSubmitting || isGoogleLoading}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span className="auth-modal__btn-loading">
                <span className="auth-modal__spinner" aria-hidden="true" />
                <span>{mode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
              </span>
            ) : (
              <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Switcher */}
        <div className="auth-modal__footer">
          {mode === 'signin' ? (
            <p className="auth-modal__switch-text">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchMode('signup')}
              >
                Create one
              </button>
            </p>
          ) : (
            <p className="auth-modal__switch-text">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => switchMode('signin')}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
