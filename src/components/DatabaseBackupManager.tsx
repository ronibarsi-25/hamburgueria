import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Clock,
  HardDrive,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Server,
  Trash2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Eye,
  X,
  FileCheck,
} from 'lucide-react';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';
import { DatabaseBackupPayload, BackupSnapshot, ServerBackupFile } from '../types.ts';
import { soundFX } from '../utils/audio.ts';

export const DatabaseBackupManager: React.FC = () => {
  const {
    tables,
    orders,
    stockItems,
    menuItems,
    employees,
    companyInfo,
    cashRegister,
    expenses,
    neighborhoodFees,
    exportDatabaseBackup,
    importDatabaseBackup,
    snapshots,
    createLocalSnapshot,
    restoreLocalSnapshot,
    deleteLocalSnapshot,
    resetAllData,
  } = useBurgerSystem();

  const [serverBackups, setServerBackups] = useState<ServerBackupFile[]>([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [serverStatusMessage, setServerStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File import preview state
  const [previewPayload, setPreviewPayload] = useState<DatabaseBackupPayload | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeHistoryTab, setActiveHistoryTab] = useState<'snapshots' | 'server'>('snapshots');
  const [customSnapshotLabel, setCustomSnapshotLabel] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch server backups
  const fetchServerBackups = async () => {
    setLoadingServer(true);
    try {
      const res = await fetch('/api/backup/list');
      if (res.ok) {
        const data = await res.json();
        setServerBackups(data.backups || []);
      }
    } catch {
      // Ignore fallback
    } finally {
      setLoadingServer(false);
    }
  };

  useEffect(() => {
    fetchServerBackups();
  }, []);

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.paymentStatus === 'PAGO' ? o.total : 0), 0);
  const totalMenuItems = menuItems.length;
  const totalStockItems = stockItems.length;
  const totalExpenses = expenses.length;
  const totalEmployees = employees.length;

  const estimatedJsonPayload = exportDatabaseBackup();
  const estimatedJsonStr = JSON.stringify(estimatedJsonPayload);
  const estimatedSizeBytes = new Blob([estimatedJsonStr]).size;
  const estimatedSizeKB = (estimatedSizeBytes / 1024).toFixed(1);

  // Download JSON Backup
  const handleDownloadBackup = () => {
    const payload = exportDatabaseBackup();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `backup_hamburgueria_${dateStr}_${timeStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    soundFX.playCashRegister();
    setServerStatusMessage({
      type: 'success',
      text: `Arquivo de backup "${filename}" gerado e baixado com sucesso!`,
    });
    setTimeout(() => setServerStatusMessage(null), 4000);
  };

  // Save copy to Server disk
  const handleSaveToServer = async () => {
    setLoadingServer(true);
    try {
      const payload = exportDatabaseBackup();
      const res = await fetch('/api/backup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        soundFX.playCashRegister();
        setServerStatusMessage({
          type: 'success',
          text: `Backup salvo no disco do servidor com sucesso: ${data.filename}!`,
        });
        fetchServerBackups();
      } else {
        setServerStatusMessage({
          type: 'error',
          text: 'Falha ao salvar backup no servidor.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão';
      setServerStatusMessage({
        type: 'error',
        text: `Erro ao conectar com servidor de backup: ${msg}`,
      });
    } finally {
      setLoadingServer(false);
      setTimeout(() => setServerStatusMessage(null), 4500);
    }
  };

  // Handle local snapshot creation
  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    createLocalSnapshot(customSnapshotLabel || undefined, 'manual');
    soundFX.playCashRegister();
    setCustomSnapshotLabel('');
    setServerStatusMessage({
      type: 'success',
      text: 'Ponto de restauração instantâneo salvo com sucesso no navegador!',
    });
    setTimeout(() => setServerStatusMessage(null), 3000);
  };

  // File selection for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as DatabaseBackupPayload;

        if (!parsed.data || (!parsed.data.orders && !parsed.data.menuItems && !parsed.data.tables)) {
          setImportStatus({
            type: 'error',
            text: 'O arquivo selecionado não contém a estrutura válida de backup da hamburgueria.',
          });
          setPreviewPayload(null);
          return;
        }

        setPreviewPayload(parsed);
        setImportStatus(null);
      } catch {
        setImportStatus({
          type: 'error',
          text: 'Não foi possível ler o arquivo. Certifique-se de selecionar um arquivo .json válido.',
        });
        setPreviewPayload(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute restore from preview
  const handleConfirmRestore = () => {
    if (!previewPayload) return;
    const result = importDatabaseBackup(previewPayload);
    if (result.success) {
      setImportStatus({ type: 'success', text: result.message });
      setPreviewPayload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportStatus(null), 5000);
    } else {
      setImportStatus({ type: 'error', text: result.message });
    }
  };

  // Restore directly from server file
  const handleRestoreFromServer = async (filename: string) => {
    if (!window.confirm(`Deseja realmente restaurar o backup do servidor "${filename}"? Um snapshot de segurança do estado atual será criado.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/backup/get/${filename}`);
      if (res.ok) {
        const payload: DatabaseBackupPayload = await res.json();
        const result = importDatabaseBackup(payload);
        if (result.success) {
          setServerStatusMessage({
            type: 'success',
            text: `Backup "${filename}" restaurado com sucesso!`,
          });
        } else {
          setServerStatusMessage({
            type: 'error',
            text: result.message,
          });
        }
      }
    } catch {
      setServerStatusMessage({
        type: 'error',
        text: 'Erro ao carregar arquivo de backup do servidor.',
      });
    }
    setTimeout(() => setServerStatusMessage(null), 4000);
  };

  // Delete server backup
  const handleDeleteServerBackup = async (filename: string) => {
    if (!window.confirm(`Excluir permanentemente o arquivo de backup "${filename}" do servidor?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/backup/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServerBackups();
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Status */}
      {serverStatusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150 ${
            serverStatusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {serverStatusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{serverStatusMessage.text}</span>
          </div>
          <button
            onClick={() => setServerStatusMessage(null)}
            className="text-stone-400 hover:text-stone-100 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Database Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Tamanho do Banco:</span>
            <HardDrive className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">
            {estimatedSizeKB} KB
          </div>
          <p className="text-[10px] text-stone-500">
            Armazenamento JSON seguro
          </p>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Total de Pedidos:</span>
            <FileJson className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-stone-100 font-mono">
            {totalOrders}
          </div>
          <p className="text-[10px] text-stone-500">
            Faturamento: R$ {totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Itens & Insumos:</span>
            <Database className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl font-black text-stone-100 font-mono">
            {totalMenuItems + totalStockItems}
          </div>
          <p className="text-[10px] text-stone-500">
            {totalMenuItems} produtos · {totalStockItems} no estoque
          </p>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Status Integridade:</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-base">100% OK</span>
          </div>
          <p className="text-[10px] text-stone-500">
            30 mesas ativas vinculadas
          </p>
        </div>
      </div>

      {/* Main Action Hub: 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Baixar Backup Completo */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-100 text-base">
              Exportar Arquivo (.JSON)
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Baixe um arquivo seguro com todos os dados: comandas, mesas, cardápio, estoque, caixa, funcionários e configurações.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Backup Completo (.JSON)</span>
          </button>
        </div>

        {/* Card 2: Salvar Cópia no Servidor */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-100 text-base">
              Salvar Cópia no Servidor
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Persiste o backup diretamente no disco do backend Node.js (/data/backups), garantindo redundância além do navegador.
            </p>
          </div>

          <button
            onClick={handleSaveToServer}
            disabled={loadingServer}
            className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Server className="w-4 h-4 text-cyan-400" />
            <span>{loadingServer ? 'Salvando...' : 'Salvar no Disco do Servidor'}</span>
          </button>
        </div>

        {/* Card 3: Ponto de Restauração Rápido */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-100 text-base">
              Ponto de Restauração Local
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Cria um snapshot imediato armazenado no navegador para recuperação em 1 clique antes de qualquer alteração crítica.
            </p>
          </div>

          <form onSubmit={handleCreateSnapshot} className="space-y-2">
            <input
              type="text"
              value={customSnapshotLabel}
              onChange={(e) => setCustomSnapshotLabel(e.target.value)}
              placeholder="Nome do ponto (opcional)..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-stone-100 font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Criar Snapshot Agora</span>
            </button>
          </form>
        </div>
      </div>

      {/* Restaurar Arquivo de Backup (Upload Section) */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <div>
            <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" />
              <span>Restaurar Banco de Dados via Arquivo</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Selecione um arquivo .json gerado anteriormente para restaurar todas as tabelas e dados do sistema
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Selecionar Arquivo .JSON</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Import feedback messages */}
        {importStatus && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{importStatus.text}</span>
          </div>
        )}

        {/* Preview Modal Box when file is loaded */}
        {previewPayload && (
          <div className="bg-stone-950 border border-amber-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-stone-100">
                    Pré-Visualização do Arquivo: <span className="text-amber-400">{previewFileName}</span>
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Gerado em: {new Date(previewPayload.timestamp).toLocaleString('pt-BR')} · Versão: {previewPayload.version}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewPayload(null)}
                className="text-stone-400 hover:text-stone-100 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                <span className="text-stone-400">Pedidos no Backup:</span>
                <p className="font-bold text-stone-100 text-sm mt-0.5">
                  {previewPayload.data.orders?.length || 0}
                </p>
              </div>
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                <span className="text-stone-400">Produtos Cardápio:</span>
                <p className="font-bold text-stone-100 text-sm mt-0.5">
                  {previewPayload.data.menuItems?.length || 0}
                </p>
              </div>
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                <span className="text-stone-400">Itens em Estoque:</span>
                <p className="font-bold text-stone-100 text-sm mt-0.5">
                  {previewPayload.data.stockItems?.length || 0}
                </p>
              </div>
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                <span className="text-stone-400">Funcionários:</span>
                <p className="font-bold text-stone-100 text-sm mt-0.5">
                  {previewPayload.data.employees?.length || 0}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Segurança Garantida:</strong> Um snapshot automático de recuperação do seu estado atual será criado antes da substituição.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewPayload(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Restauração Completa</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Histórico de Backups: Snapshots & Servidor */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-stone-100">
              Histórico de Backups & Pontos de Restauração
            </h3>
          </div>

          {/* Subtabs */}
          <div className="bg-stone-950 p-1 rounded-xl border border-stone-800 flex items-center text-xs">
            <button
              onClick={() => setActiveHistoryTab('snapshots')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeHistoryTab === 'snapshots'
                  ? 'bg-amber-500 text-stone-950 font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Snapshots Locais ({snapshots.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveHistoryTab('server');
                fetchServerBackups();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeHistoryTab === 'server'
                  ? 'bg-amber-500 text-stone-950 font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Backups Servidor ({serverBackups.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Snapshots Locais */}
        {activeHistoryTab === 'snapshots' && (
          <div className="space-y-3">
            {snapshots.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-xs">
                Nenhum ponto de restauração local criado ainda. Clique em "Criar Snapshot Agora" acima para gerar um.
              </div>
            ) : (
              <div className="divide-y divide-stone-800/60 max-h-80 overflow-y-auto pr-1">
                {snapshots.map((snap) => {
                  const dateFormatted = new Date(snap.timestamp).toLocaleString('pt-BR');
                  const sizeKB = (snap.sizeBytes / 1024).toFixed(1);

                  return (
                    <div
                      key={snap.id}
                      className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-800/30 px-3 rounded-xl transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-200 text-xs">
                            {snap.label}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              snap.source === 'pre-restore'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : snap.source === 'auto'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {snap.source}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400">
                          {dateFormatted} · {sizeKB} KB · {snap.ordersCount} pedidos · {snap.itemsCount} produtos cardápio
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Restaurar o snapshot "${snap.label}"? O estado atual será salvo como ponto de segurança.`)) {
                              restoreLocalSnapshot(snap.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-stone-950 border border-emerald-500/40 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Restaurar este ponto"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>

                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(snap.payload, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${snap.id}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg cursor-pointer transition-colors"
                          title="Baixar JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => deleteLocalSnapshot(snap.id)}
                          className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors"
                          title="Excluir snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Backups no Servidor */}
        {activeHistoryTab === 'server' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-stone-400 pb-1">
              <span>Arquivos em /data/backups:</span>
              <button
                onClick={fetchServerBackups}
                disabled={loadingServer}
                className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingServer ? 'animate-spin' : ''}`} />
                <span>Atualizar lista</span>
              </button>
            </div>

            {serverBackups.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-xs">
                Nenhum arquivo de backup encontrado no disco do servidor. Clique em "Salvar no Disco do Servidor" para gravar uma cópia.
              </div>
            ) : (
              <div className="divide-y divide-stone-800/60 max-h-80 overflow-y-auto pr-1">
                {serverBackups.map((bkp) => {
                  const dateFormatted = new Date(bkp.createdAt).toLocaleString('pt-BR');
                  const sizeKB = (bkp.sizeBytes / 1024).toFixed(1);

                  return (
                    <div
                      key={bkp.filename}
                      className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-800/30 px-3 rounded-xl transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300 text-xs">
                            {bkp.filename}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400">
                          {dateFormatted} · {sizeKB} KB {bkp.ordersCount !== undefined && `· ${bkp.ordersCount} pedidos`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleRestoreFromServer(bkp.filename)}
                          className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-stone-950 border border-emerald-500/40 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Restaurar este backup do servidor"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>

                        <a
                          href={`/api/backup/download/${bkp.filename}`}
                          download={bkp.filename}
                          className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
                          title="Baixar arquivo do servidor"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDeleteServerBackup(bkp.filename)}
                          className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors"
                          title="Excluir do servidor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Wiping with Compulsory Auto-Backup */}
      <div className="bg-stone-900/60 border border-rose-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Zona de Segurança · Restauração de Fábrica</span>
          </h4>
          <p className="text-[11px] text-stone-400 mt-1 max-w-xl">
            Para reiniciar o sistema com dados originais, o sistema gera automaticamente um backup de emergência antes de limpar o armazenamento local.
          </p>
        </div>

        <button
          onClick={() => {
            // Force create emergency backup before reset
            createLocalSnapshot('Backup Emergencial Pré-Reset', 'pre-restore');
            resetAllData();
          }}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
        >
          Backup & Resetar Dados
        </button>
      </div>
    </div>
  );
};
