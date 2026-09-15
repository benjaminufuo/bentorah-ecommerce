// BENTORAH Mock Orders — used as fallback order history data

export const mockOrders = [
  {
    id: 'NX-DEMO001',
    status: 'delivered',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedDelivery: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    customer: {
      name: 'Demo User',
      email: 'demo@bentorah.ng',
      phone: '08012345678',
    },
    deliveryAddress: {
      address: '14 Awolowo Road, Ikoyi',
      city: 'Lagos',
      state: 'Lagos',
    },
    deliveryOption: 'standard',
    items: [
      {
        productId: 'nx-001',
        name: 'BENTORAH AirBeat Pro',
        variant: 'Midnight Black',
        quantity: 1,
        price: 85000,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      },
      {
        productId: 'nx-004',
        name: 'BENTORAH Flow Keyboard',
        variant: 'Space Grey',
        quantity: 1,
        price: 68000,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
      },
    ],
    subtotal: 153000,
    deliveryFee: 0,
    discount: 0,
    total: 153000,
    paymentMethod: 'paystack',
    paymentReference: 'PSK-DEMO-ABCDEF',
    timeline: [
      { step: 'Order Placed', done: true, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
      { step: 'Payment Confirmed', done: true, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
      { step: 'Processing & Packing', done: true, date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString() },
      { step: 'Dispatched', done: true, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
      { step: 'Out for Delivery', done: true, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
      { step: 'Delivered', done: true, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
];
