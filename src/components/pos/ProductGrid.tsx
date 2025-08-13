// src/components/pos/ProductGrid.tsx
import React from 'react';
import { Search, Barcode, Archive } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  category: string;
  stock: number;
  unit: string;
}

interface ProductGridProps {
  products: Product[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onProductSelect: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  searchTerm,
  onSearchChange,
  onProductSelect,
}) => {
  return (
    <div className="flex-1 p-4 bg-gray-50">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Punto de Venta</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Tienda: Frutería Central</span>
            <span className="text-sm text-gray-600">Caja: #001</span>
            <span className="text-sm text-gray-600">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar producto por nombre o código de barras..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onProductSelect(product)}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Archive className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{product.category}</p>
              <p className="text-lg font-bold text-green-600">${product.price.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Stock: {product.stock} {product.unit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {products.length === 0 && (
        <div className="text-center mt-8">
          <Archive size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No se encontraron productos</p>
          <p className="text-sm text-gray-400">Intenta con otro término de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;