"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Search, User, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const allProducts = [
  {
    id: 1,
    name: "Set Of 6 Jamini Roy Prints",
    price: 1200.00,
    image: "https://picsum.photos/seed/1/400/400",
    "data-ai-hint": "art prints",
    collection: "Crafts",
    material: "Paper",
    inStock: true,
  },
  {
    id: 2,
    name: "Ceramic Etched Bird Plate",
    price: 5000.00,
    image: "https://picsum.photos/seed/2/400/400",
    "data-ai-hint": "ceramic plate",
    collection: "Crafts",
    material: "Ceramic",
    inStock: true,
  },
  {
    id: 3,
    name: "Dokra Bell",
    price: 1900.00,
    image: "https://picsum.photos/seed/3/400/400",
    "data-ai-hint": "brass bell",
    collection: "Crafts",
    material: "Brass",
    inStock: false,
  },
  {
    id: 4,
    name: "Sabai Basket With Lid",
    price: 750.00,
    image: "https://picsum.photos/seed/4/400/400",
    "data-ai-hint": "woven basket",
    collection: "LifeStyle",
    material: "Sabai Grass",
    inStock: true,
  },
  {
    id: 5,
    name: "Brass Ganesha Idol",
    price: 2500.00,
    image: "https://picsum.photos/seed/5/400/400",
    "data-ai-hint": "brass idol",
    collection: "Crafts",
    material: "Brass",
    inStock: true,
  },
  {
    id: 6,
    name: "Dhokra Bird Figurine",
    price: 1800.00,
    image: "https://picsum.photos/seed/6/400/400",
    "data-ai-hint": "brass figurine",
    collection: "Crafts",
    material: "Brass",
    inStock: false,
  },
  {
    id: 7,
    name: "Green Leaf Ceramic Bowl",
    price: 3200.00,
    image: "https://picsum.photos/seed/7/400/400",
    "data-ai-hint": "ceramic bowl",
    collection: "LifeStyle",
    material: "Ceramic",
    inStock: true,
  },
  {
    id: 8,
    name: "Woven Jute Basket",
    price: 1100.00,
    image: "https://picsum.photos/seed/8/400/400",
    "data-ai-hint": "jute basket",
    collection: "LifeStyle",
    material: "Jute",
    inStock: true,
  },
]

const collections = [
  { name: "Crafts", count: allProducts.filter(p => p.collection === "Crafts").length },
  { name: "LifeStyle", count: allProducts.filter(p => p.collection === "LifeStyle").length },
]

const materials = ["Paper", "Ceramic", "Brass", "Sabai Grass", "Jute"];

export default function ProductPage() {
  const [viewMode, setViewMode] = useState<"grid2" | "grid3" | "grid4">("grid4")
  const [sortBy, setSortBy] = useState("Featured")
  const [cartCount, setCartCount] = useState(2)
  const [wishlistCount, setWishlistCount] = useState(0)

  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>("all"); // all, in-stock, out-of-stock
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const handleCollectionChange = (collectionName: string) => {
    setSelectedCollections(prev => 
      prev.includes(collectionName) 
        ? prev.filter(c => c !== collectionName)
        : [...prev, collectionName]
    )
  }
  
  const handleMaterialChange = (materialName: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialName) 
        ? prev.filter(m => m !== materialName)
        : [...prev, materialName]
    )
  }

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter(product => {
        if (selectedCollections.length > 0 && !selectedCollections.includes(product.collection)) {
          return false;
        }
        if (selectedMaterials.length > 0 && !selectedMaterials.includes(product.material)) {
          return false;
        }
        if (availability === 'in-stock' && !product.inStock) {
          return false;
        }
        if (availability === 'out-of-stock' && product.inStock) {
          return false;
        }
        if (product.price < priceRange[0] || product.price > priceRange[1]) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low-high':
            return a.price - b.price;
          case 'price-high-low':
            return b.price - a.price;
          case 'newest':
            return b.id - a.id; // Assuming higher ID is newer
          case 'Featured':
          default:
            return 0; // Or some other default logic
        }
      });
  }, [selectedCollections, selectedMaterials, availability, priceRange, sortBy]);


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
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">P</span>
            </div>
            <span className="text-lg font-semibold">Purbanchal Hasta Udyog</span>
          </div>

          <nav className="flex items-center gap-8 text-sm font-semibold">
            <button className="flex items-center gap-1 hover:opacity-80">
              CRAFTS <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-1 hover:opacity-80">
              LIFESTYLE <ChevronDown size={16} />
            </button>
            <button className="hover:opacity-80">OUR STORE</button>
            <button className="hover:opacity-80">BLOG</button>
          </nav>

          <div className="flex items-center gap-6">
            <button className="hover:opacity-80">
              <Search size={20} />
            </button>
            <button className="hover:opacity-80">
              <User size={20} />
            </button>
            <button className="relative hover:opacity-80">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button className="relative hover:opacity-80">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto flex">
        <aside className="w-80 bg-white p-8 border-r border-border min-h-screen">
          <h2 className="text-2xl font-bold mb-8">Filter:</h2>

          <Accordion type="multiple" defaultValue={["collection", "material", "availability", "price"]} className="w-full">
            <AccordionItem value="collection">
              <AccordionTrigger className="text-lg font-semibold">Collection</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                  {collections.map((col) => (
                    <label key={col.name} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox 
                        id={col.name} 
                        onCheckedChange={() => handleCollectionChange(col.name)}
                        checked={selectedCollections.includes(col.name)}
                      />
                      <span className="text-sm">
                        {col.name} <span className="text-muted-foreground">({col.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="material">
              <AccordionTrigger className="text-lg font-semibold">Material</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                    {materials.map((mat) => (
                      <label key={mat} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox 
                          id={mat}
                          onCheckedChange={() => handleMaterialChange(mat)}
                          checked={selectedMaterials.includes(mat)}
                        />
                        <span className="text-sm">{mat}</span>
                      </label>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="availability">
              <AccordionTrigger className="text-lg font-semibold">Availability</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox id="in-stock" onCheckedChange={(checked) => setAvailability(checked ? 'in-stock' : 'all')} checked={availability === 'in-stock'} />
                    <span className="text-sm">In Stock</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox id="out-of-stock" onCheckedChange={(checked) => setAvailability(checked ? 'out-of-stock' : 'all')} checked={availability === 'out-of-stock'} />
                    <span className="text-sm">Out of Stock</span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="price">
              <AccordionTrigger className="text-lg font-semibold">Price</AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <Slider 
                    defaultValue={[0, 10000]} 
                    max={10000} 
                    step={100}
                    min={0}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])} 
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">View:</span>
              <div className="flex gap-1 border border-border rounded-md p-1">
                 <Button variant={viewMode === 'grid2' ? 'secondary' : 'ghost'} size="sm" className="w-9 h-9 p-0" onClick={() => setViewMode('grid2')}>
                  <span className="grid grid-cols-2 gap-0.5 p-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} className="w-2 h-2 bg-current rounded-full"></span>
                    ))}
                  </span>
                </Button>
                <Button variant={viewMode === 'grid3' ? 'secondary' : 'ghost'} size="sm" className="w-9 h-9 p-0" onClick={() => setViewMode('grid3')}>
                  <span className="grid grid-cols-3 gap-0.5 p-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-current rounded-full"></span>
                    ))}
                  </span>
                </Button>
                <Button variant={viewMode === 'grid4' ? 'secondary' : 'ghost'} size="sm" className="w-9 h-9 p-0" onClick={() => setViewMode('grid4')}>
                   <span className="grid grid-cols-4 gap-0.5 p-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="w-1 h-1 bg-current rounded-full"></span>
                    ))}
                  </span>
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
              <span className="text-foreground font-semibold">{filteredProducts.length} Products</span>
            </div>
          </div>

          <div
            className={`grid gap-6 ${getGridCols()}`}
          >
            {filteredProducts.map((product) => (
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
