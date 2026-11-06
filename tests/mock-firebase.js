/* In-memory stand-in for the Firebase compat SDK. Fake users only; nothing leaves the browser.
   window.__fbUser = { uid, email, displayName } signs in on load. window.__fbDocs = { 'users/x': {...} } seeds docs.
   window.__fb.writes records every write, so a test can count them. */
(() => {
  const docs = Object.assign({}, window.__fbDocs || {}), subs = {}, writes = []; let user = window.__fbUser || null; const authCbs = [];
  const later = f => setTimeout(f, 0);
  const snap = (path, pending) => ({ exists: docs[path] !== undefined, id: path.split('/').pop(), data: () => docs[path] && JSON.parse(JSON.stringify(docs[path])), metadata: { hasPendingWrites: !!pending } });
  const fire = (path, pending) => (subs[path] || []).forEach(f => f(snap(path, pending)));
  const doc = path => ({ id: path.split('/').pop(),
    get: async () => snap(path),
    set: async (v, o) => { docs[path] = o && o.merge ? Object.assign({}, docs[path], v) : JSON.parse(JSON.stringify(v)); writes.push({ path, at: performance.now() }); fire(path, true); later(() => fire(path, false)); },
    onSnapshot: f => { (subs[path] = subs[path] || []).push(f); later(() => f(snap(path))); return () => { subs[path] = subs[path].filter(x => x !== f); }; } });
  const coll = name => { const api = { doc: id => doc(name + '/' + id), add: async v => { const id = 'a' + writes.length; docs[name + '/' + id] = v; writes.push({ path: name + '/' + id, at: performance.now() }); },
    orderBy: () => api, limit: () => api, get: async () => ({ docs: Object.keys(docs).filter(k => k.startsWith(name + '/')).map(k => snap(k)) }) }; return api; };
  const auth = { getRedirectResult: async () => null, onAuthStateChanged: f => { authCbs.push(f); later(() => f(user)); }, signOut: async () => { user = null; authCbs.forEach(f => f(null)); }, signInWithPopup: async () => { user = window.__fbUser; authCbs.forEach(f => f(user)); } };
  const authFn = () => auth; authFn.GoogleAuthProvider = class { setCustomParameters() { } };
  window.firebase = { initializeApp() { }, auth: authFn, firestore: () => ({ collection: coll }) };
  window.__fb = { docs, writes, fire };
})();
