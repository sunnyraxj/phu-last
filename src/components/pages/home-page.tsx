'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { artisans, products } from '@/lib/placeholder-data';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ArrowRight, Star } from 'lucide-react';
import { Badge } from '../ui/badge';
import { getRecommendations, type RecommendationState } from '@/lib/actions';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PottersWheelSpinner } from '../shared/PottersWheelSpinner';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PaintingIcon } from '../icons/PaintingIcon';
import { PotteryIcon } from '../icons/PotteryIcon';
import { WeavingIcon } from '../icons/WeavingIcon';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image')!;

const categoryIcons: { [key: string]: React.ReactNode } = {
  All: null,
  Pottery: <PotteryIcon className="mr-2 h-5 w-5" />,
  Weaving: <WeavingIcon className="mr-2 h-5 w-5" />,
  Painting: <PaintingIcon className="mr-2 h-5 w-5" />,
};

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') {
      return products;
    }
    return products.filter((product) => product.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <HeroSection />
        <FeaturedArtisans />
        <RecommendationEngine />
        <ProductShowcase
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          products={filteredProducts}
        />
      </main>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full h-[60vh] md:h-[70vh]">
        <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative container h-full flex flex-col items-start justify-end pb-12 md:pb-24 text-foreground">
            <h1 className="font-headline text-4xl md:text-6xl font-bold max-w-2xl">
                The Soul of Craft, <br /> Delivered to Your Home.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Discover unique, handcrafted treasures from the heart of Purbanchal. Each piece tells a story.
            </p>
            <Button size="lg" className="mt-6" asChild>
                <Link href="#products">Explore Products</Link>
            </Button>
        </div>
    </section>
  );
}

function FeaturedArtisans() {
    const featuredArtisans = artisans.filter(a => a.isFeatured);
  return (
    <section className="py-16 lg:py-24 bg-secondary/40">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
                <h2 className="font-headline text-3xl font-bold">Meet Our Artisans</h2>
                <p className="mt-2 text-muted-foreground max-w-2xl">
                    The talented hands and hearts behind the crafts. Learn their stories and explore their unique creations.
                </p>
            </div>
            <Button variant="outline" className="mt-4 md:mt-0" asChild>
                <Link href="/artisans">View All Artisans <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {featuredArtisans.map((artisan) => (
              <CarouselItem key={artisan.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className="overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="relative h-64 w-full">
                            <Image
                                src={artisan.avatar.imageUrl}
                                alt={artisan.avatar.description}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint={artisan.avatar.imageHint}
                            />
                        </div>
                        <div className="p-6">
                            <Badge variant="secondary">{artisan.craft}</Badge>
                            <h3 className="font-headline text-xl font-bold mt-2">{artisan.name}</h3>
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{artisan.bio}</p>
                            <Button variant="link" className="p-0 mt-4 h-auto" asChild>
                                <Link href={`/artisans/${artisan.id}`}>Read their story <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex" />
          <CarouselNext className="hidden lg:flex"/>
        </Carousel>
      </div>
    </section>
  );
}

function RecommendationEngine() {
  const { toast } = useToast();
  const initialState: RecommendationState = {};
  const [state, formAction] = useActionState(getRecommendations, initialState);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(false);
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: state.error,
      });
    }
  }, [state, toast]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    formAction(formData);
  };


  return (
    <section className="py-16 lg:py-24">
        <div className="container">
            <Card className="p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h2 className="font-headline text-3xl font-bold">Crafted Just For You</h2>
                        <p className="mt-2 text-muted-foreground">
                            Let our AI assistant help you find the perfect piece. Tell us what you like, and we&apos;ll suggest crafts and artisans tailored to your taste.
                        </p>
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <Textarea
                                name="preferences"
                                placeholder="e.g., 'I love earthy tones, minimalist designs, and functional pottery for my kitchen.'"
                                className="min-h-[100px]"
                                required
                                />
                                {state.fieldErrors?.preferences && <p className="text-sm text-destructive mt-1">{state.fieldErrors.preferences[0]}</p>}
                            </div>
                            <div>
                                <Textarea
                                name="browsingHistory"
                                placeholder="Optionally, mention any items or styles you've admired. e.g., 'I liked the indigo scarves and abstract paintings.'"
                                className="min-h-[60px]"
                                />
                            </div>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Generating..." : "Get Recommendations"}
                            </Button>
                        </form>
                    </div>
                    <div className="bg-secondary/40 rounded-lg p-6 min-h-[250px] flex items-center justify-center">
                        {isPending ? (
                            <PottersWheelSpinner />
                        ) : state.recommendations ? (
                            <div>
                                <h3 className="font-headline text-xl font-bold">Our Suggestions:</h3>
                                <p className="mt-2 whitespace-pre-wrap">{state.recommendations}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center">Your personalized recommendations will appear here.</p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    </section>
  )
}

function ProductShowcase({
  selectedCategory,
  setSelectedCategory,
  products,
}: {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  products: any[];
}) {
  const categories = ['All', 'Pottery', 'Weaving', 'Painting'];

  return (
    <section id="products" className="py-16 lg:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="font-headline text-3xl font-bold">Our Collection</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Browse our curated selection of handmade products. Each item is crafted with passion and skill.
          </p>
        </div>
        <div className="flex justify-center mb-8">
            <div className="p-1.5 rounded-lg bg-secondary/40 flex items-center gap-2">
            {categories.map((category) => (
                <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                onClick={() => setSelectedCategory(category)}
                className="flex items-center"
                >
                {categoryIcons[category]}
                {category}
                </Button>
            ))}
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
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
                            <p className="text-sm text-muted-foreground">by {artisans.find(a => a.id === product.artisanId)?.name}</p>
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
      </div>
    </section>
  );
}
