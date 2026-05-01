import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { differenceInYears } from 'date-fns'
import { useApp } from '@/store/useAppStore'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { InputCard, Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { saveProfile, applyReferralCode } from '@/lib/supabaseClient'

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
    const [province, setProvince] = useState(profile.city || '')
    const [city, setCity] = useState('')
    const [country, setCountry] = useState('')
    const [loading, setLoading] = useState(false)

    const handleNext = async () => {
        if (name.trim().length < 2) { toast.error(t('err_name')); return }
        if (!dob) { toast.error(t('err_dob')); return }
        const age = differenceInYears(new Date(), dob)
        if (age < 16) { toast.error(t('err_age')); return }

        // Build city string to save
        let cityValue = ''
        if (region === 'Mainland') {
            cityValue = [province.trim(), city.trim()].filter(Boolean).join(', ')
        } else if (region === 'Other') {
            cityValue = [country.trim(), city.trim()].filter(Boolean).join(', ')
        }

        setLoading(true)
        setProfile(p => ({ ...p, name: name.trim(), dob: dob.toISOString(), gender, region, city: cityValue }))

        await saveProfile(user?.id, {
            name: name.trim(),
            dob: dob.toISOString(),
            gender,
            region,
            city: cityValue,
            email: user?.email || '',
        })

        // Apply referral code from URL if present (non-blocking)
        const pendingRef = localStorage.getItem('rc_pending_ref')
        if (pendingRef) {
            localStorage.removeItem('rc_pending_ref')
            applyReferralCode(pendingRef, user?.id).catch(() => { })
        } else {
            try {
                const params = new URLSearchParams(window.location.search)
                const refParam = params.get('ref')
                if (refParam) applyReferralCode(refParam.toUpperCase(), user?.id).catch(() => { })
            } catch { }
        }

        setLoading(false)
        toast.success(t('toast_welcome'))
        setScreen('profile-edit')
    }

    return (
        <div className="app-screen fade-in-up">
            <div className="fixed top-5 right-5 flex gap-2 items-center z-30">
                <DarkToggle />
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col items-center px-5 pt-16 pb-10">
                <div className="screen-content w-full">
                    <h1 className="text-[26px] font-extrabold mb-[10px] tracking-tight text-[var(--app-text)]">
                        {t('personal_title')}
                    </h1>
                    <p className="text-[var(--app-hint)] text-[15px] mb-8 leading-relaxed font-medium">
                        {t('personal_hint')}
                    </p>

                    <InputCard label={t('name_label')} inputId="name-input">
                        <Input
                            id="name-input"
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

                    {/* Mainland: Province + City */}
                    {region === 'Mainland' && (
                        <div className="w-full flex flex-col gap-3 mb-4">
                            <InputCard label={t('province_label')} inputId="province-input">
                                <Input
                                    id="province-input"
                                    type="text"
                                    value={province}
                                    onChange={e => setProvince(e.target.value)}
                                    placeholder={t('province_placeholder')}
                                />
                            </InputCard>
                            <InputCard label={t('city_label')} inputId="city-input">
                                <Input
                                    id="city-input"
                                    type="text"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    placeholder={t('city_placeholder')}
                                />
                            </InputCard>
                        </div>
                    )}

                    {/* Other: Country + City */}
                    {region === 'Other' && (
                        <div className="w-full flex flex-col gap-3 mb-4">
                            <InputCard label={t('country_label')} inputId="country-input">
                                <Input
                                    id="country-input"
                                    type="text"
                                    value={country}
                                    onChange={e => setCountry(e.target.value)}
                                    placeholder={t('country_placeholder')}
                                />
                            </InputCard>
                            <InputCard label={t('city_label')} inputId="city-input">
                                <Input
                                    id="city-input"
                                    type="text"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    placeholder={t('city_placeholder')}
                                />
                            </InputCard>
                        </div>
                    )}

                    <Button onClick={handleNext} disabled={loading}>{loading ? '...' : t('next')}</Button>
                </div>
            </div>
        </div>
    )
}
