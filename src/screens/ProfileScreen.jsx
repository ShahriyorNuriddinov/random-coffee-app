import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import { Card, CardRow } from '@/components/ui/Card'
import BuyCreditsModal from '@/components/meetings/BuyCreditsModal'
import PhotoGrid from '@/components/profile/PhotoGrid'
import { RefModal, GiftModal } from '@/components/profile/ProfileModals'
import { signOut, updateNotifications, getReferralCode } from '@/lib/supabaseClient'
const SUB_CONFIG = {
    trial: { border: '1.5px solid #ff9500', background: 'rgba(255,149,0,0.08)', titleColor: '#ff9500', title: 'Trial Period Active', desc: 'Enjoy 2 free coffee credits!', btnLabel: 'Upgrade', btnBg: '#ff9500' },
    empty: { border: '1.5px solid #ff3b30', background: 'rgba(255,59,48,0.08)', titleColor: '#ff3b30', title: 'No Credits Left', desc: 'Top up your balance.', btnLabel: 'Buy Credits', btnBg: '#ff3b30' },
    active: { border: '1.5px solid #34c759', background: 'rgba(52,199,89,0.08)', titleColor: '#34c759', title: 'Premium Active', desc: (n) => `${n} credit${n !== 1 ? 's' : ''} remaining.`, btnLabel: 'Top Up', btnBg: '#34c759' },
}

export default function ProfileScreen() {
    const { t } = useTranslation()
    const { setScreen, profile, setProfile, user, subscription, notifNewMatches, setNotifNewMatches, notifImportantNews, setNotifImportantNews, logoutUser } = useApp()
    const [modal, setModal] = useState(null)
    const [referralCode, setReferralCode] = useState(null)

    useEffect(() => {
        if (!user?.id) return
        getReferralCode(user.id).then(d => { if (d?.referral_code) setReferralCode(d.referral_code) })
    }, [user?.id])

    const effectiveStatus = subscription.status === 'active' && (subscription.credits ?? 0) === 0 ? 'empty' : subscription.status
    const sub = SUB_CONFIG[effectiveStatus] || SUB_CONFIG.trial
    const subDesc = typeof sub.desc === 'function' ? sub.desc(subscription.credits) : sub.desc
    const regionFlag = profile.region === 'Macau' ? '🇲🇴'
        : profile.region === 'Mainland' ? '🇨🇳'
            : profile.region === 'Other' ? '🌍'
                : '🇭🇰'

    const handleToggleNotif = async (type) => {
        const newMatches = type === 'matches' ? !notifNewMatches : notifNewMatches
        const importantNews = type === 'news' ? !notifImportantNews : notifImportantNews
        if (type === 'matches') setNotifNewMatches(newMatches)
        else setNotifImportantNews(importantNews)
        if (user?.id) await updateNotifications(user.id, { notifNewMatches: newMatches, notifImportantNews: importantNews })
    }

    const handleLogout = async () => { await signOut(); logoutUser() }

    return (
        <div className="app-screen">
            <ScreenHeader title={t('nav_profile')} />
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>

                    <PhotoGrid
                        photos={(() => {
                            const p = Array.isArray(profile.photos) ? [...profile.photos, null, null, null, null].slice(0, 4) : [null, null, null, null]
                            // If photos[0] is empty but avatar exists, show avatar there
                            if (!p[0] && profile.avatar) p[0] = profile.avatar
                            return p
                        })()}
                        userId={user?.id}
                        onPhotosChange={(photos) => setProfile(p => ({ ...p, photos }))}
                    />

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--app-text)' }}>{profile.name || '—'}</div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', marginTop: 2 }}>{regionFlag} {profile.region}</div>
                    </div>

                    <Card>
                        <CardRow label={t('edit_profile')} onClick={() => setScreen('profile-edit')} isLast />
                    </Card>

                    {/* Subscription */}
                    <div style={{ borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: sub.border, background: sub.background }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: sub.titleColor }}>{sub.title}</div>
                            <div style={{ fontSize: 13, color: 'var(--app-hint)', marginTop: 2 }}>{subDesc}</div>
                        </div>
                        <button onClick={() => setModal('buy')} style={{ background: sub.btnBg, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: 12 }}>
                            {sub.btnLabel}
                        </button>
                    </div>

                    <Card>
                        <CardRow label={t('ref_program')} value={<span style={{ background: '#34c75926', color: '#34c759', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>+1 coffee</span>} onClick={() => setModal('ref')} />
                        <CardRow label={t('gift_friend')} onClick={() => setModal('gift')} isLast />
                    </Card>

                    <Card>
                        <CardRow label={t('notif_new_pairs')} right={<IosToggle checked={notifNewMatches} onChange={() => handleToggleNotif('matches')} />} />
                        <CardRow label={t('notif_news')} right={<IosToggle checked={notifImportantNews} onChange={() => handleToggleNotif('news')} />} />
                        <CardRow label="Email" value={<span style={{ color: 'var(--app-hint)', fontSize: 14 }}>{profile.email || '—'}</span>} isLast />
                    </Card>

                    <Card>
                        <CardRow label={t('support')} onClick={() => window.open('https://wa.me/85251741164')} />
                        <CardRow label={t('privacy')} onClick={() => setModal('privacy')} />
                        <CardRow label={t('terms')} onClick={() => setModal('terms')} isLast />
                    </Card>

                    <Card>
                        <CardRow label={t('logout')} onClick={handleLogout} isLast />
                    </Card>

                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--app-hint)', lineHeight: 1.5, paddingBottom: 8 }}>
                        © 2026, Denis Ivanov Limited.<br />HK 79643900. All rights reserved.
                    </div>
                </div>
            </div>

            {modal === 'ref' && <RefModal referralCode={referralCode} onClose={() => setModal(null)} />}
            {modal === 'buy' && <BuyCreditsModal onClose={() => setModal(null)} />}
            {modal === 'gift' && <GiftModal onClose={() => setModal(null)} />}
            {modal === 'privacy' && <LegalModal title="Privacy Policy" type="privacy" onClose={() => setModal(null)} />}
            {modal === 'terms' && <LegalModal title="Terms of Service" type="terms" onClose={() => setModal(null)} />}

            <BottomNav active="profile" />
        </div>
    )
}

function IosToggle({ checked, onChange }) {
    return (
        <label className="ios-switch" onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="ios-track" />
        </label>
    )
}

function LegalModal({ title, type, onClose }) {
    const privacy = `Random Coffee HK Privacy Policy

Last updated: January 2026

1. Information We Collect
We collect information you provide when registering: name, email, date of birth, gender, region, and profile details. We also collect usage data to improve our service.

2. How We Use Your Information
Your profile information is used to match you with other users for coffee meetings. We do not sell your personal data to third parties.

3. Data Storage
Your data is stored securely on Supabase servers. We use industry-standard encryption to protect your information.

4. Profile Visibility
Your profile (name, photo, about, gives, wants) is visible to other registered users of the platform.

5. Data Deletion
You can request deletion of your account and all associated data by contacting support at +852 51741164.

6. Cookies
We use local storage to maintain your session and preferences.

7. Contact
For privacy concerns, contact: support@randomcoffeehk.com`

    const terms = `Random Coffee HK Terms of Service

Last updated: January 2026

1. Acceptance
By using Random Coffee HK, you agree to these terms. If you disagree, please do not use the service.

2. Eligibility
You must be at least 16 years old to use this service.

3. User Conduct
- Be respectful to other users
- Provide accurate profile information
- Do not spam or harass other users
- Do not use the platform for commercial solicitation

4. Meetings
Random Coffee HK facilitates introductions but is not responsible for the outcome of meetings. Users meet at their own discretion and risk.

5. Credits & Payments
Credits are non-refundable once used. Purchased credits expire after 12 months.

6. Account Termination
We reserve the right to terminate accounts that violate these terms.

7. Limitation of Liability
Random Coffee HK is not liable for any damages arising from use of the service.

8. Contact
For questions: support@randomcoffeehk.com
Denis Ivanov Limited, Hong Kong (HK 79643900)`

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', zIndex: 200,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--app-card)', borderRadius: '24px 24px 0 0',
                width: '100%', maxWidth: 520, maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)' }}>{title}</div>
                    <button onClick={onClose} style={{ background: 'rgba(120,120,128,0.12)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--app-hint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>
                    <pre style={{ fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                        {type === 'privacy' ? privacy : terms}
                    </pre>
                </div>
            </div>
        </div>
    )
}
