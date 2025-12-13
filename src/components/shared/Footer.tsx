'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Purbanchal Hasta Udyog</h3>
            <p className="text-sm text-gray-400">
              Handcrafted treasures from the East that tell a story.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/purchase" className="text-gray-400 hover:text-white">All Products</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">New Arrivals</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Best Sellers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">About Us</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/our-team" className="text-gray-400 hover:text-white">Our Team</Link></li>
              <li><Link href="/our-stores" className="text-gray-400 hover:text-white">Our Stores</Link></li>
              <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white">Policies</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">My Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/account" className="text-gray-400 hover:text-white">My Account</Link></li>
              <li><Link href="/orders" className="text-gray-400 hover:text-white">My Orders</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-white">Login / Register</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-gray-500 mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} Purbanchal Hasta Udyog. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
               <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
