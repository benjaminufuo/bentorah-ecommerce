/**
 * BENTORAH Cart Service
 * ============================================================
 * Handles cart management, synchronization, and persistence.
 * Communicates with backend endpoints:
 *   - GET    /cart                Get active cart
 *   - DELETE /cart                Clear cart
 *   - POST   /cart/items          Add item to cart
 *   - PATCH  /cart/items/:itemId  Update item quantity
 *   - DELETE /cart/items/:itemId  Remove item from cart
 *   - POST   /cart/merge          Merge guest localStorage cart into server cart
 * ============================================================
 */

import { apiGet, apiPost, apiPatch, apiDelete, USE_MOCK, simulateDelay } from './api';

export const CART_STORAGE_KEY = 'bentorah_cart';

/**
 * Maps backend Cart object to frontend Redux items format
 * @param {object} serverCart
 * @returns {{ id: string|null, items: Array, total: number }}
 */
export const mapBackendCart = (serverCart) => {
  const data = serverCart?.data || serverCart;
  if (!data || !Array.isArray(data.items)) {
    return { id: data?.id || null, items: [], total: 0 };
  }

  const items = data.items.map((item) => {
    const product = item.product || {};
    const price = Number(product.discountPrice ?? product.price ?? item.price ?? 0);
    const variant = item.color
      ? {
          id: item.color.label || 'standard',
          label: item.color.label,
          value: item.color.label,
          colorHex: item.color.hexCode || '#1a1a1a',
        }
      : null;
    const variantKey = variant ? variant.value : 'default';

    return {
      id: item.productId || product.id || item.id,
      productId: item.productId || product.id || item.id,
      itemId: item.id, // server line-item ID
      name: product.title || product.name || 'Product',
      price,
      image:
        product.image ||
        (Array.isArray(product.images) && product.images[0]) ||
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      category: product.category || 'General',
      categorySlug: product.categorySlug || 'general',
      variant,
      variantKey,
      quantity: Number(item.quantity) || 1,
      subtotal: price * (Number(item.quantity) || 1),
    };
  });

  return {
    id: data.id || null,
    items,
    total: Number(data.total) || items.reduce((sum, i) => sum + i.subtotal, 0),
  };
};

/**
 * Retrieve local guest cart from localStorage
 * @returns {Array}
 */
export const getLocalCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse local cart from storage:', err);
    return [];
  }
};

/**
 * Save guest cart to localStorage
 * @param {Array} items
 */
export const saveLocalCart = (items) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items || []));
  } catch (err) {
    console.error('Failed to save local cart to storage:', err);
  }
};

/**
 * Clear guest cart from localStorage
 */
export const clearLocalCart = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear local cart:', err);
  }
};

/**
 * Fetch the logged-in user's active cart from server
 * Backend: GET /cart
 * @returns {Promise<{ id: string|null, items: Array, total: number }>}
 */
export const fetchServerCart = async () => {
  if (!USE_MOCK) {
    try {
      const res = await apiGet('/cart');
      return mapBackendCart(res);
    } catch (err) {
      if (err.status === 401 || err.response?.status === 401) {
        // Not authenticated
        return null;
      }
      console.warn('GET /cart error:', err);
      throw err;
    }
  }

  await simulateDelay(200, 400);
  return { id: 'mock_cart_1', items: getLocalCart(), total: 0 };
};

/**
 * Merge local guest cart into the server cart
 * Backend: POST /cart/merge
 * Matches items by productId + color; uses max(serverQty, localQty).
 *
 * @param {Array} items - Local cart items
 * @returns {Promise<{ id: string|null, items: Array, total: number }>}
 */
export const mergeServerCart = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return fetchServerCart();
  }

  const payload = {
    items: items.map((item) => {
      const color = item.variant
        ? {
            label: item.variant.label || item.variant.value || 'Standard',
            hexCode: item.variant.colorHex || item.variant.hexCode || '#1a1a1a',
          }
        : undefined;

      return {
        productId: item.productId || item.id,
        quantity: Number(item.quantity) || 1,
        ...(color ? { color } : {}),
      };
    }),
  };

  if (!USE_MOCK) {
    try {
      const res = await apiPost('/cart/merge', payload);
      const mapped = mapBackendCart(res);
      // Clear local storage guest cart once merged
      clearLocalCart();
      return mapped;
    } catch (err) {
      console.error('POST /cart/merge error:', err);
      throw err;
    }
  }

  await simulateDelay(300, 500);
  clearLocalCart();
  return { id: 'mock_cart_merged', items, total: items.reduce((s, i) => s + i.subtotal, 0) };
};

/**
 * Add an item to the server cart
 * Backend: POST /cart/items
 *
 * @param {object} itemData
 * @param {string} itemData.productId
 * @param {number} [itemData.quantity=1]
 * @param {object} [itemData.color]
 * @returns {Promise<{ id: string|null, items: Array, total: number }>}
 */
export const addServerCartItem = async ({ productId, quantity = 1, color }) => {
  const payload = {
    productId,
    quantity: Number(quantity) || 1,
    ...(color ? { color } : {}),
  };

  if (!USE_MOCK) {
    try {
      const res = await apiPost('/cart/items', payload);
      return mapBackendCart(res);
    } catch (err) {
      console.error('POST /cart/items error:', err);
      throw err;
    }
  }

  await simulateDelay(200, 400);
  return null;
};

/**
 * Update quantity for a cart line item
 * Backend: PATCH /cart/items/:itemId
 *
 * @param {string} itemId - Line item id
 * @param {number} quantity - New quantity
 * @returns {Promise<{ id: string|null, items: Array, total: number }>}
 */
export const updateServerCartItem = async (itemId, quantity) => {
  if (!itemId) throw new Error('itemId is required to update cart item.');

  if (!USE_MOCK) {
    try {
      const res = await apiPatch(`/cart/items/${itemId}`, { quantity: Number(quantity) });
      return mapBackendCart(res);
    } catch (err) {
      console.error(`PATCH /cart/items/${itemId} error:`, err);
      throw err;
    }
  }

  await simulateDelay(200, 300);
  return null;
};

/**
 * Remove an item from the cart
 * Backend: DELETE /cart/items/:itemId
 *
 * @param {string} itemId - Line item id
 * @returns {Promise<{ id: string|null, items: Array, total: number }>}
 */
export const removeServerCartItem = async (itemId) => {
  if (!itemId) throw new Error('itemId is required to delete cart item.');

  if (!USE_MOCK) {
    try {
      const res = await apiDelete(`/cart/items/${itemId}`);
      return mapBackendCart(res);
    } catch (err) {
      console.error(`DELETE /cart/items/${itemId} error:`, err);
      throw err;
    }
  }

  await simulateDelay(200, 300);
  return null;
};

/**
 * Clear all items from server cart
 * Backend: DELETE /cart
 * @returns {Promise<{ id: string|null, items: Array, total: number }>}
 */
export const clearServerCart = async () => {
  if (!USE_MOCK) {
    try {
      const res = await apiDelete('/cart');
      return mapBackendCart(res);
    } catch (err) {
      console.error('DELETE /cart error:', err);
      throw err;
    }
  }

  await simulateDelay(200, 300);
  return { id: null, items: [], total: 0 };
};
