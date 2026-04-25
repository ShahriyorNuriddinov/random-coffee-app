import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import LangSwitcher from '@/components/LangSwitcher'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { InputCard, Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { saveProfile } from '@/lib/supabaseClient'

export default function PersonalScreen() {
    const { t, i18n } = useTranslation()
    const { setScreen, profile, setProfile, user } = useApp()

    const REGIONS = [
        { value: 'Hong Kong', label: '🇭🇰 HK' },
        { value: 'Macau', label: '🇲🇴 Macau' },
        { value: 'Mainland', label: '🇨🇳 Mainland' },
        { value: 'Other', label: '🌍 Other' },
    ]

    const [name, setName] = useState(profile.name)
    const [dob, setDob] = useState(profile.dob ? new Date(profile.dob) : null)
    const [gender, setGender] = useState(profile.gender)
    const [region, setRegion] = useState(profile.region || 'Hong Kong')
    const [city, setCity] = useState(profile.city || '')
    const [loading, setLoading] = useState(false)

    const handleNext = async () => {
        if (name.trim().length < 2) { toast.error(t('err_name')); return }
        if (!dob) { toast.error(t('err_dob')); return }
        const age = (new Date() - dob) / (1000 * 60 * 60 * 24 * 365.25)
        if (age < 16) { toast.error(t('err_age')); return }

        setLoading(true)
        setProfile(p => ({ ...p, name: name.trim(), dob: dob.toISOString(), gender, region, city }))

        await saveProfile(user?.id, {
            name: name.trim(),
            dob: dob.toISOString(),
            gender,
            region,
            city,
            email: user?.email || '',
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

            <div className="flex-1 overflow-y-auto flex flex-col items-center px-5 pt-16 pb-10">
                <div className="screen-content w-full">
                    <h1 className="text-[26px] font-extrabold mb-[10px] tracking-tight text-[var(--app-text)]">
                        {t('personal_title')}
                    </h1>
                    <p className="text-[var(--app-hint)] text-[15px] mb-8 leading-relaxed font-medium">
                        {t('personal_hint')}
                    </p>

                    <InputCard label={t('name_label')}>
                        <Input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t('name_placeholder')}
                        />
                    </InputCard>

                    <div className="w-full mb-4">
                        <label className="block text-[var(--app-primary)] font-semibold text-[11px] uppercase tracking-[0.3px] mb-2 ml-1">
                            {t('gender_label')}
                        </label>
                        <div className="flex gap-3">
                            <div className={`gender-option ${gender === 'male' ? 'active' : ''}`} onClick={() => setGender('male')}>
                                {t('male')}
                            </div>
                            <div className={`gender-option ${gender === 'female' ? 'active' : ''}`} onClick={() => setGender('female')}>
                                {t('female')}
                            </div>
                        </div>
                    </div>

                    <DatePicker
                        label={t('dob_label')}
                        value={dob}
                        onChange={setDob}
                        lang={i18n.language}
                    />

                    <p className="text-[12px] text-[var(--app-hint)] mb-4 ml-1 font-medium">
                        {t('dob_gift')}
                    </p>

                    {/* Region — 2x2 grid */}
                    <div className="w-full mb-4">
                        <label className="block text-[var(--app-primary)] font-semibold text-[11px] uppercase tracking-[0.3px] mb-2 ml-1">
                            {t('region_label')}
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {REGIONS.map((r) => (
                                <div
                                    key={r.value}
                                    onClick={() => setRegion(r.value)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: 8, padding: '14px 12px', borderRadius: 14,
                                        cursor: 'pointer', fontSize: 15, fontWeight: 600,
                                        background: region === r.value ? 'var(--app-primary)' : 'var(--app-card)',
                                        color: region === r.value ? '#fff' : 'var(--app-text)',
                                        border: region === r.value ? 'none' : '0.5px solid var(--app-border)',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {r.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <InputCard label={t('city_label')}>
                        <Input
                            type="text"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            placeholder={t('city_placeholder')}
                        />
                    </InputCard>

                    <Button onClick={handleNext} disabled={loading}>{loading ? '...' : t('next')}</Button>
                </div>
            </div>
        </div>
    )
}
