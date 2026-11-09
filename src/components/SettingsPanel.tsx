import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Check,
  Store,
  Building2,
  Users,
  UtensilsCrossed,
  Zap,
  Clock,
  MapPin,
  Phone,
  Link2,
  Trash2,
  Plus,
  Database,
} from 'lucide-react';
import { RestaurantConfig, QuickReplyShortcut } from '../types.ts';
import { DEFAULT_QUICK_REPLIES } from '../constants/defaults.ts';
import { QuickRepliesManager } from './QuickRepliesManager.tsx';
import { CompanySettings } from './CompanySettings.tsx';
import { EmployeeManager } from './EmployeeManager.tsx';
import { ProductManager } from './ProductManager.tsx';
import { DatabaseBackupManager } from './DatabaseBackupManager.tsx';

interface SettingsPanelProps {
  config: RestaurantConfig;
  onSave: (newConfig: RestaurantConfig) => void;
  onReset: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onSave, onReset }) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'funcionarios' | 'produtos' | 'atalhos' | 'regras' | 'backup'>('empresa');
  const [formData, setFormData] = useState<RestaurantConfig>({
    ...config,
    quickReplies: config.quickReplies || DEFAULT_QUICK_REPLIES,
  });
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddNeighborhood = () => {
    if (!newNeighborhood.trim()) return;
    if (formData.neighborhoods.includes(newNeighborhood.trim())) return;

    const updated = {
      ...formData,
      neighborhoods: [...formData.neighborhoods, newNeighborhood.trim()],
    };
    setFormData(updated);
    onSave(updated);
    setNewNeighborhood('');
  };

  const handleRemoveNeighborhood = (name: string) => {
    const updated = {
      ...formData,
      neighborhoods: formData.neighborhoods.filter((n) => n !== name),
    };
    setFormData(updated);
    onSave(updated);
  };

  const handleQuickRepliesChange = (updatedQuickReplies: QuickReplyShortcut[]) => {
    const updatedConfig = {
      ...formData,
      quickReplies: updatedQuickReplies,
    };
    setFormData(updatedConfig);
    onSave(updatedConfig);
  };

  const handleSubmitGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto bg-stone-950 rounded-3xl border border-stone-800 shadow-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-xl font-black text-stone-100 flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-500" />
            <span>Configurações Gerais & Gestão da Hamburgueria</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Configure dados da empresa, equipe de funcionários/atendentes, sanduíches do cardápio e regras da Mari
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-stone-800 gap-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('empresa')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'empresa'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados da Empresa & Wi-Fi</span>
        </button>

        <button
          onClick={() => setActiveTab('funcionarios')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'funcionarios'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Equipe</span>
        </button>

        <button
          onClick={() => setActiveTab('produtos')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'produtos'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Cardápio & Sanduíches</span>
        </button>

        <button
          onClick={() => setActiveTab('atalhos')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'atalhos'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Atalhos da Mari</span>
        </button>

        <button
          onClick={() => setActiveTab('regras')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'regras'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horários & Entregas</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup do Banco de Dados</span>
        </button>
      </div>

      {/* TAB 0: BACKUP DO BANCO DE DADOS */}
      {activeTab === 'backup' && (
        <DatabaseBackupManager />
      )}

      {/* TAB 1: DADOS DA EMPRESA */}
      {activeTab === 'empresa' && (
        <CompanySettings />
      )}

      {/* TAB 2: FUNCIONÁRIOS E ATENDENTES */}
      {activeTab === 'funcionarios' && (
        <EmployeeManager />
      )}

      {/* TAB 3: CADASTRO E CONFIGURAÇÃO DE SANDUÍCHES */}
      {activeTab === 'produtos' && (
        <ProductManager />
      )}

      {/* TAB 4: ATALHOS DA MARI */}
      {activeTab === 'atalhos' && (
        <div className="space-y-4">
          <QuickRepliesManager
            quickReplies={formData.quickReplies || []}
            menuUrl={formData.menuUrl}
            onChange={handleQuickRepliesChange}
          />
        </div>
      )}

      {/* TAB 5: HORÁRIOS & REGRAS DE ENTREGA */}
      {activeTab === 'regras' && (
        <form onSubmit={handleSubmitGeneral} className="space-y-6 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Regras de atendimento atualizadas com sucesso!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
              <label className="font-bold text-stone-200 block flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Horário Oficial de Atendimento:
              </label>
              <input
                type="text"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-stone-400">
                Se o cliente enviar mensagem fora deste horário, a Mari informará educadamente que a hamburgueria está fechada.
              </p>
            </div>

            <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
              <label className="font-bold text-stone-200 block flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-400" />
                Link Oficial do Cardápio Digital:
              </label>
              <input
                type="text"
                value={formData.menuUrl}
                onChange={(e) => setFormData({ ...formData, menuUrl: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-stone-400">
                Link crítico enviado pela Mari para direcionar o cliente a montar a sacola online.
              </p>
            </div>
          </div>

          {/* Bairros de Entrega */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <label className="font-bold text-stone-200 block flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Bairros Atendidos no Delivery:
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar novo bairro..."
                value={newNeighborhood}
                onChange={(e) => setNewNeighborhood(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddNeighborhood}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl whitespace-nowrap cursor-pointer"
              >
                + Adicionar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.neighborhoods.map((b) => (
                <span
                  key={b}
                  className="px-2.5 py-1 bg-stone-950 border border-stone-700 rounded-lg text-stone-200 flex items-center gap-1.5"
                >
                  <span>{b}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNeighborhood(b)}
                    className="text-stone-400 hover:text-rose-400 p-0.5"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Transbordo Humano */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
            <label className="font-bold text-stone-200 block">
              Mensagem de Transbordo para Atendimento Humano:
            </label>
            <textarea
              rows={3}
              value={formData.humanHandoffText}
              onChange={(e) => setFormData({ ...formData, humanHandoffText: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-stone-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Horários & Entregas</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
