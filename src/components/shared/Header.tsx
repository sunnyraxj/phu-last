
'use client';

import Link from "next/link";
import { ChevronDown, ShoppingBag, User, LogOut, Settings, Store, Package, Users, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Plus, Minus, X, Sprout, Palette, Wind } from "lucide-react";
import { Badge } from "../ui/badge";

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
    adminActionCounts?: {
        pendingOrders: number;
        outOfStockProducts: number;
    };
}

export function Header({ userData, cartItems, updateCartItemQuantity, stores = [], adminActionCounts = { pendingOrders: 0, outOfStockProducts: 0 } }: HeaderProps) {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const [isCraftsPopoverOpen, setIsCraftsPopoverOpen] = useState(false);
    const [isStoresPopoverOpen, setIsStoresPopoverOpen] = useState(false);
    const [isAdminPopoverOpen, setIsAdminPopoverOpen] = useState(false);


    const handleSignOut = async () => {
        await signOut(auth);
    };

    const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
    const cartSubtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);

    const totalAdminActionCount = useMemo(() => {
        return adminActionCounts.pendingOrders + adminActionCounts.outOfStockProducts;
    }, [adminActionCounts]);

    return (
        <header className="bg-black text-white">
            <div className="container mx-auto flex items-center justify-between px-8 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold">P</span>
                    </div>
                    <span className="text-lg font-semibold">Purbanchal Hasta Udyog</span>
                </Link>

                <nav className="flex items-center gap-8 text-sm font-semibold">
                     <Popover open={isCraftsPopoverOpen} onOpenChange={setIsCraftsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div 
                                onMouseEnter={() => setIsCraftsPopoverOpen(true)} 
                                onMouseLeave={() => setIsCraftsPopoverOpen(false)}
                                className="flex items-center"
                            >
                                <button className="flex items-center gap-1 hover:opacity-80">
                                    CRAFTS <ChevronDown size={16} />
                                </button>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent 
                            className="w-80"
                            onMouseEnter={() => setIsCraftsPopoverOpen(true)} 
                            onMouseLeave={() => setIsCraftsPopoverOpen(false)}
                        >
                            <div className="grid gap-4">
                                <p className="font-semibold">Featured Crafts</p>
                                <div className="grid gap-2">
                                    <Link href="#" className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                        <Sprout className="h-6 w-6 mt-1 text-primary"/>
                                        <div>
                                            <p className="font-semibold text-sm">Pottery & Ceramics</p>
                                            <p className="text-xs text-muted-foreground">Earthenware from the heart of the land.</p>
                                        </div>
                                    </Link>
                                     <Link href="#" className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                        <Palette className="h-6 w-6 mt-1 text-primary"/>
                                        <div>
                                            <p className="font-semibold text-sm">Handwoven Textiles</p>
                                            <p className="text-xs text-muted-foreground">Stories woven into every thread.</p>
                                        </div>
                                    </Link>
                                     <Link href="#" className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                        <Wind className="h-6 w-6 mt-1 text-primary"/>
                                        <div>
                                            <p className="font-semibold text-sm">Wooden Decor</p>
                                            <p className="text-xs text-muted-foreground">Timeless pieces crafted from natural wood.</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Popover open={isStoresPopoverOpen} onOpenChange={setIsStoresPopoverOpen}>
                        <PopoverTrigger asChild>
                             <div 
                                onMouseEnter={() => setIsStoresPopoverOpen(true)} 
                                onMouseLeave={() => setIsStoresPopoverOpen(false)}
                                className="flex items-center"
                            >
                                <Link href="/our-stores">
                                    <button className="flex items-center gap-1 hover:opacity-80">
                                        OUR STORES <ChevronDown size={16} />
                                    </button>
                                </Link>
                            </div>
                        </PopoverTrigger>
                         <PopoverContent 
                            className="w-80"
                            onMouseEnter={() => setIsStoresPopoverOpen(true)} 
                            onMouseLeave={() => setIsStoresPopoverOpen(false)}
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
                    <button className="hover:opacity-80">BLOG</button>
                     {userData?.role === 'admin' && (
                        <Popover open={isAdminPopoverOpen} onOpenChange={setIsAdminPopoverOpen}>
                            <PopoverTrigger asChild>
                                <div 
                                    onMouseEnter={() => setIsAdminPopoverOpen(true)} 
                                    onMouseLeave={() => setIsAdminPopoverOpen(false)}
                                    className="flex items-center relative"
                                >
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
                                onMouseEnter={() => setIsAdminPopoverOpen(true)} 
                                onMouseLeave={() => setIsAdminPopoverOpen(false)}
                            >
                                <div className="grid gap-4">
                                    <p className="font-semibold">Admin Panel</p>
                                    <div className="grid gap-1">
                                        <Link href="/admin" className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="flex items-center gap-4">
                                                <Package className="h-5 w-5 mt-0.5 text-primary"/>
                                                <p className="font-semibold text-sm">Products</p>
                                            </div>
                                            {adminActionCounts.outOfStockProducts > 0 && <Badge variant="destructive">{adminActionCounts.outOfStockProducts}</Badge>}
                                        </Link>
                                        <Link href="/admin/orders" className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted -m-2">
                                            <div className="flex items-center gap-4">
                                                <ShoppingCart className="h-5 w-5 mt-0.5 text-primary"/>
                                                <p className="font-semibold text-sm">Orders</p>
                                            </div>
                                            {adminActionCounts.pendingOrders > 0 && <Badge>{adminActionCounts.pendingOrders}</Badge>}
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
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </nav>

                <div className="flex items-center gap-6">
                    {!isUserLoading && user?.isAnonymous && (
                        <Link href="/login">
                            <Button variant="secondary" size="sm">Login</Button>
                        </Link>
                    )}
                    {!isUserLoading && user && !user.isAnonymous && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="hover:opacity-80 p-0 rounded-full">
                                    <User size={20} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                                <div className="flex flex-col gap-1">
                                    <p className="font-semibold text-sm p-2">{user.email}</p>
                                    <Button variant="ghost" className="justify-start p-2 h-auto" onClick={() => { /* Navigate to settings */ }}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Button>
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
                                <ShoppingBag size={20} />
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
                                            <Button size="lg" className="w-full">Checkout</Button>
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
                </div>
            </div>
        </header>
    );
}
