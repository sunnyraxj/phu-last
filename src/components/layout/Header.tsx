'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, ShoppingBag, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: '/products', label: 'ALL PRODUCTS' },
    { href: '/crafts', label: 'CRAFTS' },
    { href: '/books', label: 'BOOKS' },
    { href: '/lifestyle', label: 'LIFESTYLE' },
    { href: '/brands', label: 'BRANDS' },
    { href: '/our-store', label: 'OUR STORE' },
    { href: '/blog', label: 'BLOG' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
         <div className="mr-4 hidden lg:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="flex flex-col items-start leading-none">
              <span className="font-bold text-xl tracking-tight">The Bengal Store</span>
              <span className="text-xs tracking-widest text-muted-foreground">HANDCRAFTING STORIES</span>
            </div>
          </Link>
        </div>
        
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="mb-6 flex items-center">
                 <div className="flex flex-col items-start leading-none">
                  <span className="font-bold text-xl tracking-tight">The Bengal Store</span>
                  <span className="text-xs tracking-widest text-muted-foreground">HANDCRAFTING STORIES</span>
                </div>
              </Link>
              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'transition-colors hover:text-foreground/80 uppercase',
                       pathname === link.href ? 'text-foreground font-semibold' : 'text-foreground/60'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <nav className="flex-1 items-center justify-center hidden lg:flex">
          <div className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'uppercase transition-colors hover:text-foreground/80 text-sm font-medium',
                    pathname === link.href ? 'text-foreground font-semibold' : 'text-foreground/60'
                  )}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </nav>
        
        <div className="flex items-center justify-end space-x-2">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User Profile</span>
            </Button>
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/checkout">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  2
                </span>
                <span className="sr-only">Shopping Cart</span>
              </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
