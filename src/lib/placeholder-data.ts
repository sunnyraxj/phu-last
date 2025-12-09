import type { Artisan, Product, Review, Order } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id)!;

export const artisans: Artisan[] = [
  {
    id: 'artisan-1',
    name: 'Priya Sharma',
    bio: 'Priya is a master potter from a long line of artisans. Her work is inspired by nature, incorporating earthy tones and organic shapes. She has been perfecting her craft for over 20 years, and her pieces are known for their delicate balance and timeless beauty.',
    avatar: getImage('artisan-1'),
    craft: 'Pottery',
    isFeatured: true,
  },
  {
    id: 'artisan-2',
    name: 'Rajesh Kumar',
    bio: 'Rajesh is a weaver who blends traditional techniques with contemporary designs. He sources his materials locally and uses natural dyes to create vibrant, eco-friendly textiles. His passion is to keep the ancient art of handloom weaving alive for future generations.',
    avatar: getImage('artisan-2'),
    craft: 'Weaving',
    isFeatured: true,
  },
  {
    id: 'artisan-3',
    name: 'Anjali Verma',
    bio: 'Anjali is a painter whose work reflects the rich cultural heritage of her region. Her canvases are a riot of color and emotion, telling stories of folklore, festivals, and everyday life. She believes art is a universal language that connects souls.',
    avatar: getImage('artisan-3'),
    craft: 'Painting',
    isFeatured: true,
  },
   {
    id: 'artisan-4',
    name: 'Vikram Singh',
    bio: 'Vikram is a skilled artisan specializing in metalwork. From intricate jewelry to decorative sculptures, his creations showcase a mastery of form and detail. He finds inspiration in ancient temple architecture and mythology.',
    avatar: getImage('artisan-4'),
    craft: 'Metalwork',
    isFeatured: false,
  },
];

export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'Terracotta Earth Vase',
    description: 'A beautifully handcrafted terracotta vase, perfect for adding a rustic charm to any room. Each vase is unique, with subtle variations in color and texture that speak to its handmade origin.',
    price: 45.00,
    images: [getImage('product-pottery-1')],
    artisanId: 'artisan-1',
    category: 'Pottery',
    rating: 4.5,
    reviewCount: 23,
  },
  {
    id: 'prod-2',
    name: 'Indigo Soul Scarf',
    description: 'Wrap yourself in the comfort of this handwoven scarf, dyed with natural indigo. The soft, breathable cotton and timeless pattern make it a versatile accessory for any season.',
    price: 65.00,
    images: [getImage('product-textile-1')],
    artisanId: 'artisan-2',
    category: 'Weaving',
    rating: 5,
    reviewCount: 41,
  },
  {
    id: 'prod-3',
    name: 'Festival of Colors Canvas',
    description: 'A vibrant acrylic painting on canvas that captures the joyous spirit of a village festival. The bold strokes and rich colors will bring energy and life to your walls.',
    price: 250.00,
    images: [getImage('product-painting-1')],
    artisanId: 'artisan-3',
    category: 'Painting',
    rating: 4.8,
    reviewCount: 15,
  },
  {
    id: 'prod-4',
    name: 'Ceramic Breakfast Bowls',
    description: 'A set of four handmade ceramic bowls, glazed in a calming shade of sea green. They are perfect for your morning cereal, soup, or snacks. Microwave and dishwasher safe.',
    price: 80.00,
    images: [getImage('product-pottery-2')],
    artisanId: 'artisan-1',
    category: 'Pottery',
    rating: 4.9,
    reviewCount: 38,
  },
   {
    id: 'prod-5',
    name: 'Himalayan Dreams Tapestry',
    description: 'A large, handwoven tapestry featuring geometric patterns inspired by Himalayan textiles. Made with pure wool and natural dyes, it\'s a statement piece for any living space.',
    price: 180.00,
    images: [getImage('product-textile-2')],
    artisanId: 'artisan-2',
    category: 'Weaving',
    rating: 4.7,
    reviewCount: 19,
  },
];

export const reviews: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    author: 'Sunita Patil',
    rating: 5,
    comment: 'The vase is even more beautiful in person! It was packaged so carefully and arrived in perfect condition. A true piece of art.',
    avatar: getImage('review-avatar-1'),
  },
  {
    id: 'rev-2',
    productId: 'prod-1',
    author: 'Amit Desai',
    rating: 4,
    comment: 'Lovely vase, great quality. A bit smaller than I expected, but it fits my shelf perfectly. The craftsmanship is excellent.',
    avatar: getImage('review-avatar-2'),
  },
  {
    id: 'rev-3',
    productId: 'prod-2',
    author: 'Meera Krishnan',
    rating: 5,
    comment: 'So soft and the color is absolutely stunning. I get compliments every time I wear it. Highly recommend!',
    avatar: getImage('review-avatar-3'),
  },
];

export const orders: Order[] = [
    { id: 'ORD-001', customerName: 'Rohan Mehta', productName: 'Terracotta Earth Vase', date: '2024-05-20', status: 'Delivered', productId: 'prod-1' },
    { id: 'ORD-002', customerName: 'Isha Nair', productName: 'Indigo Soul Scarf', date: '2024-05-22', status: 'Shipped', productId: 'prod-2' },
    { id: 'ORD-003', customerName: 'Arjun Reddy', productName: 'Ceramic Breakfast Bowls', date: '2024-05-23', status: 'Processing', productId: 'prod-4' },
    { id: 'ORD-004', customerName: 'Pooja Bhatt', productName: 'Festival of Colors Canvas', date: '2024-05-18', status: 'Delivered', productId: 'prod-3' },
    { id: 'ORD-005', customerName: 'Karan Joshi', productName: 'Himalayan Dreams Tapestry', date: '2024-05-24', status: 'Processing', productId: 'prod-5' },
];
