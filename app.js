const API_URL = 'http://localhost:3000';

// Cache for bookmark data
let renderedArticlesCache = {}; 

let state = {
  page: 1,
  limit: 12,
  search: '',
  source: '',
  days: 7,
  totalPages: 1,
  isBookmarkView: false
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
   UI INTERACTIONS
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
    state.isBookmarkView = false;
    document.getElementById('mobile-search-bar').classList.add('hidden');
    document.getElementById('search-input-desktop').value = query;
    document.getElementById('search-input-mobile').value = query;
    fetchNews();
}

document.getElementById('search-form-desktop').addEventListener('submit', e => { e.preventDefault(); handleSearch(document.getElementById('search-input-desktop').value); });
document.getElementById('search-form-mobile').addEventListener('submit', e => { e.preventDefault(); handleSearch(document.getElementById('search-input-mobile').value); });

/* ===============================
   BOOKMARK LOGIC (FIXED ICON RENDERING)
================================ */
function getBookmarks() {
  return JSON.parse(localStorage.getItem('oduu_bookmarks') || '[]');
}

function isBookmarked(url) {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.url === url);
}

function toggleBookmark(e, url) {
  e.stopPropagation(); // Stop click from opening article
  
  // 1. Capture the clicked button immediately
  const clickedBtn = e.currentTarget;
  
  let bookmarks = getBookmarks();
  const exists = bookmarks.find(b => b.url === url);
  let isNowSaved = false;

  if (exists) {
    // REMOVE
    bookmarks = bookmarks.filter(b => b.url !== url);
    Notiflix.Notify.info('Kuuffadhe keessaa haqameera.');
    isNowSaved = false;
    
    // If inside Saved View, Refresh Grid Immediately
    if (state.isBookmarkView) {
      if(bookmarks.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
      } else {
        renderGrid(bookmarks);
        lucide.createIcons(); // <--- CRITICAL FIX: Re-render icons after grid update
      }
      localStorage.setItem('oduu_bookmarks', JSON.stringify(bookmarks));
      return; // Stop here if in Saved view (grid rebuilt)
    }
  } else {
    // ADD
    const article = renderedArticlesCache[url];
    if (article) {
      bookmarks.unshift(article);
      Notiflix.Notify.success('Kuuffadheetti galmaa\'eera.');
      isNowSaved = true;
    }
  }
  
  localStorage.setItem('oduu_bookmarks', JSON.stringify(bookmarks));
  
  // 2. FORCE UI UPDATE (Safely scan all buttons)
  const allButtons = document.querySelectorAll('.bookmark-btn');
  
  allButtons.forEach(btn => {
    if (btn.dataset.url === url) {
        styleBookmarkButton(btn, isNowSaved);
    }
  });
}

// Helper to apply styles correctly based on context (Hero vs Grid)
function styleBookmarkButton(btn, isSaved) {
    const icon = btn.querySelector('i');
    const isHero = btn.closest('#hero-section') !== null;

    // Apply Pulse Animation
    btn.classList.add('scale-125');
    setTimeout(() => btn.classList.remove('scale-125'), 200);

    if (isSaved) {
        // SAVED STATE (Green)
        btn.classList.remove('text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-700', 'bg-white/10', 'hover:bg-white/20', 'text-white');
        btn.classList.add('text-emerald-600', 'bg-emerald-50', 'dark:text-emerald-400', 'dark:bg-emerald-900/30');
        if(icon) icon.setAttribute('fill', 'currentColor');

    } else {
        // UNSAVED STATE (Gray/White)
        btn.classList.remove('text-emerald-600', 'bg-emerald-50', 'dark:text-emerald-400', 'dark:bg-emerald-900/30');
        if(icon) icon.setAttribute('fill', 'none');

        if (isHero) {
            btn.classList.add('text-white', 'bg-white/10', 'hover:bg-white/20');
        } else {
            btn.classList.add('text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-700');
        }
    }
}

function toggleBookmarkView() {
  state.isBookmarkView = true;
  state.search = '';
  state.source = '';
  state.page = 1;
  
  updateActiveFilterUI();
  titleEl.textContent = 'Oduu Kuuffadhe';
  heroSection.classList.add('hidden');
  pagination.classList.add('hidden');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const bookmarks = getBookmarks();
  
  // Hydrate cache
  bookmarks.forEach(a => renderedArticlesCache[a.url] = a);
  
  if (bookmarks.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    renderGrid(bookmarks);
  }
  
  lucide.createIcons();
}

/* ===============================
   DATA FETCHING
================================ */
async function fetchNews() {
  if (state.isBookmarkView) {
      toggleBookmarkView(); 
      return; 
  }

  Notiflix.Loading.standard('Oduu feʼaa jira...');
  
  grid.innerHTML = '';
  heroSection.innerHTML = '';
  heroSection.classList.add('hidden');
  emptyState.classList.add('hidden');
  pagination.classList.add('hidden');
  
  if (state.page === 1) window.scrollTo({ top: 0, behavior: 'smooth' });

  renderedArticlesCache = {}; 

  try {
    const params = new URLSearchParams({
        page: state.page,
        limit: state.limit,
        days: state.days,
        search: state.search,
        source: state.source
    });
    
    const res = await fetch(`${API_URL}/articles?${params}`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    const articles = data.data || [];

    // Cache for bookmark interactions
    articles.forEach(a => renderedArticlesCache[a.url] = a);

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
                state.page = 1;
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
// Helper to escape URLs for HTML attributes
function safeUrl(url) {
    return url.replace(/'/g, "\\'");
}

function renderLayout(items) {
  let gridItems = items;

  // Hero logic
  if (state.page === 1 && !state.search && !state.isBookmarkView && items.length > 0) {
    renderHero(items[0]);
    gridItems = items.slice(1);
  }

  renderGrid(gridItems);
}

function renderHero(article) {
  heroSection.classList.remove('hidden');
  const isSaved = isBookmarked(article.url);
  const sUrl = safeUrl(article.url);
  
  heroSection.innerHTML = `
    <div 
      onclick="openArticle('${sUrl}')"
      class="group relative w-full aspect-[4/5] sm:aspect-video md:h-[450px] lg:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer shadow-xl dark:shadow-none fade-in"
    >
      <img 
        src="${article.image_url || 'https://placehold.co/800x600?text=ODUU'}" 
        onerror="this.src='https://placehold.co/800x600?text=ODUU'"
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-90"></div>
      
      <!-- HERO BOOKMARK BUTTON -->
      <button 
        onclick="toggleBookmark(event, '${sUrl}')" 
        data-url="${article.url}"
        class="bookmark-btn absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all duration-200 z-20 ${
          isSaved 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
          : 'bg-white/10 hover:bg-white/20 text-white'
        }"
      >
        <i data-lucide="bookmark" class="w-5 h-5 ${isSaved ? 'fill-current' : ''}"></i>
      </button>

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
  if (items.length === 0 && !state.isBookmarkView) return;

  grid.innerHTML = items.map((a, index) => {
    const isSaved = isBookmarked(a.url);
    const sUrl = safeUrl(a.url);
    
    return `
    <article 
      class="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl dark:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full fade-in"
      style="animation-delay: ${Math.min(index * 50, 300)}ms"
      onclick="openArticle('${sUrl}')"
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
          
          <!-- GRID BOOKMARK BUTTON -->
          <button 
            onclick="toggleBookmark(event, '${sUrl}')" 
            data-url="${a.url}"
            class="bookmark-btn p-2 rounded-full transition-all duration-200 active:scale-95 ${
                isSaved 
                ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' 
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }"
          >
            <i data-lucide="bookmark" class="w-4 h-4 ${isSaved ? 'fill-current' : ''}"></i>
          </button>

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Dubbisuu</span>
            <div class="bg-slate-50 dark:bg-slate-700 p-1.5 md:p-2 rounded-full text-slate-400 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </div>
          </div>
        </div>
      </div>
    </article>
  `}).join('');
}

function openArticle(url) { if(url) window.open(url, '_blank', 'noopener,noreferrer'); }

/* ===============================
   UTILS & HELPERS
================================ */
function updatePagination(p) {
  if (state.isBookmarkView) return;
  pagination.classList.remove('hidden');
  pageInfo.textContent = `${p.current_page} / ${p.total_pages}`;
  state.totalPages = p.total_pages;
  prevBtn.disabled = p.current_page === 1;
  nextBtn.disabled = p.current_page >= p.total_pages;
}

function updateTitle() {
  if (state.isBookmarkView) {
    titleEl.textContent = 'Oduu Kuuffadhe';
  } else if (state.search) {
    titleEl.innerHTML = `Barbaacha: <span class="text-emerald-600 dark:text-emerald-400">"${state.search}"</span>`;
  } else if (state.source) {
    titleEl.textContent = state.source;
  } else {
    titleEl.textContent = 'Oduu Haaraa';
  }
}

function updateActiveFilterUI() {
  filterBtns.forEach(btn => {
    const isSavedBtn = btn.id === 'btn-saved';
    let isActive = false;
    
    if (state.isBookmarkView) isActive = isSavedBtn;
    else isActive = !isSavedBtn && btn.getAttribute('data-source') === state.source;

    btn.className = `filter-btn flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full border whitespace-nowrap cursor-pointer transition-all ${
      isActive 
      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 dark:bg-emerald-600 dark:text-white dark:border-emerald-600 dark:shadow-emerald-900/20' 
      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-emerald-400 dark:hover:text-emerald-400'
    }`;
    
    if (isSavedBtn) btn.classList.add('flex', 'items-center', 'gap-2');
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

prevBtn.onclick = () => { if(state.page > 1) { state.page--; fetchNews(); } };
nextBtn.onclick = () => { if(state.page < state.totalPages) { state.page++; fetchNews(); } };

window.filterSource = s => { state.isBookmarkView = false; state.source = s; state.search = ''; state.page = 1; fetchNews(); };
window.updateSettings = () => { state.days = daysSelect.value; state.limit = limitSelect.value; state.page = 1; fetchNews(); };
window.resetApp = () => { state = { page: 1, limit: 12, search: '', source: '', days: 7, totalPages: 1, isBookmarkView: false }; fetchNews(); };

// Init
fetchNews();

/* ===============================
   OFFLINE DETECTION
================================ */
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
  if (!navigator.onLine) {
    Notiflix.Notify.warning('Interneetii hin qabdan. Oduu kuufame (Offline) dubbisaa jirtu.', { timeout: 5000, clickToClose: true });
    document.body.classList.add('grayscale'); 
  } else {
    Notiflix.Notify.success('Interneetiin deebi\'eera.', { timeout: 2000 });
    document.body.classList.remove('grayscale');
    if(!state.isBookmarkView) fetchNews(); 
  }
}
if (!navigator.onLine) updateOnlineStatus();