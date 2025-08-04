// models/ProductModel.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Define the interface for a single price variant
export interface IPriceVariant extends Document {
  weight: string; // e.g., "1KG", "1.5KG"
  price: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: Types.ObjectId; // Reference to the Category model
  images: string[];
  priceVariants: IPriceVariant[]; // ADDED: An array of price variants
  basePrice: number; // ADDED: For display on product listings ("From Ksh...")
  stock: number;
  rating: number;
  numReviews: number;
  isFeatured: boolean;
}

// Define the schema for the price variant
const priceVariantSchema = new Schema<IPriceVariant>({
  weight: { type: String, required: true },
  price: { type: Number, required: true },
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    images: [{ type: String, required: true }],
    priceVariants: { type: [priceVariantSchema], required: true },
    basePrice: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const ProductModel =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>('Product', productSchema);

export default ProductModel;