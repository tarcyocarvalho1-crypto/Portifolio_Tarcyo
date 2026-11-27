(async function initApp() {
  const data = await window.PortfolioStore.load();
  const projects = (data.projects || []).filter((p) => p.visible !== false);

  const projectsGrid = document.getElementById('projectsGrid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const modal = document.getElementById('projectModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const topbarEl = document.getElementById('topbar');
  const progressBarEl = document.getElementById('scrollProgress');

  const hudPercentEl = document.getElementById('hudPercent');
  const hudCoordsEl = document.getElementById('hudCoords');
  const hudSectionLabelEl = document.getElementById('hudSectionLabel');

  const portraitCard = document.getElementById('portraitCard');
  const brandTrigger = document.querySelector('.brand');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  // FÁBRICA DE CARDS
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

  // MOTOR DE PARALLAX & SCROLL OBSERVER (60 FPS)
  const sections = document.querySelectorAll('.story-section');
  const navLinks = document.querySelectorAll('.nav a');
  const parallaxItems = document.querySelectorAll('[data-parallax]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;

  let currentScroll = window.scrollY || 0;
  let targetScroll = currentScroll;

  window.addEventListener('scroll', () => {
    targetScroll = window.scrollY || window.pageYOffset;
  }, { passive: true });

  function renderScrollLoop() {
    currentScroll += (targetScroll - currentScroll) * 0.1;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(Math.max(currentScroll / maxScroll, 0), 1) : 0;

    if (topbarEl) topbarEl.classList.toggle('is-scrolled', currentScroll > 20);
    if (progressBarEl) progressBarEl.style.transform = `scaleX(${progress})`;
    if (hudPercentEl) hudPercentEl.textContent = `SCROLL ${String(Math.round(progress * 100)).padStart(2, '0')}%`;
    if (hudCoordsEl) hudCoordsEl.textContent = `Z: ${(progress * 10).toFixed(2)} · 60FPS`;

    if (window.SceneController) {
      window.SceneController.setScrollProgress(progress);
    }

    if (!prefersReducedMotion && isDesktop) {
      const viewportCenter = currentScroll + window.innerHeight * 0.5;
      parallaxItems.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0;
        const rect = el.getBoundingClientRect();
        const elCenter = currentScroll + rect.top + rect.height * 0.5;
        const offset = (viewportCenter - elCenter) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
    }

    const midViewport = currentScroll + window.innerHeight * 0.45;
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

    requestAnimationFrame(renderScrollLoop);
  }

  renderProjects('all');
  requestAnimationFrame(renderScrollLoop);

  const initialUrlParams = new URLSearchParams(window.location.search);
  const initialProjectId = initialUrlParams.get('project');
  if (initialProjectId) {
    setTimeout(() => openProjectModal(initialProjectId, false), 150);
  }
})();