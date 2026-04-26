import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import MomentCard from '@/components/moments/MomentCard'
import NewMomentModal from '@/components/moments/NewMomentModal'
import { getMoments, getUserMomentReaction, getUserMomentReactions, getMeetingHistory, supabase } from '@/lib/supabaseClient'
import { translateText } from '@/lib/aiUtils'
export default function MomentsScreen() {
    const { t, i18n } = useTranslation()
    const { user } = useApp()
    const [moments, setMoments] = useState([])
    const [displayMoments, setDisplayMoments] = useState([])
    const [userReactions, setUserReactions] = useState({})
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)
    const [hasMeetings, setHasMeetings] = useState(true) // default true, will be set false if no meetings
    const [showNoMeetingHint, setShowNoMeetingHint] = useState(false)
    const momentsRef = useRef([])

    // Auto-translate when language changes
    useEffect(() => {
        if (moments.length === 0) return
        if (i18n.language === 'zh') {
            translateMoments(moments)
        } else {
            setDisplayMoments(moments)
        }
    }, [i18n.language, moments.length])

    const translateMoments = async (list) => {
        // Use pre-saved DB translations first, only call AI for missing ones
        const needsAI = list.filter(m => !m.text_zh)
        if (needsAI.length === 0) {
            setDisplayMoments(list.map(m => ({ ...m, text: m.text_zh || m.text })))
            return
        }
        const cacheKey = `translated_moments_${list.map(m => m.id).join(',').slice(0, 80)}`
        try {
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) { setDisplayMoments(JSON.parse(cached)); return }
        } catch { }

        const translated = await Promise.all(list.map(async (m) => {
            if (m.text_zh) return { ...m, text: m.text_zh }
            const text = await translateText(m.text, 'zh')
            return { ...m, text: text || m.text }
        }))
        setDisplayMoments(translated)
        try { sessionStorage.setItem(cacheKey, JSON.stringify(translated)) } catch { }
    }

    const reloadReactions = async (data) => {
        const momentList = data || momentsRef.current
        if (!user?.id || !momentList || !Array.isArray(momentList) || momentList.length === 0) return

        const momentIds = momentList.map(m => m.id)
        const { data: allLikes } = await supabase
            .from('moment_likes')
            .select('moment_id, emoji, user_id')
            .in('moment_id', momentIds)

        const reactionCounts = {}
        const userR = {}
        if (allLikes) {
            for (const r of allLikes) {
                if (!reactionCounts[r.moment_id]) reactionCounts[r.moment_id] = {}
                reactionCounts[r.moment_id][r.emoji] = (reactionCounts[r.moment_id][r.emoji] || 0) + 1
                if (r.user_id === user.id) userR[r.moment_id] = r.emoji
            }
        }

        const updatedMoments = momentList.map(m => ({
            ...m,
            reactions: reactionCounts[m.id] || {},
        }))

        momentsRef.current = updatedMoments
        setMoments(updatedMoments)
        setUserReactions(userR)
    }

    useEffect(() => {
        load()
        // Check if user has any COMPLETED meetings (or old matches without status)
        if (user?.id) {
            getMeetingHistory(user.id).then(h => setHasMeetings(Array.isArray(h) && h.some(m => m.status === 'completed' || m.status == null))).catch(() => { })
        }

        // Realtime — reactions handled optimistically in MomentCard, no channel needed
        // Fallback polling every 30s for reaction sync
        const pollInterval = setInterval(() => reloadReactions(), 30000)

        return () => {
            clearInterval(pollInterval)
        }
    }, [user?.id])

    const load = async () => {
        setLoading(true)
        try {
            const data = await getMoments(undefined, user?.id)
            momentsRef.current = data
            setMoments(data)
            setDisplayMoments(data)

            if (user?.id && data.length > 0) {
                const userR = await getUserMomentReactions(user.id, data.map(m => m.id))
                setUserReactions(userR)
            }
        } catch (err) {
            console.error('[MomentsScreen] load error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handlePosted = (newMoment) => {
        // Don't show pending posts in feed — wait for admin approval
    }

    const handleReactionChange = (momentId, emoji) => {
        setUserReactions(prev => ({ ...prev, [momentId]: emoji }))
    }

    return (
        <div className="app-screen">
            <ScreenHeader
                title={t('nav_moments')}
                right={
                    /* Plus button — HTML: .plus-btn */
                    <button
                        onClick={() => {
                            if (!hasMeetings) { setShowNoMeetingHint(true); return }
                            setShowNew(true)
                        }}
                        style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(120,120,128,0.12)',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        <span style={{
                            position: 'absolute', width: 14, height: 2,
                            background: 'var(--app-primary)', borderRadius: 1,
                        }} />
                        <span style={{
                            position: 'absolute', width: 2, height: 14,
                            background: 'var(--app-primary)', borderRadius: 1,
                        }} />
                    </button>
                }
            />

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                {loading ? (
                    <LoadingSkeleton />
                ) : displayMoments.length === 0 ? (
                    <EmptyState onNew={() => setShowNew(true)} />
                ) : (
                    <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 20 }}>
                        {displayMoments.map(m => (
                            <MomentCard
                                key={m.id}
                                moment={m}
                                userReaction={userReactions[m.id] || null}
                                onReactionChange={(emoji) => handleReactionChange(m.id, emoji)}
                                onDeleted={(id) => {
                                    setMoments(prev => prev.filter(p => p.id !== id))
                                    setDisplayMoments(prev => prev.filter(p => p.id !== id))
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showNew && (
                <NewMomentModal
                    onClose={() => setShowNew(false)}
                    onPosted={handlePosted}
                />
            )}

            {/* No meeting hint modal — HTML style */}
            {showNoMeetingHint && (
                <div onClick={() => setShowNoMeetingHint(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--app-card)', borderRadius: 24, padding: '28px 24px',
                        maxWidth: 360, width: '100%', textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, #ffd700, #ffa500)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, margin: '0 auto 16px',
                            boxShadow: '0 4px 12px rgba(255,165,0,0.3)',
                        }}>🎁</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--app-text)', marginBottom: 10, letterSpacing: -0.3 }}>
                            Share Your Story
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16 }}>
                            After every successful coffee meeting you attend, you will have the opportunity to write a review post about it.
                        </div>
                        <div style={{
                            background: 'rgba(0,122,255,0.06)', borderRadius: 12,
                            padding: '12px 14px', marginBottom: 20,
                            border: '0.5px solid rgba(0,122,255,0.15)',
                            fontSize: 13, color: '#0055b3', lineHeight: 1.5, textAlign: 'left',
                        }}>
                            🎉 Your post will be published after passing moderation, and you will receive <strong>+1 coffee cup</strong> to your balance!
                        </div>
                        <button onClick={() => setShowNoMeetingHint(false)} className="btn-gradient" style={{ borderRadius: 14 }}>
                            Awesome
                        </button>
                    </div>
                </div>
            )}

            <BottomNav active="moments" />
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 20 }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    height: 140, borderRadius: 14,
                    background: 'var(--app-card)',
                    border: '0.5px solid var(--app-border)',
                    opacity: 1 - i * 0.2,
                }} />
            ))}
        </div>
    )
}

function EmptyState({ onNew }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 40, textAlign: 'center', marginTop: 80,
        }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--app-text)', marginBottom: 8 }}>
                No moments yet
            </div>
            <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, maxWidth: 260, marginBottom: 24 }}>
                Share your coffee meeting experience and earn +1 credit!
            </div>
            <button
                onClick={onNew}
                className="btn-gradient"
                style={{ borderRadius: 14, maxWidth: 200 }}
            >
                Share a Moment
            </button>
        </div>
    )
}
