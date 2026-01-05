/* REPLACE YOUR EXISTING app.js WITH THIS */

const API_URL = 'http://localhost:3000';

let state = {
  page: 1,
  limit: 12,
  search: '',
  source: '',
  days: 7,
  totalPages: 1
};

// DOM Elements
const grid = document.getElementById('news-grid');
const heroSection = document.getElementById('hero-section');
const emptyState = document.getElementById('empty-state');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('page-info');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const titleEl = document.getElementById('page-title');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const daysSelect = document.getElementById('days-select');
const limitSelect = document.getElementById('limit-select');

/* ===============================
   THEME MANAGEMENT
================================ */
function initTheme() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    html.classList.add('dark');
    localStorage.theme = 'dark';
  }
  lucide.createIcons();
}

themeToggleBtn.addEventListener('click', toggleTheme);
initTheme();

/* ===============================
   UI INTERACTIONS (Search/Mobile)
================================ */
function toggleMobileSearch() {
    const bar = document.getElementById('mobile-search-bar');
    bar.classList.toggle('hidden');
    if(!bar.classList.contains('hidden')) {
        setTimeout(() => document.getElementById('search-input-mobile').focus(), 100);
    }
}

function handleSearch(query) {
    state.search = query;
    state.page = 1;
    // Close mobile search if open
    document.getElementById('mobile-search-bar').classList.add('hidden');
    // Sync inputs
    document.getElementById('search-input-desktop').value = query;
    document.getElementById('search-input-mobile').value = query;
    fetchNews();
}

// Event Listeners for Search
document.getElementById('search-form-desktop').addEventListener('submit', e => {
    e.preventDefault();
    handleSearch(document.getElementById('search-input-desktop').value);
});
document.getElementById('search-form-mobile').addEventListener('submit', e => {
    e.preventDefault();
    handleSearch(document.getElementById('search-input-mobile').value);
});

/* ===============================
   DATA FETCHING
================================ */
async function fetchNews() {
  Notiflix.Loading.standard('Oduu feʼaa jira...');
  
  // Clean UI
  grid.innerHTML = '';
  heroSection.innerHTML = '';
  heroSection.classList.add('hidden');
  emptyState.classList.add('hidden');
  pagination.classList.add('hidden');

  try {
    const params = new URLSearchParams(state);
    const res = await fetch(`${API_URL}/articles?${params}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    const articles = data.data || [];

    if (articles.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      renderLayout(articles);
      updatePagination(data.pagination);
    }
    
    updateTitle();
    updateActiveFilterUI();

  } catch (err) {
    console.error(err);
    Notiflix.Notify.failure('Rakkoo Connection');
    emptyState.classList.remove('hidden');
  } finally {
    Notiflix.Loading.remove();
    lucide.createIcons();
  }
}

async function triggerSync() {
  const syncBtn = document.getElementById('sync-icon');
  syncBtn.classList.add('spin-anim');
  Notiflix.Notify.info('Oduu haaraa funaanuun eegalameera...', { timeout: 2000 });

  try {
    const res = await fetch(`${API_URL}/scrape`, { method: 'POST' });
    if (res.ok) {
        setTimeout(() => {
            Notiflix.Notify.success('Oduu haaraa argachuuf sekondii muraasa eegaa');
            setTimeout(() => {
                fetchNews();
                syncBtn.classList.remove('spin-anim');
            }, 3000);
        }, 1000);
    } else throw new Error();
  } catch (e) {
    Notiflix.Notify.failure('Funaanuun hin danda\'amne');
    syncBtn.classList.remove('spin-anim');
  }
}

/* ===============================
   RENDERING
================================ */
function renderLayout(items) {
  let gridItems = items;

  // Show hero only on first page, no search
  if (state.page === 1 && !state.search && items.length > 0) {
    renderHero(items[0]);
    gridItems = items.slice(1);
  }

  renderGrid(gridItems);
}

function renderHero(article) {
  heroSection.classList.remove('hidden');
  // Responsive Height: aspect-video on mobile, fixed height on desktop
  heroSection.innerHTML = `
    <div 
      onclick="openArticle('${article.url}')"
      class="group relative w-full aspect-[4/5] sm:aspect-video md:h-[450px] lg:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer shadow-xl dark:shadow-none fade-in"
    >
      <img 
        src="${article.image_url || 'https://placehold.co/800x600?text=ODUU'}" 
        onerror="this.src='https://placehold.co/800x600?text=ODUU'"
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-90"></div>
      
      <div class="absolute bottom-0 left-0 p-5 md:p-10 max-w-3xl w-full">
        <span class="inline-block bg-emerald-600 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full mb-2 shadow-lg border border-emerald-500">
          ${article.source_name}
        </span>
        <h2 class="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2 md:mb-3 group-hover:text-emerald-300 transition-colors serif-font">
          ${article.title}
        </h2>
        <p class="hidden sm:block text-slate-200 text-sm md:text-lg line-clamp-2 mb-3 max-w-2xl">
          ${article.summary || ''}
        </p>
        <div class="flex items-center gap-3 text-slate-300 text-xs md:text-sm font-medium">
          <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${timeAgo(article.published_date)}</span>
          <span class="text-white flex items-center gap-1">Dubbisuu <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i></span>
        </div>
      </div>
    </div>
  `;
}

function renderGrid(items) {
  if (items.length === 0) return;

  grid.innerHTML = items.map((a, index) => `
    <article 
      class="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl dark:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full fade-in"
      style="animation-delay: ${Math.min(index * 50, 300)}ms"
      onclick="openArticle('${a.url}')"
    >
      <div class="relative h-44 sm:h-48 overflow-hidden">
        <img
          src="${a.image_url || 'https://placehold.co/600x400?text=ODUU'}"
          onerror="this.src='https://placehold.co/600x400?text=Image+Error'"
          class="w-full h-full object-cover transition duration-500 hover:scale-110"
        />
        <div class="absolute top-2.5 left-2.5">
          <span class="bg-white/95 dark:bg-slate-900/90 backdrop-blur text-slate-900 dark:text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-700">
            ${a.source_name}
          </span>
        </div>
      </div>
      
      <div class="p-4 md:p-5 flex flex-col flex-1">
        <div class="flex items-center gap-2 mb-2">
           <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
             <i data-lucide="calendar" class="w-3 h-3"></i> ${timeAgo(a.published_date)}
           </span>
        </div>
        
        <h3 class="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 serif-font line-clamp-3">
          ${a.title}
        </h3>
        
        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-1">
          ${a.summary || ''}
        </p>
        
        <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Oduu Guutuu</span>
          <div class="bg-slate-50 dark:bg-slate-700 p-1.5 md:p-2 rounded-full text-slate-400 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function openArticle(url) { if(url) window.open(url, '_blank', 'noopener,noreferrer'); }

/* ===============================
   UTILS
================================ */
function updatePagination(p) {
  pagination.classList.remove('hidden');
  pageInfo.textContent = `${p.current_page} / ${p.total_pages}`;
  state.totalPages = p.total_pages;
  prevBtn.disabled = p.current_page === 1;
  nextBtn.disabled = p.current_page >= p.total_pages;
}

function updateTitle() {
  if (state.search) {
    titleEl.innerHTML = `Barbaacha: <span class="text-emerald-600 dark:text-emerald-400">"${state.search}"</span>`;
  } else if (state.source) {
    titleEl.textContent = state.source;
  } else {
    titleEl.textContent = 'Oduu Haaraa';
  }
}

function updateActiveFilterUI() {
  filterBtns.forEach(btn => {
    const isActive = btn.getAttribute('data-source') === state.source;
    btn.className = `filter-btn flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full border whitespace-nowrap cursor-pointer transition-all ${
      isActive 
      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 dark:bg-emerald-600 dark:text-white dark:border-emerald-600 dark:shadow-emerald-900/20' 
      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-emerald-400 dark:hover:text-emerald-400'
    }`;
  });
  daysSelect.value = state.days;
  limitSelect.value = state.limit;
}

function timeAgo(d) {
  if (!d) return 'Amma';
  const now = new Date();
  const date = new Date(d);
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Amma';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m dura`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h dura`;
  return `${Math.floor(diffInHours / 24)}d dura`;
}

prevBtn.onclick = () => { if(state.page > 1) { state.page--; fetchNews(); window.scrollTo({top:0, behavior:'smooth'}); } };
nextBtn.onclick = () => { if(state.page < state.totalPages) { state.page++; fetchNews(); window.scrollTo({top:0, behavior:'smooth'}); } };

window.filterSource = s => { state.source = s; state.search = ''; state.page = 1; fetchNews(); };
window.updateSettings = () => { state.days = daysSelect.value; state.limit = limitSelect.value; state.page = 1; fetchNews(); };
window.resetApp = () => { state = { page: 1, limit: 12, search: '', source: '', days: 7, totalPages: 1 }; fetchNews(); };

// Init
fetchNews();