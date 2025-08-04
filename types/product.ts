// types/product.ts

export interface PriceVariant {
  weight: string;
  price: number;
}

export interface UIProduct {
  _id: string;
  name: string;
  price: number;
  basePrice?: number;
  images: string[];
  stock: number;
  rating?: number;
  numReviews?: number;
  description: string;
  slug: string;
  category: { 
    name: string;
    slug?: string; 
  };
  isFeatured?: boolean;
  priceVariants?: PriceVariant[];
}

// Helper function to convert MongoDB document to UI product
export function toUIProduct(doc: any): UIProduct {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    basePrice: doc.basePrice,
    images: doc.images,
    stock: doc.stock,
    rating: doc.rating,
    numReviews: doc.numReviews,
    description: doc.description,
    slug: doc.slug,
    category: doc.category,
    isFeatured: doc.isFeatured,
    priceVariants: doc.priceVariants?.map((v: any) => ({
      weight: v.weight,
      price: v.price
    }))
  };
}
