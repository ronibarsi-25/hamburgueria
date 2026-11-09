import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  ArrowLeft,
  Check,
  Bike,
  Clock,
  Sparkles,
  QrCode,
  CreditCard,
  Copy,
  Printer,
  ChevronRight,
  MapPin,
  CheckCircle2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { MenuItem, RestaurantConfig, CartItem, Order, PaymentMethod } from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { ThermalPrintModal } from './ThermalPrintModal.tsx';

interface DigitalMenuProps {
  config: RestaurantConfig;
  onBackToChat: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const DigitalMenu: React.FC<DigitalMenuProps> = ({ config, onBackToChat, onNavigateToTab }) => {
  const {
    selectedTableForMenu,
    setSelectedTableForMenu,
    createOrder,
    neighborhoodFees,
    tables,
    menuItems,
  } = useBurgerSystem();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'mesa' | 'delivery'>(
    selectedTableForMenu ? 'mesa' : 'delivery'
  );
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>(
    selectedTableForMenu || '01'
  );

  // Delivery info
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(
    neighborhoodFees[0]?.name || config.neighborhoods[0] || 'Centro'
  );
  const [customerName, setCustomerName] = useState('Cliente do Cardápio');
  const [customerPhone, setCustomerPhone] = useState('(11) 98765-4321');
  const [customerAddress, setCustomerAddress] = useState('Rua das Flores, 123');
  const [customerNumber, setCustomerNumber] = useState('42');
  const [orderNotes, setOrderNotes] = useState('');

  // Payment method selection
  const [paymentChoice, setPaymentChoice] = useState<'MESA' | 'PIX'>('MESA');

  // Completed order state
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixPaidSimulated, setPixPaidSimulated] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [thermalModalOrder, setThermalModalOrder] = useState<Order | null>(null);

  const categories = [
    { id: 'all', label: 'Todos os Itens' },
    { id: 'burgers', label: '🍔 Burgers Artesanais' },
    { id: 'sides', label: '🍟 Acompanhamentos' },
    { id: 'drinks', label: '🥤 Bebidas Geladas' },
    { id: 'desserts', label: '🍨 Sobremesas' },
  ];

  const availableItems = (menuItems && menuItems.length > 0 ? menuItems : config.featuredItems).filter(
    (item) => item.active !== false
  );

  const filteredItems =
    selectedCategory === 'all'
      ? availableItems
      : availableItems.filter((item) => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((ci) =>
          ci.menuItem.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
        );
      }
      return prev.filter((ci) => ci.menuItem.id !== itemId);
    });
  };

  const activeNeighborhoodFee =
    neighborhoodFees.find((n) => n.name === selectedNeighborhood)?.fee || 6.0;

  const currentDeliveryFee = orderType === 'delivery' ? activeNeighborhoodFee : 0;
  const subtotal = cart.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  const total = subtotal > 0 ? subtotal + currentDeliveryFee : 0;
  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // Simulated dynamic PIX payload
  const simulatedPixCode = `00020126580014br.gov.bcb.pix0136${config.pixKey || 'pix@minhahamburgueria.com.br'}520400005303986540${total.toFixed(
    2
  )}5802BR5925${config.pixReceiverName || 'BURGER HOUSE'}6009SAOPAULO62070503***6304${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentChoice === 'PIX') {
      setPixModalOpen(true);
      return;
    }

    // Direct submit for "Pagar na Mesa / Garçom"
    submitOrder(undefined);
  };

  const submitOrder = (method?: PaymentMethod) => {
    const isMesa = orderType === 'mesa' || !!selectedTableForMenu;
    const tableNum = isMesa ? (selectedTableForMenu || selectedTableNumber).padStart(2, '0') : undefined;

    const order = createOrder({
      type: isMesa ? 'mesa' : 'delivery',
      tableNumber: tableNum,
      customer: !isMesa
        ? {
            name: customerName,
            phone: customerPhone,
            cep: '01310-100',
            address: customerAddress,
            number: customerNumber,
            bairro: selectedNeighborhood,
          }
        : undefined,
      items: cart,
      deliveryFee: currentDeliveryFee,
      discount: 0,
      paymentMethod: method,
      notes: orderNotes,
    });

    setCreatedOrder(order);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
  };

  const handleConfirmPixPayment = () => {
    setPixPaidSimulated(true);
    setTimeout(() => {
      setPixModalOpen(false);
      submitOrder('PIX');
      setPixPaidSimulated(false);
    }, 1200);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(simulatedPixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl overflow-hidden min-h-[640px] flex flex-col">
      {/* Table Banner if QR Code scanned */}
      {selectedTableForMenu && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>MESA {selectedTableForMenu} - Comanda Aberta Vinculada ao QR Code</span>
          </div>
          <button
            onClick={() => setSelectedTableForMenu(null)}
            className="text-[11px] text-stone-400 hover:text-stone-200 underline font-semibold"
          >
            Mudar para Delivery
          </button>
        </div>
      )}

      {/* Top Bar for Digital Menu */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBackToChat}
          className="flex items-center gap-2 text-stone-300 hover:text-amber-400 font-semibold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Atendimento WhatsApp</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-400 font-mono hidden sm:inline">{config.menuUrl}</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
            Cardápio Online & Mesa Integrado
          </span>
        </div>
      </div>

      {/* Hero Banner for Restaurant */}
      <div className="relative bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950/40 p-6 border-b border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cardápio Oficial com Pedido Direto para Cozinha (KDS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
            {config.restaurantName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md">
            Hambúrgueres artesanais, carnes nobres, queijo derretido e batata rústica crocante.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300 pt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{config.openingHours}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-amber-400" />
              <span>Entrega Rápida ou Pedido na Mesa</span>
            </div>
          </div>
        </div>

        {/* Quick Cart Summary Badge */}
        {totalItemsCount > 0 && (
          <div className="bg-stone-900/90 border border-amber-500/40 p-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              {totalItemsCount}
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Sacola Atual</p>
              <p className="text-sm font-bold text-amber-400 font-mono">R$ {total.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List (2 cols on large) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const inCart = cart.find((ci) => ci.menuItem.id === item.id);
              return (
                <div
                  key={item.id}
                  className="bg-stone-900/70 border border-stone-800 rounded-xl overflow-hidden hover:border-stone-700 transition-all flex flex-col justify-between group"
                >
                  {item.imageUrl && (
                    <div className="w-full h-36 bg-stone-800 overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {item.popular && (
                        <span className="absolute top-2 left-2 bg-amber-500 text-stone-950 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                          Favorito da Casa
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-stone-100 text-sm group-hover:text-amber-400 transition-colors">
                          {item.name}
                        </h3>
                        <span className="text-amber-400 font-bold font-mono text-xs whitespace-nowrap">
                          R$ {item.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
                      {inCart ? (
                        <div className="flex items-center gap-2 bg-stone-800 px-2 py-1 rounded-lg">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-stone-300 hover:text-rose-400 p-0.5 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-amber-400 w-4 text-center font-mono">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="text-stone-300 hover:text-amber-400 p-0.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-full py-1.5 px-3 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar / Bag & Checkout (1 col) */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 flex flex-col justify-between h-fit space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-stone-100 text-sm">
                  {selectedTableForMenu ? `Comanda Mesa ${selectedTableForMenu}` : 'Sua Sacola'}
                </h2>
              </div>
              <span className="text-xs text-stone-400">{totalItemsCount} itens</span>
            </div>

            {/* Order Type Selector */}
            {!selectedTableForMenu && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-950 rounded-xl my-3 border border-stone-800">
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    orderType === 'delivery'
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  Delivery
                </button>
                <button
                  onClick={() => setOrderType('mesa')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    orderType === 'mesa'
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Na Mesa
                </button>
              </div>
            )}

            {/* Table or Delivery Details Form */}
            {orderType === 'mesa' || selectedTableForMenu ? (
              <div className="my-3 space-y-2 text-xs bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Mesa do Pedido:</span>
                  {selectedTableForMenu ? (
                    <span className="font-black text-amber-400 text-sm">MESA {selectedTableForMenu}</span>
                  ) : (
                    <select
                      value={selectedTableNumber}
                      onChange={(e) => setSelectedTableNumber(e.target.value)}
                      className="bg-stone-800 text-amber-400 font-bold px-2 py-1 rounded border border-stone-700 outline-none"
                    >
                      {tables.map((t) => (
                        <option key={t.id} value={t.number}>
                          Mesa {t.number} ({t.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  O pedido é enviado direto para a tela KDS da cozinha com a comanda da mesa vinculada.
                </p>
              </div>
            ) : (
              <div className="my-3 space-y-2 text-xs">
                <label className="text-stone-400 font-medium block">Bairro para entrega:</label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full bg-stone-800 text-stone-200 text-xs rounded-lg px-3 py-2 border border-stone-700 outline-none focus:border-amber-500"
                >
                  {neighborhoodFees.map((fee) => (
                    <option key={fee.id} value={fee.name}>
                      {fee.name} (Taxa: R$ {fee.fee.toFixed(2)})
                    </option>
                  ))}
                </select>

                <label className="text-stone-400 font-medium block pt-1">Endereço e Número:</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="col-span-2 bg-stone-800 text-stone-200 text-xs rounded-lg px-3 py-2 border border-stone-700 outline-none focus:border-amber-500"
                    placeholder="Rua ou Av."
                  />
                  <input
                    type="text"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    className="bg-stone-800 text-stone-200 text-xs rounded-lg px-2 py-2 border border-stone-700 outline-none text-center focus:border-amber-500"
                    placeholder="Nº"
                  />
                </div>
              </div>
            )}

            {/* Observation / Notes */}
            <div className="mb-3">
              <label className="text-[11px] text-stone-400 block mb-1">
                Observações para a cozinha (opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Ponto da carne bem passado, sem picles"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full bg-stone-800 text-stone-200 text-xs rounded-lg px-3 py-1.5 border border-stone-700 outline-none focus:border-amber-500"
              />
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-6 text-center text-stone-500 text-xs">
                <p>Sua comanda está vazia.</p>
                <p className="mt-1 text-[11px] text-stone-600">
                  Adicione burgers artesanais ou bebidas geladas!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 my-2">
                {cart.map((ci) => (
                  <div
                    key={ci.menuItem.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-stone-800/60"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-stone-200 truncate">
                        {ci.quantity}x {ci.menuItem.name}
                      </p>
                    </div>
                    <span className="font-mono text-stone-300 font-medium">
                      R$ {(ci.menuItem.price * ci.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Choice Selector (Requirement 6) */}
            {cart.length > 0 && (
              <div className="pt-2 border-t border-stone-800 space-y-2">
                <label className="text-xs font-bold text-stone-300 block">
                  Como prefere pagar?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('MESA')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentChoice === 'MESA'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1" />
                    <div className="text-xs font-bold leading-tight">No Caixa / Garçom</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Pagar depois</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('PIX')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentChoice === 'PIX'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mb-1" />
                    <div className="text-xs font-bold leading-tight">Pagar Agora com PIX</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">QR Code dinâmico</div>
                  </button>
                </div>
              </div>
            )}

            {/* Calculations */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-stone-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && !selectedTableForMenu && (
                  <div className="flex justify-between text-stone-400">
                    <span>Taxa de Entrega ({selectedNeighborhood})</span>
                    <span className="font-mono">R$ {currentDeliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-400 font-bold text-sm pt-2 border-t border-stone-800">
                  <span>Total da Comanda</span>
                  <span className="font-mono">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Checkout CTA or Confirmation Banner */}
          {createdOrder ? (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center space-y-2.5 animate-in fade-in">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-5 h-5 font-bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400">
                  Pedido #{createdOrder.displayNumber} Enviado para a Cozinha! 🚀
                </p>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  {createdOrder.tableNumber
                    ? `Vinculado à MESA ${createdOrder.tableNumber} - Comanda Aberta`
                    : 'Pedido Delivery recebido e em fila de preparo'}
                </p>
                <p className="text-[10px] text-stone-400 font-mono mt-1">
                  Status: {createdOrder.status} | Pagamento: {createdOrder.paymentStatus}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setThermalModalOrder(createdOrder)}
                  className="flex-1 py-1.5 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 border border-stone-700"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  Imprimir 80mm
                </button>
                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab('kds')}
                    className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    Ver no KDS
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setCreatedOrder(null);
                  setCart([]);
                  setOrderNotes('');
                }}
                className="mt-2 text-xs text-amber-400 underline font-semibold block mx-auto cursor-pointer"
              >
                + Fazer outro pedido nesta mesa
              </button>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>
                {paymentChoice === 'PIX'
                  ? `Pagar R$ ${total.toFixed(2)} com PIX e Enviar à Cozinha`
                  : 'Enviar Pedido Direto para a Cozinha (KDS)'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC PIX PAYMENT MODAL (Requirement 6) */}
      {pixModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                <QrCode className="w-3.5 h-3.5" />
                PIX Dinâmico Instantâneo
              </div>
              <h3 className="font-black text-stone-100 text-lg">Pagar com PIX</h3>
              <p className="text-xs text-stone-400">
                Escaneie o QR Code abaixo com o app do seu banco
              </p>
            </div>

            {/* QR Code SVG */}
            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center mx-auto shadow-inner w-56 h-56 border-4 border-amber-500">
              <QRCodeSVG
                value={simulatedPixCode}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="text-center">
              <div className="text-xs text-stone-400">Valor da Comanda:</div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                R$ {total.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                Favorecido: {config.pixReceiverName || 'Hamburgueria Artesanal'}
              </div>
            </div>

            {/* Pix Copy & Paste */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-400 block font-semibold">
                Código Pix Copia e Cola:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={simulatedPixCode}
                  className="bg-stone-950 border border-stone-700 text-stone-300 text-[11px] font-mono px-2.5 py-2 rounded-xl w-full truncate select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1 border border-stone-700 transition-colors flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedPix ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Simulated Payment Confirmation */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmPixPayment}
                disabled={pixPaidSimulated}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {pixPaidSimulated ? (
                  <>
                    <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    Processando Pagamento no Banco...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 font-bold" />
                    Simular Confirmação do Pagamento PIX
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPixModalOpen(false)}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs rounded-xl"
              >
                Voltar e Escolher Outra Forma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Print Modal */}
      {thermalModalOrder && (
        <ThermalPrintModal
          config={config}
          order={thermalModalOrder}
          onClose={() => setThermalModalOrder(null)}
        />
      )}
    </div>
  );
};
