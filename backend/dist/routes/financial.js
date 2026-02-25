import { Router } from 'express';
import pool from '../config/database.js';
const router = Router();
// GET /api/financial
router.get('/', async (req, res) => {
    try {
        const { month, year, category, type } = req.query;
        let query = `
      SELECT id, type, category, amount, description, 
             UNIX_TIMESTAMP(date) * 1000 as date,
             customer_id as customerId, ticket_id as ticketId, status,
             UNIX_TIMESTAMP(created_at) * 1000 as createdAt
      FROM financial_transactions 
      WHERE 1=1
    `;
        const params = [];
        if (month && year) {
            query += ` AND MONTH(date) = ? AND YEAR(date) = ?`;
            params.push(month, year);
        }
        if (category) {
            query += ` AND category = ?`;
            params.push(category);
        }
        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }
        query += ` ORDER BY date DESC, created_at DESC`;
        const [rows] = await pool.execute(query, params);
        res.json({ transactions: rows });
    }
    catch (error) {
        console.error('Erro ao buscar transações financeiras:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// POST /api/financial
router.post('/', async (req, res) => {
    try {
        const { id, type, category, amount, description, date, customerId, ticketId, status, userId, userName } = req.body;
        const transactionDate = date ? new Date(date) : new Date();
        await pool.execute(`INSERT INTO financial_transactions (id, type, category, amount, description, date, customer_id, ticket_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, type, category, amount, description || null, transactionDate, customerId || null, ticketId || null, status || 'PAGO']);
        // Log the creation
        if (userId && userName) {
            await pool.execute(`INSERT INTO financial_logs (id, user_id, user_name, action, transaction_details) VALUES (?, ?, ?, ?, ?)`, [
                Math.random().toString(36).substr(2, 9),
                userId,
                userName,
                'CREATE',
                JSON.stringify({ id, type, category, amount, description })
            ]);
        }
        res.status(201).json({
            transaction: { id, type, category, amount, description, date: transactionDate.getTime(), customerId, ticketId, status, createdAt: Date.now() }
        });
    }
    catch (error) {
        console.error('Erro ao criar transação financeira:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// DELETE /api/financial/:id
router.delete('/:id', async (req, res) => {
    try {
        const { userId, userName } = req.query;
        // Get transaction details before deleting
        const [rows] = await pool.execute('SELECT * FROM financial_transactions WHERE id = ?', [req.params.id]);
        const transaction = rows[0];
        await pool.execute('DELETE FROM financial_transactions WHERE id = ?', [req.params.id]);
        // Log the deletion
        if (userId && userName && transaction) {
            await pool.execute(`INSERT INTO financial_logs (id, user_id, user_name, action, transaction_details) VALUES (?, ?, ?, ?, ?)`, [
                Math.random().toString(36).substr(2, 9),
                userId,
                userName,
                'DELETE',
                JSON.stringify(transaction)
            ]);
        }
        res.json({ message: 'Transação excluída com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir transação financeira:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// GET /api/financial/logs
router.get('/logs', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, user_id as userId, user_name as userName, action, transaction_details as details,
                   UNIX_TIMESTAMP(created_at) * 1000 as createdAt
            FROM financial_logs
            ORDER BY created_at DESC
            LIMIT 100
        `);
        res.json({ logs: rows });
    }
    catch (error) {
        console.error('Erro ao buscar logs financeiros:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
export default router;
//# sourceMappingURL=financial.js.map