import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { InputCard, Input } from '@/components/ui/input'
import { sendOtp } from '@/lib/supabaseClient'

function LegalModal({ type, onClose, t }) {
    const content = {
        terms: {
            title: t('terms'),
            text: `Random Coffee HK — Terms of Service
Last updated: January 2026

1. Acceptance
By using Random Coffee HK, you agree to these terms.

2. Eligibility
You must be at least 16 years old to use this service.

3. User Conduct
- Be respectful to other users
- Provide accurate profile information
- Do not spam or harass other users
- Do not use the platform for commercial solicitation

4. Meetings
Random Coffee HK facilitates introductions but is not responsible for the outcome of meetings.

5. Credits & Payments
Credits are non-refundable once used. Purchased credits expire after 12 months.

6. Account Termination
We reserve the right to terminate accounts that violate these terms.

7. Contact
support@randomcoffeehk.com
Denis Ivanov Limited, Hong Kong (HK 79643900)`
        },
        privacy: {
            title: t('privacy'),
            text: `Random Coffee HK — Privacy Policy
Last updated: January 2026

1. Information We Collect
We collect: name, email, date of birth, gender, region, and profile details.

2. How We Use Your Information
Your profile is used to match you with other users for coffee meetings. We do not sell your personal data.

3. Data Storage
Your data is stored securely on Supabase servers with industry-standard encryption.

4. Profile Visibility
Your profile (name, photo, about, gives, wants) is visible to other registered users.

5. Data Deletion
Request deletion by contacting: +852 51741164

6. Cookies
We use local storage to maintain your session and preferences.

7. Contact
support@randomcoffeehk.com`
        }
    }

    const { title, text } = content[type]

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end',
                justifyContent: 'center', zIndex: 200,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--app-card)', borderRadius: '24px 24px 0 0',
                    width: '100%', maxWidth: 520, maxHeight: '85vh',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)' }}>{title}</div>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(120,120,128,0.12)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--app-hint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>
                    <pre style={{ fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                        {text}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default function PhoneScreen() {
    const { t } = useTranslation()
    const { setScreen, setPhone } = useApp()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [modal, setModal] = useState(null) // 'terms' | 'privacy' | null

    const handleNext = async () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error(t('err_email'))
            return
        }
        setLoading(true)
        const res = await sendOtp(email)
        setLoading(false)
        if (res?.success) {
            setPhone(email)
            setScreen('otp')
        } else {
            toast.error(res?.error || t('err_email'))
        }
    }

    return (
        <div className="app-screen fade-in-up">
            <div className="fixed top-5 right-5 flex gap-2 items-center z-30">
                <DarkToggle />
            </div>

            {modal && <LegalModal type={modal} onClose={() => setModal(null)} t={t} />}

            <div className="flex-1 flex flex-col items-center justify-center px-5">
                <div className="screen-content w-full">
                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, letterSpacing: -1, color: 'var(--app-text)' }}>
                        {t('auth_title')}
                    </h1>
                    <p style={{ color: 'var(--app-hint)', fontSize: 15, marginBottom: 32, lineHeight: 1.5, fontWeight: 500 }}>
                        {t('auth_hint_email')}
                    </p>

                    <InputCard inputId="email-input">
                        <Input
                            id="email-input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t('email_placeholder')}
                            inputMode="email"
                            aria-label={t('email_label')}
                            onKeyDown={e => e.key === 'Enter' && handleNext()}
                        />
                    </InputCard>

                    <Button onClick={handleNext} disabled={loading}>
                        {loading ? '...' : t('next')}
                    </Button>

                    <p style={{ marginTop: 10, fontSize: 12, color: 'var(--app-hint)', lineHeight: 1.4, textAlign: 'center', padding: '0 15px' }}>
                        {t('privacy_hint')}{' '}
                        <button
                            onClick={() => setModal('terms')}
                            style={{ color: 'var(--app-primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}
                        >{t('terms')}</button>
                        {' '}{t('and') || 'and'}{' '}
                        <button
                            onClick={() => setModal('privacy')}
                            style={{ color: 'var(--app-primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}
                        >{t('privacy')}</button>.
                    </p>
                </div>
            </div>
        </div>
    )
}
