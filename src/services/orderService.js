/**
 * BENTORAH Order Service
 * ============================================================
 * Manages order creation, retrieval, and order status tracking.
 * Communicates with backend endpoints:
 *   - POST /api/orders
 *   - GET  /api/orders/:id
 *   - GET  /api/orders
 *   - POST /api/orders/:id/cancel
 *
 * Provides in-memory persistence and demo fallback when VITE_USE_MOCK is true.
 * ============================================================
 */

import { apiGet, apiPost, simulateDelay, USE_MOCK } from './api';
import { generateOrderId } from '../utils/formatters';
import { getCurrentUser } from './authService';

const ORDERS_STORAGE_KEY = 'bentorah_orders';

// In-memory order store (simulates backend DB for demo)
const orderStore = new Map();

/**
 * Retrieve persistent orders from localStorage
 * @returns {Array}
 */
const getStoredOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse stored orders:', err);
    return [];
  }
};

/**
 * Persist an order to localStorage
 * @param {object} order
 */
const persistOrder = (order) => {
  try {
    const existing = getStoredOrders();
    const updated = [order, ...existing.filter((o) => o.id !== order.id)];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save order to localStorage:', err);
  }
};

/**
 * Create a new order
 * Backend: POST /api/orders
 *
 * @param {object} orderData
 * @returns {Promise<object>} Created order
 */
export const createOrder = async (orderData) => {
  if (!USE_MOCK) {
    return apiPost('/orders', orderData);
  }

  await simulateDelay(500, 900);

  const now = new Date();
  const estimatedDelivery = new Date(now);
  estimatedDelivery.setDate(
    estimatedDelivery.getDate() + (orderData.deliveryOption === 'express' ? 2 : 5)
  );

  const orderId = generateOrderId();
  const order = {
    id: orderId,
    orderNumber: orderId,
    ...orderData,
    status: 'processing',
    paymentStatus: orderData.paymentStatus || 'paid',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    estimatedDelivery: estimatedDelivery.toISOString(),
    timeline: [
      { step: 'Order Placed', done: true, date: now.toISOString() },
      { step: 'Payment Confirmed', done: true, date: now.toISOString() },
      { step: 'Processing & Packing', done: false, date: null },
      { step: 'Dispatched', done: false, date: null },
      { step: 'Out for Delivery', done: false, date: null },
      { step: 'Delivered', done: false, date: null },
    ],
  };

  orderStore.set(order.id, order);
  persistOrder(order);
  return order;
};

/**
 * Get a single order by ID
 * Backend: GET /api/orders/:id
 *
 * @param {string} orderId
 * @returns {Promise<object>}
 */
export const getOrderById = async (orderId) => {
  if (!USE_MOCK) {
    return apiGet(`/orders/${orderId}`);
  }

  await simulateDelay(250, 500);

  // Check in-memory store first
  if (orderStore.has(orderId)) {
    return orderStore.get(orderId);
  }

  // Check persistent localStorage
  const stored = getStoredOrders();
  const match = stored.find((o) => o.id === orderId);
  if (match) {
    orderStore.set(match.id, match);
    return match;
  }

  // Fall back to mock history data
  const { mockOrders } = await import('../data/orders');
  const order = mockOrders.find((o) => o.id === orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);
  return order;
};

/**
 * Get all orders for the authenticated user
 * Backend: GET /api/orders
 *
 * @param {object} [userParam] - Optional user object to filter by
 * @returns {Promise<Array>}
 */
export const getMyOrders = async (userParam) => {
  if (!USE_MOCK) {
    return apiGet('/orders');
  }

  await simulateDelay(300, 600);

  const currentUser = userParam || getCurrentUser();
  const storedOrders = getStoredOrders();
  const memoryOrders = Array.from(orderStore.values());

  // Combine and deduplicate
  const allOrdersMap = new Map();
  [...storedOrders, ...memoryOrders].forEach((o) => {
    allOrdersMap.set(o.id, o);
  });
  const allSessionOrders = Array.from(allOrdersMap.values());

  if (!currentUser) {
    return [];
  }

  const userEmail = currentUser.email?.toLowerCase();
  const userId = currentUser.id;

  // Filter orders belonging to this user
  const userOrders = allSessionOrders.filter((o) => {
    const orderUserId = o.userId;
    const orderEmail = o.customer?.email?.toLowerCase();
    return (orderUserId && orderUserId === userId) || (orderEmail && orderEmail === userEmail);
  });

  // If user is Google demo user (Alex Johnson) and has no placed orders yet, provide the demo order
  if (userOrders.length === 0 && (userEmail === 'alex.johnson@gmail.com' || currentUser.provider === 'google')) {
    const { mockOrders } = await import('../data/orders');
    const demoOrders = mockOrders.map((mo) => ({
      ...mo,
      userId,
      customer: {
        ...mo.customer,
        name: currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        email: currentUser.email,
      },
    }));
    return demoOrders;
  }

  // Sort by createdAt descending
  return userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getOrders = getMyOrders;

/**
 * Get all orders for a customer by email
 * Backend: GET /api/orders?email=:email
 *
 * @param {string} email
 * @returns {Promise<Array>}
 */
export const getOrdersByEmail = async (email) => {
  if (!USE_MOCK) {
    return apiGet('/orders', { email });
  }

  await simulateDelay(300, 600);
  const { mockOrders } = await import('../data/orders');
  return mockOrders.filter(
    (o) => o.customer?.email?.toLowerCase() === email.toLowerCase()
  );
};

/**
 * Cancel an order
 * Backend: POST /api/orders/:id/cancel
 *
 * @param {string} orderId
 * @returns {Promise<object>}
 */
export const cancelOrder = async (orderId) => {
  if (!USE_MOCK) {
    return apiPost(`/orders/${orderId}/cancel`);
  }

  await simulateDelay(300, 600);
  if (orderStore.has(orderId)) {
    const order = orderStore.get(orderId);
    if (order.status !== 'processing') {
      throw new Error('Only orders in processing status can be cancelled.');
    }
    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    orderStore.set(orderId, order);
    return order;
  }
  throw new Error('Order cannot be cancelled.');
};
