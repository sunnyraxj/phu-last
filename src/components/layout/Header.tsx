'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { Logo } from '../shared/Logo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navLinks = [
  { href: '/crafts', label: 'CRAFTS', dropdown: true },
  { href: '/food', label: 'FOOD' },
  { href: '/books', label: 'BOOKS', dropdown: true },
  { href: '/lifestyle', label: 'LIFESTYLE', dropdown: true },
  { href: '/textiles', label: 'TEXTILES', dropdown: true },
  { href: '/brands', label: 'BRANDS', dropdown: true },
  { href: '/our-store', label: 'OUR STORE' },
  { href: '/blog', label: 'BLOG' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-primary text-primary-foreground">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden lg:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
          <nav className="flex items-center space-x-4 text-sm font-medium">
            {navLinks.map((link) =>
              link.dropdown ? (
                <DropdownMenu key={link.href}>
                  <DropdownMenuTrigger className="flex items-center gap-1 uppercase transition-colors hover:text-primary-foreground/80 focus:outline-none text-sm font-medium">
                    {link.label}
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-primary text-primary-foreground border-primary/20">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="#">Sample Item 1</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="#">Sample Item 2</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'uppercase transition-colors hover:text-primary-foreground/80 text-sm font-medium',
                    pathname === link.href ? 'text-primary-foreground font-semibold' : ''
                  )}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 bg-primary text-primary-foreground border-primary/20">
              <Link href="/" className="mb-6 flex items-center">
                <Logo />
              </Link>
              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'transition-colors hover:text-primary-foreground/80 uppercase',
                       pathname === link.href ? 'text-primary-foreground font-semibold' : ''
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex flex-1 items-center justify-end lg:justify-end px-4">
           <div className="flex items-center justify-end space-x-2">
              <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                <User className="h-5 w-5" />
                <span className="sr-only">User Profile</span>
              </Button>
              <Button variant="ghost" size="icon" className="relative hover:bg-primary-foreground/10">
                <Heart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  0
                </span>
                <span className="sr-only">Wishlist</span>
              </Button>
              <Button variant="ghost" size="icon" className="relative hover:bg-primary-foreground/10" asChild>
                <Link href="/checkout">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    2
                  </span>
                  <span className="sr-only">Shopping Cart</span>
                </Link>
              </Button>
            </div>
        </div>
      </div>
    </header>
  );
}
