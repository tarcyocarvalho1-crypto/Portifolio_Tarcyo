const scrollProgressEl = document.getElementById('scrollProgress');
const topbarEl = document.getElementById('topbar');
const heroVisualEl = document.getElementById('heroVisual');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ticking = false;

function updateScrollEffects() {
  const scrollTop = window.scrollY || window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;

  if (scrollProgressEl) {
    scrollProgressEl.style.transform = `scaleX(${progress})`;
  }

  if (topbarEl) {
    topbarEl.classList.toggle('is-scrolled', scrollTop > 16);
  }

  if (!prefersReducedMotion && heroVisualEl && scrollTop < window.innerHeight * 1.1) {
    const offset = scrollTop * 0.14;
    heroVisualEl.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  }

  ticking = false;
}

window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollEffects);
      ticking = true;
    }
  },
  { passive: true }
);

function initRevealObserver() {
  const elements = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

updateScrollEffects();
initRevealObserver();