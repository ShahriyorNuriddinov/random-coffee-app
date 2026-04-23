import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import LangSwitcher from '@/components/LangSwitcher'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { InputCard, Input } from '@/components/ui/input'
import { saveProfile } from '@/lib/supabaseClient'

export default function SettingsScreen() {
    const { t } = useTranslation()
    const { setScreen, profile, setProfile, user } = useApp()
    const [email, setEmail] = useState(profile.email)
    const [loading, setLoading] = useState(false)

    const handleFinish = async () => {
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error(t('err_email'))
            return
        }
        setLoading(true)
        setProfile(p => ({ ...p, email }))

        // Save basic info + email to Supabase
        await saveProfile(user?.id || 'mock', {
            phone: user?.phone,
            name: profile.name,
            dob: profile.dob,
            gender: profile.gender,
            email,
        })

        setLoading(false)
        toast.success(t('toast_welcome'))
        setScreen('profile-edit')
    }

    return (
        <div className="app-screen fade-in-up">
            <div className="fixed top-5 right-5 flex gap-2 items-center z-30">
                <DarkToggle />
                <LangSwitcher />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-5">
                <div className="screen-content w-full text-center">
                    <div className="text-[60px] mb-5">✉️</div>

                    <h1 className="text-[26px] font-extrabold mb-[10px] tracking-tight text-[var(--app-text)]">
                        {t('settings_title')}
                    </h1>
                    <p className="text-[var(--app-hint)] text-[15px] mb-8 leading-relaxed font-medium">
                        {t('settings_hint')}
                    </p>

                    <InputCard label={t('email_label')}>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t('email_placeholder')}
                            onKeyDown={e => e.key === 'Enter' && handleFinish()}
                        />
                    </InputCard>

                    <Button onClick={handleFinish} disabled={loading}>
                        {loading ? '...' : t('finish')}
                    </Button>
                </div>
            </div>
        </div>
    )
}

