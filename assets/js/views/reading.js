/**
 * reading.js — Renders a reading page with markdown + KaTeX + completion tracking.
 */

import { getApp } from '../app.js';
import { markReadingComplete, isReadingComplete } from '../store.js';
import { parseContentWithMath } from '../utils.js';

function navArrow(item, moduleId, direction) {
  if (!item) return `<div class="nav-arrow-spacer"></div>`;
  let href = '';
  if (item.type === 'reading') href = `#/module/${moduleId}/reading/${item.id}`;
  else if (item.type === 'quiz')    href = `#/module/${moduleId}/quiz/${item.id}`;
  else if (item.type === 'lab')     href = `#/module/${moduleId}/lab`;

  const label = direction === 'prev' ? '← Previous' : 'Next →';
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
  return `
    <div class="nav-arrow">
      <span class="nav-arrow-label">${label}</span>
      <a class="nav-arrow-title" href="${href}">${typeLabel}: ${item.id.toUpperCase()}</a>
    </div>`;
}

function referenceList(refs) {
  if (!refs || refs.length === 0) return '';
  const items = refs.map((r, i) => {
    const link = r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${r.title}</a>` : r.title;
    return `<li><strong>${r.label}</strong> — ${link}</li>`;
  }).join('');
  return `
    <div class="reading-references">
      <h3>References</h3>
      <ol>${items}</ol>
    </div>`;
}

export default function renderReading(readingData, moduleData) {
  const app = getApp();
  const moduleId = moduleData.id;
  const readingId = readingData.id;
  const alreadyDone = isReadingComplete(moduleId, readingId);

  // Parse markdown — math is extracted before marked sees it to prevent escaping/italic mangling
  const html = parseContentWithMath(readingData.content ?? '');

  const completeBtnLabel = alreadyDone ? '✓ Completed' : 'Mark as Complete';
  const completeBtnClass = alreadyDone ? 'btn btn-secondary' : 'btn btn-primary';

  // Build sidebar inner HTML once so we can reuse it in both the desktop
  // sidebar and the mobile drawer without duplicating the template logic.
  const sidebarCards = `
    <div class="reading-meta-card">
      <h4>About this reading</h4>
      <div class="reading-meta-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        ~${readingData.estimatedMinutes} min read
      </div>
      <div class="reading-meta-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        ${moduleData.title}
      </div>
    </div>
    ${(readingData.references && readingData.references.length) ? `
    <div class="reading-meta-card">
      <h4>References (${readingData.references.length})</h4>
      ${readingData.references.map(r =>
        `<div class="reading-meta-row" style="flex-direction:column;align-items:flex-start;gap:2px;">
          <span style="font-weight:600;font-size:var(--font-size-xs)">${r.label}</span>
          ${r.url ? `<a href="${r.url}" target="_blank" rel="noopener" style="font-size:var(--font-size-xs)">${r.title}</a>` : `<span style="font-size:var(--font-size-xs);color:var(--text-faint)">${r.title}</span>`}
        </div>`
      ).join('')}
    </div>` : ''}`;

  app.innerHTML = `
    <div class="reading-layout">
      <div class="reading-body">
        <div class="page-header">
          <div class="page-header-meta">
            <span class="badge badge-in-progress" style="background:${moduleData.color}22;color:${moduleData.color}">
              Module ${moduleData.order} Reading
            </span>
            <span style="font-size:var(--font-size-sm);color:var(--text-muted)">~${readingData.estimatedMinutes} min</span>
          </div>
          <h1>${readingData.title}</h1>
        </div>

        <div class="mark-complete-bar">
          <button class="btn ${alreadyDone ? 'btn-secondary' : 'btn-primary'}" id="mark-complete-btn">
            ${alreadyDone ? '✓ Completed' : 'Mark as Complete'}
          </button>
        </div>

        <div class="reading-content" id="reading-content">
          ${html}
        </div>

        ${referenceList(readingData.references)}

        <div class="nav-arrows">
          ${navArrow(readingData.prevItem, moduleId, 'prev')}
          ${navArrow(readingData.nextItem, moduleId, 'next')}
        </div>
      </div>

      <aside class="reading-sidebar">
        ${sidebarCards}
      </aside>
    </div>

    <!-- Mobile: floating info button -->
    <button class="reading-info-btn" id="reading-info-btn" aria-label="Reading info">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
      </svg>
    </button>

    <!-- Mobile: backdrop -->
    <div class="reading-drawer-backdrop" id="reading-drawer-backdrop"></div>

    <!-- Mobile: slide-in drawer -->
    <div class="reading-drawer" id="reading-drawer" role="dialog" aria-modal="true" aria-label="Reading info">
      <div class="reading-drawer-header">
        <h3>Reading Info</h3>
        <button class="reading-drawer-close" id="reading-drawer-close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      ${sidebarCards}
    </div>`;

  // Highlight code blocks (math is already rendered inline above)
  const contentEl = document.getElementById('reading-content');
  if (contentEl) {
    if (window.hljs) {
      contentEl.querySelectorAll('pre code').forEach(block => window.hljs.highlightElement(block));
    }
  }

  // Mobile info drawer
  const infoBtn      = document.getElementById('reading-info-btn');
  const drawer       = document.getElementById('reading-drawer');
  const backdrop     = document.getElementById('reading-drawer-backdrop');
  const drawerClose  = document.getElementById('reading-drawer-close');

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  infoBtn?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  }, { once: true });

  // Mark complete button
  const btn = document.getElementById('mark-complete-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      markReadingComplete(moduleId, readingId);
      btn.textContent = '✓ Completed';
      btn.className = 'btn btn-secondary';
    });
  }
}
