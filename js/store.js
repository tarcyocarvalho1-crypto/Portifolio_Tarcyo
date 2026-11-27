const DEFAULT_PORTFOLIO_DATA = {
  profile: {
    name: 'Tarcyo Carvalho',
    email: 'contato@tarcyo.dev',
    github: 'https://github.com/tarcyocarvalho1-crypto'
  },
  projects: [
    {
      id: 'compreja',
      name: 'CompreJá',
      category: 'mobile',
      categoryLabel: 'Mobile',
      status: 'Em desenvolvimento',
      visible: true,
      demoUrl: '',
      summary: 'Marketplace multi-nicho (mercados, farmácias, lanchonetes e restaurantes) com painéis de cliente, lojista e admin.',
      highlights: [
        'Controle de estoque e metadados específicos por categoria de produto',
        'Carrossel promocional e fluxos dedicados para clientes, lojistas e administração',
        'Arquitetura mobile com React Native, Expo, TypeScript e Neon PostgreSQL'
      ],
      tags: ['React Native', 'Expo', 'TypeScript', 'Neon PostgreSQL']
    },
    {
      id: 'huby-mobilidade',
      name: 'HUBy — Mobilidade Urbana',
      category: 'mobile',
      categoryLabel: 'Mobile',
      status: 'Testes em campo (APK)',
      visible: true,
      demoUrl: '',
      summary: 'Plataforma de mobilidade urbana com assistente de voz/IA, locação de veículos, vitrine de parceiros e assinaturas.',
      highlights: [
        'Assistente de voz para motoristas, agendamento de corridas, cupons e paradas extras',
        'Vitrine de parceiros, locação de veículos e faixas de comissão para motoristas',
        'Testes em campo via Expo Go / APK com backend e banco Neon PostgreSQL'
      ],
      tags: ['React Native', 'Expo', 'TypeScript', 'Neon PostgreSQL', 'Voice AI']
    },
    {
      id: 'vr-modas',
      name: 'VR MODAS',
      category: 'web',
      categoryLabel: 'Web & E-commerce',
      status: 'Publicado / Ativo',
      visible: true,
      demoUrl: '',
      summary: 'Loja virtual completa e painel administrativo com filtros de vendas, retirada ou entrega e checkout via Mercado Pago.',
      highlights: [
        'Front-end modular com arquitetura CSS separada por responsabilidade',
        'Gestão de pedidos, filtros de vendas e opção de retirada em loja ou entrega',
        'Hospedagem na Vercel, banco Neon PostgreSQL e pagamento com Mercado Pago'
      ],
      tags: ['HTML', 'CSS', 'JavaScript', 'Vercel', 'Neon PostgreSQL', 'Mercado Pago']
    },
    {
      id: 'frutos-de-goias',
      name: 'Frutos de Goiás',
      category: 'web',
      categoryLabel: 'Web & E-commerce',
      status: 'Concluído',
      visible: true,
      demoUrl: '',
      summary: 'Interfaces web para cliente e administração integradas ao Neon PostgreSQL e peças animadas para integração em app.',
      highlights: [
        'Painéis web cliente e admin com persistência em Neon PostgreSQL',
        'Animações promocionais (picolé e copo com marca) preparadas para app'
      ],
      tags: ['HTML', 'CSS', 'JavaScript', 'Neon PostgreSQL', 'Motion']
    },
    {
      id: 'convite-neris-mirelle',
      name: 'Convite Digital Interativo',
      category: 'interativo',
      categoryLabel: 'Interativo',
      status: 'Concluído',
      visible: true,
      demoUrl: '',
      summary: 'Convite de casamento digital com confirmação de presença, bloqueio de RSVP, painel admin oculto e lista de presentes.',
      highlights: [
        'Acesso administrativo oculto por sequência de toques/cliques',
        'Gestão de convidados e lista de presentes liberada após confirmação de RSVP',
        'Deploy na Vercel com persistência via JSONBin'
      ],
      tags: ['HTML', 'CSS', 'JavaScript', 'Vercel', 'JSONBin']
    },
    {
      id: 'mini-game-espacial',
      name: 'Mini-Game Espacial',
      category: 'interativo',
      categoryLabel: 'Interativo',
      status: 'Concluído',
      visible: true,
      demoUrl: '',
      summary: 'Jogo interativo no navegador com foguete, planetas, meteoros, satélites e buraco negro.',
      highlights: [
        'Animação e mecânica de navegação espacial diretamente no browser',
        'Projeto leve construído em HTML, CSS e JavaScript puro'
      ],
      tags: ['HTML5', 'CSS3', 'JavaScript']
    }
  ]
};

function normalizeProject(raw) {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category || 'web',
    categoryLabel: raw.categoryLabel || raw.category_label || 'Web',
    status: raw.status || 'Ativo',
    visible: raw.visible !== false,
    demoUrl: raw.demoUrl || raw.demo_url || '',
    summary: raw.summary || '',
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    tags: Array.isArray(raw.tags) ? raw.tags : []
  };
}

window.PortfolioStore = {
  getApiBaseUrl() {
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalHost && window.location.port !== '3000') {
      return 'http://localhost:3000';
    }
    return '';
  },

  async load() {
    const baseUrl = this.getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          return {
            profile: DEFAULT_PORTFOLIO_DATA.profile,
            projects: data.projects.map(normalizeProject)
          };
        }
      }
    } catch (_) {
      // Silencioso: usa o fallback local se o servidor estiver desligado
    }

    return {
      profile: DEFAULT_PORTFOLIO_DATA.profile,
      projects: DEFAULT_PORTFOLIO_DATA.projects.map(normalizeProject)
    };
  }
};