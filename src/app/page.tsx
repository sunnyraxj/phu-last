

"use client"

import { useState, useMemo, useEffect } from "react"
import { collection, doc, query, where, getDocs, writeBatch, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Search, Eye, Filter, ShoppingBag as ShoppingBagIcon, MapPin, Phone, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { PottersWheelSpinner } from "@/components/shared/PottersWheelSpinner";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  "data-ai-hint": string;
  category: string;
  material: string;
  inStock: boolean;
  description: string;
  artisanId: string;
};

type Order = {
    status: 'pending' | 'shipped' | 'delivered';
};

type CartItem = Product & { quantity: number; cartItemId: string; };

type Store = {
    id: string;
    name: string;
    address: string;
    phone?: string;
    image?: string;
    googleMapsLink: string;
    'data-ai-hint'?: string;
};

type TeamMember = {
    id: string;
    name: string;
    role: 'Founder' | 'Management' | 'Team Member';
    bio: string;
    image: string;
    'data-ai-hint'?: string;
};


const categories = [
  { name: "Crafts", count: 5 },
  { name: "LifeStyle", count: 5 },
]

const materials = ["Paper", "Ceramic", "Brass", "Sabai Grass", "Jute"];

function Filters({ selectedCategories, handleCategoryChange, selectedMaterials, handleMaterialChange, availability, setAvailability, priceRange, setPriceRange }: any) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Filter:</h2>
      </div>

      <Accordion type="multiple" defaultValue={["category", "material", "availability", "price"]} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="font-semibold py-3 text-base">Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {categories.map((cat) => (
                <label key={cat.name} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    id={cat.name}
                    onCheckedChange={() => handleCategoryChange(cat.name)}
                    checked={selectedCategories.includes(cat.name)}
                  />
                  <span className="text-sm">
                    {cat.name} <span className="text-muted-foreground">({cat.count})</span>
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
    </>
  )
}

export default function ProductPage() {
  const [sortBy, setSortBy] = useState("Featured")
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
        // Use non-blocking anonymous sign-in if needed, or handle redirection
    }
  }, [user, isUserLoading, auth, firestore]);

  const productsQuery = useMemoFirebase(() =>
    query(collection(firestore, 'products')),
    [firestore]
  );
  const { data: allProducts, isLoading: productsLoading } = useCollection<Product>(productsQuery);
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: isUserDocLoading } = useDoc<{ role: string }>(userDocRef);
  
 const ordersQuery = useMemoFirebase(() => 
    (userData?.role === 'admin' && user && !user.isAnonymous) ? collection(firestore, 'orders') : null,
    [firestore, userData, user]
  );
  const { data: orders } = useCollection<Order>(ordersQuery);

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

  const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
  const { data: stores, isLoading: storesLoading } = useCollection<Store>(storesQuery);
  
  const teamMembersQuery = useMemoFirebase(() => collection(firestore, 'teamMembers'), [firestore]);
  const { data: teamMembers, isLoading: teamMembersLoading } = useCollection<TeamMember>(teamMembersQuery);

  const { founder, managementMembers } = useMemo(() => {
      if (!teamMembers) return { founder: null, managementMembers: [] };
      const founderMember = teamMembers.find(member => member.role === 'Founder');
      const management = teamMembers.filter(member => member.role === 'Management').slice(0, 3);
      return { founder: founderMember, managementMembers: management };
  }, [teamMembers]);


  const adminActionCounts = useMemo(() => {
      if (userData?.role !== 'admin' || !orders || !allProducts) {
          return { pendingOrders: 0, outOfStockProducts: 0 };
      }
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const outOfStockProducts = allProducts.filter(p => !p.inStock).length;
      return { pendingOrders, outOfStockProducts };
  }, [orders, allProducts, userData]);

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
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
        if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
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
  }, [allProducts, selectedCategories, selectedMaterials, availability, priceRange, sortBy, searchTerm]);
  
  const productsToShow = useMemo(() => filteredProducts.slice(0, 20), [filteredProducts]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header 
        userData={userData}
        cartItems={cartItems}
        updateCartItemQuantity={updateCartItemQuantity}
        stores={stores || []}
        adminActionCounts={adminActionCounts}
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
          <Link href="/purchase">
            <Button size="lg" variant="secondary">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>
      
      <div className="container mx-auto flex items-start px-0 sm:px-4">
        <aside className="w-72 bg-background p-6 border-r border-border h-screen sticky top-0 overflow-y-auto hidden lg:block">
          <Filters 
            selectedCategories={selectedCategories}
            handleCategoryChange={handleCategoryChange}
            selectedMaterials={selectedMaterials}
            handleMaterialChange={handleMaterialChange}
            availability={availability}
            setAvailability={setAvailability}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
          />
        </aside>

        <main className="flex-1 p-2 sm:p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-2 sm:px-0 pt-4 sm:pt-0">
            <div className="flex w-full sm:w-auto items-center gap-4">
               <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                   <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                   <div className="p-6 overflow-y-auto">
                      <Filters 
                        selectedCategories={selectedCategories}
                        handleCategoryChange={handleCategoryChange}
                        selectedMaterials={selectedMaterials}
                        handleMaterialChange={handleMaterialChange}
                        availability={availability}
                        setAvailability={setAvailability}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                      />
                   </div>
                </SheetContent>
              </Sheet>
              <div className="relative w-full sm:max-w-xs">
                <Input 
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4 sm:gap-8">
              <div className="flex items-center gap-3">
                <label className="text-foreground font-semibold text-sm sm:text-base">Sort By:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
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
              <span className="text-foreground font-semibold text-sm sm:text-base">{filteredProducts.length} Products</span>
            </div>
          </div>
            
          {productsLoading ? (
            <div className="flex justify-center items-center h-96">
                <PottersWheelSpinner />
            </div>
          ) : (
          <Dialog open={!!selectedProduct} onOpenChange={(isOpen) => !isOpen && setSelectedProduct(null)}>
            <div className={cn('grid grid-cols-2 gap-y-8')}>
              {productsToShow.map((product) => (
                <div key={product.id} className="group relative text-left p-2 sm:p-4">
                  <div 
                    className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={product['data-ai-hint']}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="text-white h-8 w-8" />
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:mt-4 flex flex-col items-start w-full">
                      <h3 className="text-sm sm:text-base text-foreground font-bold truncate w-full">{product.name}</h3>
                      <p className="font-bold text-sm sm:text-base text-foreground">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(product.price)}
                      </p>
                      <Button
                          variant="ghost"
                          className="w-full mt-2 text-white bg-black hover:bg-black/80 disabled:bg-muted disabled:text-muted-foreground p-2 rounded-md font-bold text-sm h-auto justify-center"
                          onClick={() => addToCart(product)}
                          disabled={!product.inStock}
                      >
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                  </div>
                </div>
              ))}
            </div>

            {allProducts && allProducts.length > 20 && (
                <div className="text-center mt-8">
                    <Link href="/purchase">
                        <Button variant="outline" size="lg">View All Products</Button>
                    </Link>
                </div>
            )}

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
      
      <section className="bg-muted py-16 mt-16 overflow-hidden">
        <div className="container mx-auto px-4">
            <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Our Store Locations</h2>
            </div>
             {storesLoading ? (
                <div className="flex justify-center items-center h-64">
                    <PottersWheelSpinner />
                </div>
            ) : stores && stores.length > 0 ? (
                <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:contents pb-4 -ml-4 pl-4">
                        {stores.map((store) => (
                             <div key={store.id} className="snap-start shrink-0 w-3/4 sm:w-2/3 md:w-auto">
                                <Card className="overflow-hidden h-full flex flex-col bg-background shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    {store.image && (
                                        <div className="relative h-48 w-full">
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
                                            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                            <p className="text-xs">{store.address}</p>
                                        </div>
                                        {store.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4 shrink-0 text-primary" />
                                                <p className="text-xs">{store.phone}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-3 pt-0 mt-auto">
                                        <Link href={store.googleMapsLink} target="_blank" rel="noopener noreferrer">
                                            <Button className="w-full h-9 text-sm">
                                                View on Google Maps <ExternalLink className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center h-64 flex flex-col items-center justify-center">
                    <p className="text-muted-foreground">No store locations have been added yet.</p>
                </div>
            )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Meet Our Team</h2>
            </div>
            {teamMembersLoading ? (
                <div className="flex justify-center items-center h-64">
                    <PottersWheelSpinner />
                </div>
            ) : (
                <>
                <div className="flex flex-col items-center">
                    {founder && (
                        <div className="flex flex-col items-center text-center group mb-12">
                            <div className="relative h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden mb-4 shadow-lg transition-transform duration-300 group-hover:scale-105 border-4 border-primary/20">
                                <Image src={founder.image} alt={founder.name} fill className="object-cover" data-ai-hint={founder['data-ai-hint']} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-foreground">{founder.name}</h3>
                            <p className="text-primary font-semibold text-lg">{founder.role}</p>
                        </div>
                    )}
                     {managementMembers.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 w-full max-w-4xl">
                            {managementMembers.map((member) => (
                                <div key={member.id} className="text-center flex flex-col items-center group">
                                    <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden mb-4 shadow-lg transition-transform duration-300 group-hover:scale-105 border-4 border-muted">
                                        <Image src={member.image} alt={member.name} fill className="object-cover" data-ai-hint={member['data-ai-hint']} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
                                    <p className="text-muted-foreground font-medium text-base">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="text-center mt-12">
                    <Link href="/our-team">
                        <Button variant="outline">View All Team Members</Button>
                    </Link>
                </div>
                </>
            )}
        </div>
      </section>

    </div>
  )
}
    

    

    
