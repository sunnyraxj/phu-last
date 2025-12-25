
'use client';

import Link from "next/link";
import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Search,
  User,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Compass,
  LogOut,
  Menu
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { cn, isValidImageDomain } from "@/lib/utils";
import placeholderImages from '@/lib/placeholder-images.json';
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Simple X icon replacement
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.259 7.929-7.259 4.164 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.638 0 12.017 0z" />
  </svg>
)

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

type CartItem = Product & { quantity: number; cartItemId: string; selectedSize?: string };

interface HeaderProps {
    userData: { role: string } | null | undefined;
    cartItems: CartItem[];
    updateCartItemQuantity: (cartItemId: string, newQuantity: number) => void;
    showAnnouncement?: boolean;
}

export function Header({ userData, cartItems, updateCartItemQuantity, showAnnouncement = true }: HeaderProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleCheckout = () => {
    if (user?.isAnonymous) {
        router.push('/login?redirect=/checkout');
    } else {
        router.push('/checkout');
    }
  };

  const getCartItemPrice = (item: CartItem): number => {
    if (item.variants && item.variants.length > 0) {
        const selectedVariant = item.variants.find(v => v.size === item.selectedSize);
        if (selectedVariant) {
            return selectedVariant.price;
        }
        return item.variants[0].price;
    }
    return item.baseMrp || 0;
  };

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
        const price = getCartItemPrice(item);
        return acc + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const navItems = [
    { href: "/purchase", label: "All Products" },
    { href: "/our-stores", label: "Our Stores" },
    { href: "/about", label: "About Us" },
    { href: "/our-team", label: "Our Team" },
  ];

  return (
    <header className="w-full sticky top-0 z-50">
      {showAnnouncement && (
        <div className="bg-[--brand-green] text-white py-2 px-4 flex items-center justify-between text-xs font-medium">
          <div className="w-1/3 flex-1 flex justify-start items-center gap-4">
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <Facebook size={16} />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <XIcon className="w-4 h-4" />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity">
              <Instagram size={16} />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity hidden sm:inline-flex">
              <Youtube size={16} />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity hidden sm:inline-flex">
              <PinterestIcon className="w-4 h-4" />
            </Link>
            <Link href="#" className="hover:opacity-80 transition-opacity hidden sm:inline-flex">
              <Linkedin size={16} />
            </Link>
          </div>

          <div className="w-1/3 flex-1 justify-center hidden md:flex items-center gap-8">
            <button className="hover:opacity-80">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 tracking-wide uppercase">
              <Compass size={14} />
              <span>Clearance Sale is Live!</span>
            </div>
            <button className="hover:opacity-80">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="w-1/3 flex-1" />
        </div>
      )}

      {/* Main Navigation */}
      <div className="bg-background relative z-10 shadow-sm py-3 px-4 md:px-6">
        <div className="w-full flex flex-col items-center justify-center">
          
          {/* Top Row: Search, Logo, User/Cart */}
          <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 md:gap-4 w-1/3">
                  <div className="md:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Menu />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {navItems.map((item) => (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link href={item.href}>{item.label}</Link>
                          </DropdownMenuItem>
                        ))}
                        {userData?.role === 'admin' && (
                          <>
                           <Separator />
                            <DropdownMenuItem asChild>
                              <Link href="/admin/dashboard">Admin Dashboard</Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <button className="hover:text-[--brand-brown] transition-colors hidden md:block">
                      <Search size={22} strokeWidth={1.5} />
                  </button>
              </div>

              <div className="flex justify-center w-1/3">
                <Link href="/" className="flex flex-col items-center">
                   <span className="text-2xl md:text-3xl font-serif text-[--brand-brown] tracking-tighter leading-none flex items-center gap-1 whitespace-nowrap">
                    Purbanchal
                  </span>
                  <span className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-[--brand-brown]/70 mt-1 font-medium">
                    Rooted in Craft, Inspired by People
                  </span>
                </Link>
              </div>

              <div className="flex justify-end items-center gap-2 sm:gap-5 w-1/3">
                {!isUserLoading && user && !user.isAnonymous ? (
                   <Popover>
                      <PopoverTrigger asChild>
                         <button className="hover:opacity-80 transition-colors rounded-full h-8 w-8 flex items-center justify-center bg-transparent ring-1 ring-inset ring-white">
                              <User size={20} strokeWidth={1.5} />
                          </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-sm p-2 truncate">{user.email}</p>
                          <Link href="/account">
                              <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                                  My Account
                              </Button>
                          </Link>
                          <Link href="/orders">
                              <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                                  My Orders
                              </Button>
                          </Link>
                          <Button variant="ghost" onClick={handleSignOut} className="justify-start p-2 h-auto text-destructive">
                              <LogOut className="mr-2 h-4 w-4" />
                              Logout
                          </Button>
                        </div>
                      </PopoverContent>
                   </Popover>
                ) : (
                  <Link href="/login" className="hover:text-[--brand-brown] transition-colors">
                      <User size={22} strokeWidth={1.5} />
                  </Link>
                )}
               
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="relative hover:text-[--brand-brown] transition-colors">
                            <ShoppingBag size={22} strokeWidth={1.5} />
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
                                            <div key={item.cartItemId} className="flex items-start gap-4">
                                                <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
                                                    <Image
                                                        src={isValidImageDomain(item.images?.[0]) ? item.images[0] : placeholderImages.product.url}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <p className="font-semibold text-sm">{item.name}</p>
                                                    <p className="text-muted-foreground text-sm font-bold">
                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(getCartItemPrice(item))}
                                                    </p>
                                                    <div className="flex items-center gap-2">
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
                                  <Link href="/purchase">
                                    <Button>Continue Shopping</Button>
                                  </Link>
                                </SheetClose>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
              </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center justify-center gap-6 text-[13px] font-medium text-[--brand-brown]">
            {navItems.map((item) => (
               <Link key={item.href} href={item.href} className="hover:text-[--brand-green] transition-colors">
                  {item.label}
               </Link>
            ))}
            {userData?.role === 'admin' && (
              <Link href="/admin/dashboard" className="hover:text-[--brand-green] transition-colors">
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
