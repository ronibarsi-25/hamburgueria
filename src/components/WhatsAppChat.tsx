import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCheck, Phone, Video, MoreVertical, Sparkles, Volume2, VolumeX, RotateCcw, ExternalLink, Utensils, Clock, Store, AlertCircle, Zap, ChevronUp } from 'lucide-react';
import { ChatMessage, RestaurantConfig, QuickReplyShortcut } from '../types.ts';
import { soundFX } from '../utils/audio.ts';
import { QUICK_SCENARIOS } from '../constants/defaults.ts';

interface WhatsAppChatProps {
  config: RestaurantConfig;
  onUpdateConfig: (newConfig: RestaurantConfig) => void;
  onOpenMenu: () => void;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({ config, onUpdateConfig, onOpenMenu }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Olá! 🍔 Bem-vindo à ${config.restaurantName}! Que bom ter você aqui. Eu sou a Mari, sua atendente virtual. Vamos de burger hoje? 🚀\n\nClique no link abaixo para ver nosso cardápio completo com fotos, montar seu pedido e acompanhar a entrega em tempo real:\n👉 ${config.menuUrl}`,
      timestamp: '19:45',
      status: 'read',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showShortcutsMenu, setShowShortcutsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const toggleSound = () => {
    soundFX.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'reset-1',
        role: 'assistant',
        content: `Olá! 🍔 Bem-vindo à ${config.restaurantName}! Que bom ter você aqui. Eu sou a Mari, sua atendente virtual. Vamos de burger hoje? 🚀\n\nClique no link abaixo para ver nosso cardápio completo com fotos, montar seu pedido e acompanhar a entrega em tempo real:\n👉 ${config.menuUrl}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      },
    ]);
  };

  const toggleStoreStatus = () => {
    const updated = {
      ...config,
      isStoreOpen: !config.isStoreOpen,
      currentSimulatedTime: !config.isStoreOpen ? '19:30 (Loja Aberta)' : 'Segunda-feira 14:00 (Fechado)',
    };
    onUpdateConfig(updated);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isTyping) return;

    soundFX.playSend();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: timeStr,
      status: 'read',
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          history: newHistory.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          })),
          config: {
            restaurantName: config.restaurantName,
            menuUrl: config.menuUrl,
            neighborhoods: config.neighborhoods,
            openingHours: config.openingHours,
            isStoreOpen: config.isStoreOpen,
            currentSimulatedTime: config.currentSimulatedTime,
            featuredItems: config.featuredItems.map(i => ({
              name: i.name,
              description: i.description,
              price: `R$ ${i.price.toFixed(2)}`,
            })),
            quickReplies: config.quickReplies,
          },
        }),
      });

      const data = await response.json();
      const replyText = data.reply || `Dá uma olhada no nosso cardápio: ${config.menuUrl} 🚀`;

      // Simulate natural WhatsApp response delay
      setTimeout(() => {
        setIsTyping(false);
        soundFX.playReceive();
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          },
        ]);
      }, 700);
    } catch {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Tive uma leve oscilação, mas você pode conferir tudo direto no nosso cardápio oficial: ${config.menuUrl} 🍔`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to render message text and convert menu links into rich cards
  const renderMessageContent = (content: string) => {
    // Check if message contains url
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    const hasMenuUrl = content.includes(config.menuUrl) || content.includes('http');

    return (
      <div className="space-y-2">
        <div className="whitespace-pre-wrap leading-relaxed break-words text-[14.5px]">
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline font-semibold break-all inline-flex items-center gap-1"
                >
                  {part}
                </a>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>

        {/* Rich Link Card for Mari's Digital Menu Link */}
        {hasMenuUrl && (
          <div className="mt-2.5 p-3 rounded-lg bg-stone-900/80 border border-amber-500/30 hover:border-amber-500/60 transition-all shadow-md group">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                <img
                  src="/src/assets/images/burger_cheddar_max_1793901189809.jpg"
                  alt="Cardápio"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide truncate">
                  Cardápio Digital Oficial
                </p>
                <p className="text-sm font-bold text-stone-100 truncate">
                  {config.restaurantName}
                </p>
                <p className="text-xs text-stone-400 line-clamp-1">
                  Monte seu burger, adicione bebidas e feche para a cozinha 🚀
                </p>
              </div>
            </div>

            <button
              onClick={onOpenMenu}
              className="mt-2.5 w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Abrir Cardápio na Tela</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl overflow-hidden">
      {/* Simulator Control Ribbon */}
      <div className="bg-stone-900/90 border-b border-stone-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-500" />
            <span className="text-stone-400 font-medium">Status da Loja:</span>
            <button
              onClick={toggleStoreStatus}
              className={`px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                config.isStoreOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              }`}
              title="Clique para alternar loja aberta ou fechada para testar o comportamento da Mari"
            >
              <span className={`w-2 h-2 rounded-full ${config.isStoreOpen ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span>{config.isStoreOpen ? 'Aberta (18h-23h)' : 'Fechada (Fora do Horário)'}</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-stone-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-stone-300 font-mono">{config.currentSimulatedTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-md transition-colors"
            title={soundEnabled ? 'Silenciar sons do WhatsApp' : 'Ativar sons do WhatsApp'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={clearChat}
            className="px-2.5 py-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-md transition-colors flex items-center gap-1 text-[11px]"
            title="Reiniciar conversa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* Quick Test Scenarios Bar */}
      <div className="bg-stone-900/60 px-4 py-2 border-b border-stone-800/80 overflow-x-auto flex items-center gap-2 scrollbar-none">
        <span className="text-[11px] font-semibold text-stone-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Testes Rápidos:
        </span>
        {QUICK_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleSendMessage(scenario.message)}
            disabled={isTyping}
            className="shrink-0 px-2.5 py-1 text-xs rounded-md bg-stone-800/80 hover:bg-amber-500/20 text-stone-300 hover:text-amber-300 border border-stone-700/60 hover:border-amber-500/40 transition-colors cursor-pointer disabled:opacity-50"
            title={scenario.description}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {/* WhatsApp Official Chat Header */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-emerald-500/40 shadow-sm bg-stone-800">
              <img
                src="/src/assets/images/mari_avatar_1793901183869.jpg"
                alt="Mari Atendente"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#202c33] rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-stone-100 text-[15px] tracking-tight">
                Mari · {config.restaurantName}
              </h2>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-[#202c33] flex items-center justify-center text-[9px] font-black" title="Conta Comercial Verificada">
                ✓
              </span>
            </div>
            <p className="text-xs text-emerald-400 font-medium">
              {isTyping ? (
                <span className="italic animate-pulse">digitando...</span>
              ) : (
                'Conta Comercial Oficial · Online'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-stone-400">
          <button
            onClick={() => alert(`Simulação de ligação de voz para Mari (${config.phone})`)}
            className="hover:text-stone-200 transition-colors p-1"
            title="Ligar"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert(`Simulação de chamada de vídeo com ${config.restaurantName}`)}
            className="hover:text-stone-200 transition-colors p-1"
            title="Vídeo"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenMenu}
            className="hover:text-amber-400 text-stone-400 transition-colors p-1"
            title="Ver Cardápio"
          >
            <Utensils className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WhatsApp Message Body */}
      <div className="flex-1 wa-chat-bg p-4 overflow-y-auto space-y-3.5 min-h-[380px]">
        {/* Security / Encryption Notice Banner */}
        <div className="flex justify-center my-2">
          <div className="bg-[#182229] border border-stone-800 text-amber-200/80 text-[11px] py-1.5 px-3 rounded-lg text-center max-w-sm flex items-center justify-center gap-1.5 shadow-sm">
            <span className="text-amber-400">🔒</span>
            <span>Atendimento automatizado inteligente com a Mari. Conversas protegidas.</span>
          </div>
        </div>

        {/* Store Closed Warning if simulated closed */}
        {!config.isStoreOpen && (
          <div className="flex justify-center my-1">
            <div className="bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs py-1.5 px-3 rounded-lg text-center max-w-md flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Simulação: A hamburgueria está FECHADA neste momento. Teste mandar mensagem!</span>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm relative ${
                  isUser
                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-stone-800/50'
                }`}
              >
                {!isUser && (
                  <p className="text-[11px] font-bold text-amber-400 mb-0.5">
                    Mari 🍔
                  </p>
                )}

                {renderMessageContent(msg.content)}

                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-stone-400/90 select-none">
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#202c33] text-stone-300 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-stone-800/50 flex items-center gap-2">
              <span className="text-xs text-amber-400 font-semibold">Mari está digitando</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp Input Bar & Quick Replies Drawer */}
      <div className="relative bg-[#202c33] border-t border-stone-800">
        {/* Shortcuts Popup Menu */}
        {showShortcutsMenu && (
          <div className="absolute bottom-full left-0 right-0 bg-stone-900 border-t border-amber-500/30 p-3 max-h-56 overflow-y-auto space-y-2 shadow-2xl z-30 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Atalhos de Respostas Rápidas (Mari FAQ)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowShortcutsMenu(false)}
                className="text-[11px] text-stone-400 hover:text-stone-200"
              >
                Fechar ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {(config.quickReplies || []).filter(qr => qr.enabled).map((qr) => (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => {
                    handleSendMessage(qr.shortcut);
                    setShowShortcutsMenu(false);
                  }}
                  className="text-left p-2 rounded-lg bg-stone-950/80 hover:bg-amber-500/15 border border-stone-800 hover:border-amber-500/40 transition-colors flex items-start gap-2 group cursor-pointer"
                >
                  <span className="font-mono font-bold text-xs text-amber-400 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {qr.shortcut}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 truncate">
                      {qr.title}
                    </p>
                    <p className="text-[10px] text-stone-400 line-clamp-1">
                      {qr.triggers}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-3 py-2.5 flex items-center gap-2">
          <button
            onClick={() => setInputText(prev => prev + ' 🍔 ')}
            className="text-stone-400 hover:text-stone-200 p-2 text-lg hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
            title="Inserir emoji de hambúrguer"
          >
            🍔
          </button>

          <button
            type="button"
            onClick={() => setShowShortcutsMenu(!showShortcutsMenu)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              showShortcutsMenu
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800/80 text-amber-400 hover:bg-stone-700/80 border border-stone-700'
            }`}
            title="Ver atalhos rápidos da Mari (/pagamento, /ingredientes, /pix...)"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="font-mono">/ Atalhos</span>
            <ChevronUp className={`w-3 h-3 transition-transform ${showShortcutsMenu ? 'rotate-180' : ''}`} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite como cliente ou use um atalho (ex: /pagamento, aceita pix?)..."
            className="flex-1 bg-[#2a3942] text-stone-100 placeholder-stone-400 text-sm px-4 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent transition-all"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 disabled:hover:bg-[#00a884] text-stone-950 flex items-center justify-center transition-transform active:scale-95 shrink-0 cursor-pointer"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4 ml-0.5 text-stone-900" />
          </button>
        </div>
      </div>
    </div>
  );
};
