// ─── PersonProfileSheet — bottom sheet modal ─────────────────────────────────

import { useState, useMemo, useEffect } from 'react'
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
import { useQueryClient } from '@tanstack/react-query'

export default function PersonProfileSheet({ person, liked, matched, onLike, onClose }) {
    const { t, i18n } = useTranslation()
    const { user } = useApp()
    const queryClient = useQueryClient()
    const targetLang = useMemo(() => {
        return i18n.language === 'zh' ? 'zh' : i18n.language === 'ru' ? 'ru' : 'en'
    }, [i18n.language])
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

    // Reset translation state when language changes
    useEffect(() => {
        setTranslated(false)
        setTranslatedData(null)
    }, [i18n.language, person.id])

    const handleBlock = async () => {
        if (!user?.id) return
        setShowBlockConfirm(false)
        setShowReportMenu(false)
        setBlocking(true)
        const res = await blockUser(user.id, person.id)
        setBlocking(false)
        if (res.success) {
            toast.success(t('toast_user_blocked'))
            // Invalidate queries to refresh lists
            queryClient.invalidateQueries({ queryKey: ['people'] })
            queryClient.invalidateQueries({ queryKey: ['meeting-history'] })
            queryClient.invalidateQueries({ queryKey: ['moments'] })
            setTimeout(() => onClose(), 500)
        } else {
            // Check if it's a duplicate block error
            if (res.error && res.error.includes('unique_block')) {
                toast(t('toast_already_blocked'), {
                    icon: 'ℹ️',
                    duration: 3000,
                })
            } else {
                toast.error(t('toast_block_failed'))
            }
        }
    }

    const handleReport = async (reason) => {
        if (!user?.id) return
        setShowReportMenu(false)
        const res = await reportUser(user.id, person.id, reason)
        if (res.success) {
            toast.success(t('toast_report_sent'), {
                duration: 3000,
            })
        } else {
            // Check if it's a duplicate report error
            if (res.error && res.error.includes('unique_report')) {
                toast(t('toast_already_reported'), {
                    icon: 'ℹ️',
                    duration: 3000,
                })
            } else {
                toast.error(t('toast_report_failed'))
            }
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
        // Use DB translations first based on target language
        if (targetLang === 'zh' && (person.about_zh || person.gives_zh || person.wants_zh)) {
            setTranslatedData({
                about: person.about_zh || person.about,
                gives: person.gives_zh || person.gives,
                wants: person.wants_zh || person.wants,
            })
            setTranslated(true)
            return
        }
        if (targetLang === 'ru' && (person.about_ru || person.gives_ru || person.wants_ru)) {
            setTranslatedData({
                about: person.about_ru || person.about,
                gives: person.gives_ru || person.gives,
                wants: person.wants_ru || person.wants,
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

    const display = useMemo(() => {
        if (translated && translatedData) {
            return translatedData
        }
        if (targetLang === 'zh' && (person.about_zh || person.gives_zh || person.wants_zh)) {
            return {
                about: person.about_zh || person.about,
                gives: person.gives_zh || person.gives,
                wants: person.wants_zh || person.wants
            }
        }
        if (targetLang === 'ru' && (person.about_ru || person.gives_ru || person.wants_ru)) {
            return {
                about: person.about_ru || person.about,
                gives: person.gives_ru || person.gives,
                wants: person.wants_ru || person.wants
            }
        }
        return {
            about: person.about,
            gives: person.gives,
            wants: person.wants
        }
    }, [translated, translatedData, targetLang, person])

    // Get localized labels
    const labels = useMemo(() => {
        if (targetLang === 'zh') {
            return {
                aboutMe: '关于我',
                canGive: '能提供',
                wantsToGet: '想获得',
                meetingBalance: '会议平衡',
                fun: '娱乐',
                benefits: '效益',
                translate: '🌐 翻译',
                showOriginal: '🔤 显示原文',
                sendInterest: '🤍 发送兴趣',
                cancelRequest: '✕ 取消请求',
                itsAMatch: '✓ 匹配成功！',
                reportIssue: '举报问题',
                blockUser: '屏蔽用户',
                cancel: '取消',
                block: '屏蔽',
                blocking: '屏蔽中...',
                blockConfirmTitle: '屏蔽',
                blockConfirmText: '对方将无法看到您的个人资料或联系您。您可以稍后在设置中解除屏蔽。'
            }
        }
        if (targetLang === 'ru') {
            return {
                aboutMe: 'О себе',
                canGive: 'Могу дать',
                wantsToGet: 'Хочу получить',
                meetingBalance: 'Баланс встречи',
                fun: 'Развлечение',
                benefits: 'Польза',
                translate: '🌐 Перевести',
                showOriginal: '🔤 Показать оригинал',
                sendInterest: '🤍 Проявить интерес',
                cancelRequest: '✕ Отменить запрос',
                itsAMatch: '✓ Совпадение!',
                reportIssue: 'Пожаловаться',
                blockUser: 'Заблокировать',
                cancel: 'Отмена',
                block: 'Заблокировать',
                blocking: 'Блокировка...',
                blockConfirmTitle: 'Заблокировать',
                blockConfirmText: 'Они не смогут видеть ваш профиль или связаться с вами. Вы можете разблокировать их позже в настройках.'
            }
        }
        return {
            aboutMe: 'About Me',
            canGive: 'Can Give',
            wantsToGet: 'Wants to Get',
            meetingBalance: 'Meeting Balance',
            fun: 'Fun',
            benefits: 'Benefits',
            translate: '🌐 Translate',
            showOriginal: '🔤 Show original',
            sendInterest: '🤍 Send Interest',
            cancelRequest: '✕ Cancel Request',
            itsAMatch: '✓ It\'s a Match!',
            reportIssue: 'Report Issue',
            blockUser: 'Block User',
            cancel: 'Cancel',
            block: 'Block',
            blocking: 'Blocking...',
            blockConfirmTitle: 'Block',
            blockConfirmText: 'They won\'t be able to see your profile or contact you. You can unblock them later from settings.'
        }
    }, [targetLang])

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
                                        <span>{labels.blockUser}</span>
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
                    {display.about && <SheetSection label={labels.aboutMe} text={display.about} borderColor="rgba(0,122,255,0.25)" />}
                    {display.gives && <SheetSection label={labels.canGive} text={display.gives} borderColor="rgba(52,199,89,0.25)" />}
                    {display.wants && <SheetSection label={labels.wantsToGet} text={display.wants} borderColor="rgba(255,149,0,0.25)" />}

                    {/* Translate button */}
                    {(person.about || person.gives || person.wants) && (
                        <button onClick={handleTranslate} disabled={translating} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, color: 'var(--app-primary)',
                            fontFamily: 'inherit', padding: '0 0 16px',
                            opacity: translating ? 0.5 : 1,
                        }}>
                            {translating ? '...' : translated ? labels.showOriginal : labels.translate}
                        </button>
                    )}

                    {/* Balance */}
                    {person.balance && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-hint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                                {labels.meetingBalance}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--app-text)', marginBottom: 8 }}>
                                <span>{fun}% {labels.fun}</span>
                                <span>{ben}% {labels.benefits}</span>
                            </div>
                            <div style={{ width: '100%', height: 6, background: 'rgba(120,120,128,0.12)', borderRadius: 3, position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${fun}%`, background: '#ff9500', borderRadius: 3 }} />
                                <div style={{ position: 'absolute', left: `${fun}%`, top: 0, height: '100%', width: `${ben}%`, background: 'var(--app-primary)', borderRadius: 3 }} />
                            </div>
                        </div>
                    )}

                    {/* Interest button */}
                    <button onClick={onLike} disabled={matched} style={{
                        width: '100%', padding: '16px 0', borderRadius: 16,
                        border: 'none', cursor: matched ? 'not-allowed' : 'pointer',
                        background: matched
                            ? 'linear-gradient(135deg, #34c759 0%, #30d158 100%)'
                            : liked
                                ? 'rgba(255,59,48,0.08)'
                                : 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                        color: matched ? '#fff' : liked ? '#ff3b30' : '#fff',
                        fontSize: 17, fontWeight: 700, fontFamily: 'inherit',
                        boxShadow: matched || liked ? 'none' : '0 6px 16px rgba(0,122,255,0.2)',
                        transition: 'all 0.2s',
                        opacity: matched ? 0.9 : 1,
                    }}>
                        {matched ? labels.itsAMatch : liked ? labels.cancelRequest : labels.sendInterest}
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
                        }}>{labels.blockConfirmTitle} {person.name}?</div>

                        <div style={{
                            fontSize: 14,
                            color: 'var(--app-hint)',
                            textAlign: 'center',
                            lineHeight: 1.5,
                            marginBottom: 24,
                        }}>
                            {labels.blockConfirmText}
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
                            >{labels.cancel}</button>

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
                            >{blocking ? labels.blocking : labels.block}</button>
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
