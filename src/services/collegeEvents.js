import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase.js'

const COLLECTION = 'collegeEvents'

/**
 * Subscribe to all college events (visible to all users).
 */
export function subscribeToCollegeEvents(onData, onError) {
  if (!db) {
    console.warn('[collegeEvents] db is null — firebase not configured')
    onData([])
    return () => {}
  }
  console.log('[collegeEvents] subscribing…', { projectId: db.app.options.projectId })
  const q = query(collection(db, COLLECTION), orderBy('date', 'asc'))
  return onSnapshot(
    q,
    (snap) => {
      console.log('[collegeEvents] snapshot received', { size: snap.size, fromCache: snap.metadata.fromCache })
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      onData(list)
    },
    (err) => {
      console.error('[collegeEvents] subscription error', err.code, err.message, err)
      onError?.(err)
    },
  )
}

/**
 * Create a new college event (admin only).
 */
export async function createCollegeEvent(event) {
  if (!db) throw new Error('Firebase not configured')
  const payload = {
    title: event.title,
    date: event.date,
    startTime: event.startTime || null,
    endTime: event.endTime || null,
    description: event.description || '',
    type: event.type || 'lecture', // 'lecture' | 'exam' | 'assignment' | 'holiday'
    batch: event.batch || '2029',
    group: event.group || 'All', // 'A', 'B', 'C', 'All'
    subject: event.subject || '',
    classroom: event.classroom || '',
    faculty: event.faculty || '',
    createdBy: event.createdBy,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTION), payload)
  return ref.id
}

/**
 * Update a college event by ID.
 */
export async function updateCollegeEvent(id, patch) {
  if (!db) throw new Error('Firebase not configured')
  await updateDoc(doc(db, COLLECTION, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Delete a college event by ID.
 */
export async function deleteCollegeEvent(id) {
  if (!db) throw new Error('Firebase not configured')
  await deleteDoc(doc(db, COLLECTION, id))
}
