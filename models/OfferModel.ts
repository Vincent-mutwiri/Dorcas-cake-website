// models/OfferModel.ts
import mongoose, { Document, Model, Schema, Types, HydratedDocument, model } from 'mongoose';

// Define the interface for the Offer document
interface IOfferDocument extends Document {
  product: Types.ObjectId;
  variantWeight?: number;
  variantDisplay?: string;
  discountedPrice: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrentlyActive: boolean; // Virtual
  createdAt: Date;
  updatedAt: Date;
}

// Define the interface for the Offer model
interface IOfferModel extends Model<IOfferDocument> {
  findActiveForProduct(productId: Types.ObjectId): Promise<HydratedDocument<IOfferDocument> | null>;
}

// For backward compatibility
export type IOffer = IOfferDocument;

const offerSchema = new Schema<IOfferDocument, IOfferModel>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantWeight: {
      type: Number,
      required: false,
    },
    variantDisplay: {
      type: String,
      required: false,
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0, // Ensure price is not negative
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: IOffer, value: Date) {
          // End date should be after start date
          return value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure only one active offer per product/variant during the same date range
offerSchema.index(
  {
    product: 1,
    variantWeight: 1,
    startDate: 1,
    endDate: 1
  },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

// Index for faster querying of active offers
offerSchema.index({ isActive: 1, endDate: 1 });

// Add a virtual for checking if offer is currently active
offerSchema.virtual('isCurrentlyActive').get(function(this: IOffer) {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Static method to find active offers for a product
offerSchema.statics.findActiveForProduct = async function(
  productId: Types.ObjectId,
  variantWeight?: number
): Promise<HydratedDocument<IOfferDocument> | null> {
  const query: Record<string, any> = {
    product: productId,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  };

  if (variantWeight !== undefined) {
    query.variantWeight = variantWeight;
  } else {
    query.variantWeight = { $exists: false };
  }

  return this.findOne(query);
};

// Pre-save hook to ensure only one active offer per product/variant within the same date range
type PreSaveHookThis = IOfferDocument & { 
  isNew: boolean; 
  isModified(field: string): boolean; 
  _id: Types.ObjectId;
  product: Types.ObjectId;
  variantWeight?: number;
  startDate: Date;
  endDate: Date;
};

offerSchema.pre('save', async function(this: PreSaveHookThis, next) {
  try {
    // Skip the check if the offer is being deactivated
    if (this.isModified('isActive') && !this.isActive) {
      return next();
    }

    // Only run the check for new offers or if relevant fields were modified
    if (this.isNew ||
        this.isModified('product') ||
        this.isModified('isActive') ||
        this.isModified('variantWeight') ||
        this.isModified('startDate') ||
        this.isModified('endDate')) {

      const OfferModel = this.constructor as unknown as IOfferModel;

      // Build query to find conflicting offers
      const query: Record<string, any> = {
        product: this.product,
        _id: { $ne: this._id }, // Exclude the current offer when updating
        isActive: true,
        // Correct logic for checking overlapping date ranges
        startDate: { $lt: this.endDate },
        endDate: { $gt: this.startDate }
      };

      // If a variant is specified, the conflict check should be scoped to that variant.
      // If no variant is specified, the check should only apply to other offers without a variant.
      if (this.variantWeight !== undefined && this.variantWeight !== null) {
        query.variantWeight = this.variantWeight;
      } else {
        query.variantWeight = { $in: [null, undefined] };
      }

      const existingOffer = await (OfferModel as any).findOne(query).exec() as FindOneResult;

      if (existingOffer) {
        // Format a helpful error message
        const productType = this.variantDisplay
          ? `variant (${this.variantDisplay})`
          : 'product';

        const errorMessage = `An active offer already exists for this ${productType} within the selected date range.`;
        return next(new Error(errorMessage));
      }
    }
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      next(error);
    } else {
      next(new Error('An unknown error occurred in the pre-save hook'));
    }
  }
});

// Create and export the model
const OfferModel: IOfferModel = 
  (mongoose.models.Offer as IOfferModel) || 
  model<IOfferDocument, IOfferModel>('Offer', offerSchema);

// Add proper type for findOne with query
type FindOneResult = (IOfferDocument & { _id: Types.ObjectId }) | null;

export default OfferModel;
