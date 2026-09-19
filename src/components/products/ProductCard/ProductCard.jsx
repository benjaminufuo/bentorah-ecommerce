import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItem as addToCart, selectIsInCart } from '../../../redux/cartSlice';
import { useToast } from '../../ui/Toast/ToastContext';
import { formatCurrency } from '../../../utils/formatters';
import './ProductCard.css';

const StarIcon = ({ filled }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const defaultVariant = product.variants?.[0];
  const variantKey = defaultVariant ? defaultVariant.value : 'default';
  const isInCart = useSelector(selectIsInCart(product.id, variantKey));

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      category: product.category,
      variant: defaultVariant || null,
      quantity: 1,
    }));
    toast.success(`${product.name} added to cart`);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} filled={i < Math.floor(rating)} />
    ));
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card__image-wrap" aria-label={`View ${product.name}`}>
        <img
          src={product.images[0]}
          alt={product.name}
          className="product-card__image"
          loading="lazy"
        />
        {/* Badges */}
        <div className="product-card__badges">
          {product.isNew && <span className="product-card__badge product-card__badge--new">New</span>}
          {product.isOnSale && product.oldPrice && (
            <span className="product-card__badge product-card__badge--sale">-{product.discount}%</span>
          )}
        </div>
      </Link>

      <div className="product-card__content">
        <div className="product-card__meta">
          <span className="product-card__category">{product.category}</span>
          <div className="product-card__rating" aria-label={`Rating: ${product.rating} out of 5`}>
            <span className="product-card__stars">{renderStars(product.rating)}</span>
            <span className="product-card__rating-value">{product.rating}</span>
            <span className="product-card__review-count">({product.reviewCount})</span>
          </div>
        </div>

        <Link to={`/products/${product.id}`} className="product-card__name-link">
          <h3 className="product-card__name">{product.name}</h3>
        </Link>

        <p className="product-card__desc">{product.shortDescription}</p>

        <div className="product-card__footer">
          <div className="product-card__pricing">
            <span className="product-card__price">{formatCurrency(product.price)}</span>
            {product.oldPrice && (
              <span className="product-card__old-price">{formatCurrency(product.oldPrice)}</span>
            )}
          </div>

          <div className="product-card__actions">
            {product.stock === 0 ? (
              <span className="product-card__out-of-stock">Out of stock</span>
            ) : (
              <button
                className={`product-card__add-btn ${isInCart ? 'product-card__add-btn--added' : ''}`}
                onClick={handleAddToCart}
                aria-label={`Add ${product.name} to cart`}
              >
                <CartIcon />
                <span>{isInCart ? 'In Cart' : 'Add to Cart'}</span>
              </button>
            )}
          </div>
        </div>

        {product.stock > 0 && product.stock <= 10 && (
          <p className="product-card__stock-warning">Only {product.stock} left</p>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
