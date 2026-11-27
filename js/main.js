(async function initApp() {
  const data = await window.PortfolioStore.load();
  const projects = (data.projects || []).filter((p) => p.visible !== false);

  const introSplash = document.getElementById('introSplash');
  const portraitCard = document.getElementById('portraitCard');
  const portraitFrame = document.getElementById('portraitFrame');
  const brandTrigger = document.querySelector('.brand');

  const projectsGrid = document.getElementById('projectsGrid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const modal = document.getElementById('projectModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const topbarEl = document.getElementById('topbar');
  const progressBarEl = document.getElementById('scrollProgress');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // 1. CONTROLE DA TELA INICIAL (KUNAI + FUMAÇA -> REVELA O PORTFÓLIO)
  if (introSplash) {
    // Permite pular a intro clicando nela ou aguarda 2.4s automaticamente
    const closeIntro = () => {
      if (introSplash.classList.contains('is-hidden')) return;
      introSplash.classList.add('is-hidden');
      window.SceneController?.finishIntro();
    };

    introSplash.addEventListener('click', closeIntro);
    setTimeout(closeIntro, 2400);
  } else {
    window.SceneController?.finishIntro();
  }

  // SEGURANÇA ANTI-XSS
  function escapeHTML(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getSafeUrl(url) {
    const clean = String(url || '').trim();
    return /^https?:\/\//i.test(clean) ? escapeHTML(clean) : '';
  }

  // GATILHO OCULTO DE ADMINISTRAÇÃO (7 cliques/toques rápidos)
  let secretClicks = 0;
  let secretTimer = null;

  function registerOwnerTap(e) {
    secretClicks += 1;
    clearTimeout(secretTimer);

    if (secretClicks >= 7) {
      secretClicks = 0;
      if (e) e.preventDefault();
      window.location.href = './admin.html';
      return;
    }

    secretTimer = setTimeout(() => {
      secretClicks = 0;
    }, 1800);
  }

  portraitCard?.addEventListener('click', registerOwnerTap);
  brandTrigger?.addEventListener('click', registerOwnerTap);

  // RENDERIZAÇÃO DOS PROJETOS
  function createProjectCard(project) {
    const safeId = escapeHTML(project.id);
    const safeUrl = getSafeUrl(project.demoUrl);

    return `
      <article class="project-card glass-panel" data-id="${safeId}">
        <div>
          <div class="project-card__top">
            <span class="project-card__badge">${escapeHTML(project.categoryLabel)}</span>
            <span class="project-card__status">${escapeHTML(project.status)}</span>
          </div>
          <h3>${escapeHTML(project.name)}</h3>
          <p>${escapeHTML(project.summary)}</p>
        </div>
        <div>
          <div class="tags">
            ${project.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join('')}
          </div>
          <div class="project-card__actions">
            <button class="project-card__link" type="button" data-open-project="${safeId}">
              INSPECIONAR PROJETO →
            </button>
            ${
              safeUrl
                ? `<a class="project-card__link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">ABRIR ↗</a>`
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

  // MODAL E ROTAS
  function openProjectModal(projectId, pushState = true) {
    const project = projects.find((item) => item.id === projectId);
    if (!project || !modal) return;

    const safeUrl = getSafeUrl(project.demoUrl);

    document.getElementById('modalCategory').textContent = `${project.categoryLabel} · ${project.status}`;
    document.getElementById('modalTitle').textContent = project.name;
    document.getElementById('modalDesc').textContent = project.summary;
    document.getElementById('modalHighlights').innerHTML = project.highlights
      .map((h) => `<li>${escapeHTML(h)}</li>`)
      .join('');
    document.getElementById('modalTags').innerHTML = project.tags
      .map((t) => `<span>${escapeHTML(t)}</span>`)
      .join('');

    document.getElementById('modalFooter').innerHTML = safeUrl
      ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--primary">Acessar Projeto ↗</a>`
      : '';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (pushState) {
      window.history.pushState({ modalOpen: true, projectId }, '', `?project=${encodeURIComponent(projectId)}`);
    }
  }

  function closeProjectModal(pushState = true) {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (pushState) {
      window.history.pushState({ modalOpen: false }, '', window.location.pathname);
    }
  }

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

  window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      openProjectModal(projectId, false);
    } else {
      closeProjectModal(false);
    }
  });

  // 2. LOOP DE SCROLL E IMPACTO DA KUNAI NA FOTO
  const sections = document.querySelectorAll('.story-section');
  const navLinks = document.querySelectorAll('.nav a');
  let ticking = false;

  function onScrollUpdate() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;

    if (topbarEl) topbarEl.classList.toggle('is-scrolled', scrollTop > 20);
    if (progressBarEl) progressBarEl.style.transform = `scaleX(${progress})`;

    window.SceneController?.setScrollProgress(progress);

    // Quando você começa a descer (passando de 5% do scroll), a Kunai atinge e quebra a foto!
    if (progress >= 0.05 && portraitFrame) {
      if (!portraitFrame.classList.contains('is-shattered')) {
        portraitFrame.classList.add('is-shattered');
        window.SceneController?.triggerPortraitImpact();
      }
    } else if (progress < 0.02 && portraitFrame) {
      // Se voltar totalmente para o topo, restaura o vidro para quebrar de novo quando descer
      portraitFrame.classList.remove('is-shattered');
      window.SceneController?.resetPortraitImpact();
    }

    const midViewport = scrollTop + window.innerHeight * 0.45;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (midViewport >= top && midViewport < top + height) {
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

  renderProjects('all');
  onScrollUpdate();

  const initialUrlParams = new URLSearchParams(window.location.search);
  const initialProjectId = initialUrlParams.get('project');
  if (initialProjectId) {
    setTimeout(() => openProjectModal(initialProjectId, false), 150);
  }
})();