import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { verifyOtp, sendOtp, getProfile, saveProfile } from '@/lib/supabaseClient'

export default function OtpScreen() {
    const { t } = useTranslation()
    const { setScreen, phone, setProfile, loginUser } = useApp()
    const [digits, setDigits] = useState(['', '', '', '', '', ''])
    const [timer, setTimer] = useState(60)
    const [loading, setLoading] = useState(false)
    const inputs = useRef([])
    const intervalRef = useRef(null)
    const verifyingRef = useRef(false)

    useEffect(() => {
        startTimer()
        setTimeout(() => inputs.current[0]?.focus(), 300)
        return () => clearInterval(intervalRef.current)
    }, [])

    const startTimer = () => {
        clearInterval(intervalRef.current)
        setTimer(60)
        intervalRef.current = setInterval(() => {
            setTimer(prev => { if (prev <= 1) { clearInterval(intervalRef.current); return 0 } return prev - 1 })
        }, 1000)
    }

    const handleInput = (i, val) => {
        if (!/^[0-9]?$/.test(val)) return
        const next = [...digits]; next[i] = val; setDigits(next)
        if (val && i < 5) inputs.current[i + 1]?.focus()
        if (next.every(d => d !== '') && !loading) {
            setTimeout(() => handleVerify(next.join('')), 50)
        }
    }

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace') {
            if (!digits[i] && i > 0) { inputs.current[i - 1]?.focus(); const n = [...digits]; n[i - 1] = ''; setDigits(n) }
            else { const n = [...digits]; n[i] = ''; setDigits(n) }
        }
    }

    const handleVerify = async (code) => {
        if (verifyingRef.current) return  // prevent double-call (race condition fix)
        if (!code || code.length < 6) return
        verifyingRef.current = true
        setLoading(true)
        try {
            const res = await verifyOtp(phone, code)
            if (res?.success) {
                loginUser(res.user, phone, '')
                // phone state holds the email address (app uses email OTP)
                const email = phone
                await saveProfile(res.user.id, { email })
                const existingProfile = await getProfile(res.user.id)
                if (existingProfile && existingProfile.name) {
                    setProfile(p => ({
                        ...p,
                        name: existingProfile.name,
                        dob: existingProfile.dob,
                        gender: existingProfile.gender,
                        about: existingProfile.about || '',
                        gives: existingProfile.gives || '',
                        wants: existingProfile.wants || '',
                        balance: existingProfile.balance || '50_50',
                        wechat: existingProfile.wechat || '',
                        whatsapp: existingProfile.whatsapp || '',
                        showAge: existingProfile.show_age ?? true,
                        datingMode: existingProfile.dating_mode ?? false,
                        datingGender: existingProfile.dating_gender || 'women',
                        languages: existingProfile.languages || ['EN'],
                        region: existingProfile.region || 'Hong Kong',
                        city: existingProfile.city || '',
                        email: existingProfile.email || phone,
                        avatar: existingProfile.avatar_url || null,
                        photos: existingProfile.photos || [null, null, null, null],
                        tags: existingProfile.tags || [],
                    }))
                    setScreen('profile')
                } else {
                    setScreen('personal')
                }
            } else {
                toast.error(t('err_otp'))
                setDigits(['', '', '', '', '', ''])
                inputs.current[0]?.focus()
            }
        } catch {
            toast.error(t('err_otp'))
            setDigits(['', '', '', '', '', ''])
            inputs.current[0]?.focus()
        } finally {
            verifyingRef.current = false
            setLoading(false)
        }
    }

    const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    return (
        <div className="app-screen fade-in-up">
            <div className="fixed top-5 right-5 flex gap-2 items-center z-30">
                <DarkToggle />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4">
                <div className="screen-content w-full text-center">
                    <h1 className="text-[26px] font-extrabold mb-[10px] tracking-tight text-[var(--app-text)]">
                        {t('otp_title')}
                    </h1>
                    <p className="text-[var(--app-hint)] text-[15px] mb-8 leading-relaxed font-medium">
                        {t('otp_hint')}
                    </p>

                    {/* 6 digit boxes */}
                    <div className="flex justify-center gap-2 mb-5">
                        {digits.map((d, i) => (
                            <input
                                key={i}
                                ref={el => inputs.current[i] = el}
                                className="sms-input"
                                style={{ width: 44, height: 54, fontSize: 24 }}
                                type="tel"
                                inputMode="numeric"
                                maxLength={1}
                                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                value={d}
                                onChange={e => handleInput(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                            />
                        ))}
                    </div>

                    {/* Timer */}
                    <div className="text-[14px] text-[var(--app-hint)] mb-8 font-medium">
                        {timer > 0 ? (
                            <>{t('resend_in')} <span>{fmt(timer)}</span></>
                        ) : (
                            <span
                                onClick={async () => {
                                    try { await sendOtp(phone); toast.success(t('toast_otp_sent')); startTimer() }
                                    catch { toast.error(t('err_otp')) }
                                }}
                                className="text-[var(--app-primary)] font-semibold cursor-pointer"
                            >
                                {t('resend')}
                            </span>
                        )}
                    </div>

                    <Button onClick={() => handleVerify(digits.join(''))} disabled={loading || digits.some(d => !d)}>
                        {loading ? '...' : t('next')}
                    </Button>
                    <div style={{ height: 8 }} />
                    <button
                        onClick={() => setScreen('phone')}
                        style={{
                            width: '100%', background: 'transparent', border: 'none',
                            color: 'var(--app-primary)', fontSize: 15, fontWeight: 600,
                            padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        {t('back')}
                    </button>
                </div>
            </div>
        </div>
    )
}

