import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchServerCart,
  mergeServerCart,
  addServerCartItem,
  updateServerCartItem,
  removeServerCartItem,
  clearServerCart,
  getLocalCart,
  saveLocalCart,
  clearLocalCart,
} from '../services/cartService';

const initialItems = getLocalCart();

const initialState = {
  items: initialItems,
  cartId: null,
  isOpen: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Async Thunk: Load Cart (Server if logged in, local storage if guest)
export const loadCart = createAsyncThunk(
  'cart/loadCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('bentorah_token');
      if (token) {
        const serverCart = await fetchServerCart();
        if (serverCart) return serverCart;
      }
      return { id: null, items: getLocalCart(), total: 0 };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load cart');
    }
  }
);

// Async Thunk: Merge guest cart into server cart immediately after login/signup/Google OAuth
export const mergeGuestCartOnLogin = createAsyncThunk(
  'cart/mergeGuestCartOnLogin',
  async (guestItemsOverride, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const localStored = getLocalCart();
      const itemsToMerge =
        Array.isArray(guestItemsOverride) && guestItemsOverride.length > 0
          ? guestItemsOverride
          : state.cart.items.length > 0
          ? state.cart.items
          : localStored;

      if (Array.isArray(itemsToMerge) && itemsToMerge.length > 0) {
        const merged = await mergeServerCart(itemsToMerge);
        return merged;
      }

      // If no local items, just fetch user's active server cart
      const serverCart = await fetchServerCart();
      return serverCart;
    } catch (err) {
      console.warn('mergeGuestCartOnLogin error:', err);
      return rejectWithValue(err.message || 'Failed to merge cart');
    }
  }
);

// Async Thunk: Add Item with Server Synchronization
export const addItem = createAsyncThunk(
  'cart/addItem',
  async (itemData, { getState, dispatch }) => {
    // 1. Optimistically update local state
    dispatch(cartSlice.actions.addToCart(itemData));

    // 2. If authenticated, sync with server POST /cart/items
    const token = localStorage.getItem('bentorah_token');
    if (token) {
      const color = itemData.variant
        ? {
            label: itemData.variant.label || itemData.variant.value || 'Standard',
            hexCode: itemData.variant.colorHex || itemData.variant.hexCode || '#1a1a1a',
          }
        : undefined;

      try {
        const serverCart = await addServerCartItem({
          productId: itemData.productId || itemData.id,
          quantity: itemData.quantity || 1,
          color,
        });
        if (serverCart && Array.isArray(serverCart.items)) {
          dispatch(cartSlice.actions.setServerCart(serverCart));
        }
        return serverCart;
      } catch (err) {
        console.warn('Backend add item sync notice:', err);
      }
    }
    return null;
  }
);

// Async Thunk: Update Quantity with Server Synchronization
export const updateItem = createAsyncThunk(
  'cart/updateItem',
  async ({ id, variantKey, quantity, itemId }, { getState, dispatch }) => {
    const state = getState();
    const item = state.cart.items.find((i) => i.id === id && i.variantKey === variantKey);
    const lineItemId = itemId || item?.itemId;

    // 1. Optimistically update local state
    dispatch(cartSlice.actions.updateQuantity({ id, variantKey, quantity }));

    // 2. If authenticated and lineItemId exists, sync with server PATCH /cart/items/:itemId
    const token = localStorage.getItem('bentorah_token');
    if (token && lineItemId) {
      try {
        const serverCart = await updateServerCartItem(lineItemId, quantity);
        if (serverCart && Array.isArray(serverCart.items)) {
          dispatch(cartSlice.actions.setServerCart(serverCart));
        }
        return serverCart;
      } catch (err) {
        console.warn('Backend update item sync notice:', err);
      }
    }
    return null;
  }
);

// Async Thunk: Remove Item with Server Synchronization
export const removeItem = createAsyncThunk(
  'cart/removeItem',
  async ({ id, variantKey, itemId }, { getState, dispatch }) => {
    const state = getState();
    const item = state.cart.items.find((i) => i.id === id && i.variantKey === variantKey);
    const lineItemId = itemId || item?.itemId;

    // 1. Optimistically update local state
    dispatch(cartSlice.actions.removeFromCart({ id, variantKey }));

    // 2. If authenticated and lineItemId exists, sync with server DELETE /cart/items/:itemId
    const token = localStorage.getItem('bentorah_token');
    if (token && lineItemId) {
      try {
        const serverCart = await removeServerCartItem(lineItemId);
        if (serverCart && Array.isArray(serverCart.items)) {
          dispatch(cartSlice.actions.setServerCart(serverCart));
        }
        return serverCart;
      } catch (err) {
        console.warn('Backend delete item sync notice:', err);
      }
    }
    return null;
  }
);

// Async Thunk: Empty Cart with Server Synchronization
export const emptyCart = createAsyncThunk(
  'cart/emptyCart',
  async (_, { dispatch }) => {
    dispatch(cartSlice.actions.clearCart());
    const token = localStorage.getItem('bentorah_token');
    if (token) {
      try {
        await clearServerCart();
      } catch (err) {
        console.warn('Backend clear cart sync notice:', err);
      }
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { id, variant, quantity = 1, itemId, ...rest } = action.payload;
      const variantKey = variant?.value || variant?.label || 'default';
      const existing = state.items.find(
        (item) => item.id === id && item.variantKey === variantKey
      );

      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = existing.price * existing.quantity;
        if (itemId && !existing.itemId) existing.itemId = itemId;
      } else {
        state.items.push({
          ...rest,
          id,
          productId: id,
          itemId: itemId || null,
          variant,
          variantKey,
          quantity,
          subtotal: rest.price * quantity,
        });
      }

      // Persist to guest localStorage if not logged in
      if (!localStorage.getItem('bentorah_token')) {
        saveLocalCart(state.items);
      }
    },

    removeFromCart: (state, action) => {
      const { id, variantKey } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.id === id && item.variantKey === variantKey)
      );

      if (!localStorage.getItem('bentorah_token')) {
        saveLocalCart(state.items);
      }
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

      if (!localStorage.getItem('bentorah_token')) {
        saveLocalCart(state.items);
      }
    },

    setServerCart: (state, action) => {
      if (action.payload && Array.isArray(action.payload.items)) {
        state.items = action.payload.items;
        state.cartId = action.payload.id || null;
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.cartId = null;
      clearLocalCart();
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
  extraReducers: (builder) => {
    builder
      // Load cart
      .addCase(loadCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload && Array.isArray(action.payload.items)) {
          state.items = action.payload.items;
          state.cartId = action.payload.id || null;
        }
      })
      .addCase(loadCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Merge on login
      .addCase(mergeGuestCartOnLogin.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(mergeGuestCartOnLogin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload && Array.isArray(action.payload.items)) {
          state.items = action.payload.items;
          state.cartId = action.payload.id || null;
        }
      })
      .addCase(mergeGuestCartOnLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setServerCart,
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
export const selectCartStatus = (state) => state.cart.status;

/** Returns a selector function that checks if a specific product/variant is in the cart */
export const selectIsInCart = (productId, variantKey = 'default') => (state) =>
  state.cart.items.some(
    (item) => item.id === productId && item.variantKey === variantKey
  );

export default cartSlice.reducer;
