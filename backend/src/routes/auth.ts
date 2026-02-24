import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, access_level as accessLevel FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    const users = rows as any[];
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, access_level as accessLevel FROM users'
    );
    res.json({ users: rows });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/users - Criar novo usuário (apenas admin)
router.post('/users', async (req, res) => {
  try {
    const { id, name, email, password, accessLevel } = req.body;
    
    if (!id || !name || !email || !password || !accessLevel) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verificar se o email já existe
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if ((existing as any[]).length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    await pool.execute(
      'INSERT INTO users (id, name, email, password, access_level) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, password, accessLevel]
    );
    
    res.status(201).json({ 
      user: { id, name, email, accessLevel } 
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/auth/users/:id - Excluir usuário (apenas admin)
router.delete('/users/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
