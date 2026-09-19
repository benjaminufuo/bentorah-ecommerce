import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../../redux/authSlice';
import { mergeGuestCartOnLogin } from '../../redux/cartSlice';
import { fetchCurrentUser, exchangeGoogleCode } from '../../services/authService';
import { useToast } from '../../components/ui/Toast/ToastContext';
import './AuthCallback.css';

const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const [state, setState] = useState('processing'); // 'processing' | 'success' | 'failed'
  const [errorMessage, setErrorMessage] = useState('');

  // Strict guard: ensure authentication exchange only executes once
  const hasProcessedRef = useRef(false);

  // Extract exchange code, token, or error from query parameters
  const code = searchParams.get('code');
  const token =
    searchParams.get('token') ||
    searchParams.get('jwt') ||
    searchParams.get('access_token') ||
    searchParams.get('accessToken');

  const errorParam = searchParams.get('error') || searchParams.get('message');
  const redirectTarget = searchParams.get('redirect') || '/';

  useEffect(() => {
    document.title = 'Authenticating with Google — BENTORAH';

    if (errorParam) {
      setState('failed');
      setErrorMessage(decodeURIComponent(errorParam));
      return;
    }

    if (!code && !token) {
      setState('failed');
      setErrorMessage('No authentication code or token received from Google callback.');
      return;
    }

    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    let isMounted = true;

    const processAuth = async () => {
      dispatch(authStart());

      try {
        let user;

        if (code) {
          // Exchange one-time Google authorization code for JWT token & user profile
          user = await exchangeGoogleCode(code);
        } else if (token) {
          // Store the directly received JWT token and fetch profile
          localStorage.setItem('bentorah_token', token);
          user = await fetchCurrentUser();
        }

        if (!isMounted) return;

        if (user) {
          dispatch(authSuccess(user));
          dispatch(mergeGuestCartOnLogin());
          setState('success');
          toast.success(`Welcome, ${user.firstName || user.name || 'Shopper'}!`);

          // Automatically navigate to intended page after 600ms
          setTimeout(() => {
            if (isMounted) navigate(redirectTarget, { replace: true });
          }, 600);
        } else {
          throw new Error('Unable to retrieve user account profile.');
        }
      } catch (err) {
        if (!isMounted) return;
        setState('failed');
        let msg = err.message || 'Authentication with Google failed. Please try again.';
        if (msg.includes('Too many attempts') || msg.includes('429')) {
          msg = 'Too many attempts made recently. Please wait a few minutes before trying again.';
        }
        setErrorMessage(msg);
        dispatch(authFailure(msg));
      }
    };

    processAuth();

    return () => {
      isMounted = false;
    };
  }, []); // Run once on mount

  return (
    <div className="auth-callback-page">
      <div className="bentorah-container">
        <div className="auth-callback-card">
          {state === 'processing' && (
            <div className="auth-callback-state">
              <div className="auth-callback-spinner" aria-hidden="true" />
              <h1 className="auth-callback-title">Signing You In</h1>
              <p className="auth-callback-subtitle">
                Please wait while we confirm your Google account details with Bentorah.
              </p>
            </div>
          )}

          {state === 'success' && (
            <div className="auth-callback-state">
              <div className="auth-callback-icon auth-callback-icon--success">
                <CheckCircleIcon />
              </div>
              <h1 className="auth-callback-title">Sign In Successful</h1>
              <p className="auth-callback-subtitle">
                You have been authenticated successfully. Redirecting you to your destination…
              </p>
              <div className="auth-callback-actions">
                <Link to={redirectTarget} className="bentorah-btn bentorah-btn--primary">
                  Continue Now &rarr;
                </Link>
              </div>
            </div>
          )}

          {state === 'failed' && (
            <div className="auth-callback-state">
              <div className="auth-callback-icon auth-callback-icon--failed">
                <AlertCircleIcon />
              </div>
              <h1 className="auth-callback-title">Authentication Failed</h1>
              <p className="auth-callback-subtitle">
                {errorMessage || 'Google sign-in could not be completed.'}
              </p>
              <div className="auth-callback-actions">
                <Link to="/" className="bentorah-btn bentorah-btn--primary">
                  Return to Homepage
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
