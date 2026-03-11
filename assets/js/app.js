/**
 * app.js — Bootstrap: load course.json, init store, router, theme.
 */

import { initStore, getTheme, setTheme, setLastRoute } from './store.js';
import { addRoute, initRouter, navigate } from './router.js';
import renderDashboard from './views/dashboard.js';
import renderModule from './views/module.js';
import renderReading from './views/reading.js';
import renderQuiz from './views/quiz.js';
import renderLab from './views/lab.js';

// ── Module cache ──────────────────────────────────────────────
const moduleCache = {};

// ── Fetch helpers ─────────────────────────────────────────────

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

async function getModuleData(courseData, moduleId) {
  if (moduleCache[moduleId]) return moduleCache[moduleId];
  const moduleMeta = courseData.modules.find(m => m.id === moduleId);
  if (!moduleMeta) throw new Error(`Module not found: ${moduleId}`);
  const data = await fetchJSON(moduleMeta.dataPath);
  // Merge top-level module meta (color, prereq, etc.) into module data
  const merged = { ...data, color: moduleMeta.color, prereq: moduleMeta.prereq, order: moduleMeta.order };
  moduleCache[moduleId] = merged;
  return merged;
}

// ── Mount point ───────────────────────────────────────────────

export function getApp() { return document.getElementById('app'); }

export function setLoading() {
  getApp().innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading…</p>
    </div>`;
}

export function setError(msg) {
  getApp().innerHTML = `
    <div class="error-state">
      <h2>Something went wrong</h2>
      <p>${msg}</p>
      <a href="#/" class="btn btn-primary" style="margin-top:1.5rem">Back to Dashboard</a>
    </div>`;
}

// ── Breadcrumb ────────────────────────────────────────────────

const BREADCRUMB_ICONS = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354z"/>
  </svg>`,
  module: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6z"/>
  </svg>`,
  reading: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z"/>
    <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
  </svg>`,
  quiz: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8.05 9.6c.336 0 .504-.24.554-.627l.04-.534c.06-.664.249-.934.593-1.183.335-.239.75-.5 1.03-1.02.346-.644.37-1.646-.261-2.357C9.481 3.239 8.55 3 7.947 3c-.706 0-1.335.301-1.77.797a2.5 2.5 0 0 0-.63 1.48c0 .37.239.61.59.61.336 0 .537-.213.579-.534.089-.64.456-1.145 1.19-1.145.65 0 1.144.437 1.144 1.07 0 .42-.173.695-.537.966-.37.278-.672.58-.763 1.136-.04.262-.066.504-.066.7 0 .364.21.6.566.6zm.021 1.94a.653.653 0 0 0 .664-.663.645.645 0 0 0-.664-.652.644.644 0 0 0-.665.652c0 .36.297.663.665.663"/>
    <path d="M4.085 1a2 2 0 0 0-1.415.585l-2 2A2 2 0 0 0 .085 5v6a2 2 0 0 0 .585 1.415l2 2A2 2 0 0 0 4.085 15h7.83a2 2 0 0 0 1.414-.585l2-2A2 2 0 0 0 15.915 11V5a2 2 0 0 0-.586-1.414l-2-2A2 2 0 0 0 11.915 1z"/>
  </svg>`,
  lab: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0"/>
  </svg>`,
};

function setBreadcrumb(items) {
  const el = document.getElementById('breadcrumb-container');
  if (!el) return;
  if (!items || items.length === 0) { el.innerHTML = ''; return; }
  const sep = `<span class="breadcrumb-sep">›</span>`;
  const parts = items.map((item, i) => {
    const icon = BREADCRUMB_ICONS[item.icon] ?? '';
    if (i === items.length - 1) {
      return `<span class="breadcrumb-current">${icon}<span class="bc-label">${item.label}</span></span>`;
    }
    return `<a href="${item.href}">${icon}<span class="bc-label">${item.label}</span></a>`;
  });
  el.innerHTML = `<nav class="breadcrumb">${parts.join(sep)}</nav>`;
}

// ── Route handlers ────────────────────────────────────────────

async function handleDashboard(courseData) {
  setLoading();
  setBreadcrumb([]);
  setLastRoute('#/');
  try {
    // Load all module.json files for progress computation
    const modulesMeta = await Promise.all(
      courseData.modules.map(m => getModuleData(courseData, m.id))
    );
    renderDashboard(courseData, modulesMeta);
  } catch (e) {
    setError(e.message);
  }
}

async function handleModule(courseData, moduleId) {
  setLoading();
  setLastRoute(`#/module/${moduleId}`);
  try {
    const moduleData = await getModuleData(courseData, moduleId);
    const allMeta = await Promise.all(courseData.modules.map(m => getModuleData(courseData, m.id)));
    setBreadcrumb([
      { label: 'Dashboard', href: '#/', icon: 'dashboard' },
      { label: moduleData.title, icon: 'module' },
    ]);
    renderModule(moduleData, allMeta, courseData);
  } catch (e) {
    setError(e.message);
  }
}

async function handleReading(courseData, moduleId, readingId) {
  setLoading();
  setLastRoute(`#/module/${moduleId}/reading/${readingId}`);
  try {
    const moduleData = await getModuleData(courseData, moduleId);
    const readingMeta = moduleData.readings.find(r => r.id === readingId);
    if (!readingMeta) throw new Error(`Reading not found: ${readingId}`);
    const readingData = await fetchJSON(readingMeta.dataPath);
    setBreadcrumb([
      { label: 'Dashboard', href: '#/', icon: 'dashboard' },
      { label: moduleData.title, href: `#/module/${moduleId}`, icon: 'module' },
      { label: readingData.title, icon: 'reading' },
    ]);
    renderReading(readingData, moduleData);
  } catch (e) {
    setError(e.message);
  }
}

async function handleQuiz(courseData, moduleId, quizId) {
  setLoading();
  setLastRoute(`#/module/${moduleId}/quiz/${quizId}`);
  try {
    const moduleData = await getModuleData(courseData, moduleId);
    const quizMeta = moduleData.quizzes.find(q => q.id === quizId);
    if (!quizMeta) throw new Error(`Quiz not found: ${quizId}`);
    const quizData = await fetchJSON(quizMeta.dataPath);
    setBreadcrumb([
      { label: 'Dashboard', href: '#/', icon: 'dashboard' },
      { label: moduleData.title, href: `#/module/${moduleId}`, icon: 'module' },
      { label: quizData.title, icon: 'quiz' },
    ]);
    renderQuiz(quizData, moduleData);
  } catch (e) {
    setError(e.message);
  }
}

async function handleLab(courseData, moduleId) {
  setLoading();
  setLastRoute(`#/module/${moduleId}/lab`);
  try {
    const moduleData = await getModuleData(courseData, moduleId);
    const labMeta = moduleData.lab;
    if (!labMeta) throw new Error(`No lab in module: ${moduleId}`);
    const labData = await fetchJSON(labMeta.dataPath);
    setBreadcrumb([
      { label: 'Dashboard', href: '#/', icon: 'dashboard' },
      { label: moduleData.title, href: `#/module/${moduleId}`, icon: 'module' },
      { label: labData.title, icon: 'lab' },
    ]);
    renderLab(labData, moduleData);
  } catch (e) {
    setError(e.message);
  }
}

// ── Main init ─────────────────────────────────────────────────

async function main() {
  // Init store (schema check, first-run setup)
  initStore();

  // Apply saved theme
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);

  // Theme toggle button
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }

  // Load course manifest
  let courseData;
  try {
    courseData = await fetchJSON('data/course.json');
  } catch (e) {
    setError('Could not load course data. ' + e.message);
    return;
  }

  // Register routes
  addRoute(/^\/$/, () => handleDashboard(courseData));
  addRoute(/^\/module\/([^/]+)$/, (m) => handleModule(courseData, m[1]));
  addRoute(/^\/module\/([^/]+)\/reading\/([^/]+)$/, (m) => handleReading(courseData, m[1], m[2]));
  addRoute(/^\/module\/([^/]+)\/quiz\/([^/]+)$/, (m) => handleQuiz(courseData, m[1], m[2]));
  addRoute(/^\/module\/([^/]+)\/lab$/, (m) => handleLab(courseData, m[1]));

  // Start router
  initRouter();
}

main();
