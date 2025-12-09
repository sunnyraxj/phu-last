'use client';

import { useState } from 'react';
import { Grid2X2, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { products } from '@/lib/placeholder-data';
import ProductCard from '@/components/product-card';
import FilterSidebar from '@/components/filter-sidebar';

export default function ProductsPage() {
  const [view, setView] = useState<'grid2' | 'grid3' | 'list'>('grid3');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10500]);

  const gridClasses = {
    grid2: 'grid-cols-1 md:grid-cols-2',
    grid3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    list: 'grid-cols-1',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-4 mb-8 md:flex-row">
          <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <div className="flex gap-1 rounded-lg border bg-card p-1">
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'grid2' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('grid2')}
                  className="h-8 w-8 p-0"
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'grid3' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('grid3')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort By:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="container flex items-start gap-8">
          <FilterSidebar
            priceRange={priceRange}
            setPriceRange={setPriceRange}
          />
          <div className="flex-1">
            <div
              className={`grid gap-x-4 gap-y-8 ${gridClasses[view]}`}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
