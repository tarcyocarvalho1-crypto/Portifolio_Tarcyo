require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('@neondatabase/serverless');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o Neon usando a URL do seu arquivo .env
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Rota Pública: Ler os projetos
app.get('/api/projects', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM portfolio_projects ORDER BY order_index ASC');
    res.json({ projects: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar projetos no Neon' });
  }
});

// Rotas Protegidas (Para o Painel Admin)
app.post('/api/projects', async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) return res.status(401).json({ error: 'Negado' });
  const { id, name, category, category_label, status, visible, demo_url, summary, highlights, tags, order_index } = req.body;
  
  try {
    await pool.query(
      `INSERT INTO portfolio_projects (id, name, category, category_label, status, visible, demo_url, summary, highlights, tags, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, name, category, category_label, status, visible, demo_url, summary, JSON.stringify(highlights || []), JSON.stringify(tags || []), order_index || 0]
    );
    res.status(201).json({ message: 'Inserido no Neon!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
  console.log('🚀 Backend rodando localmente em http://localhost:3000');
});