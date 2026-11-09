import React, { useState } from 'react';
import {
  Smartphone,
  Utensils,
  Plus,
  Minus,
  ChefHat,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Divide,
  QrCode,
  DollarSign,
  Receipt,
  Users,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Flame,
  X,
  Send,
  SlidersHorizontal,
  Check,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Copy,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { MenuItem, CartItem, Order, RestaurantConfig, Table } from '../types.ts';
import { soundFX } from '../utils/audio.ts';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatedCheckOverlay } from './AnimatedCheckOverlay.tsx';

interface MobileComandaProps {
  config: RestaurantConfig;
  initialTable?: string;
}

export const MobileComanda: React.FC<MobileComandaProps> = ({ config, initialTable = '05' }) => {
  const {
    tables,
    orders,
    menuItems,
    addItemToOrder,
    createOrder,
    updateOrderStatus,
    requestTableBill,
    splitOrderBill,
    transferTable,
    currentEmployee,
    processOrderPayment,
    isOnline,
    pendingOfflineCount,
    syncOfflineQueue,
  } = useBurgerSystem();

  const [selectedTableNumber, setSelectedTableNumber] = useState<string>(initialTable);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'burgers' | 'sides' | 'drinks' | 'desserts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);

  // Staging items for new round of orders
  const [stagedItems, setStagedItems] = useState<CartItem[]>([]);
  const [editingItemForNotes, setEditingItemForNotes] = useState<{ item: MenuItem; notes: string; quantity: number } | null>(null);

  // Drawers and Modals
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetTransferTable, setTargetTransferTable] = useState('');
  const [transferError, setTransferError] = useState('');
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [showWaiterQrModal, setShowWaiterQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Animated check feedback
  const [animatedCheck, setAnimatedCheck] = useState<{
    displayNumber: number;
    status: 'PRONTO' | 'ENTREGUE';
    tableNumber?: string;
  } | null>(null);

  // Selected table and active order
  const activeTable = tables.find((t) => t.number === selectedTableNumber) || tables[0];
  const activeOrder = activeTable?.currentOrderId
    ? orders.find((o) => o.id === activeTable.currentOrderId && o.status !== 'FINALIZADO')
    : orders.find((o) => o.tableNumber === selectedTableNumber && o.status !== 'FINALIZADO');

  const isOrderReady = activeOrder && activeOrder.status === 'PRONTO';

  // Common quick observation chips for waiters
  const QUICK_OBS_CHIPS = [
    'Carne ao ponto',
    'Bem passado',
    'Mal passado',
    'Sem cebola',
    'Sem picles',
    'Sem tomate',
    'Bacon bem crocante',
    'Bacon extra',
    'Maionese à parte',
    'Copo c/ gelo e limão',
    'Sem gelo',
    'Para viagem',
  ];

  // Filtered menu
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.active === false) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Staging handlers
  const handleQuickAddStaged = (item: MenuItem) => {
    soundFX.playSend();
    setStagedItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const handleRemoveStaged = (itemId: string) => {
    setStagedItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.menuItem.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.menuItem.id !== itemId);
    });
  };

  const handleOpenNotes = (item: MenuItem) => {
    const existing = stagedItems.find((i) => i.menuItem.id === item.id);
    setEditingItemForNotes({
      item,
      quantity: existing?.quantity || 1,
      notes: existing?.notes || '',
    });
  };

  const handleSaveNotes = () => {
    if (!editingItemForNotes) return;
    setStagedItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === editingItemForNotes.item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === editingItemForNotes.item.id
            ? { ...i, notes: editingItemForNotes.notes, quantity: editingItemForNotes.quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItem: editingItemForNotes.item,
          quantity: editingItemForNotes.quantity,
          notes: editingItemForNotes.notes,
        },
      ];
    });
    setEditingItemForNotes(null);
  };

  // Dispatch items to Kitchen KDS
  const handleSendToKitchen = () => {
    if (stagedItems.length === 0) return;

    if (activeOrder) {
      // Add each item to existing active comanda
      stagedItems.forEach((ci) => {
        addItemToOrder(activeOrder.id, ci.menuItem, ci.quantity, ci.notes);
      });
    } else {
      // Create new comanda on this table
      createOrder({
        type: 'mesa',
        tableNumber: activeTable.number,
        items: stagedItems,
      });
    }

    soundFX.playKitchenBell();
    setStagedItems([]);
    setShowSummaryDrawer(false);
  };

  // Mark order delivered
  const handleMarkDelivered = () => {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, 'ENTREGUE');
    setAnimatedCheck({
      displayNumber: activeOrder.displayNumber,
      status: 'ENTREGUE',
      tableNumber: activeTable.number,
    });
  };

  // Execute transfer
  const handleTransferTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableNumber || !targetTransferTable) return;
    const ok = transferTable(selectedTableNumber, targetTransferTable);
    if (ok) {
      setSelectedTableNumber(targetTransferTable);
      setShowTransferModal(false);
      setTransferError('');
    } else {
      setTransferError(`Mesa ${targetTransferTable} indisponível ou ocupada.`);
    }
  };

  const stagedTotal = stagedItems.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  const stagedCount = stagedItems.reduce((acc, curr) => acc + curr.quantity, 0);

  // Content of the Mobile Comanda
  const MobileContent = (
    <div className="flex flex-col h-full bg-stone-950 text-stone-100 select-none overflow-hidden relative font-sans">
      {/* Smartphone Status Bar (Simulated) */}
      <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-stone-400 border-b border-stone-800/60 bg-stone-900/90 shrink-0">
        <span className="font-mono text-stone-200">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex items-center gap-1.5">
          {!isOnline ? (
            <span
              className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
              title="Operando offline com persistência no IndexedDB"
            >
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Offline ({pendingOfflineCount})</span>
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Online</span>
            </span>
          )}
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
            📱 Garçom
          </span>
          <span className="text-stone-300">100%</span>
        </div>
      </div>

      {/* Main Header / Table Ribbon */}
      <div className="p-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-2 shrink-0 shadow-md">
        <button
          onClick={() => setShowTableSelector(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-700/80 rounded-xl cursor-pointer transition-all active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shadow-sm">
            {activeTable.number}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1 text-xs font-black text-stone-100">
              <span>MESA {activeTable.number}</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span
              className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                activeTable.status === 'ocupada'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : activeTable.status === 'conta'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              {activeTable.status === 'ocupada'
                ? 'Ocupada'
                : activeTable.status === 'conta'
                ? 'Pedindo Conta'
                : 'Mesa Livre'}
            </span>
          </div>
        </button>

        {/* Waiter / Operator indicator & QR Code Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowWaiterQrModal(true)}
            className="p-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            title="Compartilhar / Acessar QR do Garçom"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold hidden sm:inline">QR</span>
          </button>

          <div className="text-right">
            <p className="text-[10px] text-stone-400">Atendente:</p>
            <p className="text-xs font-bold text-amber-400 truncate max-w-[90px]">
              {currentEmployee?.name.split(' ')[0] || 'Garçom'}
            </p>
          </div>
        </div>
      </div>

      {/* Ready Alert Banner if Order is Ready in Kitchen */}
      {isOrderReady && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 p-2.5 px-3 flex items-center justify-between gap-2 shrink-0 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="w-4 h-4 shrink-0 animate-bounce text-stone-950" />
            <div className="truncate">
              <p className="text-xs font-black leading-tight">PEDIDO PRONTO NA COZINHA!</p>
              <p className="text-[10px] text-stone-900 font-bold truncate">
                Comanda #{activeOrder.displayNumber} na bancada p/ servir
              </p>
            </div>
          </div>
          <button
            onClick={handleMarkDelivered}
            className="px-2.5 py-1 bg-stone-950 text-amber-400 text-xs font-black rounded-lg shadow cursor-pointer active:scale-95 shrink-0"
          >
            Servir!
          </button>
        </div>
      )}

      {/* Category Pills Slider */}
      <div className="px-3 py-2 bg-stone-950 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {[
          { id: 'all' as const, label: 'Tudo', icon: '✨' },
          { id: 'burgers' as const, label: 'Burgers', icon: '🍔' },
          { id: 'sides' as const, label: 'Porções', icon: '🍟' },
          { id: 'drinks' as const, label: 'Bebidas', icon: '🥤' },
          { id: 'desserts' as const, label: 'Doces', icon: '🍦' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="px-3 pt-2 pb-1 bg-stone-950 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lanche, bebida ou porção..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Menu Items Fast-Tap List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredMenuItems.map((item) => {
          const staged = stagedItems.find((i) => i.menuItem.id === item.id);
          const qty = staged?.quantity || 0;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all ${
                qty > 0
                  ? 'bg-amber-950/25 border-amber-500/50 shadow-sm'
                  : 'bg-stone-900/80 border-stone-800/80 hover:border-stone-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleQuickAddStaged(item)}
                >
                  <h4 className="font-bold text-stone-100 text-xs leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                  <span className="font-mono font-bold text-amber-400 text-xs mt-1 block">
                    R$ {item.price.toFixed(2)}
                  </span>
                </div>

                {/* Counter & Obs Controls */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  {qty > 0 ? (
                    <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
                      <button
                        onClick={() => handleRemoveStaged(item.id)}
                        className="w-7 h-7 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 flex items-center justify-center font-bold cursor-pointer active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-xs text-amber-400 w-5 text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleQuickAddStaged(item)}
                        className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 flex items-center justify-center font-bold cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleQuickAddStaged(item)}
                      className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black flex items-center justify-center shadow-sm cursor-pointer active:scale-95"
                      title="Adicionar item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenNotes(item)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer active:scale-95 ${
                      staged?.notes
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                    title="Adicionar observações"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {staged?.notes && (
                <div className="mt-2 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center justify-between">
                  <span>Obs: {staged.notes}</span>
                  <button
                    onClick={() => handleOpenNotes(item)}
                    className="text-amber-400 hover:underline font-bold"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Action Sheet / Cart */}
      <div className="p-3 bg-stone-900 border-t border-stone-800 shrink-0 space-y-2 shadow-2xl">
        {/* Quick Tools Row: Conta, PIX, Dividir, Transferir */}
        <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold">
          <button
            onClick={() => requestTableBill(activeTable.number)}
            className="py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Pedir Conta</span>
          </button>

          <button
            onClick={() => setShowPixModal(true)}
            className="py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>PIX Mesa</span>
          </button>

          <button
            onClick={() => setShowSplitModal(true)}
            className="py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95"
          >
            <Divide className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dividir</span>
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Trocar Mesa</span>
          </button>
        </div>

        {/* Dispatch Button or Current Order Summary */}
        {stagedCount > 0 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummaryDrawer(true)}
              className="py-2.5 px-3 bg-stone-950 border border-stone-800 rounded-xl text-left cursor-pointer flex-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">
                  {stagedCount} novo(s) item(ns)
                </span>
                <span className="font-mono font-black text-stone-100">
                  R$ {stagedTotal.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-stone-400">Toque p/ ver detalhes</p>
            </button>

            <button
              onClick={handleSendToKitchen}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Enviar KDS</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2 py-1 bg-stone-950 rounded-xl border border-stone-800/80 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">Consumo da Mesa:</span>
              <span className="font-mono font-black text-amber-400">
                R$ {(activeOrder?.total || 0).toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => setShowSummaryDrawer(true)}
              className="text-[11px] text-stone-300 hover:text-amber-400 font-bold flex items-center gap-0.5"
            >
              <span>Ver Comanda ({activeOrder?.items.length || 0})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: Table Selector (Mesas 01 a 30) */}
      {/* ========================================================= */}
      {showTableSelector && (
        <div className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 space-y-4 max-h-[85%] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>Selecionar Mesa para Atendimento</span>
              </h3>
              <button
                onClick={() => setShowTableSelector(false)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Legend */}
            <div className="flex items-center justify-around text-[10px] text-stone-400 pb-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-stone-600"></span> Livre
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Ocupada
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Conta
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Pronto!
              </span>
            </div>

            {/* Tables Grid 01 to 30 */}
            <div className="grid grid-cols-5 gap-2.5 overflow-y-auto max-h-72 p-1">
              {tables.map((tbl) => {
                const order = orders.find(
                  (o) => (o.id === tbl.currentOrderId || o.tableNumber === tbl.number) && o.status !== 'FINALIZADO'
                );
                const isReady = order && order.status === 'PRONTO';
                const isSelected = tbl.number === selectedTableNumber;

                return (
                  <button
                    key={tbl.id}
                    onClick={() => {
                      setSelectedTableNumber(tbl.number);
                      setShowTableSelector(false);
                    }}
                    className={`py-3 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-amber-400 bg-amber-500/20'
                        : isReady
                        ? 'bg-amber-950/40 border-amber-400 text-amber-200 animate-pulse'
                        : tbl.status === 'ocupada'
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                        : tbl.status === 'conta'
                        ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {isReady && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    )}
                    <span className="font-mono font-black text-sm">
                      M-{tbl.number}
                    </span>
                    <span className="text-[9px] mt-0.5 font-bold">
                      {order ? `R$ ${Math.round(order.total)}` : 'Livre'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Observations & Item customization */}
      {/* ========================================================= */}
      {editingItemForNotes && (
        <div className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <h4 className="font-bold text-stone-100 text-sm">
                  {editingItemForNotes.item.name}
                </h4>
                <p className="text-[11px] text-amber-400 font-mono font-bold">
                  R$ {editingItemForNotes.item.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setEditingItemForNotes(null)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between bg-stone-950 p-3 rounded-2xl border border-stone-800">
              <span className="text-xs text-stone-300 font-bold">Quantidade:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setEditingItemForNotes((prev) =>
                      prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-stone-800 text-stone-200 flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-base text-amber-400 w-6 text-center">
                  {editingItemForNotes.quantity}
                </span>
                <button
                  onClick={() =>
                    setEditingItemForNotes((prev) =>
                      prev ? { ...prev, quantity: prev.quantity + 1 } : null
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400">
                Atalhos de Observação para Cozinha:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {QUICK_OBS_CHIPS.map((chip) => {
                  const isSelected = editingItemForNotes.notes.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const current = editingItemForNotes.notes;
                        if (current.includes(chip)) {
                          const updated = current
                            .replace(chip, '')
                            .replace(/,\s*,/g, ',')
                            .replace(/^,\s*|,\s*$/g, '')
                            .trim();
                          setEditingItemForNotes({ ...editingItemForNotes, notes: updated });
                        } else {
                          const updated = current ? `${current}, ${chip}` : chip;
                          setEditingItemForNotes({ ...editingItemForNotes, notes: updated });
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-400'
                          : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes text area */}
            <textarea
              value={editingItemForNotes.notes}
              onChange={(e) => setEditingItemForNotes({ ...editingItemForNotes, notes: e.target.value })}
              placeholder="Digite observações personalizadas..."
              rows={2}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />

            <button
              onClick={handleSaveNotes}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow cursor-pointer active:scale-95"
            >
              Confirmar Item
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: Comanda Summary & Active Orders */}
      {/* ========================================================= */}
      {showSummaryDrawer && (
        <div className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 space-y-4 max-h-[85%] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Extrato da Mesa {activeTable.number}</span>
              </h3>
              <button
                onClick={() => setShowSummaryDrawer(false)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Active Sent Items */}
              {activeOrder && activeOrder.items.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Itens já enviados à Cozinha ({activeOrder.status}):
                  </span>
                  {activeOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-stone-200">
                          {it.quantity}x {it.name}
                        </p>
                        {it.notes && (
                          <p className="text-[10px] text-amber-400/90 italic">
                            * {it.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-stone-200">
                        R$ {(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 py-2">
                  Nenhum item lançado anteriormente nesta mesa.
                </p>
              )}

              {/* Newly Staged Items */}
              {stagedItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    Novos Itens a Enviar agora:
                  </span>
                  {stagedItems.map((ci, idx) => (
                    <div
                      key={idx}
                      className="bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-amber-200">
                          {ci.quantity}x {ci.menuItem.name}
                        </p>
                        {ci.notes && (
                          <p className="text-[10px] text-amber-400 italic">
                            * {ci.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-amber-400">
                        R$ {(ci.menuItem.price * ci.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Footer */}
            <div className="pt-2 border-t border-stone-800 space-y-2">
              <div className="flex justify-between items-center text-sm font-black">
                <span className="text-stone-300">Total Geral:</span>
                <span className="text-amber-400 font-mono text-base">
                  R$ {((activeOrder?.total || 0) + stagedTotal).toFixed(2)}
                </span>
              </div>

              {stagedItems.length > 0 && (
                <button
                  onClick={handleSendToKitchen}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Novos Itens p/ Cozinha</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: PIX Cobrança na Mesa pelo Celular do Garçom */}
      {/* ========================================================= */}
      {showPixModal && (
        <div className="absolute inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-stone-100 text-sm text-left">
                  Cobrar PIX na Mesa {activeTable.number}
                </h4>
              </div>
              <button
                onClick={() => setShowPixModal(false)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Aproxime este QR Code do cliente para pagamento instantâneo:
            </p>

            <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-xl">
              <QRCodeSVG
                value={`00020126580014br.gov.bcb.pix0136pix@minhahamburgueria.com.br520400005303986540${(
                  activeOrder?.total || 10
                ).toFixed(2)}5802BR5925HAMBURGUERIA ARTESANAL6009SAO PAULO62070503***6304ABCD`}
                size={160}
              />
            </div>

            <div className="font-mono font-black text-xl text-amber-400">
              R$ {(activeOrder?.total || 0).toFixed(2)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeOrder) {
                    processOrderPayment(activeOrder.id, 'PIX');
                  }
                  setShowPixModal(false);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Pagamento PIX</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: Split Bill Calculator */}
      {/* ========================================================= */}
      {showSplitModal && (
        <div className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <Divide className="w-4 h-4 text-cyan-400" />
                <span>Dividir Conta da Mesa {activeTable.number}</span>
              </h4>
              <button
                onClick={() => setShowSplitModal(false)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className="text-xs text-stone-400">Total da Comanda:</span>
              <p className="font-mono font-black text-xl text-amber-400">
                R$ {(activeOrder?.total || 0).toFixed(2)}
              </p>
            </div>

            <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-300 font-bold">Pessoas na mesa:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSplitCount((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg bg-stone-800 text-stone-200 flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-base text-cyan-400 w-6 text-center">
                  {splitCount}
                </span>
                <button
                  onClick={() => setSplitCount((c) => c + 1)}
                  className="w-8 h-8 rounded-lg bg-cyan-600 text-stone-100 flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl text-center space-y-1">
              <span className="text-xs text-cyan-300">Valor individual por pessoa:</span>
              <p className="font-mono font-black text-2xl text-cyan-400">
                R$ {((activeOrder?.total || 0) / splitCount).toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => {
                if (activeOrder) splitOrderBill(activeOrder.id, splitCount);
                setShowSplitModal(false);
              }}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black text-xs rounded-xl shadow cursor-pointer active:scale-95"
            >
              Aplicar Divisão na Comanda
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: Transfer Table */}
      {/* ========================================================= */}
      {showTransferModal && (
        <div className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                <span>Transferir Mesa {activeTable.number}</span>
              </h4>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferTable} className="space-y-3">
              <label className="text-xs text-stone-300 font-bold block">
                Número da Nova Mesa (01 a 30):
              </label>
              <input
                type="text"
                value={targetTransferTable}
                onChange={(e) => setTargetTransferTable(e.target.value.padStart(2, '0'))}
                placeholder="Ex: 08"
                maxLength={2}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 font-mono text-center focus:outline-none focus:border-indigo-500"
              />

              {transferError && (
                <p className="text-xs text-rose-400 font-bold">{transferError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-stone-100 font-black text-xs rounded-xl shadow cursor-pointer active:scale-95"
              >
                Confirmar Transferência
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: Waiter QR Code Direct Access */}
      {/* ========================================================= */}
      {showWaiterQrModal && (
        <div className="absolute inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center p-3 animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-2xl max-w-sm mx-auto w-full text-center">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h4 className="font-black text-stone-100 text-sm">
                  QR Acesso Garçom Pocket
                </h4>
              </div>
              <button
                onClick={() => setShowWaiterQrModal(false)}
                className="text-stone-400 hover:text-stone-100 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Aponte a câmera do celular para abrir esta comanda móvel em qualquer smartphone da equipe:
            </p>

            <div className="p-4 bg-white rounded-2xl border-4 border-emerald-500/40 inline-block mx-auto shadow-inner">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? `${window.location.origin}/?garcom=1` : 'https://mariburger.com.br/?garcom=1'}
                size={170}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={async () => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/?garcom=1` : '';
                  try {
                    await navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  } catch {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copiado com Sucesso!' : 'Copiar Link da Comanda'}</span>
              </button>

              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? `${window.location.origin}/?garcom=1` : '';
                  const shareText = encodeURIComponent(`📲 Link Garçom Pocket (${config.restaurantName}):\n${url}`);
                  window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
                }}
                className="w-full py-2 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animated Check Overlay */}
      {animatedCheck && (
        <AnimatedCheckOverlay
          orderDisplayNumber={animatedCheck.displayNumber}
          status={animatedCheck.status}
          tableNumber={animatedCheck.tableNumber}
          type="mesa"
          onClose={() => setAnimatedCheck(null)}
        />
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top Controller Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-100">
                Comanda Mobile para Celular
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                Garçom Pocket
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Interface tátil projetada para smartphones de garçons e atendentes lançarem comandas direto na mesa
            </p>
          </div>
        </div>

        {/* View Mode Toggle & QR Share */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowWaiterQrModal(true)}
            className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>QR Code Garçom</span>
          </button>

          <button
            onClick={() => setDeviceFrameMode(!deviceFrameMode)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {deviceFrameMode ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Tela Cheia</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Celular (Moldura)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container: either smartphone mockup or full responsive container */}
      {deviceFrameMode ? (
        <div className="flex justify-center py-2">
          {/* Smartphone Hardware Frame */}
          <div className="relative w-full max-w-[390px] h-[780px] bg-stone-900 rounded-[50px] p-3 shadow-2xl border-4 border-stone-800 ring-1 ring-stone-700/50 flex flex-col overflow-hidden">
            {/* Dynamic Island / Speaker Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-stone-950 rounded-full z-40 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800"></span>
            </div>

            {/* Inner Mobile Screen */}
            <div className="w-full h-full rounded-[38px] overflow-hidden flex flex-col relative bg-stone-950 border border-stone-800">
              {MobileContent}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl mx-auto h-[740px] rounded-3xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-950">
          {MobileContent}
        </div>
      )}
    </div>
  );
};
