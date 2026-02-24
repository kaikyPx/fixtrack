import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

// GET /api/timeline/:ticketId
router.get('/:ticketId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        id, ticket_id as ticketId, user_id as userId, user_name as userName,
        action, description, UNIX_TIMESTAMP(timestamp) * 1000 as timestamp,
        attachment_url as attachmentUrl, attachment_name as attachmentName
      FROM timeline_entries 
      WHERE ticket_id = ? 
      ORDER BY timestamp DESC`,
      [req.params.ticketId]
    );
    res.json({ entries: rows });
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/timeline
router.post('/', async (req, res) => {
  try {
    const { id, ticketId, userId, userName, action, description, attachmentUrl, attachmentName } = req.body;

    await pool.execute(
      'INSERT INTO timeline_entries (id, ticket_id, user_id, user_name, action, description, attachment_url, attachment_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, ticketId, userId, userName, action, description, attachmentUrl || null, attachmentName || null]
    );

    res.status(201).json({
      entry: { id, ticketId, userId, userName, action, description, attachmentUrl, attachmentName, timestamp: Date.now() }
    });
  } catch (error) {
    console.error('Erro ao criar entrada na timeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/timeline/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM timeline_entries WHERE id = ?', [req.params.id]);
    res.json({ message: 'Entrada excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir entrada da timeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
