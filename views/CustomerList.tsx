import React, { useState } from 'react';
import { Users, Search, Plus, Phone, Mail, ChevronRight, MessageCircle, X, User } from 'lucide-react';
import { Customer, PhoneType } from '../types';
import { formatPhone } from '../utils';
import { customerApi } from '../services/api';

interface CustomerListProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, setCustomers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    phoneType: PhoneType.CLIENTE,
    contactName: '',
    phoneSecondary: '',
    phoneSecondaryType: PhoneType.CLIENTE,
    cpf: '',
    zipCode: '',
    email: '',
    contactObservations: ''
  });

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleAdd = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;

    try {
      const response = await customerApi.create(newCustomer);
      setCustomers(prev => [response.customer, ...prev]);
      setNewCustomer({
        name: '',
        phone: '',
        phoneType: PhoneType.CLIENTE,
        contactName: '',
        phoneSecondary: '',
        phoneSecondaryType: PhoneType.CLIENTE,
        cpf: '',
        zipCode: '',
        email: '',
        contactObservations: ''
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      alert('Erro ao cadastrar cliente. Tente novamente.');
    }
  };

  const getPhoneTypeLabel = (type: PhoneType) => {
    switch (type) {
      case PhoneType.CLIENTE: return 'Cliente';
      case PhoneType.FAMILIAR: return 'Familiar';
      case PhoneType.OUTRO: return 'Outro';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-view-enter-active">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm">Base de dados de contatos e historico</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          <span>Novo Cliente</span>
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou celular..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato Principal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Contato Secundário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{customer.name}</p>
                          {customer.cpf && <p className="text-xs text-slate-400">CPF: {customer.cpf}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <Phone size={14} className="text-slate-400" />
                          <span className="font-medium text-slate-700 text-sm">{formatPhone(customer.phone)}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded w-fit mt-1 font-bold">
                          {getPhoneTypeLabel(customer.phoneType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {customer.phoneSecondary ? (
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <Phone size={14} className="text-slate-400" />
                            <span className="text-slate-600 text-sm">{formatPhone(customer.phoneSecondary)}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">{getPhoneTypeLabel(customer.phoneSecondaryType || PhoneType.CLIENTE)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {customer.email ? (
                        <div className="flex items-center space-x-2">
                          <Mail size={14} className="text-slate-400" />
                          <span className="text-slate-600 text-sm truncate max-w-[150px]">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.open(`https://wa.me/55${customer.phone.replace(/\D/g, '')}`, '_blank')}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                          title="WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                        <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-all shadow-sm">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-start md:items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-none md:max-h-[90vh] flex flex-col my-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <User className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Cadastrar Cliente</h2>
                  <p className="text-sm text-slate-500">Preencha os dados do cliente</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Nome Completo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Pedro Silva"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </div>

                {/* Telefone Principal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Telefone Principal *</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(00) 00000-0000"
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCustomer.phoneType}
                      onChange={e => setNewCustomer({ ...newCustomer, phoneType: e.target.value as PhoneType })}
                    >
                      <option value={PhoneType.CLIENTE}>Cliente</option>
                      <option value={PhoneType.FAMILIAR}>Familiar</option>
                      <option value={PhoneType.OUTRO}>Outro</option>
                    </select>
                  </div>
                </div>

                {/* Nome do Contato */}
                {newCustomer.phoneType !== PhoneType.CLIENTE && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Contato</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Quem atendera as ligacoes"
                      value={newCustomer.contactName}
                      onChange={e => setNewCustomer({ ...newCustomer, contactName: e.target.value })}
                    />
                  </div>
                )}

                {/* Telefone Secundario */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Telefone Secundario (opcional)</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(00) 00000-0000"
                      value={newCustomer.phoneSecondary}
                      onChange={e => setNewCustomer({ ...newCustomer, phoneSecondary: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCustomer.phoneSecondaryType}
                      onChange={e => setNewCustomer({ ...newCustomer, phoneSecondaryType: e.target.value as PhoneType })}
                    >
                      <option value={PhoneType.CLIENTE}>Cliente</option>
                      <option value={PhoneType.FAMILIAR}>Familiar</option>
                      <option value={PhoneType.OUTRO}>Outro</option>
                    </select>
                  </div>
                </div>

                {/* CPF and CEP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">CPF</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="000.000.000-00"
                      value={newCustomer.cpf}
                      onChange={e => setNewCustomer({ ...newCustomer, cpf: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">CEP</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="00000-000"
                      value={newCustomer.zipCode}
                      onChange={e => setNewCustomer({ ...newCustomer, zipCode: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">E-mail (opcional)</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>

                {/* Observacao de Contato */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observacao de Contato</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Ex: preferir WhatsApp, ligar apos 18h..."
                    value={newCustomer.contactObservations}
                    onChange={e => setNewCustomer({ ...newCustomer, contactObservations: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50">
              <button
                onClick={handleAdd}
                disabled={!newCustomer.name || !newCustomer.phone}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                Cadastrar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
