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

// In-memory order store (simulates backend DB for demo)
const orderStore = new Map();

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

  const order = {
    id: generateOrderId(),
    ...orderData,
    status: 'processing',
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

  // Check in-memory store first (orders placed in this session)
  if (orderStore.has(orderId)) {
    return orderStore.get(orderId);
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
 * @returns {Promise<Array>}
 */
export const getMyOrders = async () => {
  if (!USE_MOCK) {
    return apiGet('/orders');
  }

  await simulateDelay(300, 600);
  const { mockOrders } = await import('../data/orders');
  const inMemory = Array.from(orderStore.values());
  return [...inMemory, ...mockOrders];
};

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
