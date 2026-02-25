import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

// GET /api/tickets
router.get('/', async (req, res) => {
  try {
    const [rows] = (await pool.execute(
      `SELECT 
        t.id, t.customer_id as customerId, t.device_id as deviceId, 
        t.problem_type as problemType, t.description, t.priority, t.status,
        t.technician_id as technicianId, UNIX_TIMESTAMP(t.deadline) * 1000 as deadline,
        UNIX_TIMESTAMP(t.resolved_at) * 1000 as resolvedAt,
        t.return_method as returnMethod, t.resolution_result as resolutionResult,
        t.repair_warranty_days as repairWarrantyDays, t.final_observations as finalObservations,
        t.delivery_confirmed as deliveryConfirmed, t.signature_url as signatureUrl,
        t.swap_device_info as swapDeviceInfo, t.warranty_denial_info as warrantyDenialInfo,
        UNIX_TIMESTAMP(t.created_at) * 1000 as createdAt,
        UNIX_TIMESTAMP(t.updated_at) * 1000 as updatedAt
      FROM tickets t 
      ORDER BY t.created_at DESC`
    )) as [any[], any];

    const tickets = rows.map(t => ({ ...t, attachments: [] }));
    res.json({ tickets });
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/tickets/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        t.id, t.customer_id as customerId, t.device_id as deviceId, 
        t.problem_type as problemType, t.description, t.priority, t.status,
        t.technician_id as technicianId, UNIX_TIMESTAMP(t.deadline) * 1000 as deadline,
        UNIX_TIMESTAMP(t.resolved_at) * 1000 as resolvedAt,
        t.return_method as returnMethod, t.resolution_result as resolutionResult,
        t.repair_warranty_days as repairWarrantyDays, t.final_observations as finalObservations,
        t.delivery_confirmed as deliveryConfirmed, t.signature_url as signatureUrl,
        t.swap_device_info as swapDeviceInfo, t.warranty_denial_info as warrantyDenialInfo,
        UNIX_TIMESTAMP(t.created_at) * 1000 as createdAt,
        UNIX_TIMESTAMP(t.updated_at) * 1000 as updatedAt
      FROM tickets t WHERE t.id = ?`,
      [req.params.id]
    );
    const tickets = rows as any[];
    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    res.json({ ticket: { ...tickets[0], attachments: [] } });
  } catch (error) {
    console.error('Erro ao buscar ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/tickets
router.post('/', async (req, res) => {
  try {
    const { id, customerId, deviceId, problemType, description, priority, status, technicianId, deadline } = req.body;

    const deadlineValue = deadline ? new Date(deadline).toISOString().slice(0, 19).replace('T', ' ') : null;

    await pool.execute(
      'INSERT INTO tickets (id, customer_id, device_id, problem_type, description, priority, status, technician_id, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id ?? null, customerId ?? null, deviceId ?? null, problemType ?? null, description ?? null, priority ?? 'Média', status ?? 'Recebido em loja', technicianId || null, deadlineValue]
    );

    res.status(201).json({
      ticket: { id, customerId, deviceId, problemType, description, priority, status, technicianId, deadline, createdAt: Date.now(), updatedAt: Date.now(), attachments: [] }
    });
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/tickets/:id
router.put('/:id', async (req, res) => {
  try {
    const { problemType, description, priority, status, technicianId, deadline } = req.body;

    const deadlineValue = deadline ? new Date(deadline).toISOString().slice(0, 19).replace('T', ' ') : null;

    await pool.execute(
      'UPDATE tickets SET problem_type = ?, description = ?, priority = ?, status = ?, technician_id = ?, deadline = ? WHERE id = ?',
      [problemType ?? null, description ?? null, priority ?? null, status ?? null, technicianId || null, deadlineValue, req.params.id]
    );

    res.json({ message: 'Ticket atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/tickets/move/:id
router.post('/move/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      status, userId, userName, comment, technicianId, partName, forecastDate,
      cancellationReason, attachment,
      returnMethod, resolutionResult, repairWarrantyDays, finalObservations, deliveryConfirmed, signatureUrl,
      swapDeviceInfo, warrantyDenialInfo
    } = req.body;
    const ticketId = req.params.id;

    await connection.beginTransaction();

    // 1. Atualizar o Ticket
    let updateQuery = 'UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const queryParams: any[] = [status];

    if (status === 'Enviado para técnico' && technicianId) {
      updateQuery += ', technician_id = ?';
      queryParams.push(technicianId);
    }

    // Novos campos de encerramento e termos detalhados
    if (status === 'Pronto' || status === 'Entregue ao cliente' || status === 'Troca realizada') {
      updateQuery += ', resolved_at = CURRENT_TIMESTAMP, return_method = ?, resolution_result = ?, repair_warranty_days = ?, final_observations = ?, delivery_confirmed = ?, signature_url = ?, swap_device_info = ?, warranty_denial_info = ?';
      queryParams.push(
        returnMethod || null,
        resolutionResult || null,
        repairWarrantyDays || 0,
        finalObservations || null,
        deliveryConfirmed ? 1 : 0,
        signatureUrl || null,
        swapDeviceInfo ? JSON.stringify(swapDeviceInfo) : null,
        warrantyDenialInfo ? JSON.stringify(warrantyDenialInfo) : null
      );
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(ticketId);

    await connection.execute(updateQuery, queryParams);

    // 2. Criar entrada na Timeline
    const timelineId = `tl_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let fullDescription = comment || '';

    if (status === 'Aguardando peça (São Paulo)' && partName) {
      fullDescription = `Peça: ${partName}${forecastDate ? ` (Previsão: ${forecastDate})` : ''}. ${fullDescription}`;
    } else if (status === 'Cancelado/sem solução' && cancellationReason) {
      fullDescription = `Motivo: ${cancellationReason}. ${fullDescription}`;
    }

    await connection.execute(
      'INSERT INTO timeline_entries (id, ticket_id, user_id, user_name, action, description, attachment_url, attachment_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [timelineId, ticketId, userId, userName, `Status alterado para: ${status}`, fullDescription, attachment?.url || null, attachment?.name || null]
    );

    // 3. Se houver anexo, salvar na tabela attachments
    if (attachment) {
      const attId = `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await connection.execute(
        'INSERT INTO attachments (id, ticket_id, name, type, url) VALUES (?, ?, ?, ?, ?)',
        [attId, ticketId, attachment.name || 'Anexo de Movimentação', attachment.type || 'image/jpeg', attachment.url]
      );
    }

    await connection.commit();
    res.json({ message: 'Movimentação realizada com sucesso' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao movimentar ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    connection.release();
  }
});

// DELETE /api/tickets/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM tickets WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ticket excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
