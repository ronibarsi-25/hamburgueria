import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Printer, CheckCircle2, Flame, Bike, Utensils, Bell, Volume2, Sparkles, Filter, MessageSquare, Copy, Check, Send } from 'lucide-react';
import { Order, OrderStatus, RestaurantConfig } from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { soundFX } from '../utils/audio.ts';
import { ThermalPrintModal } from './ThermalPrintModal.tsx';
import { AnimatedCheckOverlay } from './AnimatedCheckOverlay.tsx';

interface KitchenKDSProps {
  config: RestaurantConfig;
}

export const KitchenKDS: React.FC<KitchenKDSProps> = ({ config }) => {
  const { orders, updateOrderStatus, notifyAttendantOrderReady } = useBurgerSystem();
  const [selectedType, setSelectedType] = useState<'all' | 'mesa' | 'delivery'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [lastNotifiedOrderId, setLastNotifiedOrderId] = useState<string | null>(null);
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [now, setNow] = useState<number>(Date.now());
  const [animatedCheckOrder, setAnimatedCheckOrder] = useState<{
    displayNumber: number;
    status: 'PRONTO' | 'ENTREGUE';
    tableNumber?: string;
    type?: 'mesa' | 'delivery' | 'balcao';
  } | null>(null);

  const handleSetStatusWithCheck = (order: Order, newStatus: OrderStatus) => {
    updateOrderStatus(order.id, newStatus);
    if (newStatus === 'PRONTO') {
      notifyAttendantOrderReady(order);
      setLastNotifiedOrderId(order.id);
      setTimeout(() => {
        setLastNotifiedOrderId((prev) => (prev === order.id ? null : prev));
      }, 3500);
    }
    if (newStatus === 'PRONTO' || newStatus === 'ENTREGUE') {
      setAnimatedCheckOrder({
        displayNumber: order.displayNumber,
        status: newStatus,
        tableNumber: order.tableNumber,
        type: order.type,
      });
    }
  };

  const handleCallAttendant = (order: Order) => {
    notifyAttendantOrderReady(order);
    setLastNotifiedOrderId(order.id);
    setTimeout(() => {
      setLastNotifiedOrderId((prev) => (prev === order.id ? null : prev));
    }, 3500);
  };

  const getWhatsAppMessage = (order: Order) => {
    const isMesa = order.type === 'mesa';
    const target = isMesa ? `MESA ${order.tableNumber}` : order.customer?.name ? `Delivery (${order.customer.name})` : 'Balcão / Viagem';
    const itemsList = order.items.map((i) => `• ${i.quantity}x ${i.name}${i.notes ? ` (Obs: ${i.notes})` : ''}`).join('\n');
    return `🔔 *PEDIDO PRONTO NA COZINHA!* 🍔🍟\n\n*Destino:* ${target}\n*Comanda:* #${order.displayNumber}\n*Itens:*\n${itemsList}\n\n👉 *Atendente/Garçom:* favor retirar na bancada e servir aos clientes!`;
  };

  const handleCopyWhatsApp = (order: Order) => {
    const text = getWhatsAppMessage(order);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Update timer ticks every 10 seconds for real-time wait time calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getMinutesElapsed = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    return Math.max(0, Math.floor((now - created) / 60000));
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (selectedType !== 'all' && o.type !== selectedType) return false;
    if (statusFilter === 'active') {
      return o.status === 'NOVO' || o.status === 'EM PREPARO' || o.status === 'PRONTO';
    }
    return true;
  });

  const activeOrdersCount = orders.filter((o) => o.status === 'NOVO' || o.status === 'EM PREPARO').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'PRONTO').length;

  const handleTestBell = () => {
    soundFX.playKitchenBell();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* KDS Control Ribbon */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100">KDS · Tela da Cozinha</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Fila de produção em tempo real com alerta sonoro e impressão térmica 80mm
            </p>
          </div>
        </div>

        {/* Filters and Sound Alert */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTestBell}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Tocar sino sonoro de novo pedido"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alerta Sonoro</span>
          </button>

          {/* Type Filter */}
          <div className="bg-stone-950 p-1 rounded-xl border border-stone-800 flex items-center text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedType === 'all' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Todos ({orders.filter(o => o.status !== 'FINALIZADO').length})
            </button>
            <button
              onClick={() => setSelectedType('mesa')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedType === 'mesa' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Salão</span>
            </button>
            <button
              onClick={() => setSelectedType('delivery')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedType === 'delivery' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bike className="w-3 h-3" />
              <span>Delivery</span>
            </button>
          </div>

          {/* Status Tab */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-stone-800 border-stone-700 text-stone-300'
            }`}
          >
            {statusFilter === 'active' ? 'Pendentes & Prontos' : 'Ver Todos c/ Histórico'}
          </button>
        </div>
      </div>

      {/* KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-stone-400">Na Chapa / Fila:</span>
          <span className="font-bold text-amber-400 font-mono text-base">{activeOrdersCount}</span>
        </div>
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-stone-400">Prontos p/ Servir:</span>
          <span className="font-bold text-emerald-400 font-mono text-base">{readyOrdersCount}</span>
        </div>
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-stone-400">Mesas c/ Pedido:</span>
          <span className="font-bold text-stone-100 font-mono text-base">
            {orders.filter(o => o.type === 'mesa' && o.status !== 'FINALIZADO').length}
          </span>
        </div>
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-stone-400">Delivery em Rota:</span>
          <span className="font-bold text-sky-400 font-mono text-base">
            {orders.filter(o => o.type === 'delivery' && o.status === 'SAIU_ENTREGA').length}
          </span>
        </div>
      </div>

      {/* KDS Order Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-stone-900/40 border border-stone-800 border-dashed rounded-2xl p-12 text-center space-y-2">
          <ChefHat className="w-10 h-10 text-stone-600 mx-auto" />
          <h3 className="text-stone-300 font-bold text-sm">Nenhum pedido pendente na cozinha</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Quando um cliente enviar o pedido pela mesa, delivery ou WhatsApp, ele aparecerá aqui instantaneamente com aviso sonoro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => {
            const minutes = getMinutesElapsed(order.createdAt);
            const isLate = minutes >= 20;
            const isWarning = minutes >= 10 && minutes < 20;

            const isMesa = order.type === 'mesa';
            const orderTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={order.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                  order.status === 'NOVO'
                    ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                    : order.status === 'EM PREPARO'
                    ? 'bg-stone-900/90 border-stone-700'
                    : order.status === 'PRONTO'
                    ? 'bg-emerald-950/20 border-emerald-500/50'
                    : 'bg-stone-950/60 border-stone-800 opacity-70'
                }`}
              >
                {/* Header */}
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between ${
                    order.status === 'NOVO'
                      ? 'bg-amber-500/20 border-amber-500/40'
                      : order.status === 'PRONTO'
                      ? 'bg-emerald-500/20 border-emerald-500/40'
                      : 'bg-stone-800/80 border-stone-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-stone-100 text-sm font-mono">
                        #{order.displayNumber}
                      </span>
                      {isMesa ? (
                        <span className="bg-amber-500 text-stone-950 font-black text-xs px-2 py-0.5 rounded-md">
                          MESA {order.tableNumber}
                        </span>
                      ) : (
                        <span className="bg-sky-500 text-stone-950 font-black text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Bike className="w-3 h-3" />
                          <span>DELIVERY</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {order.id} · {orderTime}
                    </p>
                  </div>

                  {/* Timer Badge */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                      isLate
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{minutes}m</span>
                  </div>
                </div>

                {/* Items Body */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="space-y-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="border-b border-stone-800/60 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-stone-100 text-sm leading-snug">
                            <span className="text-amber-400 font-mono text-base mr-1.5">
                              {item.quantity}x
                            </span>
                            {item.name}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="mt-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                            Obs: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-400">
                      <span className="text-amber-400 font-bold">Obs Geral:</span> {order.notes}
                    </div>
                  )}

                  {/* Delivery Address snippet if delivery */}
                  {order.type === 'delivery' && order.customer && (
                    <div className="text-[11px] text-stone-400 pt-1 border-t border-stone-800">
                      <p className="font-bold text-stone-300 truncate">
                        Cliente: {order.customer.name}
                      </p>
                      <p className="truncate">
                        {order.customer.address}, {order.customer.number} - {order.customer.bairro}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Controls & Thermal Print */}
                <div className="p-3 bg-stone-900 border-t border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400 pb-1">
                    <span>Status Atual:</span>
                    <span
                      className={`font-black uppercase text-[10px] px-2 py-0.5 rounded ${
                        order.status === 'NOVO'
                          ? 'bg-amber-500/20 text-amber-400'
                          : order.status === 'EM PREPARO'
                          ? 'bg-blue-500/20 text-blue-400'
                          : order.status === 'PRONTO'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Thermal Print Button */}
                    <button
                      onClick={() => setPrintingOrder(order)}
                      className="py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Imprimir comanda térmica 80mm"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Imprimir</span>
                    </button>

                    {/* Status Step Button */}
                    {order.status === 'NOVO' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'EM PREPARO')}
                        className="py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Na Chapa</span>
                      </button>
                    )}

                    {order.status === 'EM PREPARO' && (
                      <button
                        onClick={() => handleSetStatusWithCheck(order, 'PRONTO')}
                        className="py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pronto!</span>
                      </button>
                    )}

                    {order.status === 'PRONTO' && (
                      <button
                        onClick={() => handleSetStatusWithCheck(order, order.type === 'delivery' ? 'SAIU_ENTREGA' : 'ENTREGUE')}
                        className="py-1.5 px-2 bg-stone-700 hover:bg-stone-600 text-stone-100 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{order.type === 'delivery' ? 'Expedir Motoboy' : 'Servir Mesa'}</span>
                      </button>
                    )}

                    {(order.status === 'SAIU_ENTREGA' || order.status === 'ENTREGUE') && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'FINALIZADO')}
                        className="py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Arquivar</span>
                      </button>
                    )}
                  </div>

                  {/* Dedicated Attendant / Waiter Call for PRONTO orders */}
                  {order.status === 'PRONTO' && (
                    <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
                      <button
                        onClick={() => handleCallAttendant(order)}
                        className={`w-full py-2 px-3 text-xs font-black rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                          lastNotifiedOrderId === order.id
                            ? 'bg-emerald-500 text-stone-950 border-emerald-400 scale-[1.02]'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 hover:border-amber-400'
                        }`}
                        title="Tocar sino e emitir alerta no sistema para o atendente"
                      >
                        <Bell className={`w-3.5 h-3.5 ${lastNotifiedOrderId === order.id ? 'animate-bounce' : 'animate-pulse'}`} />
                        <span>
                          {lastNotifiedOrderId === order.id
                            ? '✓ Atendente Chamado!'
                            : isMesa
                            ? `📢 Chamar Garçom (Mesa ${order.tableNumber})`
                            : '📢 Avisar Balcão / Motoboy'}
                        </span>
                      </button>
                      <button
                        onClick={() => setWhatsAppModalOrder(order)}
                        className="w-full py-1 text-[11px] text-stone-400 hover:text-emerald-400 hover:bg-stone-800/50 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>Aviso WhatsApp Atendente</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Animated Check Overlay for PRONTO / ENTREGUE */}
      {animatedCheckOrder && (
        <AnimatedCheckOverlay
          orderDisplayNumber={animatedCheckOrder.displayNumber}
          status={animatedCheckOrder.status}
          tableNumber={animatedCheckOrder.tableNumber}
          type={animatedCheckOrder.type}
          onClose={() => setAnimatedCheckOrder(null)}
        />
      )}

      {/* WhatsApp Attendant Notification Modal */}
      {whatsAppModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 text-sm">
                    Avisar Atendente via WhatsApp
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Comanda #{whatsAppModalOrder.displayNumber} ·{' '}
                    {whatsAppModalOrder.type === 'mesa'
                      ? `Mesa ${whatsAppModalOrder.tableNumber}`
                      : 'Delivery'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalOrder(null)}
                className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300">
                Texto do Aviso Formatado:
              </label>
              <pre className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 whitespace-pre-wrap font-sans leading-relaxed select-all">
                {getWhatsAppMessage(whatsAppModalOrder)}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={() => handleCopyWhatsApp(whatsAppModalOrder)}
                className="w-full sm:flex-1 py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Copiar Mensagem</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  handleCallAttendant(whatsAppModalOrder);
                  setWhatsAppModalOrder(null);
                }}
                className="w-full sm:flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Bell className="w-4 h-4" />
                <span>Disparar Alerta Sonoro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Thermal Print Modal */}
      {printingOrder && (
        <ThermalPrintModal
          order={printingOrder}
          config={config}
          onClose={() => setPrintingOrder(null)}
          title={`Impressão de Comanda Cozinha #${printingOrder.displayNumber}`}
        />
      )}
    </div>
  );
};
