import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/store/useAppStore'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import MomentCard from '@/components/moments/MomentCard'
import NewMomentModal from '@/components/moments/NewMomentModal'
import { getMoments, getMeetingHistory, supabase } from '@/lib/supabaseClient'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 15

export default function MomentsScreen() {
    const { t, i18n } = useTranslation()
    const { user } = useApp()
    const queryClient = useQueryClient()
    const [userReactions, setUserReactions] = useState({})
    const [showNew, setShowNew] = useState(false)
    const [hasMeetings, setHasMeetings] = useState(true)
    const [showNoMeetingHint, setShowNoMeetingHint] = useState(false)
    const [blockedUserIds, setBlockedUserIds] = useState(new Set())
    const loaderRef = useRef(null)
    const channelRef = useRef(null)

    // ── Load blocked users ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!user?.id) return
        getBlockedUserIds(user.id).then(ids => setBlockedUserIds(new Set(ids)))
    }, [user?.id])

    // ── Infinite query ──────────────────────────────────────────────────────────
    const {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: ['moments', user?.id],
        queryFn: ({ pageParam = 0 }) => getMoments(PAGE_SIZE, user?.id, pageParam),
        getNextPageParam: (lastPage, allPages) =>
            lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
        enabled: !!user?.id,
        staleTime: 0,
    })

    const allMoments = data?.pages.flat() ?? []

    // Filter out moments from blocked users
    const filteredMoments = allMoments.filter(m => !blockedUserIds.has(m.author?.id))

    // ── Derived: display text by language ──────────────────────────────────────
    const lang = i18n.language
    const displayMoments = filteredMoments.map(m => ({
        ...m,
        text: lang === 'zh' ? (m.text_zh || m.text_en || m.text)
            : lang === 'ru' ? (m.text_ru || m.text_en || m.text)
                : (m.text_en || m.text),
    }))

    // ── Load reactions ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user?.id || !filteredMoments.length) return
        const ids = filteredMoments.map(m => m.id)
        supabase.from('moment_likes').select('moment_id,emoji,user_id').in('moment_id', ids)
            .then(({ data }) => {
                const userR = {}
                if (data) for (const r of data) {
                    if (r.user_id === user.id) userR[r.moment_id] = r.emoji
                }
                setUserReactions(userR)
            })
    }, [filteredMoments.length, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Meeting history check ───────────────────────────────────────────────────
    useEffect(() => {
        if (!user?.id) return

        getMeetingHistory(user.id)
            .then(h => {
                const hasCompleted = Array.isArray(h) && h.some(m => m.status === 'completed' || m.status == null)
                setHasMeetings(hasCompleted)
            })
            .catch((err) => {
                console.error('[MomentsScreen] Failed to load meeting history:', err)
                setHasMeetings(false)
            })
    }, [user?.id])

    // ── Realtime: invalidate on moments/likes change ────────────────────────────
    useEffect(() => {
        if (!user?.id) return
        const ch = supabase
            .channel('moments_rt_' + user.id)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'moments' }, () => {
                queryClient.invalidateQueries({ queryKey: ['moments', user.id] })
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'moment_likes' }, () => {
                queryClient.invalidateQueries({ queryKey: ['moments', user.id] })
            })
            .subscribe()
        channelRef.current = ch
        return () => { supabase.removeChannel(ch) }
    }, [user?.id, queryClient])

    // ── Intersection observer for infinite scroll ───────────────────────────────
    useEffect(() => {
        const el = loaderRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const handleReactionChange = (momentId, emoji) => {
        setUserReactions(prev => ({ ...prev, [momentId]: emoji }))
        queryClient.invalidateQueries({ queryKey: ['moments', user?.id] })
    }

    return (
        <div className="app-screen">
            <ScreenHeader
                title={t('nav_moments')}
                right={
                    <button
                        aria-label="New moment"
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
                        <span style={{ position: 'absolute', width: 14, height: 2, background: 'var(--app-primary)', borderRadius: 1 }} />
                        <span style={{ position: 'absolute', width: 2, height: 14, background: 'var(--app-primary)', borderRadius: 1 }} />
                    </button>
                }
            />

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                {isLoading && !filteredMoments.length ? (
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
                                    queryClient.setQueryData(['moments', user?.id], old => {
                                        if (!old) return old
                                        return {
                                            ...old,
                                            pages: old.pages.map(page => page.filter(p => p.id !== id)),
                                        }
                                    })
                                }}
                            />
                        ))}

                        {/* Infinite scroll trigger */}
                        <div ref={loaderRef} style={{ height: 1 }} />

                        {isFetchingNextPage && (
                            <div className="flex flex-col gap-4 pb-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card p-4 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="size-10 rounded-full" />
                                            <div className="flex flex-col gap-2 flex-1">
                                                <Skeleton className="h-3.5 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-3.5 w-full" />
                                        <Skeleton className="h-3.5 w-3/4" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!hasNextPage && filteredMoments.length > 0 && (
                            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--app-hint)', padding: '8px 0 16px' }}>
                                {lang === 'zh' ? '没有更多了' : lang === 'ru' ? 'Больше нет' : 'No more posts'}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {showNew && (
                <NewMomentModal
                    onClose={() => setShowNew(false)}
                    onPosted={() => queryClient.invalidateQueries({ queryKey: ['moments', user?.id] })}
                />
            )}

            {showNoMeetingHint && (
                <div onClick={() => setShowNoMeetingHint(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--app-card)', borderRadius: 24, padding: '28px 24px',
                        maxWidth: 360, width: '100%', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--app-text)', marginBottom: 10 }}>Share Your Story</div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 20 }}>
                            After every successful coffee meeting, you can write a review post and earn <strong>+1 coffee cup</strong>!
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
        <div className="screen-content flex flex-col gap-5 pt-5">
            {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card p-4 flex flex-col gap-3" style={{ opacity: 1 - i * 0.2 }}>
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex flex-col gap-2 flex-1">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-3/4" />
                </div>
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
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--app-text)', marginBottom: 8 }}>No moments yet</div>
            <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, maxWidth: 260, marginBottom: 24 }}>
                Share your coffee meeting experience and earn +1 credit!
            </div>
            <button onClick={onNew} className="btn-gradient" style={{ borderRadius: 14, maxWidth: 200 }}>
                Share a Moment
            </button>
        </div>
    )
}
