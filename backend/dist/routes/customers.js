import { Router } from 'express';
import pool from '../config/database.js';
const router = Router();
// GET /api/customers
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(`SELECT id, name, phone, phone_type as phoneType, contact_name as contactName, 
              phone_secondary as phoneSecondary, phone_secondary_type as phoneSecondaryType,
              cpf, zip_code as zipCode, email, contact_observations as contactObservations, 
              observations, UNIX_TIMESTAMP(created_at) * 1000 as createdAt 
       FROM customers ORDER BY created_at DESC`);
        res.json({ customers: rows });
    }
    catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// GET /api/customers/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`SELECT id, name, phone, phone_type as phoneType, contact_name as contactName, 
              phone_secondary as phoneSecondary, phone_secondary_type as phoneSecondaryType,
              cpf, zip_code as zipCode, email, contact_observations as contactObservations, 
              observations, UNIX_TIMESTAMP(created_at) * 1000 as createdAt 
       FROM customers WHERE id = ?`, [req.params.id]);
        const customers = rows;
        if (customers.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        res.json({ customer: customers[0] });
    }
    catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// POST /api/customers
router.post('/', async (req, res) => {
    try {
        const { id, name, phone, phoneType, contactName, phoneSecondary, phoneSecondaryType, cpf, zipCode, email, contactObservations, observations } = req.body;
        await pool.execute(`INSERT INTO customers (id, name, phone, phone_type, contact_name, phone_secondary, 
                              phone_secondary_type, cpf, zip_code, email, contact_observations, observations) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, name, phone, phoneType || 'CLIENTE', contactName || null, phoneSecondary || null,
            phoneSecondaryType || 'CLIENTE', cpf || null, zipCode || null, email, contactObservations || null, observations || null]);
        res.status(201).json({
            customer: { id, name, phone, phoneType, contactName, phoneSecondary, phoneSecondaryType, cpf, zipCode, email, contactObservations, observations, createdAt: Date.now() }
        });
    }
    catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, phone, phoneType, contactName, phoneSecondary, phoneSecondaryType, cpf, zipCode, email, contactObservations, observations } = req.body;
        await pool.execute(`UPDATE customers SET name = ?, phone = ?, phone_type = ?, contact_name = ?, 
                            phone_secondary = ?, phone_secondary_type = ?, cpf = ?, 
                            zip_code = ?, email = ?, contact_observations = ?, observations = ? 
       WHERE id = ?`, [name, phone, phoneType || 'CLIENTE', contactName || null, phoneSecondary || null,
            phoneSecondaryType || 'CLIENTE', cpf || null, zipCode || null, email, contactObservations || null, observations || null, req.params.id]);
        res.json({
            customer: { id: req.params.id, name, phone, phoneType, contactName, phoneSecondary, phoneSecondaryType, cpf, zipCode, email, contactObservations, observations }
        });
    }
    catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM customers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Cliente excluído com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
export default router;
//# sourceMappingURL=customers.js.map