import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/store/useAppStore'
import { Skeleton as SkeletonUI } from '@/components/ui/skeleton'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import MatchCard from '@/components/meetings/MatchCard'
import HistoryItem from '@/components/meetings/HistoryItem'
import SearchingBlock from '@/components/meetings/SearchingBlock'
import NoCreditsBlock from '@/components/meetings/NoCreditsBlock'
import FeedbackModal from '@/components/meetings/FeedbackModal'
import BuyCreditsModal from '@/components/meetings/BuyCreditsModal'
import SearchSettingsModal from '@/components/meetings/SearchSettingsModal'
import BoostModal from '@/components/meetings/BoostModal'
import NewMomentModal from '@/components/moments/NewMomentModal'
import { getMeetingHistory, getSubscription, getBlockedUserIds } from '@/lib/supabaseClient'
import { useMeetingBoost } from '@/hooks/useMeetingBoost'

export default function MeetingsScreen() {
    const { user, setScreen, profile, subscription: _sub, setSubscription } = useApp()
    const { t } = useTranslation()

    const queryClient = useQueryClient()

    const { data: history = [], isLoading: loading } = useQuery({
        queryKey: ['meeting-history', user?.id],
        queryFn: async () => {
            const [historyData, blockedIds] = await Promise.all([
                getMeetingHistory(user.id),
                getBlockedUserIds(user.id),
            ])
            const blockedSet = new Set(blockedIds)
            // Filter out matches with blocked users
            return historyData.filter(m => !blockedSet.has(m.partner?.id))
        },
        enabled: !!user?.id,
        staleTime: 30 * 1000,
    })

    // Sync history to local state for boost hook mutations
    const [historyLocal, setHistoryLocal] = useState([])
    useEffect(() => { setHistoryLocal(history) }, [history])
    const [searchFilters, setSearchFilters] = useState({ regions: [], langs: [], prompt: '' })
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackMatchId, setFeedbackMatchId] = useState(null)
    const [showBuyCredits, setShowBuyCredits] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showBoostModal, setShowBoostModal] = useState(false)
    const [showNewMoment, setShowNewMoment] = useState(false)
    const [currentMatchId, setCurrentMatchId] = useState(null)

    const hasActiveFilters = searchFilters.regions.length > 0 || searchFilters.langs.length > 0 || !!searchFilters.prompt.trim()

    const { boosting, hasCredits, handleBoost } = useMeetingBoost({
        history: historyLocal, setHistory: setHistoryLocal, searchFilters, hasActiveFilters,
        onBuyCredits: () => setShowBuyCredits(true),
        onMatchFound: () => setShowBoostModal(true),
    })

    // Reload subscription from DB on mount to get fresh credits
    useEffect(() => {
        if (!user?.id) return
        getSubscription(user.id)
            .then(data => {
                if (data) {
                    setSubscription({
                        status: data.subscription_status || 'trial',
                        credits: data.coffee_credits ?? 2,
                        start: data.subscription_start || null,
                        end: data.subscription_end || null
                    })
                }
            })
            .catch((err) => {
                console.error('[MeetingsScreen] Failed to load subscription:', err)
            })
    }, [user?.id, setSubscription])

    const handleFeedbackPost = () => {
        setShowFeedback(false)
        setCurrentMatchId(feedbackMatchId)
        setShowNewMoment(true)
        queryClient.invalidateQueries({ queryKey: ['meeting-history', user?.id] })
    }

    const handlePostFromHistory = (matchId) => {
        setCurrentMatchId(matchId)
        setShowNewMoment(true)
    }

    return (
        <div className="app-screen">
            <ScreenHeader
                title={t('meetings_title')}
                right={<SettingsButton active={hasActiveFilters} onClick={() => setShowSettings(true)} />}
            />

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>

                    {loading && <Skeleton />}

                    {!loading && (!profile.gives || !profile.wants || !profile.about) && (
                        <ProfileIncompleteWarning onEdit={() => setScreen('profile-edit')} />
                    )}

                    {!loading && (
                        hasCredits
                            ? <SearchingBlock onPeople={() => setScreen('people')} onBoost={handleBoost} boosting={boosting} filters={searchFilters} />
                            : <NoCreditsBlock onTopUp={() => setShowBuyCredits(true)} />
                    )}

                    {!loading && historyLocal.filter(m => m.status !== 'completed').map(m => (
                        <MatchCard
                            key={m.matchId}
                            match={m}
                            onFeedback={() => { setFeedbackMatchId(m.matchId); setShowFeedback(true) }}
                        />
                    ))}

                    {!loading && historyLocal.filter(m => m.status === 'completed').length > 0 && (
                        <PreviousMeetings
                            history={historyLocal.filter(m => m.status === 'completed')}
                            onPost={handlePostFromHistory}
                        />
                    )}
                </div>
            </div>

            {showFeedback && (
                <FeedbackModal
                    matchId={feedbackMatchId}
                    onClose={async () => { setShowFeedback(false); queryClient.invalidateQueries({ queryKey: ['meeting-history', user?.id] }) }}
                    onPost={handleFeedbackPost}
                />
            )}
            {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}
            {showBoostModal && <BoostModal onClose={() => setShowBoostModal(false)} />}
            {showSettings && <SearchSettingsModal filters={searchFilters} onApply={setSearchFilters} onClose={() => setShowSettings(false)} />}
            {showNewMoment && (
                <NewMomentModal
                    matchId={currentMatchId}
                    onClose={() => { setShowNewMoment(false); setCurrentMatchId(null) }}
                    onPosted={() => {
                        setShowNewMoment(false)
                        setCurrentMatchId(null)
                        queryClient.invalidateQueries({ queryKey: ['meeting-history', user?.id] })
                        setScreen('moments')
                    }}
                />
            )}

            <BottomNav active="meetings" />
            <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

function SettingsButton({ active, onClick }) {
    return (
        <button
            onClick={onClick}
            aria-label="Search settings"
            aria-pressed={active}
            style={{
                width: 34, height: 34, borderRadius: '50%',
                background: active ? 'rgba(0,122,255,0.1)' : 'rgba(120,120,128,0.06)',
                border: active ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'var(--app-primary)' : '#555'}>
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.97 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.12L14.47,2.45C14.43,2.22 14.24,2.05 14,2.05H10C9.76,2.05 9.57,2.22 9.53,2.45L9.14,5.12C8.53,5.34 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.97 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.95C7.96,18.34 8.53,18.66 9.14,18.88L9.53,21.55C9.57,21.78 9.76,21.95 10,21.95H10C10.24,21.95 10.43,21.78 10.47,21.55L10.86,18.88C11.47,18.66 12.04,18.34 12.56,17.95L15.05,18.95C15.27,19.03 15.54,18.95 15.66,18.73L17.66,15.27C17.78,15.05 17.73,14.78 17.54,14.63L19.43,12.97Z" />
            </svg>
            {active && <div style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: 'var(--app-primary)', border: '1.5px solid var(--app-card)' }} />}
        </button>
    )
}

function ProfileIncompleteWarning({ onEdit }) {
    const { t } = useTranslation()
    return (
        <div style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.25)', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#ff9500', marginBottom: 4 }}>{t('profile_incomplete')}</div>
                <div style={{ fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.4 }}>{t('profile_incomplete_hint')}</div>
                <button onClick={onEdit} style={{ marginTop: 8, background: '#ff9500', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('edit_profile_btn')}
                </button>
            </div>
        </div>
    )
}

function PreviousMeetings({ history, onPost }) {
    const { t } = useTranslation()
    return (
        <>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-hint)', padding: '0 4px', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 }}>
                {t('prev_meetings')}
            </div>
            <div style={{ background: 'var(--app-card)', borderRadius: 20, padding: '10px 16px', border: '0.5px solid var(--app-border)' }}>
                {history.map(m => <HistoryItem key={m.matchId} match={m} onPost={() => onPost(m.matchId)} />)}
            </div>
        </>
    )
}

function Skeleton() {
    return (
        <>
            {[1, 2].map(i => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3" style={{ opacity: 1 - i * 0.3 }}>
                    <div className="flex items-center gap-3">
                        <SkeletonUI className="size-12 rounded-full" />
                        <div className="flex flex-col gap-2 flex-1">
                            <SkeletonUI className="h-4 w-32" />
                            <SkeletonUI className="h-3 w-24" />
                        </div>
                    </div>
                    <SkeletonUI className="h-3 w-full" />
                    <SkeletonUI className="h-3 w-3/4" />
                </div>
            ))}
        </>
    )
}
