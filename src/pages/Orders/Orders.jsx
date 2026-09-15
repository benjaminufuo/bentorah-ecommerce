import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../redux/authSlice';
import { getMyOrders } from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './Orders.css';

const OrderCardSkeleton = () => (
  <div className="order-skeleton-card">
    <div className="order-skeleton-card__top">
      <div className="skeleton" style={{ height: '20px', width: '140px' }} />
      <div className="skeleton" style={{ height: '24px', width: '90px', borderRadius: '12px' }} />
    </div>
    <div className="order-skeleton-card__mid">
      <div className="skeleton" style={{ height: '56px', width: '56px', borderRadius: '8px' }} />
      <div className="skeleton" style={{ height: '56px', width: '56px', borderRadius: '8px' }} />
      <div style={{ flex: 1, marginLeft: '12px' }}>
        <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '14px', width: '40%' }} />
      </div>
    </div>
    <div className="order-skeleton-card__bottom">
      <div className="skeleton" style={{ height: '18px', width: '100px' }} />
      <div className="skeleton" style={{ height: '36px', width: '110px', borderRadius: '6px' }} />
    </div>
  </div>
);

const Orders = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getMyOrders(currentUser);
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Unable to load your orders.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    document.title = 'Order History — BENTORAH';
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status) => {
    const s = (status || 'processing').toLowerCase();
    switch (s) {
      case 'delivered':
        return <span className="order-badge order-badge--delivered">Delivered</span>;
      case 'dispatched':
      case 'shipped':
        return <span className="order-badge order-badge--shipped">Shipped</span>;
      case 'cancelled':
        return <span className="order-badge order-badge--cancelled">Cancelled</span>;
      case 'processing':
      default:
        return <span className="order-badge order-badge--processing">Processing</span>;
    }
  };

  const getPaymentBadge = (status) => {
    const s = (status || 'paid').toLowerCase();
    if (s === 'paid') {
      return <span className="order-pay-badge order-pay-badge--paid">Paid</span>;
    }
    return <span className="order-pay-badge order-pay-badge--pending">Pending</span>;
  };

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-page__header">
        <div className="bentorah-container">
          <div className="orders-page__breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Account</span>
            <span>/</span>
            <span>Orders</span>
          </div>
          <h1 className="orders-page__title">Order History</h1>
          <p className="orders-page__subtitle">
            View and track your previous Bentorah orders.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bentorah-container orders-page__content">
        {loading ? (
          <div className="orders-list">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        ) : error ? (
          /* Error State */
          <div className="orders-error-card" role="alert">
            <div className="orders-error-card__icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="orders-error-card__title">{error}</h2>
            <p className="orders-error-card__text">
              We encountered a problem while retrieving your order records. Please try again.
            </p>
            <button
              type="button"
              className="orders-error-card__btn"
              onClick={fetchOrders}
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="orders-empty-state">
            <div className="orders-empty-state__icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="orders-empty-state__title">No orders yet</h2>
            <p className="orders-empty-state__text">
              Your completed purchases will appear here with live tracking updates.
            </p>
            <Link to="/products" className="orders-empty-state__btn">
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="orders-list">
            {orders.map((order) => {
              const totalItems = (order.items || []).reduce(
                (sum, item) => sum + (item.quantity || 1),
                0
              );

              return (
                <article key={order.id} className="order-card">
                  <div className="order-card__header">
                    <div className="order-card__meta">
                      <div className="order-card__id-row">
                        <span className="order-card__num-label">Order</span>
                        <strong className="order-card__id">
                          {order.orderNumber || order.id}
                        </strong>
                      </div>
                      <span className="order-card__date">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="order-card__badges">
                      {getPaymentBadge(order.paymentStatus)}
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="order-card__items-preview">
                    <div className="order-card__thumbnails">
                      {(order.items || []).slice(0, 3).map((item, idx) => (
                        <div key={idx} className="order-card__thumb-wrap">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || 'Product'}
                              className="order-card__thumb-img"
                              loading="lazy"
                            />
                          ) : (
                            <div className="order-card__thumb-fallback">📦</div>
                          )}
                          {item.quantity > 1 && (
                            <span className="order-card__thumb-qty">&times;{item.quantity}</span>
                          )}
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <div className="order-card__thumb-more">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="order-card__items-summary">
                      <p className="order-card__item-names">
                        {(order.items || [])
                          .map((item) => item.name)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <span className="order-card__items-count">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="order-card__footer">
                    <div className="order-card__total-wrap">
                      <span className="order-card__total-label">Total Amount</span>
                      <strong className="order-card__total-amount">
                        {formatCurrency(order.total)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="order-card__view-btn"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      View Order
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
