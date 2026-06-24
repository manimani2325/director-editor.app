import { useState } from 'react'
import { abilityById } from './data/skills'
import { CASES, ROLEPLAYS } from './data/practice'
import { getApiKey, setApiKey, clearApiKey, streamFeedback, streamRoleplay } from './lib/claude'

// 実践タブ。ケース演習（AI添削）とロールプレイ（AI会話）。
export default function Practice({ onAward }) {
  const [view, setView] = useState('list') // list | case | roleplay
  const [active, setActive] = useState(null)
  const [hasKey, setHasKey] = useState(!!getApiKey())

  if (!hasKey) return <ApiKeySetup onSaved={() => setHasKey(true)} />

  if (view === 'case' && active) {
    return <CaseRunner scenario={active} onBack={() => setView('list')} onAward={onAward} />
  }
  if (view === 'roleplay' && active) {
    return <RoleplayRunner scenario={active} onBack={() => setView('list')} onAward={onAward} />
  }

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>実践演習</strong>
          <button className="sm" onClick={() => { clearApiKey(); setHasKey(false) }}>APIキー変更</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
          学んだことを使ってアウトプット。AIがあなたの回答を添削し、相手役として会話練習もできます。
        </p>
      </div>

      <div className="section-title">ケース演習（AI添削）</div>
      {CASES.map(c => {
        const a = abilityById[c.ability]
        return (
          <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setActive(c); setView('case') }}>
            <div className="row" style={{ gap: 8 }}>
              <span className={`tag tag-${a.color}`}>{c.element}</span>
              <span className="tag tag-gray">添削</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 8 }}>{c.title}</div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{c.scenario}</p>
          </div>
        )
      })}

      <div className="section-title" style={{ marginTop: 20 }}>ロールプレイ（AI会話）</div>
      {ROLEPLAYS.map(r => {
        const a = abilityById[r.ability]
        return (
          <div key={r.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setActive(r); setView('roleplay') }}>
            <div className="row" style={{ gap: 8 }}>
              <span className={`tag tag-${a.color}`}>{r.element}</span>
              <span className="tag tag-purple">会話</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 8 }}>{r.title}</div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{r.situation}</p>
          </div>
        )
      })}
    </>
  )
}

// ── APIキー入力 ────────────────────────────────
function ApiKeySetup({ onSaved }) {
  const [val, setVal] = useState('')
  return (
    <div className="card">
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>AI演習を使うには Anthropic APIキーが必要です</h3>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
        ケース添削・ロールプレイは Claude で動きます。あなたのAPIキーはこの端末（localStorage）にのみ保存され、サーバーには送信されません。
      </p>
      <div className="form-group">
        <label className="form-label">Anthropic APIキー（sk-ant-...）</label>
        <input type="text" value={val} onChange={e => setVal(e.target.value)} placeholder="sk-ant-..." />
      </div>
      <button className="primary full" disabled={!val.trim().startsWith('sk-')} onClick={() => { setApiKey(val); onSaved() }}>
        保存して始める
      </button>
      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
        キーは <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">console.anthropic.com</a> で取得できます。
      </p>
    </div>
  )
}

// ── ケース演習（単発添削） ──────────────────────
function CaseRunner({ scenario, onBack, onAward }) {
  const a = abilityById[scenario.ability]
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    setLoading(true); setError(''); setFeedback('')
    try {
      await streamFeedback({
        apiKey: getApiKey(),
        abilityName: a.name,
        element: scenario.element,
        scenario: scenario.scenario,
        task: scenario.task,
        answer,
        onDelta: t => setFeedback(prev => prev + t),
      })
      if (!done) { onAward?.(15); setDone(true) }
    } catch (e) {
      setError(e?.message || 'エラーが発生しました。APIキーや通信状況を確認してください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <span className={`tag tag-${a.color}`}>{a.name}・{scenario.element}</span>
        <button className="sm" onClick={onBack}>← 一覧へ</button>
      </div>
      <div className="card">
        <h3 style={{ fontSize: 17, marginBottom: 10 }}>{scenario.title}</h3>
        <div className="comment-box"><strong style={{ color: 'var(--text)' }}>状況:</strong> {scenario.scenario}</div>
        <div className="comment-box" style={{ marginTop: 8 }}><strong style={{ color: 'var(--text)' }}>課題:</strong> {scenario.task}</div>
        <div className="form-group" style={{ marginTop: 14 }}>
          <label className="form-label">あなたの回答</label>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={6} placeholder="ここに書いてみましょう…" />
        </div>
        <button className="primary full" disabled={loading || !answer.trim()} onClick={submit}>
          {loading ? 'AIが添削中…' : 'AIに添削してもらう'}
        </button>
      </div>

      {error && <div className="card" style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}

      {feedback && (
        <div className="card">
          <div className="section-title">AIコーチからのフィードバック</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7 }}>{feedback}</div>
        </div>
      )}
    </>
  )
}

// ── ロールプレイ（マルチターン会話） ────────────
function RoleplayRunner({ scenario, onBack, onAward }) {
  const a = abilityById[scenario.ability]
  const system =
    `あなたはビジネスのロールプレイ相手を演じます。設定: ${scenario.persona} 状況: ${scenario.situation} ` +
    'あなたは相手役になりきり、自然な会話で応答してください。説明や解説は書かず、セリフのみ。' +
    '受講者は新卒社員の練習中なので、適度に現実的な反応をしつつ、学びになるやり取りにしてください。'
  // history は API へ送る role/content の配列。表示にもそのまま使う。
  const [history, setHistory] = useState([
    { role: 'assistant', content: scenario.opener },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [turns, setTurns] = useState(0)

  async function send() {
    const next = [...history, { role: 'user', content: input }]
    setHistory(next)
    setInput('')
    setLoading(true); setError('')
    // 先にアシスタントの空メッセージを足し、ストリームで埋める
    setHistory(h => [...h, { role: 'assistant', content: '' }])
    try {
      await streamRoleplay({
        apiKey: getApiKey(),
        system,
        history: next,
        onDelta: t => setHistory(h => {
          const copy = [...h]
          copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + t }
          return copy
        }),
      })
      const n = turns + 1
      setTurns(n)
      if (n === 3) onAward?.(20) // 数往復続いたら習慣化ポイント
    } catch (e) {
      setError(e?.message || 'エラーが発生しました。')
      setHistory(h => h.slice(0, -1)) // 失敗した空アシスタントを除去
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <span className={`tag tag-${a.color}`}>{a.name}・{scenario.element}</span>
        <button className="sm" onClick={onBack}>← 一覧へ</button>
      </div>
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>{scenario.title}</h3>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>{scenario.situation}</p>
      </div>

      {history.map((m, i) => (
        <div
          key={i}
          className="card"
          style={{
            marginLeft: m.role === 'user' ? '2rem' : 0,
            marginRight: m.role === 'user' ? 0 : '2rem',
            background: m.role === 'user' ? 'var(--purple-light)' : 'var(--surface)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{m.role === 'user' ? 'あなた' : '相手'}</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{m.content || '…'}</div>
        </div>
      ))}

      {error && <div className="card" style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}

      <div className="card">
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} placeholder="あなたのセリフを入力…" />
        <button className="primary full" style={{ marginTop: 8 }} disabled={loading || !input.trim()} onClick={send}>
          {loading ? '相手が考えています…' : '送信'}
        </button>
      </div>
    </>
  )
}
