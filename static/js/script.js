/* ============================================================
   Music Collaboration System — Frontend Scripts
   ============================================================ */

'use strict';

// ──────────────────────────────────────────────────────────────
// Utility helpers
// ──────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ──────────────────────────────────────────────────────────────
// Flash message auto-dismiss
// ──────────────────────────────────────────────────────────────
function initFlash() {
  $$('.alert').forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.4s, transform 0.4s';
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-8px)';
      setTimeout(() => alert.remove(), 400);
    }, 5000);
  });
}

// ──────────────────────────────────────────────────────────────
// Mobile sidebar toggle
// ──────────────────────────────────────────────────────────────
function initSidebar() {
  const sidebar = $('.sidebar');
  const toggle  = $('#sidebar-toggle');
  if (!sidebar) return;

  on(toggle, 'click', () => sidebar.classList.toggle('open'));

  // Close on outside click
  on(document, 'click', e => {
    if (window.innerWidth < 720 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== toggle) {
      sidebar.classList.remove('open');
    }
  });
}

// ──────────────────────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────────────────────
function initTabs() {
  $$('.tabs').forEach(tabBar => {
    const btns   = $$('.tab-btn', tabBar);
    const panels = $$(`.tab-panel`);

    btns.forEach(btn => {
      on(btn, 'click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        panels.forEach(p => {
          p.classList.toggle('active', p.id === target);
        });
      });
    });
  });
}

// ──────────────────────────────────────────────────────────────
// Star Rating widget
// ──────────────────────────────────────────────────────────────
function initStarRating() {
  $$('.star-rating-widget').forEach(widget => {
    const stars = $$('.star', widget);
    const input = widget.nextElementSibling;   // hidden input

    stars.forEach((star, idx) => {
      on(star, 'click', () => {
        const val = idx + 1;
        if (input) input.value = val;
        stars.forEach((s, i) => s.classList.toggle('filled', i < val));
      });

      on(star, 'mouseenter', () => {
        stars.forEach((s, i) => s.classList.toggle('filled', i <= idx));
      });
    });

    on(widget, 'mouseleave', () => {
      const val = input ? parseInt(input.value) || 0 : 0;
      stars.forEach((s, i) => s.classList.toggle('filled', i < val));
    });
  });
}

// ──────────────────────────────────────────────────────────────
// File drag-and-drop zone
// ──────────────────────────────────────────────────────────────
function initFileDrop() {
  $$('.file-drop-zone').forEach(zone => {
    const input    = zone.querySelector('input[type="file"]');
    const labelEl  = zone.querySelector('.drop-label');
    const hintEl   = zone.querySelector('.drop-hint');

    on(zone, 'click', () => input && input.click());

    on(zone, 'dragover', e => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    on(zone, 'dragleave', () => zone.classList.remove('dragover'));
    on(zone, 'drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (input && e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        updateFileLabel(e.dataTransfer.files[0]);
      }
    });

    on(input, 'change', () => {
      if (input.files.length) updateFileLabel(input.files[0]);
    });

    function updateFileLabel(file) {
      if (labelEl) labelEl.textContent = file.name;
      const kb = (file.size / 1024).toFixed(1);
      const mb = (file.size / (1024*1024)).toFixed(2);
      if (hintEl) hintEl.textContent = `${mb} MB — ${file.type || 'audio'}`;
      zone.style.borderColor = 'var(--accent)';
    }
  });
}

// ──────────────────────────────────────────────────────────────
// Live search
// ──────────────────────────────────────────────────────────────
function initSearch() {
  const searchBar  = $('.search-bar');
  if (!searchBar) return;
  const input      = searchBar.querySelector('input');
  const dropdown   = $('#search-dropdown');
  if (!input || !dropdown) return;

  const doSearch = debounce(async (q) => {
    if (q.length < 2) { dropdown.classList.remove('open'); return; }
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const items = [
        ...data.projects.map(p =>
          `<a class="search-result-item" href="/projects/${p.project_id}">
            <span class="search-result-icon">🎵</span>
            <span>${escHtml(p.title)}</span>
            <span class="text-muted" style="margin-left:auto;font-size:12px">${escHtml(p.genre||'')}</span>
          </a>`),
        ...data.users.map(u =>
          `<div class="search-result-item">
            <span class="search-result-icon">👤</span>
            <span>${escHtml(u.name)}</span>
            <span class="badge badge-gray" style="margin-left:auto">${u.role}</span>
          </div>`)
      ];
      if (items.length) {
        dropdown.innerHTML = items.join('');
        dropdown.classList.add('open');
      } else {
        dropdown.innerHTML = '<div class="search-result-item text-muted">No results</div>';
        dropdown.classList.add('open');
      }
    } catch (_) { /* ignore */ }
  }, 280);

  on(input, 'input', () => doSearch(input.value.trim()));
  on(document, 'click', e => {
    if (!searchBar.contains(e.target)) dropdown.classList.remove('open');
  });
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// ──────────────────────────────────────────────────────────────
// Mini audio player
// ──────────────────────────────────────────────────────────────
let currentAudio = null;
let currentTrackRow = null;

function initMiniPlayer() {
  $$('.track-item[data-url]').forEach(row => {
    on(row, 'click', () => {
      const url = row.dataset.url;
      if (!url) return;

      if (currentTrackRow === row) {
        // toggle pause/play
        if (currentAudio.paused) {
          currentAudio.play();
          setPlaying(row, true);
        } else {
          currentAudio.pause();
          setPlaying(row, false);
        }
        return;
      }

      // Stop previous
      if (currentAudio) {
        currentAudio.pause();
        setPlaying(currentTrackRow, false);
      }

      currentAudio = new Audio(url);
      currentTrackRow = row;
      currentAudio.play().catch(() => {});
      setPlaying(row, true);

      currentAudio.addEventListener('ended', () => setPlaying(row, false));
    });
  });
}

function setPlaying(row, playing) {
  if (!row) return;
  const thumb = row.querySelector('.track-thumb');
  if (thumb) {
    if (playing) {
      const orig = thumb.dataset.orig || thumb.innerHTML;
      thumb.dataset.orig = orig;
      thumb.innerHTML = `<div class="eq-bars">
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
        <div class="eq-bar"></div>
      </div>`;
    } else {
      if (thumb.dataset.orig) thumb.innerHTML = thumb.dataset.orig;
    }
  }
  row.classList.toggle('playing', playing);
}

// ──────────────────────────────────────────────────────────────
// Form validation helpers
// ──────────────────────────────────────────────────────────────
function initFormValidation() {
  $$('form[data-validate]').forEach(form => {
    on(form, 'submit', e => {
      let valid = true;
      $$('[required]', form).forEach(field => {
        const group = field.closest('.form-group');
        const err   = group && group.querySelector('.form-error');
        if (!field.value.trim()) {
          valid = false;
          if (group) group.classList.add('has-error');
          if (err) err.textContent = 'This field is required.';
        } else {
          if (group) group.classList.remove('has-error');
          if (err) err.textContent = '';
        }
      });
      if (!valid) { e.preventDefault(); showToast('Please fill in all required fields.', 'warning'); }
    });
  });
}

// ──────────────────────────────────────────────────────────────
// Toast notifications
// ──────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  let container = $('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} fade-in`;
  toast.style.cssText = 'margin:0;min-width:260px;max-width:360px;box-shadow:var(--shadow-lg)';
  const icons = { success:'✅', danger:'❌', warning:'⚠️', info:'ℹ️' };
  toast.innerHTML = `${icons[type]||'ℹ️'} ${escHtml(msg)}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ──────────────────────────────────────────────────────────────
// Number counter animation (dashboard stats)
// ──────────────────────────────────────────────────────────────
function initCounters() {
  $$('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    if (isNaN(target)) return;
    let current  = 0;
    const step   = Math.ceil(target / 30);
    const tick   = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(tick);
    }, 40);
  });
}

// ──────────────────────────────────────────────────────────────
// Smooth card hover parallax
// ──────────────────────────────────────────────────────────────
function initCardParallax() {
  $$('.project-card').forEach(card => {
    on(card, 'mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const x      = ((e.clientX - rect.left) / rect.width  - 0.5) * 10;
      const y      = ((e.clientY - rect.top)  / rect.height - 0.5) * 10;
      card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${-y}deg) translateY(-4px)`;
    });
    on(card, 'mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ──────────────────────────────────────────────────────────────
// Password strength meter
// ──────────────────────────────────────────────────────────────
function initPasswordStrength() {
  const pwdInput = $('#password');
  const meter    = $('#password-strength');
  if (!pwdInput || !meter) return;

  on(pwdInput, 'input', () => {
    const v = pwdInput.value;
    let score = 0;
    if (v.length >= 8)              score++;
    if (/[A-Z]/.test(v))            score++;
    if (/[0-9]/.test(v))            score++;
    if (/[^A-Za-z0-9]/.test(v))     score++;

    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#e74c3c', '#ffa94d', '#ffd43b', '#43e97b'];
    meter.textContent   = levels[score] || '';
    meter.style.color   = colors[score] || 'transparent';
  });
}

// ──────────────────────────────────────────────────────────────
// Bootstrap all on DOM ready
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initFlash();
  initSidebar();
  initTabs();
  initStarRating();
  initFileDrop();
  initSearch();
  initMiniPlayer();
  initFormValidation();
  initCounters();
  initCardParallax();
  initPasswordStrength();

  // Fade-in page body
  const body = $('.page-body');
  if (body) body.classList.add('fade-in');
});
