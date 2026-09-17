/**
 * BENTORAH Order Service
 * ============================================================
 * Manages order creation, retrieval, and order status tracking.
 * Communicates with backend endpoints:
 *   - POST /orders (with UUID Idempotency-Key & cart merge)
 *   - GET  /orders/:orderNumber
 *   - GET  /orders (user's order history)
 *
 * Automatically normalizes backend Order schemas to the frontend
 * contract expected by Checkout, Payment, and OrderDetails views.
 *
 * Provides persistent localStorage caching and offline fallback.
 * ============================================================
 */

import { apiGet, apiPost, simulateDelay, USE_MOCK } from './api';
import { generateOrderId } from '../utils/formatters';
import { getCurrentUser } from './authService';

const ORDERS_STORAGE_KEY = 'bentorah_orders';

// In-memory order cache
const orderStore = new Map();

/**
 * Generate a standard UUID v4 for the Idempotency-Key header
 * @returns {string}
 */
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Map backend trackingStatus to frontend status slug
 * @param {string} trackingStatus
 * @returns {string} 'processing' | 'shipped' | 'delivered' | 'cancelled'
 */
const mapTrackingStatusToSlug = (trackingStatus) => {
  switch (trackingStatus) {
    case 'Delivered':
      return 'delivered';
    case 'Dispatched':
    case 'Out for Delivery':
      return 'shipped';
    case 'Cancelled':
      return 'cancelled';
    case 'Order Placed':
    case 'Payment Confirmed':
    case 'Processing and Packaging':
    default:
      return 'processing';
  }
};

/**
 * Adapter: Map backend Order schema to frontend order model
 * @param {object} o - Backend order object
 * @returns {object} Frontend order model
 */
export const mapBackendOrder = (o) => {
  if (!o) return null;

  const orderNum = o.orderNumber || o.id || generateOrderId();
  const statusSlug = mapTrackingStatusToSlug(o.trackingStatus);

  // Map tracking history to 6 timeline steps
  const defaultSteps = [
    'Order Placed',
    'Payment Confirmed',
    'Processing and Packaging',
    'Dispatched',
    'Out for Delivery',
    'Delivered',
  ];

  let timeline = [];
  if (Array.isArray(o.trackingHistory) && o.trackingHistory.length > 0) {
    timeline = o.trackingHistory.map((t) => ({
      step: t.label,
      done: t.status === 'completed' || t.status === 'ongoing',
      date: t.status === 'completed' ? t.updatedAt || t.createdAt : null,
    }));
  } else {
    timeline = defaultSteps.map((step, idx) => ({
      step,
      done: idx === 0,
      date: idx === 0 ? o.createdAt : null,
    }));
  }

  // Customer names
  const custFirst = o.customer?.firstName || '';
  const custLast = o.customer?.lastName || '';
  const custFullName =
    o.customer?.name || `${custFirst} ${custLast}`.trim() || 'Valued Customer';

  // Delivery address
  const street = o.deliveryAddress?.street || o.deliveryAddress?.address || '';
  const city = o.deliveryAddress?.city || 'Lagos';
  const state = o.deliveryAddress?.state || 'Lagos';

  // Total and subtotal
  const totalAmount = Number(o.totalAmount || o.total) || 0;
  const deliveryFee = Number(o.deliveryFee) || 3500;
  const subtotal = totalAmount > deliveryFee ? totalAmount - deliveryFee : totalAmount;

  // Items
  const items = Array.isArray(o.items)
    ? o.items.map((item) => ({
        id: item.id || item.productId,
        productId: item.productId,
        name: item.name || item.product?.title || 'BENTORAH Item',
        variant: item.variant || item.color?.label || null,
        quantity: item.quantity || 1,
        price: Number(item.priceAtPurchase ?? item.price) || 0,
        image:
          item.image ||
          item.product?.image ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      }))
    : [];

  return {
    id: orderNum,
    _id: o.id,
    orderNumber: orderNum,
    userId: o.userId,
    status: statusSlug,
    trackingStatus: o.trackingStatus || 'Order Placed',
    paymentStatus: o.paymentStatus || (o.trackingStatus !== 'Order Placed' ? 'paid' : 'paid'),
    paymentMethod: o.paymentMethod || 'Paystack',
    paymentReference: o.paymentReference || null,
    createdAt: o.createdAt || new Date().toISOString(),
    updatedAt: o.updatedAt || new Date().toISOString(),
    customer: {
      name: custFullName,
      email: o.customer?.email || '',
      phone: o.customer?.phoneNumber || o.customer?.phone || '',
    },
    deliveryAddress: {
      address: street,
      city,
      state,
    },
    deliveryOption: o.deliveryMethod || o.deliveryOption || 'standard',
    deliveryFee,
    subtotal,
    total: totalAmount,
    items,
    timeline,
  };
};

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
    const updated = [
      order,
      ...existing.filter((o) => o.id !== order.id && o.orderNumber !== order.orderNumber),
    ];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save order to localStorage:', err);
  }
};

/**
 * Create a new order
 * Backend: POST /orders
 *
 * @param {object} orderData
 * @returns {Promise<object>} Created order
 */
export const createOrder = async (orderData) => {
  if (!USE_MOCK) {
    try {
      // 1. Sync client cart items to server cart before placing order
      if (Array.isArray(orderData.items) && orderData.items.length > 0) {
        try {
          const mergePayload = {
            items: orderData.items.map((item) => ({
              productId: item.productId || item.id,
              quantity: item.quantity || 1,
              color: {
                label: item.variant || 'Standard',
                hexCode: '#1a1a1a',
              },
            })),
          };
          await apiPost('/cart/merge', mergePayload);
        } catch (mergeErr) {
          console.warn('Cart merge prior to order notice:', mergeErr);
        }
      }

      // 2. Format customer names
      const nameParts = (orderData.customer?.name || '').trim().split(' ');
      const firstName = orderData.customer?.firstName || nameParts[0] || 'Customer';
      const lastName =
        orderData.customer?.lastName || nameParts.slice(1).join(' ') || 'BENTORAH';

      const orderPayload = {
        customer: {
          firstName,
          lastName,
          phoneNumber:
            orderData.customer?.phone || orderData.customer?.phoneNumber || '08012345678',
        },
        deliveryAddress: {
          street:
            orderData.deliveryAddress?.address ||
            orderData.deliveryAddress?.street ||
            'Lagos, Nigeria',
          city: orderData.deliveryAddress?.city || 'Lagos',
          state: orderData.deliveryAddress?.state || 'Lagos',
        },
        deliveryMethod: orderData.deliveryOption === 'express' ? 'express' : 'standard',
      };

      const idempotencyKey = generateUUID();
      const res = await apiPost('/orders', orderPayload, {
        'Idempotency-Key': idempotencyKey,
      });

      const serverOrder = res?.data || res;

      // Merge client metadata (e.g. photos, titles, payment method)
      const mapped = mapBackendOrder({
        ...serverOrder,
        id: serverOrder.id || serverOrder._id,
        _id: serverOrder.id || serverOrder._id,
        paymentMethod: orderData.paymentMethod,
        paymentReference: orderData.paymentReference,
        items: (serverOrder.items || []).map((si, idx) => {
          const clientItem =
            orderData.items?.[idx] ||
            orderData.items?.find((it) => it.productId === si.productId);
          return {
            ...si,
            name: clientItem?.name || si.product?.title || 'BENTORAH Item',
            image: clientItem?.image || si.product?.image || '',
            variant: clientItem?.variant || si.color?.label || null,
          };
        }),
      });

      orderStore.set(mapped.id, mapped);
      if (mapped.orderNumber) orderStore.set(mapped.orderNumber, mapped);
      persistOrder(mapped);
      return mapped;
    } catch (err) {
      console.error('Backend /orders failed:', err);
      throw new Error(
        err.response?.data?.message ||
        err.message ||
        'Failed to create order on server. Please try again.'
      );
    }
  }

  await simulateDelay(400, 800);

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
 * Get a single order by ID or orderNumber
 * Backend: GET /orders/:orderNumber
 *
 * @param {string} orderNumberOrId
 * @returns {Promise<object>}
 */
export const getOrderById = async (orderNumberOrId) => {
  if (!USE_MOCK && orderNumberOrId) {
    try {
      const res = await apiGet(`/orders/${encodeURIComponent(orderNumberOrId)}`);
      if (res?.data) {
        const mapped = mapBackendOrder(res.data);
        orderStore.set(mapped.id, mapped);
        persistOrder(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Backend order lookup notice:', err);
    }
  }

  await simulateDelay(200, 450);

  // Check in-memory store
  if (orderStore.has(orderNumberOrId)) {
    return orderStore.get(orderNumberOrId);
  }

  // Check persistent localStorage
  const stored = getStoredOrders();
  const match = stored.find(
    (o) => o.id === orderNumberOrId || o.orderNumber === orderNumberOrId
  );
  if (match) {
    orderStore.set(match.id, match);
    return match;
  }

  // Fall back to mock history data
  const { mockOrders } = await import('../data/orders');
  const order = mockOrders.find(
    (o) => o.id === orderNumberOrId || o.orderNumber === orderNumberOrId
  );
  if (!order) throw new Error(`Order not found: ${orderNumberOrId}`);
  return order;
};

/**
 * Get all orders for the authenticated user
 * Backend: GET /orders
 *
 * @param {object} [userParam] - Optional user object to filter by
 * @returns {Promise<Array>}
 */
export const getMyOrders = async (userParam) => {
  if (!USE_MOCK) {
    try {
      const res = await apiGet('/orders');
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        const mappedList = list.map(mapBackendOrder);
        mappedList.forEach((o) => {
          orderStore.set(o.id, o);
          persistOrder(o);
        });
        return mappedList;
      }
    } catch (err) {
      console.warn('Backend /orders failed, checking local orders:', err);
    }
  }

  await simulateDelay(250, 500);

  const currentUser = userParam || getCurrentUser();
  const storedOrders = getStoredOrders();
  const memoryOrders = Array.from(orderStore.values());

  // Combine and deduplicate
  const allOrdersMap = new Map();
  [...storedOrders, ...memoryOrders].forEach((o) => {
    allOrdersMap.set(o.id || o.orderNumber, o);
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
    return (
      (orderUserId && orderUserId === userId) || (orderEmail && orderEmail === userEmail)
    );
  });

  return userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getOrders = getMyOrders;

/**
 * Cancel an order
 *
 * @param {string} orderId
 * @returns {Promise<object>}
 */
export const cancelOrder = async (orderId) => {
  await simulateDelay(300, 600);
  if (orderStore.has(orderId)) {
    const order = orderStore.get(orderId);
    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    orderStore.set(orderId, order);
    persistOrder(order);
    return order;
  }
  throw new Error('Order cannot be cancelled.');
};

