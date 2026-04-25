import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import MomentCard from '@/components/moments/MomentCard'
import NewMomentModal from '@/components/moments/NewMomentModal'
import { getMoments, getUserMomentReaction, getMeetingHistory, supabase } from '@/lib/supabaseClient'
import { translateText } from '@/lib/aiUtils'
export default function MomentsScreen() {
    const { t, i18n } = useTranslation()
    const { user } = useApp()
    const [moments, setMoments] = useState([])
    const [displayMoments, setDisplayMoments] = useState([])
    const [userReactions, setUserReactions] = useState({})
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)
    const [hasMeetings, setHasMeetings] = useState(false)
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
        const userR = {}
        const updatedMoments = [...momentList]
        for (let i = 0; i < momentList.length; i++) {
            const m = momentList[i]
            const { data: likes } = await supabase
                .from('moment_likes')
                .select('emoji')
                .eq('moment_id', m.id)
            const counts = {}
            if (likes) likes.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1 })
            updatedMoments[i] = { ...m, reactions: counts }
            const { data: myLike } = await supabase
                .from('moment_likes')
                .select('emoji')
                .eq('user_id', user.id)
                .eq('moment_id', m.id)
                .maybeSingle()
            if (myLike?.emoji) userR[m.id] = myLike.emoji
        }
        momentsRef.current = updatedMoments
        setMoments(updatedMoments)
        setUserReactions(userR)
    }

    useEffect(() => {
        load()
        // Check if user has any COMPLETED meetings
        if (user?.id) {
            getMeetingHistory(user.id).then(h => setHasMeetings(h.some(m => m.status === 'completed')))
        }

        // Realtime — update reactions without full reload
        const channel = supabase
            .channel('moment_likes_rt')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'moment_likes',
            }, () => {
                reloadReactions()
            })
            .subscribe()

        // Fallback polling every 15s in case realtime is not enabled on moment_likes
        const pollInterval = setInterval(() => reloadReactions(), 15000)

        return () => { supabase.removeChannel(channel); clearInterval(pollInterval) }
    }, [user?.id])

    const load = async () => {
        setLoading(true)
        const data = await getMoments()
        momentsRef.current = data
        setMoments(data)
        setDisplayMoments(data)

        if (user?.id) {
            const userR = {}
            for (const m of data) {
                const emoji = await getUserMomentReaction(user.id, m.id)
                if (emoji) userR[m.id] = emoji
            }
            setUserReactions(userR)
        }
        setLoading(false)
    }

    const handlePosted = (newMoment) => {
        const withReactions = { ...newMoment, reactions: {} }
        setMoments(prev => [withReactions, ...prev])
        setDisplayMoments(prev => [withReactions, ...prev])
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

            {/* No meeting hint modal */}
            {showNoMeetingHint && (
                <div onClick={() => setShowNoMeetingHint(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--app-card)', borderRadius: 20, padding: 28,
                        maxWidth: 360, width: '100%', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 10 }}>
                            Moments are for meetings
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 20 }}>
                            After each coffee meeting, you can share your experience here and earn +1 credit. Complete a meeting first!
                        </div>
                        <button onClick={() => setShowNoMeetingHint(false)} style={{
                            width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #007aff, #5856d6)',
                            color: '#fff', fontSize: 16, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>Got it</button>
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
