import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Order, RestaurantConfig } from '../types.ts';

interface ThermalPrintModalProps {
  order: Order | null;
  config: RestaurantConfig;
  onClose: () => void;
  title?: string;
}

export const ThermalPrintModal: React.FC<ThermalPrintModalProps> = ({
  order,
  config,
  onClose,
  title = 'Impressão Térmica 80mm (Cozinha / Caixa)',
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = order.paymentStatus === 'PAGO';
  const orderDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
  const orderTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* Top bar */}
        <div className="bg-stone-800 px-4 py-3 flex items-center justify-between border-b border-stone-700">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs text-stone-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 80mm Thermal Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-stone-950">
          <div
            id="thermal-receipt"
            className="w-[80mm] max-w-full bg-[#fffff8] text-stone-900 p-4 font-mono text-[11px] leading-tight shadow-md border border-stone-300 rounded-xs select-all"
            style={{ fontFamily: 'Courier New, Courier, monospace' }}
          >
            {/* Header */}
            <div className="text-center space-y-0.5">
              <p className="font-black text-sm tracking-wider uppercase">
                {config.restaurantName}
              </p>
              <p className="text-[10px]">HAMBURGUERIA ARTESANAL</p>
              <p className="text-[9px]">TEL / ZAP: {config.phone}</p>
              <p className="text-[9px]">CNPJ: 45.123.890/0001-44</p>
              <p className="text-[10px] pt-1">
                {orderDate} - {orderTime}
              </p>
            </div>

            <div className="border-t border-dashed border-stone-900 my-2"></div>

            {/* Order Identifier */}
            <div className="text-center font-black text-xs py-1 bg-stone-200/60 rounded">
              {order.type === 'mesa' ? (
                <span>*** MESA {order.tableNumber} - COMANDA #{order.displayNumber} ***</span>
              ) : order.type === 'delivery' ? (
                <span>*** DELIVERY #{order.displayNumber} ***</span>
              ) : (
                <span>*** BALCÃO #{order.displayNumber} ***</span>
              )}
            </div>

            {isPaid && (
              <div className="text-center text-[10px] font-black text-emerald-800 mt-1 uppercase">
                [ CONTA PAGA - {order.paymentMethod || 'PIX'} ]
              </div>
            )}

            <div className="border-t border-dashed border-stone-900 my-2"></div>

            {/* Items */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] uppercase">
                <span>QTD ITEM</span>
                <span>TOTAL</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.notes && (
                    <p className="text-[10px] text-stone-700 pl-3 italic font-semibold">
                      * OBS: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-900 my-2"></div>

            {/* Totals */}
            <div className="space-y-1 text-right text-[11px]">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>

              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>TAXA ENTREGA:</span>
                  <span>R$ {order.deliveryFee.toFixed(2)}</span>
                </div>
              )}

              {order.discount > 0 && (
                <div className="flex justify-between text-rose-800 font-bold">
                  <span>DESCONTO:</span>
                  <span>- R$ {order.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1 border-t border-stone-800">
                <span>VALOR TOTAL:</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>

              {order.splitCount && order.splitCount > 1 && (
                <div className="flex justify-between text-[10px] font-bold text-stone-700 pt-0.5">
                  <span>DIVIDIDO ({order.splitCount} PESSOAS):</span>
                  <span>R$ {(order.total / order.splitCount).toFixed(2)}/cada</span>
                </div>
              )}
            </div>

            {/* Delivery Customer Details if delivery */}
            {order.type === 'delivery' && order.customer && (
              <>
                <div className="border-t border-dashed border-stone-900 my-2"></div>
                <div className="text-[10px] space-y-0.5">
                  <p className="font-bold uppercase">DADOS DO CLIENTE / ENTREGA:</p>
                  <p>CLIENTE: {order.customer.name}</p>
                  <p>FONE: {order.customer.phone}</p>
                  <p>
                    END: {order.customer.address}, {order.customer.number}
                  </p>
                  {order.customer.complement && <p>COMPL: {order.customer.complement}</p>}
                  <p>BAIRRO: {order.customer.bairro}</p>
                  <p>CEP: {order.customer.cep}</p>
                  {order.customer.reference && <p>REF: {order.customer.reference}</p>}
                </div>
              </>
            )}

            {order.notes && (
              <>
                <div className="border-t border-dashed border-stone-900 my-2"></div>
                <div className="text-[10px]">
                  <span className="font-bold">OBSERVAÇÃO GERAL:</span> {order.notes}
                </div>
              </>
            )}

            <div className="border-t border-dashed border-stone-900 my-2"></div>

            {/* Footer */}
            <div className="text-center text-[9px] space-y-1">
              <p>SISTEMA MARI HAMBURGUERIA</p>
              <p>OBRIGADO PELA PREFERÊNCIA!</p>
              <p>VOLTE SEMPRE 🍔🍟🥤</p>
              <p className="pt-2">--------------------------------</p>
              <p>[ CORTE AQUI ]</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-stone-800 px-4 py-3 flex items-center justify-between border-t border-stone-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-stone-600 text-stone-300 text-xs font-semibold hover:bg-stone-700"
          >
            Fechar
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cupom 80mm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
