require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { Pool } = require('@neondatabase/serverless');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by'); // Oculta que o servidor roda Express

// 1. BLOQUEIO DE FICHEIROS SENSÍVEIS (Impede leitura de .env, server.js, package.json)
app.use((req, res, next) => {
  const forbiddenPatterns = [
    /^\/\.env/i,
    /^\/\.git/i,
    /^\/server\.js$/i,
    /^\/package(-lock)?\.json$/i,
    /^\/node_modules/i
  ];
  if (forbiddenPatterns.some((rx) => rx.test(req.path))) {
    return res.status(403).json({ error: 'Acesso proibido.' });
  }
  next();
});

// 2. CORS ESTRITO
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://tarcyo.dev',
  'https://portifolio-tarcyo.vercel.app'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origem não autorizada.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. HEADERS DE SEGURANÇA HTTP (OWASP)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://unpkg.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' http://localhost:3000 https://tarcyo.dev https://portifolio-tarcyo.vercel.app; " +
    "frame-ancestors 'none'; base-uri 'self';"
  );
  next();
});

app.use(express.json({ limit: '50kb' })); // Bloqueia payloads gigantes (DoS)

// 4. RATE LIMITER EM MEMÓRIA (Anti-Spam e Anti-Brute Force)
const rateStore = new Map();
function rateLimiter({ windowMs, maxRequests, blockMs = 0 }) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const record = rateStore.get(key) || { count: 0, resetAt: now + windowMs, blockedUntil: 0 };

    if (record.blockedUntil > now) {
      const waitSec = Math.ceil((record.blockedUntil - now) / 1000);
      return res.status(429).json({ error: `Muitas tentativas. Aguarde ${waitSec}s.` });
    }

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count += 1;
    if (record.count > maxRequests) {
      if (blockMs > 0) record.blockedUntil = now + blockMs;
      rateStore.set(key, record);
      return res.status(429).json({ error: 'Limite de requisições excedido.' });
    }

    rateStore.set(key, record);
    next();
  };
}

// 5. SERVE APENAS AS PASTAS PÚBLICAS PERMITIDAS
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// 6. BANCO DE DADOS NEON POSTGRESQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Comparação segura contra Timing Attacks
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Middleware de autenticação com bloqueio de força bruta (5 erros = 15 min bloqueado)
const failedLogins = new Map();
function requireAdmin(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const attempt = failedLogins.get(ip) || { failures: 0, blockedUntil: 0 };

  if (attempt.blockedUntil > now) {
    return res.status(429).json({ error: 'IP temporariamente bloqueado por tentativas inválidas.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const adminSecret = process.env.ADMIN_SECRET || '';

  if (!adminSecret || !safeCompare(token, adminSecret)) {
    attempt.failures += 1;
    if (attempt.failures >= 5) {
      attempt.blockedUntil = now + 15 * 60 * 1000; // 15 minutos de bloqueio
      attempt.failures = 0;
    }
    failedLogins.set(ip, attempt);
    console.warn(`[ALERTA SEGURANÇA] Falha de auth | IP: ${ip} | Tentativa: ${attempt.failures}`);
    return res.status(401).json({ error: 'Acesso negado.' });
  }

  failedLogins.delete(ip); // Limpa falhas após sucesso
  return next();
}

// Sanitização de dados de entrada
function sanitizeProjectInput(body) {
  const cleanId = String(body.id || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const cleanName = String(body.name || '').trim().slice(0, 120);
  const allowedCategories = ['mobile', 'web', 'interativo'];
  const cleanCategory = allowedCategories.includes(body.category) ? body.category : 'web';
  const cleanCategoryLabel = String(body.category_label || 'Web').trim().slice(0, 60);
  const cleanStatus = String(body.status || 'Ativo').trim().slice(0, 60);
  const cleanSummary = String(body.summary || '').trim().slice(0, 600);

  let cleanDemoUrl = String(body.demo_url || '').trim().slice(0, 300);
  if (cleanDemoUrl && !/^https?:\/\//i.test(cleanDemoUrl)) {
    cleanDemoUrl = ''; // Bloqueia javascript:, data:, etc.
  }

  const cleanHighlights = (Array.isArray(body.highlights) ? body.highlights : [])
    .map((h) => String(h).trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 10);

  const cleanTags = (Array.isArray(body.tags) ? body.tags : [])
    .map((t) => String(t).trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 12);

  return {
    id: cleanId,
    name: cleanName,
    category: cleanCategory,
    category_label: cleanCategoryLabel,
    status: cleanStatus,
    visible: body.visible !== false,
    demo_url: cleanDemoUrl,
    summary: cleanSummary,
    highlights: cleanHighlights,
    tags: cleanTags,
    order_index: Math.max(0, Math.min(999, Number(body.order_index) || 0))
  };
}

// [GET] Leitura pública (limite: 60 req/min por IP)
app.get('/api/projects', rateLimiter({ windowMs: 60 * 1000, maxRequests: 60 }), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, category, category_label, status, visible, demo_url, summary, highlights, tags, order_index FROM portfolio_projects ORDER BY order_index ASC, name ASC'
    );
    return res.status(200).json({ projects: rows });
  } catch (error) {
    console.error('[ERRO DB GET]:', error.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// [POST] Criar projeto (Protegido)
app.post('/api/projects', requireAdmin, async (req, res) => {
  const data = sanitizeProjectInput(req.body);
  if (!data.id || !data.name || !data.summary) {
    return res.status(400).json({ error: 'ID válido (a-z, 0-9, -), Nome e Resumo são obrigatórios.' });
  }

  try {
    await pool.query(
      `INSERT INTO portfolio_projects 
       (id, name, category, category_label, status, visible, demo_url, summary, highlights, tags, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        data.id, data.name, data.category, data.category_label, data.status,
        data.visible, data.demo_url, data.summary,
        JSON.stringify(data.highlights), JSON.stringify(data.tags), data.order_index
      ]
    );
    return res.status(201).json({ message: 'Projeto criado com segurança.' });
  } catch (error) {
    console.error('[ERRO DB POST]:', error.message);
    return res.status(500).json({ error: 'Erro ao salvar projeto.' });
  }
});

// [PUT] Atualizar projeto (Protegido)
app.put('/api/projects', requireAdmin, async (req, res) => {
  const data = sanitizeProjectInput(req.body);
  if (!data.id || !data.name) {
    return res.status(400).json({ error: 'ID e Nome são obrigatórios.' });
  }

  try {
    await pool.query(
      `UPDATE portfolio_projects SET
         name = $1, category = $2, category_label = $3, status = $4,
         visible = $5, demo_url = $6, summary = $7, highlights = $8, tags = $9, order_index = $10
       WHERE id = $11`,
      [
        data.name, data.category, data.category_label, data.status,
        data.visible, data.demo_url, data.summary,
        JSON.stringify(data.highlights), JSON.stringify(data.tags), data.order_index, data.id
      ]
    );
    return res.status(200).json({ message: 'Projeto atualizado.' });
  } catch (error) {
    console.error('[ERRO DB PUT]:', error.message);
    return res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
});

// [DELETE] Remover projeto (Protegido)
app.delete('/api/projects', requireAdmin, async (req, res) => {
  const deleteId = String(req.body?.deleteId || '').trim().replace(/[^a-z0-9-_]/g, '');
  if (!deleteId) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    await pool.query('DELETE FROM portfolio_projects WHERE id = $1', [deleteId]);
    return res.status(200).json({ message: 'Projeto removido.' });
  } catch (error) {
    console.error('[ERRO DB DELETE]:', error.message);
    return res.status(500).json({ error: 'Erro ao remover projeto.' });
  }
});

// Rota 404 genérica (não vaza estrutura de pastas)
app.use((req, res) => {
  res.status(404).json({ error: 'Recurso não encontrado.' });
});

app.listen(PORT, () => {
  console.log(`Servidor protegido rodando em http://localhost:${PORT}`);
});