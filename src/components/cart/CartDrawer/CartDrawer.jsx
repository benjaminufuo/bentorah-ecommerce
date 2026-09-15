import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { selectCartItems, selectCartSubtotal, removeFromCart } from '../../../redux/cartSlice';
import { formatCurrency } from '../../../utils/formatters';
import { useState, useEffect } from 'react';
import './CartDrawer.css';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

let setDrawerOpenGlobal = null;

export const openCartDrawer = () => {
  if (setDrawerOpenGlobal) setDrawerOpenGlobal(true);
};

const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);

  // Expose setIsOpen globally
  useEffect(() => {
    setDrawerOpenGlobal = setIsOpen;
    return () => { setDrawerOpenGlobal = null; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      <div
        className={`cart-drawer__backdrop ${isOpen ? 'cart-drawer__backdrop--visible' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`}
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        role="complementary"
      >
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            Your Cart
            {cartItems.length > 0 && (
              <span className="cart-drawer__count">{cartItems.length}</span>
            )}
          </h2>
          <button
            className="cart-drawer__close"
            onClick={() => setIsOpen(false)}
            aria-label="Close cart drawer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="cart-drawer__body">
          {cartItems.length === 0 ? (
            <div className="cart-drawer__empty">
              <div className="cart-drawer__empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <p className="cart-drawer__empty-title">Your cart is empty</p>
              <p className="cart-drawer__empty-text">Add a product to get started</p>
              <Link to="/products" className="cart-drawer__shop-btn" onClick={() => setIsOpen(false)}>
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="cart-drawer__items">
              {cartItems.map((item) => (
                <li key={`${item.id}-${item.variantKey}`} className="cart-drawer__item">
                  <div className="cart-drawer__item-image-wrap">
                    <img src={item.image} alt={item.name} className="cart-drawer__item-image" loading="lazy" />
                  </div>
                  <div className="cart-drawer__item-info">
                    <p className="cart-drawer__item-name">{item.name}</p>
                    {item.variant && (
                      <p className="cart-drawer__item-variant">{item.variant.label}</p>
                    )}
                    <p className="cart-drawer__item-price">{formatCurrency(item.price)} &times; {item.quantity}</p>
                  </div>
                  <div className="cart-drawer__item-right">
                    <p className="cart-drawer__item-subtotal">{formatCurrency(item.subtotal)}</p>
                    <button
                      className="cart-drawer__item-remove"
                      onClick={() => dispatch(removeFromCart({ id: item.id, variantKey: item.variantKey }))}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <span className="cart-drawer__subtotal-amount">{formatCurrency(subtotal)}</span>
            </div>
            <p className="cart-drawer__note">Shipping calculated at checkout</p>
            <div className="cart-drawer__ctas">
              <Link
                to="/cart"
                className="cart-drawer__view-cart"
                onClick={() => setIsOpen(false)}
              >
                View Cart
              </Link>
              <button className="cart-drawer__checkout-btn" onClick={handleCheckout}>
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
