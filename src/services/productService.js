/**
 * BENTORAH Product Service
 * ============================================================
 * Handles all product catalog, category, and review queries.
 * Communicates with backend endpoints:
 *   - GET /api/products
 *   - GET /api/products/:id
 *   - GET /api/categories
 *   - GET /api/testimonials
 *
 * When VITE_USE_MOCK is active (default for development/demo),
 * provides realistic simulated responses without requiring a running server.
 * ============================================================
 */

import { apiGet, simulateDelay, USE_MOCK } from './api';
import { products as mockProducts, categories as mockCategories, testimonials as mockTestimonials } from '../data/products';

/**
 * Get all products with optional filtering and sorting
 * Backend: GET /api/products?category=&search=&sort=&minPrice=&maxPrice=
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
    return apiGet('/products', {
      category: category !== 'all' ? category : undefined,
      search: search || undefined,
      sort,
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice > 0 ? maxPrice : undefined,
      inStock: inStock || undefined,
      onSale: onSale || undefined,
      isNew: isNewOnly || undefined,
    });
  }

  await simulateDelay(350, 750);

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
  if (minPrice > 0) {
    result = result.filter((p) => p.price >= minPrice);
  }
  if (maxPrice > 0) {
    result = result.filter((p) => p.price <= maxPrice);
  }

  // In stock
  if (inStock) {
    result = result.filter((p) => p.stock > 0);
  }

  // On sale
  if (onSale) {
    result = result.filter((p) => p.isOnSale);
  }

  // New arrivals only
  if (isNewOnly) {
    result = result.filter((p) => p.isNew);
  }

  // Sort
  switch (sort) {
    case 'newest':
      result = result.filter((p) => p.isNew).concat(result.filter((p) => !p.isNew));
      break;
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
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
 * Get a single product by ID
 * Backend: GET /api/products/:id
 *
 * @param {string} id
 * @returns {Promise<object>} Product details
 */
export const getProductById = async (id) => {
  if (!USE_MOCK) {
    return apiGet(`/products/${id}`);
  }

  await simulateDelay(250, 600);
  const product = mockProducts.find((p) => p.id === id);
  if (!product) throw new Error(`Product not found: ${id}`);
  return product;
};

/**
 * Get featured products for homepage / carousels
 * Backend: GET /api/products?featured=true
 *
 * @returns {Promise<Array>}
 */
export const getFeaturedProducts = async () => {
  if (!USE_MOCK) {
    const res = await apiGet('/products', { featured: true });
    return res.products || res;
  }

  await simulateDelay(250, 500);
  return mockProducts.filter((p) => p.featured);
};

/**
 * Get new arrival products
 * Backend: GET /api/products?isNew=true
 *
 * @returns {Promise<Array>}
 */
export const getNewArrivals = async () => {
  if (!USE_MOCK) {
    const res = await apiGet('/products', { isNew: true });
    return res.products || res;
  }

  await simulateDelay(250, 500);
  return mockProducts.filter((p) => p.isNew);
};

/**
 * Get products related to a given category
 * Backend: GET /api/products?category=:categorySlug&exclude=:excludeId&limit=:limit
 *
 * @param {string} categorySlug
 * @param {string} excludeId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getRelatedProducts = async (categorySlug, excludeId, limit = 4) => {
  if (!USE_MOCK) {
    const res = await apiGet('/products', { category: categorySlug, exclude: excludeId, limit });
    return res.products || res;
  }

  await simulateDelay(250, 500);
  return mockProducts
    .filter((p) => p.categorySlug === categorySlug && p.id !== excludeId)
    .slice(0, limit);
};

/**
 * Quick search products by query string (for search drawer / typeahead)
 * Backend: GET /api/products?search=:query&limit=6
 *
 * @param {string} query
 * @returns {Promise<Array>}
 */
export const searchProducts = async (query) => {
  const q = query?.toLowerCase().trim();
  if (!q) return [];

  if (!USE_MOCK) {
    const res = await apiGet('/products', { search: q, limit: 6 });
    return res.products || res;
  }

  await simulateDelay(150, 350);
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
 * Backend: GET /api/categories
 *
 * @returns {Promise<Array>}
 */
export const getCategories = async () => {
  if (!USE_MOCK) {
    return apiGet('/categories');
  }

  await simulateDelay(100, 300);
  return mockCategories;
};

/**
 * Get customer testimonials
 * Backend: GET /api/testimonials
 *
 * @returns {Promise<Array>}
 */
export const getTestimonials = async () => {
  if (!USE_MOCK) {
    return apiGet('/testimonials');
  }

  await simulateDelay(100, 300);
  return mockTestimonials;
};
