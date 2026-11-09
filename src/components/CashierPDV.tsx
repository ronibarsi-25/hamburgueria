import React, { useState } from 'react';
import {
  Banknote,
  CreditCard,
  QrCode,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  Printer,
  Receipt,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ShoppingBag,
  Plus,
  Minus,
  Search,
  Utensils,
  X,
  Sparkles,
} from 'lucide-react';
import { CashRegister, CashTransaction, PaymentMethod, RestaurantConfig, CartItem, Order, MenuItem } from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { ThermalPrintModal } from './ThermalPrintModal.tsx';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatedCheckOverlay } from './AnimatedCheckOverlay.tsx';

interface CashierPDVProps {
  config: RestaurantConfig;
}

export const CashierPDV: React.FC<CashierPDVProps> = ({ config }) => {
  const {
    cashRegister,
    orders,
    menuItems,
    openCashRegister,
    closeCashRegister,
    addCashTransaction,
    createBalcaoSale,
  } = useBurgerSystem();

  const [initialAmount, setInitialAmount] = useState('250.00');
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [isTransactionModal, setIsTransactionModal] = useState<'SANGRIA' | 'SUPRIMENTO' | null>(null);
  const [txAmount, setTxAmount] = useState('50.00');
  const [txDescription, setTxDescription] = useState('');
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  // Venda Balcão / Takeaway Direta state
  const [isBalcaoModalOpen, setIsBalcaoModalOpen] = useState(false);
  const [balcaoCart, setBalcaoCart] = useState<CartItem[]>([]);
  const [balcaoMethod, setBalcaoMethod] = useState<PaymentMethod>('PIX');
  const [balcaoCashGiven, setBalcaoCashGiven] = useState('');
  const [balcaoNotes, setBalcaoNotes] = useState('');
  const [balcaoCategory, setBalcaoCategory] = useState<string>('all');
  const [balcaoSearch, setBalcaoSearch] = useState('');
  const [balcaoReceiptOrder, setBalcaoReceiptOrder] = useState<Order | null>(null);
  const [animatedCheckOrder, setAnimatedCheckOrder] = useState<{
    displayNumber: number;
    status: 'PRONTO' | 'ENTREGUE';
    type?: 'balcao';
  } | null>(null);

  const transactions = cashRegister.transactions || [];

  // Summary calculations
  const totalSales = transactions
    .filter((t) => t.type === 'VENDA')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPix = transactions
    .filter((t) => t.type === 'VENDA' && t.paymentMethod === 'PIX')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalCredit = transactions
    .filter((t) => t.type === 'VENDA' && t.paymentMethod === 'CREDITO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDebit = transactions
    .filter((t) => t.type === 'VENDA' && t.paymentMethod === 'DEBITO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalCashSales = transactions
    .filter((t) => t.type === 'VENDA' && t.paymentMethod === 'DINHEIRO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFiado = transactions
    .filter((t) => t.type === 'VENDA' && t.paymentMethod === 'FIADO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSangrias = transactions
    .filter((t) => t.type === 'SANGRIA')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSuprimentos = transactions
    .filter((t) => t.type === 'SUPRIMENTO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Cash in drawer = Initial Balance + Cash Sales + Suprimentos - Sangrias
  const cashInDrawer = (cashRegister.initialBalance || 0) + totalCashSales + (totalSuprimentos - (cashRegister.initialBalance || 0)) - totalSangrias;

  const handleOpenCash = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(initialAmount) || 200.0;
    openCashRegister(val);
    setIsOpeningModal(false);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTransactionModal) return;
    const val = parseFloat(txAmount) || 0;
    addCashTransaction(isTransactionModal, val, txDescription || (isTransactionModal === 'SANGRIA' ? 'Sangria de Caixa' : 'Reforço de Caixa'));
    setIsTransactionModal(null);
    setTxAmount('50.00');
    setTxDescription('');
  };

  const availableItems = (menuItems && menuItems.length > 0 ? menuItems : config.featuredItems).filter(
    (item) => item.active !== false
  );

  const filteredBalcaoItems = availableItems.filter((item) => {
    if (balcaoCategory !== 'all' && item.category !== balcaoCategory) return false;
    if (balcaoSearch && !item.name.toLowerCase().includes(balcaoSearch.toLowerCase())) return false;
    return true;
  });

  const addToBalcaoCart = (item: MenuItem) => {
    setBalcaoCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) => (c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromBalcaoCart = (itemId: string) => {
    setBalcaoCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) => (c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
      }
      return prev.filter((c) => c.menuItem.id !== itemId);
    });
  };

  const balcaoSubtotal = balcaoCart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const balcaoCashChange =
    parseFloat(balcaoCashGiven) >= balcaoSubtotal ? parseFloat(balcaoCashGiven) - balcaoSubtotal : 0;

  const handleFinishBalcaoSale = () => {
    if (balcaoCart.length === 0) return;
    const change = balcaoMethod === 'DINHEIRO' ? balcaoCashChange : undefined;
    const amountPaid = balcaoMethod === 'DINHEIRO' ? parseFloat(balcaoCashGiven) || balcaoSubtotal : balcaoSubtotal;

    const newOrder = createBalcaoSale(balcaoCart, balcaoMethod, amountPaid, change, balcaoNotes);
    setIsBalcaoModalOpen(false);
    setBalcaoCart([]);
    setBalcaoCashGiven('');
    setBalcaoNotes('');
    setBalcaoReceiptOrder(newOrder);
    setAnimatedCheckOrder({
      displayNumber: newOrder.displayNumber,
      status: 'PRONTO',
      type: 'balcao',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100">Frente de Caixa (PDV)</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                  cashRegister.isOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cashRegister.isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span>{cashRegister.isOpen ? 'Caixa Aberto' : 'Caixa Fechado'}</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Recebimentos em PIX, cartões e dinheiro com controle de sangria, suprimento e fechamento Z
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => {
              if (!cashRegister.isOpen) {
                setIsOpeningModal(true);
                return;
              }
              setIsBalcaoModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>+ Venda Balcão / PDV Direto</span>
          </button>

          {cashRegister.isOpen ? (
            <>
              <button
                onClick={() => setIsTransactionModal('SANGRIA')}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-rose-300 font-bold rounded-xl border border-stone-700 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Sangria (Retirada)</span>
              </button>

              <button
                onClick={() => setIsTransactionModal('SUPRIMENTO')}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-emerald-300 font-bold rounded-xl border border-stone-700 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Suprimento (Entrada)</span>
              </button>

              <button
                onClick={() => setIsZReportOpen(true)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Relatório Z / Fechar Caixa</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpeningModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Novo Caixa</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 space-y-1">
          <p className="text-stone-400 font-medium">Total Vendido (Dia):</p>
          <p className="text-xl font-black text-amber-400 font-mono">
            R$ {totalSales.toFixed(2)}
          </p>
          <p className="text-[10px] text-stone-500">{transactions.filter(t => t.type === 'VENDA').length} vendas registradas</p>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 space-y-1">
          <p className="text-stone-400 font-medium">Recebido via PIX:</p>
          <p className="text-xl font-black text-emerald-400 font-mono">
            R$ {totalPix.toFixed(2)}
          </p>
          <p className="text-[10px] text-stone-500">Baixa automática instantânea</p>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 space-y-1">
          <p className="text-stone-400 font-medium">Cartões (Crédito + Débito):</p>
          <p className="text-xl font-black text-sky-400 font-mono">
            R$ {(totalCredit + totalDebit).toFixed(2)}
          </p>
          <p className="text-[10px] text-stone-500">
            Crédito: R$ {totalCredit.toFixed(2)} · Débito: R$ {totalDebit.toFixed(2)}
          </p>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 space-y-1">
          <p className="text-stone-400 font-medium">Dinheiro em Gaveta:</p>
          <p className="text-xl font-black text-stone-100 font-mono">
            R$ {cashInDrawer.toFixed(2)}
          </p>
          <p className="text-[10px] text-stone-500">Fundo inicial: R$ {cashRegister.initialBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* Transactions Feed */}
      <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
          <h3 className="font-bold text-stone-200 uppercase tracking-wider">
            Movimentações do Caixa em Tempo Real
          </h3>
          <span className="text-stone-400">
            Abertura às {cashRegister.openedAt || '--:--'}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs">
            Nenhuma movimentação registrada neste caixa.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-stone-900/70 p-3 rounded-xl border border-stone-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      tx.type === 'VENDA'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : tx.type === 'SUPRIMENTO'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {tx.type === 'VENDA' && <DollarSign className="w-4 h-4" />}
                    {tx.type === 'SUPRIMENTO' && <ArrowDownLeft className="w-4 h-4" />}
                    {tx.type === 'SANGRIA' && <ArrowUpRight className="w-4 h-4" />}
                  </div>

                  <div>
                    <p className="font-bold text-stone-200">{tx.description}</p>
                    <p className="text-[11px] text-stone-400 flex items-center gap-2">
                      <span>{tx.timestamp}</span>
                      {tx.paymentMethod && (
                        <span className="font-semibold text-amber-400">· {tx.paymentMethod}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-sm ${
                      tx.type === 'SANGRIA' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {tx.type === 'SANGRIA' ? '-' : '+'} R$ {tx.amount.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-stone-500 uppercase">{tx.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Abertura de Caixa */}
      {isOpeningModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleOpenCash}
            className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>Abertura de Caixa</span>
              </h3>
              <button type="button" onClick={() => setIsOpeningModal(false)} className="text-stone-400">
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-semibold block">Valor Inicial em Gaveta (Troco):</label>
              <input
                type="number"
                step="5.00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 font-mono font-bold text-base outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsOpeningModal(false)}
                className="px-3.5 py-1.5 border border-stone-700 text-stone-300 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-lg cursor-pointer"
              >
                Confirmar Abertura
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Sangria / Suprimento */}
      {isTransactionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTransaction}
            className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                {isTransactionModal === 'SANGRIA' ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    <span>Lançar Sangria (Retirada)</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    <span>Lançar Suprimento (Entrada)</span>
                  </>
                )}
              </h3>
              <button type="button" onClick={() => setIsTransactionModal(null)} className="text-stone-400">
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-semibold block">Valor (R$):</label>
              <input
                type="number"
                step="1.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 font-mono font-bold text-base outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-semibold block">Motivo / Descrição:</label>
              <input
                type="text"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder={isTransactionModal === 'SANGRIA' ? 'Ex: Pagamento fornecedor pães' : 'Ex: Troco extra moedas'}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsTransactionModal(null)}
                className="px-3.5 py-1.5 border border-stone-700 text-stone-300 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg cursor-pointer"
              >
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Relatório Z de Fechamento Diário */}
      {isZReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-stone-100 text-sm">
                  Fechamento de Caixa · Relatório Z
                </h3>
              </div>
              <button onClick={() => setIsZReportOpen(false)} className="text-stone-400">
                ✕
              </button>
            </div>

            <div className="bg-white text-stone-900 p-4 rounded-xl font-mono text-[11px] space-y-2 shadow-inner">
              <div className="text-center font-bold">
                <p className="text-xs uppercase">{config.restaurantName}</p>
                <p>RELATÓRIO Z DE FECHAMENTO</p>
                <p className="text-[10px] text-stone-600">
                  {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString()}
                </p>
              </div>

              <div className="border-t border-dashed border-stone-800 my-1"></div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>FUNDO INICIAL:</span>
                  <span>R$ {cashRegister.initialBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>TOTAL VENDAS:</span>
                  <span>R$ {totalSales.toFixed(2)}</span>
                </div>
                <div className="pl-3 space-y-0.5 text-stone-700 text-[10px]">
                  <div className="flex justify-between">
                    <span>- PIX:</span>
                    <span>R$ {totalPix.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- CARTÃO CRÉDITO:</span>
                    <span>R$ {totalCredit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- CARTÃO DÉBITO:</span>
                    <span>R$ {totalDebit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- DINHEIRO:</span>
                    <span>R$ {totalCashSales.toFixed(2)}</span>
                  </div>
                  {totalFiado > 0 && (
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>- FIADO / A PRAZO:</span>
                      <span>R$ {totalFiado.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-stone-800 my-1"></div>

                <div className="flex justify-between text-rose-800">
                  <span>TOTAL SANGRIAS:</span>
                  <span>- R$ {totalSangrias.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>TOTAL SUPRIMENTOS:</span>
                  <span>+ R$ {totalSuprimentos.toFixed(2)}</span>
                </div>

                <div className="border-t border-stone-900 pt-1 flex justify-between font-bold text-xs">
                  <span>TOTAL EM GAVETA:</span>
                  <span>R$ {cashInDrawer.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Imprimir Relatório</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeCashRegister();
                  setIsZReportOpen(false);
                  alert('Caixa fechado com sucesso! Relatório Z arquivado.');
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-stone-100 font-bold rounded-lg cursor-pointer"
              >
                Encerrar Caixa do Dia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VENDA BALCÃO / PDV DIRETO (SEM PASSAR PELA MESA) */}
      {isBalcaoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-stone-100 text-base flex items-center gap-2">
                    Venda Rápida de Balcão / PDV Direto
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                      Sem Mesa
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Lançamento imediato, recebimento no caixa e baixa automática no estoque
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBalcaoModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl text-lg font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-stone-800">
              {/* Left Column: Product Catalog (7 cols) */}
              <div className="md:col-span-7 p-4 flex flex-col gap-3 overflow-y-auto">
                {/* Search & Category filter */}
                <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs">
                  <Search className="w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Buscar sanduíche, porção, bebida..."
                    value={balcaoSearch}
                    onChange={(e) => setBalcaoSearch(e.target.value)}
                    className="bg-transparent text-stone-100 placeholder-stone-500 outline-none w-full"
                  />
                  {balcaoSearch && (
                    <button onClick={() => setBalcaoSearch('')} className="text-stone-500 hover:text-stone-300">
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'burgers', label: '🍔 Burgers' },
                    { id: 'sides', label: '🍟 Porções' },
                    { id: 'drinks', label: '🥤 Bebidas' },
                    { id: 'desserts', label: '🍨 Sobremesas' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setBalcaoCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        balcaoCategory === cat.id
                          ? 'bg-amber-500 text-stone-950 shadow-sm'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-1 max-h-[380px]">
                  {filteredBalcaoItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addToBalcaoCart(item)}
                      className="p-3 bg-stone-950 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-xs text-stone-100 group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </p>
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            {item.category.slice(0, 4)}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-stone-800/60 flex items-center justify-between">
                        <span className="font-mono font-black text-amber-400 text-xs">
                          R$ {item.price.toFixed(2)}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-stone-800 group-hover:bg-amber-500 group-hover:text-stone-950 text-stone-300 flex items-center justify-center font-bold text-xs transition-colors">
                          +
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Cart, Tender & Checkout (5 cols) */}
              <div className="md:col-span-5 p-4 bg-stone-950/60 flex flex-col justify-between gap-3 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs">
                    <span className="font-bold text-stone-200">Itens da Venda ({balcaoCart.reduce((sum, c) => sum + c.quantity, 0)})</span>
                    {balcaoCart.length > 0 && (
                      <button
                        onClick={() => setBalcaoCart([])}
                        className="text-[11px] text-stone-500 hover:text-rose-400"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  {balcaoCart.length === 0 ? (
                    <div className="py-8 text-center text-stone-500 text-xs">
                      <p>Nenhum item selecionado.</p>
                      <p className="text-[10px] text-stone-600 mt-1">
                        Clique nos produtos ao lado para adicionar ao cupom.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {balcaoCart.map((ci) => (
                        <div
                          key={ci.menuItem.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-stone-900 border border-stone-800 text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-stone-200 truncate">{ci.menuItem.name}</p>
                            <span className="text-[10px] text-stone-400 font-mono">
                              R$ {ci.menuItem.price.toFixed(2)} un
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-stone-950 px-1.5 py-0.5 rounded-lg border border-stone-800">
                              <button
                                onClick={() => removeFromBalcaoCart(ci.menuItem.id)}
                                className="text-stone-400 hover:text-rose-400 p-0.5 font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-amber-400 text-xs px-1">
                                {ci.quantity}
                              </span>
                              <button
                                onClick={() => addToBalcaoCart(ci.menuItem)}
                                className="text-stone-400 hover:text-amber-400 p-0.5 font-bold"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-mono font-bold text-stone-200 text-xs w-16 text-right">
                              R$ {(ci.menuItem.price * ci.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Observations */}
                  {balcaoCart.length > 0 && (
                    <input
                      type="text"
                      placeholder="Observação da venda (ex: sem cebola)"
                      value={balcaoNotes}
                      onChange={(e) => setBalcaoNotes(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 outline-none"
                    />
                  )}

                  {/* Payment Method Selector */}
                  {balcaoCart.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-stone-800">
                      <label className="text-xs font-bold text-stone-300 block">
                        Forma de Pagamento:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        {(['PIX', 'DINHEIRO', 'CREDITO', 'DEBITO', 'FIADO'] as PaymentMethod[]).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setBalcaoMethod(method)}
                            className={`py-1.5 px-2 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                              balcaoMethod === method
                                ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                                : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                            }`}
                          >
                            {method === 'PIX' && <QrCode className="w-3 h-3" />}
                            {method === 'DINHEIRO' && <Banknote className="w-3 h-3" />}
                            {(method === 'CREDITO' || method === 'DEBITO') && <CreditCard className="w-3 h-3" />}
                            <span>{method}</span>
                          </button>
                        ))}
                      </div>

                      {/* Cash Tender & Change calculator */}
                      {balcaoMethod === 'DINHEIRO' && (
                        <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2 text-xs">
                          <label className="text-[11px] text-stone-400 block font-semibold">
                            Valor Entregue pelo Cliente (R$):
                          </label>
                          <input
                            type="number"
                            step="1.00"
                            placeholder={`Ex: ${balcaoSubtotal.toFixed(2)}`}
                            value={balcaoCashGiven}
                            onChange={(e) => setBalcaoCashGiven(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-stone-100 font-mono font-bold text-sm outline-none"
                          />

                          {/* Quick shortcuts */}
                          <div className="flex gap-1.5">
                            {[20, 50, 100].map((bill) => (
                              <button
                                key={bill}
                                type="button"
                                onClick={() => setBalcaoCashGiven(String(bill))}
                                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-amber-400 font-mono text-[10px] rounded font-bold border border-stone-700"
                              >
                                R$ {bill}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setBalcaoCashGiven(balcaoSubtotal.toFixed(2))}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[10px] rounded font-bold border border-stone-700 ml-auto"
                            >
                              Exato
                            </button>
                          </div>

                          {parseFloat(balcaoCashGiven) >= balcaoSubtotal && (
                            <div className="flex justify-between items-center text-xs font-bold text-emerald-400 pt-1 border-t border-stone-800">
                              <span>Troco a Devolver:</span>
                              <span className="font-mono text-sm">
                                R$ {balcaoCashChange.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtotal & Finalize Button */}
                <div className="pt-3 border-t border-stone-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-stone-400">Total a Pagar:</span>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      R$ {balcaoSubtotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinishBalcaoSale}
                    disabled={balcaoCart.length === 0}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Venda Balcão (R$ {balcaoSubtotal.toFixed(2)})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 80mm Print Modal for Balcão Sale Receipt */}
      {balcaoReceiptOrder && (
        <ThermalPrintModal
          order={balcaoReceiptOrder}
          config={config}
          onClose={() => setBalcaoReceiptOrder(null)}
          title={`Recibo Venda Balcão #${balcaoReceiptOrder.displayNumber}`}
        />
      )}

      {/* Animated Check Overlay for Balcão Venda */}
      {animatedCheckOrder && (
        <AnimatedCheckOverlay
          orderDisplayNumber={animatedCheckOrder.displayNumber}
          status={animatedCheckOrder.status}
          type="balcao"
          onClose={() => setAnimatedCheckOrder(null)}
        />
      )}
    </div>
  );
};
