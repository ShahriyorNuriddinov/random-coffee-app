import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import './index.css'
import './i18n'

const isAdmin = window.location.pathname.startsWith('/admin')

if (isAdmin) {
  document.getElementById('root').style.height = 'auto'
  document.getElementById('root').style.overflow = 'visible'
  document.getElementById('root').style.minHeight = '100vh'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </React.StrictMode>
)
