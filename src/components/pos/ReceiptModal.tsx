// src/components/pos/ReceiptModal.tsx
import React from 'react';
import { CheckCircle, Receipt, Printer } from 'lucide-react';

interface Sale {
  id: number;
  total: number;
  client: {
    name: string;
  };
  paymentMethod: string;
  receivedAmount?: number;
  change?: number;
  date: string;
  cashier: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface ReceiptModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
  onPrint: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  sale,
  onClose,
  onPrint,
}) => {
  if (!isOpen || !sale) return null;

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      default: return method;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <h3 className="text-xl font-semibold mb-4">¡Venta Exitosa!</h3>
          
          {/* Recibo detallado */}
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-center border-b pb-2 mb-3">
              <h4 className="font-bold">FRUTERÍA CENTRAL</h4>
              <p className="text-xs text-gray-600">Ticket de Venta</p>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Folio:</span>
                <span>#{sale.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{sale.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span>{sale.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Cajero:</span>
                <span>{sale.cashier}</span>
              </div>
            </div>

            <div className="border-t border-b py-2 my-3">
              <h5 className="font-semibold text-sm mb-2">Productos:</h5>
              {sale.items.map((item, index) => (
                <div key={index} className="flex justify-between text-xs mb-1">
                  <div className="flex-1">
                    <div>{item.name}</div>
                    <div className="text-gray-500">
                      {item.quantity} x ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-medium">
                    ${(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between font-semibold">
                <span>TOTAL:</span>
                <span>${sale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Método:</span>
                <span>{getPaymentMethodText(sale.paymentMethod)}</span>
              </div>
              {sale.paymentMethod === 'cash' && sale.receivedAmount && (
                <>
                  <div className="flex justify-between">
                    <span>Recibido:</span>
                    <span>${sale.receivedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cambio:</span>
                    <span>${(sale.change || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center mt-3 pt-2 border-t text-xs text-gray-500">
              <p>¡Gracias por su compra!</p>
              <p>www.fruteria-central.com</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onPrint}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Printer size={18} />
              <span>Imprimir</span>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;