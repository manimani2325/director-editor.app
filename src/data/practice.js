// 実践演習のシナリオ。
// cases: 回答を書いてAIに添削してもらうケース演習。
// roleplays: Claudeが相手役を演じ、会話で練習するロールプレイ。
import { abilityById } from './../data/skills'

export const CASES = [
  {
    id: 'case-horenso-delay',
    ability: 'basics',
    element: '報連相',
    title: '納期遅れの第一報',
    scenario: 'あなたは資料作成を任されたが、他の急ぎ業務が重なり、明日の締切に間に合わない見込みになった。上司は外出中で、チャットで連絡できる状況。',
    task: '上司に送る「第一報」のメッセージを書いてください（結論・理由・対応案を含めて）。',
  },
  {
    id: 'case-mail-apology',
    ability: 'basics',
    element: 'ビジネス文書・メール',
    title: 'お客様への日程変更のお詫びメール',
    scenario: '来週予定していた打ち合わせを、社内の都合で別日に変更してもらう必要がある。相手は取引先の担当者。',
    task: '日程変更をお願いするビジネスメールを、件名と本文を含めて書いてください。',
  },
  {
    id: 'case-teian',
    ability: 'action',
    element: '主体性',
    title: '業務改善の提案',
    scenario: '毎朝の在庫確認に毎回30分かかっており、非効率だと感じている。あなたは入社2ヶ月目の新人。',
    task: '上司に改善を提案する短いメッセージを書いてください（現状の課題・提案・期待効果）。',
  },
  {
    id: 'case-kadai',
    ability: 'thinking',
    element: '課題発見力',
    title: '「最近ミスが増えた」の原因整理',
    scenario: 'チームで「最近、出荷ミスが増えた」と話題になっている。あなたは原因を整理して次の会議で共有することになった。',
    task: '考えられる原因を構造的に整理し、まず確かめるべきことを書いてください。',
  },
  {
    id: 'case-hasshin',
    ability: 'team',
    element: '発信力',
    title: '会議で結論ファーストに報告する',
    scenario: '担当していたA案件で、想定よりコストが20%超過しそうだと分かった。明日の定例会議で報告する。',
    task: '会議での発言を、結論ファースト（PREP法）で1〜2分の原稿として書いてください。',
  },
  {
    id: 'case-keichou',
    ability: 'team',
    element: '傾聴力',
    title: '不満を抱える後輩への返答',
    scenario: '後輩から「自分の意見が会議で全然通らなくて、やる気が出ない」と相談された。',
    task: 'まず傾聴の姿勢を示しつつ、後輩を前向きにする返答を書いてください。',
  },
]

export const ROLEPLAYS = [
  {
    id: 'rp-report',
    ability: 'basics',
    element: '報連相',
    title: '上司への進捗報告ロールプレイ',
    persona: '相手はあなたの直属の上司（課長）。多忙で結論を先に聞きたいタイプだが、面倒見はよい。',
    situation: 'あなたは任されたタスクの進捗を上司に報告しに来た。報告は60%完了、明日中に終わる見込み、ただし一点だけ判断を仰ぎたい論点がある。',
    opener: '（上司として）お、ちょうどよかった。例の件、どんな感じ？',
  },
  {
    id: 'rp-customer',
    ability: 'team',
    element: '発信力',
    title: '初めての顧客電話ロールプレイ',
    persona: '相手は問い合わせをしてきた見込み顧客。製品に興味はあるが、まだ警戒している。',
    situation: 'あなたは初めて顧客対応の電話に出る新人。相手の要望を聞き取り、次のステップにつなげたい。',
    opener: '（顧客として）もしもし、御社の製品について少し聞きたいんですけど、今お時間いいですか？',
  },
]

export function caseAbility(id) {
  const c = CASES.find(x => x.id === id) || ROLEPLAYS.find(x => x.id === id)
  return c ? abilityById[c.ability] : null
}
