
export enum AccessLevel {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TECHNICIAN = 'TECHNICIAN'
}

export enum PhoneType {
  CLIENTE = 'CLIENTE',
  FAMILIAR = 'FAMILIAR',
  OUTRO = 'OUTRO'
}

export enum TicketStatus {
  RECEBIDO_EM_LOJA = 'Recebido em loja',
  AGUARDANDO_ANALISE = 'Aguardando análise',
  EM_ANALISE = 'Em análise',
  ENVIADO_PARA_TECNICO = 'Enviado para técnico',
  AGUARDANDO_PECA = 'Aguardando peça (São Paulo)',
  EM_REPARO = 'Em reparo',
  PRONTO = 'Pronto',
  AGUARDANDO_RETIRADA = 'Aguardando cliente retirar em loja',
  SAIU_PARA_ENTREGA = 'Saiu para entrega (motoboy)',
  ENTREGUE = 'Entregue ao cliente',
  TROCA_REALIZADA = 'Troca realizada',
  CANCELADO = 'Cancelado/sem solução'
}

export enum ScheduleType {
  ENTREGA_SUPORTE = 'Para dar entrada no suporte',
  PROBLEMA_RESOLVIDO = 'Problema resolvido',
  RETORNO = 'Retorno'
}

export enum ScheduleMethod {
  LOJA = 'Retirada em loja',
  MOTOBOY = 'Motoboy'
}

export enum ScheduleStatus {
  PENDING = 'Pendente',
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado'
}

export interface Schedule {
  id: string;
  customerId: string;
  ticketId?: string;
  type: ScheduleType;
  method: ScheduleMethod;
  scheduledAt: number;
  status: ScheduleStatus;
  observations?: string;
  customerName?: string; // Para exibição facilitada
}

export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta'
}

export interface User {
  id: string;
  name: string;
  email: string;
  accessLevel: AccessLevel;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  phoneType: PhoneType;
  contactName?: string;
  phoneSecondary?: string;
  phoneSecondaryType?: PhoneType;
  cpf?: string;
  zipCode?: string;
  email: string;
  contactObservations?: string;
  observations?: string;
  createdAt: number;
}

export interface Device {
  id: string;
  customerId?: string;
  type: string; // Smartphone, Notebook, etc.
  brand: string;
  model: string;
  imeiOrSerial: string;
  color: string;
  storage: string; // Armazenamento (ex: 128GB)
  serialNumber?: string; // Número de série opcional
  screenPassword?: string; // Senha de tela
  batteryHealth?: string; // Saúde da bateria
  isReturn?: boolean; // Retorno de garantia/suporte?
  conditionOnArrival?: { // Condição na chegada
    screenOk?: boolean; // Tela ok?
    caseOk?: boolean; // Carcaça ok?
    cameraOk?: boolean; // Câmera ok?
    impactSigns?: boolean; // Sinais de impacto?
    liquidDamageSigns?: boolean; // Sinais de oxidação/contato com líquido?
  };
  supportEntryData?: { // Dados da Entrada no Suporte
    entryDate: number; // Data de entrada no suporte (timestamp)
    entryMethod: 'loja' | 'motoboy' | 'outro'; // Forma de entrada
    receivedBy: string; // Quem recebeu (colaborador responsável)
    priority: 'baixa' | 'media' | 'alta'; // Prioridade
    estimatedDeadline?: number; // Prazo previsto (timestamp)
  };
  loanerDevice?: { // Aparelho Reserva
    hasLoaner: boolean; // Aparelho reserva? (Sim/Não)
    model?: string; // Modelo do reserva
    imei?: string; // IMEI do reserva
    deliveryDate?: number; // Data de entrega do reserva (timestamp)
    liabilityTerm?: boolean; // Termo de responsabilidade do reserva (gerar/assinar)
  };
  mediaFiles?: { // Uploads e Anexos
    entryVideo?: string; // Vídeo de entrada (como chegou na loja)
    exitVideo?: string; // Vídeo de saída (como está indo embora após resolver)
    deviceDocumentation?: string[]; // Documentação do aparelho (upload múltiplo)
    additionalDocuments?: string[]; // Nota/recibo, laudo 3uTools, fotos, prints, conversa, comprovantes etc.
  };
  accessories: string;
  observations?: string;
  // Dados da Compra e Garantias
  purchaseDate?: number; // timestamp
  warrantyPeriodMonths?: number; // prazo de garantia da venda em meses
  warrantyEndDate?: number; // data final da garantia da venda (auto-calculada)
  supplierId?: string; // ID do fornecedor
  supplierName?: string; // nome do fornecedor (para exibição)
  stockEntryDate?: number; // data de entrada no estoque
  supplierWarrantyMonths?: number; // prazo de garantia do fornecedor em meses
  supplierWarrantyEndDate?: number; // data final da garantia do fornecedor (auto-calculada)
}

export interface TimelineEntry {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  timestamp: number;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  timestamp: number;
}

export interface Ticket {
  id: string;
  customerId?: string;
  deviceId: string;
  problemType: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  technicianId: string;
  createdAt: number;
  deadline?: number;
  updatedAt: number;
  attachments: Attachment[];
  // Campos de Encerramento (Closing Fields)
  resolvedAt?: number;
  returnMethod?: 'Retirada em loja' | 'Motoboy entregou';
  resolutionResult?: 'Reparado' | 'Trocado' | 'Sem defeito constatado' | 'Negado garantia' | 'Outro';
  repairWarrantyDays?: number;
  finalObservations?: string;
  deliveryConfirmed?: boolean;
  signatureUrl?: string;
  // Novos campos para Termos Detalhados
  swapDeviceInfo?: {
    model: string;
    color: string;
    storage: string;
    imei: string;
    date: number;
  };
  warrantyDenialInfo?: {
    reasons: string[];
    cost: number;
    paymentMethod: string;
  };
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum TransactionCategory {
  REPARO = 'REPARO',
  PECA = 'PECA',
  UBER = 'UBER',
  TAXA_ENTREGA = 'TAXA_ENTREGA',
  OUTRO = 'OUTRO'
}

export enum TransactionStatus {
  PAGO = 'PAGO',
  PENDENTE = 'PENDENTE'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
  date: number; // timestamp
  customerId?: string;
  ticketId?: string;
  status: TransactionStatus;
  createdAt: number;
  userId?: string;
  userName?: string;
}

export interface FinancialLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'DELETE';
  details: string;
  createdAt: number;
}

export type ViewType = 'dashboard' | 'tickets' | 'customers' | 'ticket-detail' | 'settings' | 'reports' | 'schedules' | 'financial';
