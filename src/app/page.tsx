"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/placeholder-data";
import ProductCard from "@/components/product-card";

function PotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5.5 14h13M5.5 17h13M8 21h8" />
      <path d="M12 3v3" />
      <path d="M10.2 4.1 8 6" />
      <path d="m13.8 4.1 2.2 1.9" />
      <path d="M17.5 11c.9-.9.9-2.4 0-3.3l-2.2-2.2c-.9-.9-2.4-.9-3.3 0" />
      <path d="M6.5 11c-.9-.9-.9-2.4 0-3.3l2.2-2.2c.9-.9 2.4-.9 3.3 0" />
      <path d="m17.5 11-5.5 5.5-5.5-5.5" />
    </svg>
  );
}


export default function Home() {
  return (
    <>
      <section className="relative w-full h-[60vh] md:h-[80vh] bg-[#3d2c1d] text-white -mx-6 sm:-mx-8 md:-mx-24">
        <Image
          src="https://images.unsplash.com/photo-1594966611394-b1a3372c918c?q=80&w=2070&auto=format&fit=crop"
          alt="Handcrafted terracotta sculpture"
          fill
          className="object-contain object-bottom opacity-50"
          data-ai-hint="terracotta sculpture"
        />
        <div className="relative z-10 flex flex-col items-end justify-center h-full container pr-16 md:pr-32">
          <div className="text-right flex flex-col items-end">
            <PotIcon className="w-16 h-16 mb-4 text-amber-100" />
            <h1 className="text-4xl md:text-6xl font-serif text-amber-100/90 leading-tight">
              Handcrafted by the
              <br />
              artisans of Bengal
            </h1>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-background">
        <div className="container flex flex-col items-center">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-2">Discover unique creations from our talented artisans</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0,4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/products">Shop All</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
