import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import LangSwitcher from '@/components/LangSwitcher'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { InputCard, Input } from '@/components/ui/input'
import { CountrySelect } from '@/components/ui/country-select'
import { sendOtp } from '@/lib/supabaseClient'

export default function PhoneScreen() {
    const { t } = useTranslation()
    const { setScreen, phone, setPhone, countryCode, setCountryCode } = useApp()
    const [loading, setLoading] = useState(false)

    const handleNext = async () => {
        if (phone.replace(/\D/g, '').length < 7) {
            toast.error(t('err_phone'))
            return
        }
        setLoading(true)
        const res = await sendOtp(countryCode + phone)
        setLoading(false)
        // OTP code is saved to DB before SMS is sent.
        // If only SMS delivery fails (e.g. low balance), res has error but code exists in DB.
        // We only block if res is completely null (network/function error).
        if (res !== null && res !== undefined) {
            setScreen('otp')
        } else {
            toast.error(t('err_phone'))
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
                        {t('auth_hint')}
                    </p>

                    <InputCard label={t('phone_label')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CountrySelect value={countryCode} onChange={setCountryCode} />
                            <Input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="0000-0000"
                                inputMode="numeric"
                                maxLength={12}
                                style={{ paddingLeft: 8 }}
                                onKeyDown={e => e.key === 'Enter' && handleNext()}
                            />
                        </div>
                    </InputCard>

                    <Button onClick={handleNext} disabled={loading}>
                        {loading ? '...' : t('next')}
                    </Button>

                    <p style={{ marginTop: 10, fontSize: 12, color: 'var(--app-hint)', lineHeight: 1.4, textAlign: 'center', padding: '0 15px' }}>
                        {t('privacy')}
                    </p>
                </div>
            </div>
        </div>
    )
}

