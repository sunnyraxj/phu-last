import { products, reviews as allReviews, artisans } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}


export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    notFound();
  }
  
  const artisan = artisans.find((a) => a.id === product.artisanId);
  const reviews = allReviews.filter((r) => r.productId === product.id);

  return (
    <div className="container py-12 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div>
          <Card className="overflow-hidden">
            <div className="relative aspect-square w-full">
              <Image
                src={product.images[0].imageUrl}
                alt={product.images[0].description}
                fill
                className="object-cover"
                data-ai-hint={product.images[0].imageHint}
                priority
              />
            </div>
          </Card>
          {/* Add thumbnails for more images if needed */}
        </div>
        <div>
          <h1 className="font-headline text-4xl font-bold">{product.name}</h1>
          
          {artisan && (
            <Link href={`/artisans/${artisan.id}`} className="text-lg text-muted-foreground hover:text-primary transition-colors">
              by {artisan.name}
            </Link>
          )}

          <div className="flex items-center gap-2 mt-4">
            <StarRating rating={product.rating} />
            <span className="text-muted-foreground text-sm">({product.reviewCount} reviews)</span>
          </div>
          
          <Separator className="my-6" />

          <p className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</p>
          <p className="mt-4 text-muted-foreground">{product.description}</p>
          
          <div className="mt-6">
            <Button size="lg" className="w-full">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-16">
        <h2 className="font-headline text-3xl font-bold">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="space-y-6">
                {reviews.length > 0 ? reviews.map(review => (
                    <Card key={review.id}>
                        <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                                <Avatar>
                                    <AvatarImage src={review.avatar.imageUrl} alt={review.author} data-ai-hint={review.avatar.imageHint} />
                                    <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{review.author}</p>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="text-muted-foreground mt-2">{review.comment}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <p className="text-muted-foreground">No reviews for this product yet. Be the first to write one!</p>
                )}
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Write a Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div>
                                <label className="font-semibold">Rating</label>
                                <div className="flex mt-1">
                                    {/* Interactive star rating could be a component */}
                                    <StarRating rating={0} /> 
                                </div>
                            </div>
                            <div>
                                <label htmlFor="review" className="font-semibold">Review</label>
                                <Textarea id="review" placeholder="Share your thoughts on the product..." className="mt-1"/>
                            </div>
                            <Button>Submit Review</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
