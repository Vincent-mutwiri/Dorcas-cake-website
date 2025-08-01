// store/slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a simplified cart item interface that doesn't extend Mongoose document
export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  countInStock: number;
  qty: number;
  // Add any other properties you need for the cart
}

// Define the shape of the entire cart state
interface CartState {
  items: CartItem[];
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
}

// Helper function to get initial state from localStorage
const getInitialState = (): CartState => {
  try {
    const storedCart = typeof window !== 'undefined' ? localStorage.getItem('cart') : null;
    return storedCart
      ? JSON.parse(storedCart)
      : {
          items: [],
          itemsPrice: 0,
          shippingPrice: 0,
          taxPrice: 0,
          totalPrice: 0,
        };
  } catch (error) {
    console.error('Failed to parse cart from localStorage', error);
    return { 
      items: [], 
      itemsPrice: 0, 
      shippingPrice: 0, 
      taxPrice: 0, 
      totalPrice: 0 
    };
  }
};

const initialState: CartState = getInitialState();

// Helper function to update prices and localStorage
const updateCart = (state: CartState) => {
  const itemsPrice = state.items.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  state.itemsPrice = parseFloat(itemsPrice.toFixed(2));
  state.shippingPrice = itemsPrice > 100 ? 0 : 10;
  state.taxPrice = parseFloat((0.08 * itemsPrice).toFixed(2));
  state.totalPrice = parseFloat(
    (state.itemsPrice + state.shippingPrice + state.taxPrice).toFixed(2)
  );

  if (typeof window !== 'undefined') {
    localStorage.setItem('cart', JSON.stringify(state));
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      const existItemIndex = state.items.findIndex((x) => x._id === newItem._id);

      if (existItemIndex >= 0) {
        // Update existing item
        state.items[existItemIndex] = newItem;
      } else {
        // Add new item
        state.items.push(newItem);
      }
      updateCart(state);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.items = state.items.filter((x) => x._id !== itemId);
      updateCart(state);
    },
    clearCart: (state) => {
      state.items = [];
      updateCart(state);
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;