import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

const AppContext = createContext(null)
const DARK_KEY = 'rc_dark'

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
    // Read token from localStorage synchronously — no network needed
    const getSbUser = () => {
        try {
            const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
            if (!key) return null
            const t = JSON.parse(localStorage.getItem(key))
            if (t?.user?.id && t?.expires_at && t.expires_at * 1000 > Date.now()) return t.user
        } catch { }
        return null
    }
    const sbUser = getSbUser()

    const [screen, setScreen] = useState(sbUser ? 'profile' : 'onboarding')
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem(DARK_KEY)
        const isDark = saved === 'true'
        if (isDark) document.documentElement.classList.add('dark')
        return isDark
    })
    const [phone, setPhone] = useState('')
    const [countryCode, setCountryCode] = useState('+852')
    const [user, setUser] = useState(sbUser ? { id: sbUser.id, email: sbUser.email } : null)
    const [profile, setProfile] = useState(EMPTY_PROFILE)
    const [subscription, setSubscription] = useState({ status: 'trial', credits: 2, start: null, end: null })
    const [notifNewMatches, setNotifNewMatches] = useState(true)
    const [notifImportantNews, setNotifImportantNews] = useState(true)
    const [profileWelcomeSeen, setProfileWelcomeSeen] = useState(false)
    const [sessionLoading, setSessionLoading] = useState(false)
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const userRef = useRef(sbUser ? { id: sbUser.id, email: sbUser.email } : null)

    useEffect(() => {
        const goOnline = () => setIsOnline(true)
        const goOffline = () => setIsOnline(false)
        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)
        return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
    }, [])

    const restoreFromUser = useCallback(async (authUser) => {
        if (!authUser) return
        const uid = authUser.id
        const email = authUser.email
        try {
            const { data: db } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
            if (db && db.name) {
                const u = { id: uid, email }
                setUser(u)
                userRef.current = u
                setProfile(dbToProfile(db))
                setSubscription({
                    status: db.subscription_status || 'trial',
                    credits: db.coffee_credits ?? 2,
                    start: db.subscription_start || null,
                    end: db.subscription_end || null,
                })
                setNotifNewMatches(db.notif_new_matches ?? true)
                setNotifImportantNews(db.notif_important_news ?? true)
                setProfileWelcomeSeen(true)
                setScreen('profile')
            } else if (db !== null && db !== undefined) {
                setUser({ id: uid, email })
                userRef.current = { id: uid, email }
                setScreen('personal')
            }
        } catch (err) {
            console.error('[restoreFromUser]', err)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'INITIAL_SESSION') {
                    // Background refresh — screen already shown from token
                    if (session?.user) restoreFromUser(session.user).catch(() => { })
                } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (session?.user && !userRef.current) {
                        await restoreFromUser(session.user)
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    userRef.current = null
                    setProfile(EMPTY_PROFILE)
                    setScreen('onboarding')
                }
            }
        )
        const fallback = setTimeout(() => setSessionLoading(false), 8000)
        return () => { authSub.unsubscribe(); clearTimeout(fallback) }
    }, [])

    useEffect(() => {
        if (!user?.id) return
        userRef.current = user

        const profileChannel = supabase
            .channel('profile_rt_' + user.id)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                (payload) => {
                    const db = payload.new
                    if (db.coffee_credits !== undefined) {
                        setSubscription({
                            status: db.subscription_status || 'trial',
                            credits: db.coffee_credits ?? 0,
                            start: db.subscription_start || null,
                            end: db.subscription_end || null,
                        })
                    }
                })
            .subscribe()

        const matchChannel = supabase
            .channel('matches_rt_' + user.id)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' },
                async (payload) => {
                    const m = payload.new
                    const uid = userRef.current?.id
                    if (!uid || (m.user1_id !== uid && m.user2_id !== uid)) return
                    const partnerId = m.user1_id === uid ? m.user2_id : m.user1_id
                    const { data: partner } = await supabase.from('profiles').select('name').eq('id', partnerId).maybeSingle()
                    toast.success(`🎉 New match: ${partner?.name || 'Someone'}!`, {
                        duration: 5000,
                        style: { background: 'linear-gradient(135deg, #007aff, #5856d6)', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: 15, padding: '14px 24px' },
                    })
                })
            .subscribe()

        return () => { supabase.removeChannel(profileChannel); supabase.removeChannel(matchChannel) }
    }, [user?.id])

    const loginUser = (userData, phoneNum, code) => {
        setUser(userData)
        setPhone(phoneNum || '')
        setCountryCode(code || '+852')
    }

    const logoutUser = async () => {
        await supabase.auth.signOut()
        supabase.removeAllChannels()
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
        <div style={{ position: 'fixed', inset: 0, background: 'var(--app-bg, #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e5e5ea', borderTopColor: '#007aff', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    return (
        <AppContext.Provider value={{
            screen, setScreen, darkMode, toggleDark,
            phone, setPhone, countryCode, setCountryCode,
            user, setUser, loginUser, logoutUser,
            profile, setProfile, subscription, setSubscription,
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
