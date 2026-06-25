// Claude API クライアント（ブラウザ直叩き）。
// APIキーは利用者がアプリ内で入力し localStorage に保存する。
//   ※ 既存の Firebase 設定画面と同じ「自分のキーを入れて使う」MVP 方針。
//   本番でユーザーに配布する場合は、キーを隠すためサーバー側プロキシに載せ替える。
import Anthropic from '@anthropic-ai/sdk'

const KEY = 'bsa_anthropic_key'
const MODEL = 'claude-opus-4-8'

export function getApiKey() {
  try { return localStorage.getItem(KEY) || '' } catch { return '' }
}
export function setApiKey(k) {
  try { localStorage.setItem(KEY, k.trim()) } catch {}
}
export function clearApiKey() {
  try { localStorage.removeItem(KEY) } catch {}
}

function client(apiKey) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

function textOf(message) {
  return message.content.filter(b => b.type === 'text').map(b => b.text).join('')
}

// ケース演習の回答を添削する。構造化フィードバックをストリームで返す。
// 短く対話的なコーチングのため thinking は使わず、低レイテンシ優先。
export async function streamFeedback({ apiKey, abilityName, element, scenario, task, answer, onDelta }) {
  const system =
    'あなたは新卒社員を育てる、経験豊富で温かいビジネスコーチです。' +
    '受講者の回答を、次の見出しで簡潔に日本語で講評してください。' +
    '\n\n## 良い点\n（具体的に1〜3個）' +
    '\n\n## 改善点\n（具体的な直し方を1〜3個。なぜそうするとよいかも添える）' +
    '\n\n## モデル回答例\n（その場で使える具体例を簡潔に）' +
    '\n\n## 5段階評価\n★を1〜5個で。新卒の成長を後押しする前向きなトーンで。' +
    '\n\n相手は新卒なので、ダメ出しよりも「次にどうすれば伸びるか」を中心に。'
  const userContent =
    `【スキル領域】${abilityName}・${element}\n` +
    `【ケース】${scenario}\n` +
    `【課題】${task}\n\n` +
    `【受講者の回答】\n${answer}`

  const stream = client(apiKey).messages.stream({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: userContent }],
  })
  if (onDelta) stream.on('text', onDelta)
  return textOf(await stream.finalMessage())
}

// ロールプレイ。Claude が相手役（上司など）を演じ、会話形式で実践練習する。
export async function streamRoleplay({ apiKey, system, history, onDelta }) {
  const stream = client(apiKey).messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: history,
  })
  if (onDelta) stream.on('text', onDelta)
  return textOf(await stream.finalMessage())
}
