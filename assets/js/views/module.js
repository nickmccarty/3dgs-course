/**
 * module.js — Renders the module overview page.
 */

import { getApp } from '../app.js';
import { moduleProgress, isModuleUnlocked, fmtPct } from '../progress.js';
import { isReadingComplete, getQuizRecord, isLabVisited } from '../store.js';
import { renderInlineWithMath } from '../utils.js';

function readingIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>`;
}

function quizIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`;
}

function labIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
  </svg>`;
}

function readingCard(r, moduleId) {
  const done = isReadingComplete(moduleId, r.id);
  const badge = done
    ? `<span class="badge badge-complete">✓ Done</span>`
    : `<span class="badge badge-new">Unread</span>`;
  return `
    <a class="item-card" href="#/module/${moduleId}/reading/${r.id}">
      <div class="item-card-icon reading">${readingIcon()}</div>
      <div class="item-card-body">
        <div class="item-card-title">${r.title}</div>
        <div class="item-card-meta">
          <span>Reading</span>
          <span>~${r.estimatedMinutes} min</span>
        </div>
      </div>
      <div class="item-card-status">${badge}</div>
    </a>`;
}

function quizCard(q, moduleId) {
  const rec = getQuizRecord(moduleId, q.id);
  let badge = `<span class="badge badge-new">Not Started</span>`;
  if (rec) {
    const pct = Math.round(rec.bestScore * 100);
    const passed = rec.bestScore >= (q.passingScore ?? 0.7);
    badge = passed
      ? `<span class="badge badge-passed">✓ ${pct}%</span>`
      : `<span class="badge badge-failed">✗ ${pct}%</span>`;
  }
  return `
    <a class="item-card" href="#/module/${moduleId}/quiz/${q.id}">
      <div class="item-card-icon quiz">${quizIcon()}</div>
      <div class="item-card-body">
        <div class="item-card-title">${q.title}</div>
        <div class="item-card-meta">
          <span>Quiz</span>
          <span>${q.questionCount} questions</span>
          <span>Pass: ${Math.round((q.passingScore ?? 0.7) * 100)}%</span>
        </div>
      </div>
      <div class="item-card-status">${badge}</div>
    </a>`;
}

function labCard(lab, moduleId) {
  const visited = isLabVisited(moduleId, lab.id);
  const badge = visited
    ? `<span class="badge badge-complete">✓ Visited</span>`
    : `<span class="badge badge-new">Not Started</span>`;
  return `
    <a class="item-card" href="#/module/${moduleId}/lab">
      <div class="item-card-icon lab">${labIcon()}</div>
      <div class="item-card-body">
        <div class="item-card-title">${lab.title}</div>
        <div class="item-card-meta">
          <span>Lab</span>
          <span>~${lab.estimatedMinutes} min</span>
          <span>Google Colab</span>
        </div>
      </div>
      <div class="item-card-status">${badge}</div>
    </a>`;
}

export default function renderModule(moduleData, allModulesMeta, courseData) {
  const app = getApp();
  const moduleId = moduleData.id;
  const prog = moduleProgress(moduleData);
  const color = moduleData.color;

  const objectivesList = (moduleData.learningObjectives ?? [])
    .map(o => `<li>${renderInlineWithMath(o)}</li>`)
    .join('');

  const readingCards = (moduleData.readings ?? [])
    .map(r => readingCard(r, moduleId))
    .join('');

  const quizCards = (moduleData.quizzes ?? [])
    .map(q => quizCard(q, moduleId))
    .join('');

  const labCardHtml = moduleData.lab ? labCard(moduleData.lab, moduleId) : '';

  app.innerHTML = `
    <div class="page-header">
      <div class="page-header-meta">
        <span class="badge badge-in-progress" style="background:${color}22;color:${color}">
          Module ${moduleData.order}
        </span>
        <span style="font-size:var(--font-size-sm);color:var(--text-muted)">
          ${prog.completed}/${prog.total} completed · ${fmtPct(prog.pct)}
        </span>
      </div>
      <h1>${moduleData.title}</h1>
      <div class="progress-bar-wrap" style="margin-top:var(--space-3);">
        <div class="progress-bar-fill" style="width:${fmtPct(prog.pct)};background:${color}"></div>
      </div>
    </div>

    ${objectivesList ? `
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-5);margin-bottom:var(--space-8);">
      <h3 style="font-size:var(--font-size-sm);text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:var(--space-3);">Learning Objectives</h3>
      <ul style="list-style:disc;padding-left:var(--space-5);display:flex;flex-direction:column;gap:var(--space-2);">
        ${objectivesList}
      </ul>
    </div>` : ''}

    <div style="margin-bottom:var(--space-6);">
      <h2 style="font-size:var(--font-size-sm);font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:var(--space-4);">Readings</h2>
      <div class="item-list">${readingCards}</div>
    </div>

    <div style="margin-bottom:var(--space-6);">
      <h2 style="font-size:var(--font-size-sm);font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:var(--space-4);">Quizzes</h2>
      <div class="item-list">${quizCards}</div>
    </div>

    ${labCardHtml ? `
    <div style="margin-bottom:var(--space-6);">
      <h2 style="font-size:var(--font-size-sm);font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:var(--space-4);">Lab</h2>
      <div class="item-list">${labCardHtml}</div>
    </div>` : ''}
  `;
}
