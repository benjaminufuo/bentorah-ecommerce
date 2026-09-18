/**
 * BENTORAH Product Service
 * ============================================================
 * Handles all product catalog, category, and review queries.
 * Communicates with backend endpoints:
 *   - GET /products
 *   - GET /products/:slug
 *   - GET /categories
 *
 * Automatically translates backend schemas (title, longDescription, discountPrice,
 * colors, specifications) to the frontend component contract (name, description,
 * price, oldPrice, variants, etc.).
 *
 * Provides resilient mock fallback if the remote backend is unreachable.
 * ============================================================
 */

import { apiGet, simulateDelay, USE_MOCK } from './api';
import {
  products as mockProducts,
  categories as mockCategories,
  testimonials as mockTestimonials,
} from '../data/products';

/**
 * Adapter: Map backend Product schema to frontend product model
 * @param {object} p - Backend product object
 * @returns {object} Frontend product object
 */
export const mapBackendProduct = (p) => {
  if (!p) return null;

  const rawPrice = Number(p.price) || 0;
  const discountPrice = Number(p.discountPrice) || 0;
  const hasDiscount = Boolean(p.discountPercentage && p.discountPercentage !== 0);
  const finalPrice = discountPrice > 0 ? discountPrice : rawPrice;
  const oldPrice = hasDiscount && rawPrice > finalPrice ? rawPrice : null;
  const discountPercent = Math.abs(Number(p.discountPercentage) || 0);

  // Map specifications array [{ title, value }] -> dictionary
  let specifications = {};
  if (Array.isArray(p.specifications)) {
    p.specifications.forEach((spec) => {
      if (spec && spec.title) {
        specifications[spec.title] = spec.value || '';
      }
    });
  } else if (p.specifications && typeof p.specifications === 'object') {
    specifications = p.specifications;
  }

  // Map colors array [{ label, hexCode }] -> variants [{ id, label, value, colorHex }]
  const variants =
    Array.isArray(p.colors) && p.colors.length > 0
      ? p.colors.map((c, idx) => ({
          id: `v${idx + 1}`,
          label: c.label || `Option ${idx + 1}`,
          value: c.label || `option-${idx + 1}`,
          colorHex: c.hexCode || '#1a1a1a',
        }))
      : [{ id: 'v1', label: 'Standard', value: 'standard', colorHex: '#1a1a1a' }];

  // Category fallback
  const categoryName = p.category || 'General';
  const categorySlug =
    p.categorySlug ||
    (typeof p.category === 'string' ? p.category.toLowerCase().replace(/\s+/g, '-') : 'general');

  // Related products if included in GET /products/{slug}
  const relatedProducts = Array.isArray(p.relatedProducts)
    ? p.relatedProducts.map(mapBackendProduct)
    : undefined;

  return {
    id: p.id,
    _id: p.id,
    slug: p.slug || p.id,
    name: p.title || p.name || 'Untitled Product',
    title: p.title || p.name || 'Untitled Product',
    category: categoryName,
    categorySlug: categorySlug,
    price: finalPrice,
    oldPrice: oldPrice,
    discount: discountPercent,
    shortDescription: p.shortDescription || '',
    description: p.longDescription || p.description || p.shortDescription || '',
    images:
      Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    rating: typeof p.rating === 'number' && p.rating > 0 ? p.rating : 4.8,
    reviewCount: p.totalReviews ?? p.reviewCount ?? 12,
    stock: p.quantity ?? p.stock ?? 10,
    featured: Boolean(p.isSpecial ?? p.featured),
    isNew: Boolean(p.isNewArrival ?? p.isNew),
    isOnSale: Boolean(hasDiscount || p.isOnSale),
    variants,
    specifications,
    tags: p.tags || [categorySlug, 'bentorah'],
    deliveryTime: p.deliveryTime || '2–4 business days',
    warranty: p.warranty || '1-year manufacturer warranty',
    relatedProducts,
  };
};

/**
 * Adapter: Map backend Category schema to frontend category model
 * @param {object} c - Backend category object
 * @returns {object} Frontend category model
 */
export const mapBackendCategory = (c) => {
  if (!c) return null;
  const iconMap = {
    audio: '🎧',
    wearables: '⌚',
    gaming: '🎮',
    'work-essentials': '💻',
    mobile: '📱',
    'smart-home': '🏠',
  };
  const slug = c.slug || c.id || '';
  const normalizedSlug = (c.slug || c.name || '').toLowerCase().replace(/\s+/g, '-');
  return {
    id: slug,
    slug: slug,
    label: c.name || c.label || slug,
    name: c.name || c.label || slug,
    icon: iconMap[slug] || iconMap[normalizedSlug] || c.icon || '🛍️',
    count: c.productCount ?? c.count ?? 0,
  };
};

/**
 * Get all products with optional filtering and sorting
 * Backend: GET /products?category=&search=&sort=&minPrice=&maxPrice=&isNewArrival=&isSpecial=
 *
 * @param {object} filters
 * @returns {Promise<{ products: Array, total: number }>}
 */
export const getProducts = async ({
  category = 'all',
  search = '',
  sort = 'featured',
  minPrice = 0,
  maxPrice = 0,
  inStock = false,
  onSale = false,
  isNewOnly = false,
} = {}) => {
  if (!USE_MOCK) {
    try {
      // Map sort enum to backend expected values: featured, price_asc, price_desc, rating
      let apiSort = 'featured';
      if (sort === 'price-asc' || sort === 'price_asc') apiSort = 'price_asc';
      else if (sort === 'price-desc' || sort === 'price_desc') apiSort = 'price_desc';
      else if (sort === 'rating') apiSort = 'rating';

      const params = {
        category: category !== 'all' ? category : undefined,
        search: search.trim() || undefined,
        sort: apiSort,
        minPrice: minPrice > 0 ? minPrice : undefined,
        maxPrice: maxPrice > 0 ? maxPrice : undefined,
        isNewArrival: isNewOnly || sort === 'newest' ? true : undefined,
      };

      const res = await apiGet('/products', params);
      const rawList = res?.data || (Array.isArray(res) ? res : []);
      let productsList = rawList.map(mapBackendProduct);

      // Client-side post-filters if needed
      if (inStock) {
        productsList = productsList.filter((p) => p.stock > 0);
      }
      if (onSale) {
        productsList = productsList.filter((p) => p.isOnSale);
      }

      const total = res?.pagination?.total ?? productsList.length;
      return { products: productsList, total };
    } catch (err) {
      console.warn('Backend /products request failed, falling back to mock catalog:', err);
    }
  }

  await simulateDelay(250, 500);

  let result = [...mockProducts];

  // Category filter
  if (category && category !== 'all') {
    result = result.filter((p) => p.categorySlug === category);
  }

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.includes(q))
    );
  }

  // Price range
  if (minPrice > 0) result = result.filter((p) => p.price >= minPrice);
  if (maxPrice > 0) result = result.filter((p) => p.price <= maxPrice);

  // In stock
  if (inStock) result = result.filter((p) => p.stock > 0);

  // On sale
  if (onSale) result = result.filter((p) => p.isOnSale);

  // New arrivals only
  if (isNewOnly) result = result.filter((p) => p.isNew);

  // Sort
  switch (sort) {
    case 'newest':
      result = result.filter((p) => p.isNew).concat(result.filter((p) => !p.isNew));
      break;
    case 'price-asc':
    case 'price_asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
    case 'price_desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'featured':
    default:
      result = result.filter((p) => p.featured).concat(result.filter((p) => !p.featured));
  }

  return { products: result, total: result.length };
};

/**
 * Get a single product by ID or Slug
 * Backend: GET /products/:slug
 *
 * @param {string} idOrSlug
 * @returns {Promise<object>} Product details
 */
export const getProductById = async (idOrSlug) => {
  if (!USE_MOCK && idOrSlug) {
    try {
      // First attempt lookup via /products/:slug
      const res = await apiGet(`/products/${encodeURIComponent(idOrSlug)}`);
      if (res?.data) {
        return mapBackendProduct(res.data);
      }
    } catch (err) {
      // If 404, check if idOrSlug was a MongoDB ID by querying /products list
      try {
        const listRes = await apiGet('/products');
        const items = listRes?.data || (Array.isArray(listRes) ? listRes : []);
        const matched = items.find(
          (p) => p.id === idOrSlug || p.slug === idOrSlug || p._id === idOrSlug
        );
        if (matched) {
          // If we found the product, fetch its full detail by its slug
          if (matched.slug && matched.slug !== idOrSlug) {
            return getProductById(matched.slug);
          }
          return mapBackendProduct(matched);
        }
      } catch (fallbackErr) {
        console.warn('ID lookup fallback failed:', fallbackErr);
      }
    }
  }

  await simulateDelay(200, 450);
  const product = mockProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (!product) throw new Error(`Product not found: ${idOrSlug}`);
  return product;
};

/**
 * Get featured products for homepage / carousels
 * Backend: GET /products?isSpecial=true
 *
 * @returns {Promise<Array>}
 */
export const getFeaturedProducts = async () => {
  if (!USE_MOCK) {
    try {
      const res = await apiGet('/products', { isSpecial: true });
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        return list.map(mapBackendProduct);
      }
      // If none marked special, return top products
      const allRes = await apiGet('/products');
      const allList = allRes?.data || [];
      return allList.slice(0, 4).map(mapBackendProduct);
    } catch (err) {
      console.warn('Backend /products?isSpecial=true failed, using mock data:', err);
    }
  }

  await simulateDelay(200, 400);
  return mockProducts.filter((p) => p.featured);
};

/**
 * Get new arrival products
 * Backend: GET /products?isNewArrival=true
 *
 * @returns {Promise<Array>}
 */
export const getNewArrivals = async () => {
  if (!USE_MOCK) {
    try {
      const res = await apiGet('/products', { isNewArrival: true });
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        return list.map(mapBackendProduct);
      }
      // Fallback if none marked as new arrival
      const allRes = await apiGet('/products');
      const allList = allRes?.data || [];
      return allList.slice(0, 4).map(mapBackendProduct);
    } catch (err) {
      console.warn('Backend /products?isNewArrival=true failed, using mock data:', err);
    }
  }

  await simulateDelay(200, 400);
  return mockProducts.filter((p) => p.isNew);
};

/**
 * Get products related to a given category
 * Backend: GET /products?category=:categorySlug
 *
 * @param {string} categorySlug
 * @param {string} excludeId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getRelatedProducts = async (categorySlug, excludeId, limit = 4) => {
  if (!USE_MOCK) {
    try {
      const res = await apiGet('/products', { category: categorySlug });
      const list = res?.data || (Array.isArray(res) ? res : []);
      const mapped = list
        .map(mapBackendProduct)
        .filter((p) => p.id !== excludeId && p.slug !== excludeId)
        .slice(0, limit);
      if (mapped.length > 0) return mapped;
    } catch (err) {
      console.warn('Backend related products failed, using mock data:', err);
    }
  }

  await simulateDelay(200, 400);
  return mockProducts
    .filter((p) => p.categorySlug === categorySlug && p.id !== excludeId)
    .slice(0, limit);
};

/**
 * Quick search products by query string (for search drawer / typeahead)
 * Backend: GET /products?search=:query
 *
 * @param {string} query
 * @returns {Promise<Array>}
 */
export const searchProducts = async (query) => {
  const q = query?.toLowerCase().trim();
  if (!q) return [];

  if (!USE_MOCK) {
    try {
      const res = await apiGet('/products', { search: q });
      const list = res?.data || (Array.isArray(res) ? res : []);
      return list.slice(0, 6).map(mapBackendProduct);
    } catch (err) {
      console.warn('Backend product search failed, using mock data:', err);
    }
  }

  await simulateDelay(150, 300);
  return mockProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.includes(q))
    )
    .slice(0, 6);
};

/**
 * Get product categories list
 * Backend: GET /categories
 *
 * @returns {Promise<Array>}
 */
export const getCategories = async () => {
  if (!USE_MOCK) {
    try {
      const res = await apiGet('/categories');
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        return list.map(mapBackendCategory);
      }
    } catch (err) {
      console.warn('Backend /categories failed, using mock categories:', err);
    }
  }

  await simulateDelay(100, 250);
  return mockCategories;
};

/**
 * Get customer testimonials
 * Testimonials are client-side brand highlights
 *
 * @returns {Promise<Array>}
 */
export const getTestimonials = async () => {
  await simulateDelay(100, 200);
  return mockTestimonials;
};

