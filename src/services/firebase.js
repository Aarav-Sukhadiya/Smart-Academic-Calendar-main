import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

const app = firebaseConfigured ? initializeApp(firebaseConfig) : null

export const auth = app ? getAuth(app) : null

// Force long-polling transport. Firestore's default WebChannel streams get
// mis-detected as offline by some extensions, proxies, and corporate networks
// — the HTTP requests succeed but the SDK's internal transport never
// stabilizes, producing "client is offline" errors. Long-polling is slower
// but reliable across every network.
export const db = app
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : null

export const googleProvider = new GoogleAuthProvider()
