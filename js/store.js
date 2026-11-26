window.PortfolioStore = {
  async load() {
    try {
      // Chama a tua API segura que está ligada ao Neon PostgreSQL
      const response = await fetch('/api/projects'); 
      if (response.ok) {
        const data = await response.json();
        // Se a ligação der certo e houver dados, utiliza-os!
        if (data.projects && data.projects.length > 0) {
          return data;
        }
      }
    } catch (error) {
      console.error("Erro ao puxar dados da API local/Vercel:", error);
    }
    
    // Fallback: se a base de dados estiver vazia ou o servidor desligado, 
    // ele carrega o DEFAULT_PORTFOLIO_DATA que está no topo do ficheiro.
    return DEFAULT_PORTFOLIO_DATA;
  }
};