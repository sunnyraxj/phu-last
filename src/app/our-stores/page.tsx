
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { initializeAdminApp } from "@/firebase/admin";
import { PottersWheelSpinner } from '@/components/shared/PottersWheelSpinner';
import { ServerHeaderWrapper } from "@/components/shared/ServerHeaderWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

type Store = {
    id: string;
    name: string;
    address: string;
    phone?: string;
    image?: string;
    googleMapsLink: string;
    'data-ai-hint'?: string;
};

async function getStores() {
    try {
        const { firestore } = initializeAdminApp();
        const storesSnapshot = await firestore.collection('stores').get();
        const stores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Store[];
        return stores;
    } catch (error) {
        console.error("Error fetching stores: ", error);
        return [];
    }
}


export default async function OurStoresPage() {
    const stores = await getStores();

  return (
    <div className="bg-background">
      <ServerHeaderWrapper />

      <main className="container mx-auto py-8 sm:py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Our Store Locations</h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto sm:text-xl">
            Find a Purbanchal Hasta Udyog store near you.
          </p>
        </div>

        {stores.length > 0 ? (
            <Carousel
                opts={{
                    align: "start",
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {stores.map((store) => (
                        <CarouselItem key={store.id} className="pl-2 md:pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3">
                            <div className="p-1">
                                <Card className="overflow-hidden flex flex-col h-full">
                                    {store.image && (
                                        <div className="relative h-40 sm:h-48 w-full">
                                            <Image
                                                src={store.image}
                                                alt={store.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={store['data-ai-hint']}
                                            />
                                        </div>
                                    )}
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-base font-bold truncate">{store.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 flex-grow space-y-2">
                                        <div className="flex items-start gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                            <p className="text-xs">{store.address}</p>
                                        </div>
                                        {store.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4 shrink-0" />
                                                <p className="text-xs">{store.phone}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-3 pt-0 mt-auto">
                                        <Link href={store.googleMapsLink} target="_blank" rel="noopener noreferrer">
                                            <Button className="w-full text-xs">
                                                View on Google Maps <ExternalLink className="ml-2 h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        ) : (
            <div className="text-center h-64 flex flex-col items-center justify-center">
                <p className="text-muted-foreground">No store locations have been added yet.</p>
            </div>
        )}
      </main>
    </div>
  );
}
