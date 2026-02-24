import React, { useState, useEffect } from 'react';
import { Shield, Bell, Palette, ChevronRight, Users, Plus, Trash2, X, UserPlus } from 'lucide-react';
import { authApi } from '../services/api';
import { AccessLevel } from '../types';

interface User {
  id: string;
  name: string;
  email: string;
  accessLevel: string;
}

const SettingsView: React.FC = () => {
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    accessLevel: AccessLevel.TECHNICIAN
  });
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getUsers();
      setUsers(response.users);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showUsersModal) {
      loadUsers();
    }
  }, [showUsersModal]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    try {
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        accessLevel: newUser.accessLevel
      };

      await authApi.createUser(userData);
      await loadUsers();
      setShowAddForm(false);
      setNewUser({ name: '', email: '', password: '', accessLevel: AccessLevel.TECHNICIAN });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await authApi.deleteUser(id);
      await loadUsers();
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      alert('Erro ao excluir usuário');
    }
  };

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case AccessLevel.ADMIN: return 'Administrador';
      case AccessLevel.MANAGER: return 'Gerente';
      case AccessLevel.TECHNICIAN: return 'Técnico';
      default: return level;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case AccessLevel.ADMIN: return 'bg-red-100 text-red-700';
      case AccessLevel.MANAGER: return 'bg-blue-100 text-blue-700';
      case AccessLevel.TECHNICIAN: return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const SettingItem = ({ icon: Icon, label, desc, color, onClick }: any) => (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 transition-all cursor-pointer group"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${color} bg-white shadow-sm border`}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{label}</h3>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
    </div>
  );

  return (
    <div className="space-y-6 animate-view-enter-active">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500 text-sm">Ajuste o FixTrack ao seu fluxo de trabalho</p>
      </header>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-8">Segurança & Sistema</h2>
        <SettingItem
          icon={Users}
          label="Gerenciar Usuarios"
          desc="Crie e gerencie usuarios do sistema"
          color="text-emerald-500"
          onClick={() => setShowUsersModal(true)}
        />
      </div>

      {/* Modal de Gerenciamento de Usuarios */}
      {
        showUsersModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-start md:items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-none md:max-h-[90vh] my-auto">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-100 p-2 rounded-xl">
                    <Users className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-xl">Gerenciar Usuarios</h2>
                    <p className="text-sm text-slate-500">Crie e gerencie usuarios do sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="text-slate-400 p-2 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {/* Botao Adicionar */}
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full mb-6 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all"
                  >
                    <UserPlus size={20} />
                    <span>Novo Usuario</span>
                  </button>
                )}

                {/* Formulario de Adicionar */}
                {showAddForm && (
                  <form onSubmit={handleCreateUser} className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Novo Usuario</h3>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Ex: Joao Silva"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="joao@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Minimo 6 caracteres"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Acesso</label>
                        <select
                          value={newUser.accessLevel}
                          onChange={(e) => setNewUser({ ...newUser, accessLevel: e.target.value as AccessLevel })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value={AccessLevel.TECHNICIAN}>Tecnico</option>
                          <option value={AccessLevel.MANAGER}>Gerente</option>
                          <option value={AccessLevel.ADMIN}>Administrador</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                      >
                        Criar Usuario
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de Usuarios */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 mb-3">Usuarios Cadastrados</h3>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-500 mt-4">Carregando usuarios...</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{user.name}</h4>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getAccessLevelColor(user.accessLevel)}`}>
                            {getAccessLevelLabel(user.accessLevel)}
                          </span>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Excluir usuario"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default SettingsView;
