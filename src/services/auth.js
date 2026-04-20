import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from './firebase.js'

/**
 * Ensures a Firestore user document exists with role.
 * Default role is 'student'. Pass role override during signup.
 */
async function ensureUserDoc(user, extra = {}) {
  if (!db || !user) return
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)

  // Auto-assign admin if email or name clearly indicates it (for MVP testing)
  const isAutoAdmin = 
    user.email?.toLowerCase().includes('admin') || 
    user.displayName?.toLowerCase().includes('admin') ||
    extra.displayName?.toLowerCase().includes('admin')

  const roleToSet = extra.role || (isAutoAdmin ? 'admin' : 'student')

  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? extra.displayName ?? '',
      email: user.email ?? '',
      photoURL: user.photoURL ?? null,
      role: roleToSet,
      createdAt: serverTimestamp(),
    })
  } else {
    // If doc already exists (e.g. from previous tests), sync the role
    const data = snap.data()
    if (!data.role || (extra.role && data.role !== extra.role) || (isAutoAdmin && data.role !== 'admin')) {
      await updateDoc(ref, { role: roleToSet })
    }
  }
}

/**
 * Fetches the user's role from Firestore.
 * Returns 'student' as default if doc doesn't exist.
 */
export async function getUserRole(user) {
  if (!db || !user || !user.uid) return 'student'
  
  // 1. Check if auth profile gives it away (safest MVP fallback)
  if (user.email?.toLowerCase().includes('admin') || user.displayName?.toLowerCase().includes('admin')) {
    return 'admin'
  }

  // 2. Check Firestore
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data()
    
    // Check if firestore profile gives it away
    if (data.email?.toLowerCase().includes('admin') || data.displayName?.toLowerCase().includes('admin')) {
      return 'admin'
    }

    if (data.role) return data.role
  }
  return 'student'
}

export async function signupWithEmail({ email, password, displayName, role }) {
  if (!auth) throw new Error('Firebase not configured')
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(cred.user, { displayName })
  }
  await ensureUserDoc(cred.user, { displayName, role: role || 'student' })
  return cred.user
}

export async function loginWithEmail({ email, password }) {
  if (!auth) throw new Error('Firebase not configured')
  const cred = await signInWithEmailAndPassword(auth, email, password)
  await ensureUserDoc(cred.user)
  return cred.user
}

export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase not configured')
  const cred = await signInWithPopup(auth, googleProvider)
  await ensureUserDoc(cred.user)
  return cred.user
}

export async function logout() {
  if (!auth) return
  await signOut(auth)
}
