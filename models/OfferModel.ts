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

// Create a compound index to ensure only one active offer per product/variant within the same date range
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

// Add a compound index for the pre-save hook check
offerSchema.index(
  { 
    product: 1, 
    variantWeight: 1,
    isActive: 1,
    startDate: 1,
    endDate: 1
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
  productId: Types.ObjectId
): Promise<HydratedDocument<IOfferDocument> | null> {
  return this.findOne({
    product: productId,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });
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
    console.log('Starting pre-save hook for offer...');
    
    // Skip the check if the offer is being deactivated
    if (this.isModified('isActive') && !this.isActive) {
      console.log('Offer is being deactivated, skipping duplicate check');
      return next();
    }
    
    // Only run the check for new offers or if relevant fields were modified
    if (this.isNew || 
        this.isModified('product') || 
        this.isModified('isActive') || 
        this.isModified('variantWeight') || 
        this.isModified('startDate') || 
        this.isModified('endDate')) {
      console.log('Offer is new or modified fields detected');
      
      // Type assertion for the model
      const OfferModel = this.constructor as unknown as IOfferModel;
      
      // Build query to find conflicting offers
      const query: Record<string, any> = {
        product: this.product,
        _id: { $ne: this._id }, // Exclude the current offer when updating
        isActive: true,
        $or: [
          // Check for overlapping date ranges
          { 
            $and: [
              { startDate: { $lte: this.endDate } },
              { endDate: { $gte: this.startDate } }
            ]
          }
        ],
      };

      // If a variant is specified, the conflict check should be scoped to that variant.
      // If no variant is specified, the check should only apply to other offers without a variant.
      if (this.variantWeight !== undefined) {
        query.variantWeight = this.variantWeight;
      } else {
        query.variantWeight = { $exists: false };
      }

      console.log('Final query for duplicate check:', JSON.stringify(query, null, 2));
      
      const existingOffer = await (OfferModel as any).findOne(query).exec() as FindOneResult;
      console.log('Existing offer found:', existingOffer ? 'Yes' : 'No');

      if (existingOffer) {
        // If we're updating an existing offer and found the same document, allow it
        if (this._id && existingOffer._id.equals(this._id)) {
          console.log('Found the same offer during update, this is expected');
          return next();
        }
        
        // Format a helpful error message
        const productType = this.variantWeight 
          ? `variant (${this.variantWeight})` 
          : 'product';
          
        const errorMessage = `An active or scheduled offer already exists for this ${productType} during the selected date range`;
        console.error(errorMessage);
        return next(new Error(errorMessage));
      } else {
        console.log('No conflicting offers found');
      }
    } else {
      console.log('No relevant fields modified, skipping duplicate check');
    }
    
    console.log('Pre-save hook completed successfully');
    next();
  } catch (error: unknown) {
    console.error('Error in pre-save hook:', error);
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
