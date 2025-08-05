// models/ReviewModel.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected'; // ADDED
  isFeatured: boolean; // ADDED
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending', // Reviews start as pending
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ReviewModel =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>('Review', reviewSchema);

export default ReviewModel;