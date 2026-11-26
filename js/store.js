window.PortfolioStore = {
  async load() {
    try {
      // Chama o backend Node.js que está rodando na sua máquina
      const response = await fetch('http://localhost:3000/api/projects'); 
      if (response.ok) {
        const data = await response.json();
        if (data.projects && data.projects.length > 0) {
          return data;
        }
      }
    } catch (error) {
      console.error("Erro ao puxar dados do backend local:", error);
    }
    
    return DEFAULT_PORTFOLIO_DATA;
  }
};