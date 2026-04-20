import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase.js'

const COLLECTION = 'studentEvents'

/**
 * Subscribe to a specific student's personal events.
 */
export function subscribeToStudentEvents(studentId, onData, onError) {
  if (!db || !studentId) {
    onData([])
    return () => {}
  }
  const q = query(
    collection(db, COLLECTION),
    where('studentId', '==', studentId),
  )
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      onData(list)
    },
    (err) => {
      console.error('studentEvents subscription error', err)
      onError?.(err)
    },
  )
}

/**
 * Create a personal student event.
 */
export async function createStudentEvent(event) {
  if (!db) throw new Error('Firebase not configured')
  const payload = {
    studentId: event.studentId,
    title: event.title,
    date: event.date,
    startTime: event.startTime || null,
    endTime: event.endTime || null,
    description: event.description || '',
    isAiGenerated: event.isAiGenerated || false,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COLLECTION), payload)
  return ref.id
}

/**
 * Update a student event by ID.
 */
export async function updateStudentEvent(id, patch) {
  if (!db) throw new Error('Firebase not configured')
  await updateDoc(doc(db, COLLECTION, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Delete a student event by ID.
 */
export async function deleteStudentEvent(id) {
  if (!db) throw new Error('Firebase not configured')
  await deleteDoc(doc(db, COLLECTION, id))
}

/**
 * Batch create multiple student events (used by AI generator).
 */
export async function batchCreateStudentEvents(events) {
  if (!db) throw new Error('Firebase not configured')
  if (!events.length) return []
  const batch = writeBatch(db)
  const ids = []
  for (const ev of events) {
    const ref = doc(collection(db, COLLECTION))
    ids.push(ref.id)
    batch.set(ref, {
      studentId: ev.studentId,
      title: ev.title,
      date: ev.date,
      startTime: ev.startTime || null,
      endTime: ev.endTime || null,
      description: ev.description || '',
      isAiGenerated: ev.isAiGenerated || false,
      createdAt: serverTimestamp(),
    })
  }
  await batch.commit()
  return ids
}
