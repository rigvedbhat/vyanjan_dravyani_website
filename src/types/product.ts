export type ProductImage = {
  id: string;
  filename: string;
  alt: string;
  order: number;
};

export type ProductUseCase = {
  id: string;
  title: string;
  caption: string;
  image: string;
  alt: string;
  order: number;
};

export type ProductReview = {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  images?: string[];
  approved: boolean;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  specifications: Record<string, string>;
  coverImage: string;
  galleryImages: ProductImage[];
  useCases: ProductUseCase[];
  reviews: ProductReview[];
  rating: number;
  visible: boolean;
  featured: boolean;
  badge?: string;
};

export type ContactInquiry = {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
};
