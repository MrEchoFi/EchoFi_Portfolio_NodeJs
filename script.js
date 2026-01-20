
document.getElementById('year').textContent = new Date().getFullYear();

// Scroll progress
const progress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  progress.style.width = `${scrolled}%`;
});

// Custom cursor
const cursor = document.querySelector('.cursor');
const outline = document.querySelector('.cursor-outline');
let mouseX = 0, mouseY = 0, outlineX = 0, outlineY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
});
(function animateOutline() {
  outlineX += (mouseX - outlineX) * 0.12;
  outlineY += (mouseY - outlineY) * 0.12;
  outline.style.transform = `translate(${outlineX}px, ${outlineY}px)`;
  requestAnimationFrame(animateOutline);
})();

// Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in'); });
}, { threshold: 0.12 });
reveals.forEach(el => io.observe(el));

// Smooth scroll for nav links
document.querySelectorAll('header nav a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    window.scrollTo({ top: target.offsetTop - 56, behavior: 'smooth' });
    
    closeMobileMenu();
  });
});



// Mobile menu
const header = document.getElementById('header');
const menuBtn = document.getElementById('menu-toggle');
function closeMobileMenu() {
  header.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
}
menuBtn.addEventListener('click', () => {
  const isOpen = header.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(isOpen));
});
window.addEventListener('resize', () => {
  
  if (window.innerWidth > 860) closeMobileMenu();
});


(function() {
  const crest = document.getElementById('crest');
  if (!crest) return;
  let rx = 0, ry = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    rx = (e.clientY - cy) / window.innerHeight * -12;
    ry = (e.clientX - cx) / window.innerWidth  *  12;
  });
  (function tick(){
    tx += (rx - tx)*0.1;
    ty += (ry - ty)*0.1;
    crest.style.transform = `rotateX(${tx}deg) rotateY(${ty}deg)`;
    requestAnimationFrame(tick);
  })();
})();

/* Particles */
particlesJS('particles-js', {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 } },
    color: { value: ['#67e8f9', '#a78bfa', '#8aa3ff'] },
    shape: { type: 'polygon', polygon: { nb_sides: 6 } },
    opacity: { value: 0.35, random: true, anim: { enable: true, speed: 0.6, opacity_min: 0.1, sync: false } },
    size: { value: 3, random: true, anim: { enable: false, speed: 40, size_min: 0.1, sync: false } },
    line_linked: { enable: true, distance: 140, color: '#89a0ff', opacity: 0.35, width: 1 },
    move: { enable: true, speed: 1.4, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
  },
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: { enable: true, mode: 'grab' },
      onclick: { enable: true, mode: 'push' },
      resize: true
    },
    modes: {
      grab: { distance: 160, line_linked: { opacity: 0.35 } },
      push: { particles_nb: 3 }
    }
  },
  retina_detect: true
});

/* Sequentially marged porjects using github api */


const API_BASE = '/api/repos';




let ALL_REPOS = [];

const PROJECT_ORDER = [
  'BannerGrapV2', 'EchoFi_BoX_V1-', 'GreeDoS_V2', 'Web-Development-Project', 'DentoGuard', 'EchoFi_Pocket_Server.',
  'EchoFi_Keylogger_Primo', 'EchoFi_USB_rubber_ducky', 'EchoFi_SpiderBot', 'EchoFi_Droid',
  'EchoFi_USB_rubber_ducky','Phish_Mail', 'Nike_Frontend-', 'GreeDoS_V1', 'BannerGrapV1', 'EchoFi_8266Deauther','LFR_BOT_-_Obstacle_Avoiding_with_Esp32CAM_Surveillance-', 'GRABBER',
  'NetWraith', 'Trios_terminal-', 'EchoFi_Kilog', 'EchoFi_BLE_Joystick', 'Echo_Snipe',
  'EchoFi_ObstacleAvoiding_Bot','HMS_By-Tanjib_MrEchoFi','EchoFi_Portfolio_NodeJs','Bcrypt_lib-based-defensive-brute-force-attacks-and-credential-stuffing-signup-login-page-','Book-Of-Operational_Scapy-BY-Tanjib-Isham', 'Deauth_All',
  'Fidelity_Xploit', 'Lesson-of-keylogger-BY-tanjib_isham','E-commerce_site.',
  'Concept-of-RubberDucky-using-M5-Stamp-S3','All_Projects_of_MrEchoFi_Md-Abu-Naser-Nayeem'
];

const EXCLUDE = new Set([
  'All_Projects_of_MrEchoFi_Md-Abu-Naser-Nayeem'
]);

const loadingEl = document.getElementById('projects-loading');
const errorEl = document.getElementById('projects-error');
const gridEl = document.getElementById('projects-grid');

/*function orderRepos(repos) {
  const filtered = repos.filter(r => !r.private && !r.fork && !EXCLUDE.has(r.name));
  // Oldest → newest
  filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Pin your ordered list first
  const map = new Map(filtered.map(r => [r.name, r]));
  const prioritized = PROJECT_ORDER.map(name => map.get(name)).filter(Boolean);
  for (const p of prioritized) map.delete(p.name);
  const rest = Array.from(map.values());

  return [...prioritized, ...rest];
}*/

/*function renderProjects(repos) {
  const list = orderRepos(repos);
 function createCard(repo) {
  const desc = repo.description || "No description provided";
  const lang = repo.language || "Unknown";
  const dateStr = new Date(repo.updated_at).toLocaleDateString();
  const demoLink = repo.homepage
    ? `<a class="badge" href="${repo.homepage}" target="_blank" rel="noopener">🔗 Demo</a>`
    : "";

  return `
    <a class="project reveal" href="${repo.html_url}" target="_blank" rel="noopener">
      <div class="thumb">
        <svg class="hex" viewBox="0 0 100 100">
          <polygon points="50,1 95,25 95,75 50,99 5,75 5,25"></polygon>
        </svg>
      </div>
      <h3>${repo.name}</h3>
      <p>${desc}</p>
      <div class="meta">
        <span class="badge">${lang}</span>
        <span class="badge">⭐ ${repo.stargazers_count}</span>
        <span class="badge">${dateStr}</span>
        ${demoLink}
      </div>
    </a>
  `;
}

// When you render:
gridEl.innerHTML = list.map(createCard).join('');

}*/

async function loadRepos() {
  loadingEl.hidden = false;
  errorEl.hidden = true;
  gridEl.hidden = true;

  try {
    const res = await fetch(`${API_BASE}?user=MrEchoFi`, { cache: 'no-store' });
    console.log('Status:', res.status);

    if (!res.ok) throw new Error(`API ${res.status}`);

    const repos = await res.json();
    console.log('Data received:', repos, 'Is array?', Array.isArray(repos));

    ALL_REPOS = Array.isArray(repos) ? repos : [];
    renderProjects(ALL_REPOS);
    gridEl.hidden = false;

  } catch (e) {
    console.error('loadRepos error:', e);
    errorEl.hidden = false;

  } finally {
    loadingEl.hidden = true;
  }
}

//document.addEventListener('DOMContentLoaded', loadRepos);

function orderRepos(repos, includeArchived=false) {
  let filtered = repos.filter(r =>
    !r.private && !r.fork && !EXCLUDE.has(r.name) && (includeArchived || !r.archived)
  );
  // Sequential (oldest -> newest)
  filtered.sort((a,b)=> new Date(a.created_at) - new Date(b.created_at));

  // Priority pins first
  const map = new Map(filtered.map(r => [r.name, r]));
  const prioritized = PROJECT_ORDER.map(n => map.get(n)).filter(Boolean);
  for (const p of prioritized) map.delete(p.name);
  const rest = Array.from(map.values());
  return [...prioritized, ...rest];
}

function colorFor(language, seed) {
  if (language === 'JavaScript') return ['#f7df1e','#ffd166'];
  if (language === 'TypeScript') return ['#3178c6','#63a4ff'];
  if (language === 'Python') return ['#3572A5','#6ca0dc'];
  if (language === 'C') return ['#555555','#888888'];
  if (language === 'C++') return ['#004482','#2a71b8'];
  if (language === 'Shell') return ['#89e051','#a8f07a'];
  if (language === 'HTML') return ['#e34c26','#ff7b5a'];
  if (language === 'CSS') return ['#563d7c','#8a5ef5'];
  return seed % 2 ? ['#67e8f9','#a78bfa'] : ['#a78bfa','#67e8f9'];
}
function initials(name){
  const parts = name.replace(/[-_]/g,' ').split(' ').filter(Boolean);
  const chars = parts[0]?.[0] + (parts[1]?.[0] || '');
  return (chars || name.slice(0,2)).toUpperCase().slice(0,2);
}
function hexThumbSVG(repo) {
  const seed = repo.name.length + (repo.stargazers_count||0);
  const [c1, c2] = colorFor(repo.language, seed);
  const text = initials(repo.name);
  return `
<svg class="hex" viewBox="0 0 100 100" width="64" height="64" aria-hidden="true">
  <defs>
    <linearGradient id="hexg-${repo.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="shine-${repo.id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(255,255,255,0)"/>
      <stop offset="0.5" stop-color="rgba(255,255,255,0.8)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <polygon points="50,2 96,26 96,74 50,98 4,74 4,26" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <polygon points="50,8 90,28 90,72 50,92 10,72 10,28" fill="url(#hexg-${repo.id})" opacity="0.18"/>
  <rect class="shine" x="-120" y="-20" width="80" height="160" transform="rotate(20 50 50)"/>
  <text x="50" y="58" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="28" fill="rgba(255,255,255,0.92)">${text}</text>
</svg>`;
}
function langBadge(language) {
  if (!language) return '';
  return `<span class="badge">${language}</span>`;
}
function createCard(repo) {
  const card = document.createElement('a');
  card.className = 'project reveal';
  card.href = repo.html_url;
  card.target = '_blank';
  card.rel = 'noopener';

  const desc = repo.description || 'No description provided.';
  const updated = new Date(repo.pushed_at);
  const dateStr = updated.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  const homepage = repo.homepage && repo.homepage.trim() ? repo.homepage : null;
  const demoLink = homepage ? `<a class="badge" href="${homepage}" target="_blank" rel="noopener">Demo</a>` : '';

  card.innerHTML = `
    <div class="thumb">${hexThumbSVG(repo)}</div>
    <h3>${repo.name}</h3>
    <p>${desc}</p>
    <div class="meta">
      ${langBadge(repo.language)}
      <span class="badge">⭐ ${repo.stargazers_count}</span>
      
      <span class="badge" title="Last update">${dateStr}</span>
      ${demoLink}
    </div>
  `;
  return card;
}
function renderProjectsGrid(repos) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  for (const r of repos) grid.appendChild(createCard(r));
  grid.querySelectorAll('.project').forEach(el => io.observe(el));
}
function applyFiltersAndRender() {
  try {
    const showArchived = document.getElementById('show-archived')?.checked ?? false;

    if (!Array.isArray(ALL_REPOS)) {
      console.error('applyFiltersAndRender: ALL_REPOS is not an array', ALL_REPOS);
      
      renderProjectsGrid([]);
    } else {
      console.log('applyFiltersAndRender: repos before order', ALL_REPOS);
      const ordered = orderRepos(ALL_REPOS, showArchived);
      console.log('applyFiltersAndRender: repos after order', ordered);
      renderProjectsGrid(Array.isArray(ordered) ? ordered : []);
    }

    
    document.getElementById('projects-loading').hidden = true;
    const bar = document.getElementById('projects-progress-bar');
    if (bar) bar.style.width = '0%';
    document.getElementById('projects-grid').hidden = false;

  } catch (err) {
    console.error('applyFiltersAndRender error:', err);
    
    renderProjectsGrid([]);
  }
}

async function initProjects() {
  const loading = document.getElementById('projects-loading');
  const grid = document.getElementById('projects-grid');
  const error = document.getElementById('projects-error');

  loading.hidden = false;
  grid.hidden = true;
  error.hidden = true;
  
  const bar = document.getElementById('projects-progress-bar');
  if (bar) {
    bar.style.width = '0%';
    let progress = 0;
    let interval = setInterval(() => {
      progress += Math.random() * 18 + 7; 
      if (progress > 90) progress = 90;
      bar.style.width = progress + '%';
    }, 300);
    loading._progressInterval = interval;
  }

  try {
    await loadRepos();

    
    const bar = document.getElementById('projects-progress-bar');
    if (bar) {
      bar.style.width = '100%';
      setTimeout(() => {
        if (loading._progressInterval) clearInterval(loading._progressInterval);
        applyFiltersAndRender();
      }, 400);
    } else {
      applyFiltersAndRender();
    }
  } catch (e) {
    console.error(e);
    if (loading._progressInterval) clearInterval(loading._progressInterval);
    loading.hidden = true;
    error.hidden = false;
    if (error) {
      error.textContent = e.message || 'Failed to load repositories. Please try again later.';
    }
  }
}


const liveSearch = (() => {
  let t; return () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const q = document.getElementById('project-search').value.toLowerCase();
      document.querySelectorAll('#projects-grid .project').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? '' : 'none';
      });
    }, 120);
  };
})();
document.getElementById('project-search').addEventListener('input', liveSearch);
document.getElementById('show-archived').addEventListener('change', applyFiltersAndRender);

initProjects();
