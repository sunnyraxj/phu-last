import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";

interface ProductCardProps {
    product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/products/${product.id}`} className="group">
            <div className="bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="relative overflow-hidden aspect-square">
                    <Image
                        src={product.images[0].imageUrl}
                        alt={product.images[0].description}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint={product.images[0].imageHint}
                    />
                </div>
                <div className="p-4">
                    <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-bold text-primary">₹{product.price.toLocaleString()}</p>
                </div>
            </div>
        </Link>
    )
}
