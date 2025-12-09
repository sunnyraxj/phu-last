import type { ImagePlaceholder } from './placeholder-images';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: ImagePlaceholder[];
  artisanId: string;
  category: string;
  rating: number;
  reviewCount: number;
};

export type Artisan = {
  id: string;
  name: string;
  bio: string;
  avatar: ImagePlaceholder;
  craft: string;
  isFeatured: boolean;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  avatar: ImagePlaceholder;
};

export type Order = {
  id: string;
  customerName: string;
  productName: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  productId: string;
};
