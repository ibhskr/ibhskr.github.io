/* ==========================================================
   Bhaskar Roy | Network engineer portfolio
   ========================================================== */
'use strict';

/* ----------------------------------------------------------
   SETTINGS: edit this block
   ---------------------------------------------------------- */
const CONFIG = {
  // Your GitHub username, for example 'your-username'.
  // Leave empty to hide the GitHub buttons and show a setup note in Projects.
  githubUsername: '',

  // Repo names to show first, in this order (case-insensitive).
  pinned: [],

  // Repo names that should never appear.
  hidden: [],

  // Optional one-line descriptions that replace a repo's own description.
  // Example: { 'ospf-lab': 'OSPF multi-area lab built in GNS3, with topology and configs.' }
  descriptions: {},

  // Maximum number of repos to show.
  maxRepos: 6,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';

/* ----------------------------------------------------------
   Theme toggle
   ---------------------------------------------------------- */
function initTheme() {
  const btn = $('#theme-toggle');
  const root = document.documentElement;
  const sync = () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isLight ? '#f3f6fb' : '#0a1424');
  };
  sync();
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    sync();
    window.dispatchEvent(new Event('themechange'));
  });
}

/* ----------------------------------------------------------
   Navigation: mobile menu and active section
   ---------------------------------------------------------- */
function initNav() {
  const bar = $('.topbar');
  const toggle = $('#menu-toggle');
  const links = $$('#site-nav a');

  const setOpen = (open) => {
    bar.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!bar.classList.contains('nav-open')));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  const map = new Map();
  links.forEach((a) => {
    const section = $(a.getAttribute('href'));
    if (section) map.set(section, a);
  });
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      map.get(entry.target).setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, section) => io.observe(section));
}

/* ----------------------------------------------------------
   Missing photos: show a clear placeholder instead of a broken image
   ---------------------------------------------------------- */
function initImageFallbacks() {
  const handle = (img) => {
    const holder = img.closest('[data-ph]');
    if (!holder || holder.classList.contains('is-missing')) return;
    holder.classList.add('is-missing');
    img.hidden = true;
    const text = document.createElement('span');
    text.className = 'ph-text';
    if (holder.dataset.initials) {
      text.textContent = holder.dataset.initials;
      text.classList.add('is-initials');
    } else {
      text.textContent = 'Add ' + holder.dataset.ph;
    }
    holder.appendChild(text);
  };
  $$('[data-ph] img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) handle(img);
    img.addEventListener('error', () => handle(img));
  });
}

/* ----------------------------------------------------------
   Gallery lightbox
   ---------------------------------------------------------- */
function initGallery() {
  const items = $$('.gallery-item');
  const dlg = $('#lightbox');
  if (!items.length || !dlg || typeof dlg.showModal !== 'function') return;
  const img = $('#lightbox-img');
  const cap = $('#lightbox-caption');
  let index = 0;

  const show = (i) => {
    index = (i + items.length) % items.length;
    const item = items[index];
    const src = $('img', item);
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    cap.textContent = item.dataset.caption || src.alt;
  };
  const step = (dir) => {
    // Skip photos that have not been added yet.
    for (let n = 1; n <= items.length; n++) {
      const i = (index + dir * n + items.length * n) % items.length;
      if (!items[i].classList.contains('is-missing')) { show(i); return; }
    }
  };

  items.forEach((item, i) => {
    item.addEventListener('click', () => {
      if (item.classList.contains('is-missing')) return;
      show(i);
      dlg.showModal();
    });
  });
  $('#lb-prev').addEventListener('click', () => step(-1));
  $('#lb-next').addEventListener('click', () => step(1));
  $('#lb-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}

/* ----------------------------------------------------------
   GitHub projects
   ---------------------------------------------------------- */
const LANG_COLORS = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', Shell: '#89e051',
  HTML: '#e34c26', CSS: '#563d7c', Go: '#00ADD8', 'C++': '#f34b7d', C: '#9a9a9a',
  Java: '#b07219', PowerShell: '#012456', Jinja: '#a52a22', Dockerfile: '#384d54',
};

const CATEGORIES = [
  ['Networking', /\b(network\w*|cisco|packet[- ]?tracer|gns3|eve-?ng|ospf|eigrp|bgp|vlan\w*|routing|switch\w*|tcp|lan|subnet\w*|lab)\b/],
  ['Security', /\b(secur\w*|firewall|vpn|nmap|ids|ips|pentest|hardening|acl\w*)\b/],
  ['Automation', /\b(automat\w*|ansible|netmiko|python|script\w*|bash|backup|ci|cd)\b/],
];

function categorize(repo) {
  const text = [repo.name, repo.description || '', (repo.topics || []).join(' ')]
    .join(' ').toLowerCase().replace(/[_]/g, ' ');
  const hit = CATEGORIES.find(([, re]) => re.test(text));
  return hit ? hit[0] : 'Other';
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  });
  [].concat(children).forEach((c) => c && node.appendChild(c));
  return node;
}

function applyGithubLinks() {
  const user = CONFIG.githubUsername.trim();
  if (!user) return;
  const url = 'https://github.com/' + encodeURIComponent(user);
  $$('[data-github]').forEach((a) => { a.href = url; a.hidden = false; });
  $$('[data-github-row]').forEach((row) => { row.hidden = false; });
  $$('[data-github-text]').forEach((a) => { a.href = url; a.textContent = 'github.com/' + user; });
}

async function initProjects() {
  const grid = $('#repo-grid');
  const status = $('#repo-status');
  const filterBar = $('#repo-filters');
  const user = CONFIG.githubUsername.trim();

  if (!user) {
    status.replaceChildren(
      document.createTextNode('Projects will appear here once a GitHub username is set. Open '),
      el('code', { text: 'js/main.js' }),
      document.createTextNode(' and fill in '),
      el('code', { text: 'githubUsername' }),
      document.createTextNode(' at the top.')
    );
    return;
  }

  status.textContent = 'Loading repositories from GitHub...';
  try {
    const res = await fetch(
      'https://api.github.com/users/' + encodeURIComponent(user) + '/repos?per_page=100&sort=updated',
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!res.ok) throw new Error(res.status === 403 ? 'rate' : 'http');
    let repos = await res.json();

    const hidden = CONFIG.hidden.map((n) => n.toLowerCase());
    repos = repos.filter((r) => !r.fork && !r.archived && !hidden.includes(r.name.toLowerCase()));

    const pinned = CONFIG.pinned.map((n) => n.toLowerCase());
    const rank = (r) => { const i = pinned.indexOf(r.name.toLowerCase()); return i === -1 ? Infinity : i; };
    repos.sort((a, b) =>
      (rank(a) === rank(b) ? 0 : rank(a) < rank(b) ? -1 : 1) ||
      b.stargazers_count - a.stargazers_count ||
      new Date(b.pushed_at) - new Date(a.pushed_at)
    );
    repos = repos.slice(0, CONFIG.maxRepos);

    if (!repos.length) {
      status.textContent = 'No public repositories to show yet.';
      return;
    }
    status.textContent = '';

    const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });
    const cards = repos.map((r) => {
      const category = categorize(r);
      const desc = CONFIG.descriptions[r.name] || r.description || 'No description yet.';
      const meta = el('div', { class: 'repo-meta' }, [
        r.language && el('span', {}, [
          el('i', { class: 'lang-dot', style: 'background:' + (LANG_COLORS[r.language] || 'var(--muted)') }),
          document.createTextNode(r.language),
        ]),
        r.stargazers_count > 0 && el('span', { text: '\u2605 ' + r.stargazers_count }),
        el('span', { text: 'Updated ' + fmt.format(new Date(r.pushed_at)) }),
        el('span', { class: 'repo-tag', text: category }),
      ]);
      const card = el('article', { class: 'repo', 'data-category': category }, [
        el('h3', {}, [el('a', { href: r.html_url, target: '_blank', rel: 'noopener noreferrer', text: r.name })]),
        el('p', { text: desc }),
        meta,
      ]);
      return card;
    });
    grid.replaceChildren(...cards);

    // Filter buttons, only for categories that exist.
    const present = ['All', ...new Set(repos.map(categorize))];
    if (present.length > 2) {
      filterBar.replaceChildren(...present.map((name, i) => {
        const b = el('button', { class: 'filter', type: 'button', 'aria-pressed': String(i === 0), text: name });
        b.addEventListener('click', () => {
          $$('.filter', filterBar).forEach((f) => f.setAttribute('aria-pressed', String(f === b)));
          cards.forEach((c) => { c.hidden = name !== 'All' && c.dataset.category !== name; });
        });
        return b;
      }));
      filterBar.hidden = false;
    }
  } catch (err) {
    const url = 'https://github.com/' + encodeURIComponent(user);
    const why = err.message === 'rate'
      ? 'GitHub is limiting requests from this network right now.'
      : 'The repository list could not be loaded.';
    status.replaceChildren(
      document.createTextNode(why + ' You can still '),
      el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: 'browse the repositories on GitHub' }),
      document.createTextNode('.')
    );
  }
}

/* ----------------------------------------------------------
   Hero network topology
   ---------------------------------------------------------- */
function initTopology() {
  const canvas = $('#topology');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const tip = $('#topology-tip');
  const linkBar = $('#topology-links');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // x and y are 0 to 1 positions inside the canvas.
  const nodes = [
    { id: 'wan', type: 'cloud', x: 0.5, y: 0, label: 'Internet', title: 'Internet edge', text: 'Where traffic leaves the network. Get in touch from here.', href: '#contact' },
    { id: 'fw', type: 'firewall', x: 0.5, y: 0.22, label: 'Firewall', title: 'Network security', text: 'ACLs, port security, device hardening and segmentation.', href: '#sk-security' },
    { id: 'rtr', type: 'router', x: 0.5, y: 0.45, label: 'Router', title: 'Routing', text: 'Static routes, OSPF, EIGRP, BGP basics and inter-VLAN routing.', href: '#sk-routing' },
    { id: 'sw', type: 'switch', x: 0.2, y: 0.7, label: 'Switch', title: 'Switching', text: 'VLANs, 802.1Q trunking, STP and EtherChannel.', href: '#sk-routing' },
    { id: 'nms', type: 'monitor', x: 0.8, y: 0.7, label: 'Monitoring', title: 'Monitoring', text: 'SNMP, Syslog and tools like Zabbix, PRTG and LibreNMS.', href: '#tools' },
    { id: 'srv', type: 'server', x: 0.06, y: 1, label: 'Servers', title: 'Infrastructure', text: 'Windows Server and Linux administration, Active Directory basics.', href: '#sk-infra' },
    { id: 'ap', type: 'wifi', x: 0.34, y: 1, label: 'Wireless', title: 'Wireless', text: 'WLAN and access point setup, WPA2 and WPA3 concepts.', href: '#sk-wireless' },
    { id: 'auto', type: 'auto', x: 0.8, y: 1, label: 'Automation', title: 'Automation', text: 'Python, Netmiko and Ansible for repeatable network tasks.', href: '#sk-automation' },
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const links = [
    ['wan', 'fw'], ['fw', 'rtr'], ['rtr', 'sw'], ['rtr', 'nms'],
    ['sw', 'srv'], ['sw', 'ap'], ['nms', 'auto'],
  ].map(([a, b]) => ({ a: byId[a], b: byId[b] }));

  let w = 0, h = 0, size = 48, dpr = 1;
  let colors = {};
  let hover = null, selected = null;
  let packets = [];
  let spawnIn = 0, last = 0;
  let running = false, onScreen = true;

  /* Keyboard and touch friendly list of the same nodes */
  const chips = nodes.map((n) => {
    const a = el('a', { href: n.href, text: n.label });
    a.addEventListener('mouseenter', () => setHover(n));
    a.addEventListener('mouseleave', () => setHover(null));
    a.addEventListener('focus', () => setHover(n));
    a.addEventListener('blur', () => setHover(null));
    return a;
  });
  linkBar.replaceChildren(...chips);

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    const g = (name) => s.getPropertyValue(name).trim();
    colors = {
      accent: g('--accent'), line: g('--line'), panel: g('--panel'),
      text: g('--text'), muted: g('--muted'), ok: g('--ok'),
    };
  }

  function layout() {
    const padX = Math.max(34, w * 0.09);
    const top = 34, bottom = 58;
    size = w < 420 ? 40 : 48;
    nodes.forEach((n) => {
      n.px = padX + n.x * (w - 2 * padX);
      n.py = top + n.y * (h - top - bottom);
    });
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
    draw();
  }

  /* ---- drawing helpers ---- */
  function roundRect(x, y, rw, rh, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, r);
    ctx.arcTo(x + rw, y + rh, x, y + rh, r);
    ctx.arcTo(x, y + rh, x, y, r);
    ctx.arcTo(x, y, x + rw, y, r);
    ctx.closePath();
  }

  function arrow(x1, y1, x2, y2, head) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.moveTo(x2 - head * Math.cos(ang - 0.5), y2 - head * Math.sin(ang - 0.5));
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang + 0.5), y2 - head * Math.sin(ang + 0.5));
    ctx.stroke();
  }

  function icon(type, cx, cy, u, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (type) {
      case 'router':
        ctx.beginPath(); ctx.arc(0, 0, u * 0.5, 0, Math.PI * 2); ctx.stroke();
        arrow(u * 0.5, 0, u * 1.2, 0, u * 0.35);
        arrow(-u * 0.5, 0, -u * 1.2, 0, u * 0.35);
        arrow(0, u * 0.5, 0, u * 1.2, u * 0.35);
        arrow(0, -u * 0.5, 0, -u * 1.2, u * 0.35);
        break;
      case 'switch':
        arrow(-u * 1.1, -u * 0.4, u * 1.1, -u * 0.4, u * 0.38);
        arrow(u * 1.1, u * 0.4, -u * 1.1, u * 0.4, u * 0.38);
        break;
      case 'firewall':
        ctx.strokeRect(-u * 1.1, -u * 0.85, u * 2.2, u * 1.7);
        ctx.beginPath();
        ctx.moveTo(-u * 1.1, -u * 0.28); ctx.lineTo(u * 1.1, -u * 0.28);
        ctx.moveTo(-u * 1.1, u * 0.28); ctx.lineTo(u * 1.1, u * 0.28);
        ctx.moveTo(0, -u * 0.85); ctx.lineTo(0, -u * 0.28);
        ctx.moveTo(-u * 0.55, -u * 0.28); ctx.lineTo(-u * 0.55, u * 0.28);
        ctx.moveTo(u * 0.55, -u * 0.28); ctx.lineTo(u * 0.55, u * 0.28);
        ctx.moveTo(0, u * 0.28); ctx.lineTo(0, u * 0.85);
        ctx.stroke();
        break;
      case 'server':
        ctx.strokeRect(-u, -u * 0.95, u * 2, u * 0.85);
        ctx.strokeRect(-u, u * 0.1, u * 2, u * 0.85);
        ctx.beginPath(); ctx.arc(-u * 0.55, -u * 0.52, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-u * 0.55, u * 0.52, 1.8, 0, Math.PI * 2); ctx.fill();
        break;
      case 'cloud':
        ctx.beginPath();
        ctx.moveTo(-u * 0.7, u * 0.5);
        ctx.bezierCurveTo(-u * 1.4, u * 0.5, -u * 1.3, -u * 0.35, -u * 0.5, -u * 0.3);
        ctx.bezierCurveTo(-u * 0.4, -u * 1.0, u * 0.5, -u * 1.0, u * 0.6, -u * 0.2);
        ctx.bezierCurveTo(u * 1.5, -u * 0.2, u * 1.4, u * 0.5, u * 0.7, u * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'monitor':
        ctx.strokeRect(-u * 1.1, -u * 0.85, u * 2.2, u * 1.45);
        ctx.beginPath();
        ctx.moveTo(0, u * 0.6); ctx.lineTo(0, u * 0.95);
        ctx.moveTo(-u * 0.5, u * 0.95); ctx.lineTo(u * 0.5, u * 0.95);
        ctx.moveTo(-u * 0.8, u * 0.1); ctx.lineTo(-u * 0.4, u * 0.1);
        ctx.lineTo(-u * 0.2, -u * 0.45); ctx.lineTo(u * 0.05, u * 0.4);
        ctx.lineTo(u * 0.25, -u * 0.1); ctx.lineTo(u * 0.8, -u * 0.1);
        ctx.stroke();
        break;
      case 'wifi':
        [0.55, 1.05, 1.55].forEach((r) => {
          ctx.beginPath();
          ctx.arc(0, u * 0.75, u * r, -Math.PI * 0.8, -Math.PI * 0.2);
          ctx.stroke();
        });
        ctx.beginPath(); ctx.arc(0, u * 0.75, 1.9, 0, Math.PI * 2); ctx.fill();
        break;
      case 'auto':
        ctx.font = '600 ' + Math.round(u * 1.45) + 'px ' + MONO;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('>_', 0, 1);
        break;
      default:
        break;
    }
    ctx.restore();
  }

  function led(from, to) {
    const dx = to.px - from.px, dy = to.py - from.py;
    const len = Math.hypot(dx, dy) || 1;
    const d = size / 2 + 4;
    ctx.beginPath();
    ctx.arc(from.px + (dx / len) * d, from.py + (dy / len) * d, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = colors.ok;
    ctx.fill();
  }

  function draw() {
    if (!w) return;
    ctx.clearRect(0, 0, w, h);
    const active = hover || selected;

    links.forEach((l) => {
      const lit = active && (l.a === active || l.b === active);
      ctx.beginPath();
      ctx.moveTo(l.a.px, l.a.py);
      ctx.lineTo(l.b.px, l.b.py);
      ctx.strokeStyle = lit ? colors.accent : colors.line;
      ctx.lineWidth = lit ? 2.4 : 2;
      ctx.stroke();
      led(l.a, l.b);
      led(l.b, l.a);
    });

    // Packets travel under the device boxes.
    packets.forEach((p) => {
      const from = p.dir > 0 ? p.link.a : p.link.b;
      const to = p.dir > 0 ? p.link.b : p.link.a;
      for (let i = 3; i >= 0; i--) {
        const k = Math.max(0, p.t - i * 0.035);
        const x = from.px + (to.px - from.px) * k;
        const y = from.py + (to.py - from.py) * k;
        ctx.beginPath();
        ctx.arc(x, y, i === 0 ? 3.4 : 2.6 - i * 0.4, 0, Math.PI * 2);
        ctx.globalAlpha = i === 0 ? 1 : 0.5 - i * 0.12;
        ctx.fillStyle = colors.accent;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    nodes.forEach((n) => {
      const on = n === active;
      const s = size;
      ctx.save();
      if (on) { ctx.shadowColor = colors.accent; ctx.shadowBlur = 18; }
      roundRect(n.px - s / 2, n.py - s / 2, s, s, 10);
      ctx.fillStyle = colors.panel;
      ctx.fill();
      ctx.lineWidth = on ? 2 : 1.5;
      ctx.strokeStyle = on ? colors.accent : colors.line;
      ctx.stroke();
      ctx.restore();

      icon(n.type, n.px, n.py, s * 0.25, on ? colors.accent : colors.text);

      ctx.font = (w < 420 ? 11 : 12) + 'px ' + MONO;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = on ? colors.text : colors.muted;
      ctx.fillText(n.label, n.px, n.py + s / 2 + 8);
    });
  }

  /* ---- packet animation ---- */
  function update(dt) {
    spawnIn -= dt;
    if (spawnIn <= 0 && packets.length < 9) {
      const link = links[Math.floor(Math.random() * links.length)];
      packets.push({ link, t: 0, dir: Math.random() < 0.5 ? 1 : -1 });
      spawnIn = 0.3 + Math.random() * 0.5;
    }
    packets.forEach((p) => {
      const len = Math.hypot(p.link.b.px - p.link.a.px, p.link.b.py - p.link.a.py) || 1;
      p.t += (150 / len) * dt;
    });
    packets = packets.filter((p) => p.t < 1);
  }

  function frame(ts) {
    if (!running) return;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  function start() {
    if (reduceMotion || running || !onScreen || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  /* ---- interaction ---- */
  function hit(evt) {
    const r = canvas.getBoundingClientRect();
    const x = evt.clientX - r.left, y = evt.clientY - r.top;
    let best = null, bestD = size * 0.8;
    nodes.forEach((n) => {
      const d = Math.hypot(n.px - x, n.py - y);
      if (d < bestD) { best = n; bestD = d; }
    });
    return best;
  }

  function showTip(n, touch) {
    if (!n) { tip.hidden = true; return; }
    tip.replaceChildren(
      el('strong', { text: n.title }),
      document.createTextNode(n.text),
      el('small', { text: touch ? 'Tap again to jump to this section' : 'Click to jump to this section' })
    );
    tip.hidden = false;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const left = Math.min(Math.max(n.px - tw / 2, 6), w - tw - 6);
    const above = n.py - size / 2 - 10 - th;
    const top = above > 4 ? above : n.py + size / 2 + 26;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  function setHover(n, touch) {
    if (hover === n) return;
    hover = n;
    showTip(n || selected, touch);
    if (!running) draw();
  }

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const n = hit(e);
    canvas.style.cursor = n ? 'pointer' : 'default';
    setHover(n);
  });
  canvas.addEventListener('pointerleave', () => setHover(null));
  canvas.addEventListener('pointerup', (e) => {
    const n = hit(e);
    if (!n) { selected = null; hover = null; showTip(null); if (!running) draw(); return; }
    if (e.pointerType === 'touch') {
      if (selected === n) { selected = null; showTip(null); window.location.hash = n.href; }
      else { selected = n; hover = null; showTip(n, true); }
      if (!running) draw();
    } else {
      window.location.hash = n.href;
    }
  });

  /* ---- setup ---- */
  readColors();
  window.addEventListener('themechange', () => { readColors(); draw(); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start(); else stop();
    }).observe(canvas);
  }
  resize();
  start();
}

/* ----------------------------------------------------------
   Start everything
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
  initTheme();
  initNav();
  initImageFallbacks();
  initGallery();
  applyGithubLinks();
  initProjects();
  initTopology();
});