// ─── PersonProfileSheet — bottom sheet modal ─────────────────────────────────

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { translateProfile } from '@/lib/aiUtils'
import { blockUser, reportUser } from '@/lib/supabaseClient'
import { useApp } from '@/store/useAppStore'
import toast from 'react-hot-toast'

export default function PersonProfileSheet({ person, liked, onLike, onClose }) {
    const { t, i18n } = useTranslation()
    const { user } = useApp()
    const targetLang = i18n.language === 'zh' ? 'zh' : 'en'
    const tags = Array.isArray(person.tags) ? person.tags : []
    const langs = Array.isArray(person.languages) ? person.languages : []
    const photos = Array.isArray(person.photos) ? person.photos.filter(Boolean) : []
    const allPhotos = (() => {
        const seen = new Set()
        const result = []
        const candidates = person.avatar_url ? [person.avatar_url, ...photos] : photos
        for (const p of candidates) {
            if (p && !seen.has(p)) { seen.add(p); result.push(p) }
        }
        return result
    })()

    const [translated, setTranslated] = useState(false)
    const [translatedData, setTranslatedData] = useState(null)
    const [translating, setTranslating] = useState(false)
    const [showReportMenu, setShowReportMenu] = useState(false)
    const [blocking, setBlocking] = useState(false)
    const [showBlockConfirm, setShowBlockConfirm] = useState(false)

    const handleBlock = async () => {
        if (!user?.id) return
        setShowBlockConfirm(false)
        setShowReportMenu(false)
        setBlocking(true)
        const res = await blockUser(user.id, person.id)
        setBlocking(false)
        if (res.success) {
            toast.success('User blocked successfully')
            setTimeout(() => onClose(), 500)
        } else toast.error(res.error || 'Failed to block user')
    }

    const handleReport = async (reason) => {
        if (!user?.id) return
        setShowReportMenu(false)
        const res = await reportUser(user.id, person.id, reason)
        if (res.success) {
            toast.success('Report submitted. Thank you for keeping our community safe!')
        } else {
            toast.error(res.error || 'Failed to submit report')
        }
    }

    const regionFlag = person.region === 'Macau' ? '🇲🇴'
        : person.region === 'Mainland' ? '🇨🇳'
            : person.region === 'Other' ? '🌍'
                : '🇭🇰'

    const map = { '30_70': [30, 70], '50_50': [50, 50], '70_30': [70, 30] }
    const [fun, ben] = map[person.balance] || [50, 50]

    const handleTranslate = async () => {
        if (translated) { setTranslated(false); return }
        // Use DB translations first
        if (person.about_zh || person.gives_zh || person.wants_zh) {
            setTranslatedData({
                about: person.about_zh || person.about,
                gives: person.gives_zh || person.gives,
                wants: person.wants_zh || person.wants,
            })
            setTranslated(true)
            return
        }
        if (translatedData) { setTranslated(true); return }
        setTranslating(true)
        try {
            const result = await translateProfile(person, targetLang)
            if (result) {
                setTranslatedData({
                    about: result.about,
                    gives: result.gives,
                    wants: result.wants,
                })
                setTranslated(true)
            } else {
                toast.error(t('toast_translate_failed', 'Translation failed'))
            }
        } catch {
            toast.error(t('toast_translate_failed', 'Translation failed'))
        } finally {
            setTranslating(false)
        }
    }

    const display = translated && translatedData
        ? translatedData
        : (targetLang === 'zh' && (person.about_zh || person.gives_zh || person.wants_zh))
            ? { about: person.about_zh || person.about, gives: person.gives_zh || person.gives, wants: person.wants_zh || person.wants }
            : { about: person.about, gives: person.gives, wants: person.wants }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 200,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--app-card)',
                    borderRadius: '24px 24px 0 0',
                    width: '100%',
                    maxWidth: 520,
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingBottom: 40,
                    animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
            >
                {/* Hero photo with Swiper */}
                <div style={{ position: 'relative', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
                    {allPhotos.length > 0 ? (
                        <Swiper
                            modules={[Pagination, Navigation]}
                            pagination={{ clickable: true }}
                            navigation
                            style={{ height: 320 }}
                        >
                            {allPhotos.map((photo, i) => (
                                <SwiperSlide key={i}>
                                    <img
                                        src={photo}
                                        alt=""
                                        style={{
                                            width: '100%',
                                            height: 320,
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    ) : (
                        <div style={{
                            width: '100%', height: 320,
                            backgroundColor: 'rgba(120,120,128,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: 72 }}>👤</span>
                        </div>
                    )}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
                        pointerEvents: 'none', zIndex: 10,
                    }} />
                    <button onClick={onClose} style={{
                        position: 'absolute', top: 16, right: 16, zIndex: 20,
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)', border: 'none',
                        color: '#fff', fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'inherit',
                    }}>✕</button>
                    {/* Report/Block menu */}
                    <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
                        <button
                            onClick={() => setShowReportMenu(v => !v)}
                            style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(10px)',
                                border: 'none',
                                color: '#fff', fontSize: 18, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                transform: showReportMenu ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}
                        >⋯</button>
                        {showReportMenu && (
                            <>
                                {/* Backdrop */}
                                <div
                                    onClick={() => setShowReportMenu(false)}
                                    style={{
                                        position: 'fixed',
                                        inset: 0,
                                        zIndex: 25,
                                    }}
                                />
                                {/* Menu */}
                                <div style={{
                                    position: 'absolute', top: 42, left: 0, zIndex: 30,
                                    background: 'var(--app-card)',
                                    borderRadius: 16,
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                                    border: '0.5px solid var(--app-border)',
                                    overflow: 'hidden',
                                    minWidth: 200,
                                    animation: 'menuSlideIn 0.2s cubic-bezier(0.4,0,0.2,1)',
                                }}>
                                    <div style={{
                                        padding: '10px 16px',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: 'var(--app-hint)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        borderBottom: '0.5px solid var(--app-border)',
                                    }}>Report Issue</div>
                                    {[
                                        { reason: 'Spam', icon: '📧', color: '#ff9500' },
                                        { reason: 'Inappropriate', icon: '⚠️', color: '#ff9500' },
                                        { reason: 'Fake profile', icon: '🎭', color: '#ff9500' },
                                        { reason: 'Harassment', icon: '🚨', color: '#ff3b30' },
                                    ].map(({ reason, icon, color }) => (
                                        <button key={reason} onClick={() => handleReport(reason)} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: color,
                                            fontFamily: 'inherit',
                                            textAlign: 'left',
                                            borderBottom: '0.5px solid rgba(0,0,0,0.05)',
                                            transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <span style={{ fontSize: 16 }}>{icon}</span>
                                            <span>Report: {reason}</span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setShowReportMenu(false)
                                            setShowBlockConfirm(true)
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#ff3b30',
                                            fontFamily: 'inherit',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.05)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <span style={{ fontSize: 16 }}>🚫</span>
                                        <span>Block User</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ padding: '20px 20px 0' }}>
                    {/* Name + geo */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--app-text)', letterSpacing: -0.5, marginBottom: 4 }}>
                            {person.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, color: 'var(--app-hint)' }}>
                                {regionFlag} {person.city ? `${person.city}, ` : ''}{person.region}
                            </span>
                            {langs.map(l => (
                                <span key={l} style={{
                                    background: 'rgba(0,0,0,0.04)',
                                    padding: '2px 7px', borderRadius: 6,
                                    fontSize: 11, fontWeight: 600, color: '#555',
                                }}>{l}</span>
                            ))}
                        </div>
                    </div>

                    {/* AI Tags */}
                    {tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                            {tags.map((tag, i) => (
                                <span key={i} style={{
                                    fontSize: 12, fontWeight: 600,
                                    background: 'rgba(0,122,255,0.1)',
                                    color: 'var(--app-primary)',
                                    padding: '4px 10px', borderRadius: 10,
                                }}>{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* About / Gives / Wants */}
                    {display.about && <SheetSection label="About Me" text={display.about} borderColor="rgba(0,122,255,0.25)" />}
                    {display.gives && <SheetSection label="Can Give" text={display.gives} borderColor="rgba(52,199,89,0.25)" />}
                    {display.wants && <SheetSection label="Wants to Get" text={display.wants} borderColor="rgba(255,149,0,0.25)" />}

                    {/* Translate button */}
                    {(person.about || person.gives || person.wants) && (
                        <button onClick={handleTranslate} disabled={translating} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, color: 'var(--app-primary)',
                            fontFamily: 'inherit', padding: '0 0 16px',
                            opacity: translating ? 0.5 : 1,
                        }}>
                            {translating ? '...' : translated ? '🔤 Show original' : '🌐 Translate'}
                        </button>
                    )}

                    {/* Balance */}
                    {person.balance && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-hint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                                Meeting Balance
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--app-text)', marginBottom: 8 }}>
                                <span>{fun}% Fun</span>
                                <span>{ben}% Benefits</span>
                            </div>
                            <div style={{ width: '100%', height: 6, background: 'rgba(120,120,128,0.12)', borderRadius: 3, position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${fun}%`, background: '#ff9500', borderRadius: 3 }} />
                                <div style={{ position: 'absolute', left: `${fun}%`, top: 0, height: '100%', width: `${ben}%`, background: 'var(--app-primary)', borderRadius: 3 }} />
                            </div>
                        </div>
                    )}

                    {/* Interest button */}
                    <button onClick={onLike} style={{
                        width: '100%', padding: '16px 0', borderRadius: 16,
                        border: 'none', cursor: 'pointer',
                        background: liked ? 'rgba(255,59,48,0.08)' : 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                        color: liked ? '#ff3b30' : '#fff',
                        fontSize: 17, fontWeight: 700, fontFamily: 'inherit',
                        boxShadow: liked ? 'none' : '0 6px 16px rgba(0,122,255,0.2)',
                        transition: 'all 0.2s',
                    }}>
                        {liked ? '✕ Cancel Request' : '🤍 Send Interest'}
                    </button>
                </div>
            </div>

            {/* Block Confirmation Dialog */}
            {showBlockConfirm && (
                <div
                    onClick={() => setShowBlockConfirm(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        animation: 'fadeIn 0.2s',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--app-card)',
                            borderRadius: 20,
                            padding: '28px 24px',
                            maxWidth: 340,
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            animation: 'scaleIn 0.2s cubic-bezier(0.4,0,0.2,1)',
                        }}
                    >
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'rgba(255,59,48,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            margin: '0 auto 16px',
                        }}>🚫</div>

                        <div style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: 'var(--app-text)',
                            textAlign: 'center',
                            marginBottom: 8,
                            letterSpacing: -0.3,
                        }}>Block {person.name}?</div>

                        <div style={{
                            fontSize: 14,
                            color: 'var(--app-hint)',
                            textAlign: 'center',
                            lineHeight: 1.5,
                            marginBottom: 24,
                        }}>
                            They won't be able to see your profile or contact you. You can unblock them later from settings.
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setShowBlockConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '14px 0',
                                    borderRadius: 14,
                                    border: 'none',
                                    background: 'rgba(120,120,128,0.1)',
                                    color: 'var(--app-text)',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(120,120,128,0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(120,120,128,0.1)'}
                            >Cancel</button>

                            <button
                                onClick={handleBlock}
                                disabled={blocking}
                                style={{
                                    flex: 1,
                                    padding: '14px 0',
                                    borderRadius: 14,
                                    border: 'none',
                                    background: blocking ? 'rgba(255,59,48,0.5)' : '#ff3b30',
                                    color: '#fff',
                                    fontSize: 16,
                                    fontWeight: 700,
                                    cursor: blocking ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                    opacity: blocking ? 0.6 : 1,
                                }}
                                onMouseEnter={e => !blocking && (e.currentTarget.style.background = '#e63329')}
                                onMouseLeave={e => !blocking && (e.currentTarget.style.background = '#ff3b30')}
                            >{blocking ? 'Blocking...' : 'Block'}</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes menuSlideIn {
                    from { 
                        opacity: 0;
                        transform: translateY(-8px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    )
}

function SheetSection({ label, text, borderColor }) {
    const [expanded, setExpanded] = useState(false)
    const isLong = text.length > 150
    return (
        <div style={{ marginBottom: 18, paddingLeft: 12, borderLeft: `2px solid ${borderColor}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-hint)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                {label}
            </div>
            <div style={{
                fontSize: 14, lineHeight: 1.5, color: 'var(--app-text)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: expanded ? 'unset' : 3,
                WebkitBoxOrient: 'vertical',
            }}>
                {text}
            </div>
            {isLong && (
                <button onClick={() => setExpanded(e => !e)} style={{
                    background: 'none', border: 'none', padding: '4px 0 0',
                    fontSize: 12, fontWeight: 700, color: 'var(--app-primary)',
                    cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    {expanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </div>
    )
}
