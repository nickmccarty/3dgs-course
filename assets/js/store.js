/**
 * store.js — localStorage wrapper with namespacing and schema versioning.
 *
 * All keys are prefixed with "3dgs:" to avoid collisions.
 * The schema version guard clears stale data when the data model changes.
 */

const NS = '3dgs:';
const SCHEMA_VERSION = '1';

function key(k) { return NS + k; }

const store = {
  /** Read and JSON-parse a stored value. Returns null if missing. */
  get(k) {
    try {
      const raw = localStorage.getItem(key(k));
      return raw === null ? null : JSON.parse(raw);
    } catch { return null; }
  },

  /** JSON-stringify and store a value. */
  set(k, value) {
    try {
      localStorage.setItem(key(k), JSON.stringify(value));
    } catch (e) {
      console.warn('store.set failed:', e);
    }
  },

  /** Shallow-merge patch into existing object at key. */
  update(k, patch) {
    const existing = this.get(k) ?? {};
    this.set(k, { ...existing, ...patch });
  },

  /** Remove a key. */
  remove(k) {
    localStorage.removeItem(key(k));
  },

  /** Wipe all course data from localStorage. */
  clearAll() {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  },
};

/** Initialize: check schema version, clear if stale, record enrollment. */
export function initStore() {
  const meta = store.get('meta');
  if (!meta || meta.schemaVersion !== SCHEMA_VERSION) {
    store.clearAll();
    store.set('meta', {
      schemaVersion: SCHEMA_VERSION,
      enrolledAt: new Date().toISOString(),
      lastVisitedRoute: '#/',
    });
    store.set('progress:readings', {});
    store.set('progress:quizzes', {});
    store.set('progress:labs', {});
    store.set('settings', { theme: 'light' });
  }
}

// ── Reading progress ──────────────────────────────────────────

export function markReadingComplete(moduleId, readingId) {
  const readings = store.get('progress:readings') ?? {};
  const rKey = `${moduleId}_${readingId}`;
  readings[rKey] = {
    ...(readings[rKey] ?? {}),
    completedAt: new Date().toISOString(),
    scrollReachedBottom: true,
  };
  store.set('progress:readings', readings);
}

export function isReadingComplete(moduleId, readingId) {
  const readings = store.get('progress:readings') ?? {};
  return !!(readings[`${moduleId}_${readingId}`]?.completedAt);
}

// ── Quiz progress ─────────────────────────────────────────────

export function saveQuizAttempt(moduleId, quizId, score) {
  const quizzes = store.get('progress:quizzes') ?? {};
  const qKey = `${moduleId}_${quizId}`;
  const prev = quizzes[qKey] ?? { attempts: 0, bestScore: 0, passed: false };
  quizzes[qKey] = {
    attempts: prev.attempts + 1,
    bestScore: Math.max(prev.bestScore, score),
    lastScore: score,
    lastAttemptAt: new Date().toISOString(),
    passed: prev.passed || score >= (prev.passingScore ?? 0.7),
  };
  store.set('progress:quizzes', quizzes);
  return quizzes[qKey];
}

export function getQuizRecord(moduleId, quizId) {
  const quizzes = store.get('progress:quizzes') ?? {};
  return quizzes[`${moduleId}_${quizId}`] ?? null;
}

// ── Lab progress ──────────────────────────────────────────────

export function markLabVisited(moduleId, labId) {
  const labs = store.get('progress:labs') ?? {};
  const lKey = `${moduleId}_${labId}`;
  if (!labs[lKey]?.visitedAt) {
    labs[lKey] = { ...(labs[lKey] ?? {}), visitedAt: new Date().toISOString() };
    store.set('progress:labs', labs);
  }
}

export function markLabColabClicked(moduleId, labId) {
  const labs = store.get('progress:labs') ?? {};
  const lKey = `${moduleId}_${labId}`;
  labs[lKey] = { ...(labs[lKey] ?? {}), colabClickedAt: new Date().toISOString() };
  store.set('progress:labs', labs);
}

export function isLabVisited(moduleId, labId) {
  const labs = store.get('progress:labs') ?? {};
  return !!(labs[`${moduleId}_${labId}`]?.visitedAt);
}

// ── Settings ──────────────────────────────────────────────────

export function getTheme() {
  return (store.get('settings') ?? {}).theme ?? 'light';
}

export function setTheme(theme) {
  store.update('settings', { theme });
  document.documentElement.setAttribute('data-theme', theme);
}

export function setLastRoute(route) {
  store.update('meta', { lastVisitedRoute: route });
}

export default store;
