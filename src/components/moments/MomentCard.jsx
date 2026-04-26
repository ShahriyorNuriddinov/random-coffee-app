import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import { supabase } from '@/lib/supabaseClient'
import { translateText } from '@/lib/aiUtils'
import i18n from '@/i18n'
import toast from 'react-hot-toast'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '🎉', '👏']

export default function MomentCard({ moment, userReaction, onReactionChange, onDeleted }) {
    const { user } = useApp()
    const { t } = useTranslation()

    // reactions from DB: moment.reactions = { '❤️': 5, '🔥': 2 }
    const [reactions, setReactions] = useState(moment.reactions || {})
    const [myReaction, setMyReaction] = useState(userReaction)
    const [showQuickMenu, setShowQuickMenu] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [doubleTapVisible, setDoubleTapVisible] = useState(false)
    const [deleted, setDeleted] = useState(false)
    const [translated, setTranslated] = useState(false)
    const [translatedText, setTranslatedText] = useState(null)
    const [translating, setTranslating] = useState(false)

    const hoverTimer = useRef(null)
    const leaveTimer = useRef(null)

    useEffect(() => {
        return () => {
            clearTimeout(hoverTimer.current)
            clearTimeout(leaveTimer.current)
        }
    }, [])

    const author = moment.author || {}
    const isOwn = user?.id && author.id === user.id
    const isOfficial = moment.is_admin_post === true || author.name === 'Random Coffee Team' || author.name === 'MaGollz Team'

    // Show translated text if available in DB, else fall back to AI translate on demand
    const currentLang = i18n.language // 'en' or 'zh'
    const dbTranslation = currentLang === 'zh' ? moment.text_zh : moment.text_en
    // If DB already has translation for current lang and it differs from original text, show it directly
    const autoTranslated = dbTranslation && dbTranslation !== moment.text ? dbTranslation : null

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const m = Math.floor(diff / 60000)
        if (m < 1) return 'just now'
        if (m < 60) return `${m}m ago`
        const h = Math.floor(m / 60)
        if (h < 24) return `${h}h ago`
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }

    const handleReaction = async (emoji) => {
        if (!user?.id) return
        setShowQuickMenu(false)

        const nextR = { ...reactions }

        // Remove old reaction
        if (myReaction && myReaction !== emoji) {
            nextR[myReaction] = Math.max(0, (nextR[myReaction] || 0) - 1)
            if (nextR[myReaction] === 0) delete nextR[myReaction]
            await supabase.from('moment_likes')
                .delete()
                .eq('user_id', user.id)
                .eq('moment_id', moment.id)
                .eq('emoji', myReaction)
        }

        // Toggle same emoji
        if (myReaction === emoji) {
            nextR[emoji] = Math.max(0, (nextR[emoji] || 0) - 1)
            if (nextR[emoji] === 0) delete nextR[emoji]
            setMyReaction(null)
            onReactionChange?.(null)
            await supabase.from('moment_likes')
                .delete()
                .eq('user_id', user.id)
                .eq('moment_id', moment.id)
                .eq('emoji', emoji)
        } else {
            // Add new emoji
            nextR[emoji] = (nextR[emoji] || 0) + 1
            setMyReaction(emoji)
            onReactionChange?.(emoji)
            await supabase.from('moment_likes')
                .insert({ user_id: user.id, moment_id: moment.id, emoji })
        }

        setReactions({ ...nextR })
    }

    const handleDoubleTap = () => {
        setDoubleTapVisible(true)
        setTimeout(() => setDoubleTapVisible(false), 800)
        if (myReaction !== '❤️') handleReaction('❤️')
    }

    const onFooterEnter = () => {
        clearTimeout(leaveTimer.current)
        hoverTimer.current = setTimeout(() => setShowQuickMenu(true), 150)
    }
    const onFooterLeave = () => {
        clearTimeout(hoverTimer.current)
        leaveTimer.current = setTimeout(() => setShowQuickMenu(false), 300)
    }
    const onPopupEnter = () => clearTimeout(leaveTimer.current)
    const onPopupLeave = () => {
        leaveTimer.current = setTimeout(() => setShowQuickMenu(false), 200)
    }

    const handleDelete = async () => {
        setShowMenu(false)
        const { error } = await supabase
            .from('moments').delete()
            .eq('id', moment.id).eq('user_id', user.id)
        if (error) {
            toast.error(t('toast_delete_failed', 'Failed to delete'))
        } else {
            // Only deduct credit if post was approved (credit was earned)
            if (moment.status === 'approved') {
                const { data: profile } = await supabase.from('profiles').select('coffee_credits').eq('id', user.id).single()
                if (profile) {
                    const newCredits = Math.max(0, (profile.coffee_credits ?? 0) - 1)
                    await supabase.from('profiles').update({ coffee_credits: newCredits }).eq('id', user.id)
                }
            }
            setDeleted(true)
            onDeleted?.(moment.id)
            toast.success(t('toast_post_deleted', 'Post deleted'))
        }
    }

    const handleTranslate = async () => {
        if (translated) { setTranslated(false); return }
        // Use pre-translated text from DB if available
        if (autoTranslated) { setTranslatedText(autoTranslated); setTranslated(true); return }
        if (translatedText) { setTranslated(true); return }
        setTranslating(true)
        try {
            const targetLang = currentLang === 'zh' ? 'en' : 'zh'
            const result = await translateText(moment.text, targetLang)
            if (result) {
                setTranslatedText(result)
                setTranslated(true)
            } else {
                toast.error(t('toast_translate_failed', 'Translation failed'))
            }
        } catch (e) {
            console.error('[translate]', e)
            toast.error(t('toast_translate_failed', 'Translation failed'))
        } finally {
            setTranslating(false)
        }
    }

    if (deleted) return null

    const reactionEntries = Object.entries(reactions).filter(([, c]) => c > 0)

    return (
        <div
            style={{
                background: 'var(--app-card)', borderRadius: 14,
                border: '0.5px solid var(--app-border)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                overflow: 'hidden', position: 'relative',
                userSelect: 'none', WebkitUserSelect: 'none',
            }}
            onDoubleClick={handleDoubleTap}
        >
            {doubleTapVisible && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    fontSize: 80, pointerEvents: 'none', zIndex: 5,
                    animation: 'dtAnim 0.8s forwards',
                }}>❤️</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        backgroundImage: author.avatar_url ? `url(${author.avatar_url})` : 'none',
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        backgroundColor: isOfficial ? 'var(--app-primary)' : 'rgba(120,120,128,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 18,
                    }}>
                        {!author.avatar_url && (isOfficial ? 'R' : '👤')}
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)' }}>{isOfficial ? 'Random Coffee Team' : (author.name || 'Unknown')}</div>
                        <div style={{ fontSize: 12, color: 'var(--app-hint)' }}>{timeAgo(moment.created_at)}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isOfficial && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            padding: '3px 6px', borderRadius: 5,
                            background: 'rgba(0,122,255,0.1)', color: 'var(--app-primary)',
                        }}>Official</span>
                    )}
                    {moment.status === 'pending' && isOwn && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            padding: '3px 8px', borderRadius: 5,
                            background: 'rgba(255,149,0,0.12)', color: '#ff9500',
                        }}>⏳ Pending</span>
                    )}
                </div>
            </div>

            {(moment.image_urls?.length > 0 || moment.image_url) && (() => {
                const allImgs = moment.image_urls?.length > 0
                    ? moment.image_urls
                    : [moment.image_url]
                return allImgs.length > 1 ? (
                    <div style={{ borderBottom: '0.5px solid var(--app-border)' }}>
                        <Swiper modules={[Pagination]} pagination={{ clickable: true }} style={{ maxHeight: 280 }}>
                            {allImgs.map((url, i) => (
                                <SwiperSlide key={i}>
                                    <img src={url} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                ) : (
                    <div style={{ width: '100%', maxHeight: 280, overflow: 'hidden', borderBottom: '0.5px solid var(--app-border)' }}>
                        <img src={allImgs[0]} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                )
            })()}

            <div style={{ padding: '12px 16px', fontSize: 15, lineHeight: 1.45, color: 'var(--app-text)' }}>
                {translated && translatedText ? translatedText : moment.text}
            </div>

            <div
                style={{
                    padding: '10px 16px', borderTop: '0.5px solid var(--app-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    position: 'relative',
                }}
                onMouseEnter={onFooterEnter}
                onMouseLeave={onFooterLeave}
            >
                {showQuickMenu && (
                    <div
                        style={{
                            position: 'absolute', bottom: '100%', left: 12, marginBottom: 6,
                            background: 'var(--app-card)', border: '0.5px solid var(--app-border)',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)', borderRadius: 30,
                            display: 'flex', gap: 2, padding: '6px 10px', zIndex: 30,
                            animation: 'qmIn 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
                        }}
                        onMouseEnter={onPopupEnter}
                        onMouseLeave={onPopupLeave}
                        onClick={e => e.stopPropagation()}
                    >
                        {QUICK_REACTIONS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                style={{
                                    background: myReaction === emoji ? 'rgba(0,122,255,0.12)' : 'none',
                                    border: myReaction === emoji ? '1.5px solid rgba(0,122,255,0.25)' : '1.5px solid transparent',
                                    borderRadius: 10, padding: '4px 6px',
                                    fontSize: 22, cursor: 'pointer', fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                    transform: myReaction === emoji ? 'scale(0.88)' : 'scale(1)',
                                }}
                            >{emoji}</button>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {reactionEntries.map(([emoji, count]) => (
                        <button
                            key={emoji}
                            onClick={(e) => { e.stopPropagation(); handleReaction(emoji) }}
                            style={{
                                background: myReaction === emoji ? 'rgba(0,122,255,0.15)' : 'rgba(0,0,0,0.05)',
                                padding: '4px 8px', borderRadius: 12, border: 'none',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                                color: myReaction === emoji ? 'var(--app-primary)' : 'var(--app-text)',
                                boxShadow: myReaction === emoji ? 'inset 0 0 0 1px rgba(0,122,255,0.2)' : 'none',
                                fontFamily: 'inherit', transition: 'all 0.2s',
                            }}
                        >
                            {emoji} <span>{count}</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); handleTranslate() }}
                    disabled={translating}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, color: 'var(--app-primary)',
                        fontFamily: 'inherit', padding: '4px 0',
                        opacity: translating ? 0.5 : 1, flexShrink: 0,
                    }}
                >
                    {translating ? '...' : translated ? 'Show original' : 'Translate'}
                </button>
            </div>

            <style>{`
                @keyframes dtAnim {
                    0%   { transform:translate(-50%,-50%) scale(0); opacity:0; }
                    30%  { transform:translate(-50%,-50%) scale(1.2); opacity:0.9; }
                    50%  { transform:translate(-50%,-50%) scale(1); opacity:1; }
                    100% { transform:translate(-50%,-50%) scale(0.8); opacity:0; }
                }
                @keyframes qmIn {
                    from { opacity:0; transform:scale(0.85) translateY(6px); }
                    to   { opacity:1; transform:scale(1) translateY(0); }
                }
            `}</style>
        </div>
    )
}
