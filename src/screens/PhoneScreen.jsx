import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import LangSwitcher from '@/components/LangSwitcher'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { InputCard, Input } from '@/components/ui/input'
import { sendOtp } from '@/lib/supabaseClient'

export default function PhoneScreen() {
    const { t } = useTranslation()
    const { setScreen, setPhone } = useApp()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleNext = async () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error(t('err_email'))
            return
        }
        setLoading(true)
        const res = await sendOtp(email)
        setLoading(false)
        if (res?.success) {
            setPhone(email) // store email in phone field for OTP screen
            setScreen('otp')
        } else {
            toast.error(res?.error || t('err_email'))
        }
    }

    return (
        <div className="app-screen fade-in-up">
            <div className="fixed top-5 right-5 flex gap-2 items-center z-30">
                <DarkToggle />
                <LangSwitcher />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-5">
                <div className="screen-content w-full">
                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, letterSpacing: -1, color: 'var(--app-text)' }}>
                        {t('auth_title')}
                    </h1>
                    <p style={{ color: 'var(--app-hint)', fontSize: 15, marginBottom: 32, lineHeight: 1.5, fontWeight: 500 }}>
                        {t('auth_hint_email')}
                    </p>

                    <InputCard>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t('email_placeholder')}
                            inputMode="email"
                            onKeyDown={e => e.key === 'Enter' && handleNext()}
                        />
                    </InputCard>

                    <Button onClick={handleNext} disabled={loading}>
                        {loading ? '...' : t('next')}
                    </Button>

                    <p style={{ marginTop: 10, fontSize: 12, color: 'var(--app-hint)', lineHeight: 1.4, textAlign: 'center', padding: '0 15px' }}>
                        By clicking "Next", you agree to the{' '}
                        <a href="#" style={{ color: 'var(--app-primary)', textDecoration: 'none', fontWeight: 500 }}>Terms</a>
                        {' '}and{' '}
                        <a href="#" style={{ color: 'var(--app-primary)', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </div>
    )
}
