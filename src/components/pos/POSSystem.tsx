import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator,
  CreditCard,
  DollarSign,
  Package,
  User,
  Settings,
  Home,
  Receipt,
  Barcode,
  Archive,
  TrendingUp,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

// Datos de ejemplo
const sampleProducts = [
  { id: 1, name: 'Manzana Roja', barcode: '7501234567890', price: 25.50, category: 'Frutas', stock: 100, unit: 'kg' },
  { id: 2, name: 'Plátano Dominico', barcode: '7501234567891', price: 18.00, category: 'Frutas', stock: 50, unit: 'kg' },
  { id: 3, name: 'Naranja Valencia', barcode: '7501234567892', price: 22.00, category: 'Frutas', stock: 75, unit: 'kg' },
  { id: 4, name: 'Papaya Maradol', barcode: '7501234567893', price: 35.00, category: 'Frutas', stock: 30, unit: 'kg' },
  { id: 5, name: 'Jitomate', barcode: '7501234567894', price: 28.50, category: 'Verduras', stock: 40, unit: 'kg' },
  { id: 6, name: 'Cebolla Blanca', barcode: '7501234567895', price: 20.00, category: 'Verduras', stock: 25, unit: 'kg' },
  { id: 7, name: 'Aguacate Hass', barcode: '7501234567896', price: 85.00, category: 'Frutas', stock: 20, unit: 'kg' },
  { id: 8, name: 'Limón con Semilla', barcode: '7501234567897', price: 15.00, category: 'Frutas', stock: 35, unit: 'kg' },
];

const sampleClients = [
  { id: 1, name: 'Cliente General', phone: '', email: '', type: 'general' },
  { id: 2, name: 'María González', phone: '555-0123', email: 'maria@email.com', type: 'regular' },
  { id: 3, name: 'Juan Pérez', phone: '555-0124', email: 'juan@email.com', type: 'regular' },
  { id: 4, name: 'Ana Martínez', phone: '555-0125', email: 'ana@email.com', type: 'premium' },
];

const POSSystem = () => {
  const [currentView, setCurrentView] = useState('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(sampleClients[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);

  // Filtrar productos según búsqueda
  const filteredProducts = sampleProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  // Calcular totales del carrito
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Funciones del carrito
  const addToCart = (product) => {
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

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const processSale = () => {
    const change = parseFloat(receivedAmount) - cartTotal;
    const sale = {
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
        <button className="p-3 rounded-lg hover:bg-blue-700" title="Cerrar Sesión">
          <User size={20} />
        </button>
      </div>
    </div>
  );

  // Vista principal de ventas
  const SalesView = () => (
    <div className="flex-1 flex h-screen">
      {/* Panel de productos */}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => addToCart(product)}
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
      </div>

      {/* Panel del carrito */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Header del carrito */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Carrito de Compras</h2>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {cartItems} items
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700"
                  title="Limpiar carrito"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
          <select
            value={selectedClient.id}
            onChange={(e) => setSelectedClient(sampleClients.find(c => c.id === parseInt(e.target.value)))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sampleClients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
              <p>Carrito vacío</p>
              <p className="text-sm">Selecciona productos para agregar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)} c/u</p>
                      <p className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total y botón de pago */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-green-600">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard size={20} />
              <span>Procesar Pago</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Modal de pago
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <h3 className="text-xl font-semibold mb-4">Procesar Pago</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold">Total a pagar: <span className="text-green-600">${cartTotal.toFixed(2)}</span></p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto recibido</label>
              <input
                type="number"
                step="0.01"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              {receivedAmount && (
                <p className="mt-2 text-sm">
                  Cambio: <span className="font-semibold text-blue-600">
                    ${(parseFloat(receivedAmount) - cartTotal).toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowPaymentModal(false)}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handlePayment}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );

  // Modal de recibo
  const ReceiptModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <h3 className="text-xl font-semibold mb-4">¡Venta Exitosa!</h3>
          
          {currentSale && (
            <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-2">Resumen de Venta</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Folio:</strong> #{currentSale.id}</p>
                <p><strong>Cliente:</strong> {currentSale.client.name}</p>
                <p><strong>Método:</strong> {currentSale.paymentMethod === 'cash' ? 'Efectivo' : 
                                            currentSale.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</p>
                <p><strong>Total:</strong> ${currentSale.total.toFixed(2)}</p>
                {currentSale.paymentMethod === 'cash' && (
                  <>
                    <p><strong>Recibido:</strong> ${currentSale.receivedAmount.toFixed(2)}</p>
                    <p><strong>Cambio:</strong> ${currentSale.change.toFixed(2)}</p>
                  </>
                )}
                <p><strong>Fecha:</strong> {currentSale.date}</p>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Receipt size={18} />
              <span>Imprimir Ticket</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowReceiptModal(false)}
            className="w-full mt-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      {currentView === 'sales' && <SalesView />}
      
      {currentView === 'inventory' && (
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Gestión de Inventario</h1>
          <p className="text-gray-600">Módulo de inventario en desarrollo...</p>
        </div>
      )}
      
      {currentView === 'reports' && (
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Reportes y Estadísticas</h1>
          <p className="text-gray-600">Módulo de reportes en desarrollo...</p>
        </div>
      )}
      
      {currentView === 'settings' && (
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Configuración del Sistema</h1>
          <p className="text-gray-600">Módulo de configuración en desarrollo...</p>
        </div>
      )}
      
      {showPaymentModal && <PaymentModal />}
      {showReceiptModal && <ReceiptModal />}
    </div>
  );
};

export default POSSystem;