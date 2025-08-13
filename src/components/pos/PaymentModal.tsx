// src/components/pos/PaymentModal.tsx
import React from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  paymentMethod: string;
  receivedAmount: string;
  onClose: () => void;
  onPaymentMethodChange: (method: string) => void;
  onReceivedAmountChange: (amount: string) => void;
  onConfirmPayment: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  total,
  paymentMethod,
  receivedAmount,
  onClose,
  onPaymentMethodChange,
  onReceivedAmountChange,
  onConfirmPayment,
}) => {
  if (!isOpen) return null;

  const change = parseFloat(receivedAmount) - total;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <h3 className="text-xl font-semibold mb-4">Procesar Pago</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold">
              Total a pagar: <span className="text-green-600">${total.toFixed(2)}</span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto recibido
              </label>
              <input
                type="number"
                step="0.01"
                value={receivedAmount}
                onChange={(e) => onReceivedAmountChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              {receivedAmount && (
                <p className="mt-2 text-sm">
                  Cambio: <span className="font-semibold text-blue-600">
                    ${change.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                💳 Procese el pago con tarjeta en la terminal
              </p>
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">
                📱 Solicite al cliente que realice la transferencia
              </p>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmPayment}
            disabled={paymentMethod === 'cash' && parseFloat(receivedAmount) < total}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;