import { IProduct } from '@/models/ProductModel';
import type { CartItem } from '@/store/slices/cartSlice';

export const productToCartItem = (product: IProduct & { _id: any }, qty: number = 1): CartItem => ({
  _id: product._id.toString(),
  name: product.name,
  price: product.price,
  image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
  countInStock: product.stock || 0,
  qty,
});
