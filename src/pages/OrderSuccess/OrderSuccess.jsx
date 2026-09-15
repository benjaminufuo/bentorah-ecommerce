import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;

  useEffect(() => {
    document.title = 'Order Confirmed — BENTORAH';
    window.scrollTo(0, 0);
    if (!order) return;
    // Confetti-like animation trigger
    document.querySelector('.order-success__icon')?.classList.add('order-success__icon--animate');
  }, [order]);

  if (!order) {
    return (
      <div className="order-success-page bentorah-container">
        <div className="order-success__fallback">
          <p>No order information found.</p>
          <Link to="/" className="order-success__home-btn">Go to Homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <div className="bentorah-container">
        {/* Header */}
        <div className="order-success__header">
          <div className="order-success__icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="order-success__title">Order Confirmed!</h1>
          <p className="order-success__subtitle">
            Thank you, <strong>{order.customer.name.split(' ')[0]}</strong>! Your order has been placed and is being processed.
          </p>
          <div className="order-success__ref">
            Order <span className="order-success__ref-id">#{order.id}</span>
            &nbsp;&bull;&nbsp;
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>

        <div className="order-success__layout">
          {/* Order details */}
          <div className="order-success__details">
            {/* Items */}
            <div className="order-success__section">
              <h2 className="order-success__section-title">Items Ordered</h2>
              <div className="order-success__items">
                {order.items.map((item, i) => (
                  <div key={i} className="order-success__item">
                    <div className="order-success__item-img-wrap">
                      <img src={item.image} alt={item.name} className="order-success__item-img" loading="lazy" />
                    </div>
                    <div className="order-success__item-info">
                      <p className="order-success__item-name">{item.name}</p>
                      {item.variant && <p className="order-success__item-meta">{item.variant}</p>}
                      <p className="order-success__item-meta">Qty: {item.quantity}</p>
                    </div>
                    <p className="order-success__item-price">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="order-success__section">
              <h2 className="order-success__section-title">Order Status</h2>
              <ol className="order-success__timeline" aria-label="Order progress">
                {order.timeline.map((step, i) => (
                  <li key={i} className={`order-success__timeline-step ${step.done ? 'order-success__timeline-step--done' : ''}`}>
                    <div className="order-success__timeline-dot" aria-hidden="true">
                      {step.done
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <div className="order-success__timeline-dot-inner"></div>
                      }
                    </div>
                    <div className="order-success__timeline-content">
                      <p className="order-success__timeline-label">{step.step}</p>
                      {step.date && <p className="order-success__timeline-date">{formatDate(step.date)}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Summary panel */}
          <aside className="order-success__summary" aria-label="Order summary">
            <div className="order-success__summary-section">
              <h2 className="order-success__section-title">Order Summary</h2>
              <div className="order-success__summary-rows">
                <div className="order-success__summary-row"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                <div className="order-success__summary-row"><span>Delivery</span><span>{formatCurrency(order.deliveryFee)}</span></div>
                {order.discount > 0 && <div className="order-success__summary-row"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
                <div className="order-success__summary-row order-success__summary-row--total">
                  <span>Total Paid</span><span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="order-success__summary-section">
              <h2 className="order-success__section-title">Delivery Address</h2>
              <div className="order-success__address">
                <p className="order-success__address-name">{order.customer.name}</p>
                <p>{order.deliveryAddress.address}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                <p>{order.customer.phone}</p>
              </div>
            </div>

            <div className="order-success__summary-section">
              <h2 className="order-success__section-title">Payment</h2>
              <p className="order-success__payment-info">
                Paid via <strong>{order.paymentMethod}</strong>
                <br/>
                <span className="order-success__payment-ref">Ref: {order.paymentReference}</span>
              </p>
            </div>

            <div className="order-success__eta">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <div>
                <p className="order-success__eta-label">Estimated Delivery</p>
                <p className="order-success__eta-date">{formatDate(order.estimatedDelivery)}</p>
              </div>
            </div>
          </aside>
        </div>

        {/* CTAs */}
        <div className="order-success__actions">
          <Link to={`/orders/${order.id}`} className="order-success__track-btn">
            View Order Details
          </Link>
          <Link to="/products" className="order-success__continue-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
