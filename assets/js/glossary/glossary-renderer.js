// CasePath Glossary Dynamic Renderer v2.0
// Renders terms across workplace, regulatory, tenancy, contracts, civil & personal disputes
(function(global) {
  'use strict';

  function getTerms() {
    return (global.CasePathGlossary && global.CasePathGlossary.terms) || global.GLOSSARY || [];
  }

  function renderCard(item) {
    return `
      <article class="glossary-card" data-cat="${item.cat || 'General'}" id="term-${(item.term || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}">
        <div class="glossary-card__header">
          <span class="glossary-card__badge">${item.cat || 'Legal'}</span>
          <h3 class="glossary-card__term">${item.term}</h3>
        </div>
        <p class="glossary-card__def">${item.def}</p>
      </article>
    `;
  }

  function boot() {
    const mount = document.getElementById('glossary-cards-mount');
    const loading = document.getElementById('glossary-loading');
    const empty = document.getElementById('glossary-empty');
    const searchInput = document.getElementById('glossary-search');
    const chipsContainer = document.getElementById('glossary-cat-chips');
    const countDisplay = document.getElementById('glossary-results-count');
    const alphaNav = document.getElementById('glossary-alpha-nav');

    if (loading) loading.style.display = 'none';
    if (!mount) return;

    const terms = getTerms();
    let currentCat = 'ALL';
    let searchQuery = '';

    // Extract categories
    const categories = ['ALL', ...new Set(terms.map(t => t.cat).filter(Boolean))];

    // Render category chips
    if (chipsContainer) {
      chipsContainer.innerHTML = categories.map(cat => `
        <button type="button" class="glossary-chip ${cat === 'ALL' ? 'active' : ''}" data-category="${cat}">
          ${cat === 'ALL' ? 'All Areas' : cat}
        </button>
      `).join('');

      chipsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.glossary-chip');
        if (!btn) return;
        chipsContainer.querySelectorAll('.glossary-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        currentCat = btn.dataset.category;
        filterAndRender();
      });
    }

    // Render alphabet nav
    if (alphaNav) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      alphaNav.innerHTML = `<button type="button" class="alpha-link active" data-letter="ALL">All</button>` +
        letters.map(l => `<button type="button" class="alpha-link" data-letter="${l}">${l}</button>`).join('');

      alphaNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.alpha-link');
        if (!btn) return;
        alphaNav.querySelectorAll('.alpha-link').forEach(a => a.classList.remove('active'));
        btn.classList.add('active');
        const letter = btn.dataset.letter;
        if (letter === 'ALL') {
          searchQuery = '';
          if (searchInput) searchInput.value = '';
        } else {
          searchQuery = '^' + letter;
        }
        filterAndRender();
      });
    }

    function filterAndRender() {
      let filtered = terms;

      if (currentCat !== 'ALL') {
        filtered = filtered.filter(t => t.cat === currentCat);
      }

      if (searchQuery) {
        if (searchQuery.startsWith('^')) {
          const l = searchQuery.slice(1).toLowerCase();
          filtered = filtered.filter(t => t.term.toLowerCase().startsWith(l));
        } else {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(t =>
            t.term.toLowerCase().includes(q) ||
            (t.def && t.def.toLowerCase().includes(q))
          );
        }
      }

      if (countDisplay) {
        countDisplay.textContent = `Showing ${filtered.length} of ${terms.length} legal terms`;
      }

      if (filtered.length === 0) {
        mount.innerHTML = '';
        if (empty) empty.hidden = false;
      } else {
        if (empty) empty.hidden = true;
        mount.innerHTML = filtered.map(renderCard).join('');
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        filterAndRender();
      });
    }

    const resetBtn = document.getElementById('glossary-empty-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentCat = 'ALL';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        filterAndRender();
      });
    }

    // Initial render
    filterAndRender();
  }

  global.CasePathGlossaryRenderer = { boot };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
