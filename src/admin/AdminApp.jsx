import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from '../components/ErrorBoundary'
import AdminLogin from './screens/AdminLogin'

const adminQueryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
        },
    },
})
const AdminDashboard = lazy(() => import('./screens/AdminDashboard'))
const AdminMembers = lazy(() => import('./screens/AdminMembers'))
const AdminMoments = lazy(() => import('./screens/AdminMoments'))
const AdminNews = lazy(() => import('./screens/AdminNews'))
const AdminNotifications = lazy(() => import('./screens/AdminNotifications'))
const AdminSettings = lazy(() => import('./screens/AdminSettings'))
const AdminReports = lazy(() => import('./screens/AdminReports'))
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
    reports: AdminReports,
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
    const [newReportsCount, setNewReportsCount] = useState(0)

    // Server-side validation: verify stored email exists in staff table
    useEffect(() => {
        if (!authed) return

        const validateSession = async () => {
            const raw = localStorage.getItem(ADMIN_SESSION_KEY)
            if (!raw) {
                setAuthed(false)
                return
            }

            try {
                const { email } = JSON.parse(raw)
                const { data, error } = await supabase
                    .from('staff')
                    .select('id, role')
                    .eq('email', email)
                    .maybeSingle()

                if (error) {
                    console.error('[Admin Auth] Validation error:', error)
                    // Don't clear session on network errors
                    if (error.code !== 'PGRST116') {
                        return
                    }
                }

                if (!data) {
                    console.warn('[Admin Auth] Invalid session - staff not found')
                    clearSession()
                    setAuthed(false)
                }
            } catch (err) {
                console.error('[Admin Auth] Validation failed:', err)
                clearSession()
                setAuthed(false)
            }
        }

        validateSession()
    }, [authed])

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

        // Load initial pending reports count
        const loadReportsCount = async () => {
            const { count } = await supabase
                .from('reports')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending')
            setNewReportsCount(count || 0)
        }
        loadReportsCount().catch(() => { })

        // Realtime bump on new events
        const bump = () => setUnreadCount(n => n + 1)
        const bumpReports = () => setNewReportsCount(n => n + 1)

        const ch = supabase
            .channel('app_badge_v3')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, bump)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, bump)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, bump)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, bump)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, bumpReports)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'reports',
                filter: 'status=eq.pending'
            }, () => {
                // Reload count when report status changes
                loadReportsCount().catch(() => { })
            })
            .subscribe()
        return () => supabase.removeChannel(ch)
    }, [authed])

    const handleTabChange = (t) => {
        setTab(t)
        // Invalidate relevant query on tab switch
        const queryMap = {
            dashboard: 'admin-dashboard',
            members: 'admin-members',
            moments: 'admin-moments',
            news: 'admin-news',
            settings: 'admin-settings',
            notifications: 'admin-notifications',
            reports: 'admin-reports',
        }
        if (queryMap[t]) adminQueryClient.invalidateQueries({ queryKey: [queryMap[t]] })
        if (t === 'notifications') {
            supabase.from('app_settings').update({ notif_seen_at: new Date().toISOString() }).eq('id', 1).then(() => { })
            setUnreadCount(0)
        }
        if (t === 'reports') {
            // Reset reports counter when viewing reports tab
            setNewReportsCount(0)
        }
    }

    if (!authed) {
        return <AdminLogin onLogin={(email) => { saveSession(email); setAuthed(true) }} lang={lang} setLang={setLang} />
    }

    const Screen = SCREENS[tab] ?? AdminDashboard

    return (
        <QueryClientProvider client={adminQueryClient}>
            <ErrorBoundary>
                <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
                <AdminCtx.Provider value={{ lang, setLang, tab, setTab, logout: () => { clearSession(); setAuthed(false) }, setUnreadCount, setNewReportsCount }}>
                    <AdminHeader tab={tab} lang={lang} setLang={setLang} />
                    <div className={`w-full max-w-[1200px] mx-auto pb-20 box-border`}>
                        <Suspense fallback={<AdminScreenFallback />}>
                            <Screen />
                        </Suspense>
                    </div>
                    <AdminBottomNav tab={tab} setTab={handleTabChange} lang={lang} unreadCount={unreadCount} newReportsCount={newReportsCount} />
                </AdminCtx.Provider>
            </ErrorBoundary>
        </QueryClientProvider>
    )
}

function AdminScreenFallback() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e5e5ea', borderTopColor: '#007aff', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
