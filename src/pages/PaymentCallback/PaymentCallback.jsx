import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../redux/cartSlice';
import { verifyPayment } from '../../services/paymentService';
import { getOrderById } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';
import './PaymentCallback.css';

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

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [state, setState] = useState('verifying'); // 'verifying' | 'success' | 'failed' | 'no-ref'
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedData, setVerifiedData] = useState(null);
  const [order, setOrder] = useState(null);

  // Extract reference from possible gateway query parameter variants
  const reference =
    searchParams.get('reference') ||
    searchParams.get('trxref') ||
    searchParams.get('tx_ref');

  useEffect(() => {
    document.title = 'Verifying Payment — BENTORAH';

    if (!reference) {
      setState('no-ref');
      return;
    }

    let isMounted = true;

    const runVerification = async () => {
      try {
        const result = await verifyPayment(reference);

        if (!isMounted) return;

        if (result && (result.verified || result.status === 'success' || result.status === 'completed')) {
          setVerifiedData(result);
          dispatch(clearCart());
          setState('success');

          // Check if we have a pending order saved in session
          let pendingOrder = null;
          try {
            const rawPending = sessionStorage.getItem('bentorah_pending_order');
            if (rawPending) pendingOrder = JSON.parse(rawPending);
          } catch (e) {}

          // Attempt to find associated order if backend returned orderId
          const orderId =
            result.details?.orderId ||
            result.orderId ||
            pendingOrder?.orderNumber ||
            pendingOrder?._id ||
            pendingOrder?.id;

          if (orderId) {
            try {
              const fetchedOrder = await getOrderById(orderId);
              if (isMounted) setOrder(fetchedOrder || pendingOrder);
            } catch (orderErr) {
              console.warn('Order lookup following payment verification:', orderErr);
              if (isMounted && pendingOrder) setOrder(pendingOrder);
            }
          } else if (pendingOrder && isMounted) {
            setOrder(pendingOrder);
          }

          // Clean up pending session after confirmation
          sessionStorage.removeItem('bentorah_pending_order');
          sessionStorage.removeItem('bentorah_pending_ref');
        } else {
          setState('failed');
          setErrorMessage(
            result?.details?.gateway_response ||
            result?.message ||
            'Payment could not be verified by the gateway.'
          );
        }
      } catch (err) {
        if (!isMounted) return;
        setState('failed');
        setErrorMessage(
          err.message || 'An error occurred while connecting to the payment gateway.'
        );
      }
    };

    runVerification();

    return () => {
      isMounted = false;
    };
  }, [reference, dispatch]);

  return (
    <div className="payment-callback-page">
      <div className="bentorah-container">
        <div className="payment-callback-card">
          {state === 'verifying' && (
            <div className="payment-callback-state payment-callback-state--loading">
              <div className="payment-callback-spinner" aria-hidden="true" />
              <h1 className="payment-callback-title">Verifying Your Payment</h1>
              <p className="payment-callback-subtitle">
                Please hold on while we securely confirm your transaction with the payment gateway.
              </p>
              {reference && (
                <div className="payment-callback-ref">
                  <span>Reference:</span> <code>{reference}</code>
                </div>
              )}
            </div>
          )}

          {state === 'success' && (
            <div className="payment-callback-state payment-callback-state--success">
              <div className="payment-callback-icon payment-callback-icon--success">
                <CheckCircleIcon />
              </div>
              <span className="payment-callback-badge">Payment Confirmed</span>
              <h1 className="payment-callback-title">Thank You for Your Order!</h1>
              <p className="payment-callback-subtitle">
                Your payment was received successfully. We are now processing your order and preparing it for delivery.
              </p>

              <div className="payment-callback-summary">
                <div className="payment-callback-summary__row">
                  <span>Transaction Reference</span>
                  <code>{reference}</code>
                </div>
                {verifiedData?.amount && (
                  <div className="payment-callback-summary__row">
                    <span>Amount Paid</span>
                    <strong>{formatCurrency(verifiedData.amount)}</strong>
                  </div>
                )}
                {order?.orderNumber && (
                  <div className="payment-callback-summary__row">
                    <span>Order Number</span>
                    <strong>#{order.orderNumber}</strong>
                  </div>
                )}
              </div>

              <div className="payment-callback-actions">
                {order?.orderNumber ? (
                  <Link
                    to={`/orders/${order.orderNumber}`}
                    className="bentorah-btn bentorah-btn--primary"
                  >
                    View Order Details &rarr;
                  </Link>
                ) : (
                  <Link to="/orders" className="bentorah-btn bentorah-btn--primary">
                    View My Orders &rarr;
                  </Link>
                )}
                <Link to="/" className="bentorah-btn bentorah-btn--secondary">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}

          {state === 'failed' && (
            <div className="payment-callback-state payment-callback-state--failed">
              <div className="payment-callback-icon payment-callback-icon--failed">
                <AlertCircleIcon />
              </div>
              <span className="payment-callback-badge payment-callback-badge--error">
                Payment Incomplete
              </span>
              <h1 className="payment-callback-title">Payment Verification Failed</h1>
              <p className="payment-callback-subtitle">
                {errorMessage || 'The payment transaction could not be verified or was declined.'}
              </p>

              {reference && (
                <div className="payment-callback-ref">
                  <span>Reference:</span> <code>{reference}</code>
                </div>
              )}

              <div className="payment-callback-actions">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="bentorah-btn bentorah-btn--primary"
                >
                  Return to Checkout
                </button>
                <Link to="/cart" className="bentorah-btn bentorah-btn--secondary">
                  Review Cart
                </Link>
              </div>
            </div>
          )}

          {state === 'no-ref' && (
            <div className="payment-callback-state payment-callback-state--failed">
              <div className="payment-callback-icon payment-callback-icon--failed">
                <AlertCircleIcon />
              </div>
              <h1 className="payment-callback-title">No Transaction Reference Found</h1>
              <p className="payment-callback-subtitle">
                This callback route expects a payment transaction reference from Paystack or Flutterwave.
              </p>
              <div className="payment-callback-actions">
                <Link to="/cart" className="bentorah-btn bentorah-btn--primary">
                  Go to Cart
                </Link>
                <Link to="/" className="bentorah-btn bentorah-btn--secondary">
                  Return Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
