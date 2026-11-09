import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface RestaurantConfig {
  restaurantName?: string;
  menuUrl?: string;
  neighborhoods?: string[];
  openingHours?: string;
  isStoreOpen?: boolean;
  currentSimulatedTime?: string;
  customRules?: string;
  featuredItems?: Array<{ name: string; description: string; price?: string }>;
  quickReplies?: Array<{
    id: string;
    shortcut: string;
    title: string;
    category: string;
    triggers: string;
    responseTemplate: string;
    enabled: boolean;
  }>;
}

function buildSystemInstruction(config: RestaurantConfig): string {
  const restaurantName = config.restaurantName?.trim() || 'Hamburgueria Artesanal';
  const menuUrl = config.menuUrl?.trim() || 'https://minhahamburgueria.com.br';
  const neighborhoods = (config.neighborhoods && config.neighborhoods.length > 0)
    ? config.neighborhoods.join(', ')
    : 'Centro, Jardins, Vila Nova, Bela Vista';
  const openingHours = config.openingHours?.trim() || 'Terça a Domingo, das 18h às 23h';
  const isStoreOpen = config.isStoreOpen !== undefined ? config.isStoreOpen : true;
  const currentSimulatedTime = config.currentSimulatedTime || 'Noite de funcionamento ativo';

  const menuItemsText = (config.featuredItems && config.featuredItems.length > 0)
    ? config.featuredItems.map(item => `- ${item.name}: ${item.description}${item.price ? ` (${item.price})` : ''}`).join('\n')
    : `- Cheddar Max: Dois burgers bovinos suculentos, cheddar cremoso transbordando, fatias crocantes de bacon e maionese artesanal em pão brioche dourado.
- Smash Duplo Especial: Dois smash burgers com crostinha crocante, queijo prato derretido, picles crocantes, cebola picadinha e molho especial da casa.
- Batata Rústica da Casa: Batatas douradas com alecrim fresco e sal grosso, servidas com maionese artesanal de alho.`;

  const activeQuickReplies = (config.quickReplies || [])
    .filter(qr => qr.enabled)
    .map(qr => {
      const formatted = qr.responseTemplate.replace(/\{menuUrl\}/g, menuUrl);
      return `- Tópico: ${qr.title} (Atalho: ${qr.shortcut})
  Gatilhos de pergunta do cliente: ${qr.triggers}
  Resposta Padrão da Mari: "${formatted}"`;
    }).join('\n\n');

  return `# CONTEXTO E IDENTIDADE
Você é a "Mari", assistente virtual oficial da ${restaurantName}. Você atende clientes no WhatsApp de forma rápida, simpática e focada em conversão. Seu tom de voz é descontraído, acolhedor e ágil. Use emojis (🍔, 🍟, 🥤, 🚀) para deixar a conversa leve, mas sem poluir o texto.

# LINK DO CARDÁPIO DIGITAL (CRÍTICO)
Seu objetivo principal é fazer o cliente clicar no link do cardápio online para montar o pedido.
Link Oficial: ${menuUrl}

# STATUS ATUAL DA LOJA (ESTADO DO SIMULADOR)
- A loja está atualmente: ${isStoreOpen ? 'ABERTA E ATENDENDO' : 'FECHADA NO MOMENTO'}.
- Horário Atual de Simulação: ${currentSimulatedTime}.
- Horário Oficial de Funcionamento: ${openingHours}.
- Se a loja estiver FECHADA: Avise educadamente que estamos fechados no momento e informe com clareza o horário de funcionamento (${openingHours}), convidando o cliente a dar uma olhada no cardápio ${menuUrl} para adiantar a escolha.

# ÁREA DE ENTREGA E TAXAS
- Área de Entrega Atendida: Apenas os bairros: ${neighborhoods}.
- Se o cliente perguntar se entrega no bairro dele: Se for um dos bairros atendidos, diga que sim! Se não for, avise com carinho que ainda não atendemos esse bairro.
- IMPORTANTE: NÃO calcule taxas de entrega por texto. Diga que o sistema calcula a taxa exata direto no link: ${menuUrl} 🛵.

# RESPOSTAS RÁPIDAS & DÚVIDAS FREQUENTES (PAGAMENTOS, INGREDIENTES E ATALHOS)
Quando o cliente fizer perguntas sobre formas de pagamento, Pix, cartões, troco, ingredientes do blend, ponto da carne ou opções vegetarianas/alergênicos, responda utilizando a diretriz e tom dos atalhos cadastrados abaixo:
${activeQuickReplies}

# CARDÁPIO CONHECIDO DA HAMBURGUERIA
${menuItemsText}

# DIRETRIZES DE COMPORTAMENTO E FORMATO (WHATSAPP)
1. RESPOSTAS CURTAS: Escreva mensagens de no máximo 2 ou 3 linhas. Divida o texto em parágrafos pequenos. No WhatsApp, ninguém lê blocos grandes de texto.
2. NÃO FAÇA PEDIDOS POR TEXTO: Se o cliente começar a digitar os itens do pedido no chat (Ex: "quero dois x-salada e uma coca", "me manda um cheddar max"), responda com carinho e carisma explicando que para o pedido ir direto para a tela da cozinha sem riscos de erros ou atrasos, ele precisa fechar a sacola pelo link oficial: ${menuUrl}
3. DÚVIDAS SOBRE O MENU: Se o cliente perguntar o preço ou o que vem em um hambúrguer específico, dê uma resposta rápida e apetitosa (Ex: "O Cheddar Max vem com muito cheddar cremoso e bacon crocante! 🤤") e emende com o link: "Você pode ver fotos dele e os valores atualizados aqui: ${menuUrl}".
4. SUPORTE, RECLAMAÇÃO OU HUMANO: Se o cliente pedir suporte, tiver problemas com o pedido ou quiser falar com um atendente humano:
"Entendido! Vou chamar um dos nossos meninos do atendimento humano para falar com você agora mesmo. Só um minutinho que eles já assumem a conversa! 🙋‍♂️"

# RESTRIÇÕES ABSOLUTAS
- Nunca invente preços, cupons de desconto ou ingredientes que não existam.
- Se o cliente insistir em fazer o pedido por texto, repita a instrução do cardápio digital de forma educada e compreensiva.
- Mantenha o formato autêntico de mensagens de WhatsApp (parágrafos curtos, emojis pontuais, amigável).`;
}

// Rule-based fallback if API key is absent or quota exhausted
function generateFallbackResponse(userMessage: string, config: RestaurantConfig): string {
  const text = userMessage.toLowerCase().trim();
  const name = config.restaurantName || 'nossa hamburgueria';
  const url = config.menuUrl || 'https://minhahamburgueria.com.br';
  const isOpen = config.isStoreOpen !== false;
  const hours = config.openingHours || 'Terça a Domingo, das 18h às 23h';
  const neighborhoods = config.neighborhoods?.join(', ') || 'Centro, Jardins, Vila Nova e Bela Vista';

  if (!isOpen) {
    return `Olá! 🍔 No momento a ${name} está fechada.\n\nNosso horário de funcionamento é de ${hours}! Mas você já pode ir babando no nosso cardápio aqui: ${url} 🚀`;
  }

  // Check matching custom quick replies first
  if (config.quickReplies && config.quickReplies.length > 0) {
    for (const qr of config.quickReplies) {
      if (!qr.enabled) continue;
      // Match shortcut command (e.g. /pagamento)
      if (text.startsWith(qr.shortcut.toLowerCase())) {
        return qr.responseTemplate.replace(/\{menuUrl\}/g, url);
      }
      // Match trigger words
      const triggerWords = qr.triggers.toLowerCase().split(',').map(w => w.trim()).filter(Boolean);
      const isMatched = triggerWords.some(w => text.includes(w));
      if (isMatched) {
        return qr.responseTemplate.replace(/\{menuUrl\}/g, url);
      }
    }
  }

  // Greeting
  if (/^(oi|ol[aá]|boa noite|boa tarde|bom dia|opa|hey|quero pedir|fazer pedido)/i.test(text)) {
    return `Olá! 🍔 Bem-vindo à ${name}! Que bom ter você aqui. Eu sou a Mari, sua atendente virtual. Vamos de burger hoje? 🚀\n\nClique no link abaixo para ver nosso cardápio completo com fotos, montar seu pedido e acompanhar a entrega em tempo real:\n👉 ${url}`;
  }

  // Ordering by text
  if (/(quero|manda|me vê|duas?|pede|x-|hamburguer|coca|batata|combo|lanche|pedido)/i.test(text) && /(dois|duas|uma?|sem cebola|com bacon|refrigerante|lata|porção)/i.test(text)) {
    return `Amo essa escolha! 🤤 Mas ó: pra garantir que seu pedido vá direto pra tela da cozinha sem risco de errinhos ou atrasos, você precisa fechar pelo nosso link:\n👉 ${url}\n\nLá você escolhe ponto da carne, adicionais e fecha rapidinho! 🚀`;
  }

  // Neighborhood / Delivery
  if (/(entrega|bairro|taxa|frete|rua|entregam|chega em)/i.test(text)) {
    return `Entregamos sim! Atendemos os bairros ${neighborhoods}. 🛵\n\nPara consultar a taxa exata para a sua rua, é só colocar seu endereço direto no nosso cardápio online:\n👉 ${url}`;
  }

  // Specific burger question
  if (/(cheddar|smash|ingrediente|o que vem|preço|quanto custa|valor|cardapio|cardápio)/i.test(text)) {
    return `Nosso Cheddar Max é incrível, vem com duplo burger suculento, muito cheddar cremoso e bacon bem crocante! 🤤🥓\n\nVocê pode ver as fotos de todos os burgers e os valores atualizados aqui no link:\n👉 ${url}`;
  }

  // Support / Human transfer
  if (/(humano|atendente|mo[çc]a|pessoa|falar com algu[eé]m|atrasou|reclamar|problema|errado)/i.test(text)) {
    return `Entendido! Vou chamar um dos nossos meninos do atendimento humano para falar com você agora mesmo. Só um minutinho que eles já assumem a conversa! 🙋‍♂️`;
  }

  // Operating hours query
  if (/(hor[aá]rio|aberto|funcionamento|fecham|que horas)/i.test(text)) {
    return `Funcionamos de ${hours}! ⏰\n\nPode montar seu pedido agora pelo link com entrega quentinha:\n👉 ${url} 🚀`;
  }

  // Default conversion answer
  return `Com certeza! 🍔 Dá uma olhadinha no nosso cardápio digital completo com fotos, combos e promoções do dia:\n👉 ${url}\n\nSe tiver qualquer dúvida sobre algum burger, só me chamar! 🚀`;
}

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], config = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem inválida' });
    }

    const systemInstruction = buildSystemInstruction(config);

    if (ai) {
      try {
        // Build conversation contents
        // Use gemini-3.8-flash as recommended
        const contents = [];

        // Add history up to last 10 messages for context
        for (const item of history.slice(-10)) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.content }],
          });
        }

        // Add current user message
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
          },
        });

        // Timeout race in case of slow connection
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
        const result = await Promise.race([geminiPromise, timeoutPromise]);

        if (result && 'text' in result && result.text) {
          return res.json({ reply: result.text, source: 'gemini' });
        } else {
          const reply = generateFallbackResponse(message, config);
          return res.json({ reply, source: 'smart_fallback' });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to smart rule engine:', geminiError);
        const reply = generateFallbackResponse(message, config);
        return res.json({ reply, source: 'smart_fallback' });
      }
    } else {
      const reply = generateFallbackResponse(message, config);
      return res.json({ reply, source: 'rule_engine' });
    }
  } catch (error) {
    console.error('Erro no endpoint de chat:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem da Mari' });
  }
});

// Webhook simulation endpoint for restaurant tech stack
app.post('/api/webhook/simulate', async (req, res) => {
  const { from = '5511999998888', text = 'Olá', config = {} } = req.body;
  const systemInstruction = buildSystemInstruction(config);

  let replyText = '';
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text }] }],
        config: { systemInstruction },
      });
      replyText = response.text || generateFallbackResponse(text, config);
    } catch {
      replyText = generateFallbackResponse(text, config);
    }
  } else {
    replyText = generateFallbackResponse(text, config);
  }

  // Return standard WhatsApp API response format
  return res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    recipient: from,
    messages: [
      {
        type: 'text',
        text: {
          body: replyText,
        },
      },
    ],
  });
});

// ==========================================
// Database Backup Endpoints (Filesystem Persistence)
// ==========================================
const backupDir = path.resolve(__dirname, 'data', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// List all server backups
app.get('/api/backup/list', (_req, res) => {
  try {
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [] });
    }
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json'));
    const backups = files
      .map((filename) => {
        const filePath = path.join(backupDir, filename);
        const stat = fs.statSync(filePath);
        let summary: { ordersCount?: number; totalRevenue?: number; version?: string } = {};
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          summary = {
            ordersCount: content.data?.orders?.length || 0,
            totalRevenue: content.meta?.totalRevenue || 0,
            version: content.version || '2.0.0',
          };
        } catch {
          // Ignore parse errors on corrupted files
        }
        return {
          filename,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
          ...summary,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ backups });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({ error: 'Erro ao listar backups do servidor' });
  }
});

// Save backup to server disk
app.post('/api/backup/save', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.data) {
      return res.status(400).json({ error: 'Payload de backup inválido ou vazio' });
    }
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-hamburgueria-${dateStr}.json`;
    const filePath = path.join(backupDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    res.json({
      success: true,
      filename,
      message: 'Backup do banco de dados salvo com sucesso no servidor!',
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Erro ao salvar backup no disco:', error);
    res.status(500).json({ error: 'Erro ao salvar arquivo de backup no servidor' });
  }
});

// Download backup file
app.get('/api/backup/download/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(backupDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo de backup não encontrado' });
    }
    res.download(filePath, filename);
  } catch (error) {
    console.error('Erro ao baixar arquivo de backup:', error);
    res.status(500).json({ error: 'Erro ao baixar arquivo de backup' });
  }
});

// Get/read backup JSON content from server
app.get('/api/backup/get/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(backupDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo de backup não encontrado' });
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(content);
  } catch (error) {
    console.error('Erro ao ler backup:', error);
    res.status(500).json({ error: 'Erro ao carregar conteúdo do backup' });
  }
});

// Delete backup file from server
app.delete('/api/backup/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(backupDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'Arquivo de backup excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    res.status(500).json({ error: 'Erro ao excluir backup' });
  }
});

// Offline Order Sync Endpoint
const syncedOrdersQueue: any[] = [];
app.post('/api/orders/sync', (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.id) {
      return res.status(400).json({ error: 'Dados do pedido inválidos para sincronização' });
    }
    syncedOrdersQueue.push({
      ...order,
      serverSyncedAt: new Date().toISOString(),
    });
    console.log(`[Offline Sync] Pedido ${order.id} sincronizado com sucesso da comanda offline.`);
    res.json({
      success: true,
      orderId: order.id,
      syncedAt: new Date().toISOString(),
      queueLength: syncedOrdersQueue.length,
    });
  } catch (error) {
    console.error('Erro na sincronização de pedido offline:', error);
    res.status(500).json({ error: 'Erro interno ao sincronizar pedido' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
