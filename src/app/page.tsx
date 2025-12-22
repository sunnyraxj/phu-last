

"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { collection, doc, query, where, writeBatch, setDoc, deleteDoc } from "firebase/firestore";
import { Search, Eye, Filter, ShoppingBag as ShoppingBagIcon, MapPin, Phone, ExternalLink, Sparkles, Wand2, CheckCircle, User, Store as StoreIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn, isValidImageDomain } from "@/lib/utils"
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase, useUser, useFirebase } from "@/firebase";
import { PottersWheelSpinner } from "@/components/shared/PottersWheelSpinner";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Label } from "@/components/ui/label";
import Autoplay from "embla-carousel-autoplay"
import placeholderImages from '@/lib/placeholder-images.json';
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


type Product = {
  id: string;
  name: string;
  images: string[];
  "data-ai-hint": string;
  category: string;
  material: string;
  inStock: boolean;
  description: string;
  artisanId: string;
  baseMrp?: number;
  variants?: { size: string; price: number }[];
};

type Order = {
    status: 'pending' | 'shipped' | 'delivered' | 'pending-payment-approval';
};

type CartItem = Product & { quantity: number; cartItemId: string; selectedSize?: string };

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
    image: string;
    'data-ai-hint'?: string;
    socialLink?: string;
};

function Filters({ 
  categories, 
  materials,
  selectedCategories, 
  handleCategoryChange, 
  selectedMaterials, 
  handleMaterialChange, 
  availability, 
  setAvailability 
}: any) {
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Filter:</h2>
      </div>

      <Accordion type="multiple" defaultValue={["category", "material", "availability"]} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="font-semibold py-3 text-base">Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {categories.map((cat: {name: string, count: number}) => (
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
              {materials.map((mat: string) => (
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
      </Accordion>
    </>
  )
}

function ProductImage({ product, onClick }: { product: Product; onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const primaryImageUrl = product.images?.[0] || placeholderImages.product.url;
    const secondaryImageUrl = product.images?.[1] || primaryImageUrl;

    const primaryImage = isValidImageDomain(primaryImageUrl) ? primaryImageUrl : placeholderImages.product.url;
    const secondaryImage = isValidImageDomain(secondaryImageUrl) ? secondaryImageUrl : primaryImage;

    return (
        <div 
            className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden cursor-pointer group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <Image
                src={isHovered ? secondaryImage : primaryImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={product['data-ai-hint'] || placeholderImages.product['data-ai-hint']}
            />
        </div>
    );
}

const TypewriterHeadline = ({ headlines }: { headlines: string[] }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState('');
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseDuration = 2000;

  useEffect(() => {
    if (index >= headlines.length) {
        setIndex(0); // Loop back to the start
        return;
    }

    const currentHeadline = headlines[index];

    if (!isDeleting && subIndex < currentHeadline.length) {
      const timeout = setTimeout(() => {
        setText(currentHeadline.substring(0, subIndex + 1));
        setSubIndex(subIndex + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }

    if (!isDeleting && subIndex === currentHeadline.length) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && subIndex > 0) {
      const timeout = setTimeout(() => {
        setText(currentHeadline.substring(0, subIndex - 1));
        setSubIndex(subIndex - 1);
      }, deletingSpeed);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && subIndex === 0) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1));
    }
  }, [subIndex, isDeleting, index, headlines]);

  return (
    <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight h-24 md:h-36">
      {text}
      <span className="animate-pulse">|</span>
    </h1>
  );
};


export default function ProductPage() {
  const [sortBy, setSortBy] = useState("Featured")

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>("all"); // all, in-stock, out-of-stock
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantSelection, setVariantSelection] = useState<{product: Product | null, selectedSize: string | null}>({product: null, selectedSize: null});

  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();


  const productsQuery = useMemoFirebase(() =>
    query(collection(firestore, 'products')),
    [firestore]
  );
  const { data: allProducts, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: isUserDocLoading } = useDoc<{ role: string }>(userDocRef);

  const isAuthorizedAdmin = userData?.role === 'admin';

  const ordersQuery = useMemoFirebase(() =>
    (isAuthorizedAdmin && user && !user.isAnonymous) ? query(collection(firestore, 'orders'), where('status', 'in', ['pending', 'pending-payment-approval'])) : null,
    [firestore, isAuthorizedAdmin, user]
  );
  const { data: orders } = useCollection<Order>(ordersQuery);

  const cartItemsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'cart') : null,
    [firestore, user]
  );
  const { data: cartData, isLoading: cartLoading } = useCollection<{ productId: string; quantity: number, selectedSize?: string }>(cartItemsQuery);

  const cartItems = useMemo(() => {
    if (!cartData || !allProducts) return [];
    return cartData.map(cartItem => {
      const product = allProducts.find(p => p.id === cartItem.productId);
      return product ? { ...product, ...cartItem, cartItemId: cartItem.id } : null;
    }).filter((item): item is CartItem => item !== null);
  }, [cartData, allProducts]);

  const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
  const { data: stores, isLoading: storesLoading } = useCollection<Store>(storesQuery);

  const teamMembersQuery = useMemoFirebase(() => collection(firestore, 'teamMembers'), [firestore]);
  const { data: teamMembers, isLoading: teamMembersLoading } = useCollection<TeamMember>(teamMembersQuery);

  const outOfStockQuery = useMemoFirebase(() => 
    (isAuthorizedAdmin) ? query(collection(firestore, 'products'), where('inStock', '==', false)) : null,
    [firestore, isAuthorizedAdmin]
  );
  const { data: outOfStockProducts } = useCollection<Product>(outOfStockQuery);

  const returnsQuery = useMemoFirebase(() => 
      (isAuthorizedAdmin) ? query(collection(firestore, 'returnRequests'), where('status', '==', 'pending-review')) : null,
      [firestore, isAuthorizedAdmin]
  );
  const { data: returnRequests } = useCollection<any>(returnsQuery);

  const { founder, allOtherMembers } = useMemo(() => {
    if (!teamMembers) return { founder: null, allOtherMembers: [] };
    const founderMember = teamMembers.find(member => member.role === 'Founder');
    const otherMembers = teamMembers.filter(member => member.role === 'Management' || member.role === 'Team Member');
    return { founder: founderMember, allOtherMembers: otherMembers };
}, [teamMembers]);


  const adminActionCounts = useMemo(() => {
    if (userData?.role !== 'admin') {
      return { pendingOrders: 0, outOfStockProducts: 0, pendingReturns: 0 };
    }
    return { 
        pendingOrders: orders?.length || 0,
        outOfStockProducts: outOfStockProducts?.length || 0,
        pendingReturns: returnRequests?.length || 0
    };
  }, [orders, outOfStockProducts, returnRequests, userData]);

  const { categories, materials } = useMemo(() => {
    if (!allProducts) return { categories: [], materials: [] };
    const categoryCounts: { [key: string]: number } = {};
    const materialSet = new Set<string>();

    allProducts.forEach(product => {
      if (product.category) {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      }
      if (product.material) {
        materialSet.add(product.material);
      }
    });

    return {
      categories: Object.entries(categoryCounts).map(([name, count]) => ({ name, count })),
      materials: Array.from(materialSet),
    };
  }, [allProducts]);

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
      setDoc(itemRef, { quantity: newQuantity }, { merge: true });
    } else {
      deleteDoc(itemRef);
    }
  };

  const handleAddToCart = (product: Product, selectedSize: string | null) => {
    if (!user) {
        router.push('/login');
        return;
    }

    const existingItem = cartItems.find(item => item.id === product.id && item.selectedSize === selectedSize);

    if (existingItem) {
        updateCartItemQuantity(existingItem.cartItemId, existingItem.quantity + 1);
    } else {
        const cartCollection = collection(firestore, 'users', user.uid, 'cart');
        const newCartItemRef = doc(cartCollection);
        setDoc(newCartItemRef, {
            productId: product.id,
            quantity: 1,
            selectedSize: selectedSize
        });
    }

    toast({
        title: "Item Added",
        description: `${product.name}${selectedSize ? ` (${selectedSize})` : ''} has been added to your cart.`,
    });
    setVariantSelection({ product: null, selectedSize: null });
  };
  
  const openVariantSelector = (product: Product) => {
      if (product.variants && product.variants.length > 0) {
          setVariantSelection({ product, selectedSize: product.variants[0].size });
      } else {
          handleAddToCart(product, null);
      }
  };


  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    const getDisplayPrice = (product: Product): number => {
      if (product.variants && product.variants.length > 0) {
        return product.variants[0].price;
      }
      return product.baseMrp || 0;
    };

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
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low-high':
            return getDisplayPrice(a) - getDisplayPrice(b);
          case 'price-high-low':
            return getDisplayPrice(b) - getDisplayPrice(a);
          case 'newest':
            // Assuming higher firestore doc id is not newer. We need a timestamp
            return 0;
          case 'Featured':
          default:
            return 0;
        }
      });
  }, [allProducts, selectedCategories, selectedMaterials, availability, sortBy, searchTerm]);

  const productsToShow = useMemo(() => filteredProducts.slice(0, 20), [filteredProducts]);
  
  const heroHeadlines = [
    "Handcrafted Treasures from the North-East",
    "Authentic Bamboo & Jute Crafts",
    "Support Local Artisans",
    "Unique Decor for Your Home"
  ];

  const teamMembersToDisplay = useMemo(() => {
    if (!allOtherMembers) return [];
    // No duplication, just show the members
    return allOtherMembers;
  }, [allOtherMembers]);

  const getProductPrice = (product: Product | null, size: string | null = null): number => {
    if (!product) return 0;
    
    if (product.variants && product.variants.length > 0) {
        const targetSize = size || product.variants[0].size;
        const selectedVariant = product.variants.find(v => v.size === targetSize);
        return selectedVariant?.price || product.variants[0].price;
    }
    return product.baseMrp || 0;
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header
        userData={userData}
        cartItems={cartItems}
        updateCartItemQuantity={updateCartItemQuantity}
        stores={stores || []}
        products={allProducts || []}
        adminActionCounts={adminActionCounts}
      />

      <section className="relative h-[60vh] w-full flex items-center justify-center text-white">
        <Image
          src={placeholderImages.hero.url}
          alt="Authentic handicrafts from North-East India"
          fill
          className="object-cover hidden md:block"
          data-ai-hint={placeholderImages.hero['data-ai-hint']}
          priority
        />
        <Image
          src={placeholderImages.heroMobile.url}
          alt="Authentic handicrafts from North-East India"
          fill
          className="object-cover md:hidden"
          data-ai-hint={placeholderImages.heroMobile['data-ai-hint']}
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <TypewriterHeadline headlines={heroHeadlines} />
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Discover handcrafted treasures that tell a story. Explore unique bamboo, jute, and cane items.
          </p>
          <Link href="/purchase">
            <Button size="lg" variant="secondary">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>
      
      <div className="flex items-start">
        <div className="container mx-auto px-0 sm:px-4">
          <div className="flex items-start">
            <aside className="w-72 bg-background p-6 border-r border-border h-screen sticky top-0 overflow-y-auto hidden lg:block">
              <Filters
                categories={categories}
                materials={materials}
                selectedCategories={selectedCategories}
                handleCategoryChange={handleCategoryChange}
                selectedMaterials={selectedMaterials}
                handleMaterialChange={handleMaterialChange}
                availability={availability}
                setAvailability={setAvailability}
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
                          categories={categories}
                          materials={materials}
                          selectedCategories={selectedCategories}
                          handleCategoryChange={handleCategoryChange}
                          selectedMaterials={selectedMaterials}
                          handleMaterialChange={handleMaterialChange}
                          availability={availability}
                          setAvailability={setAvailability}
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

              {productsLoading || isUserLoading ? (
                <div className="flex justify-center items-center h-96">
                  <PottersWheelSpinner />
                </div>
              ) : (
                <>
                    <div className={cn('grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-8')}>
                        {productsToShow.map((product) => (
                            <div key={product.id} className="group relative text-left p-2 sm:p-4">
                            <ProductImage product={product} onClick={() => setSelectedProduct(product)} />

                            <div className="mt-2 sm:mt-4 flex flex-col items-start">
                                <h3 className="text-sm sm:text-base text-foreground font-bold truncate w-full">{product.name}</h3>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm sm:text-base text-foreground">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(getProductPrice(product))}
                                    </p>
                                    {product.variants && product.variants.length > 0 && <Badge variant="secondary">Multiple Sizes</Badge>}
                                </div>
                                <Button
                                variant="ghost"
                                className="w-full sm:w-auto mt-2 text-white bg-black hover:bg-black/80 disabled:bg-muted disabled:text-muted-foreground p-2 rounded-md font-bold text-sm h-auto justify-center"
                                onClick={() => openVariantSelector(product)}
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
                </>
              )}
            </main>
          </div>
        </div>
      </div>
      
      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(isOpen) => !isOpen && setSelectedProduct(null)}>
        {selectedProduct && (
            <DialogContent className="sm:max-w-[800px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2">
                <Carousel className="w-full">
                    <CarouselContent>
                    {(selectedProduct.images.length > 0 ? selectedProduct.images : [placeholderImages.product.url]).map((image, index) => (
                        <CarouselItem key={index}>
                        <div className="relative aspect-square bg-muted rounded-lg">
                            <Image
                            src={isValidImageDomain(image) ? image : placeholderImages.product.url}
                            alt={`${selectedProduct.name} - image ${index + 1}`}
                            fill
                            className="object-cover rounded-lg"
                            />
                        </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                </Carousel>
                <div className="flex flex-col justify-center">
                    <DialogHeader>
                    <DialogTitle className="text-3xl font-bold">{selectedProduct.name}</DialogTitle>
                    <DialogDescription className="text-base pt-4">
                        {selectedProduct.description}
                    </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                    <p className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(getProductPrice(selectedProduct))}
                    </p>
                    <p className={cn("mt-2 text-sm font-semibold", selectedProduct.inStock ? "text-green-600" : "text-red-600")}>
                        {selectedProduct.inStock ? "In Stock" : "Out of Stock"}
                    </p>
                    </div>
                    <DialogFooter className="mt-6">
                    <Button size="lg" className="w-full" onClick={() => { setSelectedProduct(null); openVariantSelector(selectedProduct); }} disabled={!selectedProduct.inStock}>
                        <ShoppingBag className="mr-2" />
                        Add to Cart
                    </Button>
                    </DialogFooter>
                </div>
                </div>
            </DialogContent>
        )}
      </Dialog>
      
      {/* Variant Selection Dialog */}
      <Dialog open={!!variantSelection.product} onOpenChange={(isOpen) => !isOpen && setVariantSelection({product: null, selectedSize: null})}>
          {variantSelection.product && (
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle>Select Size for {variantSelection.product.name}</DialogTitle>
                      <DialogDescription>Choose an available size and add to cart.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                      <RadioGroup 
                          value={variantSelection.selectedSize || ''} 
                          onValueChange={(size) => setVariantSelection(prev => ({...prev, selectedSize: size}))}
                          className="space-y-2"
                      >
                          {variantSelection.product.variants?.map(variant => (
                              <Label key={variant.size} htmlFor={variant.size} className="flex items-center justify-between gap-4 border rounded-md p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-muted has-[:checked]:border-primary">
                                  <div className="flex items-center gap-4">
                                      <RadioGroupItem value={variant.size} id={variant.size} />
                                      <span>{variant.size}</span>
                                  </div>
                                  <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(variant.price)}</span>
                              </Label>
                          ))}
                      </RadioGroup>
                  </div>
                  <DialogFooter>
                       <Button type="button" variant="outline" onClick={() => setVariantSelection({product: null, selectedSize: null})}>Cancel</Button>
                      <Button onClick={() => handleAddToCart(variantSelection.product!, variantSelection.selectedSize)} disabled={!variantSelection.selectedSize}>
                          Add to Cart
                      </Button>
                  </DialogFooter>
              </DialogContent>
          )}
      </Dialog>

      <section className="bg-background py-8">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Our Store Locations</h2>
              </div>
              {storesLoading ? (
                  <div className="flex justify-center items-center h-64">
                      <PottersWheelSpinner />
                  </div>
              ) : stores && stores.length > 0 ? (
                   <Carousel
                      opts={{
                          align: "start",
                          loop: true,
                      }}
                      plugins={[
                          Autoplay({
                            delay: 3000,
                            stopOnInteraction: true,
                          })
                      ]}
                      className="w-full"
                  >
                      <CarouselContent className="-ml-2 md:-ml-4">
                          {stores.map((store) => (
                              <CarouselItem key={store.id} className="pl-2 md:pl-4 basis-[80%] sm:basis-1/2 md:basis-1/3">
                                  <div className="p-1">
                                    <Card className="overflow-hidden flex flex-col bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                                        {store.image && isValidImageDomain(store.image) ? (
                                            <div className="relative h-40 sm:h-48 w-full">
                                                <Image
                                                    src={store.image}
                                                    alt={store.name}
                                                    fill
                                                    className="object-cover"
                                                    data-ai-hint={store['data-ai-hint']}
                                                />
                                            </div>
                                        ) : (
                                            <div className="relative h-40 sm:h-48 w-full bg-muted flex items-center justify-center">
                                                <StoreIcon className="h-10 w-10 text-muted-foreground" />
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
              <div className="text-center mt-12">
                  <Link href="/our-stores">
                      <Button variant="outline">View All Locations</Button>
                  </Link>
              </div>
          </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          {teamMembersLoading ? (
            <div className="flex justify-center items-center h-64">
              <PottersWheelSpinner />
            </div>
          ) : (
            <>
                {founder && (
                  <div className="mb-12 md:mb-16">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-12 text-center sm:text-left">
                       <div className="relative h-32 w-32 md:h-48 md:w-48 rounded-lg overflow-hidden shadow-lg group">
                          <Image src={isValidImageDomain(founder.image) ? founder.image : placeholderImages.person.url} alt={founder.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={founder['data-ai-hint']} />
                       </div>
                      <div className="flex-1 max-w-lg">
                        <h3 className="text-2xl font-bold">{founder.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{founder.role}</p>
                      </div>
                    </div>
                  </div>
                )}
                {allOtherMembers && allOtherMembers.length > 0 && (
                   <div className="w-full overflow-hidden">
                     <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Our Team</h2>
                    </div>
                     <Carousel
                        opts={{
                          align: "start",
                          loop: teamMembersToDisplay.length > 5, 
                        }}
                        plugins={[
                            Autoplay({
                                delay: 2000,
                                stopOnInteraction: true,
                            })
                        ]}
                     >
                        <CarouselContent className="-ml-2 md:-ml-4">
                        {teamMembersToDisplay.map((member, index) => (
                          <CarouselItem key={`${member.id}-${index}`} className="pl-4 md:pl-6 basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                              <Card className="w-full max-w-sm overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-2xl">
                                  {member.image && isValidImageDomain(member.image) ? (
                                    <Image
                                        src={member.image}
                                        alt={member.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        data-ai-hint={member['data-ai-hint']}
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                                        <User className="h-12 w-12" />
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 text-left bg-white">
                                  <h3 className="text-lg font-bold text-slate-900 truncate h-7">{member.name}</h3>
                                  <p className="text-sm text-muted-foreground mt-1 mb-3">{member.role}</p>
                                    <Button size="sm" className="w-full rounded-full" disabled={!member.socialLink} asChild>
                                        {member.socialLink ? (
                                            <Link href={member.socialLink} target="_blank" rel="noopener noreferrer">Follow +</Link>
                                        ) : (
                                            <span>Follow +</span>
                                        )}
                                    </Button>
                                </div>
                              </Card>
                          </CarouselItem>
                         ))}
                         </CarouselContent>
                     </Carousel>
                   </div>
                )}

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
    
    
