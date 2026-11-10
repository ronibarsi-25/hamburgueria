import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  QrCode,
  Terminal,
  Send,
  ExternalLink,
  Code2,
  KeyRound,
  Globe,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { RestaurantConfig } from '../types.ts';
import { generateFullPrompt } from '../constants/defaults.ts';
import { generateWhatsAppLink, getQrCodeImageUrl } from '../utils/qr.ts';

interface IntegrationGuideProps {
  config: RestaurantConfig;
}

interface WhatsAppWebhookLog {
  id: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  from: string;
  senderName?: string;
  messageText: string;
  replyText?: string;
  status: 'received' | 'sent' | 'failed' | 'ignored';
  error?: string;
}

export const IntegrationGuide: React.FC<IntegrationGuideProps> = ({ config }) => {
  // Meta WhatsApp Cloud API State
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [verifyToken, setVerifyToken] = useState('mari_burger_meta_webhook_2026');
  const [autoReply, setAutoReply] = useState(true);
  const [serverWebhookUrl, setServerWebhookUrl] = useState('');

  // Status & Feedback
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Connection Test State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [showTestMessageModal, setShowTestMessageModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTestMessage, setIsSendingTestMessage] = useState(false);

  // Webhook Logs State
  const [logs, setLogs] = useState<WhatsAppWebhookLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Copy states
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedVerifyToken, setCopiedVerifyToken] = useState(false);

  // Simulator state
  const [testWebhookText, setTestWebhookText] = useState('Boa noite, quero pedir burger');
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fullPrompt = generateFullPrompt(config);
  const defaultWhatsAppText = `Olá Mari! Quero conhecer o cardápio da ${config.restaurantName} 🍔`;
  const waLink = generateWhatsAppLink(config.phone, defaultWhatsAppText);
  const qrUrl = getQrCodeImageUrl(waLink, 300);

  // Load WhatsApp config from server
  const fetchWhatsAppConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        setHasStoredToken(Boolean(data.hasToken));
        setMaskedToken(data.maskedToken || '');
        setPhoneNumberId(data.phoneNumberId || '');
        setWabaId(data.wabaId || '');
        setVerifyToken(data.verifyToken || 'mari_burger_meta_webhook_2026');
        setAutoReply(data.autoReply !== false);
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        setServerWebhookUrl(data.webhookUrl || `${currentOrigin}/api/webhook/whatsapp`);
      }
    } catch (err) {
      console.warn('Erro ao carregar configurações do WhatsApp:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Load Webhook Logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/whatsapp/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppConfig();
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Save WhatsApp Cloud API credentials
  const handleSaveWhatsAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setSaveFeedback(null);

    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: apiKey,
          phoneNumberId,
          wabaId,
          verifyToken,
          autoReply,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveFeedback({
          type: 'success',
          message: 'Configurações da Meta WhatsApp Cloud API salvas com sucesso no servidor!',
        });
        setApiKey('');
        fetchWhatsAppConfig();
      } else {
        setSaveFeedback({
          type: 'error',
          message: data.error || 'Erro ao salvar configurações.',
        });
      }
    } catch (err: any) {
      setSaveFeedback({
        type: 'error',
        message: err.message || 'Erro de conexão com o servidor.',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Test connection to Meta Graph API
  const handleTestMetaConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          details: data.details,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Falha na validação com a Meta API.',
          details: data.details,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Erro ao testar conexão: ${err.message}`,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Send real test WhatsApp message
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber.trim()) return;
    setIsSendingTestMessage(true);

    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhone: testPhoneNumber }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setShowTestMessageModal(false);
        setTestPhoneNumber('');
        fetchLogs();
      } else {
        alert(`Erro: ${data.error || 'Falha ao enviar mensagem de teste'}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSendingTestMessage(false);
    }
  };

  const handleClearLogs = async () => {
    if (confirm('Deseja limpar todos os registros de mensagens do WhatsApp?')) {
      await fetch('/api/whatsapp/logs/clear', { method: 'POST' });
      setLogs([]);
    }
  };

  // Local Webhook Simulator
  const handleTestWebhook = async () => {
    if (!testWebhookText.trim() || isSimulating) return;
    setIsSimulating(true);

    try {
      const res = await fetch('/api/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: config.phone,
          text: testWebhookText,
          config: {
            restaurantName: config.restaurantName,
            menuUrl: config.menuUrl,
            neighborhoods: config.neighborhoods,
            openingHours: config.openingHours,
            isStoreOpen: config.isStoreOpen,
            featuredItems: config.featuredItems.map((i) => ({
              name: i.name,
              description: i.description,
              price: `R$ ${i.price.toFixed(2)}`,
            })),
            quickReplies: config.quickReplies,
          },
        }),
      });
      const data = await res.json();
      setWebhookResponse(JSON.stringify(data, null, 2));
    } catch {
      setWebhookResponse(JSON.stringify({ error: 'Falha na simulação do webhook' }, null, 2));
    } finally {
      setIsSimulating(false);
    }
  };

  const sampleCurl = `curl -X POST "${serverWebhookUrl || 'http://localhost:3000/api/webhook/simulate'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "${config.phone}",
    "text": "Olá Mari, quero 2 smash",
    "config": {
      "restaurantName": "${config.restaurantName}",
      "menuUrl": "${config.menuUrl}"
    }
  }'`;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* SECTION 1: Meta WhatsApp Cloud API Configuration Panel */}
      <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-100">
                  Meta WhatsApp Cloud API & Webhook Oficial
                </h2>
                {hasStoredToken && phoneNumberId ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    API Conectada
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Aguardando Configuração
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Conecte seu número real do WhatsApp Business oficial da Meta para que a Mari receba e responda mensagens reais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestMetaConnection}
              disabled={isTestingConnection || !hasStoredToken}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 disabled:opacity-40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isTestingConnection ? 'animate-spin' : ''}`} />
              <span>{isTestingConnection ? 'Validando...' : 'Testar Conexão Meta'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTestMessageModal(true)}
              disabled={!hasStoredToken}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-100 disabled:opacity-40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Enviar Teste no WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              saveFeedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {saveFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{saveFeedback.message}</span>
          </div>
        )}

        {/* Test Result Alert */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              testResult.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
            {testResult.details && (
              <pre className="text-[10px] bg-stone-900/80 p-2 rounded-lg font-mono text-stone-300 overflow-x-auto max-h-32 mt-1">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSaveWhatsAppConfig} className="space-y-4 text-xs">
          {/* Row 1: Access Token & Phone Number ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meta API Key / Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Meta Access Token / API Key:</span>
                </label>
                {hasStoredToken && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Token Salvo: {maskedToken}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasStoredToken ? 'Deixe em branco para manter o token salvo ou cole um novo...' : 'Cole o Token de Acesso Permanente (EAAG...)'}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 font-mono text-xs focus:border-amber-500 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300 cursor-pointer"
                  title={showApiKey ? 'Ocultar' : 'Exibir'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Gerado em Meta for Developers &gt; WhatsApp &gt; Configuração da API &gt; Token de Acesso.
              </p>
            </div>

            {/* Phone Number ID */}
            <div>
              <label className="text-stone-300 font-semibold block mb-1">
                Phone Number ID (Identificação do Número de Telefone):
              </label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="Ex: 104928374829102"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 font-mono text-xs focus:border-amber-500 outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                ID numérico do número de envio exibido no painel da Meta Cloud API.
              </p>
            </div>
          </div>

          {/* Row 2: WABA ID & Verify Token */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WABA ID */}
            <div>
              <label className="text-stone-300 font-semibold block mb-1">
                WhatsApp Business Account ID (WABA ID - Opcional):
              </label>
              <input
                type="text"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="Ex: 109876543210987"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 font-mono text-xs focus:border-amber-500 outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Identificador da conta empresarial WhatsApp Business.
              </p>
            </div>

            {/* Verify Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Token de Verificação do Webhook (Verify Token):</span>
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(verifyToken, setCopiedVerifyToken)}
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedVerifyToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedVerifyToken ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="mari_burger_meta_webhook_2026"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 font-mono text-xs focus:border-amber-500 outline-none"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Senha que a Meta enviará para validar a autenticidade do seu Webhook.
              </p>
            </div>
          </div>

          {/* Row 3: Official Webhook URL Banner (Read-only Copyable) */}
          <div className="p-4 bg-stone-900 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>URL do Webhook Oficial (Callback URL para o Meta for Developers):</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                HTTPS Ativo
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={serverWebhookUrl || 'https://ais-dev-halbz5ua67x2txhdxr6io2-26837071600.us-west2.run.app/api/webhook/whatsapp'}
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-stone-100 font-mono text-xs outline-none select-all"
              />
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    serverWebhookUrl || 'https://ais-dev-halbz5ua67x2txhdxr6io2-26837071600.us-west2.run.app/api/webhook/whatsapp',
                    setCopiedWebhookUrl
                  )
                }
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              >
                {copiedWebhookUrl ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4 text-stone-950" />}
                <span>{copiedWebhookUrl ? 'URL Copiada!' : 'Copiar URL do Webhook'}</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              Cole este endereço exato em: <strong>developers.facebook.com &gt; Seu App &gt; WhatsApp &gt; Configuração &gt; Webhook &gt; Editar</strong>.
            </p>
          </div>

          {/* Toggle Auto-reply */}
          <div className="flex items-center justify-between p-3.5 bg-stone-900/60 rounded-xl border border-stone-800">
            <div className="space-y-0.5">
              <p className="font-bold text-stone-200">
                Atendimento Automático da Mari pelo WhatsApp
              </p>
              <p className="text-[11px] text-stone-400">
                Quando ativado, a Mari responde instantaneamente aos clientes pelo WhatsApp usando IA e as regras da hamburgueria.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoReply}
                onChange={(e) => setAutoReply(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingConfig ? 'Salvando...' : 'Salvar Configurações da Meta'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: 4-Step Walkthrough: Como configurar no Meta for Developers */}
      <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-stone-100">
              Passo a Passo: Como ativar no Meta for Developers
            </h3>
          </div>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold"
          >
            <span>Abrir developers.facebook.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-stone-200">Crie seu App Business</h4>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              No painel Meta for Developers, clique em <strong>Criar aplicativo</strong> e selecione o tipo <strong>Empresa / Outro</strong>.
            </p>
          </div>

          <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-stone-200">Adicione o WhatsApp</h4>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Adicione o produto <strong>WhatsApp</strong> ao seu aplicativo e acesse a aba <strong>Configuração da API</strong>.
            </p>
          </div>

          <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
              3
            </div>
            <h4 className="font-bold text-stone-200">Configure o Webhook</h4>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Vá em <strong>Configuração &gt; Webhook</strong>, clique em <strong>Editar</strong> e cole a URL do Webhook e o Token de Verificação acima.
            </p>
          </div>

          <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
              4
            </div>
            <h4 className="font-bold text-stone-200">Inscreva no campo &apos;messages&apos;</h4>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Na lista de campos do Webhook, clique em <strong>Gerenciar</strong> e ative a caixa do campo <strong>messages</strong>. Pronto!
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Live Real-Time Webhook Messages Feed */}
      <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-stone-100">
              Monitor de Mensagens Recebidas em Tempo Real (Webhook Feed)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoadingLogs}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>

            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3 py-1.5 bg-stone-900 hover:bg-rose-950 text-rose-400 border border-stone-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="bg-stone-900/40 rounded-xl p-8 border border-dashed border-stone-800 text-center space-y-2">
            <MessageCircle className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-xs text-stone-400 font-bold">Nenhuma mensagem recebida via Webhook ainda</p>
            <p className="text-[11px] text-stone-500 max-w-md mx-auto">
              Assim que um cliente enviar uma mensagem para o seu número WhatsApp cadastrado na Meta, ela aparecerá aqui instantaneamente com a resposta gerada pela Mari.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-stone-900 p-3.5 rounded-xl border border-stone-800 space-y-2 text-xs hover:border-stone-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-200">
                      {log.senderName || 'Cliente'} ({log.from})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        log.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : log.status === 'failed'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {log.status === 'sent' ? 'Respondido no WhatsApp' : log.status === 'failed' ? 'Erro de Envio' : 'Recebido'}
                    </span>
                  </div>
                  <span className="text-stone-500">
                    {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>

                <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800/80 text-stone-300">
                  <span className="text-[10px] text-stone-500 block font-bold mb-0.5">Cliente enviou:</span>
                  <p className="font-mono text-xs">{log.messageText}</p>
                </div>

                {log.replyText && (
                  <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-200">
                    <span className="text-[10px] text-amber-400 block font-bold mb-0.5">Mari respondeu:</span>
                    <p className="whitespace-pre-line text-xs font-mono">{log.replyText}</p>
                  </div>
                )}

                {log.error && (
                  <p className="text-[10px] text-rose-400 font-mono">
                    Motivo do erro: {log.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: System Prompt & Simulator / QR Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Prompt Box */}
        <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-stone-100">
                Prompt Oficial da Mari
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(fullPrompt, setCopiedPrompt)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="bg-stone-900 border border-stone-800 rounded-xl p-4 text-xs font-mono text-stone-300 overflow-x-auto max-h-60 leading-relaxed">
            {fullPrompt}
          </pre>
        </div>

        {/* QR Code & Local Simulator */}
        <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-800">
            <QrCode className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-stone-100">
              QR Code do WhatsApp
            </h3>
          </div>

          <div className="flex items-center gap-4 bg-stone-900 p-4 rounded-xl border border-stone-800">
            <div className="p-2 bg-white rounded-xl shrink-0">
              <img src={qrUrl} alt="QR Code" className="w-24 h-24 object-contain" />
            </div>
            <div className="space-y-1.5 text-xs text-stone-400">
              <p className="font-bold text-stone-200">
                Link wa.me para o atendimento
              </p>
              <p className="text-[11px]">
                Abra no WhatsApp direto pelo celular:
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 font-bold hover:underline"
              >
                <span>Conversar no WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Local Webhook Simulator */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-stone-300 block">
              Simulador Local de Mensagens:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={testWebhookText}
                onChange={(e) => setTestWebhookText(e.target.value)}
                placeholder="Simular mensagem do cliente..."
                className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-stone-100 text-xs focus:border-amber-500 outline-none"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg cursor-pointer"
              >
                {isSimulating ? '...' : 'Simular'}
              </button>
            </div>

            {webhookResponse && (
              <pre className="bg-stone-900 p-2.5 rounded-lg border border-stone-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-32">
                {webhookResponse}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Enviar Mensagem de Teste no WhatsApp */}
      {showTestMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 text-sm">
                    Enviar Mensagem de Teste Real
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Dispare uma mensagem via Meta Cloud API para seu celular
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestMessageModal(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-300 font-semibold block mb-1">
                  Seu Número de WhatsApp com DDD (Código do País 55):
                </label>
                <input
                  type="text"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="Ex: 5511998765432"
                  required
                  autoFocus
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-mono font-bold text-sm focus:border-amber-500 outline-none"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Insira o formato internacional completo: 55 + DDD + Número.
                </p>
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
                <p className="text-amber-400 font-bold">Aviso sobre números de teste na Meta:</p>
                <p>
                  No modo de desenvolvimento da Meta Cloud API, você só pode enviar mensagens para números cadastrados na lista &quot;Números de Telefone de Destino&quot; no painel da Meta.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowTestMessageModal(false)}
                  className="px-4 py-2 border border-stone-700 hover:bg-stone-800 rounded-xl text-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingTestMessage}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTestMessage ? 'Disparando...' : 'Enviar Agora'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
