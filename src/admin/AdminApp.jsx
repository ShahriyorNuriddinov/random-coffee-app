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

        // Load initial unread count — only events AFTER last seen time from DB
        const loadInitialCount = async () => {
            const { data: stateData } = await supabase
                .from('app_settings')
                .select('notif_seen_at')
                .eq('id', 1)
                .single()

            const since = stateData?.notif_seen_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

            const [profilesRes, momentsRes, paymentsRes, matchesRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since),
                supabase.from('moments').select('id', { count: 'exact', head: true }).eq('status', 'pending').gte('created_at', since),
                supabase.from('payments').select('id', { count: 'exact', head: true }).gte('created_at', since),
                supabase.from('matches').select('id', { count: 'exact', head: true }).gte('created_at', since),
            ])
            const total = (profilesRes.count || 0) + (momentsRes.count || 0) + (paymentsRes.count || 0) + (matchesRes.count || 0)
            setUnreadCount(total)
        }
        loadInitialCount().catch(() => { })

        // Realtime bump on new events
        const bump = () => setUnreadCount(n => n + 1)
        const ch = supabase
            .channel('app_badge_v3')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, bump)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, bump)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, bump)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, bump)
            .subscribe()
        return () => supabase.removeChannel(ch)
    }, [authed])

    const handleTabChange = (t) => {
        setTab(t)
        if (t === 'notifications') {
            // Save current time to admin_settings as "last seen"
            supabase
                .from('app_settings')
                .update({ notif_seen_at: new Date().toISOString() })
                .eq('id', 1)
                .then(() => { })
            setUnreadCount(0)
        }
    }

    if (!authed) {
        return <AdminLogin onLogin={(email) => { saveSession(email); setAuthed(true) }} lang={lang} setLang={setLang} />
    }

    const Screen = SCREENS[tab] ?? AdminDashboard

    return (
        <ErrorBoundary>
            <AdminCtx.Provider value={{ lang, setLang, tab, setTab, logout: () => { clearSession(); setAuthed(false) }, setUnreadCount }}>
                <AdminHeader tab={tab} lang={lang} setLang={setLang} />
                <div className="w-full max-w-[1200px] mx-auto pb-20 px-4 box-border">
                    <Screen />
                </div>
                <AdminBottomNav tab={tab} setTab={handleTabChange} lang={lang} unreadCount={unreadCount} />
            </AdminCtx.Provider>
        </ErrorBoundary>
    )
}
