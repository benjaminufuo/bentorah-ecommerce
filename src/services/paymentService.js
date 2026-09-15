/**
 * BENTORAH Payment Service
 * ============================================================
 * Handles payment transactions with gateways (Paystack, Flutterwave, Bank Transfer).
 * Communicates with backend endpoints:
 *   - POST /api/payments/initialize
 *   - GET  /api/payments/verify/:reference
 *
 * Provides simulated processing when VITE_USE_MOCK is true.
 * ============================================================
 */

import { apiGet, apiPost, simulateDelay, USE_MOCK } from './api';

/**
 * Initialize a payment transaction with the payment gateway
 * Backend: POST /api/payments/initialize
 *
 * @param {object} data
 * @param {number} data.amount - Total amount in Naira
 * @param {string} data.email - Customer email address
 * @param {string} [data.orderId] - Internal order reference
 * @param {string} data.method - 'paystack' | 'flutterwave' | 'bank-transfer'
 * @returns {Promise<{ reference: string, status: string, authorizationUrl?: string }>}
 */
export const initializePayment = async (data) => {
  if (!USE_MOCK) {
    return apiPost('/payments/initialize', data);
  }

  await simulateDelay(400, 800);

  const prefix = data.method === 'paystack' ? 'PSK' : data.method === 'flutterwave' ? 'FLW' : 'BTR';
  const reference = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    reference,
    status: 'initialized',
    amount: data.amount,
    email: data.email,
    method: data.method,
  };
};

/**
 * Verify a completed payment transaction
 * Backend: GET /api/payments/verify/:reference
 *
 * @param {string} reference - Gateway transaction reference
 * @param {string} [method] - Payment method
 * @returns {Promise<{ verified: boolean, reference: string, status: string }>}
 */
export const verifyPayment = async (reference, method) => {
  if (!USE_MOCK) {
    return apiGet(`/payments/verify/${reference}`);
  }

  await simulateDelay(600, 1000);

  // In mock mode, 97% success rate for realistic demo behavior
  if (Math.random() < 0.03) {
    throw new Error('Payment verification failed. Please try a different payment method.');
  }

  return {
    verified: true,
    reference,
    method,
    status: 'success',
  };
};

/**
 * Process full end-to-end payment (Initialize + Verify)
 *
 * @param {object} data
 * @param {number} data.amount - Amount in Naira
 * @param {string} data.email - Customer email
 * @param {string} data.method - Selected gateway
 * @returns {Promise<{ success: boolean, reference: string, amount: number, timestamp: string }>}
 */
export const processPayment = async ({ amount, email, method }) => {
  if (!USE_MOCK) {
    const init = await initializePayment({ amount, email, method });
    const verification = await verifyPayment(init.reference, method);
    return {
      success: true,
      reference: init.reference,
      amount,
      email,
      method,
      timestamp: new Date().toISOString(),
      details: verification,
    };
  }

  // Simulated processing for demo
  await simulateDelay(1200, 2000);

  const prefix = method === 'paystack' ? 'PSK' : method === 'flutterwave' ? 'FLW' : 'BTR';
  const reference = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    success: true,
    reference,
    amount,
    email,
    method,
    timestamp: new Date().toISOString(),
  };
};
