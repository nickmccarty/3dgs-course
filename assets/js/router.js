/**
 * router.js — Hash-based SPA router.
 *
 * Routes:
 *   #/                              → dashboard
 *   #/module/:moduleId              → module overview
 *   #/module/:moduleId/reading/:id  → reading
 *   #/module/:moduleId/quiz/:id     → quiz
 *   #/module/:moduleId/lab          → lab
 */

const routes = [];

export function addRoute(pattern, handler) {
  routes.push({ pattern, handler });
}

function parseHash() {
  const hash = window.location.hash.slice(1) || '/';
  return hash;
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) return { handler: route.handler, match };
  }
  return null;
}

export function navigate(path) {
  window.location.hash = path;
}

export function initRouter() {
  function dispatch() {
    const path = parseHash();
    const result = matchRoute(path);
    if (result) {
      result.handler(result.match);
    } else {
      // 404 — go to dashboard
      navigate('/');
    }
  }

  window.addEventListener('hashchange', dispatch);
  dispatch(); // run on initial load
}

export function currentPath() {
  return parseHash();
}
