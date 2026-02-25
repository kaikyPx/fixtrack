
import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Camera,
  Paperclip,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Send,
  User as UserIcon,
  Smartphone,
  Info,
  ExternalLink,
  Download,
  Trash2,
  Plus,
  FileText,
  Video,
  History,
  Folder,
  Hash,
  Phone,
  Mail,
  Wrench,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Layout, // Adding for sidebar toggle
} from 'lucide-react';
import {
  Ticket,
  Customer,
  Device,
  TimelineEntry,
  TicketStatus,
  Priority,
  User,
  Attachment
} from '../types';
import { STATUS_COLORS, PRIORITY_COLORS } from '../constants';
import { formatDate, formatDateOnly, getTicketAgeDays, getAgeColorClass, formatPhone, getFileNameFromPath } from '../utils';
import {
  ticketApi,
  timelineApi,
  deviceApi,
  authApi, // Keeping authApi as it was not explicitly removed by the user's provided snippet, only userApi was added. Assuming userApi is a new addition, not a replacement for authApi unless specified.
  uploadApi,
  customerApi
} from '../services/api';
import {
  generateServiceOrderPDF, // Kept from original, but user also provided a new path for it
  generateSwapTermPDF,
  generateRepairTermPDF,
  generateStoreReceiptTermPDF,
  generateClientDeliveryTermPDF,
  generateMotoboyDeliveryTermPDF,
  generateLoanerDeviceTermPDF,
  generateAwarenessTermPDF,
  generateWarrantyDeniedTermPDF,
  generateTechnicalSupportReceiptTermPDF,
  generateOccurrenceSummaryPDF,
} from '../services/pdf';
import FileUploader from '../components/FileUploader';
import FilePreviewModal from '../components/FilePreviewModal';

interface TicketDetailProps {
  ticket: Ticket;
  customer?: Customer;
  device: Device;
  timeline: TimelineEntry[];
  onBack: () => void;
  onUpdateTicket: (ticket: Ticket) => void;
  onUpdateDevice: (device: Device) => void;
  addTimelineEntry: (ticketId: string, action: string, description: string) => void;
  currentUser: User;
}

const SignaturePad: React.FC<{ onSave: (data: string) => void, onClear: () => void }> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#2563eb'; // blue-600
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Set background to transparent white
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toque para assinar</span>
        <button type="button" onClick={handleClear} className="text-[10px] text-rose-500 font-bold hover:underline">Limpar</button>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={draw}
        className="w-full h-24 bg-white border border-slate-200 rounded-xl cursor-crosshair touch-none"
      />
    </div>
  );
};

const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket,
  customer,
  device,
  timeline: initialTimeline,
  onBack,
  onUpdateTicket,
  onUpdateDevice,
  addTimelineEntry,
  currentUser
}) => {
  const [comment, setComment] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'info' | 'files' | 'terms'>('info');
  const [isMovementOpen, setIsMovementOpen] = useState(false);

  // Preview states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string, name: string }>({ url: '', name: '' });

  const handlePreviewFile = (url: string, name: string) => {
    setPreviewFile({ url, name });
    setIsPreviewOpen(true);
  };

  const [showSidebar, setShowSidebar] = useState(() => {
    const saved = localStorage.getItem('fix_ticket_sidebar_visible');
    return saved !== 'false'; // Default to true
  });

  const toggleSidebar = () => {
    setShowSidebar(prev => {
      const newState = !prev;
      localStorage.setItem('fix_ticket_sidebar_visible', String(newState));
      return newState;
    });
  };

  // Edit states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editZipCode, setEditZipCode] = useState(customer?.zipCode || '');
  const [editScreenPassword, setEditScreenPassword] = useState(device?.screenPassword || '');
  const [editBatteryHealth, setEditBatteryHealth] = useState(device?.batteryHealth || '');
  const [editIsReturn, setEditIsReturn] = useState(device?.isReturn || false);

  const [localTimeline, setLocalTimeline] = useState<TimelineEntry[]>(initialTimeline);
  const [movementStatus, setMovementStatus] = useState<TicketStatus>(ticket.status);
  const [movementComment, setMovementComment] = useState('');
  const [movementAttachment, setMovementAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [targetTechnicianId, setTargetTechnicianId] = useState('');
  const [partName, setPartName] = useState('');
  const [forecastDate, setForecastDate] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [returnMethod, setReturnMethod] = useState<'Retirada em loja' | 'Motoboy entregou'>('Retirada em loja');
  const [resolutionResult, setResolutionResult] = useState<'Reparado' | 'Trocado' | 'Sem defeito constatado' | 'Negado garantia' | 'Outro'>('Reparado');
  const [repairWarrantyDays, setRepairWarrantyDays] = useState(90);
  const [finalObservations, setFinalObservations] = useState('');
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [awarenessNarrative, setAwarenessNarrative] = useState('');
  const [includeRepairOnAwareness, setIncludeRepairOnAwareness] = useState(false);

  // Novos estados para Termos Detalhados
  const [swapModel, setSwapModel] = useState('');
  const [swapColor, setSwapColor] = useState('');
  const [swapStorage, setSwapStorage] = useState('');
  const [swapImei, setSwapImei] = useState('');
  const [swapDate, setSwapDate] = useState(new Date().toISOString().split('T')[0]);
  const [denialCost, setDenialCost] = useState(0);
  const [denialPaymentMethod, setDenialPaymentMethod] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTimeline();
    loadTechnicians();
  }, [ticket.id]);

  const loadTimeline = async () => {
    try {
      const response = await timelineApi.getByTicket(ticket.id);
      setLocalTimeline(response.entries);
    } catch (err) {
      console.error('Erro ao carregar timeline:', err);
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await authApi.getUsers();
      setTechnicians(response.users.filter(u => u.accessLevel === 'TECHNICIAN' || u.accessLevel === 'ADMIN'));
    } catch (err) {
      console.error('Erro ao carregar técnicos:', err);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (newStatus === ticket.status) return;

    try {
      const updated: Ticket = { ...ticket, status: newStatus, updatedAt: Date.now() };
      await ticketApi.update(ticket.id, updated);
      onUpdateTicket(updated);
      await addTimelineEntry(ticket.id, 'Mudança de Status', `Status alterado para ${newStatus} por ${currentUser.name}`);
      await loadTimeline();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  const handleMovement = async () => {
    if (isMoving) return;

    // Validações básicas
    if (movementStatus === TicketStatus.ENVIADO_PARA_TECNICO && !targetTechnicianId) {
      alert('Por favor, selecione qual técnico.');
      return;
    }
    if (movementStatus === TicketStatus.AGUARDANDO_PECA && !partName) {
      alert('Por favor, informe qual peça.');
      return;
    }
    if (movementStatus === TicketStatus.CANCELADO && !cancellationReason) {
      alert('Por favor, informe o motivo do cancelamento.');
      return;
    }

    setIsMoving(true);
    try {
      await ticketApi.move(ticket.id, {
        status: movementStatus,
        userId: currentUser.id,
        userName: currentUser.name,
        comment: movementComment,
        technicianId: targetTechnicianId,
        partName,
        forecastDate,
        cancellationReason,
        attachment: movementAttachment,
        returnMethod,
        resolutionResult,
        repairWarrantyDays,
        finalObservations,
        deliveryConfirmed,
        signatureUrl,
        swapDeviceInfo: resolutionResult === 'Trocado' ? {
          model: swapModel,
          color: swapColor,
          storage: swapStorage,
          imei: swapImei,
          date: new Date(swapDate).getTime()
        } : undefined,
        warrantyDenialInfo: resolutionResult === 'Negado garantia' ? {
          reasons: [], // Could add reasons checklist later
          cost: denialCost,
          paymentMethod: denialPaymentMethod
        } : undefined
      });

      // Atualizar ticket localmente
      const isClosing = movementStatus === TicketStatus.PRONTO || movementStatus === TicketStatus.ENTREGUE;
      const updatedTicket: Ticket = {
        ...ticket,
        status: movementStatus,
        technicianId: targetTechnicianId || ticket.technicianId,
        updatedAt: Date.now(),
        ...(isClosing ? {
          resolvedAt: Date.now(),
          returnMethod,
          resolutionResult,
          repairWarrantyDays,
          finalObservations,
          deliveryConfirmed,
          signatureUrl
        } : {})
      };
      onUpdateTicket(updatedTicket);

      // Limpar campos
      setMovementComment('');
      setMovementAttachment(null);
      setPartName('');
      setForecastDate('');
      setCancellationReason('');
      setReturnMethod('Retirada em loja');
      setResolutionResult('Reparado');
      setRepairWarrantyDays(90);
      setFinalObservations('');
      setDeliveryConfirmed(false);
      setSignatureUrl('');
      setSwapModel('');
      setSwapColor('');
      setSwapStorage('');
      setSwapImei('');
      setDenialCost(0);
      setDenialPaymentMethod('');

      // Recarregar timeline
      await loadTimeline();
      alert('Movimentação realizada com sucesso!');
    } catch (err) {
      console.error('Erro ao movimentar ticket:', err);
      alert('Erro ao realizar movimentação. Verifique o console.');
    } finally {
      setIsMoving(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      await addTimelineEntry(ticket.id, 'Comentário', comment);
      setComment('');
      await loadTimeline();
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
    }
  };

  const handleMovementFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadApi.uploadFile(file);
      setMovementAttachment({
        url: response.path,
        name: response.originalname,
        type: file.type
      });
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao fazer upload do anexo.');
    }
  };

  const handleUpdateBasicInfo = async () => {
    try {
      // Update Customer if zipCode changed
      if (customer && editZipCode !== (customer.zipCode || '')) {
        const updatedCustomer = { ...customer, zipCode: editZipCode };
        await customerApi.update(customer.id, updatedCustomer);
        // Assuming customer prop is updated by parent or re-fetched if needed
      }

      // Update Device
      const updatedDevice: Device = {
        ...device,
        screenPassword: editScreenPassword,
        batteryHealth: editBatteryHealth,
        isReturn: editIsReturn
      };
      await deviceApi.update(device.id, updatedDevice);
      onUpdateDevice(updatedDevice);

      setIsEditingInfo(false);
      addTimelineEntry(ticket.id, 'Informação atualizada', 'Dados básicos do cliente/aparelho foram atualizados');
    } catch (err) {
      console.error('Erro ao atualizar informações:', err);
      alert('Erro ao salvar as alterações.');
    }
  };

  const DEFAULT_GUEST_CUSTOMER: any = {
    id: 'guest',
    name: 'Cliente Não Informado',
    phone: 'Não informado',
    email: 'Não informado',
    cpf: '',
    createdAt: Date.now(),
    phoneType: 'CLIENTE'
  };

  const activeCustomer = customer || DEFAULT_GUEST_CUSTOMER;

  const handleGeneratePDF = () => {
    try {
      generateServiceOrderPDF(ticket, activeCustomer, device, currentUser);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar ordem de serviço. Tente novamente.');
    }
  };

  const handleGenerateSummaryPDF = () => {
    try {
      generateOccurrenceSummaryPDF(ticket, activeCustomer, device, localTimeline);
    } catch (err) {
      console.error('Erro ao gerar resumo da ocorrência:', err);
      alert('Erro ao gerar resumo da ocorrência. Tente novamente.');
    }
  };


  const handleFileUpload = async (urls: string | string[], type: 'attachment' | 'exitVideo' | 'deviceDocumentation' | 'additionalDocuments') => {
    try {
      if (type === 'attachment') {
        const urlList = Array.isArray(urls) ? urls : [urls];
        const newAttachments: Attachment[] = urlList.map(url => ({
          id: Math.random().toString(36).substr(2, 9),
          name: getFileNameFromPath(url),
          type: 'application/octet-stream', // Generic
          url,
          timestamp: Date.now()
        }));

        const updatedTicket: Ticket = {
          ...ticket,
          attachments: [...(ticket.attachments || []), ...newAttachments],
          updatedAt: Date.now()
        };
        await ticketApi.update(ticket.id, updatedTicket);
        onUpdateTicket(updatedTicket);
        addTimelineEntry(ticket.id, 'Arquivo enviado', `Anexado arquivo: ${newAttachments.map(a => a.name).join(', ')}`);
      } else {
        const updatedDevice: Device = {
          ...device,
          mediaFiles: {
            ...device.mediaFiles,
            ...(type === 'exitVideo' ? { exitVideoUrl: urls as string } : {}),
            ...(type === 'deviceDocumentation' ? { deviceDocumentationUrls: urls as string[] } : {}),
            ...(type === 'additionalDocuments' ? { additionalDocumentsUrls: urls as string[] } : {}),
          }
        };
        await deviceApi.update(device.id, updatedDevice);
        onUpdateDevice(updatedDevice);
        addTimelineEntry(ticket.id, 'Arquivo enviado', `Anexo de mídia atualizado: ${type}`);
      }
    } catch (err) {
      console.error('Erro ao processar upload:', err);
      alert('Erro ao vincular arquivo. Tente novamente.');
    }
  };

  const openWhatsApp = () => {
    if (!customer) return;
    const phone = customer.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${customer.name}, estamos atualizando o status do seu aparelho ${device.model}.`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    addTimelineEntry(ticket.id, 'Aviso Cliente', 'Enviado aviso via WhatsApp');
  };

  const age = getTicketAgeDays(ticket.createdAt);

  return (
    <div className="w-full h-full animate-view-enter-active">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-800">OS #{ticket.id.slice(0, 6).toUpperCase()}</h1>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${STATUS_COLORS[ticket.status]}`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">Entrada em {formatDate(ticket.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <button
            onClick={handleGeneratePDF}
            className="flex items-center space-x-2 bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all"
          >
            <FileText size={18} />
            <span className="whitespace-nowrap">Gerar OS</span>
          </button>
          <button
            onClick={handleGenerateSummaryPDF}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all"
          >
            <History size={18} />
            <span className="whitespace-nowrap">Resumo Ocorrência</span>
          </button>
          {customer && (
            <button
              onClick={openWhatsApp}
              className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-600 transition-all"
            >
              <MessageSquare size={18} />
              <span className="whitespace-nowrap">WhatsApp</span>
            </button>
          )}
          <div className="relative group">
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm outline-none appearance-none pr-10"
            >
              {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={toggleSidebar}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all border ${showSidebar
              ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
              }`}
            title={showSidebar ? "Esconder detalhes" : "Mostrar detalhes"}
          >
            <Layout size={18} />
            <span className="hidden md:inline">{showSidebar ? "Ocultar" : "Mostrar"}</span>
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${showSidebar ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        {/* Main Info Column */}
        <div className={`${showSidebar ? 'lg:col-span-2' : 'lg:col-span-1'} space-y-6`}>
          {/* Quick Info Bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-2xl border text-center ${age >= 8 ? 'bg-amber-50 border-amber-100' : 'bg-white'}`}>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tempo em Aberto</p>
              <p className={`text-lg font-bold ${getAgeColorClass(age)}`}>{age} dias</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total de Anexos</p>
              <p className="text-lg font-bold text-slate-800">{(ticket.attachments || []).length}</p>
            </div>
          </div>

          {/* Movimentar Chamado Block */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setIsMovementOpen(!isMovementOpen)}
              className="w-full bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-all text-left"
            >
              <div className="flex items-center space-x-2">
                <Send size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">Movimentar Chamado</h3>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Ações Rápidas</span>
                <ChevronRight size={20} className={`text-slate-400 transition-transform duration-300 ${isMovementOpen ? 'rotate-90' : 'rotate-0'}`} />
              </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMovementOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Novo Status</label>
                    <div className="relative">
                      <select
                        value={movementStatus}
                        onChange={(e) => setMovementStatus(e.target.value as TicketStatus)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm outline-none appearance-none pr-10 focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {movementStatus === TicketStatus.ENVIADO_PARA_TECNICO && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Qual Técnico? *</label>
                      <div className="relative">
                        <select
                          value={targetTechnicianId}
                          onChange={(e) => setTargetTechnicianId(e.target.value)}
                          className="w-full bg-amber-50 border border-amber-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm outline-none appearance-none pr-10 focus:ring-2 focus:ring-amber-500 transition-all"
                        >
                          <option value="">Selecione um técnico...</option>
                          {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {movementStatus === TicketStatus.AGUARDANDO_PECA && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Qual Peça? *</label>
                        <input
                          type="text"
                          value={partName}
                          onChange={e => setPartName(e.target.value)}
                          placeholder="Ex: Tela iPhone 13 OLED"
                          className="w-full bg-amber-50 border border-amber-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Previsão</label>
                        <input
                          type="text"
                          value={forecastDate}
                          onChange={e => setForecastDate(e.target.value)}
                          placeholder="Ex: 2 dias, 25/02..."
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </>
                  )}

                  {movementStatus === TicketStatus.CANCELADO && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Motivo do Cancelamento *</label>
                      <input
                        type="text"
                        value={cancellationReason}
                        onChange={e => setCancellationReason(e.target.value)}
                        placeholder="Descreva o motivo..."
                        className="w-full bg-rose-50 border border-rose-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      />
                    </div>
                  )}

                  {(movementStatus === TicketStatus.PRONTO || movementStatus === TicketStatus.ENTREGUE) && (
                    <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14} /> Informações de Encerramento
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Forma de Devolução</label>
                          <select
                            value={returnMethod}
                            onChange={e => setReturnMethod(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm outline-none"
                          >
                            <option value="Retirada em loja">Retirada em loja</option>
                            <option value="Motoboy entregou">Motoboy entregou</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Resultado Final</label>
                          <select
                            value={resolutionResult}
                            onChange={e => setResolutionResult(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm outline-none"
                          >
                            <option value="Reparado">Reparado</option>
                            <option value="Trocado">Trocado</option>
                            <option value="Sem defeito constatado">Sem defeito constatado</option>
                            <option value="Negado garantia">Negado garantia</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Garantia do Reparo (Dias)</label>
                          <input
                            type="number"
                            value={repairWarrantyDays}
                            onChange={e => setRepairWarrantyDays(parseInt(e.target.value))}
                            className="w-full bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm outline-none"
                          />
                        </div>

                        <div className="flex items-center space-x-3 h-full pt-4">
                          <input
                            type="checkbox"
                            id="delivery_conf"
                            checked={deliveryConfirmed}
                            onChange={e => setDeliveryConfirmed(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="delivery_conf" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                            Confirmação de Entrega / Aceite
                          </label>
                        </div>
                      </div>

                      {deliveryConfirmed && (
                        <div className="mt-2 border-t border-blue-100 pt-4">
                          <SignaturePad onSave={setSignatureUrl} onClear={() => setSignatureUrl('')} />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Observações Finais (Interno)</label>
                        <textarea
                          rows={2}
                          value={finalObservations}
                          onChange={e => setFinalObservations(e.target.value)}
                          placeholder="Observações de encerramento, detalhes do serviço realizado..."
                          className="w-full bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                        />
                      </div>

                      {/* Campos Condicionais: TROCA */}
                      {resolutionResult === 'Trocado' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="md:col-span-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase mb-1">
                            <Smartphone size={14} /> Dados do Aparelho Entregue na Troca
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Modelo</label>
                            <input type="text" value={swapModel} onChange={e => setSwapModel(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs" placeholder="Ex: iPhone 13" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Cor</label>
                            <input type="text" value={swapColor} onChange={e => setSwapColor(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs" placeholder="Ex: Estelar" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Capacidade</label>
                            <input type="text" value={swapStorage} onChange={e => setSwapStorage(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs" placeholder="Ex: 128GB" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">IMEI</label>
                            <input type="text" value={swapImei} onChange={e => setSwapImei(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs" placeholder="IMEI ou Serial" />
                          </div>
                        </div>
                      )}

                      {/* Campos Condicionais: GARANTIA NEGADA */}
                      {resolutionResult === 'Negado garantia' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-rose-50 rounded-xl border border-rose-100">
                          <div className="md:col-span-2 flex items-center gap-2 text-[10px] font-bold text-rose-600 uppercase mb-1">
                            <ShieldAlert size={14} /> Detalhes da Negativa e Reparo Pago
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Custo do Reparo (R$)</label>
                            <input type="number" value={denialCost} onChange={e => setDenialCost(Number(e.target.value))} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Forma de Pagamento</label>
                            <input type="text" value={denialPaymentMethod} onChange={e => setDenialPaymentMethod(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs" placeholder="Ex: Pix, Cartão" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Comentário da Movimentação</label>
                  <textarea
                    rows={2}
                    value={movementComment}
                    onChange={e => setMovementComment(e.target.value)}
                    placeholder="Informações relevantes sobre este passo..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleMovementFileUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all ${movementAttachment ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      {movementAttachment ? <CheckCircle2 size={18} /> : <Camera size={18} />}
                      <span className="text-sm font-bold truncate">
                        {movementAttachment ? movementAttachment.name : 'Anexo Opcional (Foto/Print)'}
                      </span>
                      {movementAttachment && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setMovementAttachment(null); }}
                          className="ml-2 p-1 hover:bg-emerald-100 rounded-md"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleMovement}
                    disabled={isMoving}
                    className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isMoving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Confirmar Movimentação</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'timeline' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Clock size={16} />
              <span>Linha do Tempo</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'info' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Info size={16} />
              <span>Info Detalhada</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'files' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Paperclip size={16} />
              <span>Arquivos</span>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'terms' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <FileText size={16} />
              <span>Termos</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
            {activeTab === 'timeline' && (
              <>
                <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px]">
                  {localTimeline.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
                      <Clock size={48} className="mb-2 opacity-20" />
                      <p>Nenhum histórico registrado para esta ordem.</p>
                    </div>
                  ) : (
                    localTimeline.map((entry, idx) => (
                      <div key={entry.id} className="relative flex space-x-4 group">
                        {idx !== localTimeline.length - 1 && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-100 -translate-x-1/2" />
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ${entry.action.includes('Status') ? 'bg-blue-100 text-blue-600' :
                          entry.action === 'Comentário' ? 'bg-purple-100 text-purple-600' :
                            entry.action === 'Criação' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-slate-100 text-slate-600'
                          }`}>
                          {entry.action.includes('Status') ? <CheckCircle2 size={18} /> :
                            entry.action === 'Comentário' ? <MessageSquare size={18} /> :
                              <Info size={18} />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{entry.action}</span>
                            <span className="text-[10px] text-slate-400">{formatDate(entry.timestamp)}</span>
                          </div>
                          <p className="text-slate-800 font-medium whitespace-pre-wrap">{entry.description}</p>

                          {/* Timeline Attachment */}
                          {entry.attachmentUrl && (
                            <div className="mt-3 flex items-center p-3 bg-slate-50 rounded-xl border border-slate-200 group/att cursor-pointer hover:bg-slate-100 transition-all max-w-sm"
                              onClick={() => handlePreviewFile(entry.attachmentUrl!, entry.attachmentName || 'Anexo')}>
                              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 group-hover/att:text-blue-600 transition-colors">
                                <Paperclip size={16} />
                              </div>
                              <div className="ml-3 flex-1 overflow-hidden">
                                <p className="text-xs font-bold text-slate-700 truncate">{entry.attachmentName || 'Anexo da movimentação'}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Clique para visualizar</p>
                              </div>
                              <ExternalLink size={14} className="text-slate-300 group-hover/att:text-blue-500" />
                            </div>
                          )}

                          <div className="flex items-center mt-2 space-x-1">
                            <UserIcon size={12} className="text-slate-400" />
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">{entry.userName}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Internal Comment Input */}
                <div className="p-4 border-t bg-slate-50 flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      rows={2}
                      placeholder="Adicionar observação interna..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none resize-none bg-white focus:ring-2 focus:ring-blue-500"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={!comment.trim()}
                    className="p-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </>
            )}

            {activeTab === 'info' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Informações Detalhadas</h3>
                  <button
                    onClick={() => {
                      if (isEditingInfo) {
                        handleUpdateBasicInfo();
                      } else {
                        setIsEditingInfo(true);
                      }
                    }}
                    className={`flex items-center space-x-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all ${isEditingInfo ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'}`}
                  >
                    {isEditingInfo ? (<><CheckCircle size={14} /> <span>Salvar Alterações</span></>) : (<><Wrench size={14} /> <span>Editar Informações</span></>)}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Recent Attachments Highlight */}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <h4 className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                          <Paperclip size={16} className="text-blue-600" />
                          <span>Anexos Recentes</span>
                        </h4>
                        <button
                          onClick={() => setActiveTab('files')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Ver todos ({ticket.attachments.length})
                        </button>
                      </div>

                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent relative z-10">
                        {ticket.attachments.slice(0, 6).map(file => (
                          <div
                            key={file.id}
                            onClick={() => handlePreviewFile(file.url, file.name)}
                            className="shrink-0 w-24 h-24 relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group cursor-pointer hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                          >
                            {file.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                <FileText size={24} className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                                <p className="text-[9px] text-center font-bold text-slate-500 truncate w-full px-1">{file.name}</p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ExternalLink size={16} className="text-white drop-shadow-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Diagnosis Card */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <div className="flex items-center space-x-2 mb-3 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span>Defeito Relatado / Diagnóstico</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic text-sm">"{ticket.description}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Device Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 flex items-center space-x-2">
                          <Smartphone size={18} className="text-blue-500" />
                          <span>Aparelho</span>
                        </h4>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase">{device.type}</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Marca / Modelo</span>
                          <span className="text-xs font-bold text-slate-800">{device.brand} {device.model}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">IMEI / Serial</span>
                          <span className="text-xs font-mono font-bold text-slate-800">{device.imeiOrSerial}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Cor / Estocagem</span>
                          <span className="text-xs font-bold text-slate-800">{device.color}{device.storage ? ` / ${device.storage}` : ''}</span>
                        </div>
                        <div className="h-px bg-slate-100 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Senha da Tela</span>
                          {isEditingInfo ? (
                            <input
                              type="text"
                              className="text-xs border rounded-lg px-2 py-1 w-32 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={editScreenPassword}
                              onChange={e => setEditScreenPassword(e.target.value)}
                            />
                          ) : (
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{device.screenPassword || 'Não informada'}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Saúde Bateria</span>
                          {isEditingInfo ? (
                            <input
                              type="text"
                              className="text-xs border rounded-lg px-2 py-1 w-20 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={editBatteryHealth}
                              onChange={e => setEditBatteryHealth(e.target.value)}
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-800">{device.batteryHealth || '---'}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Tipo da Demanda</span>
                          {isEditingInfo ? (
                            <select
                              className="text-xs border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={editIsReturn ? 'true' : 'false'}
                              onChange={e => setEditIsReturn(e.target.value === 'true')}
                            >
                              <option value="false">Nova Venda/Conserto</option>
                              <option value="true">Retorno Garantia</option>
                            </select>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${device.isReturn ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {device.isReturn ? 'Garantia' : 'Nova Ordem'}
                            </span>
                          )}
                        </div>
                        {device.accessories && (
                          <div className="mt-2 pt-2 border-t border-slate-50">
                            <span className="text-xs text-slate-500 block mb-1">Acessórios Coletados:</span>
                            <p className="text-xs font-medium text-slate-700">{device.accessories}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Customer Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 flex items-center space-x-2">
                          <UserIcon size={18} className="text-emerald-500" />
                          <span>Cliente</span>
                        </h4>
                        {customer && (
                          <div className="flex space-x-1">
                            <a href={`tel:${customer.phone}`} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"><Phone size={14} /></a>
                            <a href={`mailto:${customer.email}`} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"><Mail size={14} /></a>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Nome</span>
                          <span className="text-xs font-bold text-slate-800">{customer?.name || 'Interno / Estoque'}</span>
                        </div>
                        {customer ? (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">Telefone</span>
                              <span className="text-xs font-bold text-slate-800">{formatPhone(customer.phone)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">E-mail</span>
                              <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{customer.email || '---'}</span>
                            </div>
                            <div className="h-px bg-slate-100 my-2" />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">CPF</span>
                              <span className="text-xs font-bold text-slate-800">{customer.cpf || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">CEP</span>
                              {isEditingInfo ? (
                                <input
                                  type="text"
                                  className="text-xs border rounded-lg px-2 py-1 w-24 focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editZipCode}
                                  onChange={e => setEditZipCode(e.target.value)}
                                />
                              ) : (
                                <span className="text-xs font-bold text-slate-800">{customer.zipCode || '---'}</span>
                              )}
                            </div>
                            {customer.observations && (
                              <div className="mt-2 pt-2 border-t border-slate-50">
                                <span className="text-xs text-slate-500 block mb-1">Notas do Cliente:</span>
                                <p className="text-xs font-medium text-slate-700">{customer.observations}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="pt-2">
                            <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl">Dispositivo registrado internamente.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrival Condition & Loaner & Support Data Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Arrival Condition */}
                    {device.conditionOnArrival && (
                      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Camera size={14} /> Condição na Chegada
                        </h4>
                        <div className="space-y-2">
                          {[
                            { label: 'Tela Inteira', val: device.conditionOnArrival.screenOk },
                            { label: 'Carcaça OK', val: device.conditionOnArrival.caseOk },
                            { label: 'Câmera OK', val: device.conditionOnArrival.cameraOk },
                            { label: 'Sem Impacto', val: !device.conditionOnArrival.impactSigns },
                            { label: 'Sem Oxidação', val: !device.conditionOnArrival.liquidDamageSigns },
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">{item.label}</span>
                              <span className={`font-bold ${item.val ? 'text-emerald-600' : 'text-rose-600'}`}>{item.val ? 'Sim' : 'Não'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Support Data */}
                    {device.supportEntryData && (
                      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <History size={14} /> Entrada no Suporte
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-slate-500">Data Entrada:</span> <span className="font-bold text-slate-800">{formatDateOnly(device.supportEntryData.entryDate)}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Recebido por:</span> <span className="font-bold text-slate-800">{device.supportEntryData.receivedBy || '---'}</span></div>
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="text-slate-500">Prazo Estimado:</span>
                            <span className="font-bold text-blue-600">{device.supportEntryData.estimatedDeadline ? formatDateOnly(device.supportEntryData.estimatedDeadline) : '---'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loaner Device */}
                    {device.loanerDevice && device.loanerDevice.hasLoaner && (
                      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
                        <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Shield size={14} /> Aparelho Reserva
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-amber-800/60">Modelo:</span> <span className="font-bold text-amber-900">{device.loanerDevice.model}</span></div>
                          <div className="flex justify-between"><span className="text-amber-800/60">IMEI:</span> <span className="font-mono font-bold text-amber-900">{device.loanerDevice.imei}</span></div>
                          <div className="flex items-center space-x-2 mt-3 p-2 bg-white/50 rounded-lg">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">Termo Assinado</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Purchase & Warranties Row */}
                  {(device.purchaseDate || device.supplierName || device.stockEntryDate) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Sale Warranty */}
                      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Garantia da Venda</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-slate-500">Data Compra:</span> <span className="font-bold text-slate-800">{device.purchaseDate ? formatDateOnly(device.purchaseDate) : '---'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Meses Garantia:</span> <span className="font-bold text-slate-800">{device.warrantyPeriodMonths || '---'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Vencimento:</span> <span className={`font-bold ${device.warrantyEndDate && device.warrantyEndDate > Date.now() ? 'text-emerald-600' : 'text-rose-600'}`}>{device.warrantyEndDate ? formatDateOnly(device.warrantyEndDate) : '---'}</span></div>
                        </div>
                      </div>

                      {/* Supplier Warranty */}
                      <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100">
                        <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-4">Garantia Fornecedor</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-slate-500">Fornecedor:</span> <span className="font-bold text-slate-800">{device.supplierName || '---'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Entrada Estoque:</span> <span className="font-bold text-slate-800">{device.stockEntryDate ? formatDateOnly(device.stockEntryDate) : '---'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Vencimento:</span> <span className={`font-bold ${device.supplierWarrantyEndDate && device.supplierWarrantyEndDate > Date.now() ? 'text-emerald-600' : 'text-rose-600'}`}>{device.supplierWarrantyEndDate ? formatDateOnly(device.supplierWarrantyEndDate) : '---'}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resolution Details (If Resolved) */}
                  {ticket.resolvedAt && (
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle size={80} className="text-emerald-900" />
                      </div>
                      <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Detalhes do Encerramento
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="space-y-1">
                          <span className="text-[10px] text-emerald-800/60 uppercase font-bold">Data de Entrega</span>
                          <p className="text-sm font-bold text-emerald-900">{formatDate(ticket.resolvedAt)}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-emerald-800/60 uppercase font-bold">Resolução</span>
                          <p className="font-bold text-emerald-900">{ticket.resolutionResult}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-emerald-800/60 uppercase font-bold">Garantia</span>
                          <p className="font-bold text-emerald-900">{ticket.repairWarrantyDays} dias</p>
                        </div>
                        {ticket.signatureUrl && (
                          <div className="md:col-span-3 pt-4 border-t border-emerald-200/50">
                            <span className="text-[10px] text-emerald-800/60 uppercase font-bold block mb-2">Assinatura do Cliente</span>
                            <img src={ticket.signatureUrl} alt="Assinatura" className="h-20 object-contain bg-white/70 rounded-xl px-4 py-2 border border-emerald-200" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'files' && (
              <div className="p-6 space-y-8">
                {/* General Attachments */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Paperclip size={16} /> Anexos Gerais (Fotos/Documentos)
                  </h3>
                  <FileUploader
                    label="Adicionar Novos Anexos"
                    multiple
                    onUploadComplete={(urls) => handleFileUpload(urls, 'attachment')}
                  />

                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                      {ticket.attachments.map(file => (
                        <div key={file.id} className="group relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 aspect-square shadow-sm hover:shadow-md transition-all">
                          {file.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                              <FileText size={24} className="text-slate-400 mb-2" />
                              <p className="text-[10px] text-center font-bold text-slate-500 truncate w-full px-2">{file.name}</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handlePreviewFile(file.url, file.name)}
                              className="p-2 bg-white rounded-xl text-slate-800 hover:bg-blue-50 transition-colors shadow-lg"
                              title="Visualizar"
                            >
                              <ExternalLink size={16} />
                            </button>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-xl text-slate-800 hover:bg-emerald-50 transition-colors shadow-lg" title="Baixar">
                              <Download size={16} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Movement Attachments */}
                {localTimeline.some(e => e.attachmentUrl) && (
                  <div className="border-t pt-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <History size={16} /> Anexos de Movimentações (Status)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {localTimeline.filter(e => e.attachmentUrl).map(entry => (
                        <div key={entry.id} className="group relative rounded-2xl border border-blue-100 overflow-hidden bg-blue-50/30 aspect-square shadow-sm hover:shadow-md transition-all">
                          {entry.attachmentUrl!.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={entry.attachmentUrl} alt={entry.attachmentName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                              <Paperclip size={24} className="text-blue-400 mb-2" />
                              <p className="text-[10px] text-center font-bold text-blue-600 truncate w-full px-2">{entry.attachmentName || 'Anexo'}</p>
                            </div>
                          )}
                          <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 to-transparent">
                            <p className="text-[8px] font-bold text-white uppercase truncate">{entry.action}</p>
                          </div>
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handlePreviewFile(entry.attachmentUrl!, entry.attachmentName || 'Anexo')}
                              className="p-2 bg-white rounded-xl text-slate-800 hover:bg-blue-50 transition-colors"
                              title="Visualizar"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos & Docs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Video size={16} /> Vídeo de Saída (Check-out)
                    </h3>
                    <FileUploader
                      label="Upload do Vídeo de Saída"
                      accept="video/*"
                      type="video"
                      onUploadComplete={(url) => handleFileUpload(url as string, 'exitVideo')}
                    />
                    {device.mediaFiles?.exitVideoUrl && (
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-emerald-500 text-white rounded-lg">
                            <Video size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-800">Vídeo de Check-out Presente</p>
                            <p className="text-[10px] text-emerald-600 uppercase font-bold">Arquivo verificado</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreviewFile(device.mediaFiles.exitVideoUrl, 'Vídeo de Saída')}
                          className="px-3 py-1.5 bg-white text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-all"
                        >
                          Visualizar
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Folder size={16} /> Documentação do Aparelho
                    </h3>
                    <div className="space-y-4">
                      <FileUploader
                        label="Novos Documentos"
                        multiple
                        onUploadComplete={(urls) => handleFileUpload(urls, 'deviceDocumentation')}
                      />
                      {(device.mediaFiles?.deviceDocumentationUrls?.length > 0 || device.mediaFiles?.additionalDocumentsUrls?.length > 0) && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                          <p className="text-xs font-bold text-blue-800 mb-2">Arquivos vinculados ao aparelho:</p>
                          <div className="flex flex-wrap gap-2">
                            {[...(device.mediaFiles?.deviceDocumentationUrls || []), ...(device.mediaFiles?.additionalDocumentsUrls || [])].map((url, i) => (
                              <button
                                key={i}
                                onClick={() => handlePreviewFile(url, `Doc ${i + 1}`)}
                                className="px-2 py-1 bg-white text-[10px] font-bold text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50"
                              >
                                Doc {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Termos e Documentos Gerados</h3>
                  <p className="text-xs text-slate-400 mb-5">Clique em um botão para gerar e baixar o PDF automaticamente preenchido com os dados deste chamado.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Termo de Conserto */}
                    <button
                      onClick={() => generateRepairTermPDF(ticket, activeCustomer, device, currentUser)}
                      className="flex items-start space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 hover:border-blue-400 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-blue-600 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Termo de Conserto / Reparo</p>
                        <p className="text-xs text-slate-500 mt-0.5">Autorização do cliente para execução do serviço</p>
                      </div>
                    </button>

                    {/* Termo de Recebimento em Loja */}
                    <button
                      onClick={() => generateStoreReceiptTermPDF(ticket, activeCustomer, device, currentUser)}
                      className="flex items-start space-x-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl hover:bg-emerald-100 hover:border-emerald-400 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-emerald-600 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Termo de Recebimento em Loja</p>
                        <p className="text-xs text-slate-500 mt-0.5">Cliente entregou o aparelho presencialmente</p>
                      </div>
                    </button>

                    {/* Termo de Recebimento para Suporte Técnico (Novo) */}
                    <button
                      onClick={() => generateTechnicalSupportReceiptTermPDF(ticket, activeCustomer, device, currentUser)}
                      disabled={!customer}
                      className="flex items-start space-x-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-slate-400 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-slate-600 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Termo de Recebimento Técnico</p>
                        <p className="text-xs text-slate-500 mt-0.5">Layout detalhado com condições do aparelho</p>
                      </div>
                    </button>

                    {/* Termo de Entrega ao Cliente */}
                    <button
                      onClick={() => generateClientDeliveryTermPDF(ticket, activeCustomer, device, currentUser)}
                      className="flex items-start space-x-4 p-4 bg-teal-50 border border-teal-200 rounded-2xl hover:bg-teal-100 hover:border-teal-400 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-teal-600 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Termo de Entrega ao Cliente</p>
                        <p className="text-xs text-slate-500 mt-0.5">Retirada do aparelho na loja</p>
                      </div>
                    </button>

                    {/* Termo de Entrega via Motoboy */}
                    <button
                      onClick={() => generateMotoboyDeliveryTermPDF(ticket, activeCustomer, device, currentUser)}
                      className="flex items-start space-x-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl hover:bg-orange-100 hover:border-orange-400 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-orange-500 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Termo de Entrega via Motoboy</p>
                        <p className="text-xs text-slate-500 mt-0.5">Devolução do aparelho por entrega externa</p>
                      </div>
                    </button>

                    {/* Termo de Troca */}
                    <button
                      onClick={() => generateSwapTermPDF(ticket, activeCustomer, device, currentUser)}
                      className="flex items-start space-x-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl hover:bg-purple-100 hover:border-purple-400 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-purple-600 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Termo de Troca</p>
                        <p className="text-xs text-slate-500 mt-0.5">Troca de aparelho defeituoso (garantia)</p>
                      </div>
                    </button>

                    {/* Termo de Ciência e Reparo – Garantia Negada */}
                    <button
                      onClick={() => generateWarrantyDeniedTermPDF(ticket, activeCustomer, device, currentUser)}
                      disabled={!customer}
                      className="flex items-start space-x-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl hover:bg-rose-100 hover:border-rose-400 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-rose-600 text-white rounded-xl group-hover:scale-105 transition-transform shrink-0">
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Garantia Negada / Reparo Pago</p>
                        <p className="text-xs text-slate-500 mt-0.5">Ciência de negativa de garantia e custo</p>
                      </div>
                    </button>

                    {/* Termo de Aparelho Reserva */}
                    <button
                      onClick={() => generateLoanerDeviceTermPDF(ticket, activeCustomer, device, currentUser)}
                      disabled={!device.loanerDevice?.hasLoaner}
                      className={`flex items-start space-x-4 p-4 rounded-2xl border transition-all text-left group ${device.loanerDevice?.hasLoaner
                        ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400'
                        : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        }`}
                    >
                      <div className={`p-2.5 text-white rounded-xl shrink-0 transition-transform ${device.loanerDevice?.hasLoaner ? 'bg-indigo-600 group-hover:scale-105' : 'bg-slate-400'
                        }`}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Termo de Aparelho Reserva</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {device.loanerDevice?.hasLoaner
                            ? 'Empréstimo temporário de equipamento'
                            : 'Nenhum aparelho reserva neste chamado'}
                        </p>
                      </div>
                    </button>

                  </div>

                  <div className="mt-10 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Termo de Ciência Personalizado</h3>
                    <p className="text-xs text-slate-500 mb-4">Escreva abaixo o texto narrativo para o termo. O cabeçalho e assinaturas serão gerados automaticamente.</p>

                    <div className="space-y-4">
                      <textarea
                        rows={6}
                        value={awarenessNarrative}
                        onChange={(e) => setAwarenessNarrative(e.target.value)}
                        placeholder="Ex: O cliente declara que adquiriu o aparelho... Após período de uso, o aparelho apresentou defeito descrito como 'listra verde'..."
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none font-sans"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="include_repair"
                            checked={includeRepairOnAwareness}
                            onChange={e => setIncludeRepairOnAwareness(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="include_repair" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                            Incluir "e Reparo" no título do termo
                          </label>
                        </div>

                        <button
                          onClick={() => {
                            if (!awarenessNarrative.trim()) {
                              alert('Por favor, digite o texto do termo antes de gerar.');
                              return;
                            }
                            generateAwarenessTermPDF(ticket, activeCustomer, device, awarenessNarrative, includeRepairOnAwareness);
                          }}
                          disabled={!customer}
                          className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <FileText size={18} />
                          <span>Gerar Termo de Ciência</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        {showSidebar && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Smartphone size={18} className="text-blue-600" />
                <span>Aparelho</span>
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="font-bold text-slate-800">{device.brand} {device.model}</p>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>IMEI: {device.imeiOrSerial}</p>
                  <p>Cor: {device.color}</p>
                  {device.storage && <p>Armazenamento: {device.storage}</p>}
                  {device.serialNumber && <p>Série: {device.serialNumber}</p>}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs">
                <span className="text-slate-500">Responsável:</span>
                <span className="font-bold text-slate-700">{currentUser.name}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <UserIcon size={18} className="text-blue-600" />
                <span>Cliente</span>
              </h3>
              <div className="space-y-4">
                {customer ? (
                  <>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Nome</p>
                      <p className="font-bold text-slate-800">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Contato</p>
                      <p className="font-bold text-slate-800">{formatPhone(customer.phone)}</p>
                      <p className="text-xs text-slate-500">{customer.email}</p>
                    </div>
                    <button
                      onClick={openWhatsApp}
                      className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                      Chamar no WhatsApp
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">Registro interno / Estoque</p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center space-x-2 text-amber-600 mb-2">
                <AlertTriangle size={20} />
                <span className="font-bold">Aviso de Prazo</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Este aparelho está há {age} dias na oficina. Lembre-se de manter o cliente informado sobre o status de peças.
              </p>
            </div>
          </div>
        )}
      </div>

      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileUrl={previewFile.url}
        fileName={previewFile.name}
      />
    </div>
  );
};

export default TicketDetail;
