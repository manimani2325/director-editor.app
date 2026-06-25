// クラウド同期。Firebase 設定済み＆ログイン時のみ有効。
// 認証: メール/パスワード（複数端末で同じ進捗を共有するため）。
// 保存先: Realtime Database の users/{uid}/state。
import { auth, db, firebaseConfig } from '../firebase'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { ref, get, set } from 'firebase/database'

export const cloudConfigured = !!firebaseConfig

// Firebase 設定（コンソールの設定オブジェクト）を保存。反映には再読み込みが必要。
export function saveFirebaseConfig(cfg) {
  localStorage.setItem('firebase_config', JSON.stringify(cfg))
}

export function onAuth(cb) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, cb)
}

export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}
export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}
export function signOutUser() {
  return signOut(auth)
}

export async function loadCloudState(uid) {
  const snap = await get(ref(db, `users/${uid}/state`))
  return snap.exists() ? snap.val() : null
}
export async function saveCloudState(uid, state) {
  await set(ref(db, `users/${uid}/state`), state)
}
