"use client"

import { useState } from "react"
import { Grid2X2, Grid3X3, List } from "lucide-react"
import ProductCard from "@/components/product-card"
import FilterSidebar from "@/components/filter-sidebar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PRODUCTS = [
  {
    id: 1,
    name: "Set Of 6 Jamini Roy Prints",
    price: 1200,
    image: "https://purbanchal.com/wp-content/uploads/2023/11/jamini-roy-prints-book-cover-blue.jpg",
  },
  {
    id: 2,
    name: "Ceramic Etched Bird Plate",
    price: 5000,
    image: "https://purbanchal.com/wp-content/uploads/2023/11/ceramic-etched-bird-plate-with-design.jpg",
  },
  {
    id: 3,
    name: "Dokra Bell",
    price: 1900,
    image: "https://purbanchal.com/wp-content/uploads/2023/10/brass-dokra-bell-hanging.jpg",
  },
  {
    id: 4,
    name: "Sabai Basket With Lid",
    price: 750,
    image: "https://purbanchal.com/wp-content/uploads/2023/11/woven-sabai-basket-with-lid.jpg",
  },
  {
    id: 5,
    name: "Golden Peacock Sculpture",
    price: 3200,
    image: "https://purbanchal.com/wp-content/uploads/2023/11/bronze-golden-peacock-sculpture.jpg",
  },
  {
    id: 6,
    name: "Brass Giraffe Figurine",
    price: 2100,
    image: "https://purbanchal.com/wp-content/uploads/2023/10/brass-giraffe-figurine-standing.jpg",
  },
  {
    id: 7,
    name: "Ceramic Serving Bowl",
    price: 1500,
    image: "https://purbanchal.com/wp-content/uploads/2023/11/black-ceramic-serving-bowl-with-lid.jpg",
  },
  {
    id: 8,
    name: "Woven Jute Basket",
    price: 800,
    image: "https://purbanchal.com/wp-content/uploads/2023/11/natural-woven-jute-basket.jpg",
  },
]

export default function Home() {
  const [view, setView] = useState<"grid2" | "grid3" | "list">("grid3")
  const [sortBy, setSortBy] = useState("featured")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10500])

  const gridClasses = {
    grid2: "grid-cols-1 md:grid-cols-2",
    grid3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    list: "grid-cols-1",
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <FilterSidebar priceRange={priceRange} setPriceRange={setPriceRange} />

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8">
          {/* Header with View Toggle and Sort */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("list")}
                  className="w-9 h-9 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={view === "grid2" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("grid2")}
                  className="w-9 h-9 p-0"
                >
                  <Grid2X2 className="w-4 h-4" />
                </Button>
                <Button
                  variant={view === "grid3" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("grid3")}
                  className="w-9 h-9 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Sort Dropdown and Product Count */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort By:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm font-medium text-gray-900">{PRODUCTS.length} Products</span>
            </div>
          </div>

          {/* Product Grid */}
          <div className={`grid ${gridClasses[view]} gap-6`}>
            {PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
