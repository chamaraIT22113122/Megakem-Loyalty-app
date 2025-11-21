import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

let app, auth, db
export function initFirebase() {
  try {
    const cfg = typeof window !== 'undefined' && window.__firebase_config ? JSON.parse(window.__firebase_config) : null
    if (!cfg) return null
    app = initializeApp(cfg)
    auth = getAuth(app)
    db = getFirestore(app)
    return { app, auth, db }
  } catch (e) {
    console.warn('Firebase not initialized — no config found')
    return null
  }
}

export function getFirebase() { return { app, auth, db } }

export async function ensureAuth() {
  if (!auth) return null
  try {
    await signInAnonymously(auth)
    return new Promise((resolve) => onAuthStateChanged(auth, u => resolve(u)))
  } catch (e) {
    console.error('Auth error', e)
    return null
  }
}
