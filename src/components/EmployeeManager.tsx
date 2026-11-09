import React, { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Phone,
  Key,
  Clock,
  Trash2,
  Edit2,
  UserCheck,
  X,
  Check,
  Eye,
  EyeOff,
  MessageSquare,
  Utensils,
  LayoutGrid,
  ChefHat,
  Bike,
  Banknote,
  Boxes,
  TrendingUp,
  QrCode,
  Settings,
  Search,
  Sparkles,
  Lock,
  BarChart3,
  Smartphone,
} from 'lucide-react';
import { Employee, EmployeeRole, SystemPermission } from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { ALL_SYSTEM_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../constants/defaults.ts';

const ROLE_CONFIG: Record<
  EmployeeRole,
  { label: string; badge: string; border: string; bg: string; icon: string; defaultDescription: string }
> = {
  gerente: {
    label: 'Gerente Geral',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    border: 'border-rose-500/30',
    bg: 'bg-rose-950/20',
    icon: '👑',
    defaultDescription: 'Acesso irrestrito a todos os módulos, fechamentos e configurações.',
  },
  caixa: {
    label: 'Operador de Caixa / PDV',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    border: 'border-purple-500/30',
    bg: 'bg-purple-950/20',
    icon: '💵',
    defaultDescription: 'Operação de caixa, recebimentos, sangrias, suprimentos e PDV balcão.',
  },
  atendente: {
    label: 'Atendente WhatsApp',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/20',
    icon: '💬',
    defaultDescription: 'Atendimento via Mari virtual, respostas rápidas e despacho de delivery.',
  },
  garcom: {
    label: 'Garçom / Salão',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    border: 'border-blue-500/30',
    bg: 'bg-blue-950/20',
    icon: '🪑',
    defaultDescription: 'Atendimento presencial, controle de comandas, mesas e QRs.',
  },
  cozinheiro: {
    label: 'Cozinheiro / KDS',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/20',
    icon: '🍳',
    defaultDescription: 'Fila de pedidos da cozinha KDS e conferência de insumos no estoque.',
  },
};

const PERMISSION_ICONS: Record<SystemPermission, React.ElementType> = {
  chat: MessageSquare,
  menu: Utensils,
  tables: LayoutGrid,
  kds: ChefHat,
  delivery: Bike,
  cashier: Banknote,
  stock: Boxes,
  finance: TrendingUp,
  dashboard: BarChart3,
  qr: QrCode,
  settings: Settings,
  mobile_comanda: Smartphone,
};

export const EmployeeManager: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    currentEmployee,
    setCurrentEmployeeId,
    toggleEmployeePermission,
    updateEmployeePermissions,
  } = useBurgerSystem();

  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | EmployeeRole>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('garcom');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState<'manha' | 'noite' | 'integral'>('noite');
  const [pin, setPin] = useState('1234');
  const [status, setStatus] = useState<'ativo' | 'folga' | 'inativo'>('ativo');
  const [selectedPermissions, setSelectedPermissions] = useState<SystemPermission[]>([]);

  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setName('');
    const defaultRole: EmployeeRole = 'garcom';
    setRole(defaultRole);
    setPhone('');
    setShift('noite');
    setPin(String(Math.floor(1000 + Math.random() * 9000)));
    setStatus('ativo');
    setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS[defaultRole] || ['menu', 'tables', 'qr']);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setRole(emp.role);
    setPhone(emp.phone);
    setShift(emp.shift);
    setPin(emp.pin);
    setStatus(emp.status);
    setSelectedPermissions(
      emp.permissions && emp.permissions.length > 0
        ? emp.permissions
        : DEFAULT_ROLE_PERMISSIONS[emp.role] || []
    );
    setModalOpen(true);
  };

  const handleRoleChangeInForm = (newRole: EmployeeRole) => {
    setRole(newRole);
    // Suggest default permissions for selected role
    setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || []);
  };

  const togglePermissionInForm = (perm: SystemPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleApplyRoleDefaults = () => {
    setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS[role] || []);
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(ALL_SYSTEM_PERMISSIONS.map((p) => p.id));
  };

  const handleClearPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalPermissions =
      selectedPermissions.length > 0
        ? selectedPermissions
        : DEFAULT_ROLE_PERMISSIONS[role] || ['menu', 'tables'];

    if (editingEmployee) {
      updateEmployee({
        ...editingEmployee,
        name: name.trim(),
        role,
        phone: phone.trim(),
        shift,
        pin: pin.trim(),
        status,
        permissions: finalPermissions,
      });
    } else {
      addEmployee({
        name: name.trim(),
        role,
        phone: phone.trim() || '(11) 99999-9999',
        shift,
        pin: pin.trim() || '1234',
        status,
        permissions: finalPermissions,
      });
    }

    setModalOpen(false);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm) ||
      emp.pin.includes(searchTerm);
    const matchesRole = selectedRoleFilter === 'all' || emp.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = employees.filter((e) => e.status === 'ativo').length;
  const breakCount = employees.filter((e) => e.status === 'folga').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Active Operator & Module Overview */}
      <div className="p-4 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-stone-800 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-stone-100">
                Gestão de Equipe & Permissões do Sistema
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                Controle de Acesso RBAC
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Cadastre atendentes, garçons, cozinheiros, caixas e gerentes atribuindo permissões modulares com código PIN
            </p>
          </div>
        </div>

        {/* Active Operator Selector */}
        <div className="w-full lg:w-auto flex items-center gap-3 bg-stone-950/80 border border-stone-800 rounded-xl px-3 py-2">
          <div className="text-xs">
            <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
              Operador Atual Logado:
            </span>
            <div className="flex items-center gap-1.5 font-bold text-stone-200">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentEmployee ? currentEmployee.name : 'Acesso Total Master (Admin)'}</span>
              {currentEmployee && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${ROLE_CONFIG[currentEmployee.role]?.badge}`}>
                  {ROLE_CONFIG[currentEmployee.role]?.label}
                </span>
              )}
            </div>
          </div>

          <select
            value={currentEmployee?.id || ''}
            onChange={(e) => setCurrentEmployeeId(e.target.value || null)}
            className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 font-medium outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="">Acesso Master (Ilimitado)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({ROLE_CONFIG[emp.role]?.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-xl">
          <span className="text-[11px] text-stone-400 block">Total de Colaboradores</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-stone-100">{employees.length}</span>
            <span className="text-xs text-stone-500">cadastrados</span>
          </div>
        </div>

        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-xl">
          <span className="text-[11px] text-emerald-400 block font-semibold">Em Serviço Ativo</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">{activeCount}</span>
            <span className="text-xs text-stone-500">em turno</span>
          </div>
        </div>

        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-xl">
          <span className="text-[11px] text-amber-400 block font-semibold">Escala de Folga</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">{breakCount}</span>
            <span className="text-xs text-stone-500">colaboradores</span>
          </div>
        </div>

        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-xl">
          <span className="text-[11px] text-stone-400 block">Funcionalidades do Sistema</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-stone-100">10</span>
            <span className="text-xs text-stone-500">módulos protegidos</span>
          </div>
        </div>
      </div>

      {/* Action Bar: Filters, Search & View Toggles */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Role Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou PIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value as any)}
            className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 font-medium outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Todos os Cargos</option>
            <option value="atendente">Atendentes WhatsApp</option>
            <option value="garcom">Garçons / Salão</option>
            <option value="cozinheiro">Cozinheiros / KDS</option>
            <option value="caixa">Operadores de Caixa</option>
            <option value="gerente">Gerentes Gerais</option>
          </select>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-2">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-1 flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Cards da Equipe
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Matriz de Permissões
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Colaborador</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CARDS DA EQUIPE */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const roleConf = ROLE_CONFIG[emp.role] || {
              label: emp.role,
              badge: 'bg-stone-800 text-stone-300',
              icon: '👤',
              border: 'border-stone-800',
              bg: 'bg-stone-900',
            };
            const perms = emp.permissions || DEFAULT_ROLE_PERMISSIONS[emp.role] || [];
            const isManager = emp.role === 'gerente';
            const isPinVisible = !!visiblePins[emp.id];

            return (
              <div
                key={emp.id}
                className="bg-stone-900 border border-stone-800/90 hover:border-stone-700 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all shadow-md group relative"
              >
                {/* Card Top: Identity & Status */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-lg font-bold text-amber-400 shadow-inner">
                        {roleConf.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-100 text-sm leading-tight group-hover:text-amber-400 transition-colors">
                          {emp.name}
                        </h4>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConf.badge}`}
                        >
                          {roleConf.label}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const nextStatus = emp.status === 'ativo' ? 'folga' : emp.status === 'folga' ? 'inativo' : 'ativo';
                        updateEmployee({ ...emp, status: nextStatus });
                      }}
                      title="Clique para alternar status rápido"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border transition-colors cursor-pointer ${
                        emp.status === 'ativo'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                          : emp.status === 'folga'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      {emp.status}
                    </button>
                  </div>

                  {/* Metadata Row */}
                  <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-1.5 text-xs text-stone-400">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-500" />
                        <span>{emp.phone || 'Sem telefone'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span className="capitalize text-stone-300">{emp.shift}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-stone-950/60 border border-stone-800/60 rounded-lg px-2.5 py-1">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px] text-stone-400">PIN de Acesso:</span>
                        <span className="font-mono font-bold text-stone-200 tracking-wider">
                          {isPinVisible ? emp.pin : '••••'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePinVisibility(emp.id)}
                        className="text-stone-400 hover:text-stone-200 p-0.5"
                        title={isPinVisible ? 'Ocultar PIN' : 'Mostrar PIN'}
                      >
                        {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* System Permissions Tags Section */}
                  <div className="mt-3 pt-3 border-t border-stone-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-stone-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        Permissões Liberadas:
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400">
                        {isManager ? '10/10 (Total)' : `${perms.length}/10 módulos`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {isManager ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                          👑 Acesso Master Irrestrito (Todos os 10 Módulos)
                        </span>
                      ) : perms.length === 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-stone-950 text-stone-500 border border-stone-800 text-[10px]">
                          Sem permissões atribuídas
                        </span>
                      ) : (
                        perms.map((pId) => {
                          const pDef = ALL_SYSTEM_PERMISSIONS.find((p) => p.id === pId);
                          const IconComp = PERMISSION_ICONS[pId] || Shield;
                          return (
                            <span
                              key={pId}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium border flex items-center gap-1 ${
                                pDef?.badge || 'bg-stone-800 text-stone-300 border-stone-700'
                              }`}
                              title={pDef?.description}
                            >
                              <IconComp className="w-2.5 h-2.5" />
                              <span>{pDef?.label?.split('&')[0]?.trim() || pId}</span>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setCurrentEmployeeId(emp.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      currentEmployee?.id === emp.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>{currentEmployee?.id === emp.id ? 'Operador Ativo' : 'Ativar Sessão'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-stone-700 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Editar & Permissões</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja realmente remover o colaborador ${emp.name}?`)) {
                          deleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded-lg cursor-pointer transition-colors"
                      title="Excluir Colaborador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: MATRIZ INTERATIVA DE PERMISSÕES */}
      {viewMode === 'matrix' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Matriz Comparativa de Acesso às Funcionalidades
              </h4>
              <p className="text-xs text-stone-400 mt-0.5">
                Clique diretamente em qualquer célula para conceder ou revogar o acesso do colaborador ao módulo
              </p>
            </div>
            <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold">
              ⚡ Alterações salvas instantaneamente
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-950 border-b border-stone-800 text-stone-400">
                  <th className="p-3 font-bold sticky left-0 bg-stone-950 z-10 min-w-[200px]">
                    Colaborador / Cargo
                  </th>
                  {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                    const IconComp = PERMISSION_ICONS[perm.id] || Shield;
                    return (
                      <th key={perm.id} className="p-2.5 text-center font-bold min-w-[110px]" title={perm.description}>
                        <div className="flex flex-col items-center gap-1">
                          <IconComp className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] text-stone-300 leading-tight">
                            {perm.label.split('&')[0].trim()}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3 text-center font-bold min-w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredEmployees.map((emp) => {
                  const perms = emp.permissions || DEFAULT_ROLE_PERMISSIONS[emp.role] || [];
                  const isManager = emp.role === 'gerente';

                  return (
                    <tr key={emp.id} className="hover:bg-stone-800/30 transition-colors">
                      <td className="p-3 sticky left-0 bg-stone-900 border-r border-stone-800 z-10">
                        <div className="font-bold text-stone-100">{emp.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${ROLE_CONFIG[emp.role]?.badge}`}>
                            {ROLE_CONFIG[emp.role]?.label}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">PIN: {emp.pin}</span>
                        </div>
                      </td>

                      {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                        const hasPerm = isManager || perms.includes(perm.id);

                        return (
                          <td key={perm.id} className="p-2 text-center">
                            <button
                              type="button"
                              disabled={isManager}
                              onClick={() => toggleEmployeePermission(emp.id, perm.id)}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                isManager
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-not-allowed opacity-90'
                                  : hasPerm
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 cursor-pointer shadow-sm'
                                  : 'bg-stone-950 text-stone-600 border border-stone-800 hover:border-stone-700 hover:text-stone-400 cursor-pointer'
                              }`}
                              title={
                                isManager
                                  ? 'Gerente Geral possui acesso total automático'
                                  : hasPerm
                                  ? `Clique para remover acesso a ${perm.label}`
                                  : `Clique para conceder acesso a ${perm.label}`
                              }
                            >
                              {hasPerm ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-3.5 h-3.5 opacity-40" />}
                            </button>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-semibold cursor-pointer border border-stone-700"
                        >
                          Configurar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR OU EDITAR COLABORADOR & ATRIBUIR PERMISSÕES */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-100 text-base">
                    {editingEmployee ? `Editar Colaborador: ${editingEmployee.name}` : 'Cadastrar Novo Colaborador'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Defina dados cadastrais, cargo operacional e marque as permissões de acesso
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-100 p-1.5 rounded-xl hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-stone-300 font-bold block mb-1">Nome Completo do Colaborador:</label>
                  <input
                    type="text"
                    placeholder="Ex: Matheus Oliveira ou Mariana Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-bold block mb-1">Cargo / Função Principal:</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChangeInForm(e.target.value as EmployeeRole)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="atendente">💬 Atendente WhatsApp (Mari)</option>
                    <option value="garcom">🪑 Garçom / Salão</option>
                    <option value="cozinheiro">🍳 Cozinheiro / KDS</option>
                    <option value="caixa">💵 Operador de Caixa / PDV</option>
                    <option value="gerente">👑 Gerente Geral (Acesso Total)</option>
                  </select>
                  <p className="text-[10px] text-stone-400 mt-1">
                    {ROLE_CONFIG[role]?.defaultDescription}
                  </p>
                </div>

                <div>
                  <label className="text-stone-300 font-bold block mb-1">Turno de Trabalho:</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="noite">Noite (17h às 23h30 - Pico Salão/Delivery)</option>
                    <option value="manha">Manhã (10h às 16h - Almoço & Preparo)</option>
                    <option value="integral">Integral (Abertura, Operação & Fechamento)</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-300 font-bold block mb-1">Telefone WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-bold block mb-1">PIN de Acesso (4 dígitos numéricos):</label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]*"
                    placeholder="1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono text-center tracking-widest font-black text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-stone-300 font-bold block mb-1.5">Status Operacional:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ativo', 'folga', 'inativo'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        status === st
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {st === 'ativo' ? '🟢 Ativo' : st === 'folga' ? '🟡 Em Folga' : '🔴 Inativo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* SYSTEM PERMISSIONS SECTION */}
              <div className="pt-3 border-t border-stone-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-black text-stone-100 text-sm flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-500" />
                      Permissões de Acesso aos Módulos ({selectedPermissions.length} de 10)
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Marque individualmente os módulos do sistema que este colaborador poderá acessar
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleApplyRoleDefaults}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Padrão do Cargo
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[11px] font-medium cursor-pointer"
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPermissions}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[11px] font-medium cursor-pointer"
                    >
                      Nenhuma
                    </button>
                  </div>
                </div>

                {role === 'gerente' && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <span className="text-base">👑</span>
                    <span>
                      <strong>Aviso de Gerência:</strong> O cargo de Gerente Geral possui permissão total e irrestrita a todos os módulos e fechamentos do sistema por padrão.
                    </span>
                  </div>
                )}

                {/* Permissions Interactive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    const IconComp = PERMISSION_ICONS[perm.id] || Shield;

                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermissionInForm(perm.id)}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-stone-100 shadow-sm'
                            : 'bg-stone-950/70 border-stone-800/80 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                            isChecked
                              ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                              : 'bg-stone-900 border-stone-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <IconComp className={`w-3.5 h-3.5 ${isChecked ? 'text-amber-400' : 'text-stone-500'}`} />
                            <span className={isChecked ? 'text-stone-100' : 'text-stone-300'}>
                              {perm.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 leading-tight mt-0.5 line-clamp-2">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{editingEmployee ? 'Salvar Alterações & Permissões' : 'Concluir Cadastro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
