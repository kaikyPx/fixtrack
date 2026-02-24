
import { TicketStatus, Priority, AccessLevel } from './types';

export const STATUS_COLORS: Record<TicketStatus, string> = {
  [TicketStatus.RECEBIDO_EM_LOJA]: 'bg-slate-100 text-slate-700 border-slate-200',
  [TicketStatus.AGUARDANDO_ANALISE]: 'bg-amber-100 text-amber-700 border-amber-200',
  [TicketStatus.EM_ANALISE]: 'bg-blue-100 text-blue-700 border-blue-200',
  [TicketStatus.ENVIADO_PARA_TECNICO]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [TicketStatus.AGUARDANDO_PECA]: 'bg-orange-100 text-orange-700 border-orange-200',
  [TicketStatus.EM_REPARO]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  [TicketStatus.PRONTO]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [TicketStatus.AGUARDANDO_RETIRADA]: 'bg-purple-100 text-purple-700 border-purple-200',
  [TicketStatus.SAIU_PARA_ENTREGA]: 'bg-teal-100 text-teal-700 border-teal-200',
  [TicketStatus.ENTREGUE]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  [TicketStatus.TROCA_REALIZADA]: 'bg-rose-100 text-rose-700 border-rose-200',
  [TicketStatus.CANCELADO]: 'bg-slate-200 text-slate-800 border-slate-300',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.LOW]: 'text-blue-600',
  [Priority.MEDIUM]: 'text-amber-600',
  [Priority.HIGH]: 'text-rose-600',
};

export const DEVICE_TYPES = ['Celular', 'Notebook', 'Tablet', 'Console', 'Outro'];

export const PROBLEM_TYPES = ['Tela', 'Bateria', 'Software', 'Placa', 'Carcaça', 'Conector', 'Outros'];

export const ENTRY_METHODS = [
  'Cliente deixou na loja',
  'Motoboy buscou',
  'Outro'
];

export const PRIORITY_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' }
];

export const MOCK_USERS = [
  { id: 'u1', name: 'Admin Master', email: 'admin@fixtrack.com', accessLevel: AccessLevel.ADMIN },
  { id: 'u2', name: 'João Técnico', email: 'joao@fixtrack.com', accessLevel: AccessLevel.TECHNICIAN },
  { id: 'u3', name: 'Maria Gerente', email: 'maria@fixtrack.com', accessLevel: AccessLevel.MANAGER },
];
