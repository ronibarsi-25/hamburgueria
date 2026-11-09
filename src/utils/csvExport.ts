import { Order, CashRegister, Expense, CompanyInfo } from '../types.ts';

/**
 * Escapes a cell value for CSV formatting using semicolon delimiter (standard for PT-BR / Excel)
 */
const escapeCSV = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value).trim();
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Downloads a string content as a CSV file with UTF-8 BOM
 */
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats currency for Brazilian CSV without symbol, using comma as decimal
 */
const fmtMoney = (val: number): string => {
  return Number(val || 0).toFixed(2).replace('.', ',');
};

/**
 * Generates and downloads the Daily Closing Report (Fechamento Diário de Caixa & Vendas)
 */
export const exportDailyClosingCSV = (
  orders: Order[],
  cashRegister: CashRegister,
  expenses: Expense[],
  companyInfo?: CompanyInfo
) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('pt-BR');
  const storeName = companyInfo?.fantasyName || 'Hamburgueria Artesanal';

  // Sales calculations
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAGO' || o.total > 0);
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  // Channels
  const mesaOrders = paidOrders.filter((o) => o.type === 'mesa');
  const deliveryOrders = paidOrders.filter((o) => o.type === 'delivery');
  const balcaoOrders = paidOrders.filter((o) => o.type === 'balcao');

  const mesaRevenue = mesaOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveryRevenue = deliveryOrders.reduce((sum, o) => sum + o.total, 0);
  const balcaoRevenue = balcaoOrders.reduce((sum, o) => sum + o.total, 0);

  // Payment methods
  const pixTotal = paidOrders.filter((o) => o.paymentMethod === 'PIX').reduce((sum, o) => sum + o.total, 0);
  const creditTotal = paidOrders.filter((o) => o.paymentMethod === 'CREDITO').reduce((sum, o) => sum + o.total, 0);
  const debitTotal = paidOrders.filter((o) => o.paymentMethod === 'DEBITO').reduce((sum, o) => sum + o.total, 0);
  const cashTotal = paidOrders.filter((o) => o.paymentMethod === 'DINHEIRO').reduce((sum, o) => sum + o.total, 0);
  const fiadoTotal = paidOrders.filter((o) => o.paymentMethod === 'FIADO').reduce((sum, o) => sum + o.total, 0);

  // Cash Register transactions
  const sangrias = cashRegister.transactions
    .filter((t) => t.type === 'SANGRIA')
    .reduce((sum, t) => sum + t.amount, 0);
  const suprimentos = cashRegister.transactions
    .filter((t) => t.type === 'SUPRIMENTO')
    .reduce((sum, t) => sum + t.amount, 0);
  const cashSalesTransactions = cashRegister.transactions
    .filter((t) => t.type === 'VENDA' && (t.paymentMethod === 'DINHEIRO' || !t.paymentMethod))
    .reduce((sum, t) => sum + t.amount, 0);

  const initialBalance = cashRegister.initialBalance || 0;
  const currentCashInDrawer = initialBalance + cashSalesTransactions + suprimentos - sangrias;

  // Expenses
  const paidExpenses = expenses.filter((e) => e.status === 'PAGO').reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDENTE').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = paidExpenses + pendingExpenses;

  // Net Profit
  const netProfit = totalRevenue - paidExpenses;

  const lines: string[] = [];

  // 1. Header
  lines.push(`RELATORIO DE FECHAMENTO DIARIO E CAIXA;${storeName}`);
  lines.push(`CNPJ;${companyInfo?.cnpj || 'N/A'}`);
  lines.push(`Data de Emissao;${now.toLocaleDateString('pt-BR')} ${timeStr}`);
  lines.push(`Status do Caixa;${cashRegister.isOpen ? 'ABERTO' : 'FECHADO'}`);
  lines.push('');

  // 2. Resumo Executivo
  lines.push('--- RESUMO FINANCEIRO GERAL ---;');
  lines.push(`Indicador;Valor (R$);Observacao`);
  lines.push(`Faturamento Bruto Total;${fmtMoney(totalRevenue)};Total vendido em todos os canais`);
  lines.push(`Total de Despesas Pagas;${fmtMoney(paidExpenses)};Contas liquidadas no periodo`);
  lines.push(`Lucro Liquido Operacional;${fmtMoney(netProfit)};Faturamento menos despesas pagas`);
  lines.push(`Despesas a Pagar (Pendentes);${fmtMoney(pendingExpenses)};Compromissos em aberto`);
  lines.push(`Total Geral de Pedidos;${paidOrders.length};Comandas, delivery e balcao`);
  lines.push(`Ticket Medio Geral;${fmtMoney(paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0)};Media por pedido`);
  lines.push('');

  // 3. Faturamento por Canal
  lines.push('--- FATURAMENTO POR CANAL DE VENDA ---;');
  lines.push('Canal de Venda;Qtd Pedidos;Faturamento (R$);Participacao (%)');
  const pct = (val: number) => (totalRevenue > 0 ? ((val / totalRevenue) * 100).toFixed(1) + '%' : '0%');
  lines.push(`Salao (Mesas 01 a 30);${mesaOrders.length};${fmtMoney(mesaRevenue)};${pct(mesaRevenue)}`);
  lines.push(`Delivery Online (WhatsApp / Mari);${deliveryOrders.length};${fmtMoney(deliveryRevenue)};${pct(deliveryRevenue)}`);
  lines.push(`Balcao / PDV Direto;${balcaoOrders.length};${fmtMoney(balcaoRevenue)};${pct(balcaoRevenue)}`);
  lines.push(`TOTAL CONSOLIDADO;${paidOrders.length};${fmtMoney(totalRevenue)};100,0%`);
  lines.push('');

  // 4. Formas de Pagamento
  lines.push('--- FATURAMENTO POR FORMA DE PAGAMENTO ---;');
  lines.push('Forma de Pagamento;Total Recebido (R$);Participacao (%)');
  lines.push(`PIX Instantaneo;${fmtMoney(pixTotal)};${pct(pixTotal)}`);
  lines.push(`Cartao de Credito;${fmtMoney(creditTotal)};${pct(creditTotal)}`);
  lines.push(`Cartao de Debito;${fmtMoney(debitTotal)};${pct(debitTotal)}`);
  lines.push(`Dinheiro em Especie;${fmtMoney(cashTotal)};${pct(cashTotal)}`);
  lines.push(`Conta / Fiado;${fmtMoney(fiadoTotal)};${pct(fiadoTotal)}`);
  lines.push('');

  // 5. Movimentacao do Caixa Físico (Gaveta)
  lines.push('--- MOVIMENTACAO FISICA DO CAIXA (GAVETA) ---;');
  lines.push('Tipo de Movimento;Valor (R$)');
  lines.push(`Fundo de Caixa Inicial;${fmtMoney(initialBalance)}`);
  lines.push(`Vendas em Dinheiro Registradas;${fmtMoney(cashSalesTransactions)}`);
  lines.push(`Suprimentos (Entradas de Troco);${fmtMoney(suprimentos)}`);
  lines.push(`Sangrias (Retiradas do Caixa);${fmtMoney(sangrias)}`);
  lines.push(`SALDO ATUAL EM GAVETA;${fmtMoney(currentCashInDrawer)}`);
  lines.push('');

  // 6. Transações Detalhadas do Caixa
  lines.push('--- HISTORICO DE TRANSACOES DO CAIXA ---;');
  lines.push('Data/Hora;Tipo;Descricao;Forma de Pagamento;Valor (R$)');
  if (cashRegister.transactions.length === 0) {
    lines.push('Nenhuma transacao registrada no caixa hoje;;;;');
  } else {
    cashRegister.transactions.forEach((t) => {
      const tTime = t.timestamp ? new Date(t.timestamp).toLocaleTimeString('pt-BR') : '';
      lines.push(`${escapeCSV(tTime)};${escapeCSV(t.type)};${escapeCSV(t.description)};${escapeCSV(t.paymentMethod || 'DINHEIRO')};${fmtMoney(t.amount)}`);
    });
  }
  lines.push('');

  // 7. Despesas Registradas
  lines.push('--- CONTAS E DESPESAS DO ESTABELECIMENTO ---;');
  lines.push('Descricao;Categoria;Vencimento;Status;Valor (R$)');
  if (expenses.length === 0) {
    lines.push('Nenhuma despesa cadastrada;;;;');
  } else {
    expenses.forEach((e) => {
      lines.push(`${escapeCSV(e.description)};${escapeCSV(e.category)};${escapeCSV(e.dueDate)};${escapeCSV(e.status)};${fmtMoney(e.amount)}`);
    });
  }

  const csvContent = lines.join('\r\n');
  const filename = `Fechamento_Diario_${storeName.replace(/\s+/g, '_')}_${dateStr}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Generates and downloads the Complete Orders History (Histórico Completo de Pedidos)
 */
export const exportOrdersHistoryCSV = (orders: Order[], companyInfo?: CompanyInfo) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const storeName = companyInfo?.fantasyName || 'Hamburgueria Artesanal';

  const lines: string[] = [];

  // Header Info
  lines.push(`HISTORICO COMPLETO DE PEDIDOS;${storeName}`);
  lines.push(`Data de Exportacao;${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`);
  lines.push(`Total de Pedidos Exportados;${orders.length}`);
  lines.push('');

  // Columns
  const headers = [
    'ID Pedido',
    'Nro Comanda',
    'Data',
    'Horario',
    'Canal / Tipo',
    'Mesa / Identificador',
    'Nome Cliente',
    'Telefone',
    'Bairro Entrega',
    'Endereco Completo',
    'Qtd Itens',
    'Itens do Pedido (Descricao)',
    'Subtotal (R$)',
    'Taxa Entrega (R$)',
    'Desconto (R$)',
    'Total Pedido (R$)',
    'Forma Pagamento',
    'Status Pagamento',
    'Status Pedido',
    'Observacoes',
  ];
  lines.push(headers.join(';'));

  // Rows
  orders.forEach((o) => {
    const orderDateObj = o.createdAt ? new Date(o.createdAt) : now;
    const dateFormatted = orderDateObj.toLocaleDateString('pt-BR');
    const timeFormatted = orderDateObj.toLocaleTimeString('pt-BR');

    const channelLabel =
      o.type === 'mesa' ? 'Salao' : o.type === 'delivery' ? 'Delivery' : 'Balcao';

    const tableOrId =
      o.type === 'mesa' ? `Mesa ${o.tableNumber || 'N/A'}` : o.type === 'delivery' ? 'Entrega' : 'Balcao';

    const customerName = o.customer?.name || (o.type === 'mesa' ? `Cliente Mesa ${o.tableNumber}` : 'Balcao');
    const customerPhone = o.customer?.phone || '';
    const customerBairro = o.customer?.bairro || '';
    const fullAddress = o.customer
      ? `${o.customer.address}, ${o.customer.number}${o.customer.complement ? ' - ' + o.customer.complement : ''}`
      : '';

    const itemsSummary = o.items
      .map((item) => `${item.quantity}x ${item.name}${item.notes ? ' (' + item.notes + ')' : ''}`)
      .join(' | ');

    const totalItemsCount = o.items.reduce((sum, item) => sum + item.quantity, 0);

    const row = [
      escapeCSV(o.id),
      escapeCSV(o.displayNumber),
      escapeCSV(dateFormatted),
      escapeCSV(timeFormatted),
      escapeCSV(channelLabel),
      escapeCSV(tableOrId),
      escapeCSV(customerName),
      escapeCSV(customerPhone),
      escapeCSV(customerBairro),
      escapeCSV(fullAddress),
      escapeCSV(totalItemsCount),
      escapeCSV(itemsSummary),
      fmtMoney(o.subtotal),
      fmtMoney(o.deliveryFee),
      fmtMoney(o.discount),
      fmtMoney(o.total),
      escapeCSV(o.paymentMethod || 'PIX'),
      escapeCSV(o.paymentStatus),
      escapeCSV(o.status),
      escapeCSV(o.notes || ''),
    ];

    lines.push(row.join(';'));
  });

  const csvContent = lines.join('\r\n');
  const filename = `Historico_Pedidos_${storeName.replace(/\s+/g, '_')}_${dateStr}.csv`;
  downloadCSV(csvContent, filename);
};
