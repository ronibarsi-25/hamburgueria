import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  BarChart3,
  CreditCard,
  Building,
  Users,
  Zap,
  ShoppingBag,
  FileSpreadsheet,
  PieChart,
  Download,
  FileDown,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { Expense } from '../types.ts';
import { FinanceDashboard } from './FinanceDashboard.tsx';
import { exportDailyClosingCSV, exportOrdersHistoryCSV } from '../utils/csvExport.ts';

export const FinanceManager: React.FC = () => {
  const { orders, expenses, cashRegister, companyInfo, addExpense, toggleExpenseStatus, deleteExpense } = useBurgerSystem();

  const [financeSubTab, setFinanceSubTab] = useState<'dashboard' | 'dre' | 'expenses' | 'relatorios'>('dashboard');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDENTE' | 'PAGO'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [newExpenseModal, setNewExpenseModal] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExportDailyClosing = () => {
    exportDailyClosingCSV(orders, cashRegister, expenses, companyInfo);
    setToastMessage('Relatório de Fechamento Diário baixado com sucesso (CSV)!');
    setTimeout(() => setToastMessage(null), 4000);
    setExportDropdownOpen(false);
  };

  const handleExportOrdersHistory = () => {
    exportOrdersHistoryCSV(orders, companyInfo);
    setToastMessage('Histórico de Pedidos baixado com sucesso (CSV)!');
    setTimeout(() => setToastMessage(null), 4000);
    setExportDropdownOpen(false);
  };

  // New expense form
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<Expense['category']>('FORNECEDOR');
  const [amount, setAmount] = useState<number>(100);
  const [dueDate, setDueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Total sales revenue from orders
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAGO');
  const totalRevenue = paidOrders.reduce((acc, curr) => acc + curr.total, 0);

  // By channel
  const mesaRevenue = paidOrders.filter((o) => o.type === 'mesa').reduce((acc, curr) => acc + curr.total, 0);
  const deliveryRevenue = paidOrders.filter((o) => o.type === 'delivery').reduce((acc, curr) => acc + curr.total, 0);

  // Expenses calculations
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const paidExpenses = expenses.filter((e) => e.status === 'PAGO').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDENTE').reduce((acc, curr) => acc + curr.amount, 0);

  // Net Result
  const netProfit = totalRevenue - totalExpenses;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Filtered expenses list
  const filteredExpenses = expenses.filter((e) => {
    if (activeFilter !== 'ALL' && e.status !== activeFilter) return false;
    if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
    return true;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || amount <= 0) return;

    addExpense({
      description: desc,
      category,
      amount: Number(amount),
      dueDate,
      status: 'PENDENTE',
    });

    setDesc('');
    setAmount(100);
    setNewExpenseModal(false);
  };

  const getCategoryBadge = (cat: Expense['category']) => {
    switch (cat) {
      case 'FORNECEDOR':
        return { label: 'Fornecedor', icon: ShoppingBag, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'ALUGUEL':
        return { label: 'Aluguel / Imóvel', icon: Building, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'FUNCIONARIOS':
        return { label: 'Funcionários / Folha', icon: Users, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'ENERGIA_AGUA':
        return { label: 'Energia & Água', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
      default:
        return { label: 'Geral / Outros', icon: DollarSign, color: 'text-stone-400 bg-stone-500/10 border-stone-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-100 flex items-center gap-2">
              Gestão Financeira & DRE
            </h1>
            <p className="text-xs text-stone-400">
              Controle de receitas, despesas fixas/variáveis, fluxo de caixa e margem de lucro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV Export Dropdown & Direct Download Buttons */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar CSV</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                <button
                  type="button"
                  onClick={handleExportDailyClosing}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-stone-800 text-xs text-stone-200 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-stone-100">Fechamento Diário (CSV)</span>
                    <span className="block text-[11px] text-stone-400 leading-tight">
                      Caixa, canais (salão/delivery), formas de pagamento e DRE
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportOrdersHistory}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-stone-800 text-xs text-stone-200 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold text-stone-100">Histórico de Pedidos (CSV)</span>
                    <span className="block text-[11px] text-stone-400 leading-tight">
                      Planilha analítica com itens, clientes, valores e status
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setNewExpenseModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Export Success Toast Banner */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-stone-800 gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setFinanceSubTab('dashboard')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            financeSubTab === 'dashboard'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard & Gráficos (Recharts)
        </button>

        <button
          onClick={() => setFinanceSubTab('dre')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            financeSubTab === 'dre'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          DRE Demonstrativo de Resultado
        </button>

        <button
          onClick={() => setFinanceSubTab('expenses')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            financeSubTab === 'expenses'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Contas a Pagar & Despesas ({expenses.length})
        </button>

        <button
          onClick={() => setFinanceSubTab('relatorios')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            financeSubTab === 'relatorios'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Download className="w-4 h-4" />
          Exportar Relatórios CSV
        </button>
      </div>

      {/* VIEW 1: RECHARTS DASHBOARD */}
      {financeSubTab === 'dashboard' && (
        <FinanceDashboard />
      )}

      {/* VIEW 2: DRE & SUMMARY */}
      {financeSubTab === 'dre' && (
        <div className="space-y-6">

      {/* DRE Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Receita de Vendas</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            R$ {totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Mesas: R$ {mesaRevenue.toFixed(2)} | Del: R$ {deliveryRevenue.toFixed(2)}
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Total de Despesas</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">
            R$ {totalExpenses.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Pagas: R$ {paidExpenses.toFixed(2)} | A Pagar: R$ {pendingExpenses.toFixed(2)}
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Lucro Líquido Previsto</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              netProfit >= 0 ? 'text-amber-400' : 'text-red-400'
            }`}
          >
            R$ {netProfit.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Resultado operacional da hamburgueria
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Margem Líquida</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {netMargin.toFixed(1)}%
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Retorno sobre faturamento bruto
          </div>
        </div>
      </div>

      {/* DRE Quick Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-stone-200 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          Demonstrativo de Resultado do Exercício (DRE Sintético)
        </h2>

        <div className="divide-y divide-stone-800 text-xs">
          <div className="py-2 flex justify-between items-center text-stone-300">
            <span className="font-semibold text-stone-100">(+) Receita Bruta Total</span>
            <span className="font-mono font-bold text-emerald-400">R$ {totalRevenue.toFixed(2)}</span>
          </div>
          <div className="py-2 pl-4 flex justify-between items-center text-stone-400">
            <span>• Vendas Salão / Mesas</span>
            <span className="font-mono">R$ {mesaRevenue.toFixed(2)}</span>
          </div>
          <div className="py-2 pl-4 flex justify-between items-center text-stone-400">
            <span>• Vendas Delivery</span>
            <span className="font-mono">R$ {deliveryRevenue.toFixed(2)}</span>
          </div>
          <div className="py-2 flex justify-between items-center text-stone-300">
            <span className="font-semibold text-stone-100">(-) Custos Operacionais & Despesas</span>
            <span className="font-mono font-bold text-red-400">R$ {totalExpenses.toFixed(2)}</span>
          </div>
          <div className="py-2 pl-4 flex justify-between items-center text-stone-400">
            <span>• Despesas Pagas no Período</span>
            <span className="font-mono text-red-300">R$ {paidExpenses.toFixed(2)}</span>
          </div>
          <div className="py-2 pl-4 flex justify-between items-center text-stone-400">
            <span>• Contas a Pagar Pendentes</span>
            <span className="font-mono text-amber-300">R$ {pendingExpenses.toFixed(2)}</span>
          </div>
          <div className="py-3 flex justify-between items-center font-bold text-sm bg-stone-950/40 px-3 rounded-lg border border-stone-800/80">
            <span className="text-amber-400">(=) Resultado Líquido Operacional</span>
            <span
              className={`font-mono text-base ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              R$ {netProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* VIEW 3: EXPENSES MANAGEMENT */}
      {financeSubTab === 'expenses' && (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Contas a Pagar & Despesas ({filteredExpenses.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-stone-900 border border-stone-800 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  activeFilter === 'ALL'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Todas ({expenses.length})
              </button>
              <button
                onClick={() => setActiveFilter('PENDENTE')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  activeFilter === 'PENDENTE'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                A Pagar ({expenses.filter((e) => e.status === 'PENDENTE').length})
              </button>
              <button
                onClick={() => setActiveFilter('PAGO')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  activeFilter === 'PAGO'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Pagas ({expenses.filter((e) => e.status === 'PAGO').length})
              </button>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300 outline-none"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="FORNECEDOR">Fornecedores</option>
              <option value="ALUGUEL">Aluguel / Imóvel</option>
              <option value="FUNCIONARIOS">Funcionários / Folha</option>
              <option value="ENERGIA_AGUA">Energia & Água</option>
              <option value="MARKETING">Marketing</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/60 text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Descrição da Despesa</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {filteredExpenses.map((expense) => {
                  const badge = getCategoryBadge(expense.category);
                  const Icon = badge.icon;
                  const isPaid = expense.status === 'PAGO';

                  return (
                    <tr key={expense.id} className="hover:bg-stone-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-100 text-sm">{expense.description}</div>
                        <span className="text-[10px] text-stone-400">Criada em: {expense.createdAt}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${badge.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {expense.dueDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-100 text-sm">
                        R$ {expense.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleExpenseStatus(expense.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              PAGO
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              PENDENTE
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          title="Excluir despesa"
                          className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* VIEW 4: RELATORIOS & EXPORTACAO CSV */}
      {financeSubTab === 'relatorios' && (
        <div className="space-y-6">
          {/* Header & Overview */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
                  📁
                </div>
                <div>
                  <h3 className="font-black text-stone-100 text-lg flex items-center gap-2">
                    Central de Exportação de Relatórios & Histórico (CSV)
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Baixe planilhas oficiais com codificação UTF-8 compatíveis com Microsoft Excel, Google Planilhas e sistemas de contabilidade
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportDailyClosing}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Baixar Fechamento Diário</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportOrdersHistory}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Baixar Histórico</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics of Exportable Data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 bg-stone-950/80 border border-stone-800 rounded-2xl">
                <span className="text-[11px] text-stone-400 block">Total de Pedidos</span>
                <span className="text-2xl font-black text-stone-100 font-mono mt-0.5 block">
                  {orders.length}
                </span>
                <span className="text-[10px] text-stone-500">prontos para download</span>
              </div>

              <div className="p-3.5 bg-stone-950/80 border border-stone-800 rounded-2xl">
                <span className="text-[11px] text-emerald-400 font-semibold block">Receita Registrada</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                  R$ {totalRevenue.toFixed(2)}
                </span>
                <span className="text-[10px] text-stone-500">faturamento consolidado</span>
              </div>

              <div className="p-3.5 bg-stone-950/80 border border-stone-800 rounded-2xl">
                <span className="text-[11px] text-rose-400 font-semibold block">Despesas Registradas</span>
                <span className="text-2xl font-black text-rose-400 font-mono mt-0.5 block">
                  R$ {totalExpenses.toFixed(2)}
                </span>
                <span className="text-[10px] text-stone-500">{expenses.length} contas no relatório</span>
              </div>

              <div className="p-3.5 bg-stone-950/80 border border-stone-800 rounded-2xl">
                <span className="text-[11px] text-amber-400 font-semibold block">Status do Caixa</span>
                <span className="text-xl font-black text-stone-100 font-mono mt-0.5 block">
                  {cashRegister.isOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
                </span>
                <span className="text-[10px] text-stone-500">
                  Fundo inicial: R$ {cashRegister.initialBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Cards for the 2 Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REPORT 1: FECHAMENTO DIÁRIO */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-xl hover:border-amber-500/40 transition-all">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                    Fechamento de Caixa & DRE
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-stone-100">
                    Relatório de Fechamento Diário (CSV)
                  </h4>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Planilha executiva consolidada recomendada para prestação de contas diária, fechamento de turno do caixa e conferência com o contador.
                  </p>
                </div>

                <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-2xl space-y-2 text-xs">
                  <span className="text-stone-300 font-bold block text-[11px] uppercase tracking-wider">
                    O que está incluído no arquivo:
                  </span>
                  <ul className="space-y-1.5 text-stone-400 text-xs">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span><strong>Resumo Executivo:</strong> Faturamento Bruto, Despesas Pagas e Lucro Líquido.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span><strong>Vendas por Canal:</strong> Salão (Mesas 01 a 30), Delivery Online (Mari) e Balcão.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span><strong>Formas de Pagamento:</strong> Quebra por PIX, Cartão Crédito, Débito e Dinheiro.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span><strong>Física da Gaveta:</strong> Fundo de troco inicial, sangrias e suprimentos realizados.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span><strong>Histórico de Transações:</strong> Entradas e saídas registradas no livro caixa.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportDailyClosing}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Fechamento Diário (.CSV)</span>
              </button>
            </div>

            {/* REPORT 2: HISTÓRICO COMPLETO DE PEDIDOS */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-xl hover:border-blue-500/40 transition-all">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase">
                    Auditoria Analítica
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-stone-100">
                    Histórico Completo de Pedidos (CSV)
                  </h4>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Planilha analítica detalhando cada comanda e entrega linha por linha, com itens consumidos, valores, clientes, endereço e status.
                  </p>
                </div>

                <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-2xl space-y-2 text-xs">
                  <span className="text-stone-300 font-bold block text-[11px] uppercase tracking-wider">
                    O que está incluído no arquivo:
                  </span>
                  <ul className="space-y-1.5 text-stone-400 text-xs">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span><strong>Identificação:</strong> ID do Pedido, Nº da Comanda, Data e Horário de Abertura.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span><strong>Cliente & Local:</strong> Mesa atribuída, Nome do Cliente, Telefone e Endereço de entrega.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span><strong>Discriminação de Itens:</strong> Sanduíches, porções e bebidas com quantidade e observações.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span><strong>Valores Financeiros:</strong> Subtotal, Taxa de Entrega, Desconto e Total Líquido (R$).</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span><strong>Auditoria de Status:</strong> Método de Pagamento, Status do Pagamento e Situação do Pedido.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportOrdersHistory}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-stone-100 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Histórico de Pedidos (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Excel Compatibility Note */}
          <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-2xl flex items-center justify-between gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-3">
              <span className="text-xl">💡</span>
              <p>
                Os relatórios são codificados em <strong>UTF-8 com BOM</strong> e delimitador <strong>ponto e vírgula (;)</strong>, formato padrão brasileiro que abre perfeitamente no <strong>Microsoft Excel</strong>, <strong>Google Planilhas</strong> e <strong>LibreOffice Calc</strong> sem problemas de acentuação ou vírgula decimal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA DESPESA */}
      {newExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-stone-100 flex items-center gap-2 text-base">
                <Plus className="w-5 h-5 text-amber-400" />
                Cadastrar Nova Despesa / Conta a Pagar
              </h3>
              <button
                onClick={() => setNewExpenseModal(false)}
                className="text-stone-400 hover:text-stone-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-xs text-stone-400 block mb-1">Descrição / Fornecedor:</label>
                <input
                  type="text"
                  placeholder="Ex: Fornecedor de Pães Brioche"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="FORNECEDOR">Fornecedores</option>
                    <option value="ALUGUEL">Aluguel / Imóvel</option>
                    <option value="FUNCIONARIOS">Funcionários / Folha</option>
                    <option value="ENERGIA_AGUA">Energia & Água</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-400 block mb-1">Valor (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1">Data de Vencimento:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewExpenseModal(false)}
                  className="w-1/2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
