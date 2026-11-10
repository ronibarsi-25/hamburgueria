import React, { useState } from 'react';
import {
  Bike,
  Plus,
  MapPin,
  Clock,
  Phone,
  Search,
  CheckCircle2,
  Printer,
  User,
  DollarSign,
  AlertCircle,
  Flame,
  Navigation,
  Users,
  Edit3,
  Trash2,
  IdCard,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import {
  Order,
  CustomerDelivery,
  Customer,
  NeighborhoodFee,
  RestaurantConfig,
  MenuItem,
} from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { ThermalPrintModal } from './ThermalPrintModal.tsx';

interface DeliveryManagerProps {
  config: RestaurantConfig;
}

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({ config }) => {
  const {
    orders,
    neighborhoodFees,
    updateOrderStatus,
    createOrder,
    updateNeighborhoodFees,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    findCustomers,
  } = useBurgerSystem();

  const [activeTab, setActiveTab] = useState<
    'orders' | 'new_order' | 'customers' | 'fees' | 'tracking'
  >('orders');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // New Delivery Order Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCpf, setCustCpf] = useState('');
  const [custCep, setCustCep] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custNumber, setCustNumber] = useState('');
  const [custBairro, setCustBairro] = useState(neighborhoodFees[0]?.name || 'Centro');
  const [custComplement, setCustComplement] = useState('');
  const [custReference, setCustReference] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ menuItem: MenuItem; quantity: number }[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Autocomplete / Quick Search in New Order
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [selectedRegisteredCustomer, setSelectedRegisteredCustomer] = useState<Customer | null>(null);

  // CRM List Filter
  const [crmSearchQuery, setCrmSearchQuery] = useState('');

  // Customer Add / Edit Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalCpf, setModalCpf] = useState('');
  const [modalCep, setModalCep] = useState('');
  const [modalAddress, setModalAddress] = useState('');
  const [modalNumber, setModalNumber] = useState('');
  const [modalBairro, setModalBairro] = useState(neighborhoodFees[0]?.name || 'Centro');
  const [modalComplement, setModalComplement] = useState('');
  const [modalReference, setModalReference] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalError, setModalError] = useState('');

  // Neighborhood Fees editor state
  const [feesList, setFeesList] = useState<NeighborhoodFee[]>(neighborhoodFees);
  const [newBairroName, setNewBairroName] = useState('');
  const [newBairroFee, setNewBairroFee] = useState('8.00');
  const [newBairroTime, setNewBairroTime] = useState('30-40 min');

  const deliveryOrders = orders.filter((o) => o.type === 'delivery');

  // Search results for fast auto-fill
  const searchResults = customerSearchQuery.trim() ? findCustomers(customerSearchQuery) : [];

  // Filtered customers for CRM tab
  const crmCustomers = crmSearchQuery.trim()
    ? findCustomers(crmSearchQuery)
    : customers;

  // Select customer into delivery order form
  const handleSelectCustomer = (customer: Customer) => {
    setCustName(customer.name);
    setCustPhone(customer.phone);
    setCustCpf(customer.cpf || '');
    setCustCep(customer.cep || '');
    setCustAddress(customer.address);
    setCustNumber(customer.number);
    setCustBairro(customer.bairro);
    setCustComplement(customer.complement || '');
    setCustReference(customer.reference || '');
    if (customer.notes && !deliveryNotes) {
      setDeliveryNotes(customer.notes);
    }
    setSelectedRegisteredCustomer(customer);
    setCustomerSearchQuery('');
    setIsSearchDropdownOpen(false);
  };

  const handleClearSelectedCustomer = () => {
    setSelectedRegisteredCustomer(null);
  };

  // Fast CEP simulation helper
  const handleCepLookup = () => {
    const clean = custCep.replace(/\D/g, '');
    if (clean.length >= 8) {
      setCustAddress('Av. Paulista');
      setCustBairro('Bela Vista');
    }
  };

  const handleAddItemToForm = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.menuItem.id === item.id);
      if (exists) {
        return prev.map((i) => (i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleRemoveItemFromForm = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.menuItem.id !== itemId));
  };

  const handleCreateDeliveryOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone || selectedItems.length === 0) return;

    const feeObj = neighborhoodFees.find((f) => f.name.toLowerCase() === custBairro.toLowerCase());
    const deliveryFee = feeObj ? feeObj.fee : 7.0;

    const customer: CustomerDelivery = {
      name: custName,
      phone: custPhone,
      cpf: custCpf.trim() || undefined,
      cep: custCep.trim() || undefined,
      address: custAddress,
      number: custNumber,
      bairro: custBairro,
      complement: custComplement.trim() || undefined,
      reference: custReference.trim() || undefined,
    };

    const newOrder = createOrder({
      type: 'delivery',
      customer,
      items: selectedItems,
      deliveryFee,
      notes: deliveryNotes,
    });

    setSelectedOrderForTracking(newOrder);
    setActiveTab('tracking');
    setSelectedItems([]);
    setSelectedRegisteredCustomer(null);
  };

  // Customer Modal Open / Submit
  const handleOpenNewCustomerModal = () => {
    setEditingCustomer(null);
    setModalName('');
    setModalPhone('');
    setModalCpf('');
    setModalCep('');
    setModalAddress('');
    setModalNumber('');
    setModalBairro(neighborhoodFees[0]?.name || 'Centro');
    setModalComplement('');
    setModalReference('');
    setModalNotes('');
    setModalError('');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalName(customer.name);
    setModalPhone(customer.phone);
    setModalCpf(customer.cpf || '');
    setModalCep(customer.cep || '');
    setModalAddress(customer.address);
    setModalNumber(customer.number);
    setModalBairro(customer.bairro);
    setModalComplement(customer.complement || '');
    setModalReference(customer.reference || '');
    setModalNotes(customer.notes || '');
    setModalError('');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomerModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim() || !modalPhone.trim() || !modalAddress.trim() || !modalNumber.trim()) {
      setModalError('Preencha os campos obrigatórios (Nome, Telefone, Endereço e Número).');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: modalName.trim(),
        phone: modalPhone.trim(),
        cpf: modalCpf.trim() || undefined,
        cep: modalCep.trim() || undefined,
        address: modalAddress.trim(),
        number: modalNumber.trim(),
        bairro: modalBairro.trim(),
        complement: modalComplement.trim() || undefined,
        reference: modalReference.trim() || undefined,
        notes: modalNotes.trim() || undefined,
      });
    } else {
      const created = addCustomer({
        name: modalName.trim(),
        phone: modalPhone.trim(),
        cpf: modalCpf.trim() || undefined,
        cep: modalCep.trim() || undefined,
        address: modalAddress.trim(),
        number: modalNumber.trim(),
        bairro: modalBairro.trim(),
        complement: modalComplement.trim() || undefined,
        reference: modalReference.trim() || undefined,
        notes: modalNotes.trim() || undefined,
      });

      // If in new_order tab, auto-select this new customer immediately
      if (activeTab === 'new_order') {
        handleSelectCustomer(created);
      }
    }

    setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomerPrompt = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o cliente "${name}" da base de dados?`)) {
      deleteCustomer(id);
      if (selectedRegisteredCustomer?.id === id) {
        setSelectedRegisteredCustomer(null);
      }
    }
  };

  const handleStartOrderForCustomer = (customer: Customer) => {
    handleSelectCustomer(customer);
    setActiveTab('new_order');
  };

  // Neighborhood Fees handlers
  const handleAddNeighborhoodFee = () => {
    if (!newBairroName.trim()) return;
    const newFee: NeighborhoodFee = {
      id: `fee-${Date.now()}`,
      name: newBairroName.trim(),
      fee: parseFloat(newBairroFee) || 7.0,
      estimatedMinutes: newBairroTime.trim(),
    };
    const updated = [...feesList, newFee];
    setFeesList(updated);
    updateNeighborhoodFees(updated);
    setNewBairroName('');
  };

  const handleDeleteNeighborhoodFee = (id: string) => {
    const updated = feesList.filter((f) => f.id !== id);
    setFeesList(updated);
    updateNeighborhoodFees(updated);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100">Delivery & Clientes</h2>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[11px] font-bold">
                Logística & CRM
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Gestão de entregas, busca e cadastro de clientes (Telefone, CPF, Nome) e despacho
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Pedidos em Rota ({deliveryOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('new_order')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'new_order'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Pedido Delivery</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Base de Clientes ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tracking'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Rastreamento</span>
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fees'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Taxas por Bairro</span>
          </button>
        </div>
      </div>

      {/* Tab: Orders in Progress */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {deliveryOrders.length === 0 ? (
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-12 text-center space-y-3">
              <Bike className="w-12 h-12 text-stone-600 mx-auto" />
              <h3 className="text-stone-300 font-bold text-sm">Nenhum pedido delivery ativo no momento</h3>
              <p className="text-stone-500 text-xs max-w-sm mx-auto">
                Cadastre um novo pedido pelo balcão ou telefone usando a aba &quot;Novo Pedido Delivery&quot;.
              </p>
              <button
                onClick={() => setActiveTab('new_order')}
                className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                + Criar Pedido Delivery
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveryOrders.map((order) => {
                const customer = order.customer;
                return (
                  <div
                    key={order.id}
                    className="bg-stone-950 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-stone-700 transition-all"
                  >
                    <div>
                      {/* Top Order Badge */}
                      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                        <div>
                          <span className="font-mono font-black text-amber-400 text-sm">
                            #{order.displayNumber}
                          </span>
                          <span className="text-xs text-stone-400 ml-2">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            order.status === 'NOVO'
                              ? 'bg-amber-500/20 text-amber-400'
                              : order.status === 'EM PREPARO'
                              ? 'bg-blue-500/20 text-blue-400'
                              : order.status === 'SAIU_ENTREGA'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {/* Customer Info */}
                      {customer && (
                        <div className="pt-3 space-y-1 text-xs">
                          <p className="font-bold text-stone-100 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            <span>{customer.name}</span>
                          </p>
                          <p className="text-stone-400 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-stone-500" />
                            <span>{customer.phone}</span>
                            {customer.cpf && (
                              <span className="text-[10px] text-stone-500 font-mono ml-2">
                                CPF: {customer.cpf}
                              </span>
                            )}
                          </p>
                          <p className="text-stone-300 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span>
                              {customer.address}, {customer.number} - {customer.bairro}
                            </span>
                          </p>
                          {customer.complement && (
                            <p className="text-[11px] text-stone-500 pl-5">
                              Compl: {customer.complement}
                            </p>
                          )}
                          {customer.reference && (
                            <p className="text-[10px] text-stone-500 pl-5 italic">
                              Ref: {customer.reference}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Items List */}
                      <div className="pt-3 border-t border-stone-800/80 my-2 space-y-1 text-xs text-stone-300">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-mono text-stone-400">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total & Fee */}
                      <div className="pt-2 border-t border-stone-800 text-xs flex items-center justify-between">
                        <span className="text-stone-400">
                          Taxa: R$ {order.deliveryFee.toFixed(2)}
                        </span>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          Total: R$ {order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Pipeline Action Buttons */}
                    <div className="pt-2 border-t border-stone-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => {
                            setSelectedOrderForTracking(order);
                            setActiveTab('tracking');
                          }}
                          className="py-1.5 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-sky-400" />
                          <span>Rastrear</span>
                        </button>

                        <button
                          onClick={() => setPrintingOrder(order)}
                          className="py-1.5 px-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Imprimir</span>
                        </button>
                      </div>

                      {order.status === 'NOVO' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'EM PREPARO')}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Enviar para a Chapa</span>
                        </button>
                      )}

                      {order.status === 'EM PREPARO' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'SAIU_ENTREGA')}
                          className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Despachar Motoboy</span>
                        </button>
                      )}

                      {order.status === 'SAIU_ENTREGA' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ENTREGUE')}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Entrega</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: New Delivery Order Form */}
      {activeTab === 'new_order' && (
        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800 gap-2">
            <h3 className="font-bold text-stone-100 text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Cadastrar Pedido Delivery (Balcão / Telefone)</span>
            </h3>

            <button
              type="button"
              onClick={handleOpenNewCustomerModal}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ Cadastrar Novo Cliente</span>
            </button>
          </div>

          {/* Quick Customer Lookup Search Bar (Telefone, CPF, Nome) */}
          <div className="bg-stone-900/80 p-4 rounded-2xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-stone-200 text-xs">
                  Localizar Cliente Cadastrado (Telefone, CPF ou Nome)
                </span>
              </div>
              <span className="text-[10px] text-stone-500">
                Auto-preenchimento instantâneo do endereço
              </span>
            </div>

            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setIsSearchDropdownOpen(true);
                    }}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    placeholder="Digite o Telefone, CPF ou Nome do cliente..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-xs focus:border-amber-500 outline-none pr-8"
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setIsSearchDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar</span>
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchDropdownOpen && customerSearchQuery.trim() && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-stone-900 border border-amber-500/40 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1.5 space-y-1">
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-stone-400">
                      Nenhum cliente encontrado com &quot;{customerSearchQuery}&quot;.{' '}
                      <button
                        type="button"
                        onClick={handleOpenNewCustomerModal}
                        className="text-amber-400 font-bold hover:underline cursor-pointer ml-1"
                      >
                        Cadastrar agora?
                      </button>
                    </div>
                  ) : (
                    searchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full p-2.5 rounded-lg text-left hover:bg-stone-800 flex items-start justify-between gap-3 text-xs transition-colors cursor-pointer group"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-stone-100 group-hover:text-amber-400">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-stone-400 flex items-center gap-2">
                            <span>📞 {c.phone}</span>
                            {c.cpf && <span>🆔 CPF: {c.cpf}</span>}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            📍 {c.address}, {c.number} - {c.bairro}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                            {c.totalOrdersCount} pedidos
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Registered Customer Chip */}
            {selectedRegisteredCustomer && (
              <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-stone-200">
                    Cliente identificado:{' '}
                    <strong className="text-amber-400">{selectedRegisteredCustomer.name}</strong>{' '}
                    ({selectedRegisteredCustomer.phone})
                  </span>
                  <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-400">
                    {selectedRegisteredCustomer.totalOrdersCount} pedidos já realizados
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedCustomer}
                  className="text-stone-400 hover:text-stone-200 text-xs font-semibold cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleCreateDeliveryOrder} className="space-y-6 text-xs">
            {/* Customer Data */}
            <div className="space-y-3">
              <h4 className="font-bold text-stone-300 uppercase tracking-wider text-[11px]">
                1. Dados de Entrega do Cliente
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Nome Completo *:</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    required
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Telefone / WhatsApp *:</label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    required
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">CPF (Opcional):</label>
                  <input
                    type="text"
                    value={custCpf}
                    onChange={(e) => setCustCpf(e.target.value)}
                    placeholder="123.456.789-00"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-stone-400 block mb-1">CEP (Busca Rápida):</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={custCep}
                      onChange={(e) => setCustCep(e.target.value)}
                      placeholder="01415-000"
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCepLookup}
                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-bold"
                    >
                      Buscar
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Endereço (Rua / Av) *:</label>
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="Alameda Santos"
                    required
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Número *:</label>
                  <input
                    type="text"
                    value={custNumber}
                    onChange={(e) => setCustNumber(e.target.value)}
                    placeholder="1420"
                    required
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-stone-400 block mb-1">Bairro de Entrega *:</label>
                  <select
                    value={custBairro}
                    onChange={(e) => setCustBairro(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  >
                    {neighborhoodFees.map((fee) => (
                      <option key={fee.id} value={fee.name}>
                        {fee.name} (+ R$ {fee.fee.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Complemento (Apto, Bloco):</label>
                  <input
                    type="text"
                    value={custComplement}
                    onChange={(e) => setCustComplement(e.target.value)}
                    placeholder="Apto 81 Bloco B"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Ponto de Referência:</label>
                  <input
                    type="text"
                    value={custReference}
                    onChange={(e) => setCustReference(e.target.value)}
                    placeholder="Próximo à padaria"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Observações do Pedido / Entrega:</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ex: Tocar interfone 81, deixar na portaria, troco para 50..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Menu Items Selector */}
            <div className="space-y-3 pt-3 border-t border-stone-800">
              <h4 className="font-bold text-stone-300 uppercase tracking-wider text-[11px]">
                2. Escolher Itens do Cardápio
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {config.featuredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItemToForm(item)}
                    className="p-2.5 bg-stone-900 hover:bg-stone-800 rounded-xl border border-stone-800 text-left transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-stone-100">{item.name}</p>
                    <p className="text-amber-400 font-mono text-[11px]">
                      R$ {item.price.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Selected Items summary */}
              {selectedItems.length > 0 && (
                <div className="bg-stone-900 p-3.5 rounded-xl border border-stone-800 space-y-2 mt-2">
                  <span className="font-bold text-stone-300">Itens no Pedido:</span>
                  {selectedItems.map((si) => (
                    <div key={si.menuItem.id} className="flex justify-between items-center text-xs">
                      <span>
                        {si.quantity}x {si.menuItem.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400">
                          R$ {(si.menuItem.price * si.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromForm(si.menuItem.id)}
                          className="text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-800">
              <button
                type="submit"
                disabled={selectedItems.length === 0}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-black rounded-xl shadow-lg cursor-pointer"
              >
                Concluir Pedido e Enviar para Cozinha KDS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Base de Clientes (CRM) */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Header & CRM Actions */}
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
              <div>
                <h3 className="font-bold text-stone-100 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Base de Clientes Cadastrados</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Localize por Telefone, CPF ou Nome e inicie pedidos com endereço já preenchido
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewCustomerModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Cadastrar Cliente</span>
              </button>
            </div>

            {/* CRM Search input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={crmSearchQuery}
                  onChange={(e) => setCrmSearchQuery(e.target.value)}
                  placeholder="Localizar cliente por Telefone, CPF ou Nome..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-stone-100 text-xs focus:border-amber-500 outline-none"
                />
                {crmSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCrmSearchQuery('')}
                    className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800/80">
                <span className="text-stone-400 block text-[11px]">Clientes Cadastrados:</span>
                <span className="font-mono font-black text-stone-100 text-base">
                  {customers.length}
                </span>
              </div>
              <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800/80">
                <span className="text-stone-400 block text-[11px]">Total de Pedidos Delivery:</span>
                <span className="font-mono font-black text-amber-400 text-base">
                  {customers.reduce((acc, c) => acc + (c.totalOrdersCount || 0), 0)}
                </span>
              </div>
              <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800/80">
                <span className="text-stone-400 block text-[11px]">Faturamento Acumulado:</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  R$ {customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Customers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crmCustomers.length === 0 ? (
              <div className="col-span-full bg-stone-950 border border-stone-800 rounded-2xl p-10 text-center text-xs text-stone-400">
                Nenhum cliente encontrado com os termos pesquisados.
              </div>
            ) : (
              crmCustomers.map((c) => {
                const cleanPhoneDigits = c.phone.replace(/\D/g, '');
                const waLink = cleanPhoneDigits
                  ? `https://wa.me/55${cleanPhoneDigits}`
                  : null;

                return (
                  <div
                    key={c.id}
                    className="bg-stone-950 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Name & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-stone-100 text-sm">{c.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-stone-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              {c.phone}
                            </span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                                title="Abrir WhatsApp"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Zap</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold whitespace-nowrap">
                          {c.totalOrdersCount} pedidos
                        </span>
                      </div>

                      {/* CPF (if available) */}
                      {c.cpf && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-300">
                          <IdCard className="w-3.5 h-3.5 text-sky-400" />
                          <span className="font-mono text-[11px]">CPF: {c.cpf}</span>
                        </div>
                      )}

                      {/* Address */}
                      <div className="text-xs text-stone-300 space-y-0.5 pt-1">
                        <p className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>
                            {c.address}, {c.number} - {c.bairro}
                          </span>
                        </p>
                        {c.complement && (
                          <p className="text-[11px] text-stone-400 pl-5">
                            Compl: {c.complement}
                          </p>
                        )}
                        {c.reference && (
                          <p className="text-[10px] text-stone-500 pl-5 italic">
                            Ref: {c.reference}
                          </p>
                        )}
                      </div>

                      {/* Notes / Observações */}
                      {c.notes && (
                        <p className="text-[11px] text-amber-400/90 italic bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                          &quot;{c.notes}&quot;
                        </p>
                      )}

                      {/* Financial info */}
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-stone-400">Total Consumido:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          R$ {(c.totalSpent || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-stone-800 flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleStartOrderForCustomer(c)}
                        className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Novo Pedido</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditCustomerModal(c)}
                        className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg border border-stone-800 transition-colors cursor-pointer"
                        title="Editar Cadastro"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomerPrompt(c.id, c.name)}
                        className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg border border-stone-800 hover:border-rose-800/40 transition-colors cursor-pointer"
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Real-Time Customer Order Tracking Simulation */}
      {activeTab === 'tracking' && (
        <div className="max-w-2xl mx-auto bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Acompanhamento de Entrega em Tempo Real
            </span>
            <h3 className="text-xl font-extrabold text-stone-100">
              {config.restaurantName}
            </h3>
            {selectedOrderForTracking ? (
              <p className="text-xs text-stone-400">
                Pedido #{selectedOrderForTracking.displayNumber} · Previsão de Entrega: 30 a 40 min
              </p>
            ) : (
              <p className="text-xs text-stone-400">
                Selecione um pedido na aba de pedidos para acompanhar o rastreio.
              </p>
            )}
          </div>

          {selectedOrderForTracking ? (
            <div className="space-y-6">
              {/* Stepper */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {['Recebido', 'Na Chapa', 'Saiu p/ Entrega', 'Entregue'].map((step, idx) => {
                  const statusMap = ['NOVO', 'EM PREPARO', 'SAIU_ENTREGA', 'ENTREGUE'];
                  const currentIndex = statusMap.indexOf(selectedOrderForTracking.status);
                  const isDone = currentIndex >= idx;
                  const isCurrent = currentIndex === idx;

                  return (
                    <div key={step} className="space-y-2">
                      <div
                        className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-sm transition-all ${
                          isDone
                            ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20'
                            : 'bg-stone-900 border border-stone-800 text-stone-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <p
                        className={`text-[11px] font-bold ${
                          isCurrent
                            ? 'text-amber-400'
                            : isDone
                            ? 'text-stone-200'
                            : 'text-stone-500'
                        }`}
                      >
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Status Message */}
              <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-center gap-3">
                <Bike className="w-8 h-8 text-amber-400 animate-bounce" />
                <div>
                  <p className="font-bold text-stone-100 text-sm">
                    {selectedOrderForTracking.status === 'NOVO' && 'Pedido recebido pela cozinha!'}
                    {selectedOrderForTracking.status === 'EM PREPARO' &&
                      'O burger está no fogo na chapa artesanal!'}
                    {selectedOrderForTracking.status === 'SAIU_ENTREGA' &&
                      'O motoboy já saiu com sua bag quentinha! 🛵'}
                    {selectedOrderForTracking.status === 'ENTREGUE' &&
                      'Pedido entregue com sucesso! Bom apetite 🍔'}
                  </p>
                  <p className="text-xs text-stone-400">
                    Endereço de Entrega: {selectedOrderForTracking.customer?.address},{' '}
                    {selectedOrderForTracking.customer?.number} -{' '}
                    {selectedOrderForTracking.customer?.bairro}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500 text-xs">
              Nenhum pedido ativo selecionado para rastreio.
            </div>
          )}
        </div>
      )}

      {/* Tab: Neighborhood Fees Management */}
      {activeTab === 'fees' && (
        <div className="max-w-3xl mx-auto bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <h3 className="font-bold text-stone-100 text-sm">Cadastro de Taxas por Bairro</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Defina o valor cobrado e a estimativa de entrega para cada região atendida
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {feesList.map((fee) => (
              <div
                key={fee.id}
                className="bg-stone-900 p-3 rounded-xl border border-stone-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-stone-100">{fee.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-stone-400">{fee.estimatedMinutes}</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    R$ {fee.fee.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeleteNeighborhoodFee(fee.id)}
                    className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new Neighborhood Fee */}
          <div className="pt-3 border-t border-stone-800 bg-stone-900/40 p-4 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-stone-300">Cadastrar Novo Bairro:</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={newBairroName}
                onChange={(e) => setNewBairroName(e.target.value)}
                placeholder="Nome do Bairro"
                className="bg-stone-900 border border-stone-800 rounded-lg p-2 text-stone-100 outline-none"
              />
              <input
                type="number"
                step="0.50"
                value={newBairroFee}
                onChange={(e) => setNewBairroFee(e.target.value)}
                placeholder="Taxa (R$)"
                className="bg-stone-900 border border-stone-800 rounded-lg p-2 text-stone-100 font-mono outline-none"
              />
              <input
                type="text"
                value={newBairroTime}
                onChange={(e) => setNewBairroTime(e.target.value)}
                placeholder="Tempo (ex: 30-40 min)"
                className="bg-stone-900 border border-stone-800 rounded-lg p-2 text-stone-100 outline-none"
              />
              <button
                type="button"
                onClick={handleAddNeighborhoodFee}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg p-2 cursor-pointer"
              >
                + Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Add / Edit Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 text-sm">
                    {editingCustomer ? 'Editar Cadastro de Cliente' : 'Cadastrar Novo Cliente'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Dados completos para localização por Telefone, CPF ou Nome
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">
                    Nome Completo *:
                  </label>
                  <input
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    required
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">
                    Telefone / WhatsApp *:
                  </label>
                  <input
                    type="text"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    required
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">
                    CPF (Opcional):
                  </label>
                  <input
                    type="text"
                    value={modalCpf}
                    onChange={(e) => setModalCpf(e.target.value)}
                    placeholder="123.456.789-00"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">
                    CEP:
                  </label>
                  <input
                    type="text"
                    value={modalCep}
                    onChange={(e) => setModalCep(e.target.value)}
                    placeholder="01415-000"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-stone-300 font-semibold block mb-1">
                    Endereço (Rua / Av) *:
                  </label>
                  <input
                    type="text"
                    value={modalAddress}
                    onChange={(e) => setModalAddress(e.target.value)}
                    placeholder="Alameda Santos"
                    required
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">
                    Número *:
                  </label>
                  <input
                    type="text"
                    value={modalNumber}
                    onChange={(e) => setModalNumber(e.target.value)}
                    placeholder="1420"
                    required
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">
                    Bairro *:
                  </label>
                  <select
                    value={modalBairro}
                    onChange={(e) => setModalBairro(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  >
                    {neighborhoodFees.map((fee) => (
                      <option key={fee.id} value={fee.name}>
                        {fee.name} (+ R$ {fee.fee.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-stone-300 font-semibold block mb-1">
                    Complemento:
                  </label>
                  <input
                    type="text"
                    value={modalComplement}
                    onChange={(e) => setModalComplement(e.target.value)}
                    placeholder="Apto 81 Bloco B"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-300 font-semibold block mb-1">
                  Ponto de Referência:
                </label>
                <input
                  type="text"
                  value={modalReference}
                  onChange={(e) => setModalReference(e.target.value)}
                  placeholder="Próximo à padaria"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-stone-300 font-semibold block mb-1">
                  Observações / Preferências do Cliente:
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Ex: Interfone quebrado, ligar quando chegar..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100 focus:border-amber-500 outline-none"
                />
              </div>

              {modalError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 border border-stone-700 hover:bg-stone-800 rounded-xl text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {editingCustomer ? 'Salvar Alterações' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Print Modal */}
      {printingOrder && (
        <ThermalPrintModal
          order={printingOrder}
          config={config}
          onClose={() => setPrintingOrder(null)}
          title={`Comanda Delivery #${printingOrder.displayNumber}`}
        />
      )}
    </div>
  );
};
