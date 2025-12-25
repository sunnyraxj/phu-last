
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { collection, doc, query, where, writeBatch, setDoc, deleteDoc } from "firebase/firestore";
import { Search, Eye, Filter, ShoppingBag as ShoppingBagIcon, ChevronRight } from "lucide-react"
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
import { Label } from "@/components/ui/label";
import placeholderImages from '@/lib/placeholder-images.json';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"
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
    image?: string;
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

function Breadcrumbs({ categories, onClear }: { categories: string[], onClear: (category: string) => void }) {
    if (categories.length === 0) {
        return (
            <div className="flex items-center text-sm text-muted-foreground">
                <span>All</span>
            </div>
        );
    }

    return (
        <div className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
            <button onClick={() => onClear('all')} className="hover:text-foreground">All</button>
            {categories.map((cat, index) => (
                 <span key={index} className="flex items-center gap-1">
                    <ChevronRight size={14} />
                    <button onClick={() => onClear(cat)} className="hover:text-foreground">{cat}</button>
                </span>
            ))}
        </div>
    );
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


export default function PurchasePage() {
  const [sortBy, setSortBy] = useState("Featured")
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>("all"); // all, in-stock, out-of-stock
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogSelectedSize, setDialogSelectedSize] = useState<string | null>(null);

  const { firestore, addDocumentNonBlocking, updateCartItemSize } = useFirebase();
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
  
 const ordersQuery = useMemoFirebase(() => 
    (userData?.role === 'admin' && user && !user.isAnonymous) ? query(collection(firestore, 'orders'), where('status', 'in', ['pending', 'pending-payment-approval'])) : null,
    [firestore, userData, user]
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
      return product ? { ...product, quantity: cartItem.quantity, cartItemId: cartItem.id, selectedSize: cartItem.selectedSize } : null;
    }).filter((item): item is CartItem => item !== null);
  }, [cartData, allProducts]);

  const storesQuery = useMemoFirebase(() => collection(firestore, 'stores'), [firestore]);
  const { data: stores } = useCollection<Store>(storesQuery);
  
  const outOfStockQuery = useMemoFirebase(() => 
    (userData?.role === 'admin') ? query(collection(firestore, 'products'), where('inStock', '==', false)) : null,
    [firestore, userData]
  );
  const { data: outOfStockProducts } = useCollection<Product>(outOfStockQuery);

  const returnsQuery = useMemoFirebase(() => 
      (userData?.role === 'admin') ? query(collection(firestore, 'returnRequests'), where('status', '==', 'pending-review')) : null,
      [firestore, userData]
  );
  const { data: returnRequests } = useCollection<any>(returnsQuery);

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

  const handleBreadcrumbClear = (category: string) => {
      if (category === 'all') {
          setSelectedCategories([]);
      } else {
          setSelectedCategories(prev => prev.filter(c => c !== category));
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
        await addDocumentNonBlocking(cartCollection, {
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

  const handleCheckout = () => {
    if (user?.isAnonymous) {
        router.push('/login?redirect=/checkout');
    } else {
        router.push('/checkout');
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

  const getProductPrice = (product: Product | null, size: string | null = null): number => {
    if (!product) return 0;
    
    if (product.variants && product.variants.length > 0) {
        const targetSize = size || (product.variants[0]?.size);
        const selectedVariant = product.variants.find(v => v.size === targetSize);
        return selectedVariant?.price || product.variants[0]?.price || 0;
    }
    return product.baseMrp || 0;
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header 
        userData={userData}
        cartItems={cartItems}
        updateCartItemQuantity={updateCartItemQuantity}
        updateCartItemSize={updateCartItemSize}
        stores={stores || []}
        products={allProducts || []}
        adminActionCounts={adminActionCounts}
      />
      
      <div className="container mx-auto flex items-start px-0 sm:px-4 mt-8">
        <aside className="w-72 bg-background p-6 border-r border-border h-screen sticky top-[88px] overflow-y-auto hidden lg:block">
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
           {cartItems.length > 0 && (
                <div className="mt-8">
                    <Button onClick={handleCheckout} className="w-full" size="lg">Checkout</Button>
                </div>
            )}
        </aside>

        <main className="flex-1 p-2 sm:p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 px-2 sm:px-0 pt-4 sm:pt-0">
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
                       {cartItems.length > 0 && (
                            <div className="mt-8">
                                <SheetClose asChild>
                                    <Button onClick={handleCheckout} className="w-full" size="lg">Checkout</Button>
                                </SheetClose>
                            </div>
                        )}
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
          <div className="px-2 sm:px-0 mb-8">
            <Breadcrumbs categories={selectedCategories} onClear={handleBreadcrumbClear} />
          </div>
            
          {productsLoading || isUserLoading ? (
            <div className="flex justify-center items-center h-96">
                <PottersWheelSpinner />
            </div>
          ) : (
          <>
            <div className={cn('grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-2 sm:gap-y-8')}>
              {filteredProducts.map((product) => (
                <div key={product.id} className="group relative text-left p-2 sm:p-4">
                    <ProductImage product={product} onClick={() => setSelectedProduct(product)} />
                  
                  <div className="mt-2 sm:mt-4 flex flex-col items-start">
                    <h3 className="text-sm sm:text-base font-bold text-black truncate w-full">{product.name}</h3>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-sm sm:text-base text-black">
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
                                                <Label key={variant.size} htmlFor={`dialog-purchase-${variant.size}`} className="flex items-center justify-center gap-2 border rounded-md p-2 px-3 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                                                    <RadioGroupItem value={variant.size} id={`dialog-purchase-${variant.size}`} className="sr-only" />
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
          </>
          )}
        </main>
      </div>
    </div>
  )
}
