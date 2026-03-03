import React, { useState } from 'react';
import { Search, Filter, Plus, Smartphone, Laptop, Tablet, Box, ChevronRight, CheckCircle2, MoreVertical, X, ClipboardList } from 'lucide-react';
import { Ticket, TicketStatus, Priority, Customer, Device, User } from '../types';
import { STATUS_COLORS, PRIORITY_COLORS, DEVICE_TYPES, PROBLEM_TYPES } from '../constants';
import { getTicketAgeDays, getAgeColorClass, getAgeBgClass, formatDate, getFileNameFromPath } from '../utils';
import { customerApi, deviceApi, ticketApi, timelineApi } from '../services/api';
import FileUploader from '../components/FileUploader';

interface TicketListProps {
  tickets: Ticket[];
  customers: Customer[];
  devices: Device[];
  onViewTicket: (id: string) => void;
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  addTimelineEntry: (ticketId: string, action: string, description: string) => void;
  currentUser: User;
}

const TicketList: React.FC<TicketListProps> = ({
  tickets,
  customers,
  devices,
  onViewTicket,
  setTickets,
  setCustomers,
  setDevices,
  addTimelineEntry,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pendentes' | 'finalizados' | 'all'>('pendentes');
  const [loanerFilter, setLoanerFilter] = useState<boolean | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter Logic
  const filteredTickets = tickets.filter(t => {
    const customer = customers.find(c => c.id === t.customerId);
    const device = devices.find(d => d.id === t.deviceId);
    const matchesSearch =
      (t.problemType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer ? (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) : 'interno/estoque'.includes(searchTerm.toLowerCase())) ||
      (device?.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device?.imeiOrSerial || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isFinished = t.status === TicketStatus.ENTREGUE || t.status === TicketStatus.CANCELADO || t.status === TicketStatus.PRONTO;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pendentes' && !isFinished) ||
      (statusFilter === 'finalizados' && isFinished);

    const matchesLoaner = loanerFilter === 'all' ||
      (loanerFilter === true && device?.loanerDevice?.hasLoaner) ||
      (loanerFilter === false && !device?.loanerDevice?.hasLoaner);

    return matchesSearch && matchesStatus && matchesLoaner;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'celular': return <Smartphone size={16} />;
      case 'notebook': return <Laptop size={16} />;
      case 'tablet': return <Tablet size={16} />;
      default: return <Box size={16} />;
    }
  };

  const NewTicketModal = () => {
    const [step, setStep] = useState(1);
    const [isSimple, setIsSimple] = useState(false);
    const [formData, setFormData] = useState({
      // Dados do cliente
      selectedCustomerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerCpf: '',
      customerContactName: '',
      customerPhoneSecondary: '',
      customerPhoneSecondaryType: 'CLIENTE',
      customerPhoneType: 'CLIENTE',
      customerZipCode: '',
      customerObservations: '',
      customerAdditionalNotes: '',
      // Dados do dispositivo
      deviceType: DEVICE_TYPES[0],
      deviceBrand: '',
      deviceModel: '',
      deviceImeiOrSerial: '',
      deviceColor: '',
      deviceStorage: '',
      deviceSerialNumber: '',
      deviceScreenPassword: '',
      deviceBatteryHealth: '',
      deviceIsReturn: false,
      deviceConditionOnArrival: {
        screenOk: undefined,
        caseOk: undefined,
        cameraOk: undefined,
        impactSigns: undefined,
        liquidDamageSigns: undefined,
      },
      deviceSupportEntryData: {
        entryDate: Date.now(),
        entryMethod: 'loja',
        receivedBy: '',
        priority: 'media',
        estimatedDeadline: '',
      },
      deviceLoanerDevice: {
        hasLoaner: false,
        model: '',
        imei: '',
        deliveryDate: '',
        liabilityTerm: false,
      },
      deviceMediaFiles: {
        entryVideoUrl: '',
        exitVideoUrl: '',
        deviceDocumentationUrls: [],
        additionalDocumentsUrls: [],
      },
      deviceAccessories: '',
      deviceObservations: '',
      // Dados da Compra e Garantias
      purchaseDate: '',
      warrantyPeriodMonths: '',
      supplierName: '',
      stockEntryDate: '',
      supplierWarrantyMonths: '',
      // Problema e descrição
      problemType: PROBLEM_TYPES[0],
      description: '',
    });

    const handleSubmit = async () => {
      try {
        let customerId = formData.selectedCustomerId;

        // Se não tiver cliente selecionado e não for simples, criar novo
        if (!customerId && !isSimple) {
          customerId = Math.random().toString(36).substr(2, 9);

          // Criar cliente na API
          const customerData = {
            id: customerId,
            name: formData.customerName,
            phone: formData.customerPhone,
            phoneType: formData.customerPhoneType || 'CLIENTE',
            contactName: formData.customerContactName,
            phoneSecondary: formData.customerPhoneSecondary,
            phoneSecondaryType: formData.customerPhoneSecondaryType || 'CLIENTE',
            cpf: formData.customerCpf,
            zipCode: formData.customerZipCode,
            email: formData.customerEmail,
            contactObservations: formData.customerObservations,
            observations: formData.customerAdditionalNotes,
          };
          const custRes = await customerApi.create(customerData);
          setCustomers(prev => [...prev, custRes.customer]);
        }

        const effectiveCustomerId = isSimple ? undefined : customerId;

        const newDeviceId = Math.random().toString(36).substr(2, 9);
        const newTicketId = Math.random().toString(36).substr(2, 9);

        // Criar dispositivo na API
        const deviceData = {
          id: newDeviceId,
          customerId: effectiveCustomerId,
          type: formData.deviceType,
          brand: formData.deviceBrand,
          model: formData.deviceModel,
          imeiOrSerial: formData.deviceImeiOrSerial,
          color: formData.deviceColor,
          storage: formData.deviceStorage,
          serialNumber: formData.deviceSerialNumber,
          screenPassword: formData.deviceScreenPassword,
          batteryHealth: formData.deviceBatteryHealth,
          isReturn: formData.deviceIsReturn,
          conditionOnArrival: formData.deviceConditionOnArrival,
          supportEntryData: {
            entryDate: formData.deviceSupportEntryData.entryDate,
            entryMethod: formData.deviceSupportEntryData.entryMethod,
            receivedBy: formData.deviceSupportEntryData.receivedBy,
            priority: formData.deviceSupportEntryData.priority,
            estimatedDeadline: formData.deviceSupportEntryData.estimatedDeadline ? new Date(formData.deviceSupportEntryData.estimatedDeadline).getTime() : undefined,
          },
          loanerDevice: {
            hasLoaner: formData.deviceLoanerDevice.hasLoaner,
            model: formData.deviceLoanerDevice.model,
            imei: formData.deviceLoanerDevice.imei,
            deliveryDate: formData.deviceLoanerDevice.deliveryDate ? new Date(formData.deviceLoanerDevice.deliveryDate).getTime() : undefined,
            liabilityTerm: formData.deviceLoanerDevice.liabilityTerm,
          },
          mediaFiles: {
            entryVideo: formData.deviceMediaFiles.entryVideoUrl,
            exitVideo: formData.deviceMediaFiles.exitVideoUrl,
            deviceDocumentation: formData.deviceMediaFiles.deviceDocumentationUrls,
            additionalDocuments: formData.deviceMediaFiles.additionalDocumentsUrls,
          },
          accessories: formData.deviceAccessories,
          observations: formData.deviceObservations,
          // Dados da Compra e Garantias
          purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).getTime() : undefined,
          warrantyPeriodMonths: formData.warrantyPeriodMonths ? parseInt(formData.warrantyPeriodMonths) : undefined,
          supplierName: formData.supplierName,
          stockEntryDate: formData.stockEntryDate ? new Date(formData.stockEntryDate).getTime() : undefined,
          supplierWarrantyMonths: formData.supplierWarrantyMonths ? parseInt(formData.supplierWarrantyMonths) : undefined,
        };
        const devRes = await deviceApi.create(deviceData);
        setDevices(prev => [...prev, devRes.device]);

        // Criar ticket na API
        const ticketData = {
          id: newTicketId,
          customerId: effectiveCustomerId,
          deviceId: newDeviceId,
          problemType: formData.problemType,
          description: formData.description,
          priority: Priority.MEDIUM,
          status: TicketStatus.RECEBIDO_EM_LOJA,
          technicianId: currentUser.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          attachments: [],
        };
        const response = await ticketApi.create(ticketData);

        // Atualizar estado local
        setTickets(prev => [response.ticket, ...prev]);

        // Adicionar entrada na timeline
        await timelineApi.create({
          id: Math.random().toString(36).substr(2, 9),
          ticketId: newTicketId,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'Criação',
          description: `Ordem de serviço aberta por ${currentUser.name}`,
          timestamp: Date.now(),
        });

        setIsModalOpen(false);
      } catch (err) {
        console.error('Erro ao criar ticket:', err);
        alert('Erro ao criar ocorrência. Tente novamente.');
      }
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-start md:items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-none md:max-h-[90vh] my-auto">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-800">Nova Ocorrência</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1 hover:text-slate-600"><X size={20} /></button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            {step === 1 ? (
              <>
                <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setIsSimple(false)}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${!isSimple ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Com Cliente
                  </button>
                  <button
                    onClick={() => {
                      setIsSimple(true);
                      setStep(2);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${isSimple ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Ocorrência Simples
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dados do Cliente</h3>

                {/* Opção para selecionar cliente existente */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Selecionar Cliente Existente</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.selectedCustomerId || ''}
                    onChange={e => {
                      const selectedId = e.target.value;
                      if (selectedId) {
                        const customer = customers.find(c => c.id === selectedId);
                        if (customer) {
                          setFormData({
                            ...formData,
                            selectedCustomerId: selectedId,
                            customerName: customer.name,
                            customerPhone: customer.phone,
                            customerEmail: customer.email,
                            customerCpf: customer.cpf || '',
                            customerContactName: customer.contactName || '',
                            customerPhoneSecondary: customer.phoneSecondary || '',
                            customerPhoneSecondaryType: customer.phoneSecondaryType || 'CLIENTE',
                            customerPhoneType: customer.phoneType || 'CLIENTE',
                            customerZipCode: customer.zipCode || '',
                            customerObservations: customer.contactObservations || '',
                            customerAdditionalNotes: customer.observations || ''
                          });
                        }
                      } else {
                        setFormData({
                          ...formData,
                          selectedCustomerId: '',
                          customerName: '',
                          customerPhone: '',
                          customerEmail: '',
                          customerCpf: '',
                          customerContactName: '',
                          customerPhoneSecondary: '',
                          customerPhoneSecondaryType: 'CLIENTE',
                          customerPhoneType: 'CLIENTE',
                          customerZipCode: '',
                          customerObservations: '',
                          customerAdditionalNotes: ''
                        });
                      }
                    }}
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">ou</span>
                  </div>
                </div>

                {/* Formulário para criar novo cliente */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: Maria Oliveira"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      disabled={!!formData.selectedCustomerId}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp *</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="(00) 00000-0000"
                        value={formData.customerPhone}
                        onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                        disabled={!!formData.selectedCustomerId}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="exemplo@email.com"
                        value={formData.customerEmail}
                        onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                        disabled={!!formData.selectedCustomerId}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="000.000.000-00"
                        value={formData.customerCpf}
                        onChange={e => setFormData({ ...formData, customerCpf: e.target.value })}
                        disabled={!!formData.selectedCustomerId}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="00000-000"
                        value={formData.customerZipCode}
                        onChange={e => setFormData({ ...formData, customerZipCode: e.target.value })}
                        disabled={!!formData.selectedCustomerId}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Secundário</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="(00) 00000-0000"
                        value={formData.customerPhoneSecondary}
                        onChange={e => setFormData({ ...formData, customerPhoneSecondary: e.target.value })}
                        disabled={!!formData.selectedCustomerId}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo do WhatsApp</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.customerPhoneType}
                        onChange={e => setFormData({ ...formData, customerPhoneType: e.target.value })}
                        disabled={!!formData.selectedCustomerId}
                      >
                        <option value="CLIENTE">Cliente</option>
                        <option value="FAMILIAR">Familiar</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo do Secundário</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.customerPhoneSecondaryType}
                        onChange={e => setFormData({ ...formData, customerPhoneSecondaryType: e.target.value })}
                        disabled={!!formData.selectedCustomerId}
                      >
                        <option value="CLIENTE">Cliente</option>
                        <option value="FAMILIAR">Familiar</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Contato</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nome de quem atende"
                      value={formData.customerContactName}
                      onChange={e => setFormData({ ...formData, customerContactName: e.target.value })}
                      disabled={!!formData.selectedCustomerId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observações do Contato</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Ex: preferir ligar à noite, mora com familiar etc."
                      value={formData.customerObservations}
                      onChange={e => setFormData({ ...formData, customerObservations: e.target.value })}
                      disabled={!!formData.selectedCustomerId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observações Adicionais</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Observações gerais sobre o cliente"
                      value={formData.customerAdditionalNotes}
                      onChange={e => setFormData({ ...formData, customerAdditionalNotes: e.target.value })}
                      disabled={!!formData.selectedCustomerId}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.customerName || !formData.customerPhone}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Continuar
                </button>
              </>
            ) : step === 2 ? (
              <>
                {isSimple && (
                  <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => {
                        setIsSimple(false);
                        setStep(1);
                      }}
                      className="flex-1 py-2 px-4 rounded-lg font-bold text-sm text-slate-500 hover:text-slate-700 transition-all"
                    >
                      Com Cliente
                    </button>
                    <button
                      disabled
                      className="flex-1 py-2 px-4 rounded-lg font-bold text-sm bg-white text-blue-600 shadow-sm transition-all"
                    >
                      Ocorrência Simples
                    </button>
                  </div>
                )}
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dados do Aparelho</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      value={formData.deviceType}
                      onChange={e => setFormData({ ...formData, deviceType: e.target.value })}
                    >
                      {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: Apple, Samsung"
                      value={formData.deviceBrand}
                      onChange={e => setFormData({ ...formData, deviceBrand: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: iPhone 13 Pro"
                      value={formData.deviceModel}
                      onChange={e => setFormData({ ...formData, deviceModel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Armazenamento</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: 128GB"
                      value={formData.deviceStorage}
                      onChange={e => setFormData({ ...formData, deviceStorage: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">IMEI</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: 123456789012345"
                      value={formData.deviceImeiOrSerial}
                      onChange={e => setFormData({ ...formData, deviceImeiOrSerial: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Número de Série</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: C123456789"
                      value={formData.deviceSerialNumber}
                      onChange={e => setFormData({ ...formData, deviceSerialNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Senha da Tela</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Senha do cliente"
                      value={formData.deviceScreenPassword}
                      onChange={e => setFormData({ ...formData, deviceScreenPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Saúde da Bateria (%)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: 85%"
                      value={formData.deviceBatteryHealth}
                      onChange={e => setFormData({ ...formData, deviceBatteryHealth: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cor</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: Preto, Branco"
                      value={formData.deviceColor}
                      onChange={e => setFormData({ ...formData, deviceColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Acessórios</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: Carregador, Capinha"
                      value={formData.deviceAccessories}
                      onChange={e => setFormData({ ...formData, deviceAccessories: e.target.value })}
                    />
                  </div>
                </div>

                {/* Condição na chegada */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-bold text-slate-600 mb-3">Condição na Chegada</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="screenOk"
                        className="w-5 h-5 text-blue-600 rounded"
                        checked={formData.deviceConditionOnArrival.screenOk === true}
                        onChange={e => setFormData({ ...formData, deviceConditionOnArrival: { ...formData.deviceConditionOnArrival, screenOk: e.target.checked } })}
                      />
                      <label htmlFor="screenOk" className="text-sm font-medium text-slate-700">Tela ok?</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="caseOk"
                        className="w-5 h-5 text-blue-600 rounded"
                        checked={formData.deviceConditionOnArrival.caseOk === true}
                        onChange={e => setFormData({ ...formData, deviceConditionOnArrival: { ...formData.deviceConditionOnArrival, caseOk: e.target.checked } })}
                      />
                      <label htmlFor="caseOk" className="text-sm font-medium text-slate-700">Carcaça ok?</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="cameraOk"
                        className="w-5 h-5 text-blue-600 rounded"
                        checked={formData.deviceConditionOnArrival.cameraOk === true}
                        onChange={e => setFormData({ ...formData, deviceConditionOnArrival: { ...formData.deviceConditionOnArrival, cameraOk: e.target.checked } })}
                      />
                      <label htmlFor="cameraOk" className="text-sm font-medium text-slate-700">Câmera ok?</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="impactSigns"
                        className="w-5 h-5 text-blue-600 rounded"
                        checked={formData.deviceConditionOnArrival.impactSigns === true}
                        onChange={e => setFormData({ ...formData, deviceConditionOnArrival: { ...formData.deviceConditionOnArrival, impactSigns: e.target.checked } })}
                      />
                      <label htmlFor="impactSigns" className="text-sm font-medium text-slate-700">Sinais de impacto?</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="liquidDamageSigns"
                        className="w-5 h-5 text-blue-600 rounded"
                        checked={formData.deviceConditionOnArrival.liquidDamageSigns === true}
                        onChange={e => setFormData({ ...formData, deviceConditionOnArrival: { ...formData.deviceConditionOnArrival, liquidDamageSigns: e.target.checked } })}
                      />
                      <label htmlFor="liquidDamageSigns" className="text-sm font-medium text-slate-700">Sinais de líquido?</label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none resize-none"
                    placeholder="Observações adicionais sobre o aparelho"
                    value={formData.deviceObservations}
                    onChange={e => setFormData({ ...formData, deviceObservations: e.target.value })}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 font-bold text-slate-500">Voltar</button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.deviceType || !formData.deviceModel}
                    className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-colors disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : step === 3 ? (
              <>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dados da Compra e Garantias</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data da Compra</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      value={formData.purchaseDate}
                      onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prazo Garantia (meses)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: 90 dias = 3 meses"
                      value={formData.warrantyPeriodMonths}
                      onChange={e => setFormData({ ...formData, warrantyPeriodMonths: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Ex: Distribuidora ABC"
                      value={formData.supplierName}
                      onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Entrada Estoque</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      value={formData.stockEntryDate}
                      onChange={e => setFormData({ ...formData, stockEntryDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Garantia Fornecedor (meses)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                    placeholder="Ex: 12 meses"
                    value={formData.supplierWarrantyMonths}
                    onChange={e => setFormData({ ...formData, supplierWarrantyMonths: e.target.value })}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 font-bold text-slate-500">Voltar</button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : step === 4 ? (
              <>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dados da Entrada no Suporte</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Entrada</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      value={formData.deviceSupportEntryData.entryDate && !isNaN(formData.deviceSupportEntryData.entryDate) ? new Date(formData.deviceSupportEntryData.entryDate).toISOString().split('T')[0] : ''}
                      onChange={e => setFormData({ ...formData, deviceSupportEntryData: { ...formData.deviceSupportEntryData, entryDate: e.target.value ? new Date(e.target.value).getTime() : 0 } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Entrada</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      value={formData.deviceSupportEntryData.entryMethod}
                      onChange={e => setFormData({ ...formData, deviceSupportEntryData: { ...formData.deviceSupportEntryData, entryMethod: e.target.value as 'loja' | 'motoboy' | 'outro' } })}
                    >
                      <option value="loja">Cliente deixou na loja</option>
                      <option value="motoboy">Motoboy buscou</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quem Recebeu</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="Nome do colaborador"
                      value={formData.deviceSupportEntryData.receivedBy}
                      onChange={e => setFormData({ ...formData, deviceSupportEntryData: { ...formData.deviceSupportEntryData, receivedBy: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prazo Previsto</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      value={formData.deviceSupportEntryData.estimatedDeadline && !isNaN(new Date(formData.deviceSupportEntryData.estimatedDeadline).getTime()) ? new Date(formData.deviceSupportEntryData.estimatedDeadline).toISOString().split('T')[0] : ''}
                      onChange={e => setFormData({ ...formData, deviceSupportEntryData: { ...formData.deviceSupportEntryData, estimatedDeadline: e.target.value } })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Demanda</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                    value={formData.deviceIsReturn ? 'true' : 'false'}
                    onChange={e => setFormData({ ...formData, deviceIsReturn: e.target.value === 'true' })}
                  >
                    <option value="false">Nova Demanda</option>
                    <option value="true">Retorno (Garantia/Suporte)</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setStep(3)} className="flex-1 py-4 font-bold text-slate-500">Voltar</button>
                  <button
                    onClick={() => setStep(5)}
                    className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : step === 5 ? (
              <>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aparelho Reserva</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      id="hasLoaner"
                      className="w-5 h-5 text-blue-600 rounded"
                      checked={formData.deviceLoanerDevice.hasLoaner}
                      onChange={e => setFormData({ ...formData, deviceLoanerDevice: { ...formData.deviceLoanerDevice, hasLoaner: e.target.checked } })}
                    />
                    <label htmlFor="hasLoaner" className="text-sm font-medium text-slate-700">Aparelho reserva?</label>
                  </div>

                  {formData.deviceLoanerDevice.hasLoaner && (
                    <div className="space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Modelo do Reserva</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                          placeholder="Ex: iPhone 13"
                          value={formData.deviceLoanerDevice.model}
                          onChange={e => setFormData({ ...formData, deviceLoanerDevice: { ...formData.deviceLoanerDevice, model: e.target.value } })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">IMEI do Reserva</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                          placeholder="Ex: 123456789012345"
                          value={formData.deviceLoanerDevice.imei}
                          onChange={e => setFormData({ ...formData, deviceLoanerDevice: { ...formData.deviceLoanerDevice, imei: e.target.value } })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data de Entrega do Reserva</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                          value={formData.deviceLoanerDevice.deliveryDate}
                          onChange={e => setFormData({ ...formData, deviceLoanerDevice: { ...formData.deviceLoanerDevice, deliveryDate: e.target.value } })}
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          id="liabilityTerm"
                          className="w-5 h-5 text-blue-600 rounded"
                          checked={formData.deviceLoanerDevice.liabilityTerm}
                          onChange={e => setFormData({ ...formData, deviceLoanerDevice: { ...formData.deviceLoanerDevice, liabilityTerm: e.target.checked } })}
                        />
                        <label htmlFor="liabilityTerm" className="text-sm font-medium text-slate-700">Termo de responsabilidade assinado</label>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setStep(4)} className="flex-1 py-4 font-bold text-slate-500">Voltar</button>
                  <button
                    onClick={() => setStep(6)}
                    className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : step === 6 ? (
              <>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Uploads e Anexos</h3>
                <div className="space-y-6">
                  <FileUploader
                    label="Vídeo de Entrada (como chegou)"
                    accept="video/*"
                    type="video"
                    onUploadComplete={(url) => setFormData({
                      ...formData,
                      deviceMediaFiles: { ...formData.deviceMediaFiles, entryVideoUrl: url as string }
                    })}
                  />

                  <FileUploader
                    label="Documentação do Aparelho"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    onUploadComplete={(urls) => setFormData({
                      ...formData,
                      deviceMediaFiles: { ...formData.deviceMediaFiles, deviceDocumentationUrls: urls as string[] }
                    })}
                  />

                  <FileUploader
                    label="Anexos Adicionais (comprovantes, notas, etc.)"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    onUploadComplete={(urls) => setFormData({
                      ...formData,
                      deviceMediaFiles: { ...formData.deviceMediaFiles, additionalDocumentsUrls: urls as string[] }
                    })}
                  />
                </div>
                <div className="flex space-x-3 pt-6 border-t mt-4">
                  <button onClick={() => setStep(5)} className="flex-1 py-4 font-bold text-slate-500">Voltar</button>
                  <button
                    onClick={() => setStep(7)}
                    className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Problema e Descrição</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Problema</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                    value={formData.problemType}
                    onChange={e => setFormData({ ...formData, problemType: e.target.value })}
                  >
                    {PROBLEM_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Problema</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none resize-none"
                    placeholder="Relate o que está acontecendo..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setStep(6)} className="flex-1 py-4 font-bold text-slate-500">Voltar</button>
                  <button
                    onClick={handleSubmit}
                    className="flex-[2] bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-lg transition-colors"
                  >
                    Criar Ordem
                  </button>
                </div>
              </>
            )
            }
          </div >
        </div >
      </div >
    );
  };

  return (
    <div className="space-y-6 animate-view-enter-active pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ocorrências</h1>
          <p className="text-slate-500 text-sm">Gerencie todos os atendimentos ativos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Nova Ocorrência</span>
        </button>
      </header>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente, modelo, IMEI..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <button
                onClick={() => setStatusFilter('pendentes')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'pendentes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setStatusFilter('finalizados')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'finalizados' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Finalizados
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Todos
              </button>
            </div>

            <select
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm text-sm font-medium"
              value={loanerFilter.toString()}
              onChange={e => {
                const val = e.target.value;
                setLoanerFilter(val === 'all' ? 'all' : val === 'true');
              }}
            >
              <option value="all">Aparelhos: Todos</option>
              <option value="true">Com Reserva</option>
              <option value="false">Sem Reserva</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status / OS</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aparelho / Problema</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tempo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map(ticket => {
                const customer = customers.find(c => c.id === ticket.customerId);
                const device = devices.find(d => d.id === ticket.deviceId);
                const ageDays = getTicketAgeDays(ticket.createdAt);

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onViewTicket(ticket.id)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[ticket.status]}`}>
                          {ticket.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">OS-{ticket.id.slice(0, 6)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                          {device?.brand} {device?.model}
                        </span>
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">{ticket.problemType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{customer?.name || 'Interno / Estoque'}</span>
                        <span className="text-[10px] text-slate-500">{customer?.phone || 'Registro simples'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${ageDays >= 15 ? 'bg-rose-100 text-rose-700' : ageDays >= 8 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {ageDays}d
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white">
            <ClipboardList size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma ocorrência encontrada</p>
            <p className="text-sm">Tente ajustar seus filtros de busca</p>
          </div>
        )}
      </div>

      {isModalOpen && <NewTicketModal />}
    </div>
  );
};

const AlertCircle = ({ size, className }: { size?: number, className?: string }) => (
  <svg
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default TicketList;