import { useState, useEffect, createContext, useContext } from 'react'
import { getProfile } from '@/lib/supabaseClient'

const AppContext = createContext(null)

// Only store user id — profile always fetched fresh from Supabase
const SESSION_KEY = 'rc_uid'

const EMPTY_PROFILE = {
    name: '', dob: '', gender: 'male',
    about: '', gives: '', wants: '',
    balance: '50_50', wechat: '', whatsapp: '',
    showAge: true, datingMode: false, datingGender: 'women',
    languages: ['EN'], region: 'Hong Kong',
    email: '', avatar: null,
    photos: [null, null, null, null],
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
        email: db.email || '',
        avatar: db.avatar_url || null,
        photos: Array.isArray(db.photos) ? db.photos : [null, null, null, null],
    }
}

export function AppProvider({ children }) {
    const [screen, setScreen] = useState('onboarding')
    const [darkMode, setDarkMode] = useState(false)
    const [phone, setPhone] = useState('')
    const [countryCode, setCountryCode] = useState('+852')
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(EMPTY_PROFILE)
    const [subscription, setSubscription] = useState({
        status: 'trial', credits: 2, start: null, end: null,
    })
    const [notifNewMatches, setNotifNewMatches] = useState(true)
    const [notifImportantNews, setNotifImportantNews] = useState(true)
    const [profileWelcomeSeen, setProfileWelcomeSeen] = useState(false)
    const [sessionLoading, setSessionLoading] = useState(true)

    // ── On app start: check saved uid, load profile from Supabase ─
    useEffect(() => {
        const restore = async () => {
            try {
                const savedUid = localStorage.getItem(SESSION_KEY)
                if (!savedUid) { setSessionLoading(false); return }

                // Fetch fresh profile from Supabase
                const db = await getProfile(savedUid)
                if (db && db.name) {
                    setUser({ id: savedUid, phone: db.phone })
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
                } else if (db) {
                    // User exists but profile not complete yet
                    setUser({ id: savedUid, phone: db.phone })
                    setScreen('personal')
                } else {
                    // uid saved but no DB record — clear
                    localStorage.removeItem(SESSION_KEY)
                }
            } catch (e) {
                console.error('[Session restore]', e)
                localStorage.removeItem(SESSION_KEY)
            } finally {
                setSessionLoading(false)
            }
        }
        restore()
    }, [])

    // Save only uid to localStorage on login
    const loginUser = (userData, phoneNum, code) => {
        setUser(userData)
        setPhone(phoneNum || '')
        setCountryCode(code || '+852')
        localStorage.setItem(SESSION_KEY, userData.id)
    }

    // Clear everything on logout
    const logoutUser = () => {
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
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
            return next
        })
    }

    if (sessionLoading) return null

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
        }}>
            {children}
        </AppContext.Provider>
    )
}

export const useApp = () => useContext(AppContext)
