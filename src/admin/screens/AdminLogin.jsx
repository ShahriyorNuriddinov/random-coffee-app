import { useState, useRef } from 'react'
import { sendOtp, verifyOtp, supabase } from '@/lib/supabaseClient'
import LangSwitcher from '../components/LangSwitcher'
import { getT } from '../i18n'

// ─── Staff check (single source of truth: DB staff table) ────────────────────
const checkIsStaff = async (email) => {
    const { data } = await supabase
        .from('staff')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()
    return !!data
}

// ─── OTP digit input row ──────────────────────────────────────────────────────
function OtpInput({ otp, onChange, onKeyDown, inputRefs }) {
    return (
        <div className="flex justify-center gap-3 mb-6">
            {otp.map((d, i) => (
                <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => onChange(e.target.value, i)}
                    onKeyDown={e => onKeyDown(e, i)}
                    className="w-12 h-14 bg-white border-2 border-gray-300 focus:border-[#007aff] focus:shadow-[0_0_0_3px_rgba(0,122,255,0.15)] rounded-xl text-center text-2xl font-bold outline-none transition-all"
                />
            ))}
        </div>
    )
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
    if (!message) return null
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-600 text-[13px] font-semibold">{message}</p>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminLogin({ onLogin, lang, setLang }) {
    const [step, setStep] = useState('email') // 'email' | 'otp'
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const inputRefs = useRef([])

    const t = getT('login', lang)

    // ── Step 1: send OTP ────────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        setError('')
        const trimmed = email.trim().toLowerCase()

        setLoading(true)
        const isStaff = await checkIsStaff(trimmed)
        if (!isStaff) {
            setLoading(false)
            setError(t.errNotAdmin)
            return
        }

        const res = await sendOtp(trimmed)
        setLoading(false)
        if (!res.success) { setError(t.errGeneric); return }
        setStep('otp')
    }

    // ── Step 2: verify OTP ──────────────────────────────────────────────────────
    const handleVerify = async () => {
        setError('')
        const code = otp.join('')
        if (code.length < 6) return

        setLoading(true)
        const res = await verifyOtp(email.trim().toLowerCase(), code)
        if (!res.success) {
            setLoading(false)
            setError(t.errOtp)
            return
        }

        // Layer 3: post-auth DB check
        const stillStaff = await checkIsStaff(email.trim().toLowerCase())
        setLoading(false)
        if (!stillStaff) { setError(t.errNotAdmin); return }

        onLogin()
    }

    const handleOtpChange = (val, idx) => {
        if (!/^[0-9]?$/.test(val)) return
        const next = [...otp]
        next[idx] = val
        setOtp(next)
        if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
    }

    const handleOtpKey = (e, idx) => {
        if (e.key === 'Backspace') {
            if (!otp[idx] && idx > 0) {
                inputRefs.current[idx - 1]?.focus()
                const next = [...otp]
                next[idx - 1] = ''
                setOtp(next)
            }
        }
    }

    return (
        <div className="min-h-screen bg-[#f4f7f9] flex flex-col items-center justify-center px-8 relative">

            <div className="absolute top-5 right-5">
                <LangSwitcher lang={lang} setLang={setLang} width={100} />
            </div>

            <div className="w-full max-w-sm flex flex-col items-center">
                {/* Logo */}
                <div className="text-[42px] font-black tracking-tight text-gray-900 mb-1">RC</div>
                <div className="text-[13px] font-bold text-[#007aff] uppercase tracking-[2px] mb-10">{t.sub}</div>

                {/* ── Email step ── */}
                {step === 'email' && (
                    <div className="w-full">
                        <h1 className="text-2xl font-extrabold mb-2 tracking-tight">{t.emailTitle}</h1>
                        <p className="text-[15px] text-gray-400 font-medium mb-8 leading-relaxed">{t.emailHint}</p>

                        <div className="bg-white border border-[#d1d1d6] rounded-xl px-4 py-3 mb-4 shadow-sm">
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                {t.emailLabel}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                                placeholder={t.emailPlaceholder}
                                className="w-full text-[16px] font-medium outline-none bg-transparent text-gray-900 placeholder-[#c7c7cc]"
                                autoFocus
                                autoComplete="email"
                            />
                        </div>

                        <ErrorBanner message={error} />

                        <button
                            onClick={handleSendOtp}
                            disabled={loading || !email.trim()}
                            className="w-full bg-gradient-to-br from-gray-900 to-gray-700 text-white py-4 rounded-xl text-[16px] font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-40"
                        >
                            {loading
                                ? <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t.checking}
                                </span>
                                : t.sendCode}
                        </button>
                    </div>
                )}

                {/* ── OTP step ── */}
                {step === 'otp' && (
                    <div className="w-full">
                        <h1 className="text-2xl font-extrabold mb-2 tracking-tight">{t.otpTitle}</h1>
                        <p className="text-[15px] text-gray-400 font-medium mb-8 leading-relaxed">
                            {t.otpHint} <b className="text-gray-700">{email}</b>
                        </p>

                        <OtpInput
                            otp={otp}
                            onChange={handleOtpChange}
                            onKeyDown={handleOtpKey}
                            inputRefs={inputRefs}
                        />

                        <ErrorBanner message={error} />

                        <button
                            onClick={handleVerify}
                            disabled={loading || otp.join('').length < 6}
                            className="w-full bg-gradient-to-br from-gray-900 to-gray-700 text-white py-4 rounded-xl text-[16px] font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-40 mb-3"
                        >
                            {loading
                                ? <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t.verifying}
                                </span>
                                : t.verify}
                        </button>

                        <button
                            onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError('') }}
                            className="w-full text-gray-400 text-[14px] font-semibold py-2"
                        >
                            {t.changeEmail}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
