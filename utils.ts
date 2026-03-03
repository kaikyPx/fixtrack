
export const formatPhone = (phone: string) => {
  return phone.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatDateOnly = (timestamp?: number) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const getTicketAgeDays = (createdAt?: number) => {
  if (!createdAt) return 0;
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return 0;
  const diffTime = Math.abs(Date.now() - createdAt);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const getAgeColorClass = (days: number) => {
  if (days >= 15) return 'text-red-600 font-bold';
  if (days >= 8) return 'text-amber-600 font-semibold';
  return 'text-emerald-600';
};

export const getAgeBgClass = (days: number) => {
  if (days >= 15) return 'bg-red-50 border-red-200';
  if (days >= 8) return 'bg-amber-50 border-amber-200';
  return 'bg-emerald-50 border-emerald-200';
};

export const getFileNameFromPath = (path: string) => {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
};
