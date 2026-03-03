import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Filter,
    Plus,
    Trash2,
    Calendar,
    ShoppingBag,
    Truck,
    Car,
    Hammer,
    MoreHorizontal,
    X,
    Search
} from 'lucide-react';
import { financialApi, customerApi } from '../services/api';
import { Transaction, TransactionType, TransactionCategory, TransactionStatus, Customer } from '../types';

const FinancialView: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'transactions' | 'logs'>('transactions');
    const [financialLogs, setFinancialLogs] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        type: TransactionType.EXPENSE,
        category: TransactionCategory.OUTRO,
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        status: TransactionStatus.PAGO
    });

    useEffect(() => {
        if (activeTab === 'transactions') {
            loadTransactions();
        } else {
            loadLogs();
        }
        loadCustomers();
    }, [filterMonth, filterYear, activeTab]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await financialApi.getTransactions({ month: filterMonth, year: filterYear });
            const transactionsWithNumbers = data.transactions.map((t: any) => ({
                ...t,
                amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount
            }));
            setTransactions(transactionsWithNumbers);
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await financialApi.getLogs();
            setFinancialLogs(data.logs);
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCustomers = async () => {
        try {
            const data = await customerApi.getAll();
            setCustomers(data.customers);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const savedUser = localStorage.getItem('fix_user');
            const currentUser = savedUser ? JSON.parse(savedUser) : null;

            const newTransaction = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).getTime(),
                userId: currentUser?.id,
                userName: currentUser?.name
            };
            await financialApi.createTransaction(newTransaction);
            setIsModalOpen(false);
            loadTransactions();
            setFormData({
                type: TransactionType.EXPENSE,
                category: TransactionCategory.OUTRO,
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                customerId: '',
                status: TransactionStatus.PAGO
            });
        } catch (error) {
            alert('Erro ao adicionar transação');
        }
    };

    const handleDelete = async (id: string) => {
        const password = prompt('Para excluir este lançamento, insira a senha de segurança:');

        if (password === '123456') {
            const savedUser = localStorage.getItem('fix_user');
            const currentUser = savedUser ? JSON.parse(savedUser) : null;

            if (!currentUser) {
                alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
                return;
            }

            try {
                await financialApi.deleteTransaction(id, {
                    userId: currentUser.id,
                    userName: currentUser.name
                });
                loadTransactions();
            } catch (error) {
                alert('Erro ao excluir transação');
            }
        } else if (password !== null) {
            alert('Senha incorreta!');
        }
    };

    const totals = transactions.reduce((acc, curr) => {
        const amount = typeof curr.amount === 'string' ? parseFloat(curr.amount) : curr.amount;
        if (curr.type === TransactionType.INCOME) {
            acc.income += amount;
        } else {
            acc.expense += amount;
        }
        return acc;
    }, { income: 0, expense: 0 });

    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers.find(c => c.id === t.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryIcon = (category: TransactionCategory) => {
        switch (category) {
            case TransactionCategory.REPARO: return <Hammer size={18} />;
            case TransactionCategory.PECA: return <ShoppingBag size={18} />;
            case TransactionCategory.UBER: return <Car size={18} />;
            case TransactionCategory.TAXA_ENTREGA: return <Truck size={18} />;
            default: return <MoreHorizontal size={18} />;
        }
    };

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return (
        <div className="space-y-6 animate-view-enter-active">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
                    <p className="text-slate-500 text-sm">Controle de entradas e saídas</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                        <Calendar size={18} className="text-slate-400 mr-2" />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                        >
                            {months.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(parseInt(e.target.value))}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer ml-2"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus size={20} />
                        Lançamento
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Lançamentos
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Auditoria (Log)
                </button>
            </div>

            {activeTab === 'transactions' ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp size={64} className="text-emerald-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Entradas</p>
                            <p className="text-2xl font-bold text-emerald-600">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingDown size={64} className="text-rose-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Saídas</p>
                            <p className="text-2xl font-bold text-rose-600">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-sm overflow-hidden relative text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <DollarSign size={64} className="text-white" />
                            </div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Saldo do Mês</p>
                            <p className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                R$ {(totals.income - totals.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Search and List */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por descrição, categoria ou cliente..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                <Filter size={16} />
                                <span>{filteredTransactions.length} registros</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipo/Categoria</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Carregando dados...</td></tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
                                    ) : (
                                        filteredTransactions.map(transaction => (
                                            <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {transaction.date ? new Date(transaction.date).toLocaleDateString('pt-BR') : '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${transaction.type === TransactionType.INCOME
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-rose-50 text-rose-600'
                                                            }`}>
                                                            {getCategoryIcon(transaction.category)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800 leading-none mb-1">{transaction.category}</p>
                                                            <span className={`text-[10px] font-bold uppercase ${transaction.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'
                                                                }`}>
                                                                {transaction.type === TransactionType.INCOME ? 'Entrada' : 'Saída'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 italic max-w-xs truncate">
                                                        {transaction.description || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {customers.find(c => c.id === transaction.customerId)?.name || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className={`text-sm font-bold ${transaction.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                        {transaction.type === TransactionType.INCOME ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(transaction.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800">Histórico de Alterações</h3>
                        <p className="text-xs text-slate-500 mt-1">Registros de criação e exclusão de lançamentos</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Horário</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ação</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Carregando logs...</td></tr>
                                ) : financialLogs.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhum log encontrado.</td></tr>
                                ) : (
                                    financialLogs.map(log => {
                                        const details = JSON.parse(log.details);
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm text-slate-700">{log.createdAt ? new Date(log.createdAt).toLocaleString('pt-BR') : '-'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-800">{log.userName}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold">UID: {log.userId}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {log.action === 'CREATE' ? 'Criação' : 'Exclusão'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-slate-600">
                                                        {details.description || 'Sem descrição'} -
                                                        <span className="font-bold ml-1">R$ {parseFloat(details.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">Cat: {details.category} | Tipo: {details.type}</p>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Lançamento */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-enter my-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-lg">Novo Lançamento</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: TransactionType.INCOME })}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${formData.type === TransactionType.INCOME
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        }`}
                                >
                                    <TrendingUp size={18} />
                                    Entrada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: TransactionType.EXPENSE })}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${formData.type === TransactionType.EXPENSE
                                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}
                                >
                                    <TrendingDown size={18} />
                                    Saída
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
                                        required
                                    >
                                        <option value={TransactionCategory.REPARO}>Reparo</option>
                                        <option value={TransactionCategory.PECA}>Peça</option>
                                        <option value={TransactionCategory.UBER}>Uber</option>
                                        <option value={TransactionCategory.TAXA_ENTREGA}>Taxa de Entrega</option>
                                        <option value={TransactionCategory.OUTRO}>Outro</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="0,00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cliente (Opcional)</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                    value={formData.customerId}
                                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">Nenhum</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Descrição</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px]"
                                    placeholder="Ex: Pagamento tela iPhone 11"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 mt-2"
                            >
                                Salvar Lançamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialView;
