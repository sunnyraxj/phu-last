"use client";
import { useState } from "react";
import { ChevronDown, Search, User, Heart, ShoppingCart } from "lucide-react";
import { Logo } from "./Logo";

export function Header() {
  const [cartCount, setCartCount] = useState(2);
  const [wishlistCount, setWishlistCount] = useState(0);

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto">
        <div className="flex items-center justify-between px-8 py-4">
          <Logo />

          {/* Navigation */}
          <nav className="flex items-center gap-8 text-sm font-semibold">
            <button className="flex items-center gap-1 hover:opacity-80">
              CRAFTS <ChevronDown size={16} />
            </button>
            <button className="hover:opacity-80">FOOD</button>
            <button className="flex items-center gap-1 hover:opacity-80">
              BOOKS <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-1 hover:opacity-80">
              LIFESTYLE <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-1 hover:opacity-80">
              TEXTILES <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-1 hover:opacity-80">
              BRANDS <ChevronDown size={16} />
            </button>
            <button className="hover:opacity-80">OUR STORE</button>
            <button className="hover:opacity-80">BLOG</button>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-6">
            <button className="hover:opacity-80">
              <Search size={20} />
            </button>
            <button className="hover:opacity-80">
              <User size={20} />
            </button>
            <button className="relative hover:opacity-80">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button className="relative hover:opacity-80">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
