import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import { Card, CardRow } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import BuyCreditsModal from '@/components/meetings/BuyCreditsModal'
import { signOut, uploadPhoto, savePhotos, updateNotifications, getReferralCode } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

// ─── Subscription config ──────────────────────────────────────────────────────
const SUB_CONFIG = {
    trial: {
        border: '1.5px solid #ff9500',
        background: 'rgba(255,149,0,0.08)',
        titleColor: '#ff9500',
        title: 'Trial Period Active',
        desc: 'Enjoy 2 free coffee credits!',
        btnLabel: 'Upgrade',
        btnBg: '#ff9500',
    },
    empty: {
        border: '1.5px solid #ff3b30',
        background: 'rgba(255,59,48,0.08)',
        titleColor: '#ff3b30',
        title: 'No Credits Left',
        desc: 'Top up your balance to continue.',
        btnLabel: 'Buy Credits',
        btnBg: '#ff3b30',
    },
    active: {
        border: '1.5px solid #34c759',
        background: 'rgba(52,199,89,0.08)',
        titleColor: '#34c759',
        title: 'Premium Active',
        desc: (credits) => `${credits} coffee credit${credits !== 1 ? 's' : ''} remaining.`,
        btnLabel: 'Top Up',
        btnBg: '#34c759',
    },
}

export default function ProfileScreen() {
    const { t } = useTranslation()
    const {
        setScreen, profile, setProfile, user,
        subscription, setSubscription,
        notifNewMatches, setNotifNewMatches,
        notifImportantNews, setNotifImportantNews,
        logoutUser,
    } = useApp()

    const [modal, setModal] = useState(null) // null | 'ref' | 'buy' | 'gift'
    const [referralCode, setReferralCode] = useState(null)

    // Load referral code once
    useEffect(() => {
        if (!user?.id) return
        getReferralCode(user.id).then(data => {
            if (data?.referral_code) setReferralCode(data.referral_code)
        })
    }, [user?.id])

    const effectiveStatus = subscription.status === 'active' && (subscription.credits ?? 0) === 0
        ? 'empty'
        : subscription.status
    const sub = SUB_CONFIG[effectiveStatus] || SUB_CONFIG.trial
    const subDesc = typeof sub.desc === 'function' ? sub.desc(subscription.credits) : sub.desc

    const regionFlag = profile.region === 'Macau' ? '🇲🇴'
        : profile.region === 'Mainland China' ? '🇨🇳' : '🇭🇰'

    const handleToggleNotif = async (type) => {
        const newMatches = type === 'matches' ? !notifNewMatches : notifNewMatches
        const importantNews = type === 'news' ? !notifImportantNews : notifImportantNews

        if (type === 'matches') setNotifNewMatches(newMatches)
        else setNotifImportantNews(importantNews)

        if (user?.id) {
            await updateNotifications(user.id, {
                notifNewMatches: newMatches,
                notifImportantNews: importantNews,
            })
        }
    }

    const handleLogout = async () => {
        await signOut()
        logoutUser()
    }

    return (
        <div className="app-screen">
            <ScreenHeader title={t('nav_profile')} />

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>

                    <PhotoGrid
                        photos={profile.photos}
                        userId={user?.id}
                        onPhotosChange={(photos) => setProfile(p => ({ ...p, photos }))}
                    />

                    <UserInfo
                        name={profile.name}
                        region={profile.region || 'Hong Kong'}
                        flag={regionFlag}
                    />

                    {/* Edit profile */}
                    <Card>
                        <CardRow
                            label={t('edit_profile')}
                            onClick={() => setScreen('profile-edit')}
                            isLast
                        />
                    </Card>

                    {/* Subscription */}
                    <SubscriptionCard
                        sub={sub}
                        desc={subDesc}
                        onUpgrade={() => setModal('buy')}
                    />

                    {/* Referral & Gift */}
                    <Card>
                        <CardRow
                            label={t('ref_program')}
                            value={<Badge color="#34c759">+1 coffee</Badge>}
                            onClick={() => setModal('ref')}
                        />
                        <CardRow
                            label={t('gift_friend')}
                            onClick={() => setModal('gift')}
                            isLast
                        />
                    </Card>

                    {/* Notifications */}
                    <Card>
                        <CardRow
                            label={t('notif_new_pairs')}
                            right={
                                <IosToggle
                                    checked={notifNewMatches}
                                    onChange={() => handleToggleNotif('matches')}
                                />
                            }
                        />
                        <CardRow
                            label={t('notif_news')}
                            right={
                                <IosToggle
                                    checked={notifImportantNews}
                                    onChange={() => handleToggleNotif('news')}
                                />
                            }
                        />
                        <CardRow
                            label="Email"
                            value={
                                <span style={{ color: 'var(--app-hint)', fontSize: 14 }}>
                                    {profile.email || '—'}
                                </span>
                            }
                            isLast
                        />
                    </Card>

                    {/* Support & Legal */}
                    <Card>
                        <CardRow
                            label={t('support')}
                            onClick={() => window.open('https://wa.me/85251741164')}
                        />
                        <CardRow label={t('privacy')} onClick={() => { }} />
                        <CardRow label={t('terms')} onClick={() => { }} isLast />
                    </Card>

                    {/* Logout */}
                    <Card>
                        <CardRow
                            label={t('logout')}
                            onClick={handleLogout}
                            isLast
                        />
                    </Card>

                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--app-hint)', lineHeight: 1.5, paddingBottom: 8 }}>
                        © 2026, Denis Ivanov Limited.<br />HK 79643900. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Modals */}
            {modal === 'ref' && (
                <RefModal
                    referralCode={referralCode}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'buy' && <BuyCreditsModal onClose={() => setModal(null)} />}
            {modal === 'gift' && <GiftModal onClose={() => setModal(null)} />}

            <BottomNav active="profile" />
        </div>
    )
}

// ─── Photo Grid ───────────────────────────────────────────────────────────────

function PhotoGrid({ photos, userId, onPhotosChange }) {

    // Normalize: always 4 elements, nulls for missing
    const normalized = Array.isArray(photos)
        ? [...photos, null, null, null, null].slice(0, 4)
        : [null, null, null, null]

    const filled = normalized.filter(Boolean)
    const hasPhotos = filled.length > 0

    const handlePick = (index) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            const localUrl = URL.createObjectURL(file)
            const next = [...normalized]
            next[index] = localUrl
            onPhotosChange(next)
            if (userId) {
                const publicUrl = await uploadPhoto(userId, file, index)
                if (publicUrl) {
                    const updated = [...normalized]
                    updated[index] = publicUrl
                    onPhotosChange(updated)
                    await savePhotos(userId, updated)
                }
            }
        }
        input.click()
    }

    const handleRemove = async (index, e) => {
        e.stopPropagation()
        const next = [...normalized]
        next[index] = null
        onPhotosChange(next)
        if (userId) await savePhotos(userId, next)
    }

    // If has photos — show Swiper on top + small grid below
    if (hasPhotos) {
        return (
            <div>
                {/* Swiper */}
                <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 10 }}>
                    <Swiper
                        modules={[Pagination, Navigation]}
                        pagination={{ clickable: true }}
                        navigation
                        style={{ borderRadius: 16 }}
                    >
                        {filled.map((photo, i) => (
                            <SwiperSlide key={i}>
                                <div style={{
                                    width: '100%', paddingTop: '75%',
                                    backgroundImage: `url(${photo})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: 'rgba(120,120,128,0.08)',
                                }} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
                {/* Small grid for all 4 slots */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                    {normalized.map((photo, i) => (
                        <div key={i} onClick={() => handlePick(i)}
                            style={{
                                aspectRatio: '1/1', borderRadius: 10,
                                backgroundImage: photo ? `url(${photo})` : 'none',
                                backgroundSize: 'cover', backgroundPosition: 'center',
                                backgroundColor: 'rgba(120,120,128,0.08)',
                                border: photo ? '2px solid transparent' : '1px dashed rgba(120,120,128,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                            }}
                        >
                            {!photo && <span style={{ fontSize: 18, color: 'rgba(120,120,128,0.4)' }}>+</span>}
                            {photo && (
                                <div onClick={(e) => handleRemove(i, e)} style={{
                                    position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, color: '#fff', cursor: 'pointer', fontWeight: 700,
                                }}>×</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // No photos — show 4 empty upload slots
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {normalized.map((photo, i) => (
                <div key={i} onClick={() => handlePick(i)} style={{
                    aspectRatio: '1/1', borderRadius: 12,
                    backgroundColor: 'rgba(120,120,128,0.08)',
                    border: '1px dashed rgba(120,120,128,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                }}>
                    <span style={{ fontSize: 22, color: 'rgba(120,120,128,0.4)' }}>+</span>
                </div>
            ))}
        </div>
    )
}

// ─── User Info ────────────────────────────────────────────────────────────────

function UserInfo({ name, region, flag }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--app-text)' }}>
                {name || '—'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--app-hint)', marginTop: 2 }}>
                {flag} {region}
            </div>
        </div>
    )
}

// ─── Subscription Card ────────────────────────────────────────────────────────

function SubscriptionCard({ sub, desc, onUpgrade }) {
    return (
        <div style={{
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: sub.border, background: sub.background,
        }}>
            <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: sub.titleColor }}>
                    {sub.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--app-hint)', marginTop: 2 }}>
                    {desc}
                </div>
            </div>
            <button
                onClick={onUpgrade}
                style={{
                    background: sub.btnBg, color: '#fff', border: 'none',
                    padding: '8px 14px', borderRadius: 20, fontSize: 13,
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    flexShrink: 0, marginLeft: 12,
                }}
            >
                {sub.btnLabel}
            </button>
        </div>
    )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ color, children }) {
    return (
        <span style={{
            background: `${color}26`, color,
            padding: '3px 8px', borderRadius: 10,
            fontSize: 11, fontWeight: 700,
        }}>
            {children}
        </span>
    )
}

// ─── iOS Toggle ───────────────────────────────────────────────────────────────

function IosToggle({ checked, onChange }) {
    return (
        <label className="ios-switch" onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="ios-track" />
        </label>
    )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function RefModal({ referralCode, onClose }) {
    const link = referralCode
        ? `https://randomcoffee.app/ref/${referralCode}`
        : 'Loading...'

    const handleCopy = () => {
        if (!referralCode) return
        navigator.clipboard?.writeText(link)
        toast.success('Link copied!')
        onClose()
    }

    return (
        <Modal title="Invite Friends, Get Free Credits!" onClose={onClose}>
            <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16 }}>
                Share your unique link. When a friend signs up and activates a subscription, both of you get +1 free coffee credit!
            </p>
            <input
                readOnly
                value={link}
                style={{
                    width: '100%', padding: 12, borderRadius: 10,
                    border: '1px solid var(--app-border)',
                    background: 'var(--app-bg)', color: 'var(--app-text)',
                    fontSize: 13, boxSizing: 'border-box', marginBottom: 12,
                    fontFamily: 'inherit',
                }}
            />
            <button className="btn-gradient" onClick={handleCopy}>
                Copy Link
            </button>
        </Modal>
    )
}

function BuyModal({ onClose }) {
    const [selected, setSelected] = useState(0)
    const plans = [
        { price: '299 HK$', credits: 4, desc: '4 Cups / ~1 Month' },
        { price: '1999 HK$', credits: 50, desc: '50 Cups / ~1 Year', badge: 'Best Value' },
    ]

    return (
        <Modal title="Get Coffee Credits" onClose={onClose}>
            <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16 }}>
                1 credit is consumed every Monday to pick your match for the week.
            </p>
            {plans.map((p, i) => (
                <div
                    key={i}
                    onClick={() => setSelected(i)}
                    style={{
                        background: selected === i ? 'rgba(0,122,255,0.06)' : 'rgba(120,120,128,0.06)',
                        border: selected === i ? '1.5px solid var(--app-primary)' : '1.5px solid transparent',
                        padding: '12px 16px', borderRadius: 12, marginBottom: 8,
                        cursor: 'pointer', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--app-primary)' }}>{p.price}</div>
                        <div style={{ fontSize: 12, color: 'var(--app-hint)', marginTop: 2 }}>{p.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.badge && (
                            <span style={{
                                background: 'rgba(52,199,89,0.15)', color: '#34c759',
                                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
                            }}>
                                {p.badge}
                            </span>
                        )}
                        <span style={{
                            width: 20, height: 20, borderRadius: '50%',
                            border: `2px solid ${selected === i ? 'var(--app-primary)' : 'var(--app-hint)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {selected === i && (
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--app-primary)' }} />
                            )}
                        </span>
                    </div>
                </div>
            ))}
            <button className="btn-gradient" style={{ marginTop: 8 }} onClick={onClose}>
                Continue to Payment
            </button>
        </Modal>
    )
}

function GiftModal({ onClose }) {
    const [giftPhone, setGiftPhone] = useState('')
    const [selected, setSelected] = useState(0)
    const plans = [
        { price: '299 HK$', credits: 4, desc: '~1 month of networking' },
        { price: '1999 HK$', credits: 50, desc: '~1 year of networking' },
    ]

    return (
        <Modal title="Gift Coffee Credits" onClose={onClose}>
            <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16 }}>
                Enter your friend's phone number and choose a package.
            </p>
            <input
                type="tel"
                value={giftPhone}
                onChange={e => setGiftPhone(e.target.value)}
                placeholder="Friend's phone number"
                style={{
                    width: '100%', padding: 12, borderRadius: 10,
                    border: '1px solid var(--app-border)',
                    background: 'var(--app-bg)', color: 'var(--app-text)',
                    fontSize: 15, boxSizing: 'border-box', marginBottom: 12,
                    fontFamily: 'inherit', outline: 'none',
                }}
            />
            {plans.map((p, i) => (
                <div
                    key={i}
                    onClick={() => setSelected(i)}
                    style={{
                        background: selected === i ? 'rgba(0,122,255,0.06)' : 'rgba(120,120,128,0.06)',
                        border: selected === i ? '1.5px solid var(--app-primary)' : '1.5px solid transparent',
                        padding: '12px 16px', borderRadius: 12, marginBottom: 8,
                        cursor: 'pointer', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--app-primary)' }}>{p.price}</div>
                        <div style={{ fontSize: 12, color: 'var(--app-hint)', marginTop: 2 }}>{p.desc}</div>
                    </div>
                    <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${selected === i ? 'var(--app-primary)' : 'var(--app-hint)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {selected === i && (
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--app-primary)' }} />
                        )}
                    </span>
                </div>
            ))}
            <button className="btn-gradient" style={{ marginTop: 8 }} onClick={onClose}>
                Continue to Payment
            </button>
        </Modal>
    )
}
