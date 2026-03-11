/**
 * progress.js — Pure functions that compute progress from store state.
 *
 * Never stores derived data — always computes from raw event records.
 * This avoids stale cache issues and keeps the store simple.
 */

import {
  isReadingComplete,
  getQuizRecord,
  isLabVisited,
} from './store.js';

/**
 * Compute progress for one module.
 * Returns { completed, total, pct, readingsDone, quizzesPassed, labVisited }
 */
export function moduleProgress(moduleMeta) {
  const { id: moduleId, readings = [], quizzes = [], lab } = moduleMeta;

  let completed = 0;
  let total = 0;

  // Readings: each worth 1 point
  let readingsDone = 0;
  for (const r of readings) {
    total++;
    if (isReadingComplete(moduleId, r.id)) { completed++; readingsDone++; }
  }

  // Quizzes: each worth 1 point (must pass)
  let quizzesPassed = 0;
  for (const q of quizzes) {
    total++;
    const rec = getQuizRecord(moduleId, q.id);
    const passed = rec && rec.bestScore >= (q.passingScore ?? 0.7);
    if (passed) { completed++; quizzesPassed++; }
  }

  // Lab: worth 1 point for visiting
  let labVisited = false;
  if (lab) {
    total++;
    if (isLabVisited(moduleId, lab.id)) { completed++; labVisited = true; }
  }

  const pct = total > 0 ? completed / total : 0;
  return { completed, total, pct, readingsDone, quizzesPassed, labVisited };
}

/**
 * Compute overall course progress across all modules.
 * Returns { completed, total, pct }
 */
export function courseProgress(modulesMeta) {
  let completed = 0;
  let total = 0;
  for (const m of modulesMeta) {
    const p = moduleProgress(m);
    completed += p.completed;
    total += p.total;
  }
  const pct = total > 0 ? completed / total : 0;
  return { completed, total, pct };
}

/**
 * Determine if a module is unlocked.
 * A module is unlocked if its prereq module meets the unlock threshold.
 */
export function isModuleUnlocked(moduleMeta, allModulesMeta, threshold = 0.6) {
  if (!moduleMeta.prereq) return true;
  const prereq = allModulesMeta.find(m => m.id === moduleMeta.prereq);
  if (!prereq) return true;
  return moduleProgress(prereq).pct >= threshold;
}

/**
 * Format a progress percentage as a string like "67%"
 */
export function fmtPct(pct) {
  return Math.round(pct * 100) + '%';
}
