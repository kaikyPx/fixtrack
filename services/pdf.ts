import jsPDF from 'jspdf';
import { Ticket, Customer, Device, User } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateBR(timestamp?: number): string {
  if (!timestamp) return '___/___/______';
  return new Date(timestamp).toLocaleDateString('pt-BR');
}

function formatCPF(cpf?: string): string {
  if (!cpf) return 'Não informado';
  const d = cpf.replace(/\D/g, '');
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : cpf;
}

function buildStoreHeader(doc: jsPDF, title: string, ticket: Ticket, customer: Customer, device: Device) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  // Header - MUNDO PHONE LTDA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('MUNDO PHONE LTDA', margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text('CNPJ: 52.254.154/0001-03', margin, y);
  y += 5;
  doc.text('Endereço: ________________________________________________', margin, y);
  y += 5;
  doc.text('Telefone: ________________________________________________', margin, y);

  // Title
  y += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 10;
  return { doc, y, margin, pageWidth };
}

function buildSectionTitle(doc: jsPDF, title: string, y: number, margin: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, margin, y);
  return y + 6;
}

function buildStandardSignatureBlock(doc: jsPDF, y: number, margin: number, pageWidth: number, clientLabel = 'Assinatura do Cliente', companyLabel = 'Assinatura do Responsável da Loja') {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 30;
  } else {
    y += 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Local e Data: ___________________________________________________________', margin, y);

  y += 20;
  const lineLength = 80;
  // Cliente
  doc.line(margin, y, margin + lineLength, y);
  doc.text(clientLabel, margin, y + 5);

  // Loja
  doc.line(pageWidth - margin - lineLength, y, pageWidth - margin, y);
  doc.text(companyLabel, pageWidth - margin - lineLength, y + 5);

  return y + 15;
}

// ─── 1) TERMO DE TROCA ────────────────────────────────────────────────────────
export function generateSwapTermPDF(ticket: Ticket, customer: Customer, device: Device, technician: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'TERMO DE TROCA', ticket, customer, device);

  // 1. Dados do Cliente
  y = buildSectionTitle(doc, '1. DADOS DO CLIENTE', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome Completo: ${customer.name}`, margin, y); y += 6;
  doc.text(`CPF: ${formatCPF(customer.cpf)}`, margin, y); y += 6;
  doc.text(`Telefone: ${customer.phone}`, margin, y); y += 10;

  // 2. Dados do Aparelho Adquirido
  y = buildSectionTitle(doc, '2. DADOS DO APARELHO ADQUIRIDO', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Modelo: ${device.brand} ${device.model}`, margin, y); y += 6;
  doc.text(`Cor: ${device.color || '---'}`, margin, y); y += 6;
  doc.text(`Capacidade: ${device.storage || '---'}`, margin, y); y += 6;
  doc.text(`IMEI: ${device.imeiOrSerial || '---'}`, margin, y); y += 6;
  doc.text(`Data da compra: ${formatDateBR(device.purchaseDate)}`, margin, y); y += 10;

  // 3. Entrada em Suporte
  y = buildSectionTitle(doc, '3. ENTRADA EM SUPORTE', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de entrada: ${formatDateBR(device.supportEntryData?.entryDate)}`, margin, y); y += 6;
  doc.text('Descrição do problema:', margin, y); y += 5;
  const probSplit = doc.splitTextToSize(ticket.description, pageWidth - margin * 2);
  doc.text(probSplit, margin, y);
  y += (probSplit.length * 5) + 8;

  // 4. Troca Realizada
  y = buildSectionTitle(doc, '4. TROCA REALIZADA', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text('Declaramos que o aparelho acima apresentou problema após análise técnica e a loja optou pela troca do produto.', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 12;

  // 5. Dados do Aparelho Entregue na Troca
  y = buildSectionTitle(doc, '5. DADOS DO APARELHO ENTREGUE NA TROCA', y, margin);
  doc.setFont('helvetica', 'normal');
  const swap = ticket.swapDeviceInfo;
  doc.text(`Modelo: ${swap?.model || '____________________'}`, margin, y); y += 6;
  doc.text(`Cor: ${swap?.color || '____________________'}`, margin, y); y += 6;
  doc.text(`Capacidade: ${swap?.storage || '____________________'}`, margin, y); y += 6;
  doc.text(`IMEI: ${swap?.imei || '____________________'}`, margin, y); y += 6;
  doc.text(`Data da troca: ${formatDateBR(swap?.date || Date.now())}`, margin, y); y += 10;

  doc.text('Declaro ter recebido o aparelho em perfeitas condições de funcionamento e estética.', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 5;

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`Termo_Troca_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

// ─── 2) TERMO DE DEVOLUÇÃO – SERVIÇO CONCLUÍDO ────────────────────────────────
export function generateClientDeliveryTermPDF(ticket: Ticket, customer: Customer, device: Device, technician: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'TERMO DE DEVOLUÇÃO – SERVIÇO CONCLUÍDO', ticket, customer, device);

  // 1. Dados do Cliente
  y = buildSectionTitle(doc, '1. DADOS DO CLIENTE', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome Completo: ${customer.name}`, margin, y); y += 6;
  doc.text(`CPF: ${formatCPF(customer.cpf)}`, margin, y); y += 6;
  doc.text(`Telefone: ${customer.phone}`, margin, y); y += 10;

  // 2. Dados do Aparelho
  y = buildSectionTitle(doc, '2. DADOS DO APARELHO', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Modelo: ${device.brand} ${device.model}`, margin, y); y += 6;
  doc.text(`Cor: ${device.color || '---'}`, margin, y); y += 6;
  doc.text(`Capacidade: ${device.storage || '---'}`, margin, y); y += 6;
  doc.text(`IMEI: ${device.imeiOrSerial || '---'}`, margin, y); y += 6;
  doc.text(`Data da compra: ${formatDateBR(device.purchaseDate)}`, margin, y); y += 6;
  doc.text(`Data de entrada no suporte: ${formatDateBR(ticket.createdAt)}`, margin, y); y += 10;

  // 3. Problema Relatado
  y = buildSectionTitle(doc, '3. PROBLEMA RELATADO', y, margin);
  const probSplit = doc.splitTextToSize(ticket.description, pageWidth - margin * 2);
  doc.setFont('helvetica', 'normal');
  doc.text(probSplit, margin, y);
  y += (probSplit.length * 5) + 10;

  // 4. Solução Realizada
  y = buildSectionTitle(doc, '4. SOLUÇÃO REALIZADA', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text('Informamos que o problema foi devidamente identificado, o reparo foi realizado, o aparelho foi testado e está em pleno funcionamento para uso.', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 15;

  // 5. Devolução do Aparelho
  y = buildSectionTitle(doc, '5. DEVOLUÇÃO DO APARELHO', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text('Declaro ter conferido e recebido meu aparelho reparado e funcionando nesta data, não havendo pendências com a loja.', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 12;
  doc.text(`Data da retirada: ${formatDateBR(Date.now())}`, margin, y); y += 10;

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`Termo_Devolucao_Concluido_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

// ─── 3) TERMO DE DEVOLUÇÃO – ENTREGA VIA MOTOBOY ─────────────────────────────
export function generateMotoboyDeliveryTermPDF(ticket: Ticket, customer: Customer, device: Device, technician: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'TERMO DE DEVOLUÇÃO – ENTREGA VIA MOTOBOY', ticket, customer, device);

  // 1. Dados do Cliente
  y = buildSectionTitle(doc, '1. DADOS DO CLIENTE', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome Completo: ${customer.name}`, margin, y); y += 6;
  doc.text(`CPF: ${formatCPF(customer.cpf)}`, margin, y); y += 6;
  doc.text(`Telefone: ${customer.phone}`, margin, y); y += 10;

  // 2. Dados do Aparelho
  y = buildSectionTitle(doc, '2. DADOS DO APARELHO', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Modelo: ${device.brand} ${device.model}`, margin, y); y += 6;
  doc.text(`Cor: ${device.color || '---'}`, margin, y); y += 6;
  doc.text(`Capacidade: ${device.storage || '---'}`, margin, y); y += 6;
  doc.text(`IMEI: ${device.imeiOrSerial || '---'}`, margin, y); y += 6;
  doc.text(`Data de entrada no suporte: ${formatDateBR(ticket.createdAt)}`, margin, y); y += 10;

  // 3. Problema Relatado
  y = buildSectionTitle(doc, '3. PROBLEMA RELATADO', y, margin);
  const probSplit = doc.splitTextToSize(ticket.description, pageWidth - margin * 2);
  doc.setFont('helvetica', 'normal');
  doc.text(probSplit, margin, y);
  y += (probSplit.length * 5) + 10;

  // 4. Solução Realizada
  y = buildSectionTitle(doc, '4. SOLUÇÃO REALIZADA', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text('Declaramos que o problema foi identificado, o reparo foi efetuado, o aparelho foi testado e está funcionando perfeitamente.', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 15;

  // 5. Entrega via Motoboy
  y = buildSectionTitle(doc, '5. ENTREGA VIA MOTOBOY', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text('Declaro que o aparelho será entregue por motoboy autorizado no endereço abaixo:', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 10;
  doc.text(`Endereço de entrega: ________________________________________________`, margin, y); y += 6;
  doc.text(`Data da entrega: ${formatDateBR(Date.now())}`, margin, y); y += 6;
  doc.text(`Nome do motoboy: ________________________________________________`, margin, y); y += 10;

  doc.setFontSize(9);
  doc.text('Declaro o recebimento do aparelho em perfeitas condições e sem pendências.', margin, y, { maxWidth: pageWidth - margin * 2 }); y += 7;
  doc.text('Documento apresentado na entrega (RG/CPF): ___________________________', margin, y); y += 10;

  buildStandardSignatureBlock(doc, y, margin, pageWidth, 'Assinatura do Cliente / Recebedor', 'Assinatura do Motoboy');
  doc.save(`Termo_Motoboy_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

// ─── 4) TERMO DE CIÊNCIA E REPARO – GARANTIA NEGADA ──────────────────────────
export function generateWarrantyDeniedTermPDF(ticket: Ticket, customer: Customer, device: Device, technician: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'TERMO DE CIÊNCIA E REPARO – GARANTIA NEGADA', ticket, customer, device);

  // 1. Dados do Cliente
  y = buildSectionTitle(doc, '1. DADOS DO CLIENTE', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome Completo: ${customer.name}`, margin, y); y += 6;
  doc.text(`CPF: ${formatCPF(customer.cpf)}`, margin, y); y += 6;
  doc.text(`Telefone: ${customer.phone}`, margin, y); y += 10;

  // 2. Dados do Aparelho
  y = buildSectionTitle(doc, '2. DADOS DO APARELHO', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Modelo: ${device.brand} ${device.model}`, margin, y); y += 6;
  doc.text(`Cor: ${device.color || '---'}`, margin, y); y += 6;
  doc.text(`Capacidade: ${device.storage || '---'}`, margin, y); y += 6;
  doc.text(`IMEI: ${device.imeiOrSerial || '---'}`, margin, y); y += 10;

  // 3. Problema Relatado
  y = buildSectionTitle(doc, '3. PROBLEMA RELATADO PELO CLIENTE', y, margin);
  const probSplit = doc.splitTextToSize(ticket.description, pageWidth - margin * 2);
  doc.setFont('helvetica', 'normal');
  doc.text(probSplit, margin, y);
  y += (probSplit.length * 5) + 10;

  // 4. Resultado da Análise Técnica
  y = buildSectionTitle(doc, '4. RESULTADO DA ANÁLISE TÉCNICA', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text('Informamos que após análise técnica minuciosa, foi constatado que o defeito ocorreu por fator externo (mau uso, impacto, pressão excessiva, oxidação, violação ou outros agentes não relacionados à fabricação).', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('GARANTIA NEGADA PELO FABRICANTE / LOJA.', margin, y);
  y += 10;

  // 5. Posicionamento da Loja
  y = buildSectionTitle(doc, '5. POSICIONAMENTO DA LOJA', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text('Mesmo fora da garantia, a loja disponibilizou o serviço de reparo, sendo cobrado apenas o custo das peças e/ou mão de obra.', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 12;
  const denial = ticket.warrantyDenialInfo;
  doc.text(`Valor cobrado pelo reparo: R$ ${denial?.cost?.toFixed(2) || '______,___'}`, margin, y); y += 6;
  doc.text(`Forma de pagamento: ${denial?.paymentMethod || '____________________'}`, margin, y); y += 10;

  // 6. Declaração de Ciência
  y = buildSectionTitle(doc, '6. DECLARAÇÃO DE CIÊNCIA', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text('Declaro ter sido informado sobre a negativa de garantia, estar de acordo com o pagamento do custo de reparo e confirmo o recebimento do aparelho reparado e em pleno funcionamento.', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 15;

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`Termo_Garantia_Negada_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

// ─── OUTROS TERMOS ───────────────────────────────────────────────────────────

export function generateServiceOrderPDF(ticket: Ticket, customer: Customer, device: Device, technician: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'ORDEM DE SERVIÇO', ticket, customer, device);

  y = buildSectionTitle(doc, 'PROBLEMA RELATADO', y, margin);
  const probSplit = doc.splitTextToSize(ticket.description, pageWidth - margin * 2);
  doc.setFont('helvetica', 'normal');
  doc.text(probSplit, margin, y);
  y += (probSplit.length * 5) + 8;

  const deviceInfo = [
    { label: 'Tipo:', value: device.type },
    { label: 'Prioridade:', value: ticket.priority },
    { label: 'Técnico:', value: technician.name },
  ];

  for (const info of deviceInfo) {
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, margin + 25, y);
    y += 6;
  }

  y += 10;
  doc.setFontSize(9);
  doc.text('1. O prazo para retirada do aparelho é de 30 dias após a conclusão.', margin, y); y += 5;
  doc.text('2. Não nos responsabilizamos por dados armazenados no aparelho.', margin, y); y += 5;

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`OS_${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

export function generateRepairTermPDF(ticket: Ticket, customer: Customer, device: Device, technician: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'TERMO DE REPARO / AUTORIZAÇÃO', ticket, customer, device);

  doc.setFontSize(10);
  doc.text('Autorizo a realização dos serviços de reparo no equipamento acima.', margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 10;

  y = buildSectionTitle(doc, 'CONDIÇÕES', y, margin);
  const terms = [
    '1. O orçamento aprovado é necessário antes do início.',
    '2. Caso não aprovado, poderá ser cobrada taxa de diagnóstico.',
    '3. Garantia de 90 dias após a retirada.',
  ];
  for (const term of terms) {
    doc.setFont('helvetica', 'normal');
    doc.text(term, margin, y);
    y += 5;
  }

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`Termo_Reparo_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

export function generateStoreReceiptTermPDF(ticket: Ticket, customer: Customer, device: Device, technician: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'TERMO DE RECEBIMENTO EM LOJA', ticket, customer, device);

  y = buildSectionTitle(doc, 'CONDIÇÕES DE CHEGADA', y, margin);
  const conditions = [
    { label: 'Tela:', val: device.conditionOnArrival?.screenOk ? 'OK' : 'Defeito' },
    { label: 'Carcaça:', val: device.conditionOnArrival?.caseOk ? 'OK' : 'Avaria' },
    { label: 'Câmera:', val: device.conditionOnArrival?.cameraOk ? 'OK' : 'Defeito' },
  ];
  for (const c of conditions) {
    doc.setFont('helvetica', 'normal');
    doc.text(`${c.label} ${c.val}`, margin, y);
    y += 5;
  }

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`Termo_Recebimento_Loja_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

export function generateLoanerDeviceTermPDF(ticket: Ticket, customer: Customer, device: Device, technician: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'TERMO DE APARELHO RESERVA', ticket, customer, device);

  const loaner = device.loanerDevice;
  y = buildSectionTitle(doc, 'DADOS DO APARELHO RESERVA', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Modelo: ${loaner?.model || '---'}`, margin, y); y += 6;
  doc.text(`IMEI: ${loaner?.imei || '---'}`, margin, y); y += 6;

  y += 6;
  doc.text('1. Comprometo-me a devolver o aparelho ao retirar meu equipamento.', margin, y); y += 5;
  doc.text('2. Zelarei pelo aparelho reserva, respondendo por danos.', margin, y); y += 5;

  buildStandardSignatureBlock(doc, y, margin, pageWidth, 'Assinatura do Cliente (responsável)');
  doc.save(`Termo_Reserva_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

export function generateTechnicalSupportReceiptTermPDF(ticket: Ticket, customer: Customer, device: Device, currentUser: User) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'TERMO DE RECEBIMENTO PARA SUPORTE TÉCNICO', ticket, customer, device);

  y = buildSectionTitle(doc, 'DADOS TÉCNICOS', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Senha da tela informada: ${device.screenPassword ? 'SIM' : 'NÃO'}`, margin, y); y += 6;
  doc.text(`Data da entrada: ${formatDateBR(Date.now())}`, margin, y); y += 10;

  y = buildSectionTitle(doc, 'DECLARAÇÃO', y, margin);
  doc.setFontSize(9);
  doc.text('Declaro que estou entregando o aparelho para análise técnica e possível reparo.', margin, y, { maxWidth: pageWidth - margin * 2 }); y += 8;
  doc.text('• O sistema não se responsabiliza por dados não salvos.', margin, y); y += 5;

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`Termo_Recebimento_Tecnico_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

export function generateAwarenessTermPDF(ticket: Ticket, customer: Customer, device: Device, narrative: string, includeRepair: boolean) {
  const doc = new jsPDF();
  const title = includeRepair ? 'TERMO DE CIÊNCIA E REPARO' : 'TERMO DE CIÊNCIA';
  let { y, margin, pageWidth } = buildStoreHeader(doc, title, ticket, customer, device);

  const lines = doc.splitTextToSize(narrative, pageWidth - margin * 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(lines, margin, y);
  y += (lines.length * 6) + 20;

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`Termo_Ciência_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}

export function generateOccurrenceSummaryPDF(ticket: Ticket, customer: Customer, device: Device, timeline: TimelineEntry[]) {
  const doc = new jsPDF();
  let { y, margin, pageWidth } = buildStoreHeader(doc, 'RESUMO DA OCORRÊNCIA', ticket, customer, device);

  // 1. Dados do Cliente
  y = buildSectionTitle(doc, '1. DADOS DO CLIENTE', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome Completo: ${customer.name}`, margin, y); y += 6;
  doc.text(`CPF: ${formatCPF(customer.cpf)}`, margin, y); y += 6;
  doc.text(`Telefone: ${customer.phone}`, margin, y); y += 10;

  // 2. Dados do Aparelho
  y = buildSectionTitle(doc, '2. DADOS DO APARELHO', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Modelo: ${device.brand} ${device.model}`, margin, y); y += 6;
  doc.text(`Cor: ${device.color || '---'}`, margin, y); y += 6;
  doc.text(`Capacidade: ${device.storage || '---'}`, margin, y); y += 6;
  doc.text(`IMEI/Serial: ${device.imeiOrSerial || '---'}`, margin, y); y += 10;

  // 3. Informações da Ordem de Serviço
  y = buildSectionTitle(doc, '3. INFORMAÇÕES DA O.S.', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status Atual: ${ticket.status}`, margin, y); y += 6;
  doc.text(`Prioridade: ${ticket.priority}`, margin, y); y += 6;
  doc.text(`Data de Abertura: ${formatDateBR(ticket.createdAt)}`, margin, y); y += 6;
  if (ticket.resolvedAt) {
    doc.text(`Data de Resolução: ${formatDateBR(ticket.resolvedAt)}`, margin, y); y += 6;
  }
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Descrição Inicial:', margin, y); y += 5;
  doc.setFont('helvetica', 'normal');
  const descSplit = doc.splitTextToSize(ticket.description, pageWidth - margin * 2);
  doc.text(descSplit, margin, y);
  y += (descSplit.length * 5) + 10;

  // 4. Histórico de Movimentações (Timeline)
  y = buildSectionTitle(doc, '4. HISTÓRICO DE MOVIMENTAÇÕES', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (timeline.length === 0) {
    doc.text('Nenhuma movimentação registrada.', margin, y);
    y += 10;
  } else {
    // Sort timeline by timestamp ascending for the PDF summary
    const sortedTimeline = [...timeline].sort((a, b) => a.timestamp - b.timestamp);

    for (const entry of sortedTimeline) {
      // Check for page break
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 30;
      }

      doc.setFont('helvetica', 'bold');
      const dateStr = formatDateBR(entry.timestamp);
      doc.text(`${dateStr} - ${entry.action}`, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Por: ${entry.userName}`, margin + 5, y + 5);
      doc.setTextColor(0, 0, 0);

      const entryContent = entry.description || '(Sem descrição)';
      const contentSplit = doc.splitTextToSize(entryContent, pageWidth - margin * 2 - 10);
      doc.text(contentSplit, margin + 5, y + 10);

      y += (contentSplit.length * 5) + 15;
    }
  }

  // 5. Conclusão (se houver)
  if (ticket.resolvedAt || ticket.finalObservations) {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 30;
    }
    y = buildSectionTitle(doc, '5. CONCLUSÃO / OBSERVAÇÕES FINAIS', y, margin);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (ticket.resolutionResult) {
      doc.text(`Resultado: ${ticket.resolutionResult}`, margin, y); y += 6;
    }
    if (ticket.returnMethod) {
      doc.text(`Forma de Devolução: ${ticket.returnMethod}`, margin, y); y += 6;
    }
    if (ticket.finalObservations) {
      const finalSplit = doc.splitTextToSize(ticket.finalObservations, pageWidth - margin * 2);
      doc.text(finalSplit, margin, y);
      y += (finalSplit.length * 5) + 6;
    }
    y += 5;
  }

  buildStandardSignatureBlock(doc, y, margin, pageWidth);
  doc.save(`Resumo_Ocorrencia_OS${ticket.id.slice(0, 8).toUpperCase()}.pdf`);
}
