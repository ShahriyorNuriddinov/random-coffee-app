import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n'

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason)

  // Prevent default browser behavior
  event.preventDefault()

  // Show user-friendly message for network errors
  if (event.reason?.message?.includes('network') || event.reason?.message?.includes('fetch')) {
    // Toast will be shown by error boundary
    console.warn('[Network Error] Please check your connection')
  }
})

window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error)
})

const isAdmin = window.location.pathname.startsWith('/admin')

if (isAdmin) {
  document.getElementById('root').style.height = 'auto'
  document.getElementById('root').style.overflow = 'visible'
  document.getElementById('root').style.minHeight = '100vh'
}

// Lazy load both apps — only one will be loaded
const App = lazy(() => import('./App'))
const AdminApp = lazy(() => import('./admin/AdminApp'))

function Spinner() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f9' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e5e5ea', borderTopColor: '#007aff', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Spinner />}>
      {isAdmin ? <AdminApp /> : <App />}
    </Suspense>
  </React.StrictMode>
)
