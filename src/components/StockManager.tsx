import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Layers,
  Search,
  CheckCircle2,
  PackagePlus,
  RefreshCw,
  UtensilsCrossed,
  DollarSign,
  Percent,
} from 'lucide-react';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { DEFAULT_MENU_ITEMS } from '../constants/defaults.ts';
import { StockItem } from '../types.ts';

export const StockManager: React.FC = () => {
  const { stockItems, menuItems, updateStockQuantity } = useBurgerSystem();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes' | 'alerts'>('inventory');
  const [selectedStockForAdjustment, setSelectedStockForAdjustment] = useState<StockItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustCost, setAdjustCost] = useState<number>(0);
  const [newStockModal, setNewStockModal] = useState(false);

  // New stock item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<'un' | 'kg' | 'g' | 'l' | 'ml'>('un');
  const [newItemQty, setNewItemQty] = useState(50);
  const [newItemMin, setNewItemMin] = useState(15);
  const [newItemCost, setNewItemCost] = useState(3.5);

  const lowStockItems = stockItems.filter((item) => item.currentQuantity <= item.minQuantity);
  const criticalStockItems = stockItems.filter((item) => item.currentQuantity === 0);

  const filteredItems = stockItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickAdd = (id: string, amount: number) => {
    updateStockQuantity(id, amount);
  };

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForAdjustment || adjustAmount <= 0) return;
    updateStockQuantity(selectedStockForAdjustment.id, adjustAmount);
    setSelectedStockForAdjustment(null);
  };

  // Calculate Food Cost (CMV) for each burger recipe
  const activeMenuItems = (menuItems && menuItems.length > 0 ? menuItems : DEFAULT_MENU_ITEMS);
  const menuRecipesWithCost = activeMenuItems.map((menuItem) => {
    const recipe = menuItem.recipe || [];
    let estimatedCost = 0;
    let maxPortionsPossible = 9999;

    const ingredientsDetail = recipe.map((rec) => {
      const stock = stockItems.find((s) => s.id === rec.stockItemId);
      const ingredientCost = stock ? stock.cost * rec.quantity : 0;
      estimatedCost += ingredientCost;

      const portionsFromThisStock = stock ? Math.floor(stock.currentQuantity / rec.quantity) : 0;
      if (portionsFromThisStock < maxPortionsPossible) {
        maxPortionsPossible = portionsFromThisStock;
      }

      return {
        ...rec,
        name: stock ? stock.name : rec.stockItemId,
        unit: stock ? stock.unit : 'un',
        currentQuantity: stock ? stock.currentQuantity : 0,
        ingredientCost,
        isLow: stock ? stock.currentQuantity <= stock.minQuantity : false,
      };
    });

    const profitMargin = menuItem.price - estimatedCost;
    const marginPercent = menuItem.price > 0 ? (profitMargin / menuItem.price) * 100 : 0;

    return {
      menuItem,
      ingredientsDetail,
      estimatedCost,
      profitMargin,
      marginPercent,
      maxPortionsPossible: maxPortionsPossible === 9999 ? 0 : maxPortionsPossible,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-100 flex items-center gap-2">
              Controle de Estoque & Fichas Técnicas
              {lowStockItems.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold animate-pulse">
                  {lowStockItems.length} em alerta
                </span>
              )}
            </h1>
            <p className="text-xs text-stone-400">
              Baixa automática a cada venda do cardápio/KDS e fichas técnicas com cálculo de CMV
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border ${
              activeTab === 'alerts'
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Alertas ({lowStockItems.length})
          </button>
          <button
            onClick={() => setNewStockModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Ingrediente
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Total de Ingredientes</span>
            <Boxes className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-stone-100">{stockItems.length}</div>
          <div className="text-[11px] text-stone-400 mt-1">Matérias-primas e insumos</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Estoque Baixo</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{lowStockItems.length}</div>
          <div className="text-[11px] text-amber-300 mt-1">Abaixo da margem de segurança</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Itens Esgotados</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{criticalStockItems.length}</div>
          <div className="text-[11px] text-stone-400 mt-1">Paralisam produção do KDS</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>Fichas Técnicas</span>
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{menuRecipesWithCost.length}</div>
          <div className="text-[11px] text-stone-400 mt-1">Receitas com baixa de insumos</div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-stone-800 gap-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Inventário de Ingredientes & Insumos
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'recipes'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Fichas Técnicas & CMV dos Burgers
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Reposição & Compras ({lowStockItems.length})
        </button>
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar ingrediente (pão, carne, cheddar, bacon...)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-stone-100 placeholder-stone-500 text-sm outline-none w-full"
            />
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/60 text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Ingrediente / Insumo</th>
                    <th className="py-3 px-4">Qtd Atual</th>
                    <th className="py-3 px-4">Estoque Mínimo</th>
                    <th className="py-3 px-4">Custo Unitário</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300">
                  {filteredItems.map((item) => {
                    const isLow = item.currentQuantity <= item.minQuantity;
                    const isOut = item.currentQuantity === 0;
                    const percent = Math.min(100, Math.round((item.currentQuantity / (item.minQuantity * 2)) * 100));

                    return (
                      <tr key={item.id} className="hover:bg-stone-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-100 text-sm">{item.name}</div>
                          <span className="text-[10px] text-stone-400 font-mono">ID: {item.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-black text-amber-400">
                              {item.currentQuantity} {item.unit}
                            </span>
                          </div>
                          <div className="w-24 bg-stone-800 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-400">
                          {item.minQuantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-300">
                          R$ {item.cost.toFixed(2)} / {item.unit}
                        </td>
                        <td className="py-3 px-4">
                          {isOut ? (
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              ESGOTADO
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              BAIXO ESTOQUE
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              NORMAL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleQuickAdd(item.id, 5)}
                              title="Adicionar +5"
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-semibold border border-stone-700"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleQuickAdd(item.id, 10)}
                              title="Adicionar +10"
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-semibold border border-stone-700"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStockForAdjustment(item);
                                setAdjustAmount(20);
                                setAdjustCost(item.cost);
                              }}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-bold border border-amber-500/40 flex items-center gap-1"
                            >
                              <PackagePlus className="w-3 h-3" />
                              Entrada
                            </button>
                          </div>
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

      {/* TAB 2: RECIPES & CMV */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Baixa Automática em Tempo Real:</strong> Cada vez que um pedido é gerado no cardápio, WhatsApp ou KDS, os insumos das fichas técnicas abaixo são subtraídos do estoque instantaneamente.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuRecipesWithCost.map(({ menuItem, ingredientsDetail, estimatedCost, profitMargin, marginPercent, maxPortionsPossible }) => (
              <div
                key={menuItem.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-stone-100 text-base flex items-center gap-2">
                      {menuItem.name}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 border border-stone-700 uppercase">
                        {menuItem.category}
                      </span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 line-clamp-1">{menuItem.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-base font-black text-amber-400 font-mono">
                      R$ {menuItem.price.toFixed(2)}
                    </span>
                    <div className="text-[10px] text-stone-400">Preço de Venda</div>
                  </div>
                </div>

                {/* CMV and Margin Stats */}
                <div className="grid grid-cols-3 gap-2 bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">Custo (CMV)</div>
                    <div className="text-xs font-black text-stone-200 font-mono mt-0.5">
                      R$ {estimatedCost.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">Lucro Bruto</div>
                    <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                      R$ {profitMargin.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">Margem</div>
                    <div className="text-xs font-black text-amber-400 font-mono mt-0.5">
                      {marginPercent.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Recipe items / BOM */}
                <div>
                  <div className="text-xs font-bold text-stone-300 mb-2 flex items-center justify-between">
                    <span>Composição da Receita:</span>
                    <span className="text-[11px] text-stone-400">
                      Disponível hoje: <strong className="text-amber-400">{maxPortionsPossible} un</strong>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {ingredientsDetail.map((ing) => (
                      <div
                        key={ing.stockItemId}
                        className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-stone-800/40 border border-stone-800 text-stone-300"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>{ing.name}</span>
                          <span className="font-mono text-stone-400 text-[11px]">
                            ({ing.quantity} {ing.unit})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-400 text-[11px]">
                            R$ {ing.ingredientCost.toFixed(2)}
                          </span>
                          {ing.isLow && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                              Baixo
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REPOSIÇÃO & COMPRAS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-stone-900 border border-stone-800 rounded-2xl p-4">
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Lista de Compras / Sugestão de Reposição
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Itens com estoque abaixo da margem mínima estabelecida para a operação.
              </p>
            </div>
            <button
              onClick={() => {
                const text = lowStockItems
                  .map(
                    (item) =>
                      `• ${item.name}: Atual ${item.currentQuantity} ${item.unit} (Mín: ${item.minQuantity} ${item.unit}) -> Comprar: ${(
                        item.minQuantity * 2 -
                        item.currentQuantity
                      ).toFixed(1)} ${item.unit}`
                  )
                  .join('\n');
                navigator.clipboard.writeText(`*LISTA DE COMPRAS - HAMBURGUERIA*\n\n${text}`);
                alert('Lista de compras copiada para a área de transferência!');
              }}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold border border-stone-700 flex items-center gap-2"
            >
              Copiar Lista de Compras
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-stone-200">Estoque 100% Abastecido</h3>
              <p className="text-xs text-stone-400">Nenhum ingrediente está abaixo do limite de segurança.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item) => {
                const suggestedBuy = Math.max(0, item.minQuantity * 2 - item.currentQuantity);
                const estimatedPurchaseCost = suggestedBuy * item.cost;

                return (
                  <div
                    key={item.id}
                    className="bg-stone-900 border border-red-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-red-500 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase">
                      Alerta
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-100 text-sm">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-400 font-mono font-bold">
                          Atual: {item.currentQuantity} {item.unit}
                        </span>
                        <span className="text-xs text-stone-500">|</span>
                        <span className="text-xs text-stone-400 font-mono">
                          Mínimo: {item.minQuantity} {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs space-y-1">
                      <div className="flex justify-between text-stone-300">
                        <span>Compra sugerida:</span>
                        <strong className="text-amber-400 font-mono">
                          +{suggestedBuy.toFixed(1)} {item.unit}
                        </strong>
                      </div>
                      <div className="flex justify-between text-stone-400 text-[11px]">
                        <span>Custo estimado:</span>
                        <span className="font-mono">R$ {estimatedPurchaseCost.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStockForAdjustment(item);
                        setAdjustAmount(Number(suggestedBuy.toFixed(1)));
                        setAdjustCost(item.cost);
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Registrar Entrada de Mercadoria
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ENTRADA DE MERCADORIA */}
      {selectedStockForAdjustment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-stone-100 flex items-center gap-2 text-base">
                <PackagePlus className="w-5 h-5 text-amber-400" />
                Entrada de Estoque: {selectedStockForAdjustment.name}
              </h3>
              <button
                onClick={() => setSelectedStockForAdjustment(null)}
                className="text-stone-400 hover:text-stone-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-stone-400 block mb-1">
                  Quantidade a Adicionar ({selectedStockForAdjustment.unit}):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  required
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono text-base font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1">Custo Unitário da Compra (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={adjustCost}
                  onChange={(e) => setAdjustCost(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-stone-950 rounded-xl text-xs space-y-1 border border-stone-800">
                <div className="flex justify-between text-stone-400">
                  <span>Estoque Atual:</span>
                  <span className="font-mono text-stone-200">
                    {selectedStockForAdjustment.currentQuantity} {selectedStockForAdjustment.unit}
                  </span>
                </div>
                <div className="flex justify-between text-stone-300 font-bold">
                  <span>Novo Estoque Previsto:</span>
                  <span className="font-mono text-amber-400">
                    {(selectedStockForAdjustment.currentQuantity + adjustAmount).toFixed(1)}{' '}
                    {selectedStockForAdjustment.unit}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStockForAdjustment(null)}
                  className="w-1/2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO INGREDIENTE */}
      {newStockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-stone-100 flex items-center gap-2 text-base">
                <Plus className="w-5 h-5 text-amber-400" />
                Cadastrar Novo Insumo / Ingrediente
              </h3>
              <button
                onClick={() => setNewStockModal(false)}
                className="text-stone-400 hover:text-stone-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newItemName) return;
                const id = `stk-${newItemName.toLowerCase().replace(/\s+/g, '-').slice(0, 10)}-${Date.now().toString().slice(-4)}`;
                const item: StockItem = {
                  id,
                  name: newItemName,
                  unit: newItemUnit,
                  currentQuantity: Number(newItemQty),
                  minQuantity: Number(newItemMin),
                  cost: Number(newItemCost),
                };
                updateStockQuantity(id, item.currentQuantity);
                // Also add to state if not existing
                setNewStockModal(false);
                setNewItemName('');
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-stone-400 block mb-1">Nome do Ingrediente:</label>
                <input
                  type="text"
                  placeholder="Ex: Queijo Gorgonzola Artesanal"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Unidade de Medida:</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs outline-none focus:border-amber-500"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="l">Litro (l)</option>
                    <option value="ml">Mililitro (ml)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Custo Unitário (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(Number(e.target.value))}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Quantidade Inicial:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Estoque Mínimo (Alerta):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemMin}
                    onChange={(e) => setNewItemMin(Number(e.target.value))}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewStockModal(false)}
                  className="w-1/2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold"
                >
                  Salvar Ingrediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
