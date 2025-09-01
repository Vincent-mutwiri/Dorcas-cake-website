import { Types } from 'mongoose';

export interface IPriceVariant {
  weight: string;
  price: number;
}

export interface IProductBase {
  _id: string | Types.ObjectId;
  name: string;
  basePrice: number;
  images: string[];
  priceVariants?: IPriceVariant[];
  category?: {
    _id: string | Types.ObjectId;
    name: string;
    slug: string;
  };
}

export interface IOfferBase {
  _id: string | Types.ObjectId;
  product: string | IProductBase | Types.ObjectId;
  discountedPrice: number;
  variantWeight?: string;
  variantDisplay?: string; // For displaying the original variant string (e.g., '2Kg')
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  discountPercentage?: number;
}

// For API responses
export interface IOfferResponse extends Omit<IOfferBase, 'product'> {
  _id: string;
  product: IProductBase;
  discountPercentage: number;
}

// For creating/updating offers
export interface IOfferInput {
  product: string | Types.ObjectId;
  discountedPrice: number;
  variantWeight?: string;
  variantDisplay?: string; // For passing the display value to the API
  startDate: Date | string;
  endDate: Date | string;
  isActive?: boolean;
}

// For the admin offers list
export interface IAdminOffer extends IOfferBase {
  _id: string;
  product: {
    _id: string;
    name: string;
    basePrice: number;
    images: string[];
    priceVariants?: IPriceVariant[];
  };
  discountPercentage: number;
}
