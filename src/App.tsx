import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Utensils,
  Settings,
  Terminal,
  ChefHat,
  LayoutGrid,
  Bike,
  Banknote,
  Boxes,
  TrendingUp,
  QrCode,
  Bell,
  Menu,
  X,
  MapPin,
  Flame,
  BarChart3,
  Lock,
  UserCheck,
  Smartphone,
} from 'lucide-react';
import { RestaurantConfig, SystemPermission } from './types.ts';
import { DEFAULT_CONFIG } from './constants/defaults.ts';
import { BurgerSystemProvider, useBurgerSystem } from './context/BurgerSystemContext.tsx';
import { WhatsAppChat } from './components/WhatsAppChat.tsx';
import { DigitalMenu } from './components/DigitalMenu.tsx';
import { FloorPlanTables } from './components/FloorPlanTables.tsx';
import { KitchenKDS } from './components/KitchenKDS.tsx';
import { DeliveryManager } from './components/DeliveryManager.tsx';
import { CashierPDV } from './components/CashierPDV.tsx';
import { StockManager } from './components/StockManager.tsx';
import { FinanceManager } from './components/FinanceManager.tsx';
import { FinanceDashboard } from './components/FinanceDashboard.tsx';
import { TableQRGenerator } from './components/TableQRGenerator.tsx';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import { IntegrationGuide } from './components/IntegrationGuide.tsx';
import { MobileComanda } from './components/MobileComanda.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { soundFX } from './utils/audio.ts';

type TabType =
  | 'chat'
  | 'menu'
  | 'tables'
  | 'mobile_comanda'
  | 'kds'
  | 'delivery'
  | 'cashier'
  | 'stock'
  | 'finance'
  | 'dashboard'
  | 'qr'
  | 'settings'
  | 'integration';

const BurgerAppContent: React.FC = () => {
  const {
    orders,
    tables,
    cashRegister,
    stockItems,
    companyInfo,
    selectedTableForMenu,
    setSelectedTableForMenu,
    currentEmployee,
    setCurrentEmployeeId,
    hasPermission,
    employees,
    attendantAlert,
    dismissAttendantAlert,
  } = useBurgerSystem();

  // If URL has table query or waiter pocket query on first load
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get('garcom') ||
        urlParams.get('pocket') ||
        urlParams.get('comanda') ||
        urlParams.get('tab') === 'mobile_comanda' ||
        urlParams.get('mobile')
      ) {
        return 'mobile_comanda';
      }
      if (urlParams.get('mesa') || urlParams.get('m')) {
        return 'menu';
      }
    }
    return 'chat';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [config, setConfig] = useState<RestaurantConfig>(() => {
    try {
      const stored = localStorage.getItem('mari_restaurant_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          quickReplies:
            parsed.quickReplies && parsed.quickReplies.length > 0
              ? parsed.quickReplies
              : DEFAULT_CONFIG.quickReplies,
        };
      }
    } catch {
      // Ignore fallback
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mari_restaurant_config', JSON.stringify(config));
    } catch {
      // Ignore
    }
  }, [config]);

  const handleUpdateConfig = (newConfig: RestaurantConfig) => {
    setConfig(newConfig);
  };

  const handleResetConfig = () => {
    if (window.confirm('Deseja realmente restaurar as configurações padrão da Mari?')) {
      setConfig(DEFAULT_CONFIG);
      localStorage.removeItem('mari_restaurant_config');
    }
  };

  const handleOpenTableMenu = (tableNumber: string) => {
    setSelectedTableForMenu(tableNumber);
    setActiveTab('menu');
  };

  // Indicators & Badges
  const activeKDSCount = orders.filter(
    (o) => o.status === 'NOVO' || o.status === 'EM PREPARO'
  ).length;

  const readyOrdersCount = orders.filter((o) => o.status === 'PRONTO').length;

  const occupiedTablesCount = tables.filter((t) => t.status === 'ocupada' || t.status === 'conta').length;

  const activeDeliveriesCount = orders.filter(
    (o) => o.type === 'delivery' && (o.status === 'NOVO' || o.status === 'EM PREPARO' || o.status === 'SAIU_ENTREGA')
  ).length;

  const lowStockCount = stockItems.filter((s) => s.currentQuantity <= s.minQuantity).length;

  const navTabs = [
    {
      id: 'chat' as TabType,
      label: 'Simulador WhatsApp',
      icon: MessageSquare,
      badge: null,
    },
    {
      id: 'menu' as TabType,
      label: 'Cardápio Digital',
      icon: Utensils,
      badge: selectedTableForMenu ? `Mesa ${selectedTableForMenu}` : null,
      badgeColor: 'bg-amber-500 text-stone-950 font-bold',
    },
    {
      id: 'tables' as TabType,
      label: 'Salão (Mesas)',
      icon: LayoutGrid,
      badge: readyOrdersCount > 0
        ? `🔔 ${readyOrdersCount} Pronto!`
        : occupiedTablesCount > 0
        ? `${occupiedTablesCount}/30`
        : null,
      badgeColor: readyOrdersCount > 0
        ? 'bg-amber-500 text-stone-950 font-black animate-bounce'
        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    },
    {
      id: 'mobile_comanda' as TabType,
      label: 'Comanda Mobile',
      icon: Smartphone,
      badge: 'Pocket 📲',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'kds' as TabType,
      label: 'Cozinha KDS',
      icon: ChefHat,
      badge: readyOrdersCount > 0
        ? `${activeKDSCount} chapa · ${readyOrdersCount} pronto`
        : activeKDSCount > 0
        ? activeKDSCount
        : null,
      badgeColor: 'bg-red-500 text-stone-950 font-black animate-pulse',
    },
    {
      id: 'delivery' as TabType,
      label: 'Delivery',
      icon: Bike,
      badge: activeDeliveriesCount > 0 ? activeDeliveriesCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    },
    {
      id: 'cashier' as TabType,
      label: 'Caixa',
      icon: Banknote,
      badge: cashRegister.isOpen ? 'Aberto' : 'Fechado',
      badgeColor: cashRegister.isOpen
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : 'bg-stone-800 text-stone-400',
    },
    {
      id: 'stock' as TabType,
      label: 'Estoque',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} alertas` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: BarChart3,
      badge: 'Gráficos',
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    },
    {
      id: 'finance' as TabType,
      label: 'Financeiro',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'qr' as TabType,
      label: 'Gerador de QRs',
      icon: QrCode,
      badge: '01-30',
      badgeColor: 'bg-stone-800 text-amber-400 border border-stone-700',
    },
    {
      id: 'settings' as TabType,
      label: 'Configurações',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navigation Header */}
      <header className="border-b border-stone-800/80 bg-stone-950/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/20">
              🍔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-stone-100">
                  {companyInfo?.fantasyName || config.restaurantName || 'Hamburgueria Artesanal'}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                  Sistema Completo
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Mari Virtual + KDS + Mesas 01-30 + PDV + Estoque
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isPermitted = tab.id === 'integration' || hasPermission(tab.id as SystemPermission);

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                      : isPermitted
                      ? 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/50'
                  }`}
                  title={!isPermitted ? `Requer permissão de acesso para ${tab.label}` : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {!isPermitted && <Lock className="w-2.5 h-2.5 text-stone-600 ml-0.5" />}
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                        isActive ? 'bg-stone-950 text-amber-400' : tab.badgeColor || 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Active Operator */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Operator Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={currentEmployee?.id || ''}
                onChange={(e) => setCurrentEmployeeId(e.target.value || null)}
                className="bg-transparent text-stone-200 font-bold text-xs outline-none cursor-pointer max-w-[140px] truncate"
                title="Trocar operador ativo do sistema"
              >
                <option value="" className="bg-stone-900 text-stone-200">Acesso Master</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-stone-900 text-stone-200">
                    {emp.name.split(' ')[0]} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            {readyOrdersCount > 0 && (
              <button
                onClick={() => {
                  setActiveTab('tables');
                  soundFX.playOrderReadyAlert();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 animate-bounce cursor-pointer"
                title="Pedidos prontos na cozinha aguardando garçom"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{readyOrdersCount} Pronto(s)!</span>
              </button>
            )}

            {activeKDSCount > 0 && (
              <button
                onClick={() => setActiveTab('kds')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-xl text-xs font-bold animate-pulse"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>KDS ({activeKDSCount})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab(activeTab === 'chat' ? 'menu' : 'chat')}
              className="px-3.5 py-1.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer hidden md:flex items-center gap-1.5"
            >
              {activeTab === 'chat' ? (
                <>
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Abrir Cardápio</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Mari</span>
                </>
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Medium Screen Horizontal Scroll Navigation */}
        <div className="hidden md:flex xl:hidden border-t border-stone-800/60 px-4 py-2 gap-1 overflow-x-auto scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-black'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                      isActive ? 'bg-stone-950 text-amber-400' : tab.badgeColor || 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Full Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-stone-950 border-t border-stone-800 p-3 space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-black'
                      : 'text-stone-300 hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-stone-950 text-amber-400' : tab.badgeColor || 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Banner de Persistência com IndexedDB e Contingência Offline */}
      <OfflineIndicator />

      {/* Floating Global Banner for Order Ready Alert */}
      {attendantAlert && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 px-4 py-3 shadow-2xl border-b border-amber-600 sticky top-[57px] z-40 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs uppercase tracking-wide bg-stone-950 text-stone-100 px-2 py-0.5 rounded-lg">
                    {attendantAlert.tableNumber ? `MESA ${attendantAlert.tableNumber}` : 'DELIVERY'}
                  </span>
                  <span className="font-extrabold text-sm text-stone-950">
                    🔔 Pedido #{attendantAlert.displayNumber} está PRONTO na Cozinha!
                  </span>
                  <span className="text-xs text-stone-800 font-bold">
                    às {attendantAlert.timestamp}
                  </span>
                </div>
                <p className="text-xs text-stone-900 font-semibold truncate max-w-2xl mt-0.5">
                  Itens na bancada: {attendantAlert.itemsSummary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                onClick={() => soundFX.playOrderReadyAlert()}
                className="px-3 py-1.5 bg-stone-950/15 hover:bg-stone-950/25 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1 border border-stone-950/20 cursor-pointer transition-colors"
                title="Tocar sino sonoro novamente"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Repetir Sino</span>
              </button>

              <button
                onClick={() => {
                  if (attendantAlert.tableNumber) {
                    setActiveTab('tables');
                  } else {
                    setActiveTab('delivery');
                  }
                  dismissAttendantAlert();
                }}
                className="px-4 py-1.5 bg-stone-950 hover:bg-stone-900 text-amber-400 text-xs font-black rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1"
              >
                <span>{attendantAlert.tableNumber ? 'Ver Mesa no Salão' : 'Ver no Delivery'}</span>
              </button>

              <button
                onClick={dismissAttendantAlert}
                className="p-1.5 text-stone-900 hover:text-stone-950 hover:bg-stone-950/10 rounded-lg cursor-pointer transition-colors"
                title="Dispensar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-start">
        {activeTab !== 'integration' && !hasPermission(activeTab as SystemPermission) ? (
          <div className="max-w-md mx-auto my-12 p-8 bg-stone-900 border border-stone-800 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-stone-100">
              Módulo com Acesso Restrito
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              O operador ativo <strong>{currentEmployee?.name}</strong> ({currentEmployee?.role}) não possui permissão concedida para acessar esta funcionalidade.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentEmployeeId('emp-5')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs cursor-pointer shadow-md"
              >
                Trocar para Gerente
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Ver Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'chat' && (
              <WhatsAppChat
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onOpenMenu={() => setActiveTab('menu')}
              />
            )}

            {activeTab === 'menu' && (
              <DigitalMenu
                config={config}
                onBackToChat={() => setActiveTab('chat')}
                onNavigateToTab={(tab) => setActiveTab(tab as TabType)}
              />
            )}

            {activeTab === 'tables' && (
              <FloorPlanTables
                config={config}
                onOpenTableMenu={handleOpenTableMenu}
              />
            )}

            {activeTab === 'mobile_comanda' && (
              <MobileComanda config={config} />
            )}

            {activeTab === 'kds' && (
              <KitchenKDS config={config} />
            )}

            {activeTab === 'delivery' && (
              <DeliveryManager config={config} />
            )}

            {activeTab === 'cashier' && (
              <CashierPDV config={config} />
            )}

            {activeTab === 'stock' && (
              <StockManager />
            )}

            {activeTab === 'dashboard' && (
              <FinanceDashboard />
            )}

            {activeTab === 'finance' && (
              <FinanceManager />
            )}

            {activeTab === 'qr' && (
              <TableQRGenerator
                config={config}
                onOpenTableMenu={handleOpenTableMenu}
                onOpenMobileComanda={(tableNum) => {
                  if (tableNum) setSelectedTableForMenu(tableNum);
                  setActiveTab('mobile_comanda');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel
                config={config}
                onSave={handleUpdateConfig}
                onReset={handleResetConfig}
              />
            )}

            {activeTab === 'integration' && (
              <IntegrationGuide config={config} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-4 px-6 text-center text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
        <p>
          {config.restaurantName} · Sistema Integrado de Hamburgueria · Atendente Mari no WhatsApp
        </p>
        <div className="flex items-center gap-3 text-[11px] text-stone-400">
          <span>KDS Ativo</span>
          <span>•</span>
          <span>Mesas 01 a 30</span>
          <span>•</span>
          <span>PIX Instantâneo</span>
          <span>•</span>
          <span>Estoque Automatizado</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BurgerSystemProvider>
      <BurgerAppContent />
    </BurgerSystemProvider>
  );
}
