import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { useApp } from '@/store/useAppStore'
import { saveProfile, uploadAvatar } from '@/lib/supabaseClient'

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

    // Show welcome modal only the very first time
    const [showWelcome, setShowWelcome] = useState(!profileWelcomeSeen)
    const [saving, setSaving] = useState(false)

    // Form state — initialised from store
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
    const [region, setRegion] = useState(profile.region)

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

    // Upload avatar: show local preview immediately, then replace with public URL
    const handleFile = async (file) => {
        if (!file) return
        const localUrl = URL.createObjectURL(file)
        setAvatar(localUrl)
        const publicUrl = await uploadAvatar(user?.id || 'mock', file)
        if (publicUrl) setAvatar(publicUrl)
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

        // avatar: if still a local blob URL (upload failed/mock), save as-is
        const avatarUrl = avatar.startsWith('blob:') ? avatar : avatar

        // Build DB payload — map camelCase → snake_case
        const dbData = {
            about,
            gives,
            wants,
            balance,
            wechat,
            whatsapp,
            show_age: showAge,
            dating_mode: datingMode,
            dating_gender: datingGender,
            languages,
            region,
            avatar_url: avatarUrl,
            phone: user?.phone,
            name: profile.name,
            dob: profile.dob,
            gender: profile.gender,
            email: profile.email,
        }

        // Update local store
        setProfile(p => ({
            ...p,
            about, gives, wants, balance,
            wechat, whatsapp,
            showAge, datingMode, datingGender,
            languages, region, avatar,
        }))

        const result = await saveProfile(user?.id || 'mock', dbData)
        setSaving(false)

        if (result.success) {
            toast.success(t('toast_saved'))
            setScreen('profile')
        } else {
            console.error('[Save failed]', result.error)
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

                    <BasicInfoCard profile={profile} region={region} onRegionChange={setRegion} />

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
