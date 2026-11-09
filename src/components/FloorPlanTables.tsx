import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Users,
  Clock,
  Printer,
  ArrowRightLeft,
  Divide,
  Percent,
  CheckCircle2,
  DollarSign,
  QrCode,
  CreditCard,
  Banknote,
  X,
  FileText,
  AlertCircle,
  Bell,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { Table, Order, MenuItem, PaymentMethod, RestaurantConfig } from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { ThermalPrintModal } from './ThermalPrintModal.tsx';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatedCheckOverlay } from './AnimatedCheckOverlay.tsx';
import { soundFX } from '../utils/audio.ts';

interface FloorPlanTablesProps {
  config: RestaurantConfig;
  onOpenTableMenu: (tableNumber: string) => void;
}

export const FloorPlanTables: React.FC<FloorPlanTablesProps> = ({ config, onOpenTableMenu }) => {
  const {
    tables,
    orders,
    menuItems,
    addItemToOrder,
    transferTable,
    applyOrderDiscount,
    splitOrderBill,
    requestTableBill,
    processOrderPayment,
    updateOrderStatus,
    createOrder,
    addTable,
    deleteTable,
  } = useBurgerSystem();

  const [selectedTableNumber, setSelectedTableNumber] = useState<string | null>('05');
  const [filterStatus, setFilterStatus] = useState<'all' | 'livre' | 'ocupada' | 'conta'>('all');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [animatedCheckOrder, setAnimatedCheckOrder] = useState<{
    displayNumber: number;
    status: 'PRONTO' | 'ENTREGUE';
    tableNumber?: string;
  } | null>(null);

  // Table management states (Add / Delete)
  const [isAddingTableModal, setIsAddingTableModal] = useState(false);
  const [newTableNumberInput, setNewTableNumberInput] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [tableActionError, setTableActionError] = useState('');
  const [confirmDeleteTableNum, setConfirmDeleteTableNum] = useState<string | null>(null);

  // Drawer modal states
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [targetTransferTable, setTargetTransferTable] = useState('');
  const [transferError, setTransferError] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitPeople, setSplitPeople] = useState(2);
  const [isDiscounting, setIsDiscounting] = useState(false);
  const [discountVal, setDiscountVal] = useState('10.00');
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('PIX');
  const [receivedCash, setReceivedCash] = useState('');

  // Selected table & associated active order
  const activeTable = tables.find((t) => t.number === selectedTableNumber);
  const activeOrder = activeTable?.currentOrderId
    ? orders.find((o) => o.id === activeTable.currentOrderId && o.status !== 'FINALIZADO')
    : orders.find((o) => o.tableNumber === selectedTableNumber && o.status !== 'FINALIZADO');

  // Stats
  const countLivre = tables.filter((t) => t.status === 'livre').length;
  const countOcupada = tables.filter((t) => t.status === 'ocupada').length;
  const countConta = tables.filter((t) => t.status === 'conta').length;
  const totalOpenValue = orders
    .filter((o) => o.type === 'mesa' && o.status !== 'FINALIZADO')
    .reduce((acc, curr) => acc + curr.total, 0);

  const filteredTables = tables.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const handleSelectTable = (num: string) => {
    setSelectedTableNumber(num);
    setIsAddingItems(false);
    setIsTransferring(false);
    setIsSplitting(false);
    setIsDiscounting(false);
    setIsPaying(false);
    setTransferError('');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableNumber || !targetTransferTable) return;
    const ok = transferTable(selectedTableNumber, targetTransferTable);
    if (ok) {
      setSelectedTableNumber(targetTransferTable);
      setIsTransferring(false);
      setTransferError('');
    } else {
      setTransferError(`A Mesa ${targetTransferTable} não está disponível ou já está ocupada.`);
    }
  };

  const handleAddQuickItem = (menuItem: MenuItem) => {
    if (!activeTable) return;

    if (activeOrder) {
      addItemToOrder(activeOrder.id, menuItem, 1);
    } else {
      // Create new comanda on this table
      createOrder({
        type: 'mesa',
        tableNumber: activeTable.number,
        items: [{ menuItem, quantity: 1 }],
      });
    }
  };

  const handleConfirmDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    const val = parseFloat(discountVal) || 0;
    applyOrderDiscount(activeOrder.id, val);
    setIsDiscounting(false);
  };

  const handleConfirmSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    splitOrderBill(activeOrder.id, splitPeople);
    setIsSplitting(false);
  };

  const handleStatusChangeWithCheck = (newStatus: 'PRONTO' | 'ENTREGUE') => {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, newStatus);
    setAnimatedCheckOrder({
      displayNumber: activeOrder.displayNumber,
      status: newStatus,
      tableNumber: activeTable?.number,
    });
  };

  const handleConfirmPayment = () => {
    if (!activeOrder) return;
    const orderNum = activeOrder.displayNumber;
    const tblNum = activeTable?.number;
    processOrderPayment(activeOrder.id, selectedPaymentMethod);
    setIsPaying(false);
    setAnimatedCheckOrder({
      displayNumber: orderNum,
      status: 'ENTREGUE',
      tableNumber: tblNum,
    });
  };

  const handleOpenAddTableModal = () => {
    const numericNumbers = tables
      .map((t) => parseInt(t.number, 10))
      .filter((n) => !isNaN(n));
    const maxNum = numericNumbers.length > 0 ? Math.max(...numericNumbers) : tables.length;
    const nextNum = (maxNum + 1).toString().padStart(2, '0');
    setNewTableNumberInput(nextNum);
    setNewTableCapacity(4);
    setTableActionError('');
    setIsAddingTableModal(true);
  };

  const handleConfirmAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTableNumberInput.trim();
    if (!trimmed) {
      setTableActionError('Informe o número ou identificador da mesa.');
      return;
    }
    const exists = tables.some((t) => t.number.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setTableActionError(`A Mesa "${trimmed}" já existe no salão.`);
      return;
    }
    const created = addTable({
      number: trimmed,
      peopleCount: newTableCapacity > 0 ? newTableCapacity : 4,
    });
    setIsAddingTableModal(false);
    setSelectedTableNumber(created.number);
    setTableActionError('');
  };

  const handleDeleteTable = (tableNum: string) => {
    const res = deleteTable(tableNum);
    if (!res.success) {
      setTableActionError(res.message);
    } else {
      setConfirmDeleteTableNum(null);
      setTableActionError('');
      const remaining = tables.filter((t) => t.number !== tableNum);
      setSelectedTableNumber(remaining.length > 0 ? remaining[0].number : null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Salão Header & Summary Strip */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-stone-100">
              Salão · Gestão de Mesas e Comandas
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Mapa visual das {tables.length} mesas com comanda aberta, controle total (incluir/deletar), divisão e caixa
          </p>
        </div>

        {/* Status Filter Buttons & Add Table Action */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Todas ({tables.length})
          </button>
          <button
            onClick={() => setFilterStatus('livre')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'livre'
                ? 'bg-stone-700 text-stone-100 shadow-sm'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-stone-500"></span>
            <span>Livres ({countLivre})</span>
          </button>
          <button
            onClick={() => setFilterStatus('ocupada')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'ocupada'
                ? 'bg-emerald-600 text-stone-100 shadow-sm'
                : 'bg-stone-800 text-emerald-400 hover:bg-stone-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Ocupadas ({countOcupada})</span>
          </button>
          <button
            onClick={() => setFilterStatus('conta')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'conta'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-amber-400 hover:bg-stone-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Pedindo Conta ({countConta})</span>
          </button>

          <button
            onClick={handleOpenAddTableModal}
            className="px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1.5 shadow-md ml-auto"
            title="Adicionar nova mesa ao salão"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Incluir Mesa</span>
          </button>
        </div>
      </div>

      {/* Main Floor Grid & Table Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Plan Map (2 cols) */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
            <span className="font-bold text-stone-300 uppercase tracking-wider">
              Disposição das Mesas do Salão
            </span>
            <span className="text-stone-400">
              Total em Consumo:{' '}
              <strong className="text-amber-400 font-mono text-sm">
                R$ {totalOpenValue.toFixed(2)}
              </strong>
            </span>
          </div>

          {/* 30 Tables Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {filteredTables.map((t) => {
              const isSelected = t.number === selectedTableNumber;
              const order = orders.find(
                (o) => (o.id === t.currentOrderId || o.tableNumber === t.number) && o.status !== 'FINALIZADO'
              );
              const isReady = order && order.status === 'PRONTO';

              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTable(t.number)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between h-24 relative group ${
                    isSelected
                      ? 'ring-2 ring-amber-400 shadow-xl scale-105 z-10'
                      : ''
                  } ${
                    isReady
                      ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20 text-amber-100 animate-pulse'
                      : t.status === 'ocupada'
                      ? 'bg-emerald-950/40 border-emerald-500/60 hover:bg-emerald-900/40 text-emerald-100'
                      : t.status === 'conta'
                      ? 'bg-amber-950/40 border-amber-500/70 hover:bg-amber-900/40 text-amber-100 animate-pulse'
                      : 'bg-stone-900/70 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  {isReady && (
                    <div className="absolute -top-2 -right-1 bg-amber-500 text-stone-950 font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg border border-stone-950 animate-bounce z-20">
                      <Bell className="w-2.5 h-2.5" />
                      <span>PRONTO!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between w-full">
                    <span className="font-black text-xs font-mono">
                      M-{t.number}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isReady
                          ? 'bg-amber-400 animate-ping'
                          : t.status === 'ocupada'
                          ? 'bg-emerald-400'
                          : t.status === 'conta'
                          ? 'bg-amber-400'
                          : 'bg-stone-600'
                      }`}
                    ></span>
                  </div>

                  {order ? (
                    <div className="text-left w-full">
                      <p className="font-black text-xs text-amber-400 font-mono truncate">
                        R$ {order.total.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-stone-400 truncate">
                        {order.items.reduce((acc, i) => acc + i.quantity, 0)} itens
                      </p>
                    </div>
                  ) : (
                    <div className="text-stone-500 text-[11px] font-medium py-1">
                      Livre
                    </div>
                  )}

                  <div className="text-[10px] text-stone-400 flex items-center justify-between w-full pt-1 border-t border-stone-800/60">
                    <span>{t.openedAt || '--:--'}</span>
                    {t.peopleCount ? (
                      <span className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {t.peopleCount}
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Comanda Inspector (1 col) */}
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          {activeTable ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-amber-500 text-stone-950 font-black text-sm rounded-lg">
                    MESA {activeTable.number}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
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
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activeTable.openedAt || 'Sem horário'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTableActionError('');
                      setConfirmDeleteTableNum(activeTable.number);
                    }}
                    className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg border border-stone-800 hover:border-rose-800/40 transition-colors cursor-pointer"
                    title={`Excluir Mesa ${activeTable.number}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Comanda Items or Empty State */}
              {activeOrder ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="font-bold">Comanda #{activeOrder.displayNumber}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-800 text-amber-300 border border-stone-700">
                        {activeOrder.status}
                      </span>
                      {activeOrder.status === 'EM PREPARO' && (
                        <button
                          onClick={() => handleStatusChangeWithCheck('PRONTO')}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Pronto!
                        </button>
                      )}
                      {activeOrder.status === 'PRONTO' && (
                        <button
                          onClick={() => handleStatusChangeWithCheck('ENTREGUE')}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Servir Mesa!
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ready alert notification for attendant/waiter */}
                  {activeOrder.status === 'PRONTO' && (
                    <div className="p-3 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 space-y-2 shadow-lg shadow-amber-500/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                          <Bell className="w-4 h-4 animate-bounce" />
                          <span>PEDIDO PRONTO NA COZINHA!</span>
                        </div>
                        <span className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-black">
                          EXPEDIÇÃO
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-200 leading-snug">
                        O pedido da <strong>Mesa {activeTable.number}</strong> está finalizado na bancada da cozinha aguardando o garçom para servir.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleStatusChangeWithCheck('ENTREGUE')}
                          className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Servir aos Clientes</span>
                        </button>
                        <button
                          onClick={() => soundFX.playOrderReadyAlert()}
                          className="py-1.5 px-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Tocar sino sonoro novamente"
                        >
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sino</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {activeOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-stone-200">
                            {item.quantity}x {item.name}
                          </p>
                          {item.notes && (
                            <p className="text-[10px] text-amber-400/90 italic">
                              * {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-mono font-bold text-amber-400">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="bg-stone-900 p-3 rounded-xl border border-stone-800 space-y-1 text-xs">
                    <div className="flex justify-between text-stone-400">
                      <span>Subtotal</span>
                      <span className="font-mono">R$ {activeOrder.subtotal.toFixed(2)}</span>
                    </div>

                    {activeOrder.discount > 0 && (
                      <div className="flex justify-between text-rose-400 font-bold">
                        <span>Desconto</span>
                        <span className="font-mono">- R$ {activeOrder.discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-stone-100 font-extrabold text-sm pt-1 border-t border-stone-800">
                      <span>Total da Mesa</span>
                      <span className="font-mono text-amber-400">R$ {activeOrder.total.toFixed(2)}</span>
                    </div>

                    {activeOrder.splitCount && activeOrder.splitCount > 1 && (
                      <div className="flex justify-between text-stone-300 font-bold text-[11px] pt-1">
                        <span>Dividido por {activeOrder.splitCount} pessoas:</span>
                        <span className="font-mono text-emerald-400">
                          R$ {(activeOrder.total / activeOrder.splitCount).toFixed(2)} / cada
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-stone-900/40 p-6 rounded-xl border border-dashed border-stone-800 text-center space-y-2">
                  <p className="text-xs text-stone-400">Esta mesa está livre no momento.</p>
                  <p className="text-[11px] text-stone-500">
                    O cliente pode escanear o QR da mesa ou você pode lançar itens pelo botão abaixo.
                  </p>
                  <button
                    onClick={() => onOpenTableMenu(activeTable.number)}
                    className="mt-2 text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    Abrir Cardápio Digital da Mesa {activeTable.number} ➔
                  </button>
                </div>
              )}

              {/* Fast Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <button
                  onClick={() => setIsAddingItems(!isAddingItems)}
                  className="py-2 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl font-bold text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Lançar Itens</span>
                </button>

                <button
                  onClick={() => setIsTransferring(!isTransferring)}
                  disabled={!activeOrder}
                  className="py-2 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 disabled:opacity-40 rounded-xl font-bold text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                  <span>Transferir</span>
                </button>

                <button
                  onClick={() => setIsSplitting(!isSplitting)}
                  disabled={!activeOrder}
                  className="py-2 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 disabled:opacity-40 rounded-xl font-bold text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Divide className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dividir Conta</span>
                </button>

                <button
                  onClick={() => setIsDiscounting(!isDiscounting)}
                  disabled={!activeOrder}
                  className="py-2 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 disabled:opacity-40 rounded-xl font-bold text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span>Desconto</span>
                </button>
              </div>

              {/* Sub-form: Add Items (Waiter Quick Picker) */}
              {isAddingItems && (
                <div className="bg-stone-900 p-3 rounded-xl border border-amber-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-200">
                    <span>Lançamento Rápido de Itens</span>
                    <button onClick={() => setIsAddingItems(false)} className="text-stone-400 hover:text-stone-100">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {(menuItems && menuItems.length > 0 ? menuItems : config.featuredItems)
                      .filter((item) => item.active !== false)
                      .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-stone-950 rounded-lg text-xs hover:border-amber-500/40 border border-transparent"
                      >
                        <div>
                          <p className="font-bold text-stone-200">{item.name}</p>
                          <p className="text-[10px] text-amber-400 font-mono">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleAddQuickItem(item)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-md text-xs cursor-pointer"
                        >
                          + Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-form: Transfer Table */}
              {isTransferring && (
                <form
                  onSubmit={handleExecuteTransfer}
                  className="bg-stone-900 p-3 rounded-xl border border-sky-500/30 space-y-2 animate-in fade-in text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-stone-200">
                    <span>Transferir Comanda para Outra Mesa</span>
                    <button type="button" onClick={() => setIsTransferring(false)} className="text-stone-400">
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={targetTransferTable}
                      onChange={(e) => setTargetTransferTable(e.target.value)}
                      className="flex-1 bg-stone-950 border border-stone-800 text-stone-200 rounded-lg px-2.5 py-1.5 outline-none"
                      required
                    >
                      <option value="">Selecione a mesa destino...</option>
                      {tables
                        .filter((t) => t.status === 'livre' && t.number !== activeTable.number)
                        .map((t) => (
                          <option key={t.id} value={t.number}>
                            Mesa {t.number} (Livre)
                          </option>
                        ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold rounded-lg cursor-pointer"
                    >
                      Mover
                    </button>
                  </div>
                  {transferError && <p className="text-rose-400 text-[10px]">{transferError}</p>}
                </form>
              )}

              {/* Sub-form: Split Bill */}
              {isSplitting && activeOrder && (
                <form
                  onSubmit={handleConfirmSplit}
                  className="bg-stone-900 p-3 rounded-xl border border-emerald-500/30 space-y-2 animate-in fade-in text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-stone-200">
                    <span>Dividir Conta da Mesa</span>
                    <button type="button" onClick={() => setIsSplitting(false)} className="text-stone-400">
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Pessoas:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={splitPeople}
                      onChange={(e) => setSplitPeople(parseInt(e.target.value) || 1)}
                      className="w-16 bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-center text-stone-100 font-bold"
                    />
                    <span className="font-mono text-emerald-400 font-bold flex-1 text-right">
                      R$ {(activeOrder.total / splitPeople).toFixed(2)}/cada
                    </span>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-lg cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                </form>
              )}

              {/* Sub-form: Apply Discount */}
              {isDiscounting && activeOrder && (
                <form
                  onSubmit={handleConfirmDiscount}
                  className="bg-stone-900 p-3 rounded-xl border border-amber-500/30 space-y-2 animate-in fade-in text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-stone-200">
                    <span>Aplicar Desconto na Comanda</span>
                    <button type="button" onClick={() => setIsDiscounting(false)} className="text-stone-400">
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Valor (R$):</span>
                    <input
                      type="number"
                      step="0.50"
                      min={0}
                      value={discountVal}
                      onChange={(e) => setDiscountVal(e.target.value)}
                      className="w-24 bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-center text-stone-100 font-bold font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg cursor-pointer"
                    >
                      Descontar
                    </button>
                  </div>
                </form>
              )}

              {/* Bottom Payment / Close Bill Section */}
              {activeOrder && (
                <div className="pt-2 border-t border-stone-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Thermal Print */}
                    <button
                      onClick={() => setPrintingOrder(activeOrder)}
                      className="py-2 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>Imprimir Cupom</span>
                    </button>

                    {/* Request Bill status */}
                    <button
                      onClick={() => requestTableBill(activeTable.number)}
                      className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Pedir Conta</span>
                    </button>
                  </div>

                  {/* Primary Pay & Close Button */}
                  <button
                    onClick={() => setIsPaying(true)}
                    className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Fechar Conta e Receber Pagamento</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-stone-500 text-xs">
              Selecione uma mesa no mapa para visualizar a comanda.
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {isPaying && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-stone-100 text-sm">
                  Receber Pagamento · Mesa {activeTable?.number}
                </h3>
              </div>
              <button onClick={() => setIsPaying(false)} className="text-stone-400 hover:text-stone-200">
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex justify-between items-center">
              <span className="text-xs text-stone-400 font-medium">Valor Total da Comanda:</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                R$ {activeOrder.total.toFixed(2)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="text-stone-300 font-semibold block">Escolha a Forma de Pagamento:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['PIX', 'DINHEIRO', 'CREDITO', 'DEBITO', 'FIADO'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      selectedPaymentMethod === method
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    {method === 'PIX' && <QrCode className="w-3.5 h-3.5" />}
                    {method === 'DINHEIRO' && <Banknote className="w-3.5 h-3.5" />}
                    {(method === 'CREDITO' || method === 'DEBITO') && <CreditCard className="w-3.5 h-3.5" />}
                    <span>{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If PIX: Show dynamic QR Code */}
            {selectedPaymentMethod === 'PIX' && (
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-center space-y-2">
                <div className="bg-white p-3 rounded-xl inline-block mx-auto shadow-md">
                  <QRCodeSVG
                    value={activeOrder.pixCode || 'pix-mock'}
                    size={140}
                    level="M"
                  />
                </div>
                <p className="text-[11px] text-emerald-400 font-bold">
                  QR Code PIX Dinâmico Gerado no Valor de R$ {activeOrder.total.toFixed(2)}
                </p>
                <p className="text-[10px] text-stone-400">
                  Beneficiário: {config.pixReceiverName || config.restaurantName}
                </p>
              </div>
            )}

            {/* If Dinheiro: Calculator of Troco */}
            {selectedPaymentMethod === 'DINHEIRO' && (
              <div className="space-y-2 text-xs">
                <label className="text-stone-300 font-semibold block">Valor Recebido do Cliente (R$):</label>
                <input
                  type="number"
                  step="0.50"
                  value={receivedCash}
                  onChange={(e) => setReceivedCash(e.target.value)}
                  placeholder={`Ex: ${(Math.ceil(activeOrder.total / 10) * 10).toFixed(2)}`}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-mono font-bold text-sm outline-none"
                />
                {parseFloat(receivedCash) >= activeOrder.total && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex justify-between text-xs font-bold text-emerald-400">
                    <span>Troco a Devolver:</span>
                    <span className="font-mono">
                      R$ {(parseFloat(receivedCash) - activeOrder.total).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsPaying(false)}
                className="px-4 py-2 border border-stone-700 hover:bg-stone-800 rounded-xl text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Confirmar Pagamento e Liberar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Print Modal */}
      {printingOrder && (
        <ThermalPrintModal
          order={printingOrder}
          config={config}
          onClose={() => setPrintingOrder(null)}
          title={`Comanda da Mesa ${printingOrder.tableNumber}`}
        />
      )}

      {/* Animated Check Overlay for PRONTO / ENTREGUE */}
      {animatedCheckOrder && (
        <AnimatedCheckOverlay
          orderDisplayNumber={animatedCheckOrder.displayNumber}
          status={animatedCheckOrder.status}
          tableNumber={animatedCheckOrder.tableNumber}
          type="mesa"
          onClose={() => setAnimatedCheckOrder(null)}
        />
      )}

      {/* Modal: Incluir Nova Mesa */}
      {isAddingTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 text-sm">
                    Incluir Nova Mesa no Salão
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Cadastre mais uma mesa para atendimento e comanda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTableModal(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAddTable} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-300 font-semibold block mb-1">
                  Número ou Identificador da Mesa:
                </label>
                <input
                  type="text"
                  value={newTableNumberInput}
                  onChange={(e) => setNewTableNumberInput(e.target.value)}
                  placeholder="Ex: 31, 32, Varanda 01..."
                  required
                  autoFocus
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-mono font-bold text-sm focus:border-amber-500 outline-none"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Pode ser numérico (ex: 31) ou com texto (ex: V01, Área Externa).
                </p>
              </div>

              <div>
                <label className="text-stone-300 font-semibold block mb-1">
                  Capacidade Padrão (Lugares / Pessoas):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((seats) => (
                    <button
                      key={seats}
                      type="button"
                      onClick={() => setNewTableCapacity(seats)}
                      className={`py-2 rounded-xl border font-bold text-xs cursor-pointer transition-colors ${
                        newTableCapacity === seats
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      {seats} Lugares
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-stone-400">Outro número de lugares:</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 1)}
                    className="w-16 bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-center text-stone-100 font-bold"
                  />
                </div>
              </div>

              {tableActionError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{tableActionError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddingTableModal(false)}
                  className="px-4 py-2 border border-stone-700 hover:bg-stone-800 rounded-xl text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Salvar e Adicionar Mesa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Mesa */}
      {confirmDeleteTableNum && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2 text-rose-400">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-100 text-sm">
                  Excluir Mesa {confirmDeleteTableNum}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteTableNum(null);
                  setTableActionError('');
                }}
                className="text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Tem certeza que deseja remover permanentemente a <strong>Mesa {confirmDeleteTableNum}</strong> do salão?
            </p>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
              <p>• Mesas com comanda ativa ou clientes consumindo não podem ser deletadas.</p>
              <p>• Finalize o pagamento e libere a mesa antes de remover.</p>
            </div>

            {tableActionError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{tableActionError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteTableNum(null);
                  setTableActionError('');
                }}
                className="px-4 py-2 border border-stone-700 hover:bg-stone-800 rounded-xl text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTable(confirmDeleteTableNum)}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-stone-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
