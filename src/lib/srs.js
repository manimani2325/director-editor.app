// 間隔反復（Spaced Repetition）。SM-2 を簡略化したアルゴリズム。
// クイズの正誤に応じて次回の復習日を計算する。
// 参考: 間隔をあけた復習は一夜漬けに比べ定着が大きく向上する。

import { todayStr } from './storage'

function addDays(days) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// card: { interval, ease, reps } | undefined, correct: boolean
export function review(card, correct) {
  let { interval = 0, ease = 2.5, reps = 0 } = card || {}

  if (!correct) {
    // 間違えたら最初からやり直し（翌日に再出題）
    reps = 0
    interval = 1
    ease = Math.max(1.3, ease - 0.2)
  } else {
    reps += 1
    if (reps === 1) interval = 1
    else if (reps === 2) interval = 3
    else interval = Math.round(interval * ease)
    ease = Math.min(2.8, ease + 0.1)
  }

  return { interval, ease, reps, due: addDays(interval) }
}

// 今日が復習期日（または過ぎている）レッスンIDの一覧
export function dueLessonIds(reviews) {
  const today = todayStr()
  return Object.entries(reviews)
    .filter(([, r]) => r.due && r.due <= today)
    .map(([id]) => id)
}
