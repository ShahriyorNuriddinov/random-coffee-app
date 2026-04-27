import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import LangSwitcher from '@/components/LangSwitcher'
import { Card, CardRow } from '@/components/ui/Card'
import BuyCreditsModal from '@/components/meetings/BuyCreditsModal'
import PhotoGrid from '@/components/profile/PhotoGrid'
import { RefModal, GiftModal } from '@/components/profile/ProfileModals'
import { signOut, updateNotifications, getReferralCode, getSubscription, supabase, deleteAccount } from '@/lib/supabaseClient'

// ─── Profile completeness ─────────────────────────────────────────────────────
function calcCompleteness(profile) {
    const fields = [
        profile.avatar,
        profile.name,
        profile.dob,
        profile.about?.trim(),
        profile.gives?.trim(),
        profile.wants?.trim(),
        profile.wechat?.trim() || profile.whatsapp?.trim(),
        profile.email?.trim(),
        profile.languages?.length > 0,
    ]
    const done = fields.filter(Boolean).length
    return Math.round((done / fields.length) * 100)
}

function ProfileCompleteness({ profile, onEdit }) {
    const pct = calcCompleteness(profile)
    if (pct >= 100) return null
    return (
        <div
            onClick={onEdit}
            style={{
                background: 'linear-gradient(135deg, rgba(0,122,255,0.08), rgba(88,86,214,0.08))',
                border: '1px solid rgba(0,122,255,0.15)',
                borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text)' }}>
                    Complete your profile
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--app-primary)' }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(120,120,128,0.12)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 3,
                    background: 'linear-gradient(90deg, #007aff, #5856d6)',
                    width: `${pct}%`, transition: 'width 0.5s ease',
                }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--app-hint)', marginTop: 6 }}>
                {pct < 50 ? 'Add photo, bio and contacts to get matched' :
                    pct < 80 ? 'Almost there! Fill in remaining fields' :
                        'Just a few more details needed'}
            </p>
        </div>
    )
}

const SUB_CONFIG = {
    trial: { border: '1.5px solid #ff9500', background: 'rgba(255,149,0,0.08)', titleColor: '#ff9500', title: 'Trial Period Active', desc: 'Enjoy 2 free coffee credits!', btnLabel: 'Upgrade', btnBg: '#ff9500' },
    empty: { border: '1.5px solid #ff3b30', background: 'rgba(255,59,48,0.08)', titleColor: '#ff3b30', title: 'No Credits Left', desc: 'Top up your balance.', btnLabel: 'Buy Credits', btnBg: '#ff3b30' },
    active: { border: '1.5px solid #34c759', background: 'rgba(52,199,89,0.08)', titleColor: '#34c759', title: 'Premium Active', desc: (n) => `${n} credit${n !== 1 ? 's' : ''} remaining.`, btnLabel: 'Top Up', btnBg: '#34c759' },
}

export default function ProfileScreen() {
    const { t } = useTranslation()
    const { setScreen, profile, setProfile, user, subscription, setSubscription, notifNewMatches, setNotifNewMatches, notifImportantNews, setNotifImportantNews, logoutUser } = useApp()
    const [modal, setModal] = useState(null)
    const [referralCode, setReferralCode] = useState(null)

    useEffect(() => {
        if (!user?.id) return
        getReferralCode(user.id).then(d => { if (d?.referral_code) setReferralCode(d.referral_code) }).catch(() => { })

        const fetchCredits = () => {
            getSubscription(user.id).then(data => {
                if (data) setSubscription({
                    status: data.subscription_status || 'trial',
                    credits: data.coffee_credits ?? 0,
                    start: data.subscription_start || null,
                    end: data.subscription_end || null,
                })
            }).catch(() => { })
        }

        fetchCredits()

        // Refresh credits when tab becomes visible (e.g. after admin approves moment)
        const onVisible = () => { if (document.visibilityState === 'visible') fetchCredits() }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    const effectiveStatus = (subscription.credits ?? 0) === 0 ? 'empty'
        : subscription.status === 'trial' ? 'trial'
            : 'active'
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

    const handleDeleteAccount = async () => {
        if (!window.confirm('Delete your account? This cannot be undone.')) return
        if (!window.confirm('Are you absolutely sure? All your data will be removed.')) return
        const res = await deleteAccount(user.id)
        if (res.success) { logoutUser() }
        else toast.error(res.error || 'Failed to delete account')
    }

    return (
        <div className="app-screen">
            <ScreenHeader title={t('nav_profile')} />
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>

                    <PhotoGrid
                        photos={(() => {
                            const p = Array.isArray(profile.photos) ? [...profile.photos, null, null, null, null].slice(0, 4) : [null, null, null, null]
                            if (!p[0] && profile.avatar) p[0] = profile.avatar
                            return p
                        })()}
                        userId={user?.id}
                        onPhotosChange={(photos) => {
                            setProfile(p => ({ ...p, photos }))
                        }}
                    />

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--app-text)' }}>{profile.name || '—'}</div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', marginTop: 2 }}>{regionFlag} {profile.region}</div>
                    </div>

                    <ProfileCompleteness profile={profile} onEdit={() => setScreen('profile-edit')} />

                    <Card>
                        <CardRow label={t('edit_profile')} onClick={() => setScreen('profile-edit')} isLast />
                    </Card>

                    {/* Subscription — click opens info modal */}
                    <div
                        onClick={() => setModal(effectiveStatus === 'trial' ? 'trial-info' : effectiveStatus === 'active' ? 'active-info' : 'buy')}
                        style={{ borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: sub.border, background: sub.background, cursor: 'pointer' }}
                    >
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: sub.titleColor }}>{sub.title}</div>
                            <div style={{ fontSize: 13, color: 'var(--app-hint)', marginTop: 2 }}>{subDesc}</div>
                        </div>
                        <button
                            onClick={e => { e.stopPropagation(); setModal('buy') }}
                            style={{ background: sub.btnBg, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: 12 }}
                        >
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
                        <CardRow label={t('language')} right={<LangSwitcher />} />
                        <CardRow
                            label="Email"
                            value={
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: 'var(--app-hint)', fontSize: 13 }}>{profile.email || '—'}</span>
                                    {profile.email && (
                                        <span style={{ background: 'rgba(52,199,89,0.15)', color: '#34c759', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8 }}>
                                            Verified
                                        </span>
                                    )}
                                </span>
                            }
                            onClick={() => setModal('email')}
                            isLast
                        />
                    </Card>

                    <Card>
                        <CardRow label={t('support')} onClick={() => window.open('https://wa.me/85251741164')} />
                        <CardRow label={t('privacy')} onClick={() => setModal('privacy')} />
                        <CardRow label={t('terms')} onClick={() => setModal('terms')} isLast />
                    </Card>

                    <Card>
                        <CardRow label={t('logout')} onClick={handleLogout} />
                        <CardRow
                            label={<span style={{ color: '#ff3b30' }}>Delete Account</span>}
                            onClick={handleDeleteAccount}
                            isLast
                        />
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
            {modal === 'email' && <EmailModal email={profile.email} userId={user?.id} onClose={() => setModal(null)} />}
            {modal === 'trial-info' && (
                <InfoModal
                    title="Trial Activated! 🎉"
                    onClose={() => setModal(null)}
                    onAction={() => setModal('buy')}
                    actionLabel="Buy More Credits"
                >
                    <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 12 }}>
                        We've credited 2 free coffee cups to your account. Every Monday, 1 credit is deducted to find you a perfect match.
                    </p>
                    <div style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff9500', fontWeight: 600, marginBottom: 12 }}>
                        Balance: {subscription.credits} Coffee Credits
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--app-hint)', lineHeight: 1.4 }}>
                        You can upgrade and add more credits at any time without losing trial ones.
                    </p>
                </InfoModal>
            )}
            {modal === 'active-info' && (
                <InfoModal
                    title="Your Premium Status"
                    onClose={() => setModal(null)}
                    onAction={() => setModal('buy')}
                    actionLabel="Top Up Balance"
                >
                    <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 12 }}>
                        You are in the game! The system automatically deducts 1 credit on Monday and schedules your meeting.
                    </p>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#34c759', marginBottom: 4 }}>
                        {subscription.credits}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--app-hint)', marginBottom: 12 }}>Coffee credits remaining</div>
                    <div style={{ background: 'rgba(120,120,128,0.08)', padding: '10px 12px', borderRadius: 12, fontSize: 12, lineHeight: 1.4, color: 'var(--app-text)' }}>
                        🔥 <b>Using Boost?</b> If you activate "Boost Mode" in meetings, it will consume additional credits, finding you matches immediately!
                    </div>
                </InfoModal>
            )}

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

function InfoModal({ title, children, onClose, onAction, actionLabel }) {
    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--app-card)', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, boxSizing: 'border-box', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--app-text)', marginBottom: 16 }}>{title}</div>
                {children}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                    {onAction && (
                        <button onClick={onAction} className="btn-gradient" style={{ borderRadius: 14 }}>{actionLabel}</button>
                    )}
                    <button onClick={onClose} style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

function EmailModal({ email, userId, onClose }) {
    const [newEmail, setNewEmail] = useState(email || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!newEmail.trim() || !newEmail.includes('@')) return
        setSaving(true)
        const { error } = await supabase.from('profiles').update({ email: newEmail.trim() }).eq('id', userId)
        setSaving(false)
        if (!error) {
            toast.success('Email updated!')
            onClose()
        } else {
            toast.error(error.message)
        }
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--app-card)', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, boxSizing: 'border-box', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>Change Email Address</div>
                <p style={{ fontSize: 14, color: 'var(--app-hint)', marginBottom: 16 }}>Enter your new email address below.</p>
                <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="new@email.com"
                    style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--app-border)', background: 'var(--app-bg)', color: 'var(--app-text)', fontSize: 15, boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit', outline: 'none', textAlign: 'center' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={handleSave} disabled={saving} className="btn-gradient" style={{ borderRadius: 14 }}>{saving ? '...' : 'Save'}</button>
                    <button onClick={onClose} style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                </div>
            </div>
        </div>
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
