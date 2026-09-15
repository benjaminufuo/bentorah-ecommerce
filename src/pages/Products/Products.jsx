import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../../services/productService';
import ProductCard from '../../components/products/ProductCard/ProductCard';
import './Products.css';

const sortOptions = [
  {
    value: 'featured',
    label: 'Featured',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    value: 'newest',
    label: 'Newest Arrivals',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    value: 'price-asc',
    label: 'Price: Low to High',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
      </svg>
    ),
  },
  {
    value: 'price-desc',
    label: 'Price: High to Low',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
      </svg>
    ),
  },
  {
    value: 'rating',
    label: 'Best Rated',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
];

const priceRanges = [
  { label: 'All Prices', min: 0, max: 0 },
  { label: 'Under ₦30,000', min: 0, max: 30000 },
  { label: '₦30,000 – ₦60,000', min: 30000, max: 60000 },
  { label: '₦60,000 – ₦100,000', min: 60000, max: 100000 },
  { label: 'Above ₦100,000', min: 100000, max: 0 },
];

const ProductSkeleton = () => (
  <div className="products-skeleton">
    <div className="skeleton products-skeleton__image"></div>
    <div className="products-skeleton__body">
      <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '8px' }}></div>
      <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '8px' }}></div>
      <div className="skeleton" style={{ height: '12px', width: '100%', marginBottom: '12px' }}></div>
      <div className="skeleton" style={{ height: '20px', width: '40%' }}></div>
    </div>
  </div>
);

const Products = ({ pageType = 'shop' }) => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isNewArrivals = pageType === 'new-arrivals';
  const isDeals = pageType === 'deals';

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    search: searchParams.get('search') || '',
    sort: isNewArrivals ? 'newest' : (searchParams.get('sort') || 'featured'),
    priceRange: 0,
    inStock: false,
    onSale: isDeals || searchParams.get('filter') === 'sale',
    isNewOnly: isNewArrivals,
  });

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [sortOpen, setSortOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const sortRef = useRef(null);

  const getPageInfo = () => {
    if (isNewArrivals) {
      return {
        title: 'New Arrivals',
        sub: 'Discover the latest additions to the BENTORAH collection, freshly engineered for modern workspaces and active lifestyles.',
        badge: 'New In Store',
        badgeType: 'new',
        docTitle: 'New Arrivals — BENTORAH',
      };
    }
    if (isDeals) {
      return {
        title: 'Deals & Special Offers',
        sub: 'Save on premium audio, wearables, and productivity essentials with exclusive limited-time price drops.',
        badge: 'Special Offers',
        badgeType: 'deals',
        docTitle: 'Deals & Offers — BENTORAH',
      };
    }
    return {
      title: 'Explore Products',
      sub: 'Technology selected for how you work, create and live.',
      badge: null,
      badgeType: null,
      docTitle: 'Products — BENTORAH',
    };
  };

  const pageInfo = getPageInfo();

  useEffect(() => {
    document.title = pageInfo.docTitle;
    getCategories().then(setCategories).catch(console.error);
  }, [pageInfo.docTitle]);

  // Sync state if searchParams change externally (e.g. from navbar search)
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    const urlSort = searchParams.get('sort');
    const urlFilter = searchParams.get('filter');

    if (urlCategory || urlSearch !== null || urlSort || urlFilter) {
      setFilters((prev) => ({
        ...prev,
        category: urlCategory || prev.category,
        search: urlSearch !== null ? urlSearch : prev.search,
        sort: urlSort || (isNewArrivals ? 'newest' : prev.sort),
        onSale: isDeals || urlFilter === 'sale' || prev.onSale,
        isNewOnly: isNewArrivals || prev.isNewOnly,
      }));
      if (urlSearch !== null) {
        setSearchInput(urlSearch);
      }
    }
  }, [searchParams, isNewArrivals, isDeals]);

  // Close custom sort dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedRange = priceRanges[filters.priceRange];
      const result = await getProducts({
        category: filters.category,
        search: filters.search,
        sort: filters.sort,
        minPrice: selectedRange.min,
        maxPrice: selectedRange.max,
        inStock: filters.inStock,
        onSale: filters.onSale,
        isNewOnly: filters.isNewOnly,
      });
      setProducts(result.products);
    } catch (e) {
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      search: '',
      sort: isNewArrivals ? 'newest' : 'featured',
      priceRange: 0,
      inStock: false,
      onSale: isDeals,
      isNewOnly: isNewArrivals,
    });
    setSearchInput('');
  };

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.search ||
    filters.priceRange !== 0 ||
    filters.inStock ||
    (!isDeals && filters.onSale) ||
    (!isNewArrivals && filters.isNewOnly);

  const FilterPanel = ({ mobile = false }) => (
    <div className={mobile ? 'products-filter-drawer__body' : ''}>
      <div className="products-filter-group">
        <h3 className="products-filter-group__label">Category</h3>
        <ul className="products-filter-list">
          <li>
            <button
              className={`products-filter-item ${filters.category === 'all' ? 'products-filter-item--active' : ''}`}
              onClick={() => { setFilters((f) => ({ ...f, category: 'all' })); if (mobile) setFiltersOpen(false); }}
            >
              All Products
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                className={`products-filter-item ${filters.category === cat.id ? 'products-filter-item--active' : ''}`}
                onClick={() => { setFilters((f) => ({ ...f, category: cat.id })); if (mobile) setFiltersOpen(false); }}
              >
                {cat.label}
                <span className="products-filter-item__count">{cat.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="products-filter-group">
        <h3 className="products-filter-group__label">Price Range</h3>
        <ul className="products-filter-list">
          {priceRanges.map((range, i) => (
            <li key={i}>
              <button
                className={`products-filter-item ${filters.priceRange === i ? 'products-filter-item--active' : ''}`}
                onClick={() => setFilters((f) => ({ ...f, priceRange: i }))}
              >
                {range.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="products-filter-group">
        <h3 className="products-filter-group__label">Availability</h3>
        <label className="products-filter-toggle">
          <input type="checkbox" checked={filters.inStock} onChange={(e) => setFilters((f) => ({ ...f, inStock: e.target.checked }))} />
          <span>In stock only</span>
        </label>
        <label className="products-filter-toggle">
          <input type="checkbox" checked={filters.onSale} onChange={(e) => setFilters((f) => ({ ...f, onSale: e.target.checked }))} />
          <span>On sale</span>
        </label>
        <label className="products-filter-toggle">
          <input type="checkbox" checked={filters.isNewOnly} onChange={(e) => setFilters((f) => ({ ...f, isNewOnly: e.target.checked }))} />
          <span>New arrivals only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="products-page">
      <div className="products-page__header">
        <div className="bentorah-container">
          {pageInfo.badge && (
            <span className={`products-page__badge products-page__badge--${pageInfo.badgeType}`}>
              {pageInfo.badge}
            </span>
          )}
          <h1 className="products-page__title">{pageInfo.title}</h1>
          <p className="products-page__sub">{pageInfo.sub}</p>
        </div>
      </div>

      <div className="bentorah-container">
        <div className="products-layout">
          {/* Desktop Sidebar */}
          <aside className="products-filters" aria-label="Product filters">
            <div className="products-filters__header">
              <h2 className="products-filters__title">Filters</h2>
              {hasActiveFilters && (
                <button className="products-filters__clear" onClick={clearFilters}>Clear all</button>
              )}
            </div>
            <FilterPanel />
          </aside>

          {/* Main */}
          <div className="products-main">
            {/* Deals promotional banner */}
            {isDeals && (
              <div className="products-banner products-banner--deals">
                <span className="products-banner__icon">🏷️</span>
                <div className="products-banner__text">
                  <strong>Limited-Time Price Cuts</strong> — Up to 21% off selected BENTORAH premium hardware. All discounts are automatically applied.
                </div>
              </div>
            )}

            {/* New Arrivals banner */}
            {isNewArrivals && (
              <div className="products-banner products-banner--new">
                <span className="products-banner__icon">✨</span>
                <div className="products-banner__text">
                  <strong>Fresh Off The Line</strong> — The newest smart devices, audio gear, and productivity tools just added to BENTORAH.
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="products-toolbar">
              <form className="products-search" onSubmit={handleSearchSubmit} role="search">
                <label htmlFor="products-search-input" className="sr-only">Search products</label>
                <svg className="products-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  id="products-search-input"
                  type="search"
                  className="products-search__input"
                  placeholder="Search products…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </form>

              <div className="products-toolbar__right">
                <button
                  className={`products-toolbar__filter-btn ${hasActiveFilters ? 'products-toolbar__filter-btn--active' : ''}`}
                  onClick={() => setFiltersOpen(true)}
                  aria-label="Open filters"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  <span>Filters</span>
                  {hasActiveFilters && <span className="products-toolbar__filter-dot"></span>}
                </button>

                <div className="products-sort" ref={sortRef}>
                  <button
                    type="button"
                    className={`products-sort__btn ${sortOpen ? 'products-sort__btn--open' : ''}`}
                    onClick={() => setSortOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                    aria-label="Sort products"
                  >
                    <svg className="products-sort__btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/>
                    </svg>
                    <span className="products-sort__label-prefix">Sort:</span>
                    <span className="products-sort__current">
                      {sortOptions.find((opt) => opt.value === filters.sort)?.label || 'Featured'}
                    </span>
                    <svg
                      className={`products-sort__chevron ${sortOpen ? 'products-sort__chevron--rotated' : ''}`}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {sortOpen && (
                    <div className="products-sort__menu" role="listbox" aria-label="Sort options">
                      <div className="products-sort__menu-header">Sort Products</div>
                      <div className="products-sort__menu-list">
                        {sortOptions.map((opt) => {
                          const isSelected = filters.sort === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={`products-sort__option ${isSelected ? 'products-sort__option--selected' : ''}`}
                              onClick={() => {
                                setFilters((f) => ({ ...f, sort: opt.value }));
                                setSortOpen(false);
                              }}
                            >
                              <span className="products-sort__option-left">
                                <span className="products-sort__option-icon">{opt.icon}</span>
                                <span className="products-sort__option-label">{opt.label}</span>
                              </span>
                              {isSelected && (
                                <span className="products-sort__check-badge">
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <p className="products-count">
                  {!loading && `${products.length} product${products.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {/* Active filters */}
            {hasActiveFilters && (
              <div className="products-active-filters">
                {filters.category !== 'all' && (
                  <span className="products-active-filter">
                    {categories.find((c) => c.id === filters.category)?.label}
                    <button onClick={() => setFilters((f) => ({ ...f, category: 'all' }))} aria-label="Remove category filter">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="products-active-filter">
                    &ldquo;{filters.search}&rdquo;
                    <button onClick={() => { setFilters((f) => ({ ...f, search: '' })); setSearchInput(''); }} aria-label="Remove search">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                )}
                {filters.priceRange !== 0 && (
                  <span className="products-active-filter">
                    {priceRanges[filters.priceRange].label}
                    <button onClick={() => setFilters((f) => ({ ...f, priceRange: 0 }))} aria-label="Remove price filter">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                )}
                {filters.inStock && (
                  <span className="products-active-filter">
                    In stock
                    <button onClick={() => setFilters((f) => ({ ...f, inStock: false }))} aria-label="Remove in stock filter">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                )}
                {filters.onSale && !isDeals && (
                  <span className="products-active-filter">
                    On sale
                    <button onClick={() => setFilters((f) => ({ ...f, onSale: false }))} aria-label="Remove on sale filter">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                )}
                {filters.isNewOnly && !isNewArrivals && (
                  <span className="products-active-filter">
                    New arrivals only
                    <button onClick={() => setFilters((f) => ({ ...f, isNewOnly: false }))} aria-label="Remove new arrivals filter">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Grid */}
            {error ? (
              <div className="products-error">
                <p>{error}</p>
                <button className="products-error__retry" onClick={fetchProducts}>Try Again</button>
              </div>
            ) : loading ? (
              <div className="products-grid">
                {Array.from({ length: 9 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="products-empty">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <h3>No products found</h3>
                <p>Try adjusting your search or filters.</p>
                <button className="products-empty__clear" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <>
          <div className="products-filter-backdrop" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
          <div className="products-filter-drawer" role="dialog" aria-label="Filter products" aria-modal="true">
            <div className="products-filter-drawer__header">
              <h2>Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <FilterPanel mobile />
            <div className="products-filter-drawer__footer">
              <button className="products-filter-drawer__apply" onClick={() => setFiltersOpen(false)}>
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button className="products-filter-drawer__clear" onClick={() => { clearFilters(); setFiltersOpen(false); }}>
                  Clear All
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Products;
