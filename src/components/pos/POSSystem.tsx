// src/components/pos/POSSystem.tsx
import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Package,
  TrendingUp,
  Settings,
  User,
  Home,
} from 'lucide-react';

// Importar componentes modulares
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';

// Tipos
interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  category: string;
  stock: number;
  unit: string;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  type: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Sale {
  id: number;
  items: CartItem[];
  total: number;
  client: Client;
  paymentMethod: string;
  receivedAmount: number;
  change: number;
  date: string;
  cashier: string;
}

// Datos de ejemplo
const sampleProducts: Product[] = [
  { id: 1, name: 'Manzana Roja', barcode: '7501234567890', price: 25.50, category: 'Frutas', stock: 100, unit: 'kg' },
  { id: 2, name: 'Plátano Dominico', barcode: '7501234567891', price: 18.00, category: 'Frutas', stock: 50, unit: 'kg' },
  { id: 3, name: 'Naranja Valencia', barcode: '7501234567892', price: 22.00, category: 'Frutas', stock: 75, unit: 'kg' },
  { id: 4, name: 'Papaya Maradol', barcode: '7501234567893', price: 35.00, category: 'Frutas', stock: 30, unit: 'kg' },
  { id: 5, name: 'Jitomate', barcode: '7501234567894', price: 28.50, category: 'Verduras', stock: 40, unit: 'kg' },
  { id: 6, name: 'Cebolla Blanca', barcode: '7501234567895', price: 20.00, category: 'Verduras', stock: 25, unit: 'kg' },
  { id: 7, name: 'Aguacate Hass', barcode: '7501234567896', price: 85.00, category: 'Frutas', stock: 20, unit: 'kg' },
  { id: 8, name: 'Limón con Semilla', barcode: '7501234567897', price: 15.00, category: 'Frutas', stock: 35, unit: 'kg' },
];

const sampleClients: Client[] = [
  { id: 1, name: 'Cliente General', phone: '', email: '', type: 'general' },
  { id: 2, name: 'María González', phone: '555-0123', email: 'maria@email.com', type: 'regular' },
  { id: 3, name: 'Juan Pérez', phone: '555-0124', email: 'juan@email.com', type: 'regular' },
  { id: 4, name: 'Ana Martínez', phone: '555-0125', email: 'ana@email.com', type: 'premium' },
];

const POSSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client>(sampleClients[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);

  // Filtrar productos según búsqueda
  const filteredProducts = sampleProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  // Calcular totales del carrito
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Funciones del carrito
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const processSale = () => {
    const change = parseFloat(receivedAmount) - cartTotal;
    const sale: Sale = {
      id: Date.now(),
      items: cart,
      total: cartTotal,
      client: selectedClient,
      paymentMethod,
      receivedAmount: parseFloat(receivedAmount),
      change: change,
      date: new Date().toLocaleString(),
      cashier: 'Usuario Actual'
    };
    
    setCurrentSale(sale);
    clearCart();
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    setReceivedAmount('');
  };

  const handlePayment = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && (parseFloat(receivedAmount) < cartTotal)) {
      alert('El monto recibido debe ser mayor o igual al total');
      return;
    }
    processSale();
  };

  const handlePrint = () => {
    window.print();
  };

  // Sidebar Navigation
  const Sidebar = () => (
    <div className="w-16 bg-blue-800 text-white flex flex-col items-center py-4 space-y-6">
      <div className="text-2xl font-bold text-blue-200">POS</div>
      
      <nav className="flex flex-col space-y-4">
        <button
          onClick={() => setCurrentView('sales')}
          className={`p-3 rounded-lg transition-colors ${
            currentView === 'sales' ? 'bg-blue-600' : 'hover:bg-blue-700'
          }`}
          title="Ventas"
        >
          <ShoppingCart size={20} />
        </button>
        
        <button
          onClick={() => setCurrentView('inventory')}
          className={`p-3 rounded-lg transition-colors ${
            currentView === 'inventory' ? 'bg-blue-600' : 'hover:bg-blue-700'
          }`}
          title="Inventario"
        >
          <Package size={20} />
        </button>
        
        <button
          onClick={() => setCurrentView('reports')}
          className={`p-3 rounded-lg transition-colors ${
            currentView === 'reports' ? 'bg-blue-600' : 'hover:bg-blue-700'
          }`}
          title="Reportes"
        >
          <TrendingUp size={20} />
        </button>
        
        <button
          onClick={() => setCurrentView('settings')}
          className={`p-3 rounded-lg transition-colors ${
            currentView === 'settings' ? 'bg-blue-600' : 'hover:bg-blue-700'
          }`}
          title="Configuración"
        >
          <Settings size={20} />
        </button>
      </nav>
      
      <div className="mt-auto">
        <button 
          className="p-3 rounded-lg hover:bg-blue-700" 
          title="Volver al sistema principal"
          onClick={() => window.close()}
        >
          <Home size={20} />
        </button>
        <button className="p-3 rounded-lg hover:bg-blue-700 mt-2" title="Usuario">
          <User size={20} />
        </button>
      </div>
    </div>
  );

  // Vista principal de ventas
  const SalesView = () => (
    <div className="flex-1 flex h-screen">
      <ProductGrid
        products={filteredProducts}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onProductSelect={addToCart}
      />
      
      <Cart
        cart={cart}
        clients={sampleClients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onProcessPayment={() => setShowPaymentModal(true)}
      />
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      {currentView === 'sales' && <SalesView />}
      
      {currentView === 'inventory' && (
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Package size={64} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4 text-gray-700">Gestión de Inventario</h1>
            <p className="text-gray-600">Módulo de inventario en desarrollo...</p>
          </div>
        </div>
      )}
      
      {currentView === 'reports' && (
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp size={64} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4 text-gray-700">Reportes y Estadísticas</h1>
            <p className="text-gray-600">Módulo de reportes en desarrollo...</p>
          </div>
        </div>
      )}
      
      {currentView === 'settings' && (
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Settings size={64} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4 text-gray-700">Configuración del Sistema</h1>
            <p className="text-gray-600">Módulo de configuración en desarrollo...</p>
          </div>
        </div>
      )}
      
      <PaymentModal
        isOpen={showPaymentModal}
        total={cartTotal}
        paymentMethod={paymentMethod}
        receivedAmount={receivedAmount}
        onClose={() => setShowPaymentModal(false)}
        onPaymentMethodChange={setPaymentMethod}
        onReceivedAmountChange={setReceivedAmount}
        onConfirmPayment={handlePayment}
      />
      
      <ReceiptModal
        isOpen={showReceiptModal}
        sale={currentSale}
        onClose={() => setShowReceiptModal(false)}
        onPrint={handlePrint}
      />
    </div>
  );
};

export default POSSystem;