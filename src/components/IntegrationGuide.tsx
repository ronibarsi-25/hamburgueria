import React, { useState } from 'react';
import { Copy, Check, QrCode, Terminal, Send, ExternalLink, Code2 } from 'lucide-react';
import { RestaurantConfig } from '../types.ts';
import { generateFullPrompt } from '../constants/defaults.ts';
import { generateWhatsAppLink, getQrCodeImageUrl } from '../utils/qr.ts';

interface IntegrationGuideProps {
  config: RestaurantConfig;
}

export const IntegrationGuide: React.FC<IntegrationGuideProps> = ({ config }) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testWebhookText, setTestWebhookText] = useState('Boa noite, quero pedir burger');
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fullPrompt = generateFullPrompt(config);
  const defaultWhatsAppText = `Olá Mari! Quero conhecer o cardápio da ${config.restaurantName} 🍔`;
  const waLink = generateWhatsAppLink(config.phone, defaultWhatsAppText);
  const qrUrl = getQrCodeImageUrl(waLink, 300);

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

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
            featuredItems: config.featuredItems.map(i => ({
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

  const sampleCurl = `curl -X POST "http://localhost:3000/api/webhook/simulate" \\
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tab 1: System Prompt */}
      <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-stone-100">
                Prompt Oficial da Mari (Instrução do Sistema)
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Pronto para copiar e colar no seu Typebot, Evolution API, Z-API, Chatwoot, n8n ou Gemini.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(fullPrompt, setCopiedPrompt)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
          >
            {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPrompt ? 'Prompt Copiado!' : 'Copiar Prompt da Mari'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="bg-stone-900 border border-stone-800 rounded-xl p-4 text-xs font-mono text-stone-300 overflow-x-auto max-h-72 leading-relaxed">
            {fullPrompt}
          </pre>
        </div>
      </div>

      {/* Grid: QR Code & Webhook Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code & wa.me link */}
        <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-stone-100">
                QR Code & Link WhatsApp (wa.me)
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Imprima para colocar nas mesas da hamburgueria, balcão ou redes sociais.
            </p>

            <div className="my-5 flex flex-col items-center justify-center p-4 bg-stone-900 rounded-xl border border-stone-800">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <img
                  src={qrUrl}
                  alt="QR Code WhatsApp"
                  className="w-44 h-44 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-3 text-center">
                Apontando a câmera do celular, o cliente abre o WhatsApp já falando com a Mari.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-stone-100 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>Testar Link no WhatsApp Real</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Webhook API Simulator */}
        <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-stone-100">
                Simulador de Webhook / API
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Simule a resposta que seu servidor WhatsApp receberá via JSON.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs text-stone-300 font-medium block">
                Texto de entrada simulado:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testWebhookText}
                  onChange={(e) => setTestWebhookText(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-stone-100 text-xs focus:border-amber-500 outline-none"
                  placeholder="Mensagem do cliente..."
                />
                <button
                  onClick={handleTestWebhook}
                  disabled={isSimulating}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSimulating ? '...' : 'Testar'}</span>
                </button>
              </div>
            </div>

            {webhookResponse && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-stone-400 mb-1">Resposta JSON do Webhook:</p>
                <pre className="bg-stone-900 border border-stone-800 rounded-lg p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-44 leading-relaxed">
                  {webhookResponse}
                </pre>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => copyToClipboard(sampleCurl, setCopiedCurl)}
              className="w-full py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'cURL Copiado!' : 'Copiar comando cURL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
