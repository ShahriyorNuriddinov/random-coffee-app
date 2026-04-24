import { useState, useEffect } from 'react'
import { useApp } from '@/store/useAppStore'
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
import { getMeetingHistory, getPeople, supabase } from '@/lib/supabaseClient'
import { calcMatchScoresBatch } from '@/lib/aiUtils'
import toast from 'react-hot-toast'

export default function MeetingsScreen() {
    const { user, subscription, setSubscription, setScreen, profile } = useApp()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [boosting, setBoosting] = useState(false)
    const [searchFilters, setSearchFilters] = useState({ regions: [], langs: [], prompt: '' })
    const hasActiveFilters = searchFilters.regions.length > 0 || searchFilters.langs.length > 0 || !!searchFilters.prompt.trim()

    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackMatchId, setFeedbackMatchId] = useState(null)
    const [showBuyCredits, setShowBuyCredits] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showBoostModal, setShowBoostModal] = useState(false)

    useEffect(() => {
        if (!user?.id) { setLoading(false); return }
        getMeetingHistory(user.id).then(data => {
            setHistory(data)
            setLoading(false)
        })
    }, [user?.id])

    const hasCredits = subscription.status === 'trial' || (subscription.credits ?? 0) > 0


    const handleBoost = async () => {
        if (!user?.id) return
        if (!hasCredits) { setShowBuyCredits(true); return }

        setBoosting(true)
        try {
            let people = await getPeople(user.id)
            const matchedIds = new Set(history.map(m => m.partner?.id))

            // Apply search filters
            if (searchFilters.regions.length > 0) {
                people = people.filter(p => searchFilters.regions.includes(p.region))
            }
            if (searchFilters.langs.length > 0) {
                people = people.filter(p =>
                    Array.isArray(p.languages) && p.languages.some(l => searchFilters.langs.includes(l))
                )
            }

            const candidates = people.filter(p => !matchedIds.has(p.id))

            if (candidates.length === 0) {
                toast.error(hasActiveFilters
                    ? 'No people match your filters. Try changing Search Settings.'
                    : 'No new people to match with yet!')
                setBoosting(false)
                return
            }

            // AI picks the best match based on gives↔wants compatibility
            const myProfile = {
                gives: profile.gives || '',
                wants: profile.wants || '',
                about: profile.about || '',
            }

            let partner
            if (myProfile.gives || myProfile.wants) {
                const scores = await calcMatchScoresBatch(myProfile, candidates)
                const bestIdx = scores.indexOf(Math.max(...scores))
                partner = candidates[bestIdx]
                console.log(`[Boost] AI picked: ${partner.name} (score: ${scores[bestIdx]})`)
            } else {
                // No profile data — pick first candidate
                partner = candidates[0]
            }

            // Create match in DB
            const u1 = user.id < partner.id ? user.id : partner.id
            const u2 = user.id < partner.id ? partner.id : user.id
            await supabase.from('matches')
                .insert({ user1_id: u1, user2_id: u2 })
                .select()

            // Deduct 1 credit (not for trial)
            if (subscription.status !== 'trial') {
                const newCredits = Math.max(0, (subscription.credits || 0) - 1)
                const newStatus = newCredits === 0 ? 'empty' : 'active'
                setSubscription(s => ({ ...s, credits: newCredits, status: newStatus }))
                await supabase.from('profiles').update({
                    coffee_credits: newCredits,
                    subscription_status: newStatus,
                }).eq('id', user.id)
            }

            // Reload history
            const updated = await getMeetingHistory(user.id)
            setHistory(updated)

            toast.success(`🎉 Match found: ${partner.name}!`, {
                duration: 4000,
                style: {
                    background: 'linear-gradient(135deg, #007aff, #5856d6)',
                    color: '#fff', borderRadius: 20, fontWeight: 700,
                    fontSize: 15, padding: '14px 24px',
                },
            })
            setShowBoostModal(true)
        } catch (e) {
            console.error(e)
            toast.error('Something went wrong. Try again.')
        } finally {
            setBoosting(false)
        }
    }

    return (
        <div className="app-screen">
            <ScreenHeader
                title="Meetings"
                right={
                    <button
                        onClick={() => setShowSettings(true)}
                        style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: hasActiveFilters ? 'rgba(0,122,255,0.1)' : 'rgba(120,120,128,0.06)',
                            border: hasActiveFilters ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={hasActiveFilters ? 'var(--app-primary)' : '#555'}>
                            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.97 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.12L14.47,2.45C14.43,2.22 14.24,2.05 14,2.05H10C9.76,2.05 9.57,2.22 9.53,2.45L9.14,5.12C8.53,5.34 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.97 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.95C7.96,18.34 8.53,18.66 9.14,18.88L9.53,21.55C9.57,21.78 9.76,21.95 10,21.95H10C10.24,21.95 10.43,21.78 10.47,21.55L10.86,18.88C11.47,18.66 12.04,18.34 12.56,17.95L15.05,18.95C15.27,19.03 15.54,18.95 15.66,18.73L17.66,15.27C17.78,15.05 17.73,14.78 17.54,14.63L19.43,12.97Z" />
                        </svg>
                        {hasActiveFilters && (
                            <div style={{
                                position: 'absolute', top: -1, right: -1,
                                width: 8, height: 8, borderRadius: '50%',
                                background: 'var(--app-primary)',
                                border: '1.5px solid var(--app-card)',
                            }} />
                        )}
                    </button>
                }
            />

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>

                    {loading && <Skeleton />}

                    {/* Profile incomplete warning */}
                    {!loading && (!profile.gives || !profile.wants || !profile.about) && (
                        <div style={{
                            background: 'rgba(255,149,0,0.08)',
                            border: '1px solid rgba(255,149,0,0.25)',
                            borderRadius: 14, padding: '12px 16px',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                        }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#ff9500', marginBottom: 4 }}>
                                    Complete your profile for better matches
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.4 }}>
                                    Fill in "Can Give" and "Wants to Get" so AI can find the most relevant people for you.
                                </div>
                                <button
                                    onClick={() => setScreen('profile-edit')}
                                    style={{
                                        marginTop: 8, background: '#ff9500', color: '#fff',
                                        border: 'none', borderRadius: 10, padding: '7px 14px',
                                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                >
                                    Edit Profile →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Searching / No Credits */}
                    {!loading && (
                        hasCredits
                            ? <SearchingBlock
                                onPeople={() => setScreen('people')}
                                onBoost={handleBoost}
                                boosting={boosting}
                                filters={searchFilters}
                            />
                            : <NoCreditsBlock onTopUp={() => setShowBuyCredits(true)} />
                    )}

                    {/* Current matches from DB */}
                    {!loading && history.length > 0 && history.map(m => (
                        <MatchCard
                            key={m.matchId}
                            match={m}
                            onPost={() => setScreen('moments')}
                            onFeedback={() => { setFeedbackMatchId(m.matchId); setShowFeedback(true) }}
                        />
                    ))}

                    {/* PREVIOUS MEETINGS */}
                    {!loading && history.length > 0 && (
                        <>
                            <div style={{
                                fontSize: 13, fontWeight: 700, color: 'var(--app-hint)',
                                padding: '0 4px', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8,
                            }}>
                                Previous Meetings
                            </div>
                            <div style={{
                                background: 'var(--app-card)', borderRadius: 20,
                                padding: '10px 16px', border: '0.5px solid var(--app-border)',
                            }}>
                                {history.map(m => (
                                    <HistoryItem
                                        key={m.matchId}
                                        match={m}
                                        onPost={() => setScreen('moments')}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showFeedback && <FeedbackModal matchId={feedbackMatchId} onClose={() => setShowFeedback(false)} onPost={() => setScreen('moments')} />}
            {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}
            {showBoostModal && <BoostModal onClose={() => setShowBoostModal(false)} />}
            {showSettings && <SearchSettingsModal
                filters={searchFilters}
                onApply={setSearchFilters}
                onClose={() => setShowSettings(false)}
            />}

            <BottomNav active="meetings" />
            <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

function Skeleton() {
    return (
        <>
            {[1, 2].map(i => (
                <div key={i} style={{
                    height: 120, borderRadius: 20,
                    background: 'var(--app-card)',
                    border: '0.5px solid var(--app-border)',
                    opacity: 1 - i * 0.3,
                }} />
            ))}
        </>
    )
}
