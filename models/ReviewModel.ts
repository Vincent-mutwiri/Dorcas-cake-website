// models/ReviewModel.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  comment: string;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const ReviewModel =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>('Review', reviewSchema);

export default ReviewModel;
