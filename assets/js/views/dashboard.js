/**
 * dashboard.js — Renders the course home/dashboard view.
 */

import { getApp } from '../app.js';
import { courseProgress, moduleProgress, isModuleUnlocked, fmtPct } from '../progress.js';

function progressRing(pct, color, size = 48) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return `
    <div class="progress-ring-wrap" style="width:${size}px;height:${size}px;">
      <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="progress-ring-bg" cx="${size/2}" cy="${size/2}" r="${r}"/>
        <circle class="progress-ring-fill"
          cx="${size/2}" cy="${size/2}" r="${r}"
          style="stroke:${color};stroke-dasharray:${circ};stroke-dashoffset:${offset};"
        />
      </svg>
      <span class="progress-ring-text">${Math.round(pct*100)}%</span>
    </div>`;
}

function moduleCard(moduleMeta, moduleData, unlocked, courseMeta) {
  const prog = moduleProgress(moduleData);
  const color = moduleMeta.color;
  const locked = !unlocked;

  let statusBadge = '';
  if (locked) {
    statusBadge = `<span class="badge badge-locked">🔒 Locked</span>`;
  } else if (prog.pct === 0) {
    statusBadge = `<span class="badge badge-new">New</span>`;
  } else if (prog.pct >= 1) {
    statusBadge = `<span class="badge badge-complete">✓ Complete</span>`;
  } else {
    statusBadge = `<span class="badge badge-in-progress">In Progress</span>`;
  }

  const href = locked ? 'javascript:void(0)' : `#/module/${moduleMeta.id}`;
  const cardClass = `module-card${locked ? ' module-card-locked' : ''}`;

  const lockIcon = locked ? `
    <div class="lock-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </div>` : '';

  const prereqModule = moduleMeta.prereq
    ? courseMeta.modules.find(m => m.id === moduleMeta.prereq)
    : null;

  const lockedHint = locked && prereqModule
    ? `<p style="font-size:var(--font-size-xs);color:var(--text-faint);margin-top:var(--space-2);">Complete ${prereqModule.title} (≥60%) to unlock</p>`
    : '';

  return `
    <a class="${cardClass}" href="${href}" style="--module-color:${color}">
      ${lockIcon}
      <div class="module-card-header">
        <div>
          <div class="module-card-num">Module ${moduleMeta.order}</div>
          <h3 class="module-card-title">${moduleData.title}</h3>
        </div>
        ${progressRing(prog.pct, color)}
      </div>
      <p class="module-card-desc">${moduleMeta.description}</p>
      ${lockedHint}
      <div class="module-card-footer">
        <div class="module-progress-wrap">
          <div class="module-progress-label">
            <span>${prog.completed}/${prog.total} items</span>
            <span>${fmtPct(prog.pct)}</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${fmtPct(prog.pct)};background:${color}"></div>
          </div>
        </div>
        ${statusBadge}
      </div>
    </a>`;
}

export default function renderDashboard(courseData, modulesMeta) {
  const app = getApp();

  const overall = courseProgress(modulesMeta);

  // Stats
  const totalReadings = modulesMeta.reduce((s, m) => s + (m.readings?.length ?? 0), 0);
  const totalQuizzes  = modulesMeta.reduce((s, m) => s + (m.quizzes?.length ?? 0), 0);

  // Module cards
  const cards = courseData.modules.map((moduleMeta, i) => {
    const moduleData = modulesMeta[i];
    const unlocked = isModuleUnlocked(moduleData, modulesMeta, courseData.unlockThreshold);
    return moduleCard(moduleMeta, moduleData, unlocked, courseData);
  }).join('');

  app.innerHTML = `
    <div class="dashboard-hero">
      <h1>${courseData.title}</h1>
      <p class="subtitle">${courseData.subtitle}</p>
      <div class="hero-stats">
        <div class="hero-stat">
          <span class="hero-stat-value">${courseData.modules.length}</span>
          <span class="hero-stat-label">Modules</span>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-value">${totalReadings}</span>
          <span class="hero-stat-label">Readings</span>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-value">${totalQuizzes}</span>
          <span class="hero-stat-label">Quizzes</span>
        </div>
        <div class="hero-stat">
          <span class="hero-stat-value">${courseData.modules.length}</span>
          <span class="hero-stat-label">Labs</span>
        </div>
      </div>
    </div>

    <div class="overall-progress">
      <div class="overall-progress-header">
        <span>Overall Progress</span>
        <span>${fmtPct(overall.pct)} — ${overall.completed}/${overall.total} items</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${fmtPct(overall.pct)}"></div>
      </div>
    </div>

    <div class="modules-section">
      <h2>Course Modules</h2>
      <div class="module-grid">
        ${cards}
      </div>
    </div>`;
}
