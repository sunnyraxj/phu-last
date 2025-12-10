

"use client"

import { useState, useMemo, useEffect } from "react"
import { collection, doc, query, where, getDocs, writeBatch, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Search, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { PottersWheelSpinner } from "@/components/shared/PottersWheelSpinner";
import { signInAnonymously } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { ShoppingBag } from "lucide-react";


type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  "data-ai-hint": string;
  collection: string;
  material: string;
  inStock: boolean;
  description: string;
  artisanId: string;
};

type CartItem = Product & { quantity: number; cartItemId: string; };

type Store = {
    id: string;
    name: string;
    image?: string;
};

const collections = [
  { name: "Crafts", count: 5 },
  { name: "LifeStyle", count: 5 },
]

const materials = ["Paper", "Ceramic", "Brass", "Sabai Grass", "Jute"];

export default function ProductPage() {
  const [viewMode, setViewMode] = useState<"grid2" | "grid3" | "grid4">("grid4")
  const [sortBy, setSortBy] = useState("Featured")
  
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>("all"); // all, in-stock, out-of-stock
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      signInAnonymously(auth);
    }
  }, [user, isUserLoading, auth]);

  const productsQuery = useMemoFirebase(() =>
    query(collection(firestore, 'products')),
    [firestore]
  );
  const { data: allProducts, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  const cartItemsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'cart') : null,
    [firestore, user]
  );
  const { data: cartData, isLoading: cartLoading } = useCollection<{ productId: string; quantity: number }>(cartItemsQuery);

  const cartItems = useMemo(() => {
    if (!cartData || !allProducts) return [];
    return cartData.map(cartItem => {
      const product = allProducts.find(p => p.id === cartItem.productId);
      return product ? { ...product, quantity: cartItem.quantity, cartItemId: cartItem.id } : null;
    }).filter((item): item is CartItem => item !== null);
  }, [cartData, allProducts]);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: isUserDocLoading } = useDoc<{ role: string }>(userDocRef);

  const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
  const { data: stores } = useCollection<Store>(storesQuery);

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
  
  const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
    if (!user) return;
    const itemRef = doc(firestore, 'users', user.uid, 'cart', cartItemId);
    if (newQuantity > 0) {
      setDocumentNonBlocking(itemRef, { quantity: newQuantity }, { merge: true });
    } else {
      deleteDocumentNonBlocking(itemRef);
    }
  };
  
  const addToCart = (product: Product) => {
    if (!user) return;
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      updateCartItemQuantity(existingItem.cartItemId, existingItem.quantity + 1);
    } else {
      const cartCollection = collection(firestore, 'users', user.uid, 'cart');
      addDocumentNonBlocking(cartCollection, {
        productId: product.id,
        quantity: 1,
      });
    }
    toast({
      title: "Item Added",
      description: `${product.name} has been added to your cart.`,
    });
  };


  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
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
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
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
            // Assuming higher firestore doc id is not newer. We need a timestamp
            return 0;
          case 'Featured':
          default:
            return 0; 
        }
      });
  }, [allProducts, selectedCollections, selectedMaterials, availability, priceRange, sortBy, searchTerm]);


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
      <Header 
        userData={userData}
        cartItems={cartItems}
        updateCartItemQuantity={updateCartItemQuantity}
        stores={stores || []}
      />

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
      
      <div className="container mx-auto flex items-start">
        <aside className="w-72 bg-background p-6 border-r border-border h-screen sticky top-0 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold">Filter:</h2>
          </div>

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
            <div className="flex flex-1 items-center gap-4">
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
              <div className="relative w-full max-w-xs ml-4">
                <Input 
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
            
          {productsLoading ? (
            <div className="flex justify-center items-center h-96">
                <PottersWheelSpinner />
            </div>
          ) : (
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
                    <div className="flex gap-2">
                      <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => addToCart(product)}>
                        <ShoppingBag />
                      </Button>
                      <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => setSelectedProduct(product)}>
                        <Eye />
                      </Button>
                    </div>
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
                        <ShoppingBag className="mr-2" />
                        Add to Cart
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
          )}
        </main>
      </div>
    </div>
  )
}
