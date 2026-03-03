import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    MapPin,
    Bike,
    CheckCircle2,
    XCircle,
    Plus,
    Search,
    Filter,
    MoreVertical,
    ChevronRight,
    ClipboardList
} from 'lucide-react';
import {
    Schedule,
    ScheduleType,
    ScheduleMethod,
    ScheduleStatus,
    Customer,
    Ticket,
    User as AppUser
} from '../types';
import { scheduleApi } from '../services/api';

interface ScheduleViewProps {
    customers: Customer[];
    tickets: Ticket[];
    currentUser: AppUser;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ customers, tickets, currentUser }) => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'All'>(ScheduleStatus.PENDING);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        ticketId: '',
        type: ScheduleType.ENTREGA_SUPORTE,
        method: ScheduleMethod.LOJA,
        date: '',
        time: '',
        observations: ''
    });

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const res = await scheduleApi.getAll();
            setSchedules(res.schedules);
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerId || !formData.date || !formData.time) return;

        const scheduledAt = new Date(`${formData.date}T${formData.time}`).getTime();
        const newSchedule = {
            id: `sch_${Date.now()}`,
            customerId: formData.customerId,
            ticketId: formData.ticketId || undefined,
            type: formData.type,
            method: formData.method,
            scheduledAt,
            observations: formData.observations,
        };

        try {
            await scheduleApi.create(newSchedule);
            loadSchedules();
            setShowAddModal(false);
            setFormData({
                customerId: '',
                ticketId: '',
                type: ScheduleType.ENTREGA_SUPORTE,
                method: ScheduleMethod.LOJA,
                date: '',
                time: '',
                observations: ''
            });
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: ScheduleStatus) => {
        const schedule = schedules.find(s => s.id === id);
        if (!schedule) return;

        try {
            await scheduleApi.update(id, { ...schedule, status: newStatus });
            setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const deleteSchedule = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
        try {
            await scheduleApi.delete(id);
            setSchedules(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error);
        }
    };

    const filteredSchedules = schedules.filter(s => {
        const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
        const matchesSearch = s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.observations?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: ScheduleStatus) => {
        switch (status) {
            case ScheduleStatus.PENDING: return 'bg-amber-50 text-amber-600 border-amber-100';
            case ScheduleStatus.COMPLETED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case ScheduleStatus.CANCELLED: return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="space-y-6 animate-view-enter-active">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Agendamentos</h1>
                    <p className="text-slate-500 text-sm">Gerencie as visitas e entregas agendadas</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    <span>Novo Agendamento</span>
                </button>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou observação..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {(['All', ...Object.values(ScheduleStatus)] as any[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${filterStatus === status
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {status === 'All' ? 'Todos' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Schedules List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                        <p>Carregando agendamentos...</p>
                    </div>
                ) : filteredSchedules.length === 0 ? (
                    <div className="bg-white p-20 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 text-center">
                        <Calendar size={48} className="text-slate-200 mb-4" />
                        <p className="font-medium text-lg">Nenhum agendamento encontrado</p>
                        <p className="text-sm">Clique em "Novo Agendamento" para começar.</p>
                    </div>
                ) : (
                    filteredSchedules.map(schedule => (
                        <div key={schedule.id} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all group">
                            <div className="flex flex-col md:flex-row gap-4 items-start">
                                {/* Date/Time Badge */}
                                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-3 min-w-[100px] border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase">
                                        {schedule.scheduledAt ? new Date(schedule.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'short' }) : '-'}
                                    </span>
                                    <span className="text-2xl font-black text-slate-800">
                                        {schedule.scheduledAt ? new Date(schedule.scheduledAt).getDate() : '-'}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {schedule.scheduledAt ? new Date(schedule.scheduledAt).toLocaleDateString('pt-BR', { month: 'short' }) : '-'}
                                    </span>
                                    <div className="mt-2 flex items-center text-blue-600 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                        <Clock size={12} className="mr-1" />
                                        {schedule.scheduledAt ? new Date(schedule.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${getStatusColor(schedule.status)}`}>
                                            {schedule.status}
                                        </span>
                                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center">
                                            <ClipboardList size={10} className="mr-1" />
                                            {schedule.type}
                                        </span>
                                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center">
                                            {schedule.method === ScheduleMethod.MOTOBOY ? <Bike size={10} className="mr-1" /> : <MapPin size={10} className="mr-1" />}
                                            {schedule.method}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                            <User size={18} className="text-slate-400 mr-2" />
                                            {schedule.customerName}
                                        </h3>
                                        {schedule.observations && (
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2 italic">
                                                "{schedule.observations}"
                                            </p>
                                        )}
                                    </div>

                                    {schedule.ticketId && (
                                        <div className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                            <ClipboardList size={12} className="mr-1" />
                                            Ticket vinculado: #{schedule.ticketId.slice(-6)}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex md:flex-col gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                    {schedule.status === ScheduleStatus.PENDING && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(schedule.id, ScheduleStatus.COMPLETED)}
                                                className="flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors font-semibold text-sm"
                                            >
                                                <CheckCircle2 size={18} />
                                                <span>Concluir</span>
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(schedule.id, ScheduleStatus.CANCELLED)}
                                                className="flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold text-sm"
                                            >
                                                <XCircle size={18} />
                                                <span>Cancelar</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => deleteSchedule(schedule.id)}
                                        className="flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-2 px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold text-sm"
                                    >
                                        <XCircle size={18} />
                                        <span>Excluir</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-start md:items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="bg-white w-full max-w-lg max-h-none md:max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden animate-view-enter-active flex flex-col my-auto">
                        <div className="p-4 sm:p-6 border-b flex items-center justify-between shrink-0">
                            <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center">
                                <Calendar className="mr-2 text-blue-600" />
                                Agendar Novo Evento
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddSchedule} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Cliente *</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                                        value={formData.customerId}
                                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione um cliente</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Tipo de Agendamento</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleType })}
                                    >
                                        {Object.values(ScheduleType).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Forma de Retirada/Entrega</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {Object.values(ScheduleMethod).map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, method: m })}
                                                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all font-bold ${formData.method === m
                                                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                    }`}
                                            >
                                                {m === ScheduleMethod.MOTOBOY ? <Bike size={18} className="mr-2" /> : <MapPin size={18} className="mr-2" />}
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Data *</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Hora *</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Ticket Relacionado (Opcional)</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                                        value={formData.ticketId}
                                        onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                                    >
                                        <option value="">Nenhum ticket</option>
                                        {tickets
                                            .filter(t => t.customerId === formData.customerId)
                                            .map(t => (
                                                <option key={t.id} value={t.id}>#{t.id.slice(-6)} - {t.problemType}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Observações</label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 resize-none"
                                        placeholder="Adicione detalhes extras..."
                                        value={formData.observations}
                                        onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                                >
                                    Confirmar Agendamento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleView;
