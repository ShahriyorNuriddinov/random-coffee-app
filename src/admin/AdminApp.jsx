import { useState, createContext, useContext } from 'react'
import AdminLogin from './screens/AdminLogin'
import AdminDashboard from './screens/AdminDashboard'
import AdminMembers from './screens/AdminMembers'
import AdminMoments from './screens/AdminMoments'
import AdminNews from './screens/AdminNews'
import AdminNotifications from './screens/AdminNotifications'
import AdminSettings from './screens/AdminSettings'
import AdminHeader from './components/AdminHeader'
import AdminBottomNav from './components/AdminBottomNav'

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
export default function AdminApp() {
    // ── DEMO MODE: login skip ─────────────────────────────────────────────────
    const [authed, setAuthed] = useState(true)
    const [tab, setTab] = useState('dashboard')
    const [lang, setLang] = useState('en')

    if (!authed) {
        return <AdminLogin onLogin={() => setAuthed(true)} lang={lang} setLang={setLang} />
    }

    const Screen = SCREENS[tab] ?? AdminDashboard

    return (
        <AdminCtx.Provider value={{ lang, setLang, tab, setTab }}>
            <div className="flex flex-col h-screen bg-[#f5f7fb] overflow-hidden">
                <AdminHeader tab={tab} lang={lang} setLang={setLang} />
                <div className="flex-1 overflow-y-auto pb-24">
                    <Screen />
                </div>
                <AdminBottomNav tab={tab} setTab={setTab} lang={lang} />
            </div>
        </AdminCtx.Provider>
    )
}
