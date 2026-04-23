import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import LangSwitcher from '@/components/LangSwitcher'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { InputCard, Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'

export default function PersonalScreen() {
    const { t, i18n } = useTranslation()
    const { setScreen, profile, setProfile } = useApp()

    const [name, setName] = useState(profile.name)
    const [dob, setDob] = useState(profile.dob ? new Date(profile.dob) : null)
    const [gender, setGender] = useState(profile.gender)

    const handleNext = () => {
        if (name.trim().length < 2) { toast.error(t('err_name')); return }
        if (!dob) { toast.error(t('err_dob')); return }
        const age = (new Date() - dob) / (1000 * 60 * 60 * 24 * 365.25)
        if (age < 16) { toast.error(t('err_age')); return }
        setProfile(p => ({ ...p, name: name.trim(), dob: dob.toISOString(), gender }))
        setScreen('settings')
    }

    return (
        <div className="app-screen fade-in-up">
            <div className="fixed top-5 right-5 flex gap-2 items-center z-30">
                <DarkToggle />
                <LangSwitcher />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-5">
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

                    <p className="text-[12px] text-[var(--app-hint)] mb-6 ml-1 font-medium">
                        {t('dob_gift')}
                    </p>

                    <Button onClick={handleNext}>{t('next')}</Button>
                </div>
            </div>
        </div>
    )
}

