import { useState, useEffect } from 'react'
import { db, firebaseConfig, initError } from './firebase'
import { ref, onValue, set, push, remove, update } from 'firebase/database'

const ACCOUNTS = [
  { id: 'otubone',  label: 'お局',  color: 'purple' },
  { id: 'nurse',    label: '看護師', color: 'teal' },
  { id: 'official', label: '公式',  color: 'coral' },
]
const STATUS_LIST   = ['未着手', '制作中', 'レビュー待ち', '完了']
const STATUS_COLORS = ['gray', 'amber', 'purple', 'teal']

function daysLeft(d) {
  if (!d) return null
  const t = new Date(); t.setHours(0,0,0,0)
  const dl = new Date(d); dl.setHours(0,0,0,0)
  return Math.round((dl - t) / 86400000)
}
function UrgencyLabel({ deadline }) {
  const d = daysLeft(deadline)
  if (d === null) return null
  if (d < 0)   return <span style={{color:'#993C1D',fontSize:11,fontWeight:500}}>期限超過</span>
  if (d === 0) return <span style={{color:'#993C1D',fontSize:11,fontWeight:500}}>今日まで</span>
  if (d <= 3)  return <span style={{color:'#854F0B',fontSize:11,fontWeight:500}}>残り{d}日</span>
  return <span style={{color:'var(--text3)',fontSize:11}}>残り{d}日</span>
}
function borderColor(deadline) {
  const d = daysLeft(deadline)
  if (d === null) return 'var(--border)'
  if (d < 0 || d === 0) return '#D85A30'
  if (d <= 3) return '#EF9F27'
  return '#639922'
}

export default function App() {
  if (initError) return <SetupScreen error={`Firebase初期化エラー: ${initError}\n\n設定値を確認して再入力してください。`} />
  if (!firebaseConfig) return <SetupScreen />
  return <AppContent />
}

function AppContent() {
  const [screen, setScreen] = useState('splash')
  const [data, setData] = useState({ editors: [], accounts: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(ref(db, '/'), snap => {
      const val = snap.val() || {}
      const accounts = {}
      ACCOUNTS.forEach(a => { accounts[a.id] = { stories: val.accounts?.[a.id]?.stories || {} } })
      setData({ editors: val.editors || [], accounts })
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className="container"><div className="spinner" /></div>
  if (screen === 'splash')   return <Splash setScreen={setScreen} />
  if (screen === 'director') return <Director setScreen={setScreen} data={data} />
  if (screen === 'editor')   return <Editor setScreen={setScreen} data={data} />
  return null
}

function Splash({ setScreen }) {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2rem',padding:'1rem'}}>
      <div style={{textAlign:'center'}}>
        <p style={{fontSize:22,fontWeight:500}}>動画制作管理</p>
        <p style={{fontSize:14,color:'var(--text2)',marginTop:6}}>モードを選択してください</p>
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
        {[{mode:'director',icon:'🎬',title:'ディレクター',desc:'構成作成・タスク割り振り'},{mode:'editor',icon:'✂️',title:'編集者',desc:'割り振られたタスクを確認'}].map(({mode,icon,title,desc}) => (
          <div key={mode} onClick={() => setScreen(mode)} style={{width:180,padding:'2rem 1.5rem',border:'0.5px solid var(--border2)',borderRadius:12,background:'var(--surface)',cursor:'pointer',textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:12}}>{icon}</div>
            <div style={{fontSize:15,fontWeight:500,marginBottom:6}}>{title}</div>
            <div style={{fontSize:12,color:'var(--text2)'}}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Director({ setScreen, data }) {
  const [activeAcc, setActiveAcc] = useState('otubone')
  const [open, setOpen] = useState({})
  const [showEditors, setShowEditors] = useState(false)
  const [detail, setDetail] = useState(null)

  const stories = Object.entries(data.accounts[activeAcc]?.stories || {})
    .map(([id, s]) => ({ id, ...s, posts: Object.entries(s.posts || {}).map(([pid, p]) => ({ id: pid, ...p })) }))

  async function addStory() {
    const t = prompt('ストーリー名:', '新しいストーリー')
    if (t) await push(ref(db, `accounts/${activeAcc}/stories`), { title: t, posts: {} })
  }
  async function editStory(sid, cur) {
    const t = prompt('新しい名前:', cur)
    if (t) await update(ref(db, `accounts/${activeAcc}/stories/${sid}`), { title: t })
  }
  async function delStory(sid) {
    if (confirm('削除しますか？')) await remove(ref(db, `accounts/${activeAcc}/stories/${sid}`))
  }
  async function addPost(sid) {
    const story = stories.find(s => s.id === sid)
    const num = (story?.posts?.length || 0) + 1
    const r = await push(ref(db, `accounts/${activeAcc}/stories/${sid}/posts`), {
      title: `投稿${num}`, deadline: '', assignee: '', status: '未着手', theme: '', telop: '', telopDesign: '', materials: '', notes: ''
    })
    setDetail({ storyId: sid, postId: r.key })
  }

  if (detail) {
    const story = stories.find(s => s.id === detail.storyId)
    const post = story?.posts?.find(p => p.id === detail.postId)
    if (!post) { setDetail(null); return null }
    return <PostDetail post={post} story={story} accountId={activeAcc} editors={data.editors} onBack={() => setDetail(null)} />
  }

  return (
    <div className="container">
      <div className="row" style={{marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--border)'}}>
        <button onClick={() => setScreen('splash')} style={{fontSize:12,color:'var(--text2)'}}>← 戻る</button>
        <span style={{fontSize:16,fontWeight:500,flex:1}}>ディレクター画面</span>
        <button className="sm" onClick={() => setShowEditors(true)}>👤 編集者管理</button>
      </div>
      <div className="row" style={{marginBottom:'1.5rem'}}>
        {ACCOUNTS.map(a => (
          <button key={a.id} onClick={() => setActiveAcc(a.id)}
            style={activeAcc===a.id ? {background:'var(--purple)',borderColor:'var(--purple)',color:'#EEEDFE',fontWeight:500} : {color:'var(--text2)'}}>
            {a.label}
          </button>
        ))}
      </div>
      <div className="row" style={{marginBottom:'1rem'}}>
        <p className="section-title" style={{margin:0}}>ストーリー一覧</p>
        <button className="sm primary" onClick={addStory}>＋ ストーリー追加</button>
      </div>
      {stories.length === 0 ? <div className="empty">ストーリーがありません</div> : stories.map(story => {
        const isOpen = open[story.id]
        const done = story.posts.filter(p => p.status === '完了').length
        return (
          <div key={story.id} style={{border:'0.5px solid var(--border)',borderRadius:12,marginBottom:10,overflow:'hidden'}}>
            <div className="row" onClick={() => setOpen(o => ({...o,[story.id]:!o[story.id]}))}
              style={{padding:'.75rem 1rem',background:'var(--surface2)',cursor:'pointer'}}>
              <span style={{fontSize:13,color:'var(--text3)'}}>{isOpen?'▲':'▼'}</span>
              <span style={{flex:1,fontWeight:500,fontSize:14}}>{story.title}</span>
              <span style={{fontSize:12,color:'var(--text2)'}}>{done}/{story.posts.length}</span>
              <button className="sm icon-only" onClick={e=>{e.stopPropagation();editStory(story.id,story.title)}}>✏️</button>
              <button className="sm icon-only danger" onClick={e=>{e.stopPropagation();delStory(story.id)}}>🗑</button>
            </div>
            {isOpen && (
              <div style={{padding:'.75rem 1rem',borderTop:'0.5px solid var(--border)'}}>
                {story.posts.map(post => {
                  const sc = STATUS_COLORS[STATUS_LIST.indexOf(post.status)] || 'gray'
                  return (
                    <div key={post.id} className="row" onClick={() => setDetail({storyId:story.id,postId:post.id})}
                      style={{padding:'8px',borderRadius:8,cursor:'pointer',marginBottom:6}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <div className="status-dot" style={{background:`var(--${sc}-light)`,border:`1.5px solid var(--${sc})`}} />
                      <span style={{flex:1,fontSize:13,fontWeight:500}}>{post.title}</span>
                      {post.assignee && <span style={{fontSize:11,color:'var(--text2)',background:'var(--surface2)',padding:'2px 8px',borderRadius:99}}>{post.assignee}</span>}
                      {post.deadline && <span style={{fontSize:11,color:'var(--text3)'}}>📅 {post.deadline}</span>}
                      <span className={`tag tag-${sc}`}>{post.status}</span>
                    </div>
                  )
                })}
                <button className="sm" style={{marginTop:6}} onClick={() => addPost(story.id)}>＋ 投稿追加</button>
              </div>
            )}
          </div>
        )
      })}
      {showEditors && <EditorsModal editors={data.editors} onClose={() => setShowEditors(false)} />}
    </div>
  )
}

function PostDetail({ post, story, accountId, editors, onBack }) {
  const [form, setForm] = useState({ title:post.title,deadline:post.deadline,assignee:post.assignee,status:post.status,theme:post.theme,telop:post.telop,telopDesign:post.telopDesign,materials:post.materials,notes:post.notes })
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(v => ({...v,[k]:e.target.value}))
  async function save() {
    setSaving(true)
    await update(ref(db, `accounts/${accountId}/stories/${story.id}/posts/${post.id}`), form)
    setSaving(false); onBack()
  }
  return (
    <div className="container">
      <div className="row" style={{marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--border)'}}>
        <button onClick={onBack} style={{fontSize:12,color:'var(--text2)'}}>← 戻る</button>
        <span style={{flex:1,fontSize:16,fontWeight:500}}>{form.title||'投稿詳細'}</span>
        <button className="primary sm" onClick={save} disabled={saving}>{saving?'保存中…':'✓ 保存'}</button>
      </div>
      <div className="card">
        <div className="grid2">
          <div className="form-group"><label className="form-label">投稿タイトル</label><input type="text" value={form.title} onChange={f('title')} /></div>
          <div className="form-group"><label className="form-label">期限</label><input type="date" value={form.deadline} onChange={f('deadline')} /></div>
        </div>
        <div className="grid2">
          <div className="form-group"><label className="form-label">担当者</label>
            <select value={form.assignee} onChange={f('assignee')}>
              <option value="">未割り当て</option>
              {editors.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">ステータス</label>
            <select value={form.status} onChange={f('status')}>
              {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="card">
        <p className="section-title" style={{marginBottom:12}}>動画指示</p>
        {[['theme','強調したいテーマ','例: 共感を得やすいエピソード'],['telop','テロップ','例: オープニングでテロップを入れる'],['telopDesign','テロップデザイン指定','例: 太字・白抜き・背景黒'],['materials','使用素材','例: インタビュー映像A'],['notes','備考・質問欄','ディレクターへのメモ']].map(([k,l,p]) => (
          <div key={k} className="form-group"><label className="form-label">{l}</label><textarea placeholder={p} value={form[k]} onChange={f(k)} /></div>
        ))}
      </div>
    </div>
  )
}

function EditorsModal({ editors, onClose }) {
  const [name, setName] = useState('')
  async function add() { const n=name.trim(); if(!n||editors.includes(n))return; await set(ref(db,'editors'),[...editors,n]); setName('') }
  async function del(e) { await set(ref(db,'editors'),editors.filter(x=>x!==e)) }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:60,zIndex:100}}>
      <div style={{background:'var(--surface)',borderRadius:12,border:'0.5px solid var(--border)',padding:'1.5rem',width:420,maxHeight:'80vh',overflowY:'auto'}}>
        <p style={{fontSize:16,fontWeight:500,marginBottom:'1rem'}}>編集者管理</p>
        <div style={{marginBottom:'1rem'}}>
          {editors.length===0 ? <p style={{fontSize:13,color:'var(--text3)'}}>まだ登録されていません</p> : editors.map(e => (
            <div key={e} className="row" style={{padding:'6px 0',borderBottom:'0.5px solid var(--border)'}}>
              <span style={{flex:1,fontSize:13}}>👤 {e}</span>
              <button className="sm danger" onClick={()=>del(e)}>🗑</button>
            </div>
          ))}
        </div>
        <div className="row" style={{marginBottom:'1rem'}}>
          <input type="text" placeholder="名前を入力" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} style={{flex:1}} />
          <button className="primary sm" onClick={add}>＋ 追加</button>
        </div>
        <button className="full" onClick={onClose}>閉じる</button>
      </div>
    </div>
  )
}

function Editor({ setScreen, data }) {
  const [selected, setSelected] = useState(null)
  const [taskModal, setTaskModal] = useState(null)

  const allTasks = []
  ACCOUNTS.forEach(a => {
    Object.entries(data.accounts[a.id]?.stories||{}).forEach(([sid,story]) => {
      Object.entries(story.posts||{}).forEach(([pid,post]) => {
        if (post.assignee===selected) allTasks.push({...post,id:pid,storyId:sid,storyTitle:story.title,accountId:a.id,accountLabel:a.label,accountColor:a.color})
      })
    })
  })
  allTasks.sort((a,b)=>{ if(!a.deadline&&!b.deadline)return 0; if(!a.deadline)return 1; if(!b.deadline)return -1; return new Date(a.deadline)-new Date(b.deadline) })

  const total=allTasks.length, done=allTasks.filter(t=>t.status==='完了').length, pct=total?Math.round(done/total*100):0

  if (!selected) return (
    <div className="container">
      <div className="row" style={{marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--border)'}}>
        <button onClick={()=>setScreen('splash')} style={{fontSize:12,color:'var(--text2)'}}>← 戻る</button>
        <span style={{fontSize:16,fontWeight:500}}>編集者画面</span>
      </div>
      <p className="section-title">担当者を選択</p>
      {data.editors.length===0 ? <div className="empty">編集者が登録されていません</div> :
        <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
          {data.editors.map(e => (
            <div key={e} onClick={()=>setSelected(e)} style={{width:140,padding:'1.25rem',border:'0.5px solid var(--border2)',borderRadius:12,background:'var(--surface)',cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:24,marginBottom:8}}>👤</div>
              <div style={{fontSize:14,fontWeight:500}}>{e}</div>
            </div>
          ))}
        </div>
      }
    </div>
  )

  return (
    <div className="container">
      <div className="row" style={{marginBottom:'1.5rem',paddingBottom:'1rem',borderBottom:'0.5px solid var(--border)'}}>
        <button onClick={()=>setSelected(null)} style={{fontSize:12,color:'var(--text2)'}}>← 戻る</button>
        <span style={{fontSize:16,fontWeight:500,flex:1}}>編集者画面</span>
        <span style={{fontSize:13,color:'var(--text2)'}}>担当: {selected}</span>
      </div>
      <div className="row" style={{marginBottom:'1.5rem',flexWrap:'wrap'}}>
        <div className="stat-card"><div className="stat-num">{total}</div><div className="stat-label">タスク合計</div></div>
        <div className="stat-card"><div className="stat-num">{done}</div><div className="stat-label">完了</div></div>
        <div className="stat-card"><div className="stat-num">{pct}%</div><div className="stat-label">達成率</div><div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}}/></div></div>
      </div>
      <p className="section-title">タスク一覧（期限順）</p>
      {allTasks.length===0 ? <div className="empty">割り振られたタスクはありません ✓</div> : allTasks.map(task => {
        const sc = STATUS_COLORS[STATUS_LIST.indexOf(task.status)]||'gray'
        return (
          <div key={task.id} onClick={()=>setTaskModal(task)} style={{background:'var(--surface)',border:'0.5px solid var(--border)',borderLeft:`3px solid ${borderColor(task.deadline)}`,borderRadius:12,padding:'1rem 1.25rem',marginBottom:10,cursor:'pointer',display:'flex',gap:12,alignItems:'flex-start'}}>
            <div style={{paddingTop:2}}><div className="status-dot" style={{background:`var(--${sc}-light)`,border:`1.5px solid var(--${sc})`}}/></div>
            <div style={{flex:1}}>
              <div className="row" style={{marginBottom:4}}>
                <span style={{fontSize:14,fontWeight:500}}>{task.title}</span>
                <span className={`tag tag-${task.accountColor}`}>{task.accountLabel}</span>
              </div>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>{task.storyTitle}</div>
              <div className="row">
                <span className={`tag tag-${sc}`}>{task.status}</span>
                {task.deadline&&<span style={{fontSize:12,color:'var(--text3)'}}>📅 {task.deadline}</span>}
                <UrgencyLabel deadline={task.deadline} />
              </div>
              {task.theme&&<div className="comment-box" style={{marginTop:6}}>💡 {task.theme}</div>}
            </div>
            <span style={{color:'var(--text3)'}}>›</span>
          </div>
        )
      })}
      {taskModal && <TaskModal task={taskModal} onClose={()=>setTaskModal(null)} />}
    </div>
  )
}

function TaskModal({ task, onClose }) {
  const sc = STATUS_COLORS[STATUS_LIST.indexOf(task.status)]||'gray'
  async function upd(s) { await update(ref(db,`accounts/${task.accountId}/stories/${task.storyId}/posts/${task.id}`),{status:s}) }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:100,padding:'40px 1rem 1rem'}}>
      <div style={{background:'var(--surface)',borderRadius:12,border:'0.5px solid var(--border)',padding:'1.5rem',width:'100%',maxWidth:520,maxHeight:'85vh',overflowY:'auto'}}>
        <div className="row" style={{marginBottom:12}}>
          <span className={`tag tag-${task.accountColor}`}>{task.accountLabel}</span>
          <span style={{fontSize:13,color:'var(--text2)'}}>{task.storyTitle}</span>
        </div>
        <p style={{fontSize:16,fontWeight:500,marginBottom:'.75rem'}}>{task.title}</p>
        <div className="row" style={{marginBottom:'1rem'}}>
          <span className={`tag tag-${sc}`}>{task.status}</span>
          {task.deadline&&<span style={{fontSize:12,color:'var(--text2)'}}>📅 {task.deadline}</span>}
          <UrgencyLabel deadline={task.deadline} />
        </div>
        {[['theme','強調したいテーマ','💡'],['telop','テロップ','📝'],['telopDesign','テロップデザイン指定','🎨'],['materials','使用素材','🎞'],['notes','備考','📌']].map(([k,l,ic])=>task[k]?(
          <div key={k} style={{marginBottom:'1rem'}}>
            <p className="section-title">{ic} {l}</p>
            <div className="comment-box">{task[k]}</div>
          </div>
        ):null)}
        <p className="section-title">ステータス更新</p>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:'1rem'}}>
          {STATUS_LIST.map(s=><span key={s} className={`chip ${task.status===s?'active':''}`} onClick={()=>upd(s)}>{s}</span>)}
        </div>
        <button className="full" onClick={onClose}>閉じる</button>
      </div>
    </div>
  )
}

function SetupScreen({ error }) {
  const [form, setForm] = useState({
    apiKey: '', authDomain: '', databaseURL: '',
    projectId: '', storageBucket: '', messagingSenderId: '', appId: ''
  })
  const f = k => e => setForm(v => ({ ...v, [k]: e.target.value }))

  function save() {
    const missing = Object.entries(form).filter(([, v]) => !v.trim()).map(([k]) => k)
    if (missing.length > 0) { alert('すべての項目を入力してください'); return }
    localStorage.setItem('firebase_config', JSON.stringify(form))
    window.location.reload()
  }

  const fields = [
    ['apiKey',            'API Key'],
    ['authDomain',        'Auth Domain'],
    ['databaseURL',       'Database URL'],
    ['projectId',         'Project ID'],
    ['storageBucket',     'Storage Bucket'],
    ['messagingSenderId', 'Messaging Sender ID'],
    ['appId',             'App ID'],
  ]

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>
      <div style={{width:'100%',maxWidth:480}}>
        <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
          <p style={{fontSize:20,fontWeight:600,marginBottom:6}}>Firebase 設定</p>
          <p style={{fontSize:13,color:'var(--text2)'}}>
            Firebaseコンソール → プロジェクトの設定 → マイアプリ から値を取得してください
          </p>
        </div>
        {error && (
          <div style={{background:'var(--coral-light)',border:'0.5px solid var(--coral)',borderRadius:8,padding:'10px 14px',marginBottom:'1rem',fontSize:12,color:'var(--coral)',whiteSpace:'pre-wrap'}}>
            {error}
          </div>
        )}
        <div className="card">
          {fields.map(([key, label]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input type="text" value={form[key]} onChange={f(key)} placeholder={label} />
            </div>
          ))}
          <button className="primary full" style={{marginTop:4}} onClick={save}>
            保存してアプリを起動
          </button>
        </div>
        <p style={{fontSize:11,color:'var(--text3)',textAlign:'center',marginTop:8}}>
          設定はブラウザのlocalStorageに保存されます
        </p>
      </div>
    </div>
  )
}
