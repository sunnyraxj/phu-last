import { artisans, products } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Star } from 'lucide-react';

export default function ArtisanProfilePage({ params }: { params: { id: string } }) {
  const artisan = artisans.find((a) => a.id === params.id);
  if (!artisan) {
    notFound();
  }

  const artisanProducts = products.filter((p) => p.artisanId === artisan.id);

  return (
    <div className="container py-12 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-0">
              <div className="relative aspect-square w-full">
                <Image
                  src={artisan.avatar.imageUrl}
                  alt={`Portrait of ${artisan.name}`}
                  fill
                  className="object-cover rounded-t-lg"
                  data-ai-hint={artisan.avatar.imageHint}
                />
              </div>
              <div className="p-6">
                <h1 className="font-headline text-3xl font-bold">{artisan.name}</h1>
                <Badge variant="default" className="mt-2 text-base">{artisan.craft}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <h2 className="font-headline text-2xl font-bold">Their Story</h2>
          <p className="mt-4 text-lg text-muted-foreground whitespace-pre-line">{artisan.bio}</p>

          <div className="mt-12">
            <h3 className="font-headline text-2xl font-bold">Creations by {artisan.name}</h3>
            {artisanProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                    {artisanProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden group">
                            <Link href={`/products/${product.id}`} className="block">
                                <CardContent className="p-0">
                                    <div className="relative aspect-square w-full overflow-hidden">
                                        <Image
                                            src={product.images[0].imageUrl}
                                            alt={product.images[0].description}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            data-ai-hint={product.images[0].imageHint}
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="font-bold text-lg text-primary">${product.price.toFixed(2)}</p>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <span className="text-sm text-muted-foreground">{product.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            ) : (
              <p className="mt-6 text-muted-foreground">No products found for this artisan yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
