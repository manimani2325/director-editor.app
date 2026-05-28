import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
          <div style={{maxWidth:480,width:'100%',border:'1px solid #e2e2e2',borderRadius:12,padding:'2rem',background:'#fff'}}>
            <p style={{fontSize:16,fontWeight:600,marginBottom:'0.75rem',color:'#c0392b'}}>アプリの起動に失敗しました</p>
            <pre style={{fontSize:12,background:'#f5f5f5',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap',wordBreak:'break-word',color:'#333'}}>
              {this.state.error.message}
            </pre>
            <p style={{fontSize:12,color:'#888',marginTop:'1rem'}}>
              プロジェクトルートに <code>.env</code> ファイルを作成し、Firebaseの設定値を入力してください。
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
