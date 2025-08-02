// store/slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a simplified cart item interface that doesn't extend Mongoose document
export interface CartItem {
  id: string;  // Changed from _id to id to match the cart page
  _id?: string; // Keep for backward compatibility
  name: string;
  slug: string;
  price: number;
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
      const existItemIndex = state.items.findIndex((x) => x.id === newItem.id || x._id === newItem._id);

      if (existItemIndex >= 0) {
        // Update existing item quantity
        state.items[existItemIndex].qty += newItem.qty;
      } else {
        // Add new item
        state.items.push(newItem);
      }
      updateCart(state);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      const itemId = action.payload;
      state.items = state.items.filter((item) => item.id !== itemId && item._id !== itemId);
      updateCart(state);
    },
    updateQuantity: {
      reducer(state, action: PayloadAction<{ id: string; qty: number }>) {
        const { id, qty } = action.payload;
        const itemIndex = state.items.findIndex(
          (item) => item.id === id || item._id === id
        );
        
        if (itemIndex >= 0) {
          if (qty <= 0) {
            state.items.splice(itemIndex, 1);
          } else {
            state.items[itemIndex].qty = qty;
          }
          updateCart(state);
        }
      },
      prepare(id: string, qty: number) {
        return { payload: { id, qty } };
      },
    },
    clearCart(state) {
      state.items = [];
      updateCart(state);
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;