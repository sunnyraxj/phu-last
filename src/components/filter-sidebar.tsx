"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface FilterSidebarProps {
  priceRange: [number, number]
  setPriceRange: (value: [number, number]) => void
}

const CATEGORIES = ["Crafts", "Food", "Books", "Lifestyle", "Textiles"]
const BRANDS = ["Biswa Bangla", "The Bengal Store", "Kopai", "Amar Kutir"]
const ARTISTS = ["Jamini Roy", "Ganesh Pyne", "Meera Mukherjee", "Jogen Chowdhury"]
const MATERIALS = ["Ceramic", "Brass", "Jute", "Cotton", "Sabai Grass"]

export default function FilterSidebar({ priceRange, setPriceRange }: FilterSidebarProps) {
  return (
    <aside className="w-80 border-r border-gray-200 p-6 hidden lg:block">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="link" className="text-sm p-0 h-auto">
          Clear All
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["price", "category"]} className="w-full">
        <AccordionItem value="price">
          <AccordionTrigger className="text-base font-medium">Price</AccordionTrigger>
          <AccordionContent className="pt-4">
            <Slider
              min={0}
              max={10500}
              step={100}
              value={priceRange}
              onValueChange={setPriceRange}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="category">
          <AccordionTrigger className="text-base font-medium">Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox id={`category-${category}`} />
                  <label
                    htmlFor={`category-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brands">
          <AccordionTrigger className="text-base font-medium">Brands</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {BRANDS.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox id={`brand-${brand}`} />
                  <label
                    htmlFor={`brand-${brand}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {brand}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="artists">
          <AccordionTrigger className="text-base font-medium">Artists</AccordionTrigger>
          <AccordionContent>
             <div className="space-y-3 pt-2">
              {ARTISTS.map((artist) => (
                <div key={artist} className="flex items-center space-x-2">
                  <Checkbox id={`artist-${artist}`} />
                  <label
                    htmlFor={`artist-${artist}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {artist}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="materials">
          <AccordionTrigger className="text-base font-medium">Materials</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {MATERIALS.map((material) => (
                <div key={material} className="flex items-center space-x-2">
                  <Checkbox id={`material-${material}`} />
                  <label
                    htmlFor={`material-${material}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {material}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  )
}
