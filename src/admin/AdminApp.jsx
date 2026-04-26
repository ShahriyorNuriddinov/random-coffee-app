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

// ─── Supabase-based seen_at helpers ──────────────────────────────────────────
const SETTINGS_KEY = 'notif_seen_at'

async function getSeenAt(sb) {
    const { data } = await sb.from('admin_settings').select('value').eq('key', SETTINGS_KEY).single()
    if (data?.value) return data.value
    // First time ever — mark now as seen so old data doesn't flood the badge
    const now = new Date().toISOString()
    await sb.from('admin_settings').upsert({ key: SETTINGS_KEY, value: now }, { onConflict: 'key' })
    return now
}

async function markAllSeen(sb) {
    const now = new Date().toISOString()
    await sb.from('admin_settings').upsert({ key: SETTINGS_KEY, value: now }, { onConflict: 'key' })
    return now
}

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
    const [seenAt, setSeenAt] = useState(null)

    // Count rows newer than seenAt across all 4 tables
    const countUnread = async (since) => {
        const [momentsRes, profilesRes, matchesRes, paymentsRes] = await Promise.all([
            supabase.from('moments').select('id', { count: 'exact', head: true }).eq('status', 'pending').gte('created_at', since),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since),
            supabase.from('matches').select('id', { count: 'exact', head: true }).gte('created_at', since),
            supabase.from('payments').select('id', { count: 'exact', head: true }).gte('created_at', since),
        ])
        return (momentsRes.count || 0) + (profilesRes.count || 0) + (matchesRes.count || 0) + (paymentsRes.count || 0)
    }

    // Init: load seen_at once, then count
    useEffect(() => {
        if (!authed) return
        let cancelled = false

        const init = async () => {
            const since = await getSeenAt(supabase)
            if (cancelled) return
            setSeenAt(since)
            const total = await countUnread(since)
            if (!cancelled) setUnreadCount(total)
        }
        init()

        return () => { cancelled = true }
    }, [authed])

    // Realtime: increment badge by 1 for each new event (don't re-fetch seen_at)
    useEffect(() => {
        if (!authed || seenAt === null) return

        const bump = () => setUnreadCount(n => n + 1)

        const channels = [
            supabase.channel('admin_badge_moments')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, bump)
                .subscribe(),
            supabase.channel('admin_badge_profiles')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, bump)
                .subscribe(),
            supabase.channel('admin_badge_matches')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, bump)
                .subscribe(),
            supabase.channel('admin_badge_payments')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, bump)
                .subscribe(),
        ]
        return () => channels.forEach(c => supabase.removeChannel(c))
    }, [authed, seenAt])

    const handleTabChange = async (t) => {
        setTab(t)
        if (t === 'notifications') {
            const now = await markAllSeen(supabase)
            setSeenAt(now)
            setUnreadCount(0)
        }
    }

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
                    <AdminBottomNav tab={tab} setTab={handleTabChange} lang={lang} unreadCount={unreadCount} />
                </div>
            </AdminCtx.Provider>
        </ErrorBoundary>
    )
}
