import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

function loadConfig() {
  const env = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  }
  if (env.apiKey && env.databaseURL) return env
  try {
    const saved = localStorage.getItem('firebase_config')
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

export const firebaseConfig = loadConfig()

export let db = null
if (firebaseConfig) {
  const app = initializeApp(firebaseConfig)
  db = getDatabase(app)
}
