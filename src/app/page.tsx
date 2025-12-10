"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Search, User, ShoppingCart, Plus, Minus, X, Eye, ShoppingBag } from "lucide-react"
import Link from "next/link";
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  "data-ai-hint": string;
  collection: string;
  material: string;
  inStock: boolean;
  description: string;
};


const allProducts: Product[] = [
  {
    id: 1,
    name: "Set Of 6 Jamini Roy Prints",
    price: 1200.00,
    image: "https://picsum.photos/seed/1/400/400",
    "data-ai-hint": "art prints",
    collection: "Crafts",
    material: "Paper",
    inStock: true,
    description: "A beautiful set of 6 prints by the famous artist Jamini Roy, perfect for decorating your home.",
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
    description: "A stunning ceramic plate with an etched bird design, handcrafted by skilled artisans.",
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
    description: "A traditional Dokra bell, made with the lost-wax casting technique. Adds a rustic charm.",
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
    description: "A handwoven Sabai grass basket with a lid, perfect for storage or as a decorative piece.",
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
    description: "An intricately detailed brass idol of Lord Ganesha, ideal for your home temple or as a gift.",
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
    description: "A charming bird figurine made using the Dhokra art form, perfect for any collector.",
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
    description: "A beautiful ceramic bowl shaped like a green leaf, bringing a touch of nature indoors.",
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
    description: "A sturdy and stylish woven jute basket, great for organizing your space with a natural touch.",
  },
]

const collections = [
  { name: "Crafts", count: allProducts.filter(p => p.collection === "Crafts").length },
]

const materials = ["Paper", "Ceramic", "Brass", "Sabai Grass", "Jute"];

export default function ProductPage() {
  const [viewMode, setViewMode] = useState<"grid2" | "grid3" | "grid4">("grid4")
  const [sortBy, setSortBy] = useState("Featured")
  
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>("all"); // all, in-stock, out-of-stock
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  
  const [cartItems, setCartItems] = useState([
    { ...allProducts[0], quantity: 1 },
    { ...allProducts[3], quantity: 2 },
  ]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const cartSubtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);

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
  
  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    setCartItems(currentItems => 
      newQuantity > 0
        ? currentItems.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item)
        : currentItems.filter(item => item.id !== productId)
    );
  };
  
  const addToCart = (product: Product) => {
    setCartItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      if (existingItem) {
        return currentItems.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentItems, { ...product, quantity: 1 }];
    });
  };

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
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-black text-white">
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
            <button className="hover:opacity-80">OUR STORE</button>
            <Link href="/our-team">
              <button className="hover:opacity-80">OUR TEAM</button>
            </Link>
            <button className="hover:opacity-80">BLOG</button>
          </nav>

          <div className="flex items-center gap-6">
            <button className="hover:opacity-80">
              <Search size={20} />
            </button>
            <button className="hover:opacity-80">
              <User size={20} />
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative hover:opacity-80">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>Your Cart ({cartCount})</SheetTitle>
                </SheetHeader>
                {cartItems.length > 0 ? (
                  <>
                  <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    <Separator className="my-4" />
                    <div className="flex flex-col gap-6">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                           <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                           </div>
                           <div className="flex-1">
                             <p className="font-semibold text-sm">{item.name}</p>
                             <p className="text-muted-foreground text-sm">
                               {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price)}
                             </p>
                             <div className="flex items-center gap-2 mt-2">
                               <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}>
                                 <Minus size={14} />
                               </Button>
                               <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                  className="h-7 w-12 text-center"
                                />
                               <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}>
                                 <Plus size={14} />
                               </Button>
                             </div>
                           </div>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => updateCartItemQuantity(item.id, 0)}>
                             <X size={16}/>
                           </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <SheetFooter className="mt-auto pt-6">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between font-semibold">
                        <span>Subtotal</span>
                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cartSubtotal)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Shipping & taxes calculated at checkout.</p>
                      <Button size="lg" className="w-full">Checkout</Button>
                    </div>
                  </SheetFooter>
                </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                    <ShoppingCart size={48} className="text-muted-foreground" />
                    <h3 className="text-xl font-semibold">Your cart is empty</h3>
                    <p className="text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                    <SheetClose asChild>
                      <Button>Continue Shopping</Button>
                    </SheetClose>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="relative h-[60vh] w-full flex items-center justify-center text-white">
        <Image
          src="https://picsum.photos/seed/hero/1200/800"
          alt="Handcrafted pottery"
          fill
          className="object-cover"
          data-ai-hint="handicrafts lifestyle"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">Artisans of the East</h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Discover handcrafted treasures that tell a story.
          </p>
          <Button size="lg" variant="secondary">
            Shop Now
          </Button>
        </div>
      </section>
      
      <div className="container mx-auto flex">
        <aside className="w-72 bg-background p-6 border-r border-border min-h-screen">
          <h2 className="text-xl font-bold mb-6">Filter:</h2>

          <Accordion type="multiple" defaultValue={["collection", "material", "availability", "price"]} className="w-full">
            <AccordionItem value="collection">
              <AccordionTrigger className="font-semibold py-3 text-base">Collection</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
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
              <AccordionTrigger className="font-semibold py-3 text-base">Material</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
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
              <AccordionTrigger className="font-semibold py-3 text-base">Availability</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
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
              <AccordionTrigger className="font-semibold py-3 text-base">Price</AccordionTrigger>
              <AccordionContent>
                <div className="pt-2">
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
                  <span className="flex items-center justify-center h-full w-full gap-0.5 p-1">
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
                  </span>
                </Button>
                <Button variant={viewMode === 'grid3' ? 'secondary' : 'ghost'} size="sm" className="w-9 h-9 p-0" onClick={() => setViewMode('grid3')}>
                  <span className="flex items-center justify-center h-full w-full gap-0.5 p-1">
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
                  </span>
                </Button>
                <Button variant={viewMode === 'grid4' ? 'secondary' : 'ghost'} size="sm" className="w-9 h-9 p-0" onClick={() => setViewMode('grid4')}>
                   <span className="flex items-center justify-center h-full w-full gap-0.5 p-1">
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
                    <span className="w-1.5 h-full bg-current rounded-sm"></span>
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

          <Dialog open={!!selectedProduct} onOpenChange={(isOpen) => !isOpen && setSelectedProduct(null)}>
            <div className={cn('grid gap-x-8 gap-y-12', getGridCols())}>
              {filteredProducts.map((product) => (
                <div key={product.id} className="group relative overflow-hidden rounded-lg">
                  <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={product['data-ai-hint']}
                    />
                     <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="font-semibold text-sm text-white truncate">{product.name}</h3>
                      <p className="text-white/80 text-sm mt-1">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(product.price)}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => addToCart(product)}>
                      <ShoppingBag />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => setSelectedProduct(product)}>
                      <Eye />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedProduct && (
              <DialogContent className="sm:max-w-[800px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2">
                  <div className="relative aspect-square bg-muted rounded-lg">
                    <Image
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-bold">{selectedProduct.name}</DialogTitle>
                      <DialogDescription className="text-base pt-4">
                        {selectedProduct.description}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <p className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(selectedProduct.price)}
                      </p>
                      <p className={cn("mt-2 text-sm font-semibold", selectedProduct.inStock ? "text-green-600" : "text-red-600")}>
                        {selectedProduct.inStock ? "In Stock" : "Out of Stock"}
                      </p>
                    </div>
                    <DialogFooter className="mt-6">
                      <Button size="lg" className="w-full" onClick={() => addToCart(selectedProduct)} disabled={!selectedProduct.inStock}>
                        <ShoppingCart className="mr-2" />
                        Add to Cart
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        </main>
      </div>
    </div>
  )
}
