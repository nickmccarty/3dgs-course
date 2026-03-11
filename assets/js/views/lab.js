/**
 * lab.js — Lab page: description, objectives, Colab link, completion tracking.
 */

import { getApp } from '../app.js';
import { markLabVisited, markLabColabClicked, isLabVisited } from '../store.js';
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

export default function renderLab(labData, moduleData) {
  const app = getApp();
  const moduleId = moduleData.id;
  const labId = labData.id;

  // Mark as visited immediately
  markLabVisited(moduleId, labId);

  const visited = isLabVisited(moduleId, labId);

  const objectivesHtml = (labData.objectives ?? [])
    .map((o, i) => `
      <div style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--border);">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--success-bg);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${i + 1}</div>
        <span style="font-size:var(--font-size-sm)">${o}</span>
      </div>`)
    .join('');

  const descHtml = parseContentWithMath(labData.description ?? '');

  app.innerHTML = `
    <div class="page-header">
      <div class="page-header-meta">
        <span class="badge" style="background:${moduleData.color}22;color:${moduleData.color};font-weight:700;">
          Module ${moduleData.order} Lab
        </span>
        <span class="badge badge-complete">✓ Visited</span>
        <span style="font-size:var(--font-size-sm);color:var(--text-muted)">~${labData.estimatedMinutes} min</span>
      </div>
      <h1>${labData.title}</h1>
    </div>

    <!-- Colab launch card -->
    <div style="background:linear-gradient(135deg,#f97316,#f59e0b);border-radius:var(--radius-xl);padding:var(--space-6) var(--space-8);margin-bottom:var(--space-8);display:flex;align-items:center;justify-content:space-between;gap:var(--space-6);flex-wrap:wrap;">
      <div>
        <div style="color:rgba(255,255,255,0.85);font-size:var(--font-size-sm);margin-bottom:4px;font-weight:600;">Google Colab Notebook</div>
        <div style="color:#fff;font-size:var(--font-size-xl);font-weight:700;">${labData.title}</div>
        <div style="color:rgba(255,255,255,0.8);font-size:var(--font-size-sm);margin-top:4px;">
          Python · ~${labData.estimatedMinutes} min
        </div>
      </div>
      <a
        href="${labData.colabUrl}"
        target="_blank"
        rel="noopener"
        id="colab-btn"
        class="btn btn-lg"
        style="background:#fff;color:#f97316;font-weight:700;flex-shrink:0;"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Open in Colab
      </a>
    </div>

    <!-- Objectives -->
    ${objectivesHtml ? `
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-5);margin-bottom:var(--space-8);">
      <h3 style="font-size:var(--font-size-sm);text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:var(--space-3);">
        Lab Objectives
      </h3>
      ${objectivesHtml}
    </div>` : ''}

    <!-- Description -->
    <div class="reading-content" id="lab-description">
      ${descHtml}
    </div>

    <div class="nav-arrows">
      ${navArrow(labData.prevItem, moduleId, 'prev')}
      ${navArrow(labData.nextItem, moduleId, 'next')}
    </div>`;

  // Highlight code blocks (math already rendered by parseContentWithMath)
  const descEl = document.getElementById('lab-description');
  if (descEl && window.hljs) {
    descEl.querySelectorAll('pre code').forEach(b => window.hljs.highlightElement(b));
  }

  // Track Colab click
  document.getElementById('colab-btn')?.addEventListener('click', () => {
    markLabColabClicked(moduleId, labId);
  });
}
