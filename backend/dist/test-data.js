const API_URL = 'http://localhost:3001/api';
async function createTestData() {
    const customerId = 'cust_' + Math.random().toString(36).substr(2, 9);
    const deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
    const ticketId = 'tick_' + Math.random().toString(36).substr(2, 9);
    console.log('🚀 Iniciando criação de dados de teste...');
    // 1. Criar Cliente
    const customerResponse = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: customerId,
            name: 'João Francisco da Silva',
            phone: '11988887777',
            phoneType: 'CLIENTE',
            cpf: '12345678901',
            email: 'joao.teste@email.com',
            observations: 'Cliente VIP para teste de termos.'
        })
    });
    if (!customerResponse.ok)
        throw new Error('Falha ao criar cliente: ' + await customerResponse.text());
    console.log('✅ Cliente criado com sucesso!');
    // 2. Criar Dispositivo (com dados completos)
    const deviceResponse = await fetch(`${API_URL}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: deviceId,
            customerId: customerId,
            type: 'Smartphone',
            brand: 'Apple',
            model: 'iPhone 13 Pro Max',
            imeiOrSerial: '358765432109871',
            color: 'Sierra Blue',
            storage: '256GB',
            serialNumber: 'G6TFX0P10MKM',
            accessories: 'Cabo original e capinha MagSafe',
            observations: 'Pequeno risco no canto inferior esquerdo.',
            conditionOnArrival: {
                screenOk: false,
                caseOk: true,
                cameraOk: true,
                impactSigns: true,
                liquidDamageSigns: false
            },
            supportEntryData: {
                entryDate: Date.now(),
                entryMethod: 'loja',
                receivedBy: 'Técnico Admin',
                priority: 'alta',
                estimatedDeadline: Date.now() + (86400000 * 3) // 3 dias
            },
            loanerDevice: {
                hasLoaner: true,
                model: 'iPhone XR',
                imei: '351234567890123',
                deliveryDate: Date.now(),
                liabilityTerm: true
            },
            mediaFiles: {
                entryVideo: '/uploads/entry-test.mp4',
                exitVideo: '',
                deviceDocumentation: ['/uploads/doc1.jpg'],
                additionalDocuments: []
            },
            purchaseDate: Date.now() - (86400000 * 180), // 6 meses atrás
            warrantyPeriodMonths: 12,
            warrantyEndDate: Date.now() + (86400000 * 185),
            supplierName: 'Apple Store SP',
            stockEntryDate: Date.now() - (86400000 * 200)
        })
    });
    if (!deviceResponse.ok)
        throw new Error('Falha ao criar dispositivo: ' + await deviceResponse.text());
    console.log('✅ Dispositivo criado com sucesso!');
    // 3. Criar Ticket (Chamado)
    const ticketResponse = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: ticketId,
            customerId: customerId,
            deviceId: deviceId,
            problemType: 'Reparo de Tela',
            description: 'Tela frontal quebrada após queda. Touch funciona parcialmente.',
            priority: 'Alta',
            status: 'Em andamento',
            technicianId: 'usr_admin_001',
            deadline: Date.now() + (86400000 * 3)
        })
    });
    if (!ticketResponse.ok)
        throw new Error('Falha ao criar ticket: ' + await ticketResponse.text());
    console.log('✅ Chamado (Ticket) criado com sucesso!');
    // 4. Adicionar entrada na timeline
    const timelineResponse = await fetch(`${API_URL}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: 'time_' + Math.random().toString(36).substr(2, 9),
            ticketId: ticketId,
            userId: 'usr_admin_001',
            userName: 'Administrador',
            action: 'Diagnóstico',
            description: 'Aparelho aberto para avaliação interna. Confirmado dano apenas na tela frontal.'
        })
    });
    if (!timelineResponse.ok)
        throw new Error('Falha ao criar timeline: ' + await timelineResponse.text());
    console.log('✅ Entrada na linha do tempo adicionada!');
    console.log('\n✨ Ocorrência completa criada!');
    console.log('ID do Ticket:', ticketId);
    console.log('Nome do Cliente:', 'João Francisco da Silva');
    console.log('Aparelho:', 'iPhone 13 Pro Max');
}
createTestData().catch(err => {
    console.error('❌ Erro ao criar dados de teste:', err.message);
    process.exit(1);
});
export {};
//# sourceMappingURL=test-data.js.map