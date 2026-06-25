// 学習状態の永続化。MVPでは localStorage で完結（Firebase なしで即動作）。
// 将来 Firebase へ載せ替える際は、この read/write を差し替えるだけでよい。

const KEY = 'bsa_state_v1'

const DEFAULT_STATE = {
  profile: null,              // { name, role, ratings: { [abilityId]: 1..5 } }
  progress: {},              // lessonId -> { completed, correct, attempts }
  reviews: {},               // lessonId -> { interval, ease, reps, due (YYYY-MM-DD) }
  streak: { count: 0, last: null },
  points: 0,
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_STATE }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

export function resetState() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}

export function todayStr() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

// 連続学習日数（ストリーク）を更新する。
export function bumpStreak(streak) {
  const today = todayStr()
  if (streak.last === today) return streak
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const y = yesterday.toISOString().slice(0, 10)
  const count = streak.last === y ? streak.count + 1 : 1
  return { count, last: today }
}
