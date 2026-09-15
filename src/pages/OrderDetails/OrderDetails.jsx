import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = `Order #${id} — BENTORAH`;
    getOrderById(id)
      .then(setOrder)
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const statusColors = {
    processing: { bg: '#FEF3C7', text: '#92400E', label: 'Processing' },
    shipped: { bg: '#DBEAFE', text: '#1E40AF', label: 'Shipped' },
    delivered: { bg: '#DCFCE7', text: '#14532D', label: 'Delivered' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  };
  const statusStyle = statusColors[order?.status] || statusColors.processing;

  if (loading) {
    return (
      <div className="order-details-page bentorah-container">
        <div className="skeleton" style={{ height: '32px', width: '40%', marginBottom: '24px' }}></div>
        <div className="skeleton" style={{ height: '200px', borderRadius: '12px', marginBottom: '16px' }}></div>
        <div className="skeleton" style={{ height: '300px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-error bentorah-container">
        <h2>Order Not Found</h2>
        <p>We couldn't find order #{id}. It may have expired or the ID is incorrect.</p>
        <Link to="/" className="order-details-error__btn">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="bentorah-container">
        {/* Header */}
        <div className="order-details__header">
          <div>
            <h1 className="order-details__title">Order #{order.id}</h1>
            <p className="order-details__date">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="order-details__status" style={{ background: statusStyle.bg, color: statusStyle.text }}>
            {statusStyle.label}
          </div>
        </div>

        <div className="order-details__layout">
          <div className="order-details__main">
            {/* Items */}
            <div className="order-details__section">
              <h2 className="order-details__section-title">Items</h2>
              <div className="order-details__items">
                {order.items.map((item, i) => (
                  <div key={i} className="order-details__item">
                    <div className="order-details__item-img-wrap">
                      <img src={item.image} alt={item.name} className="order-details__item-img" loading="lazy" />
                    </div>
                    <div className="order-details__item-info">
                      <Link to={`/products/${item.productId}`} className="order-details__item-name">{item.name}</Link>
                      {item.variant && <p className="order-details__item-meta">{item.variant}</p>}
                      <p className="order-details__item-meta">Qty: {item.quantity} &times; {formatCurrency(item.price)}</p>
                    </div>
                    <p className="order-details__item-subtotal">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="order-details__section">
              <h2 className="order-details__section-title">Tracking</h2>
              <ol className="order-details__timeline">
                {order.timeline.map((step, i) => (
                  <li key={i} className={`order-details__timeline-step ${step.done ? 'order-details__timeline-step--done' : ''}`}>
                    <div className="order-details__timeline-dot" aria-hidden="true">
                      {step.done
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : null
                      }
                    </div>
                    <div>
                      <p className="order-details__timeline-label">{step.step}</p>
                      {step.date && <p className="order-details__timeline-date">{formatDate(step.date)}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="order-details__sidebar">
            {/* Totals */}
            <div className="order-details__section">
              <h2 className="order-details__section-title">Summary</h2>
              <div className="order-details__rows">
                <div className="order-details__row"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                <div className="order-details__row"><span>Delivery</span><span>{formatCurrency(order.deliveryFee)}</span></div>
                {order.discount > 0 && <div className="order-details__row"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
                <div className="order-details__row order-details__row--total"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
              </div>
            </div>

            {/* Address */}
            <div className="order-details__section">
              <h2 className="order-details__section-title">Delivery Address</h2>
              <div className="order-details__address">
                <p className="order-details__address-name">{order.customer.name}</p>
                <p>{order.deliveryAddress.address}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                <p>{order.customer.phone}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="order-details__section">
              <h2 className="order-details__section-title">Payment</h2>
              <p className="order-details__payment">
                <span>Method</span><strong>{order.paymentMethod}</strong>
              </p>
              <p className="order-details__payment">
                <span>Status</span>
                <strong className="order-details__paid">Paid</strong>
              </p>
              <p className="order-details__ref">Ref: {order.paymentReference}</p>
            </div>
          </aside>
        </div>

        {/* Actions */}
        <div className="order-details__actions">
          <Link to="/products" className="order-details__shop-btn">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
