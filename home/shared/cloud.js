/* Shared sign-in and sync for the practice site.
   Uses the same Firebase project as Padayon, so one Google sign-in covers every app on this site.
   One Firestore document per person (users/{uid}): Padayon owns field "s", Word Hoard "words", chess "chess".
   Every write here uses merge so apps never erase each other's fields. Load the three Firebase compat scripts first. */
(function () {
  const CFG = { apiKey: 'AIzaSyAMedDtDrSRJbULhA5Kwz30ZyYwPKj0rc4', authDomain: 'padayon-sync.firebaseapp.com', projectId: 'padayon-sync', storageBucket: 'padayon-sync.firebasestorage.app', messagingSenderId: '1192476989', appId: '1:1192476989:web:257d2aaafd933e6ab38554' };
  const subs = [];
  const C = { user: null, data: null, err: '', ready: false, available: false };
  let unsub = null;
  const emit = () => subs.forEach(f => { try { f(C); } catch (e) { console.error(e); } });
  C.on = f => { subs.push(f); if (C.ready) f(C); };
  C.ref = () => firebase.firestore().collection('users').doc(C.user.uid);
  C.get = field => { try { return C.data && C.data[field] ? JSON.parse(C.data[field]) : null; } catch (e) { return null; } };
  C.save = async (field, obj) => {
    if (!C.user) return false;
    try { await C.ref().set({ [field]: JSON.stringify(obj), [field + 'At']: Date.now() }, { merge: true }); C.err = ''; return true; }
    catch (e) { C.err = e.message || String(e); emit(); return false; }
  };
  C.signIn = async () => {
    if (!C.available) throw new Error('Sign-in could not load. Check your connection and reload.');
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    try { await firebase.auth().signInWithPopup(p); }
    catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) await firebase.auth().signInWithRedirect(p);
      else if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') throw e;
    }
  };
  C.signOut = () => C.available && firebase.auth().signOut();
  function init() {
    if (!window.firebase || !firebase.initializeApp) { C.ready = true; emit(); return; }
    try { if (!firebase.apps.length) firebase.initializeApp(CFG); C.available = true; } catch (e) { C.ready = true; emit(); return; }
    firebase.auth().getRedirectResult().catch(e => { C.err = e.message; });
    firebase.auth().onAuthStateChanged(u => {
      if (unsub) { unsub(); unsub = null; }
      C.user = u; C.data = null;
      if (!u) { C.ready = true; emit(); return; }
      unsub = C.ref().onSnapshot(sn => {
        if (sn.metadata.hasPendingWrites) return;
        C.data = sn.exists ? sn.data() : {}; C.ready = true; emit();
      }, e => { C.err = e.message || String(e); C.ready = true; emit(); });
    });
  }
  window.Cloud = C;
  init();
})();
