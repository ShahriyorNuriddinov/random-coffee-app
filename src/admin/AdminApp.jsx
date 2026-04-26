import { useState, useEffect, createContext, useContext } from 'react'
import ErrorBoundary from '../components/ErrorBoundary'
import AdminLogin from './screens/AdminLogin'
import AdminDashboard from './screens/AdminDashboard'
import AdminMembers from './screens/AdminMembers'
import AdminMoments from './screens/AdminMoments'
import AdminNews from './screens/AdminNews'
import AdminNotifications from './screens/AdminNotifications'
import AdminSettings from './screens/AdminSettings'
import AdminHeader from './components/AdminHeader'
import AdminBottomNav from './components/AdminBottomNav'
import { supabase } from './lib/adminSupabase'

// ─── Context — shared across all admin screens ────────────────────────────────
const AdminCtx = createContext(null)
export const useAdmin = () => useContext(AdminCtx)

// ─── Screen map ───────────────────────────────────────────────────────────────
const SCREENS = {
    dashboard: AdminDashboard,
    members: AdminMembers,
    moments: AdminMoments,
    news: AdminNews,
    notifications: AdminNotifications,
    settings: AdminSettings,
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const ADMIN_SESSION_KEY = 'rc_admin_session'
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function getStoredSession() {
    try {
        const raw = localStorage.getItem(ADMIN_SESSION_KEY)
        if (!raw) return false
        const { email, exp } = JSON.parse(raw)
        if (!email || Date.now() > exp) { localStorage.removeItem(ADMIN_SESSION_KEY); return false }
        return true
    } catch { return false }
}

function saveSession(email) {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ email, exp: Date.now() + SESSION_TTL }))
}

function clearSession() {
    localStorage.removeItem(ADMIN_SESSION_KEY)
}

export default function AdminApp() {
    const [authed, setAuthed] = useState(() => getStoredSession())
    const [tab, setTab] = useState('dashboard')
    const [lang, setLang] = useState('en')
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!authed) return
        // Load initial pending count
        supabase.from('moments').select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .then(({ count }) => setUnreadCount(count || 0))

        // Realtime: update count when moments change
        const channel = supabase.channel('admin_notif_badge')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'moments' }, () => {
                supabase.from('moments').select('id', { count: 'exact', head: true })
                    .eq('status', 'pending')
                    .then(({ count }) => setUnreadCount(count || 0))
            })
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [authed])

    if (!authed) {
        return <AdminLogin onLogin={(email) => { saveSession(email); setAuthed(true) }} lang={lang} setLang={setLang} />
    }

    const Screen = SCREENS[tab] ?? AdminDashboard

    return (
        <ErrorBoundary>
            <AdminCtx.Provider value={{ lang, setLang, tab, setTab, logout: () => { clearSession(); setAuthed(false) } }}>
                <div className="flex flex-col h-screen bg-[#f5f7fb] overflow-hidden">
                    <AdminHeader tab={tab} lang={lang} setLang={setLang} />
                    <div className="flex-1 overflow-y-auto pb-24">
                        <Screen />
                    </div>
                    <AdminBottomNav tab={tab} setTab={(t) => { setTab(t); if (t === 'notifications') setUnreadCount(0) }} lang={lang} unreadCount={unreadCount} />
                </div>
            </AdminCtx.Provider>
        </ErrorBoundary>
    )
}
