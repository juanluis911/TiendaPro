// src/components/pos/Cart.tsx
import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, X } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  type: string;
}

interface CartProps {
  cart: CartItem[];
  clients: Client[];
  selectedClient: Client;
  onClientChange: (client: Client) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  onProcessPayment: () => void;
}

const Cart: React.FC<CartProps> = ({
  cart,
  clients,
  selectedClient,
  onClientChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProcessPayment,
}) => {
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
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
                onClick={onClearCart}
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
          onChange={(e) => onClientChange(clients.find(c => c.id === parseInt(e.target.value)) || clients[0])}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {clients.map((client) => (
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
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
            onClick={onProcessPayment}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CreditCard size={20} />
            <span>Procesar Pago</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;