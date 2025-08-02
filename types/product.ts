// types/product.ts

export interface UIProduct {
  _id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
  rating?: number;
  numReviews?: number;
  description: string;
  slug: string;
  category: { name: string };
  isFeatured?: boolean;
}

// Helper function to convert MongoDB document to UI product
export function toUIProduct(doc: any): UIProduct {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    images: doc.images,
    stock: doc.stock,
    rating: doc.rating,
    numReviews: doc.numReviews, // Add this line
    description: doc.description,
    slug: doc.slug,
    category: doc.category,
    isFeatured: doc.isFeatured,
  };
}
