import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingOfflineCount, syncOfflineQueue } = useBurgerSystem();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await syncOfflineQueue();
      if (res.synced > 0) {
        setSyncFeedback(`✅ ${res.synced} pedido(s) sincronizado(s) com a cozinha!`);
      } else if (res.failed > 0) {
        setSyncFeedback(`⚠️ Falha ao conectar ao servidor. Pedidos continuam protegidos no IndexedDB.`);
      } else {
        setSyncFeedback('Tudo atualizado! Nenhum pedido pendente.');
      }
    } catch {
      setSyncFeedback('Erro na sincronização. Tentará novamente automaticamente.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // If online and no pending orders, render a compact subtle badge or null
  if (isOnline && pendingOfflineCount === 0 && !syncFeedback) {
    return null;
  }

  return (
    <div
      className={`w-full px-4 py-2 text-xs transition-all duration-300 z-50 flex flex-wrap items-center justify-between gap-2 shadow-md ${
        !isOnline
          ? 'bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-500/40 text-amber-200'
          : pendingOfflineCount > 0
          ? 'bg-gradient-to-r from-blue-950 via-stone-900 to-blue-950 border-b border-blue-500/40 text-blue-200'
          : 'bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {!isOnline ? (
          <div className="flex items-center gap-1.5 font-bold text-amber-400 animate-pulse">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>MODO CONTINGÊNCIA OFFLINE (Sem Internet)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-bold text-blue-400">
            <Wifi className="w-4 h-4 shrink-0" />
            <span>CONEXÃO RESTABELECIDA</span>
          </div>
        )}

        <span className="hidden sm:inline text-stone-500">•</span>

        <div className="flex items-center gap-1.5 text-stone-300">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {pendingOfflineCount > 0 ? (
              <span className="font-semibold text-amber-300">
                {pendingOfflineCount} pedido(s) salvo(s) no IndexedDB do navegador
              </span>
            ) : (
              <span>Fila offline vazia • Operação contínua protegida</span>
            )}
          </span>
        </div>

        {syncFeedback && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-900/80 border border-stone-700 animate-in fade-in">
            {syncFeedback}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] flex items-center gap-1.5 shadow transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
        </button>
      </div>
    </div>
  );
};
