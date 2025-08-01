// models/BannerModel.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  isActive: boolean;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image: { type: String, required: true },
    link: { type: String, required: true }, // e.g., '/products/special-cake'
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const BannerModel =
  (mongoose.models.Banner as Model<IBanner>) ||
  mongoose.model<IBanner>('Banner', bannerSchema);

export default BannerModel;