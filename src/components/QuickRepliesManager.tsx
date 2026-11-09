import React, { useState } from 'react';
import { Plus, Trash2, Edit2, RotateCcw, Zap, CreditCard, Beef, X } from 'lucide-react';
import { QuickReplyShortcut } from '../types.ts';
import { DEFAULT_QUICK_REPLIES } from '../constants/defaults.ts';

export interface QuickRepliesManagerProps {
  quickReplies: QuickReplyShortcut[];
  menuUrl: string;
  onChange: (updatedQuickReplies: QuickReplyShortcut[]) => void;
}

export const QuickRepliesManager: React.FC<QuickRepliesManagerProps> = ({
  quickReplies,
  menuUrl,
  onChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pagamento' | 'ingredientes' | 'geral'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for new/edited shortcut
  const [shortcut, setShortcut] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'pagamento' | 'ingredientes' | 'geral'>('pagamento');
  const [triggers, setTriggers] = useState('');
  const [responseTemplate, setResponseTemplate] = useState('');

  const currentReplies = quickReplies || [];

  const filteredReplies = selectedCategory === 'all'
    ? currentReplies
    : currentReplies.filter(qr => qr.category === selectedCategory);

  const handleOpenAdd = () => {
    setEditingId(null);
    setShortcut('/');
    setTitle('');
    setCategory('pagamento');
    setTriggers('');
    setResponseTemplate('Ex: Aceitamos Pix e cartões! Você fecha direto pelo link: {menuUrl} 🚀');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (qr: QuickReplyShortcut) => {
    setEditingId(qr.id);
    setShortcut(qr.shortcut);
    setTitle(qr.title);
    setCategory(qr.category);
    setTriggers(qr.triggers);
    setResponseTemplate(qr.responseTemplate);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcut.trim() || !title.trim() || !responseTemplate.trim()) return;

    const formattedShortcut = shortcut.startsWith('/') ? shortcut.trim() : `/${shortcut.trim()}`;

    if (editingId) {
      // Update existing
      const updated = currentReplies.map(qr =>
        qr.id === editingId
          ? {
              ...qr,
              shortcut: formattedShortcut,
              title: title.trim(),
              category,
              triggers: triggers.trim(),
              responseTemplate: responseTemplate.trim(),
            }
          : qr
      );
      onChange(updated);
    } else {
      // Create new
      const newShortcut: QuickReplyShortcut = {
        id: `qr-${Date.now()}`,
        shortcut: formattedShortcut,
        title: title.trim(),
        category,
        triggers: triggers.trim(),
        responseTemplate: responseTemplate.trim(),
        enabled: true,
      };
      onChange([...currentReplies, newShortcut]);
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleToggle = (id: string) => {
    const updated = currentReplies.map(qr =>
      qr.id === id ? { ...qr, enabled: !qr.enabled } : qr
    );
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    const updated = currentReplies.filter(qr => qr.id !== id);
    onChange(updated);
  };

  const handleRestoreDefaults = () => {
    onChange(DEFAULT_QUICK_REPLIES);
  };

  return (
    <section className="bg-stone-900/60 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-lg relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-100">
              Atalhos de Respostas Rápidas (Mari FAQ)
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Gerencie frases de atalho para dúvidas sobre ingredientes, blend, opções vegetarianas e formas de pagamento (Pix, cartões, VR). A Mari usa estas respostas no WhatsApp!
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Restaurar lista padrão de atalhos e respostas"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Atalho</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          Todos ({currentReplies.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('pagamento')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            selectedCategory === 'pagamento'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Formas de Pagamento</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('ingredientes')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            selectedCategory === 'ingredientes'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Beef className="w-3.5 h-3.5" />
          <span>Ingredientes & Alergênicos</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('geral')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            selectedCategory === 'geral'
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          Geral / Outros
        </button>
      </div>

      {/* List of Shortcuts */}
      <div className="space-y-3">
        {filteredReplies.length === 0 ? (
          <div className="p-6 text-center text-stone-500 text-xs bg-stone-900/40 rounded-xl border border-dashed border-stone-800">
            Nenhuma frase de atalho encontrada para esta categoria. Clique em &quot;Adicionar Atalho&quot; para cadastrar!
          </div>
        ) : (
          filteredReplies.map((qr) => (
            <div
              key={qr.id}
              className={`bg-stone-900/90 border rounded-xl p-4 transition-all space-y-2.5 ${
                qr.enabled
                  ? 'border-stone-800 hover:border-amber-500/40'
                  : 'border-stone-800/40 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {qr.shortcut}
                  </span>
                  <span className="font-bold text-stone-100 text-xs">
                    {qr.title}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                    {qr.category === 'pagamento' ? 'Pagamento' : qr.category === 'ingredientes' ? 'Ingredientes' : 'Geral'}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(qr.id)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors cursor-pointer ${
                      qr.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-stone-800 text-stone-500 border border-stone-700'
                    }`}
                    title="Ativar/Pausar resposta no atendimento da Mari"
                  >
                    {qr.enabled ? 'Ativo' : 'Pausado'}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(qr)}
                    className="p-1 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded transition-colors cursor-pointer"
                    title="Editar frase de atalho"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(qr.id)}
                    className="p-1 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded transition-colors cursor-pointer"
                    title="Remover frase de atalho"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Triggers */}
              <div className="text-[11px] text-stone-400 flex items-start gap-1">
                <span className="font-medium text-stone-300 shrink-0">Palavras-chave ativadoras:</span>
                <span className="text-amber-200/80 italic font-mono truncate">{qr.triggers}</span>
              </div>

              {/* Response Template Preview */}
              <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/80 text-xs text-stone-300 leading-relaxed whitespace-pre-wrap">
                {qr.responseTemplate.split('{menuUrl}').map((chunk, idx, arr) => (
                  <React.Fragment key={idx}>
                    {chunk}
                    {idx < arr.length - 1 && (
                      <span className="text-amber-400 font-bold bg-amber-500/10 px-1 rounded">
                        {menuUrl}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add or Edit Quick Reply Shortcut */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-stone-100 text-sm">
                  {editingId ? 'Editar Frase de Atalho' : 'Adicionar Nova Frase de Atalho'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-300 block mb-1">
                    Comando de Atalho (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={shortcut}
                    onChange={(e) => setShortcut(e.target.value)}
                    placeholder="/pagamento"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-amber-400 font-mono text-xs focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'pagamento' | 'ingredientes' | 'geral')}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-200 text-xs focus:border-amber-500 outline-none"
                  >
                    <option value="pagamento">💳 Formas de Pagamento</option>
                    <option value="ingredientes">🥩 Ingredientes & Alergênicos</option>
                    <option value="geral">⚙️ Geral / Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-300 block mb-1">
                  Título Descritivo da Dúvida
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Aceita Pix e Cartão de Crédito"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-stone-300 block mb-1">
                  Palavras-chave Ativadoras (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={triggers}
                  onChange={(e) => setTriggers(e.target.value)}
                  placeholder="Ex: pix, cartao, pagar, vr, va, dinheiro, troco"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:border-amber-500 outline-none font-mono"
                  required
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Quando o cliente digitar qualquer uma dessas palavras, a Mari ativará esta resposta inteligente.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-300">
                    Resposta Padrão da Mari (WhatsApp)
                  </label>
                  <button
                    type="button"
                    onClick={() => setResponseTemplate(prev => prev + ' {menuUrl}')}
                    className="text-[10px] text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    + Inserir Link do Cardápio ({'{menuUrl}'})
                  </button>
                </div>
                <textarea
                  value={responseTemplate}
                  onChange={(e) => setResponseTemplate(e.target.value)}
                  rows={4}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:border-amber-500 outline-none leading-relaxed"
                  placeholder="Escreva a resposta curta (2 a 3 linhas com emojis) e insira o link {menuUrl}..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-sm cursor-pointer"
              >
                Salvar Frase de Atalho
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
