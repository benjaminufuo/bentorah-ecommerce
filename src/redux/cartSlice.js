import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { id, variant, quantity = 1, ...rest } = action.payload;
      const variantKey = variant?.value || 'default';
      const existing = state.items.find(
        (item) => item.id === id && item.variantKey === variantKey
      );
      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = existing.price * existing.quantity;
      } else {
        state.items.push({
          ...rest,
          id,
          variant,
          variantKey,
          quantity,
          subtotal: rest.price * quantity,
        });
      }
    },

    removeFromCart: (state, action) => {
      const { id, variantKey } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.id === id && item.variantKey === variantKey)
      );
    },

    updateQuantity: (state, action) => {
      const { id, variantKey, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.id === id && i.variantKey === variantKey
      );
      if (item && quantity > 0) {
        item.quantity = quantity;
        item.subtotal = item.price * quantity;
      }
    },

    clearCart: (state) => {
      state.items = [];
    },

    openCart: (state) => {
      state.isOpen = true;
    },

    closeCart: (state) => {
      state.isOpen = false;
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.subtotal, 0);
export const selectCartIsOpen = (state) => state.cart.isOpen;

/** Returns a selector function that checks if a specific product/variant is in the cart */
export const selectIsInCart = (productId, variantKey = 'default') => (state) =>
  state.cart.items.some(
    (item) => item.id === productId && item.variantKey === variantKey
  );

export default cartSlice.reducer;
