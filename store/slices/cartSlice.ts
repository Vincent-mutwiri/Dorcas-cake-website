// store/slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a simplified cart item interface that doesn't extend Mongoose document
export interface CartItem {
  id: string;  // Changed from _id to id to match the cart page
  _id?: string; // Keep for backward compatibility
  name: string;
  slug: string;
  price: number; // ADDED: The price for the selected weight
  selectedWeight: string; // ADDED: The selected weight
  images: string[]; // Changed from image to images to match the product interface
  image?: string; // Keep for backward compatibility
  stock: number; // Changed from countInStock to stock to match the product interface
  countInStock?: number; // Keep for backward compatibility
  qty: number;
  category?: {
    name: string;
    slug?: string;
  };
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
      const existItem = state.items.find(
        (x) => x.id === newItem.id && x.selectedWeight === newItem.selectedWeight
      );

      if (existItem) {
        state.items = state.items.map((x) =>
          x.id === existItem.id && x.selectedWeight === existItem.selectedWeight ? newItem : x
        );
      } else {
        state.items = [...state.items, newItem];
      }
      updateCart(state);
    },
    removeFromCart(state, action: PayloadAction<{ id: string; weight: string }>) {
      const { id, weight } = action.payload;
      state.items = state.items.filter(
        (item) => !((item.id === id || item._id === id) && item.selectedWeight === weight)
      );
      updateCart(state);
    },
    clearCart(state) {
      state.items = [];
      updateCart(state);
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;