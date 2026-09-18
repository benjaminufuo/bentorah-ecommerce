import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword, validateResetToken } from '../../services/authService';
import { useToast } from '../../components/ui/Toast/ToastContext';
import './ResetPassword.css';

const EyeIcon = ({ visible }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const token = searchParams.get('token') || searchParams.get('resetToken') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(Boolean(token));
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (token) {
      validateResetToken(token)
        .then((res) => {
          if (!isMounted) return;
          setIsValidatingToken(false);
          if (!res?.valid) {
            setIsTokenInvalid(true);
            setErrorMessage('This password reset link is invalid or has expired. Please request a new one.');
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setIsValidatingToken(false);
        });
    } else {
      setIsValidatingToken(false);
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token || isTokenInvalid) {
      setErrorMessage('Reset token is missing or invalid. Please check your email link or request a new one.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ token, newPassword });
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-pwd-page">
      <div className="bentorah-container">
        <div className="reset-pwd-card">
          {isSuccess ? (
            <div className="reset-pwd-success">
              <div className="reset-pwd-icon reset-pwd-icon--success">
                <CheckCircleIcon />
              </div>
              <h1 className="reset-pwd-title">Password Reset Complete</h1>
              <p className="reset-pwd-subtitle">
                Your password has been updated securely. You can now sign in with your new credentials.
              </p>
              <div className="reset-pwd-actions">
                <Link to="/" className="bentorah-btn bentorah-btn--primary">
                  Go to Homepage & Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="reset-pwd-header">
                <div className="reset-pwd-badge">Security</div>
                <h1 className="reset-pwd-title">Create New Password</h1>
                <p className="reset-pwd-subtitle">
                  Please choose a strong password with at least 6 characters.
                </p>
              </div>

              {errorMessage && (
                <div className="reset-pwd-alert" role="alert">
                  <span>{errorMessage}</span>
                </div>
              )}

              {!token && (
                <div className="reset-pwd-alert reset-pwd-alert--warning" role="alert">
                  <span>Warning: No reset token detected in URL. If you received an email, make sure the full link was copied.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="reset-pwd-form" noValidate>
                <div className="reset-pwd-field">
                  <label htmlFor="reset-new-password">New Password</label>
                  <div className="reset-pwd-input-wrap">
                    <input
                      id="reset-new-password"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="reset-pwd-eye-btn"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon visible={showNew} />
                    </button>
                  </div>
                </div>

                <div className="reset-pwd-field">
                  <label htmlFor="reset-confirm-password">Confirm New Password</label>
                  <div className="reset-pwd-input-wrap">
                    <input
                      id="reset-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="reset-pwd-eye-btn"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon visible={showConfirm} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bentorah-btn bentorah-btn--primary reset-pwd-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating Password…' : 'Reset Password'}
                </button>
              </form>

              <div className="reset-pwd-footer">
                <Link to="/" className="reset-pwd-back-link">
                  &larr; Back to Homepage
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
