import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { useApp } from '@/store/useAppStore'
import { saveProfile, uploadAvatar, savePhotos } from '@/lib/supabaseClient'
import { extractTags, scoreProfile, improveProfileText, translateProfile } from '@/lib/aiUtils'

import ScreenHeader from '@/components/ui/ScreenHeader'
import Modal from '@/components/ui/Modal'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'

import AvatarUpload from '@/components/profile/AvatarUpload'
import BasicInfoCard from '@/components/profile/BasicInfoCard'
import TextSection from '@/components/profile/TextSection'
import BalanceSelector from '@/components/profile/BalanceSelector'
import MessengersCard from '@/components/profile/MessengersCard'
import ModesCard from '@/components/profile/ModesCard'
import LanguagesCard from '@/components/profile/LanguagesCard'

export default function ProfileEditScreen() {
    const { t } = useTranslation()
    const { profile, setProfile, user, setScreen, profileWelcomeSeen, setProfileWelcomeSeen } = useApp()

    const [showWelcome, setShowWelcome] = useState(!profileWelcomeSeen)
    const [saving, setSaving] = useState(false)
    const [profileScore, setProfileScore] = useState(null) // { score, tips[] }

    const [avatar, setAvatar] = useState(profile.avatar)
    const [about, setAbout] = useState(profile.about)
    const [gives, setGives] = useState(profile.gives)
    const [wants, setWants] = useState(profile.wants)
    const [balance, setBalance] = useState(profile.balance)
    const [wechat, setWechat] = useState(profile.wechat)
    const [whatsapp, setWhatsapp] = useState(profile.whatsapp)
    const [showAge, setShowAge] = useState(profile.showAge)
    const [datingMode, setDatingMode] = useState(profile.datingMode)
    const [datingGender, setDatingGender] = useState(profile.datingGender)
    const [languages, setLanguages] = useState(profile.languages)
    const region = profile.region
    const [city, setCity] = useState(profile.city || '')
    const handleCloseWelcome = () => {
        setShowWelcome(false)
        setProfileWelcomeSeen(true)
    }

    const handleMessenger = (field, value) => {
        if (field === 'wechat') setWechat(value)
        if (field === 'whatsapp') setWhatsapp(value)
    }

    const handleMode = (field, value) => {
        if (field === 'showAge') setShowAge(value)
        if (field === 'datingMode') setDatingMode(value)
        if (field === 'datingGender') setDatingGender(value)
    }

    const handleFile = async (file) => {
        if (!file) return
        const localUrl = URL.createObjectURL(file)
        setAvatar(localUrl)
        const publicUrl = await uploadAvatar(user?.id || 'mock', file)
        if (publicUrl) {
            setAvatar(publicUrl)
            // Also set as first photo if photos array is empty
            const currentPhotos = Array.isArray(profile.photos) ? profile.photos : [null, null, null, null]
            if (!currentPhotos[0]) {
                const updatedPhotos = [...currentPhotos]
                updatedPhotos[0] = publicUrl
                setProfile(p => ({ ...p, photos: updatedPhotos }))
                const { savePhotos } = await import('@/lib/supabaseClient')
                await savePhotos(user?.id || 'mock', updatedPhotos)
            }
        }
    }

    const handleSave = async () => {
        if (!avatar) { toast.error(t('err_photo')); return }
        if (!about.trim()) { toast.error(t('err_about')); return }
        if (!gives.trim()) { toast.error(t('err_gives')); return }
        if (!wants.trim()) { toast.error(t('err_wants')); return }
        if (!wechat.trim() && !whatsapp.trim()) {
            toast.error(t('err_messenger')); return
        }

        setSaving(true)

        // Save immediately without waiting for AI
        const dbData = {
            about, gives, wants, balance,
            wechat, whatsapp,
            show_age: showAge,
            dating_mode: datingMode,
            dating_gender: datingGender,
            languages, region, city,
            avatar_url: avatar,
            phone: user?.phone,
            name: profile.name,
            dob: profile.dob,
            gender: profile.gender,
            email: profile.email,
            status: 'active',
        }

        setProfile(p => ({
            ...p,
            about, gives, wants, balance,
            wechat, whatsapp,
            showAge, datingMode, datingGender,
            languages, region, city, avatar,
        }))

        const result = await saveProfile(user?.id || 'mock', dbData)
        setSaving(false)

        if (result.success) {
            toast.success(t('toast_saved'))
            setScreen('profile')

            // AI improvements in background (non-blocking)
            setTimeout(async () => {
                try {
                    let improvedAbout = null, improvedGives = null, improvedWants = null
                        ;[improvedAbout, improvedGives, improvedWants] = await Promise.all([
                            improveProfileText(about, 'About Me'),
                            improveProfileText(gives, 'Can Give'),
                            improveProfileText(wants, 'Wants to Get'),
                        ])
                    const finalAbout = improvedAbout || about
                    const finalGives = improvedGives || gives
                    const finalWants = improvedWants || wants

                    const [tags, scoreResult] = await Promise.all([
                        extractTags(finalAbout, finalGives, finalWants),
                        scoreProfile(finalAbout, finalGives, finalWants),
                    ])

                    // Detect language: if text contains Chinese chars → translate to EN, else → translate to ZH
                    const hasChinese = /[\u4e00-\u9fff]/.test(finalAbout + finalGives + finalWants)
                    const targetLang = hasChinese ? 'en' : 'zh'
                    const otherLangKey = hasChinese ? 'en' : 'zh'

                    const translated = await translateProfile(
                        { about: finalAbout, gives: finalGives, wants: finalWants },
                        targetLang
                    )

                    const updateData = {
                        ...dbData,
                        about: finalAbout, gives: finalGives, wants: finalWants, tags,
                    }

                    if (hasChinese) {
                        // User wrote in Chinese → save English translation
                        updateData.about_zh = finalAbout
                        updateData.gives_zh = finalGives
                        updateData.wants_zh = finalWants
                        // Store English in main fields, Chinese in _zh fields
                        updateData.about = translated?.about || finalAbout
                        updateData.gives = translated?.gives || finalGives
                        updateData.wants = translated?.wants || finalWants
                    } else {
                        // User wrote in English → save Chinese translation
                        updateData.about_zh = translated?.about || null
                        updateData.gives_zh = translated?.gives || null
                        updateData.wants_zh = translated?.wants || null
                    }

                    await saveProfile(user?.id || 'mock', updateData)
                    setProfile(p => ({
                        ...p,
                        about: updateData.about, gives: updateData.gives, wants: updateData.wants, tags,
                    }))
                    setProfileScore(scoreResult)
                } catch { /* AI failed silently */ }
            }, 100)
        } else {
            toast.error(result.error || 'Save failed. Please try again.')
        }
    }

    return (
        <div className="app-screen">

            {/* Welcome modal — shown only once */}
            {showWelcome && (
                <Modal title={t('modal_title')} onClose={handleCloseWelcome}>
                    <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 20 }}>
                        {t('modal_text')}
                    </p>
                    <button className="btn-gradient" onClick={handleCloseWelcome}>
                        {t('modal_btn')}
                    </button>
                </Modal>
            )}

            <ScreenHeader title={t('profile_title')} />

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 20 }}>

                    <AvatarUpload avatar={avatar} onFile={handleFile} />

                    <BasicInfoCard profile={profile} region={region} city={city} onCityChange={setCity} />

                    <TextSection
                        title={t('about_title')}
                        tip={t('tip_about')}
                        value={about}
                        onChange={setAbout}
                        placeholder={t('about_placeholder')}
                    />

                    <TextSection
                        title={t('gives_title')}
                        tip={t('tip_gives')}
                        value={gives}
                        onChange={setGives}
                        placeholder={t('gives_placeholder')}
                    />

                    <TextSection
                        title={t('wants_title')}
                        tip={t('tip_wants')}
                        value={wants}
                        onChange={setWants}
                        placeholder={t('wants_placeholder')}
                    />

                    <BalanceSelector value={balance} onChange={setBalance} />

                    <MessengersCard
                        wechat={wechat}
                        whatsapp={whatsapp}
                        onChange={handleMessenger}
                    />

                    <ModesCard
                        showAge={showAge}
                        datingMode={datingMode}
                        datingGender={datingGender}
                        onChange={handleMode}
                    />

                    <LanguagesCard selected={languages} onChange={setLanguages} />

                    <div style={{ paddingBottom: 8 }}>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? '...' : t('save')}
                        </Button>
                    </div>

                </div>
            </div>

            <BottomNav active="profile" />
        </div>
    )
}
