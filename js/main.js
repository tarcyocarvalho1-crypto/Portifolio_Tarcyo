const projectsGrid = document.getElementById('projectsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('projectModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

function renderProjects(filter = 'all') {
  if (!projectsGrid || typeof PROJECTS === 'undefined') return;

  const list = filter === 'all'
    ? PROJECTS
    : PROJECTS.filter((item) => item.category === filter);

  projectsGrid.innerHTML = list
    .map(
      (project) => `
      <article class="project-card reveal is-visible" data-id="${project.id}">
        <div>
          <div class="project-card__top">
            <span class="project-card__badge">${project.categoryLabel}</span>
            <span class="project-card__status">${project.status}</span>
          </div>
          <h3>${project.name}</h3>
          <p>${project.summary}</p>
        </div>

        <div>
          <div class="tags" style="margin-bottom: 14px;">
            ${project.tags.map((tag) => `<span>${tag}</span>`).join('')}
          </div>
          <button class="project-card__link" type="button" data-open-project="${project.id}">
            Ver detalhes →
          </button>
        </div>
      </article>
    `
    )
    .join('');
}

function openProjectModal(projectId) {
  const project = PROJECTS.find((item) => item.id === projectId);
  if (!project || !modal) return;

  document.getElementById('modalCategory').textContent = `${project.categoryLabel} · ${project.status}`;
  document.getElementById('modalTitle').textContent = project.name;
  document.getElementById('modalDesc').textContent = project.summary;

  const highlightsEl = document.getElementById('modalHighlights');
  highlightsEl.innerHTML = project.highlights.map((h) => `<li>${h}</li>`).join('');

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = project.tags.map((t) => `<span>${t}</span>`).join('');

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
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
  if (trigger) {
    openProjectModal(trigger.dataset.openProject);
  }
});

closeModalBtn?.addEventListener('click', closeProjectModal);
modal?.addEventListener('click', (e) => {
  if (e.target.dataset.closeModal === 'true') {
    closeProjectModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal?.classList.contains('is-open')) {
    closeProjectModal();
  }
});

renderProjects('all');