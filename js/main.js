(async function initApp() {
  const data = await window.PortfolioStore.load();
  const projects = (data.projects || []).filter((p) => p.visible !== false);

  const projectsGrid = document.getElementById('projectsGrid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const modal = document.getElementById('projectModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const topbarEl = document.getElementById('topbar');
  const progressBarEl = document.getElementById('scrollProgress');
  
  // Elementos do HUD
  const hudPercentEl = document.getElementById('hudPercent');
  const hudCoordsEl = document.getElementById('hudCoords');
  const hudSectionLabelEl = document.getElementById('hudSectionLabel');
  
  const portraitCard = document.getElementById('portraitCard');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // COMPONENTIZAÇÃO: Fábrica de Cards
  function createProjectCard(project) {
    return `
      <article class="project-card glass-panel" data-id="${project.id}">
        <div>
          <div class="project-card__top">
            <span class="project-card__badge">${project.categoryLabel}</span>
            <span class="project-card__status">${project.status}</span>
          </div>
          <h3>${project.name}</h3>
          <p>${project.summary}</p>
        </div>
        <div>
          <div class="tags">
            ${project.tags.map((tag) => `<span>${tag}</span>`).join('')}
          </div>
          <div class="project-card__actions">
            <button class="project-card__link" type="button" data-open-project="${project.id}">
              INSPECIONAR PROJETO →
            </button>
            ${
              project.demoUrl
                ? `<a class="project-card__link" href="${project.demoUrl}" target="_blank" rel="noopener noreferrer">ABRIR ↗</a>`
                : ''
            }
          </div>
        </div>
      </article>
    `;
  }

  function renderProjects(filter = 'all') {
    if (!projectsGrid) return;
    const list = filter === 'all' ? projects : projects.filter((item) => item.category === filter);
    projectsGrid.innerHTML = list.map(createProjectCard).join('');
  }

  // SISTEMA DE ROTAS: Modais conectados à URL
  function openProjectModal(projectId, pushState = true) {
    const project = projects.find((item) => item.id === projectId);
    if (!project || !modal) return;

    document.getElementById('modalCategory').textContent = `${project.categoryLabel} · ${project.status}`;
    document.getElementById('modalTitle').textContent = project.name;
    document.getElementById('modalDesc').textContent = project.summary;
    document.getElementById('modalHighlights').innerHTML = project.highlights.map((h) => `<li>${h}</li>`).join('');
    document.getElementById('modalTags').innerHTML = project.tags.map((t) => `<span>${t}</span>`).join('');
    
    document.getElementById('modalFooter').innerHTML = project.demoUrl
      ? `<a href="${project.demoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--primary">Acessar Projeto ↗</a>`
      : '';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Atualiza a URL para permitir partilha direta
    if (pushState) {
      window.history.pushState({ modalOpen: true, projectId }, '', `?project=${projectId}`);
    }
  }

  function closeProjectModal(pushState = true) {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Limpa a URL ao fechar
    if (pushState) {
      window.history.pushState({ modalOpen: false }, '', window.location.pathname);
    }
  }

  // EVENTOS E DELEGAÇÃO
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderProjects(btn.dataset.filter);
    });
  });

  projectsGrid?.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-project]');
    if (trigger) openProjectModal(trigger.dataset.openProject);
  });

  closeModalBtn?.addEventListener('click', () => closeProjectModal());
  modal?.addEventListener('click', (e) => {
    if (e.target.dataset.closeModal === 'true') closeProjectModal();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectModal();
  });

  // Listener para botões Voltar/Avançar do navegador
  window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      openProjectModal(projectId, false);
    } else {
      closeProjectModal(false);
    }
  });

  // EFEITO 3D DO RETRATO NO HOVER (Desktop)
  if (portraitCard && window.matchMedia('(pointer: fine)').matches) {
    portraitCard.addEventListener('mousemove', (e) => {
      const rect = portraitCard.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      portraitCard.style.transform = `perspective(900px) rotateY(${(nx * 12).toFixed(1)}deg) rotateX(${(-ny * 12).toFixed(1)}deg)`;
    });
    portraitCard.addEventListener('mouseleave', () => {
      portraitCard.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
    });
  }

  // SCROLL OBSERVER OTIMIZADO
  const sections = document.querySelectorAll('.story-section');
  const navLinks = document.querySelectorAll('.nav a');
  let ticking = false;

  function onScrollUpdate() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;

    if (topbarEl) topbarEl.classList.toggle('is-scrolled', scrollTop > 20);
    if (progressBarEl) progressBarEl.style.transform = `scaleX(${progress})`;
    if (hudPercentEl) hudPercentEl.textContent = `SCROLL ${String(Math.round(progress * 100)).padStart(2, '0')}%`;
    if (hudCoordsEl) hudCoordsEl.textContent = `Z: ${(progress * 10).toFixed(2)} · 60FPS`;

    if (window.SceneController) {
      window.SceneController.setScrollProgress(progress);
    }

    const midViewport = scrollTop + window.innerHeight * 0.45;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (midViewport >= top && midViewport < top + height) {
        if (hudSectionLabelEl && sec.dataset.stageName) {
          hudSectionLabelEl.textContent = sec.dataset.stageName;
        }
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.dataset.nav === sec.id);
        });
      }
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScrollUpdate);
      ticking = true;
    }
  }, { passive: true });

  // INICIALIZAÇÃO E LEITURA DE ROTAS INICIAIS
  renderProjects('all');
  onScrollUpdate();

  // Verifica se o visitante entrou através de um link direto para um projeto
  const initialUrlParams = new URLSearchParams(window.location.search);
  const initialProjectId = initialUrlParams.get('project');
  if (initialProjectId) {
    // Timeout breve para garantir que a grid e o CSS renderizaram
    setTimeout(() => openProjectModal(initialProjectId, false), 150);
  }
})();