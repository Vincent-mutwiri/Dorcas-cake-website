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
export function toUIProduct(doc: any): UIProduct | null {
  if (!doc) {
    console.error('toUIProduct called with null or undefined doc');
    return null;
  }

  try {
    return {
      _id: doc._id?.toString() || '',
      name: doc.name || 'Unnamed Product',
      price: typeof doc.price === 'number' ? doc.price : 0,
      basePrice: typeof doc.basePrice === 'number' ? doc.basePrice : doc.price || 0,
      images: Array.isArray(doc.images) ? doc.images : [],
      stock: typeof doc.stock === 'number' ? doc.stock : 0,
      rating: typeof doc.rating === 'number' ? doc.rating : 0,
      numReviews: typeof doc.numReviews === 'number' ? doc.numReviews : 0,
      description: doc.description || '',
      slug: doc.slug || `product-${doc._id?.toString() || Math.random().toString(36).substr(2, 9)}`,
      category: doc.category || { name: 'Uncategorized' },
      isFeatured: !!doc.isFeatured,
      priceVariants: Array.isArray(doc.priceVariants) 
        ? doc.priceVariants.map((v: any) => ({
            weight: v.weight || '1kg',
            price: typeof v.price === 'number' ? v.price : 0
          }))
        : []
    };
  } catch (error) {
    console.error('Error converting product to UI format:', error, doc);
    return null;
  }
}
