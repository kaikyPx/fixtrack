import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

// GET /api/schedules
router.get('/', async (req, res) => {
    try {
        const [rows] = (await pool.execute(
            `SELECT 
        s.id, s.customer_id as customerId, s.ticket_id as ticketId, 
        s.type, s.method, UNIX_TIMESTAMP(s.scheduled_at) * 1000 as scheduledAt, 
        s.status, s.observations,
        c.name as customerName
      FROM schedules s
      JOIN customers c ON s.customer_id = c.id
      ORDER BY s.scheduled_at ASC`
        )) as [any[], any];

        res.json({ schedules: rows });
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/schedules
router.post('/', async (req, res) => {
    try {
        const { id, customerId, ticketId, type, method, scheduledAt, observations } = req.body;

        const scheduledAtValue = scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 19).replace('T', ' ') : null;

        await pool.execute(
            'INSERT INTO schedules (id, customer_id, ticket_id, type, method, scheduled_at, observations) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, customerId, ticketId || null, type, method, scheduledAtValue, observations || null]
        );

        res.status(201).json({
            schedule: { id, customerId, ticketId, type, method, scheduledAt, status: 'Pendente', observations }
        });
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/schedules/:id
router.put('/:id', async (req, res) => {
    try {
        const { type, method, scheduledAt, status, observations } = req.body;

        const scheduledAtValue = scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 19).replace('T', ' ') : null;

        await pool.execute(
            'UPDATE schedules SET type = ?, method = ?, scheduled_at = ?, status = ?, observations = ? WHERE id = ?',
            [type, method, scheduledAtValue, status, observations || null, req.params.id]
        );

        res.json({ message: 'Agendamento atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM schedules WHERE id = ?', [req.params.id]);
        res.json({ message: 'Agendamento excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
