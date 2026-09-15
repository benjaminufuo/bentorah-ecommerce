import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  selectCartItems,
  selectCartSubtotal,
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../../redux/cartSlice';
import { formatCurrency } from '../../utils/formatters';
import './Cart.css';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const deliveryFee = subtotal >= 50000 ? 0 : 3500;
  const total = subtotal + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty bentorah-container">
        <div className="cart-empty__inner">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <h1 className="cart-empty__title">Your cart is empty</h1>
          <p className="cart-empty__text">Looks like you haven't added anything yet. Browse our collection and find something you love.</p>
          <Link to="/products" className="cart-empty__btn">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="bentorah-container">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Your Cart</h1>
          <button className="cart-page__clear" onClick={() => dispatch(clearCart())} aria-label="Clear all items from cart">
            Clear Cart
          </button>
        </div>

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            <ul>
              {cartItems.map((item) => (
                <li key={`${item.id}-${item.variantKey}`} className="cart-item">
                  <Link to={`/products/${item.id}`} className="cart-item__image-wrap" tabIndex={-1} aria-hidden="true">
                    <img src={item.image} alt={item.name} className="cart-item__image" loading="lazy" />
                  </Link>

                  <div className="cart-item__info">
                    <span className="cart-item__category">{item.category}</span>
                    <Link to={`/products/${item.id}`} className="cart-item__name">{item.name}</Link>
                    {item.variant && (
                      <p className="cart-item__variant">
                        <span className="cart-item__variant-dot" style={{ backgroundColor: item.variant.colorHex }}></span>
                        {item.variant.label}
                      </p>
                    )}
                    <p className="cart-item__unit-price">{formatCurrency(item.price)} each</p>
                  </div>

                  <div className="cart-item__controls">
                    <div className="cart-item__qty">
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => {
                          if (item.quantity <= 1) {
                            dispatch(removeFromCart({ id: item.id, variantKey: item.variantKey }));
                          } else {
                            dispatch(updateQuantity({ id: item.id, variantKey: item.variantKey, quantity: item.quantity - 1 }));
                          }
                        }}
                        aria-label="Decrease quantity"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                      <span className="cart-item__qty-val">{item.quantity}</span>
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => dispatch(updateQuantity({ id: item.id, variantKey: item.variantKey, quantity: item.quantity + 1 }))}
                        aria-label="Increase quantity"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>

                    <p className="cart-item__subtotal">{formatCurrency(item.subtotal)}</p>

                    <button
                      className="cart-item__remove"
                      onClick={() => dispatch(removeFromCart({ id: item.id, variantKey: item.variantKey }))}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Summary */}
          <aside className="cart-summary" aria-label="Order summary">
            <h2 className="cart-summary__title">Order Summary</h2>

            <div className="cart-summary__rows">
              <div className="cart-summary__row">
                <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? 'cart-summary__free' : ''}>
                  {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="cart-summary__free-hint">
                  Add {formatCurrency(50000 - subtotal)} more for free delivery
                </p>
              )}
            </div>

            <div className="cart-summary__total">
              <span>Total</span>
              <span className="cart-summary__total-amount">{formatCurrency(total)}</span>
            </div>

            <button
              className="cart-summary__checkout-btn"
              onClick={() => navigate('/checkout')}
              aria-label="Proceed to checkout"
            >
              Proceed to Checkout
            </button>

            <Link to="/products" className="cart-summary__continue">
              &larr; Continue Shopping
            </Link>

            <div className="cart-summary__trust">
              <span>🔒 Secure checkout</span>
              <span>↩ Easy returns</span>
              <span>🚚 Fast delivery</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;
