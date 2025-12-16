

'use client';

import Link from "next/link";
import { ChevronDown, ShoppingBag, User, LogOut, Settings, Store, Package, Users, ShoppingCart, Menu, X as CloseIcon, UserCog, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Plus, Minus, X, Sprout, Palette, Wind } from "lucide-react";
import { Badge } from "../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";


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

interface HeaderProps {
    userData: { role: string } | null | undefined;
    cartItems: CartItem[];
    updateCartItemQuantity: (cartItemId: string, newQuantity: number) => void;
    stores?: Store[];
    products?: Product[];
    adminActionCounts?: {
        pendingOrders: number;
        outOfStockProducts: number;
        pendingReturns: number;
    };
}

export function Header({ userData, cartItems, updateCartItemQuantity, stores = [], products = [], adminActionCounts = { pendingOrders: 0, outOfStockProducts: 0, pendingReturns: 0 } }: HeaderProps) {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    
    const [purchaseMenuOpen, setPurchaseMenuOpen] = useState(false);
    const [storesMenuOpen, setStoresMenuOpen] = useState(false);
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        const selectRandomProducts = () => {
            if (products.length > 0) {
                const shuffled = [...products].sort(() => 0.5 - Math.random());
                setFeaturedProducts(shuffled.slice(0, 3));
            }
        };

        selectRandomProducts(); // Initial selection
        const intervalId = setInterval(selectRandomProducts, 5 * 60 * 1000); // Refresh every 5 minutes

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [products]);


    const handleSignOut = async () => {
        await signOut(auth);
    };

    const handleCheckout = () => {
        if (user?.isAnonymous) {
            router.push('/login?redirect=/checkout');
        } else {
            router.push('/checkout');
        }
    };

    const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
    const cartSubtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);

    const totalAdminActionCount = useMemo(() => {
        return (adminActionCounts?.pendingOrders || 0) + (adminActionCounts?.outOfStockProducts || 0) + (adminActionCounts?.pendingReturns || 0);
    }, [adminActionCounts]);

    return (
        <header className="bg-black text-white sticky top-0 z-40">
            <div className="container mx-auto flex items-center justify-between px-4 sm:px-8 py-4">
                <Link href="/" className="flex items-center gap-3">
                    <span className="text-lg font-semibold whitespace-nowrap">Purbanchal Hasta Udyog</span>
                </Link>

                <nav className="hidden lg:flex items-center gap-6 text-base font-semibold">
                     <Popover open={purchaseMenuOpen} onOpenChange={setPurchaseMenuOpen}>
                        <PopoverTrigger asChild onMouseEnter={() => setPurchaseMenuOpen(true)} onMouseLeave={() => setPurchaseMenuOpen(false)}>
                            <button className="flex items-center gap-1 hover:opacity-80">
                                PURCHASE <ChevronDown size={16} />
                            </button>
                        </PopoverTrigger>
                         <PopoverContent 
                            className="w-96"
                            onMouseEnter={() => setPurchaseMenuOpen(true)} onMouseLeave={() => setPurchaseMenuOpen(false)}
                        >
                            <div className="grid gap-4">
                                <p className="font-semibold">Featured Products</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {featuredProducts.map((product) => (
                                        <Link href="/purchase" key={product.id} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="relative h-20 w-20 rounded-md overflow-hidden">
                                                <Image src={product.image} alt={product.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs truncate w-20 text-center">{product.name}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Link href="/purchase">
                                    <Button variant="link" className="p-0 h-auto text-primary w-full justify-center">View More</Button>
                                </Link>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Popover open={storesMenuOpen} onOpenChange={setStoresMenuOpen}>
                        <PopoverTrigger asChild onMouseEnter={() => setStoresMenuOpen(true)} onMouseLeave={() => setStoresMenuOpen(false)}>
                            <button className="flex items-center gap-1 hover:opacity-80">
                                OUR STORES <ChevronDown size={16} />
                            </button>
                        </PopoverTrigger>
                         <PopoverContent 
                            className="w-80"
                             onMouseEnter={() => setStoresMenuOpen(true)} onMouseLeave={() => setStoresMenuOpen(false)}
                        >
                            <div className="grid gap-4">
                                <p className="font-semibold">Store Locations</p>
                                <div className="grid gap-2">
                                    {stores.slice(0, 3).map((store) => (
                                        <Link href="/our-stores" key={store.id} className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            {store.image ? (
                                                <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                                    <Image src={store.image} alt={store.name} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                                    <Store className="h-6 w-6 text-primary"/>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-sm">{store.name}</p>
                                            </div>
                                        </Link>
                                    ))}
                                    {stores.length > 3 && (
                                         <Link href="/our-stores">
                                            <Button variant="link" className="p-0 h-auto text-primary">View all stores</Button>
                                        </Link>
                                    )}
                                     {stores.length === 0 && (
                                        <p className="text-sm text-muted-foreground">No store locations added yet.</p>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Link href="/our-team">
                        <button className="hover:opacity-80">OUR TEAM</button>
                    </Link>
                    <Link href="/blog">
                        <button className="hover:opacity-80">BLOG</button>
                    </Link>
                     {userData?.role === 'admin' && (
                        <Popover open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
                            <PopoverTrigger asChild onMouseEnter={() => setAdminMenuOpen(true)} onMouseLeave={() => setAdminMenuOpen(false)}>
                                <div className="flex items-center relative">
                                    <Link href="/admin">
                                        <button className="flex items-center gap-1 hover:opacity-80">
                                            ADMIN <ChevronDown size={16} />
                                        </button>
                                    </Link>
                                    {totalAdminActionCount > 0 && (
                                        <Badge variant="destructive" className="absolute -top-2 -right-3 z-10 px-1.5 py-0 h-4 leading-none text-xs">
                                            {totalAdminActionCount}
                                        </Badge>
                                    )}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent 
                                className="w-64"
                                onMouseEnter={() => setAdminMenuOpen(true)} onMouseLeave={() => setAdminMenuOpen(false)}
                            >
                                <div className="grid gap-4">
                                    <p className="font-semibold">Admin Panel</p>
                                    <div className="grid gap-1">
                                        <Link href="/admin" className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="flex items-center gap-4">
                                                <Package className="h-5 w-5 mt-0.5 text-primary"/>
                                                <p className="font-semibold text-sm">Products</p>
                                            </div>
                                            {(adminActionCounts?.outOfStockProducts || 0) > 0 && <Badge variant="destructive">{adminActionCounts?.outOfStockProducts}</Badge>}
                                        </Link>
                                        <Link href="/admin/orders" className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="flex items-center gap-4">
                                                <ShoppingCart className="h-5 w-5 mt-0.5 text-primary"/>
                                                <p className="font-semibold text-sm">Orders</p>
                                            </div>
                                            {(adminActionCounts?.pendingOrders || 0) > 0 && <Badge>{adminActionCounts?.pendingOrders}</Badge>}
                                        </Link>
                                        <Link href="/admin/returns" className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="flex items-center gap-4">
                                                <Undo2 className="h-5 w-5 mt-0.5 text-primary"/>
                                                <p className="font-semibold text-sm">Returns</p>
                                            </div>
                                            {(adminActionCounts?.pendingReturns || 0) > 0 && <Badge variant="destructive">{adminActionCounts?.pendingReturns}</Badge>}
                                        </Link>
                                        <Link href="/admin/team" className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="flex items-center gap-4">
                                                <Users className="h-5 w-5 mt-0.5 text-primary"/>
                                                <p className="font-semibold text-sm">Our Team</p>
                                            </div>
                                        </Link>
                                        <Link href="/admin/store" className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="flex items-center gap-4">
                                                <Store className="h-5 w-5 mt-0.5 text-primary"/>
                                                <p className="font-semibold text-sm">Our Store</p>
                                            </div>
                                        </Link>
                                        <Link href="/admin/settings" className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="flex items-center gap-4">
                                                <Settings className="h-5 w-5 mt-0.5 text-primary"/>
                                                <p className="font-semibold text-sm">Settings</p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </nav>

                <div className="flex items-center gap-4 sm:gap-6">
                    {!isUserLoading && (!user || user.isAnonymous) && (
                        <Link href="/login" className="hidden sm:block">
                            <Button variant="secondary" size="sm">Login</Button>
                        </Link>
                    )}
                    {!isUserLoading && user && !user.isAnonymous && (
                        <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                            <PopoverTrigger asChild onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                                <Button variant="ghost" className="hover:opacity-80 p-0 rounded-full">
                                    <User size={24} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                                <div className="flex flex-col gap-1">
                                    <p className="font-semibold text-sm p-2">{user.email}</p>
                                    <Link href="/account">
                                        <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                                            <UserCog className="mr-2 h-4 w-4" />
                                            My Account
                                        </Button>
                                    </Link>
                                    <Link href="/orders">
                                        <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                                            <ShoppingBag className="mr-2 h-4 w-4" />
                                            My Orders
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" onClick={handleSignOut} className="justify-start p-2 h-auto">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="relative hover:opacity-80">
                                <ShoppingBag size={24} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </SheetTrigger>
                        <SheetContent className="flex flex-col w-full sm:max-w-sm">
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
                                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.cartItemId, item.quantity - 1)}>
                                                                <Minus size={14} />
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateCartItemQuantity(item.cartItemId, parseInt(e.target.value) || 0)}
                                                                className="h-7 w-12 text-center"
                                                            />
                                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.cartItemId, item.quantity + 1)}>
                                                                <Plus size={14} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => updateCartItemQuantity(item.cartItemId, 0)}>
                                                        <X size={16} />
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
                                            <SheetClose asChild>
                                                <Button size="lg" className="w-full" onClick={handleCheckout}>Checkout</Button>
                                            </SheetClose>
                                        </div>
                                    </SheetFooter>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                                    <ShoppingBag size={48} className="text-muted-foreground" />
                                    <h3 className="text-xl font-semibold">Your cart is empty</h3>
                                    <p className="text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                                    <SheetClose asChild>
                                        <Button>Continue Shopping</Button>
                                    </SheetClose>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                     <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-full max-w-xs bg-black text-white p-0">
                             <SheetHeader className="p-4 flex flex-row items-center justify-between border-b border-white/20">
                                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                                </Link>
                                <SheetTitle className="sr-only">Main Menu</SheetTitle>
                                <SheetClose asChild>
                                    <Button variant="ghost" size="icon">
                                        <CloseIcon />
                                    </Button>
                                </SheetClose>
                            </SheetHeader>
                            <div className="flex h-full flex-col">
                                <div className="flex-1 overflow-y-auto p-4">
                                    <Accordion type="multiple" className="w-full text-lg">
                                        <Link href="/purchase" className="block py-4 border-b border-white/20 text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                                            PURCHASE
                                        </Link>
                                        <Link href="/our-stores" className="block py-4 border-b border-white/20 text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                                            OUR STORES
                                        </Link>
                                        <Link href="/our-team" className="block py-4 border-b border-white/20 text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                                            OUR TEAM
                                        </Link>
                                        <Link href="/blog" className="block py-4 border-b border-white/20 text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                                            BLOG
                                        </Link>

                                        {userData?.role === 'admin' && (
                                            <AccordionItem value="admin">
                                                <AccordionTrigger className="py-4">ADMIN</AccordionTrigger>
                                                <AccordionContent className="pl-4">
                                                    <div className="grid gap-2 mt-2">
                                                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 -m-2">
                                                            <p>Products</p>
                                                            {(adminActionCounts?.outOfStockProducts || 0) > 0 && <Badge variant="destructive">{adminActionCounts?.outOfStockProducts}</Badge>}
                                                        </Link>
                                                        <Link href="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 -m-2">
                                                            <p>Orders</p>
                                                            {(adminActionCounts?.pendingOrders || 0) > 0 && <Badge>{adminActionCounts?.pendingOrders}</Badge>}
                                                        </Link>
                                                        <Link href="/admin/team" onClick={() => setIsMobileMenuOpen(false)} className="block p-2 rounded-lg hover:bg-white/10 -m-2">Our Team</Link>
                                                        <Link href="/admin/store" onClick={() => setIsMobileMenuOpen(false)} className="block p-2 rounded-lg hover:bg-white/10 -m-2">Our Store</Link>
                                                        <Link href="/admin/settings" onClick={() => setIsMobileMenuOpen(false)} className="block p-2 rounded-lg hover:bg-white/10 -m-2">Settings</Link>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}
                                    </Accordion>
                                </div>
                                {!isUserLoading && (!user || user.isAnonymous) && (
                                    <div className="p-4 border-t border-white/20">
                                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button variant="secondary" className="w-full">Login</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
