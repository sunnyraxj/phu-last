

"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { collection, doc, query, where, writeBatch, setDoc, deleteDoc, orderBy, limit } from "firebase/firestore";
import { Search, Eye, Filter, ShoppingBag as ShoppingBagIcon, MapPin, Phone, ExternalLink, Sparkles, Wand2, CheckCircle, User, Store as StoreIcon, Brush } from "lucide-react"
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
  createdAt: { seconds: number; nanoseconds: number };
};

type Order = {
    status: 'pending' | 'shipped' | 'delivered' | 'pending-payment-approval';
};

type CartItem = Product & { quantity: number; cartItemId: string; selectedSize?: string };

type TeamMember = {
    id: string;
    name: string;
    role: 'Founder' | 'Management' | 'Team Member';
    image: string;
    'data-ai-hint'?: string;
    socialLink?: string;
};

type Store = {
    id: string;
    name: string;
    address: string;
    phone?: string;
    image?: string;
    googleMapsLink: string;
    'data-ai-hint'?: string;
};

type MaterialSetting = {
    id: string;
    name: string;
    imageUrl: string;
};

type SiteSettings = {
    heroImageUrl?: string;
    heroImageUrlMobile?: string;
};

const BrandCarousel = () => {
    const logos = [
        "https://picsum.photos/seed/brand1/150/60",
        "https://picsum.photos/seed/brand2/150/60",
        "https://picsum.photos/seed/brand3/150/60",
        "https://picsum.photos/seed/brand4/150/60",
        "https://picsum.photos/seed/brand5/150/60",
        "https://picsum.photos/seed/brand6/150/60",
        "https://picsum.photos/seed/brand7/150/60",
        "https://picsum.photos/seed/brand8/150/60",
    ];
    return (
        <section className="bg-background py-6 sm:py-8 overflow-hidden">
            <div className="container mx-auto px-4 text-center mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">We deal in</h2>
            </div>
            <div className="relative">
                <div className="flex animate-marquee-right-to-left">
                    {[...logos, ...logos].map((logo, index) => (
                        <div key={`rtl-${index}`} className="flex-shrink-0 w-28 mx-4">
                            <Image src={logo} alt={`Brand Logo ${index + 1}`} width={120} height={50} className="object-contain filter grayscale opacity-60" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="relative mt-4">
                <div className="flex animate-marquee-left-to-right">
                     {[...logos.slice().reverse(), ...logos.slice().reverse()].map((logo, index) => (
                        <div key={`ltr-${index}`} className="flex-shrink-0 w-28 mx-4">
                            <Image src={logo} alt={`Brand Logo ${index + 1}`} width={120} height={50} className="object-contain filter grayscale opacity-60" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
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
            {product.variants && product.variants.length > 0 && (
              <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 md:hidden">
                {product.variants.slice(0, 3).map(variant => (
                  <Badge key={variant.size} variant="secondary" className="text-[10px] px-1 py-0">{variant.size}</Badge>
                ))}
              </div>
            )}
        </div>
    );
}

export default function ProductPage() {
  const [sortBy, setSortBy] = useState("Featured")

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>("all"); // all, in-stock, out-of-stock
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogSelectedSize, setDialogSelectedSize] = useState<string | null>(null);

  const { firestore, updateCartItemSize } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();


  const productsQuery = useMemoFirebase(() =>
    query(collection(firestore, 'products')),
    [firestore]
  );
  const { data: allProducts, isLoading: productsLoading } = useCollection<Product>(productsQuery);
  
  const newArrivalsQuery = useMemoFirebase(() =>
    query(collection(firestore, 'products'), orderBy('createdAt', 'desc'), limit(4)),
    [firestore]
  );
  const { data: newArrivals, isLoading: newArrivalsLoading } = useCollection<Product>(newArrivalsQuery);

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
  
  const materialSettingsQuery = useMemoFirebase(() => collection(firestore, 'materialSettings'), [firestore]);
  const { data: materialSettings, isLoading: materialSettingsLoading } = useCollection<MaterialSetting>(materialSettingsQuery);
  
  const siteSettingsRef = useMemoFirebase(() => doc(firestore, 'siteSettings', 'homepage'), [firestore]);
  const { data: siteSettings, isLoading: siteSettingsLoading } = useDoc<SiteSettings>(siteSettingsRef);

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
    const otherMembers = teamMembers.filter(member => member.role === 'Management' || 'Team Member');
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
    if (selectedMaterials.includes(materialName)) {
      setSelectedMaterials([]);
    } else {
      setSelectedMaterials([materialName]);
    }
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

  const handleAddToCart = async (product: Product, selectedSize: string | null) => {
    if (!user) {
        router.push('/login');
        return;
    }
    
    if(product.variants && product.variants.length > 0 && !selectedSize) {
        toast({
            variant: "destructive",
            title: "Please select a size.",
        });
        return;
    }

    const existingItem = cartItems.find(item => item.id === product.id && item.selectedSize === selectedSize);

    if (existingItem) {
        updateCartItemQuantity(existingItem.cartItemId, existingItem.quantity + 1);
    } else {
        const cartCollection = collection(firestore, 'users', user.uid, 'cart');
        const newCartItemRef = doc(cartCollection);
        await setDoc(newCartItemRef, {
            productId: product.id,
            quantity: 1,
            selectedSize: selectedSize
        });
    }

    toast({
        title: "Item Added",
        description: `${product.name}${selectedSize ? ` (${selectedSize})` : ''} has been added to your cart.`,
    });
    setSelectedProduct(null);
  };
  
  const handleCartAction = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
    } else {
      handleAddToCart(product, null);
    }
  };

  useEffect(() => {
    if (selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0) {
        setDialogSelectedSize(selectedProduct.variants[0].size);
    } else {
        setDialogSelectedSize(null);
    }
  }, [selectedProduct]);


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
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
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
    return allOtherMembers;
  }, [allOtherMembers]);

  const getProductPrice = (product: Product | null, size: string | null = null): number => {
    if (!product) return 0;
    
    if (product.variants && product.variants.length > 0) {
        const targetSize = size || (product.variants[0]?.size);
        const selectedVariant = product.variants.find(v => v.size === targetSize);
        return selectedVariant?.price || product.variants[0]?.price || 0;
    }
    return product.baseMrp || 0;
  };

  const materialsToShow = useMemo(() => {
    if (!materialSettings || !allProducts) return [];
    const usedMaterials = new Set(allProducts.map(p => p.material));
    return materialSettings.filter(ms => usedMaterials.has(ms.name));
  }, [materialSettings, allProducts]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="md:hidden text-center py-2 bg-[--brand-green] text-white text-xs">Free shipping on orders over ₹1000</div>
      <Header
        userData={userData}
        cartItems={cartItems}
        updateCartItemQuantity={updateCartItemQuantity}
        updateCartItemSize={updateCartItemSize}
        products={allProducts || []}
      />
      
      <main>
        {/* Desktop Hero */}
        <section className="relative aspect-[21/9] w-full hidden md:flex items-end justify-start text-white">
            <Image
                src={siteSettings?.heroImageUrl || placeholderImages.hero.url}
                alt="Authentic handicrafts from North-East India"
                fill
                className="object-cover"
                data-ai-hint={placeholderImages.hero['data-ai-hint']}
                priority
            />
            <div className="relative z-10 p-12">
                <Link href="/purchase">
                    <Button size="lg" className="bg-[--brand-green] text-white hover:bg-[--brand-green]/90">
                        Shop our collection
                    </Button>
                </Link>
            </div>
        </section>

        {/* Mobile Hero */}
        <section className="md:hidden relative">
          <div className="p-4 bg-background text-center">
            <h1 className="text-2xl font-serif tracking-tight text-foreground">Handcrafted Treasures, Timeless Stories</h1>
          </div>
          <div className="relative aspect-[16/9] w-full">
            <Image
                src={siteSettings?.heroImageUrlMobile || siteSettings?.heroImageUrl || placeholderImages.heroMobile.url}
                alt="Authentic handicrafts from North-East India"
                fill
                className="object-cover"
                data-ai-hint={placeholderImages.heroMobile['data-ai-hint']}
                priority
            />
          </div>
        </section>
      </main>
      
      <BrandCarousel />

      <section className="bg-background py-8 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">New Arrivals</h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Shop our customer favorite furniture & decor to create a cozy and inviting space. Find the best selling items you've been looking for!
            </p>
          </div>
          {newArrivalsLoading ? (
            <div className="flex justify-center items-center h-64">
              <PottersWheelSpinner />
            </div>
          ) : newArrivals && newArrivals.length > 0 ? (
            <>
                <div className="grid grid-cols-2 gap-4 sm:hidden">
                    {newArrivals.slice(0, 4).map(product => (
                        <div key={product.id}>
                           <ProductImage product={product} onClick={() => setSelectedProduct(product)} />
                        </div>
                    ))}
                </div>

              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {newArrivals.map((product) => (
                  <div key={product.id} className="group relative text-left">
                    <ProductImage product={product} onClick={() => setSelectedProduct(product)} />
                    <div className="mt-4 flex flex-col items-start">
                      <h3 className="text-base text-foreground font-bold truncate w-full">{product.name}</h3>
                      <div className="flex items-center gap-2">
                          <p className="font-bold text-base text-foreground">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(getProductPrice(product))}
                          </p>
                          {product.variants && product.variants.length > 0 && <Badge variant="secondary">Multiple Sizes</Badge>}
                      </div>
                      <Button
                      variant="ghost"
                      className="w-full mt-2 text-background bg-foreground hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
                      onClick={() => handleCartAction(product)}
                      disabled={!product.inStock}
                      >
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center h-64 flex flex-col items-center justify-center">
              <p className="text-muted-foreground">No new arrivals to show right now.</p>
            </div>
          )}
        </div>
      </section>
      
      <section className="bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">our products made with</h2>
          </div>
          {materialSettingsLoading ? (
            <div className="flex justify-center items-center h-40">
                <PottersWheelSpinner />
            </div>
          ) : (
            <Carousel
                opts={{
                    align: "start",
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    {materialsToShow.map(material => (
                        <CarouselItem key={material.name} className="pl-4 basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-[15%]">
                            <div className="text-center group cursor-pointer" onClick={() => handleMaterialChange(material.name)}>
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-4 shadow-md transition-transform duration-300 group-hover:scale-105">
                                <Image
                                    src={material.imageUrl || placeholderImages.product.url}
                                    alt={material.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className={cn("absolute inset-0 border-4 border-transparent transition-all", selectedMaterials.includes(material.name) && "border-primary")}></div>
                                </div>
                                <p className="font-semibold text-foreground">{material.name}</p>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
          )}
        </div>
      </section>

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
                                    <div className="hidden md:block">
                                        {product.variants && product.variants.length > 0 && <Badge variant="secondary">Multiple Sizes</Badge>}
                                    </div>
                                </div>
                                <Button
                                variant="ghost"
                                className="w-full sm:w-auto mt-2 text-background bg-foreground hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground p-2 rounded-md font-bold text-sm h-auto justify-center"
                                onClick={() => handleCartAction(product)}
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
                <div className="flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold">{selectedProduct.name}</DialogTitle>
                        <DialogDescription className="text-base pt-4">
                            {selectedProduct.description}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4 flex-1">
                        <p className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(getProductPrice(selectedProduct, dialogSelectedSize))}
                        </p>
                        <p className={cn("mt-2 text-sm font-semibold", selectedProduct.inStock ? "text-green-600" : "text-red-600")}>
                            {selectedProduct.inStock ? "In Stock" : "Out of Stock"}
                        </p>
                        
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                            <div className="mt-4">
                                <Label className="font-semibold">Size</Label>
                                <RadioGroup 
                                    value={dialogSelectedSize || ''} 
                                    onValueChange={setDialogSelectedSize}
                                    className="flex flex-wrap gap-2 mt-2"
                                >
                                    {selectedProduct.variants.map(variant => (
                                        <Label key={variant.size} htmlFor={`dialog-${variant.size}`} className="flex items-center justify-center gap-2 border rounded-md p-2 px-3 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                                            <RadioGroupItem value={variant.size} id={`dialog-${variant.size}`} className="sr-only" />
                                            <span className="text-sm font-medium">{variant.size}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter className="mt-6">
                        <Button size="lg" className="w-full" onClick={() => handleAddToCart(selectedProduct, dialogSelectedSize)} disabled={!selectedProduct.inStock}>
                            <ShoppingBag className="mr-2" />
                            Add to Cart
                        </Button>
                    </DialogFooter>
                </div>
                </div>
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
                          <Image src={founder.image} alt={founder.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={founder['data-ai-hint']} />
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
                                    <Image
                                        src={member.image}
                                        alt={member.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        data-ai-hint={member['data-ai-hint']}
                                    />
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
