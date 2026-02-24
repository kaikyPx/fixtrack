
import React from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  PlayCircle,
  Calendar,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Ticket, TicketStatus } from '../types';
import { getTicketAgeDays, getAgeColorClass, getAgeBgClass } from '../utils';

interface DashboardProps {
  tickets: Ticket[];
  onViewTicket: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tickets, onViewTicket }) => {
  const stats = {
    pending: tickets.filter(t => [
      TicketStatus.RECEBIDO_EM_LOJA,
      TicketStatus.AGUARDANDO_ANALISE,
      TicketStatus.AGUARDANDO_PECA
    ].includes(t.status)).length,
    inProgress: tickets.filter(t => [
      TicketStatus.EM_ANALISE,
      TicketStatus.ENVIADO_PARA_TECNICO,
      TicketStatus.EM_REPARO
    ].includes(t.status)).length,
    resolved: tickets.filter(t => [
      TicketStatus.PRONTO,
      TicketStatus.AGUARDANDO_RETIRADA,
      TicketStatus.SAIU_PARA_ENTREGA,
      TicketStatus.ENTREGUE,
      TicketStatus.TROCA_REALIZADA
    ].includes(t.status)).length,
    overdue: tickets.filter(t =>
      ![
        TicketStatus.PRONTO,
        TicketStatus.AGUARDANDO_RETIRADA,
        TicketStatus.SAIU_PARA_ENTREGA,
        TicketStatus.ENTREGUE,
        TicketStatus.TROCA_REALIZADA,
        TicketStatus.CANCELADO
      ].includes(t.status) && getTicketAgeDays(t.createdAt) >= 15
    ).length,
    today: tickets.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length,
    month: tickets.filter(t => new Date(t.createdAt).getMonth() === new Date().getMonth()).length,
  };

  const criticalTickets = tickets
    .filter(t => ![
      TicketStatus.PRONTO,
      TicketStatus.AGUARDANDO_RETIRADA,
      TicketStatus.SAIU_PARA_ENTREGA,
      TicketStatus.ENTREGUE,
      TicketStatus.TROCA_REALIZADA,
      TicketStatus.CANCELADO
    ].includes(t.status))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className={`p-4 rounded-2xl border transition-all hover:shadow-md ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color} bg-white shadow-sm`}>
          <Icon size={20} />
        </div>
        <span className="text-2xl font-bold text-slate-800">{value}</span>
      </div>
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-view-enter-active">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Bem-vindo ao FixTrack</h1>
        <p className="text-slate-500 text-sm">Visão geral da assistência hoje</p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          label="Pendências Abertas"
          value={stats.pending}
          icon={AlertCircle}
          color="text-rose-600"
          bg="bg-rose-50 border-rose-100"
        />
        <StatCard
          label="Em Andamento"
          value={stats.inProgress}
          icon={PlayCircle}
          color="text-blue-600"
          bg="bg-blue-50 border-blue-100"
        />
        <StatCard
          label="Resolvidos"
          value={stats.resolved}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50 border-emerald-100"
        />
        <StatCard
          label="Atrasados (15d+)"
          value={stats.overdue}
          icon={Clock}
          color="text-amber-600"
          bg="bg-amber-50 border-amber-100"
        />
        <StatCard
          label="Entradas de Hoje"
          value={stats.today}
          icon={Calendar}
          color="text-indigo-600"
          bg="bg-indigo-50 border-indigo-100"
        />
        <StatCard
          label="Total do Mês"
          value={stats.month}
          icon={BarChart3}
          color="text-slate-600"
          bg="bg-white border-slate-200"
        />
      </div>

      {/* Critical List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Atividades Recentes</h3>
          <button className="text-blue-600 text-sm font-semibold">Ver todas</button>
        </div>
        <div className="divide-y divide-slate-100">
          {criticalTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhuma ocorrência registrada.</div>
          ) : (
            criticalTickets.map(ticket => {
              const days = getTicketAgeDays(ticket.createdAt);
              return (
                <button
                  key={ticket.id}
                  onClick={() => onViewTicket(ticket.id)}
                  className="w-full flex items-center p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0 ${getAgeBgClass(days)}`}>
                    <span className={`font-bold ${getAgeColorClass(days)}`}>{days}d</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{ticket.problemType}</p>
                    <p className="text-xs text-slate-500 truncate">{ticket.description}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase mb-1 border ${[
                        TicketStatus.PRONTO,
                        TicketStatus.AGUARDANDO_RETIRADA,
                        TicketStatus.SAIU_PARA_ENTREGA,
                        TicketStatus.ENTREGUE,
                        TicketStatus.TROCA_REALIZADA
                      ].includes(ticket.status) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                      {ticket.status}
                    </span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
