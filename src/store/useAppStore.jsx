import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

const AppContext = createContext(null)

const DARK_KEY = 'rc_dark'
const USER_SESSION_KEY = 'rc_user_session'
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

const EMPTY_PROFILE = {
    name: '', dob: '', gender: 'male',
    about: '', gives: '', wants: '',
    balance: '50_50', wechat: '', whatsapp: '',
    showAge: true, datingMode: false, datingGender: 'women',
    languages: ['EN'], region: 'Hong Kong', city: '',
    email: '', avatar: null,
    photos: [null, null, null, null],
    tags: [],
}

// ── localStorage session helpers ──────────────────────────────────────────────
function saveUserSession(uid, email, profileData, subscriptionData) {
    try {
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify({
            uid, email, profile: profileData, subscription: subscriptionData,
            exp: Date.now() + SESSION_TTL,
        }))
    } catch { }
}

function loadUserSession() {
    try {
        const raw = localStorage.getItem(USER_SESSION_KEY)
        if (!raw) return null
        const data = JSON.parse(raw)
        if (!data.uid || Date.now() > data.exp) {
            localStorage.removeItem(USER_SESSION_KEY)
            return null
        }
        return data
    } catch { return null }
}

function clearUserSession() {
    localStorage.removeItem(USER_SESSION_KEY)
}

function dbToProfile(db) {
    return {
        name: db.name || '',
        dob: db.dob || '',
        gender: db.gender || 'male',
        about: db.about || '',
        gives: db.gives || '',
        wants: db.wants || '',
        balance: db.balance || '50_50',
        wechat: db.wechat || '',
        whatsapp: db.whatsapp || '',
        showAge: db.show_age ?? true,
        datingMode: db.dating_mode ?? false,
        datingGender: db.dating_gender || 'women',
        languages: db.languages || ['EN'],
        region: db.region || 'Hong Kong',
        city: db.city || '',
        email: db.email || '',
        avatar: db.avatar_url || null,
        photos: Array.isArray(db.photos) ? db.photos : [null, null, null, null],
        tags: Array.isArray(db.tags) ? db.tags : [],
    }
}

export function AppProvider({ children }) {
    // ── Try restore from localStorage immediately (synchronous, no network) ──
    const cachedSession = loadUserSession()

    const [screen, setScreen] = useState(cachedSession?.profile?.name ? 'profile' : 'onboarding')
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem(DARK_KEY)
        const isDark = saved === 'true'
        if (isDark) document.documentElement.classList.add('dark')
        return isDark
    })
    const [phone, setPhone] = useState('')
    const [countryCode, setCountryCode] = useState('+852')
    const [user, setUser] = useState(cachedSession ? { id: cachedSession.uid, email: cachedSession.email } : null)
    const [profile, setProfile] = useState(cachedSession?.profile || EMPTY_PROFILE)
    const [subscription, setSubscription] = useState(cachedSession?.subscription || {
        status: 'trial', credits: 2, start: null, end: null,
    })
    const [notifNewMatches, setNotifNewMatches] = useState(true)
    const [notifImportantNews, setNotifImportantNews] = useState(true)
    const [profileWelcomeSeen, setProfileWelcomeSeen] = useState(!!cachedSession?.profile?.name)
    const [sessionLoading, setSessionLoading] = useState(!cachedSession) // skip loading if cached
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const userRef = useRef(cachedSession ? { id: cachedSession.uid, email: cachedSession.email } : null)

    // ── Online/Offline detection ───────────────────────────────────
    useEffect(() => {
        const goOnline = () => setIsOnline(true)
        const goOffline = () => setIsOnline(false)
        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)
        return () => {
            window.removeEventListener('online', goOnline)
            window.removeEventListener('offline', goOffline)
        }
    }, [])

    // ── Restore + refresh from Supabase in background ─────────────
    const restoreFromUser = async (authUser) => {
        if (!authUser) return
        try {
            const uid = authUser.id
            const email = authUser.email
            const { data: db } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
            if (db && db.name) {
                const u = { id: uid, email }
                const profileData = dbToProfile(db)
                const subscriptionData = {
                    status: db.subscription_status || 'trial',
                    credits: db.coffee_credits ?? 2,
                    start: db.subscription_start || null,
                    end: db.subscription_end || null,
                }
                setUser(u)
                userRef.current = u
                setProfile(profileData)
                setSubscription(subscriptionData)
                setNotifNewMatches(db.notif_new_matches ?? true)
                setNotifImportantNews(db.notif_important_news ?? true)
                setProfileWelcomeSeen(true)
                setScreen('profile')
                // Save to localStorage for next refresh
                saveUserSession(uid, email, profileData, subscriptionData)
            } else if (db !== null && db !== undefined) {
                setUser({ id: uid, email })
                userRef.current = { id: uid, email }
                setScreen('personal')
            }
        } catch { /* silent */ }
    }

    // ── On app start: listen for auth changes ──
    useEffect(() => {
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'INITIAL_SESSION') {
                    if (session?.user && !userRef.current) {
                        await restoreFromUser(session.user)
                    }
                    setSessionLoading(false)
                } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (session?.user) {
                        await restoreFromUser(session.user)
                    }
                } else if (event === 'SIGNED_OUT') {
                    clearUserSession()
                    setUser(null)
                    userRef.current = null
                    setProfile(EMPTY_PROFILE)
                    setScreen('onboarding')
                }
            }
        )
        const fallback = setTimeout(() => setSessionLoading(false), 5000)
        return () => { authSub.unsubscribe(); clearTimeout(fallback) }
    }, [])

    // ── Real-time: profile credits + new matches ──────────────────
    useEffect(() => {
        if (!user?.id) return
        userRef.current = user

        const profileChannel = supabase
            .channel('profile_rt_' + user.id)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'profiles',
                filter: `id=eq.${user.id}`,
            }, (payload) => {
                const db = payload.new
                if (db.coffee_credits !== undefined) {
                    const sub = {
                        status: db.subscription_status || 'trial',
                        credits: db.coffee_credits ?? 0,
                        start: db.subscription_start || null,
                        end: db.subscription_end || null,
                    }
                    setSubscription(sub)
                    // Update cached session
                    const cached = loadUserSession()
                    if (cached) saveUserSession(cached.uid, cached.email, cached.profile, sub)
                }
            })
            .subscribe()

        const channel = supabase
            .channel('matches_rt_' + user.id)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'matches',
            }, async (payload) => {
                const m = payload.new
                const uid = userRef.current?.id
                if (!uid) return
                if (m.user1_id !== uid && m.user2_id !== uid) return
                const partnerId = m.user1_id === uid ? m.user2_id : m.user1_id
                const { data: partner } = await supabase
                    .from('profiles').select('name').eq('id', partnerId).maybeSingle()
                toast.success(`🎉 New match: ${partner?.name || 'Someone'}!`, {
                    duration: 5000,
                    style: {
                        background: 'linear-gradient(135deg, #007aff, #5856d6)',
                        color: '#fff', borderRadius: 20, fontWeight: 700,
                        fontSize: 15, padding: '14px 24px',
                    },
                })
            })
            .subscribe()

        return () => { supabase.removeChannel(profileChannel); supabase.removeChannel(channel) }
    }, [user?.id])

    const loginUser = (userData, phoneNum, code) => {
        setUser(userData)
        setPhone(phoneNum || '')
        setCountryCode(code || '+852')
    }

    const logoutUser = async () => {
        await supabase.auth.signOut()
        supabase.removeAllChannels()
        clearUserSession()
        setUser(null)
        userRef.current = null
        setProfile(EMPTY_PROFILE)
        setSubscription({ status: 'trial', credits: 2, start: null, end: null })
        setNotifNewMatches(true)
        setNotifImportantNews(true)
        setProfileWelcomeSeen(false)
        setScreen('onboarding')
    }

    const toggleDark = () => {
        setDarkMode(d => {
            const next = !d
            if (next) document.documentElement.classList.add('dark')
            else document.documentElement.classList.remove('dark')
            localStorage.setItem(DARK_KEY, String(next))
            return next
        })
    }

    if (sessionLoading) return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'var(--app-bg, #f2f4f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid #e5e5ea',
                borderTopColor: '#007aff',
                animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    return (
        <AppContext.Provider value={{
            screen, setScreen,
            darkMode, toggleDark,
            phone, setPhone,
            countryCode, setCountryCode,
            user, setUser,
            loginUser, logoutUser,
            profile, setProfile,
            subscription, setSubscription,
            notifNewMatches, setNotifNewMatches,
            notifImportantNews, setNotifImportantNews,
            profileWelcomeSeen, setProfileWelcomeSeen,
            isOnline,
        }}>
            {children}
        </AppContext.Provider>
    )
}

export const useApp = () => useContext(AppContext)
