// Configuração base da API
// Detecta se está rodando em localhost, IP, mesma porta ou HTTPS (ngrok)
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  // Se estiver na mesma porta do backend (produção), usa caminho relativo
  if (port === '3001' || window.location.pathname.startsWith('/api')) {
    return '/api';
  }

  // HTTPS (ngrok) - usa o mesmo host com caminho relativo
  if (protocol === 'https:') {
    return '/api';
  }

  // Desenvolvimento - backend em porta diferente
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }

  // IP na rede
  return `http://${hostname}:3001/api`;
};

const API_BASE_URL = getApiUrl();

// Helper para requisições HTTP
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Serviço de Autenticação
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ user: { id: string; name: string; email: string; accessLevel: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getUsers: () =>
    fetchApi<{ users: { id: string; name: string; email: string; accessLevel: string }[] }>('/auth/users'),

  createUser: (user: { id: string; name: string; email: string; password: string; accessLevel: string }) =>
    fetchApi<{ user: { id: string; name: string; email: string; accessLevel: string } }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),

  deleteUser: (id: string) =>
    fetchApi<{ message: string }>(`/auth/users/${id}`, {
      method: 'DELETE',
    }),
};

// Serviço de Clientes
export const customerApi = {
  getAll: () =>
    fetchApi<{ customers: any[] }>('/customers'),

  getById: (id: string) =>
    fetchApi<{ customer: any }>(`/customers/${id}`),

  create: (customer: any) =>
    fetchApi<{ customer: any }>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        ...customer,
        id: Math.random().toString(36).substr(2, 9),
        phoneType: customer.phoneType || 'CLIENTE',
        phoneSecondaryType: customer.phoneSecondaryType || 'CLIENTE'
      }),
    }),

  update: (id: string, customer: any) =>
    fetchApi<{ customer: any }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Serviço de Dispositivos
export const deviceApi = {
  getAll: () =>
    fetchApi<{ devices: any[] }>('/devices'),

  getById: (id: string) =>
    fetchApi<{ device: any }>(`/devices/${id}`),

  getByCustomer: (customerId: string) =>
    fetchApi<{ devices: any[] }>(`/devices/customer/${customerId}`),

  create: (device: any) =>
    fetchApi<{ device: any }>('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    }),

  update: (id: string, device: any) =>
    fetchApi<{ message: string }>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/devices/${id}`, {
      method: 'DELETE',
    }),
};

// Serviço de Tickets
export const ticketApi = {
  getAll: () =>
    fetchApi<{ tickets: any[] }>('/tickets'),

  getById: (id: string) =>
    fetchApi<{ ticket: any }>(`/tickets/${id}`),

  create: (ticket: any) =>
    fetchApi<{ ticket: any }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    }),

  update: (id: string, ticket: any) =>
    fetchApi<{ message: string }>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ticket),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/tickets/${id}`, {
      method: 'DELETE',
    }),

  move: (id: string, movementData: any) =>
    fetchApi<{ message: string }>(`/tickets/move/${id}`, {
      method: 'POST',
      body: JSON.stringify(movementData),
    }),
};

// Serviço de Timeline
export const timelineApi = {
  getByTicket: (ticketId: string) =>
    fetchApi<{ entries: any[] }>(`/timeline/${ticketId}`),

  create: (entry: any) =>
    fetchApi<{ entry: any }>('/timeline', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/timeline/${id}`, {
      method: 'DELETE',
    }),
};

// Serviço de Upload
export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Erro no upload');
      return res.json() as Promise<{ filename: string; originalname: string; path: string }>;
    });
  },

  uploadMultiple: (files: FileList | File[]) => {
    const formData = new FormData();
    const fileArray = files instanceof FileList ? Array.from(files) : files;

    fileArray.forEach(file => {
      formData.append('files', file);
    });

    return fetch(`${API_BASE_URL}/upload-multiple`, {
      method: 'POST',
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Erro no upload múltiplo');
      return res.json() as Promise<{ files: Array<{ filename: string; originalname: string; path: string }> }>;
    });
  }
};

// Serviço de Agendamentos
export const scheduleApi = {
  getAll: () =>
    fetchApi<{ schedules: any[] }>('/schedules'),

  create: (schedule: any) =>
    fetchApi<{ schedule: any }>('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    }),

  update: (id: string, schedule: any) =>
    fetchApi<{ message: string }>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/schedules/${id}`, {
      method: 'DELETE',
    }),
};

// Serviço Financeiro
export const financialApi = {
  getTransactions: (filters: { month?: number; year?: number; category?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.type) params.append('type', filters.type);

    return fetchApi<{ transactions: any[] }>(`/financial?${params.toString()}`);
  },

  createTransaction: (transaction: any) =>
    fetchApi<{ transaction: any }>('/financial', {
      method: 'POST',
      body: JSON.stringify(transaction),
    }),

  deleteTransaction: (id: string, userInfo: { userId: string; userName: string }) => {
    const params = new URLSearchParams();
    params.append('userId', userInfo.userId);
    params.append('userName', userInfo.userName);
    return fetchApi<{ message: string }>(`/financial/${id}?${params.toString()}`, {
      method: 'DELETE',
    });
  },

  getLogs: () =>
    fetchApi<{ logs: any[] }>('/financial/logs'),
};
