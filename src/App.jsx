import { useState, useEffect, useMemo } from 'react'
import { ABILITIES, abilityById, LESSONS, lessonById, lessonsByAbility } from './data/skills'
import { loadState, saveState, resetState, bumpStreak } from './lib/storage'
import { review as reviewCard, dueLessonIds } from './lib/srs'
import Practice from './Practice'

// ── ルート ─────────────────────────────────────
export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('home')
  const [activeLesson, setActiveLesson] = useState(null) // lessonId | null

  useEffect(() => { saveState(state) }, [state])

  if (!state.profile) {
    return <Onboarding onDone={profile => setState(s => ({ ...s, profile }))} />
  }

  if (activeLesson) {
    return (
      <Lesson
        lesson={lessonById[activeLesson]}
        onClose={() => setActiveLesson(null)}
        onComplete={(correct) => {
          setState(s => completeLesson(s, activeLesson, correct))
          setActiveLesson(null)
        }}
      />
    )
  }

  return (
    <div>
      <Header streak={state.streak.count} points={state.points} />
      <div className="container">
        {tab === 'home' && <Home state={state} onOpen={setActiveLesson} />}
        {tab === 'practice' && (
          <Practice onAward={pts => setState(s => ({ ...s, points: s.points + pts }))} />
        )}
        {tab === 'map' && <SkillMap state={state} onOpen={setActiveLesson} />}
        {tab === 'dashboard' && (
          <Dashboard state={state} onReset={() => { resetState(); setState(loadState()) }} />
        )}
      </div>
      <Nav tab={tab} setTab={setTab} />
    </div>
  )
}

// レッスン完了時の状態更新（進捗・間隔反復・ストリーク・ポイント）
function completeLesson(s, lessonId, correct) {
  const prev = s.progress[lessonId] || { completed: false, correct: false, attempts: 0 }
  const progress = {
    ...s.progress,
    [lessonId]: { completed: true, correct, attempts: prev.attempts + 1 },
  }
  const reviews = {
    ...s.reviews,
    [lessonId]: reviewCard(s.reviews[lessonId], correct),
  }
  const streak = bumpStreak(s.streak)
  const earned = (prev.completed ? 5 : 10) + (correct ? 5 : 0)
  return { ...s, progress, reviews, streak, points: s.points + earned }
}

// ── ヘッダー / ナビ ───────────────────────────
function Header({ streak, points }) {
  return (
    <div style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--surface)' }}>
      <div className="container" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: 16 }}>スキルアップ <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 13 }}>新卒の社会人基礎力</span></strong>
        <div className="row" style={{ gap: 12 }}>
          <span title="連続学習日数">🔥 {streak}</span>
          <span title="獲得ポイント">⭐ {points}</span>
        </div>
      </div>
    </div>
  )
}

function Nav({ tab, setTab }) {
  const items = [
    { id: 'home', label: 'ホーム', icon: '🏠' },
    { id: 'practice', label: '実践', icon: '💬' },
    { id: 'map', label: 'マップ', icon: '🗺️' },
    { id: 'dashboard', label: '記録', icon: '📊' },
  ]
  return (
    <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '0.5px solid var(--border)' }}>
      <div className="container" style={{ padding: '0.5rem 1rem', display: 'flex', gap: 8 }}>
        {items.map(it => (
          <button
            key={it.id}
            className={`full ${tab === it.id ? 'primary' : ''}`}
            onClick={() => setTab(it.id)}
          >
            <span>{it.icon}</span>{it.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── オンボーディング（自己診断） ─────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [ratings, setRatings] = useState({})

  const rate = (id, v) => setRatings(r => ({ ...r, [id]: v }))
  const allRated = ABILITIES.every(a => ratings[a.id])

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <div className="card" style={{ marginTop: '2rem' }}>
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>ようこそ 👋</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>
              このアプリは、新卒社員が現場で信頼される土台 ——
              経済産業省の「社会人基礎力（3つの能力・12の能力要素）」を、
              1日数分のマイクロラーニングと間隔反復で身につけるためのものです。
            </p>
            <div className="form-group">
              <label className="form-label">お名前（ニックネーム可）</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例: たろう" />
            </div>
            <button className="primary full" disabled={!name.trim()} onClick={() => setStep(1)}>はじめる</button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>かんたん自己診断</h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
              いまの自信度を5段階で。結果から重点的に取り組む領域をおすすめします。
            </p>
            {ABILITIES.map(a => (
              <div key={a.id} className="form-group">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</span>
                  <span className={`tag tag-${a.color}`}>{a.short}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text3)', margin: '2px 0 6px' }}>{a.desc}</p>
                <div className="row" style={{ gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      className={`sm ${ratings[a.id] === v ? 'primary' : ''}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => rate(a.id, v)}
                    >{v}</button>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="primary full"
              disabled={!allRated}
              onClick={() => onDone({ name: name.trim(), ratings })}
            >
              診断を完了して学習を始める
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── ホーム（今日の学習 + 復習） ─────────────────
function Home({ state, onOpen }) {
  const due = useMemo(() => dueLessonIds(state.reviews), [state.reviews])

  // おすすめ: 自己診断で自信の低い領域 → 未完了レッスンを優先
  const recommended = useMemo(() => {
    const order = [...ABILITIES].sort(
      (a, b) => (state.profile.ratings[a.id] || 3) - (state.profile.ratings[b.id] || 3)
    )
    const todo = []
    for (const a of order) {
      for (const l of lessonsByAbility(a.id)) {
        if (!state.progress[l.id]?.completed) todo.push(l)
      }
    }
    return todo.slice(0, 3)
  }, [state])

  const completedCount = Object.values(state.progress).filter(p => p.completed).length

  return (
    <>
      <div className="card">
        <p style={{ fontSize: 14 }}>こんにちは、<strong>{state.profile.name}</strong> さん 🌱</p>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          {completedCount === 0
            ? 'まずは1本、3分のレッスンから始めましょう。'
            : `これまで ${completedCount} 本のレッスンを完了。今日も続けましょう。`}
        </p>
      </div>

      {due.length > 0 && (
        <>
          <div className="section-title">復習キュー（間隔反復）</div>
          {due.map(id => (
            <LessonRow key={id} lesson={lessonById[id]} progress={state.progress[id]} onOpen={onOpen} badge="復習" />
          ))}
        </>
      )}

      <div className="section-title">今日のおすすめ</div>
      {recommended.length === 0 ? (
        <div className="card empty">🎉 すべてのレッスンを完了しました！復習で定着を固めましょう。</div>
      ) : (
        recommended.map(l => (
          <LessonRow key={l.id} lesson={l} progress={state.progress[l.id]} onOpen={onOpen} />
        ))
      )}
    </>
  )
}

function LessonRow({ lesson, progress, onOpen, badge }) {
  const a = abilityById[lesson.ability]
  const done = progress?.completed
  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => onOpen(lesson.id)}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 8 }}>
          <span className={`tag tag-${a.color}`}>{lesson.element}</span>
          {badge && <span className="tag tag-amber">{badge}</span>}
          {done && <span className="tag tag-green">完了</span>}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>⏱ {lesson.minutes}分</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 8 }}>{lesson.title}</div>
    </div>
  )
}

// ── レッスン（要点 → クイズ） ──────────────────
function Lesson({ lesson, onClose, onComplete }) {
  const [phase, setPhase] = useState('read') // read | quiz | result
  const [selected, setSelected] = useState(null)
  const a = abilityById[lesson.ability]
  const correct = selected === lesson.quiz.answer

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: '1rem', marginBottom: '0.5rem' }}>
        <span className={`tag tag-${a.color}`}>{a.name}・{lesson.element}</span>
        <button className="sm" onClick={onClose}>✕ 閉じる</button>
      </div>

      {phase === 'read' && (
        <div className="card">
          <h2 style={{ fontSize: 19, marginBottom: 14 }}>{lesson.title}</h2>
          {lesson.points.map((p, i) => (
            <div key={i} className="comment-box" style={{ marginBottom: 8 }}>
              <strong style={{ color: 'var(--text)' }}>{i + 1}.</strong> {p}
            </div>
          ))}
          <button className="primary full" style={{ marginTop: 12 }} onClick={() => setPhase('quiz')}>
            確認クイズへ →
          </button>
        </div>
      )}

      {phase === 'quiz' && (
        <div className="card">
          <div className="section-title">確認クイズ</div>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>{lesson.quiz.question}</p>
          {lesson.quiz.choices.map((c, i) => (
            <button
              key={i}
              className={`full ${selected === i ? 'primary' : ''}`}
              style={{ justifyContent: 'flex-start', marginBottom: 8, textAlign: 'left' }}
              onClick={() => setSelected(i)}
            >{c}</button>
          ))}
          <button className="primary full" style={{ marginTop: 8 }} disabled={selected === null} onClick={() => setPhase('result')}>
            回答する
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{correct ? '正解！🎉' : 'おしい！'}</h2>
          <div className={`tag tag-${correct ? 'green' : 'red'}`} style={{ marginBottom: 12 }}>
            あなたの回答: {lesson.quiz.choices[selected]}
          </div>
          <div className="comment-box">{lesson.quiz.explanation}</div>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: '12px 0' }}>
            {correct
              ? 'このレッスンは間隔をあけて再出題され、定着を固めます。'
              : '翌日にもう一度出題されます。繰り返して定着させましょう。'}
          </p>
          <button className="primary full" onClick={() => onComplete(correct)}>完了する</button>
        </div>
      )}
    </div>
  )
}

// ── スキルマップ（領域 × 進捗） ─────────────────
function SkillMap({ state, onOpen }) {
  return (
    <>
      <div className="section-title">スキルマップ</div>
      {ABILITIES.map(a => {
        const lessons = lessonsByAbility(a.id)
        const done = lessons.filter(l => state.progress[l.id]?.completed).length
        const pct = Math.round((done / lessons.length) * 100)
        return (
          <div key={a.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{a.name}</span>
              <span className={`tag tag-${a.color}`}>{done}/{lessons.length}</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            <div style={{ marginTop: 12 }}>
              {lessons.map(l => {
                const d = state.progress[l.id]?.completed
                return (
                  <div
                    key={l.id}
                    className="row"
                    style={{ justifyContent: 'space-between', padding: '7px 0', borderTop: '0.5px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => onOpen(l.id)}
                  >
                    <span style={{ fontSize: 13 }}>{d ? '✅' : '⬜'} {l.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{l.element}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ── ダッシュボード（記録） ─────────────────────
function Dashboard({ state, onReset }) {
  const total = LESSONS.length
  const completed = Object.values(state.progress).filter(p => p.completed).length
  const correct = Object.values(state.progress).filter(p => p.correct).length
  const accuracy = completed ? Math.round((correct / completed) * 100) : 0

  return (
    <>
      <div className="section-title">学習の記録</div>
      <div className="card">
        <div className="row" style={{ gap: 12 }}>
          <div className="stat-card"><div className="stat-num">{completed}/{total}</div><div className="stat-label">完了レッスン</div></div>
          <div className="stat-card"><div className="stat-num">{accuracy}%</div><div className="stat-label">クイズ正答率</div></div>
          <div className="stat-card"><div className="stat-num">{state.streak.count}</div><div className="stat-label">連続学習日</div></div>
          <div className="stat-card"><div className="stat-num">{state.points}</div><div className="stat-label">ポイント</div></div>
        </div>
      </div>

      <div className="section-title">領域別の到達度</div>
      <div className="card">
        {ABILITIES.map(a => {
          const lessons = lessonsByAbility(a.id)
          const done = lessons.filter(l => state.progress[l.id]?.completed).length
          const pct = Math.round((done / lessons.length) * 100)
          return (
            <div key={a.id} style={{ marginBottom: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>{a.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{pct}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="section-title">設定</div>
        <button className="danger full" onClick={() => { if (confirm('学習データをすべて消去しますか？')) onReset() }}>
          学習データをリセット
        </button>
      </div>
    </>
  )
}
