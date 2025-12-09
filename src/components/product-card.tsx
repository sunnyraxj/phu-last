interface ProductCardProps {
    product: {
      id: number
      name: string
      price: number
      image: string
    }
  }
  
  export default function ProductCard({ product }: ProductCardProps) {
    return (
      <div className="group cursor-pointer">
        <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square mb-3">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-sm font-semibold text-gray-900">Rs. {product.price.toLocaleString()}</p>
      </div>
    )
  }
  