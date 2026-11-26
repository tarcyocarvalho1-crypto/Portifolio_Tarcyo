const { Pool } = require('@neondatabase/serverless');

export default async function handler(req, res) {
  // 1. SEGURANÇA CORS: Permite apenas as origens autorizadas
  // Substitui pelos teus domínios reais (ex: 'https://tarcyo.dev')
  const allowedOrigins = ['http://localhost:3000', 'https://portifolio-tarcyo.vercel.app', 'https://tarcyo.dev'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responde imediatamente a pedidos de "preflight" (verificações do navegador)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. LIGAÇÃO SEGURA AO BANCO DE DADOS
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // ROTA PÚBLICA: Leitura (Apenas GET)
    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM portfolio_projects ORDER BY order_index ASC');
      return res.status(200).json({ projects: rows });
    }

    // 3. PROTEÇÃO DE ROTAS PRIVADAS (POST, PUT, DELETE)
    const authHeader = req.headers.authorization;
    const adminSecret = process.env.ADMIN_SECRET;

    // Verifica se o token existe e se coincide exatamente com a variável de ambiente
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      // Regista uma tentativa de intrusão nos logs da Vercel
      console.warn(`[SEGURANÇA] Tentativa de acesso bloqueada. IP: ${req.headers['x-forwarded-for'] || 'Desconhecido'}`);
      return res.status(401).json({ error: 'Acesso negado. Credenciais inválidas.' });
    }

    // 4. SANITIZAÇÃO E VALIDAÇÃO DE ENTRADAS
    const { id, name, category, category_label, status, visible, demo_url, summary, highlights, tags, order_index } = req.body;

    // Validação básica: impedir criação sem ID ou Nome
    if ((req.method === 'POST' || req.method === 'PUT') && (!id || !name)) {
      return res.status(400).json({ error: 'Dados incompletos. ID e Nome são obrigatórios.' });
    }

    // INSERIR
    if (req.method === 'POST') {
      // O uso de $1, $2 previne Injeção SQL (SQL Injection) nativamente
      await pool.query(
        `INSERT INTO portfolio_projects (id, name, category, category_label, status, visible, demo_url, summary, highlights, tags, order_index) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [id, name, category, category_label, status, visible, demo_url, summary, JSON.stringify(highlights || []), JSON.stringify(tags || []), order_index || 0]
      );
      return res.status(201).json({ message: 'Projeto inserido com segurança!' });
    }

    // ATUALIZAR
    if (req.method === 'PUT') {
      await pool.query(
        `UPDATE portfolio_projects 
         SET name=$1, category=$2, category_label=$3, status=$4, visible=$5, demo_url=$6, summary=$7, highlights=$8, tags=$9, order_index=$10 
         WHERE id=$11`,
        [name, category, category_label, status, visible, demo_url, summary, JSON.stringify(highlights || []), JSON.stringify(tags || []), order_index || 0, id]
      );
      return res.status(200).json({ message: 'Projeto atualizado com segurança!' });
    }

    // REMOVER
    if (req.method === 'DELETE') {
      const { deleteId } = req.body;
      if (!deleteId) return res.status(400).json({ error: 'ID do projeto não fornecido.' });
      
      await pool.query('DELETE FROM portfolio_projects WHERE id = $1', [deleteId]);
      return res.status(200).json({ message: 'Projeto apagado com sucesso!' });
    }

    // Se o método não for reconhecido, bloqueia a tentativa
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });

  } catch (error) {
    // 5. TRATAMENTO SEGURO DE ERROS (Não expor detalhes da Base de Dados)
    console.error("[ERRO DB]:", error.message);
    return res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
}