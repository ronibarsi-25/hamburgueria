import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  ExternalLink,
  QrCode,
  Wifi,
  Check,
  Utensils,
  LayoutGrid,
  Eye,
  Smartphone,
  Copy,
  Share2,
  Sparkles,
  ShieldCheck,
  ChefHat,
  MessageSquare,
  Users,
} from 'lucide-react';
import { RestaurantConfig } from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';

interface TableQRGeneratorProps {
  config: RestaurantConfig;
  onOpenTableMenu: (tableNumber: string) => void;
  onOpenMobileComanda?: (tableNumber?: string) => void;
}

export const TableQRGenerator: React.FC<TableQRGeneratorProps> = ({
  config,
  onOpenTableMenu,
  onOpenMobileComanda,
}) => {
  const { tables, companyInfo } = useBurgerSystem();
  const [selectedTable, setSelectedTable] = useState<string>('01');
  const [wifiName, setWifiName] = useState(companyInfo?.wifiSsid || 'MariBurger_WiFi');
  const [wifiPass, setWifiPass] = useState(companyInfo?.wifiPassword || 'burgersaboroso');
  const [viewMode, setViewMode] = useState<'single' | 'all' | 'garcom'>('garcom');
  const [copiedLink, setCopiedLink] = useState(false);
  const [garcomPresetTable, setGarcomPresetTable] = useState<string>('livre');

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mariburger.com.br';

  const getTableUrl = (tableNum: string) => {
    return `${originUrl}/?mesa=${tableNum}`;
  };

  const getGarcomUrl = () => {
    if (garcomPresetTable !== 'livre') {
      return `${originUrl}/?garcom=1&mesa=${garcomPresetTable}`;
    }
    return `${originUrl}/?garcom=1`;
  };

  const garcomUrl = getGarcomUrl();

  const handleCopyGarcomLink = async () => {
    try {
      await navigator.clipboard.writeText(garcomUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📲 *Link da Comanda Mobile (${config.restaurantName})*\n\nAcesse o terminal de pedidos no seu smartphone:\n👉 ${garcomUrl}\n\nLançamento rápido nas mesas 01 a 30 e envio direto para o KDS da cozinha!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-100 flex items-center gap-2">
                <span>Central de QR Codes do Restaurante</span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Gere plaquinhas para as 30 mesas do salão e o QR Code exclusivo da <strong>Comanda Mobile dos Garçons</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-stone-950 p-1.5 rounded-2xl border border-stone-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('garcom')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'garcom'
                  ? 'bg-emerald-500 text-stone-950 shadow-md font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>QR Comanda Garçom</span>
              <span className="text-[9px] bg-stone-900 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                Pocket
              </span>
            </button>

            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'single'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Mesa Individual</span>
            </button>

            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>30 Mesas (Plaquinhas)</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs rounded-xl flex items-center gap-2 transition-all border border-stone-700 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* View Mode: QR Garçom Mobile (User Request Primary) */}
      {viewMode === 'garcom' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Main Printable Badge / Display Card */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-md bg-stone-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center space-y-4">
              {/* Badge Top Header */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-stone-950 py-2.5 px-4 rounded-2xl shadow-md">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> GARÇOM POCKET
                  </span>
                  <span>ACESSO AO SALÃO</span>
                </div>
              </div>

              {/* Title and Identification */}
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  {companyInfo?.fantasyName || config.restaurantName}
                </p>
                <h3 className="text-2xl font-black text-stone-100 tracking-tight mt-0.5">
                  Comanda Mobile
                </h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  Aponte a câmera do seu celular para abrir o terminal de pedidos direto no salão
                </p>
              </div>

              {/* High-Contrast QR Code Container */}
              <div className="p-5 bg-white rounded-3xl shadow-inner border-4 border-stone-800 inline-block mx-auto relative group">
                <QRCodeSVG
                  value={garcomUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-stone-950 border-2 border-emerald-500 shadow-lg flex items-center justify-center text-xl">
                    🍔
                  </div>
                </div>
              </div>

              {/* URL Display */}
              <div className="bg-stone-950 border border-stone-800/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-left">
                <div className="truncate flex-1">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Link de Acesso:</span>
                  <span className="text-xs font-mono text-emerald-400 truncate block">
                    {garcomUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopyGarcomLink}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* Highlights pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300">
                <div className="p-2 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-left font-medium">Disparo instantâneo na chapa do KDS</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-left font-medium">Opera 100% offline via IndexedDB</span>
                </div>
              </div>

              {/* Bottom Instructions Footer */}
              <p className="text-[10px] text-stone-500 pt-1">
                Dica: Fixe este display impresso na copa ou na bancada de saída de pedidos para a equipe.
              </p>
            </div>
          </div>

          {/* Configuration & Quick Actions Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Action Card */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="font-bold text-stone-100 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ações Rápidas de Acesso</span>
              </h3>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    if (onOpenMobileComanda) {
                      onOpenMobileComanda(garcomPresetTable !== 'livre' ? garcomPresetTable : undefined);
                    } else {
                      window.location.href = garcomUrl;
                    }
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Testar e Abrir Comanda Mobile Agora</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="w-full py-2.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-2xl text-stone-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Enviar Link no WhatsApp da Equipe</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-2xl text-stone-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Imprimir Crachá / Placa da Copa</span>
                </button>
              </div>

              {/* Table Selector Preset */}
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <label className="text-xs font-bold text-stone-300 block">
                  Mesa Inicial Pré-selecionada no QR:
                </label>
                <select
                  value={garcomPresetTable}
                  onChange={(e) => setGarcomPresetTable(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-200 text-xs font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="livre">Abertura Livre (Garçom escolhe a mesa na hora)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.number}>
                      Mesa {t.number} ({t.status === 'ocupada' ? 'Ocupada' : t.status === 'conta' ? 'Pedindo Conta' : 'Livre'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-400">
                  {garcomPresetTable === 'livre'
                    ? 'O garçom verá o seletor completo das 30 mesas ao abrir o celular.'
                    : `Ao escanear, o garçom cairá direto no atendimento da Mesa ${garcomPresetTable}.`}
                </p>
              </div>
            </div>

            {/* How it works instructions */}
            <div className="bg-stone-950 border border-stone-800 rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Como a equipe usa no salão:
              </h4>

              <div className="space-y-2 text-xs text-stone-400">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-800 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <p>
                    O garçom aponta a câmera do celular pessoal (sem precisar baixar aplicativo pela Play Store ou App Store).
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-800 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <p>
                    A <strong>Comanda Mobile</strong> abre otimizada para o tamanho da tela do smartphone, com as 30 mesas e todo o cardápio.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-800 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <p>
                    Lança os pedidos com observações pré-formatadas (&quot;Sem cebola&quot;, &quot;Ao ponto&quot;) e envia direto para a cozinha com sino sonoro.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-800 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                    4
                  </span>
                  <p>
                    Se o Wi-Fi falhar, a persistência com <strong>IndexedDB</strong> retém tudo no celular e sincroniza quando o sinal retornar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode: Single Table Inspector */}
      {viewMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Table Selector Strip */}
          <div className="bg-stone-950 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-stone-200 text-sm">Selecione a Mesa</h3>
              <span className="text-xs text-stone-400">30 mesas no salão</span>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {tables.map((t) => {
                const isSelected = t.number === selectedTable;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t.number)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 font-black border-amber-400 shadow-md scale-105'
                        : t.status === 'ocupada'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40'
                        : t.status === 'conta'
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/40'
                        : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <span className="text-xs block font-mono">M-{t.number}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 block ${
                        isSelected
                          ? 'bg-stone-950'
                          : t.status === 'ocupada'
                          ? 'bg-emerald-400'
                          : t.status === 'conta'
                          ? 'bg-amber-400'
                          : 'bg-stone-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Wi-Fi Customization Info */}
            <div className="pt-3 border-t border-stone-800 space-y-2">
              <label className="text-xs font-bold text-stone-400 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-amber-400" />
                Dados do Wi-Fi na Plaquinha:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">Rede SSID</span>
                  <input
                    type="text"
                    value={wifiName}
                    onChange={(e) => setWifiName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Senha</span>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Printable Preview of Selected Table */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-stone-950 border border-stone-800 rounded-3xl shadow-xl space-y-4">
            <div className="w-full max-w-sm bg-white text-stone-900 rounded-3xl p-6 shadow-2xl border-4 border-amber-500 text-center space-y-4 relative">
              {/* Header */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                  {config.restaurantName}
                </p>
                <h3 className="text-3xl font-black tracking-tight text-stone-950 mt-1">
                  MESA {selectedTable}
                </h3>
                <p className="text-xs font-bold text-stone-700 mt-0.5">
                  Escaneie para fazer seu pedido pelo celular
                </p>
              </div>

              {/* QR Code SVG */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 inline-block mx-auto shadow-inner">
                <QRCodeSVG
                  value={getTableUrl(selectedTable)}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1 text-xs text-stone-600 font-medium">
                <p className="font-bold text-stone-900">
                  Cardápio completo com fotos, combos e adicionais.
                </p>
                <p className="text-[11px] text-stone-500">
                  Seu pedido vai direto para a cozinha em tempo real!
                </p>
              </div>

              {/* Wi-Fi Details */}
              <div className="bg-stone-100 rounded-xl p-2.5 text-xs text-stone-700 border border-stone-200 flex items-center justify-around font-mono">
                <div className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold">{wifiName}</span>
                </div>
                <div className="text-stone-400">|</div>
                <div>
                  Senha: <span className="font-bold">{wifiPass}</span>
                </div>
              </div>
            </div>

            {/* Test Scanner Button */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenTableMenu(selectedTable)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <Utensils className="w-4 h-4" />
                <span>Simular Leitura do QR da Mesa {selectedTable}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Mode: All 30 Tables (Printable Grid) */}
      {viewMode === 'all' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-xs text-amber-200 flex items-center justify-between">
            <span>
              Exibindo as 30 plaquinhas prontas para impressão e recorte. Use o botão <strong>&quot;Imprimir&quot;</strong> para enviar à impressora.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((t) => (
              <div
                key={t.id}
                className="bg-white text-stone-900 rounded-2xl p-4 shadow-md border-2 border-amber-500 text-center space-y-2 flex flex-col items-center justify-between"
              >
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 truncate">
                    {config.restaurantName}
                  </p>
                  <span className="inline-block bg-stone-950 text-amber-400 font-black text-base px-3 py-0.5 rounded-lg my-1">
                    MESA {t.number}
                  </span>
                  <p className="text-[10px] font-bold text-stone-800 line-clamp-1">
                    Escaneie para fazer seu pedido
                  </p>
                </div>

                <div className="p-2 bg-stone-50 rounded-xl border border-stone-200 my-1">
                  <QRCodeSVG
                    value={getTableUrl(t.number)}
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <div className="w-full text-[9px] bg-stone-100 p-1.5 rounded-lg text-stone-700 flex justify-between px-2">
                  <span>Wi-Fi: {wifiName}</span>
                  <span>Senha: {wifiPass}</span>
                </div>

                <button
                  onClick={() => onOpenTableMenu(t.number)}
                  className="w-full mt-1 py-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-md transition-colors cursor-pointer"
                >
                  Abrir Cardápio M-{t.number}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
