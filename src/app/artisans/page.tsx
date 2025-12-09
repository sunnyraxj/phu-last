import { artisans } from '@/lib/placeholder-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';

export default function ArtisansPage() {
  return (
    <div className="container py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Our Artisans</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Meet the creative minds and skilled hands behind our collection. Each artisan brings a unique heritage and passion to their work.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {artisans.map((artisan) => (
          <Link key={artisan.id} href={`/artisans/${artisan.id}`} className="group">
            <Card className="overflow-hidden h-full transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={artisan.avatar.imageUrl}
                    alt={`Portrait of ${artisan.name}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={artisan.avatar.imageHint}
                  />
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <Badge variant="secondary" className="w-fit">{artisan.craft}</Badge>
                  <h2 className="font-headline text-2xl font-bold mt-2">{artisan.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-4 flex-grow">{artisan.bio}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
