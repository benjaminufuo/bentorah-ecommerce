import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductById, getRelatedProducts } from '../../services/productService';
import { addToCart, updateQuantity, selectIsInCart } from '../../redux/cartSlice';
import { useToast } from '../../components/ui/Toast/ToastContext';
import ProductCard from '../../components/products/ProductCard/ProductCard';
import { formatCurrency } from '../../utils/formatters';
import './ProductDetails.css';

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [adding, setAdding] = useState(false);

  const variantKey = selectedVariant?.value || 'default';
  const isInCart = useSelector(selectIsInCart(id, variantKey));

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setError(null);
    setSelectedImage(0);
    setQuantity(1);

    getProductById(id)
      .then((data) => {
        setProduct(data);
        setSelectedVariant(data.variants?.[0] || null);
        document.title = `${data.name} — BENTORAH`;
        return getRelatedProducts(data.categorySlug, data.id);
      })
      .then(setRelated)
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    await new Promise((r) => setTimeout(r, 400));
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      category: product.category,
      variant: selectedVariant,
      quantity,
    }));
    toast.success(`${product.name} added to cart`);
    setAdding(false);
  };

  const handleBuyNow = () => {
    if (!product) return;
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      category: product.category,
      variant: selectedVariant,
      quantity,
    }));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="pd-loading bentorah-container">
        <div className="pd-loading__grid">
          <div className="skeleton pd-loading__image"></div>
          <div className="pd-loading__info">
            <div className="skeleton" style={{ height: '14px', width: '30%', marginBottom: '12px' }}></div>
            <div className="skeleton" style={{ height: '32px', width: '85%', marginBottom: '12px' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '24px' }}></div>
            <div className="skeleton" style={{ height: '28px', width: '40%', marginBottom: '32px' }}></div>
            <div className="skeleton" style={{ height: '48px', width: '100%', marginBottom: '12px' }}></div>
            <div className="skeleton" style={{ height: '48px', width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pd-error bentorah-container">
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/products" className="pd-error__back">Back to Products</Link>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 8;

  return (
    <div className="product-details-page">
      <div className="bentorah-container">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products">Products</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/products?category=${product.categorySlug}`}>{product.category}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pd-grid">
          {/* Images */}
          <div className="pd-images">
            <div className="pd-images__main">
              <img
                src={product.images[selectedImage]}
                alt={`${product.name} - view ${selectedImage + 1}`}
                className="pd-images__hero"
              />
              {product.isNew && <span className="pd-badge pd-badge--new">New</span>}
              {product.isOnSale && <span className="pd-badge pd-badge--sale">-{product.discount}%</span>}
            </div>
            {product.images.length > 1 && (
              <div className="pd-images__thumbs" role="tablist" aria-label="Product images">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    className={`pd-images__thumb ${selectedImage === i ? 'pd-images__thumb--active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                    role="tab"
                    aria-selected={selectedImage === i}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd-info">
            <div className="pd-info__meta">
              <span className="pd-info__category">{product.category}</span>
              <div className="pd-info__rating" aria-label={`Rated ${product.rating} out of 5`}>
                <span className="pd-info__stars">
                  {Array.from({ length: 5 }, (_, i) => <StarIcon key={i} filled={i < Math.floor(product.rating)} />)}
                </span>
                <span className="pd-info__rating-num">{product.rating}</span>
                <span className="pd-info__reviews">({product.reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="pd-info__name">{product.name}</h1>
            <p className="pd-info__short-desc">{product.shortDescription}</p>

            <div className="pd-info__pricing">
              <span className="pd-info__price">{formatCurrency(product.price)}</span>
              {product.oldPrice && (
                <>
                  <span className="pd-info__old-price">{formatCurrency(product.oldPrice)}</span>
                  <span className="pd-info__savings">Save {formatCurrency(product.oldPrice - product.price)}</span>
                </>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="pd-variants">
                <p className="pd-variants__label">
                  Colour: <strong>{selectedVariant?.label}</strong>
                </p>
                <div className="pd-variants__swatches">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      className={`pd-variants__swatch ${selectedVariant?.id === v.id ? 'pd-variants__swatch--active' : ''}`}
                      style={{ backgroundColor: v.colorHex }}
                      onClick={() => setSelectedVariant(v)}
                      aria-label={`Select colour: ${v.label}`}
                      aria-pressed={selectedVariant?.id === v.id}
                      title={v.label}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="pd-quantity">
              <p className="pd-quantity__label">Quantity</p>
              <div className="pd-quantity__controls">
                <button
                  className="pd-quantity__btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span className="pd-quantity__value" aria-live="polite" aria-atomic="true">{quantity}</span>
                <button
                  className="pd-quantity__btn"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
              {lowStock && (
                <p className="pd-quantity__stock-warn">Only {product.stock} left</p>
              )}
            </div>

            {/* Actions */}
            <div className="pd-actions">
              {inStock ? (
                <>
                  <button
                    id="add-to-cart-btn"
                    className={`pd-actions__add-cart ${adding ? 'pd-actions__add-cart--loading' : ''} ${isInCart ? 'pd-actions__add-cart--added' : ''}`}
                    onClick={handleAddToCart}
                    disabled={adding}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    {adding ? (
                      <span className="pd-actions__spinner" aria-hidden="true"></span>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                      </svg>
                    )}
                    {isInCart ? 'Added to Cart ✓' : 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    className="pd-actions__buy-now"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </button>
                </>
              ) : (
                <div className="pd-actions__oos">Out of Stock</div>
              )}
            </div>

            {/* Meta info */}
            <div className="pd-meta-info">
              <div className="pd-meta-info__row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <span><strong>Delivery:</strong> {product.deliveryTime}</span>
              </div>
              <div className="pd-meta-info__row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                <span><strong>Returns:</strong> 14-day hassle-free returns</span>
              </div>
              <div className="pd-meta-info__row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <span><strong>Warranty:</strong> {product.warranty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pd-tabs">
          <div className="pd-tabs__nav" role="tablist">
            {['description', 'specifications'].map((tab) => (
              <button
                key={tab}
                className={`pd-tabs__tab ${activeTab === tab ? 'pd-tabs__tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                id={`tab-${tab}`}
                aria-controls={`tabpanel-${tab}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="pd-tabs__content">
            <div
              id="tabpanel-description"
              role="tabpanel"
              aria-labelledby="tab-description"
              hidden={activeTab !== 'description'}
            >
              <p className="pd-tabs__description">{product.description}</p>
            </div>

            <div
              id="tabpanel-specifications"
              role="tabpanel"
              aria-labelledby="tab-specifications"
              hidden={activeTab !== 'specifications'}
            >
              <table className="pd-specs-table">
                <tbody>
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <tr key={key} className="pd-specs-table__row">
                      <td className="pd-specs-table__key">{key}</td>
                      <td className="pd-specs-table__val">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="pd-related" aria-labelledby="related-heading">
            <div className="pd-related__header">
              <h2 id="related-heading" className="pd-related__title">You might also like</h2>
              <Link to={`/products?category=${product.categorySlug}`} className="pd-related__link">
                <ChevronLeft /> More {product.category}
              </Link>
            </div>
            <div className="pd-related__grid">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
