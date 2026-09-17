import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../../redux/cartSlice';
import { selectCurrentUser } from '../../redux/authSlice';
import { initializePayment, processPayment } from '../../services/paymentService';
import { createOrder } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../components/ui/Toast/ToastContext';
import './Payment.css';

const paymentMethods = [
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Pay securely via Paystack — card, bank transfer, USSD',
    icon: '💳',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Pay via Flutterwave — card, mobile money, bank',
    icon: '🦋',
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Manual transfer to our GTBank/Zenith account',
    icon: '🏦',
  },
];

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const orderData = location.state;
  const currentUser = useSelector(selectCurrentUser);
  const [selectedMethod, setSelectedMethod] = useState('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!orderData) { navigate('/cart'); return; }
    document.title = 'Payment — BENTORAH';
  }, [orderData, navigate]);

  if (!orderData) return null;

  const { form, deliveryOption, deliveryFee, subtotal, total, cartItems } = orderData;

  const handlePay = async () => {
    setIsProcessing(true);
    setProgress(20);

    try {
      // 1. Create order on backend first
      setProgress(40);
      const order = await createOrder({
        userId: currentUser?.id || null,
        customer: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        deliveryAddress: {
          address: form.address,
          city: form.city,
          state: form.state,
        },
        deliveryOption,
        items: cartItems.map((item) => ({
          productId: item.id || item.productId,
          name: item.name,
          variant: item.variant?.label || null,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        subtotal,
        deliveryFee,
        discount: 0,
        total,
        paymentMethod: selectedMethod,
        paymentStatus: 'pending',
      });

      // 2. Gateway payments (Paystack / Flutterwave)
      if (selectedMethod === 'paystack' || selectedMethod === 'flutterwave') {
        setProgress(75);
        const orderId = order._id || order.id;
        const paymentInit = await initializePayment({
          orderId,
          amount: total,
          email: form.email,
          method: selectedMethod,
        });

        if (paymentInit?.authorizationUrl) {
          setProgress(100);
          sessionStorage.setItem('bentorah_pending_order', JSON.stringify(order));
          sessionStorage.setItem('bentorah_pending_ref', paymentInit.reference);

          toast.success(
            `Connecting to ${selectedMethod === 'paystack' ? 'Paystack' : 'Flutterwave'}… Redirecting now!`
          );

          // Redirect the customer to the secure gateway URL
          setTimeout(() => {
            window.location.href = paymentInit.authorizationUrl;
          }, 350);
          return;
        }
      }

      // 3. Bank Transfer or direct offline completion
      setProgress(100);
      dispatch(clearCart());
      toast.success(
        selectedMethod === 'bank-transfer'
          ? 'Order placed! Please complete your bank transfer.'
          : 'Order placed successfully!'
      );

      setTimeout(() => {
        navigate('/order-success', { state: { order } });
      }, 600);

    } catch (err) {
      setProgress(0);
      setIsProcessing(false);
      console.error('Payment flow error:', err);
      toast.error(err.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <div className="payment-page">
      <div className="bentorah-container">
        <div className="payment-layout">
          <div className="payment-main">
            <h1 className="payment-page__title">Payment</h1>

            {/* Method Selection */}
            <div className="payment-methods">
              <h2 className="payment-section-heading">Select Payment Method</h2>
              <div className="payment-methods__list">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`payment-method ${selectedMethod === method.id ? 'payment-method--active' : ''}`}
                    htmlFor={`method-${method.id}`}
                  >
                    <input
                      id={`method-${method.id}`}
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                      className="sr-only"
                    />
                    <div className="payment-method__radio" aria-hidden="true">
                      {selectedMethod === method.id && <div className="payment-method__radio-fill"></div>}
                    </div>
                    <span className="payment-method__icon" aria-hidden="true">{method.icon}</span>
                    <div className="payment-method__info">
                      <p className="payment-method__name">{method.name}</p>
                      <p className="payment-method__desc">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Gateway Information Card */}
            {(selectedMethod === 'paystack' || selectedMethod === 'flutterwave') && (
              <div className="payment-gateway-card">
                <div className="payment-gateway-card__badge">
                  <span className="payment-gateway-card__pulse"></span>
                  Live Gateway
                </div>
                <h3 className="payment-gateway-card__title">
                  {selectedMethod === 'paystack' ? 'Paystack Checkout' : 'Flutterwave Checkout'}
                </h3>
                <p className="payment-gateway-card__desc">
                  You will be securely redirected to {selectedMethod === 'paystack' ? 'Paystack' : 'Flutterwave'} to complete your transaction with Card, Bank Transfer, USSD, or Mobile Money.
                </p>
                <div className="payment-gateway-card__channels">
                  <span className="payment-gateway-chip">💳 Debit / Credit Card</span>
                  <span className="payment-gateway-chip">🏦 Bank Transfer</span>
                  <span className="payment-gateway-chip">📱 USSD</span>
                  <span className="payment-gateway-chip">🔒 256-Bit Encryption</span>
                </div>
              </div>
            )}

            {selectedMethod === 'bank-transfer' && (
              <div className="payment-bank-details">
                <h2 className="payment-section-heading">Bank Transfer Details</h2>
                <div className="payment-bank-details__card">
                  <div className="payment-bank-details__row"><span>Bank</span><strong>GTBank</strong></div>
                  <div className="payment-bank-details__row"><span>Account Name</span><strong>BENTORAH Technologies Ltd</strong></div>
                  <div className="payment-bank-details__row"><span>Account Number</span><strong>0123456789</strong></div>
                  <div className="payment-bank-details__row"><span>Amount</span><strong className="payment-bank-details__amount">{formatCurrency(total)}</strong></div>
                </div>
                <p className="payment-bank-details__note">Transfer the exact amount and include your name as reference. Orders are confirmed within 2 hours.</p>
              </div>
            )}

            {/* Progress bar */}
            {isProcessing && (
              <div className="payment-progress" role="status" aria-label="Processing payment">
                <div className="payment-progress__bar">
                  <div className="payment-progress__fill" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="payment-progress__text">
                  {progress < 40
                    ? 'Creating order on server…'
                    : progress < 80
                    ? `Initializing ${selectedMethod === 'paystack' ? 'Paystack' : selectedMethod === 'flutterwave' ? 'Flutterwave' : 'payment'}…`
                    : 'Redirecting to payment gateway…'}
                </p>
              </div>
            )}

            {/* Pay button */}
            <button
              className="payment-pay-btn"
              onClick={handlePay}
              disabled={isProcessing}
              aria-label={`Pay ${formatCurrency(total)} with ${selectedMethod}`}
            >
              {isProcessing ? (
                <>
                  <span className="payment-pay-btn__spinner" aria-hidden="true"></span>
                  {selectedMethod === 'paystack'
                    ? 'Connecting to Paystack…'
                    : selectedMethod === 'flutterwave'
                    ? 'Connecting to Flutterwave…'
                    : 'Processing…'}
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  {selectedMethod === 'paystack'
                    ? `Pay ${formatCurrency(total)} with Paystack →`
                    : selectedMethod === 'flutterwave'
                    ? `Pay ${formatCurrency(total)} with Flutterwave →`
                    : `Confirm Order (${formatCurrency(total)})`}
                </>
              )}
            </button>

            <p className="payment-secure-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              256-bit SSL encrypted. Your payment information is never stored.
            </p>
          </div>

          {/* Order summary */}
          <aside className="payment-summary" aria-label="Order summary">
            <h2 className="payment-summary__title">Order Summary</h2>

            <div className="payment-summary__items">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.variantKey}`} className="payment-summary__item">
                  <div className="payment-summary__item-img-wrap">
                    <img src={item.image} alt={item.name} className="payment-summary__item-img" loading="lazy" />
                    <span className="payment-summary__item-qty">{item.quantity}</span>
                  </div>
                  <div className="payment-summary__item-info">
                    <p className="payment-summary__item-name">{item.name}</p>
                    {item.variant && <p className="payment-summary__item-meta">{item.variant.label}</p>}
                  </div>
                  <p className="payment-summary__item-price">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="payment-summary__totals">
              <div className="payment-summary__row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="payment-summary__row"><span>Delivery</span><span>{formatCurrency(deliveryFee)}</span></div>
              <div className="payment-summary__row payment-summary__row--total">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="payment-summary__address">
              <p className="payment-summary__address-label">Delivering to</p>
              <p>{form.firstName} {form.lastName}</p>
              <p>{form.address}, {form.city}, {form.state}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Payment;
