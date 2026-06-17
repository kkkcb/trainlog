import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: '#f5f5f7', fontFamily: 'system-ui, sans-serif', gap: '12px', background: '#111114' }}>
          <p style={{ fontSize: '17px', fontWeight: 600 }}>出了点问题</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            style={{ padding: '8px 20px', borderRadius: '10px', background: '#4ae09a', color: '#111', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '15px' }}
          >
            重新加载
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
