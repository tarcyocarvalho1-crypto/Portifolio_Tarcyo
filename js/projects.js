const PROJECTS = [
  {
    id: 'compreja',
    name: 'CompreJá',
    category: 'mobile',
    categoryLabel: 'Mobile',
    status: 'Em desenvolvimento',
    summary: 'Marketplace multi-nicho (mercados, farmácias, lanchonetes e restaurantes) com painéis de cliente, lojista e admin.',
    highlights: [
      'Controle de estoque e metadados específicos por categoria de produto',
      'Carrossel promocional e fluxos dedicados para clientes, lojistas e administração',
      'Arquitetura mobile com React Native, Expo, TypeScript e Neon PostgreSQL'
    ],
    tags: ['React Native', 'Expo', 'TypeScript', 'Neon PostgreSQL']
  },
  {
    id: 'ride-hailing',
    name: 'App de Mobilidade (Ride-Hailing)',
    category: 'mobile',
    categoryLabel: 'Mobile',
    status: 'Testes em campo (APK)',
    summary: 'Aplicativo de mobilidade urbana estilo Uber com assistente de voz para motoristas, locação de veículos e parcerias locais.',
    highlights: [
      'Assistente de voz voltado ao motorista e vitrine de locação de carros',
      'Cupons/parcerias com comércios locais e assinatura de motoristas via web',
      'Compilação Android APK para testes práticos em campo'
    ],
    tags: ['React Native', 'Expo', 'TypeScript', 'Voice AI']
  },
  {
    id: 'vr-modas',
    name: 'VR MODAS',
    category: 'web',
    categoryLabel: 'Web & E-commerce',
    status: 'Publicado / Ativo',
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
    summary: 'Jogo interativo no navegador com foguete, planetas, meteoros, satélites e buraco negro.',
    highlights: [
      'Animação e mecânica de navegação espacial diretamente no browser',
      'Projeto leve construído em HTML, CSS e JavaScript puro'
    ],
    tags: ['HTML5', 'CSS3', 'JavaScript']
  }
];