
import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  PieChart,
  Plus,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  MessageSquare,
  Calendar,
  Wallet
} from 'lucide-react';
import {
  ViewType,
  User,
  AccessLevel,
  Ticket,
  Customer,
  Device,
  TicketStatus,
  Priority,
  TimelineEntry
} from './types';
import { authApi, customerApi, deviceApi, ticketApi, timelineApi, financialApi } from './services/api';
import Dashboard from './views/Dashboard';
import TicketList from './views/TicketList';
import CustomerList from './views/CustomerList';
import TicketDetail from './views/TicketDetail';
import SettingsView from './views/SettingsView';
import ScheduleView from './views/ScheduleView';
import FinancialView from './views/FinancialView';
import logo from './logo.png';


// Componente de Login com Email e Senha
const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, preencha email e senha');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authApi.login(email, password);

      // Mapear o usuário para garantir o formato correto
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        accessLevel: response.user.accessLevel as AccessLevel
      };

      onLogin(user);
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError('Email ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Mundo Phone Logo" className="w-48 h-auto mb-2" />
          <p className="text-slate-500 font-medium">Gestão de Assistência Técnica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>


      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fix_user');
    return saved ? JSON.parse(saved) : null;
  });

  // App Data State (from API)
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Load Initial Data from API
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketsRes, customersRes, devicesRes] = await Promise.all([
        ticketApi.getAll(),
        customerApi.getAll(),
        deviceApi.getAll(),
      ]);

      setTickets(ticketsRes.tickets);
      setCustomers(customersRes.customers);
      setDevices(devicesRes.devices);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do servidor. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (u: User) => {
    setCurrentUser(u);
    localStorage.setItem('fix_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fix_user');
  };

  const navigateToTicket = (id: string) => {
    setSelectedTicketId(id);
    setCurrentView('ticket-detail');
    setIsSidebarOpen(false);
  };

  const addTimelineEntry = useCallback(async (ticketId: string, action: string, description: string) => {
    if (!currentUser) return;
    const newEntry: TimelineEntry = {
      id: Math.random().toString(36).substr(2, 9),
      ticketId,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      description,
      timestamp: Date.now(),
    };

    try {
      await timelineApi.create(newEntry);
      setTimeline(prev => [newEntry, ...prev]);
    } catch (err) {
      console.error('Erro ao salvar timeline:', err);
    }
  }, [currentUser]);

  // View Switcher logic
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard
          tickets={tickets}
          onViewTicket={navigateToTicket}
        />;
      case 'tickets':
        return <TicketList
          tickets={tickets}
          customers={customers}
          devices={devices}
          onViewTicket={navigateToTicket}
          setTickets={setTickets}
          setCustomers={setCustomers}
          setDevices={setDevices}
          addTimelineEntry={addTimelineEntry}
          currentUser={currentUser!}
        />;
      case 'customers':
        return <CustomerList
          customers={customers}
          setCustomers={setCustomers}
          currentUser={currentUser!}
        />;
      case 'ticket-detail':
        const t = tickets.find(ticket => ticket.id === selectedTicketId);
        if (!t) return <div className="p-8 text-center text-slate-500">Ticket não encontrado</div>;

        const c = t.customerId ? customers.find(c => c.id === t.customerId) : undefined;
        const d = devices.find(d => d.id === t.deviceId);

        if (!d) {
          return (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">Dados do aparelho não encontrados.</p>
              <button
                onClick={() => setCurrentView('tickets')}
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Voltar para lista
              </button>
            </div>
          );
        }

        return <TicketDetail
          ticket={t}
          customer={c}
          device={d}
          timeline={timeline.filter(e => e.ticketId === t.id)}
          onBack={() => setCurrentView('tickets')}
          onUpdateTicket={(updated) => {
            setTickets(prev => prev.map(pt => pt.id === updated.id ? updated : pt));
          }}
          onUpdateDevice={(updated) => {
            setDevices(prev => prev.map(pd => pd.id === updated.id ? updated : pd));
          }}
          addTimelineEntry={addTimelineEntry}
          currentUser={currentUser!}
        />;
      case 'settings':
        if (currentUser?.accessLevel !== AccessLevel.ADMIN) {
          return <div className="p-8 text-center text-slate-500">Acesso negado. Esta seção é restrita a administradores.</div>;
        }
        return <SettingsView />;
      case 'schedules':
        return <ScheduleView
          customers={customers}
          tickets={tickets}
          currentUser={currentUser!}
        />;
      case 'financial':
        if (currentUser?.accessLevel !== AccessLevel.ADMIN && currentUser?.accessLevel !== AccessLevel.MANAGER) {
          return <div className="p-8 text-center text-slate-500">Acesso negado. Esta seção é restrita a administradores e gerentes.</div>;
        }
        return <FinancialView />;
      default:
        return <Dashboard tickets={tickets} onViewTicket={navigateToTicket} />;
    }
  };

  // Login Screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: ViewType, icon: any, label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setIsSidebarOpen(false); }}
      className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${currentView === view ? 'bg-white/10 text-white shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'
        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
      title={isSidebarCollapsed ? label : ''}
    >
      <Icon size={20} className="shrink-0" />
      <span className={`font-medium truncate transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar / Navigation Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#072682] shadow-2xl transform transition-all duration-300 ease-in-out
          md:relative md:translate-x-0 md:shadow-none md:border-r border-white/5 overflow-y-auto overflow-x-hidden hide-scrollbar
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-72'}
          w-72
        `}
        onMouseEnter={() => setIsSidebarCollapsed(false)}
        onMouseLeave={() => setIsSidebarCollapsed(true)}
      >
        <div className={`p-6 h-full flex flex-col ${isSidebarCollapsed ? 'items-center px-2' : ''}`}>
          <div className={`flex items-center justify-between mb-8 ${isSidebarCollapsed ? 'w-full flex-col space-y-4' : ''}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <img
                src={logo}
                alt="Logo"
                className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-10' : 'w-40'}`}
              />
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-400">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 w-full">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="tickets" icon={ClipboardList} label="Ocorrências" />
            <NavItem view="customers" icon={Users} label="Clientes" />
            {(currentUser?.accessLevel === AccessLevel.ADMIN || currentUser?.accessLevel === AccessLevel.MANAGER) && (
              <NavItem view="financial" icon={Wallet} label="Financeiro" />
            )}
            <NavItem view="schedules" icon={Calendar} label="Agenda" />
            {currentUser?.accessLevel === AccessLevel.ADMIN && (
              <NavItem view="settings" icon={Settings} label="Configurações" />
            )}
          </nav>

          <div className={`pt-6 mt-6 border-t border-white/10 w-full ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
            <div className={`flex items-center mb-6 px-2 ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                <p className="font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-white/50 truncate">{currentUser.accessLevel}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center w-full p-3 text-rose-300 hover:bg-rose-500/20 rounded-xl transition-all ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
              title={isSidebarCollapsed ? 'Sair' : ''}
            >
              <LogOut size={20} className="shrink-0" />
              <span className={`font-medium transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden hidden' : 'w-auto opacity-100'}`}>
                Sair
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className={`w-full h-full pb-20 md:pb-0 ${isSidebarCollapsed ? 'px-4' : ''}`}>
          {/* Persistent Toggle for Desktop if Sidebar is fully hidden (Optional, but let's keep it visible but small) */}
          {renderView()}
        </div>
      </main>

      {/* Bottom Quick Navigation (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-2 flex justify-between items-center z-50">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] mt-1 font-medium">Início</span>
        </button>
        <button onClick={() => setCurrentView('tickets')} className={`flex flex-col items-center ${currentView === 'tickets' ? 'text-blue-600' : 'text-slate-400'}`}>
          <ClipboardList size={20} />
          <span className="text-[10px] mt-1 font-medium">Ordens</span>
        </button>
        <button onClick={() => setCurrentView('customers')} className={`flex flex-col items-center shrink-0 ${currentView === 'customers' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Users size={20} />
          <span className="text-[10px] mt-1 font-medium">Clientes</span>
        </button>
        <button onClick={() => setCurrentView('schedules')} className={`flex flex-col items-center shrink-0 ${currentView === 'schedules' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Calendar size={20} />
          <span className="text-[10px] mt-1 font-medium">Agenda</span>
        </button>
        {currentUser?.accessLevel === AccessLevel.ADMIN && (
          <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center shrink-0 ${currentView === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Settings size={20} />
            <span className="text-[10px] mt-1 font-medium">Config</span>
          </button>
        )}
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
