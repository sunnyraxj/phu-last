"use client"

import { useState } from "react"
import { ChevronDown, Search, User, Heart, ShoppingCart, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"

const mockProducts = [
  {
    id: 1,
    name: "Set Of 6 Jamini Roy Prints",
    price: 1200.00,
    image: "https://picsum.photos/seed/1/400/400",
    "data-ai-hint": "art prints"
  },
  {
    id: 2,
    name: "Ceramic Etched Bird Plate",
    price: 5000.00,
    image: "https://picsum.photos/seed/2/400/400",
    "data-ai-hint": "ceramic plate"
  },
  {
    id: 3,
    name: "Dokra Bell",
    price: 1900.00,
    image: "https://picsum.photos/seed/3/400/400",
    "data-ai-hint": "brass bell"
  },
  {
    id: 4,
    name: "Sabai Basket With Lid",
    price: 750.00,
    image: "https://picsum.photos/seed/4/400/400",
    "data-ai-hint": "woven basket"
  },
  {
    id: 5,
    name: "Brass Ganesha Idol",
    price: 2500.00,
    image: "https://picsum.photos/seed/5/400/400",
    "data-ai-hint": "brass idol"
  },
  {
    id: 6,
    name: "Dhokra Bird Figurine",
    price: 1800.00,
    image: "https://picsum.photos/seed/6/400/400",
    "data-ai-hint": "brass figurine"
  },
  {
    id: 7,
    name: "Green Leaf Ceramic Bowl",
    price: 3200.00,
    image: "https://picsum.photos/seed/7/400/400",
    "data-ai-hint": "ceramic bowl"
  },
  {
    id: 8,
    name: "Woven Jute Basket",
    price: 1100.00,
    image: "https://picsum.photos/seed/8/400/400",
    "data-ai-hint": "jute basket"
  },
]

const collections = [
  { name: "Food", count: "(27)" },
  { name: "Brands", count: "(17)" },
  { name: "Books", count: "(45)" },
  { name: "Crafts", count: "(282)" },
  { name: "LifeStyle", count: "(52)" },
  { name: "Textiles", count: "(120)" },
]

export default function ProductPage() {
  const [viewMode, setViewMode] = useState<"grid2" | "grid3" | "grid4">("grid4") // grid2, grid3, or grid4
  const [sortBy, setSortBy] = useState("Featured")
  const [cartCount, setCartCount] = useState(2)
  const [wishlistCount, setWishlistCount] = useState(0)

  const getGridCols = () => {
    switch (viewMode) {
      case 'grid2':
        return 'grid-cols-2'
      case 'grid3':
        return 'grid-cols-3'
      case 'grid4':
      default:
        return 'grid-cols-4'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <div className="flex">
        {/* Sidebar Filter */}
        <aside className="w-80 bg-white p-8 border-r border-border min-h-screen">
          <h2 className="text-2xl font-bold mb-8">Filter:</h2>

          {/* Collection Filter */}
          <div className="mb-8">
            <button className="flex items-center justify-between w-full text-lg font-semibold mb-4">
              <span>Collection</span>
              <ChevronDown size={20} />
            </button>
            <div className="space-y-3">
              {collections.map((col) => (
                <label key={col.name} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox id={col.name} />
                  <span className="text-sm">
                    {col.name} <span className="text-muted-foreground">{col.count}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-b border-border my-8"></div>

          {/* Material Filter */}
          <div className="mb-8">
            <button className="flex items-center justify-between w-full text-lg font-semibold">
              <span>Material</span>
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="border-b border-border my-8"></div>

          {/* Availability Filter */}
          <div className="mb-8">
            <button className="flex items-center justify-between w-full text-lg font-semibold">
              <span>Availability</span>
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="border-b border-border my-8"></div>

          {/* Price Filter */}
          <div>
            <button className="flex items-center justify-between w-full text-lg font-semibold mb-4">
              <span>Price</span>
              <ChevronDown size={20} />
            </button>
            <Slider defaultValue={[33]} max={100} step={1} />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>₹0</span>
              <span>₹10,000</span>
            </div>
          </div>
        </aside>

        {/* Products Area */}
        <main className="flex-1 p-8">
          {/* Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">View:</span>
              <div className="flex gap-1 border border-border rounded-md p-1">
                 <Button variant={viewMode === 'grid2' ? 'secondary' : 'ghost'} size="sm" className="w-9 h-9 p-0" onClick={() => setViewMode('grid2')}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === 'grid3' ? 'secondary' : 'ghost'} size="sm" className="w-9 h-9 p-0" onClick={() => setViewMode('grid3')}>
                   <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === 'grid4' ? 'secondary' : 'ghost'} size="sm" className="w-9 h-9 p-0" onClick={() => setViewMode('grid4')}>
                   <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <label className="text-foreground font-semibold">Sort By:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Featured">Featured</SelectItem>
                    <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                    <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>

              </div>
              <span className="text-foreground font-semibold">282 Products</span>
            </div>
          </div>

          {/* Product Grid */}
          <div
            className={`grid gap-6 ${getGridCols()}`}
          >
            {mockProducts.map((product) => (
              <div key={product.id} className="group">
                <div className="bg-muted aspect-square rounded-lg overflow-hidden mb-4 cursor-pointer hover:opacity-80 transition relative">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint={product['data-ai-hint']}
                  />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm line-clamp-2">{product.name}</h3>
                <p className="text-primary font-bold text-lg">
                   {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
