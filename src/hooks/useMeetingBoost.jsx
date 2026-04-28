import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import { getMeetingHistory, getPeople, supabase } from '@/lib/supabaseClient'
import { calcMatchScoresBatch } from '@/lib/aiUtils'
import toast from 'react-hot-toast'

// Cache the AI prompt from DB (refreshed once per session)
let _cachedAiPrompt = null
const getAiPrompt = async () => {
    if (_cachedAiPrompt !== null) return _cachedAiPrompt
    const { data } = await supabase
        .from('app_settings')
        .select('ai_matching_prompt')
        .eq('id', 1)
        .single()
    _cachedAiPrompt = data?.ai_matching_prompt || ''
    return _cachedAiPrompt
}

export function useMeetingBoost({ history, setHistory, searchFilters, hasActiveFilters, onBuyCredits, onMatchFound }) {
    const { user, subscription, setSubscription, profile } = useApp()
    const { t } = useTranslation()
    const [boosting, setBoosting] = useState(false)

    const hasCredits = (subscription.credits ?? 0) > 0

    // Profile completeness check
    const isProfileComplete = !!(profile.about?.trim() && profile.gives?.trim() && profile.wants?.trim() && profile.avatar)

    const handleBoost = async () => {
        if (!user?.id) return
        if (!hasCredits) { onBuyCredits(); return }

        // Block if profile incomplete
        if (!isProfileComplete) {
            toast.error(t('toast_profile_incomplete', 'Please complete your profile first (photo, about, gives, wants)'))
            return
        }

        setBoosting(true)
        try {
            let people = await getPeople(user.id)
            const matchedIds = new Set(history.map(m => m.partner?.id))

            // Only match with users who have complete profiles
            people = people.filter(p => p.about?.trim() && p.gives?.trim() && p.wants?.trim() && p.avatar_url)

            if (searchFilters.regions.length > 0) {
                people = people.filter(p => searchFilters.regions.includes(p.region))
            }

            const candidates = people.filter(p => !matchedIds.has(p.id))

            if (candidates.length === 0) {
                // NEW LOGIC: If no candidates match filters, suggest random person
                if (hasActiveFilters) {
                    toast((t) => (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                                {t('toast_no_filter_match', 'No people match your filters')}
                            </div>
                            <div style={{ fontSize: 13, marginBottom: 12, opacity: 0.9 }}>
                                {t('toast_suggest_random', 'We couldn\'t find a perfect match. Would you like to meet someone new anyway?')}
                            </div>
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id)
                                    // Retry without filters
                                    const allCandidates = people.filter(p => !matchedIds.has(p.id))
                                    if (allCandidates.length > 0) {
                                        matchWithCandidate(allCandidates)
                                    } else {
                                        toast.error(t('toast_no_candidates', 'No new people to match with yet!'))
                                    }
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #007aff, #5856d6)',
                                    color: '#fff', border: 'none', borderRadius: 12,
                                    padding: '10px 20px', fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'inherit'
                                }}
                            >
                                {t('yes_meet_someone', 'Yes, meet someone new!')}
                            </button>
                        </div>
                    ), { duration: 8000 })
                    return
                } else {
                    toast.error(t('toast_no_candidates', 'No new people to match with yet!'))
                    return
                }
            }

            await matchWithCandidate(candidates)
        } catch {
            toast.error(t('toast_generic_error', 'Something went wrong. Try again.'))
        } finally {
            setBoosting(false)
        }
    }

    const matchWithCandidate = async (candidates) => {
        const myProfile = {
            gives: profile.gives || '',
            wants: profile.wants || '',
            about: profile.about || '',
        }

        let partner
        try {
            if (myProfile.gives || myProfile.wants || searchFilters.prompt?.trim()) {
                const systemPrompt = await getAiPrompt()
                const rawScores = await calcMatchScoresBatch(
                    myProfile,
                    candidates,
                    searchFilters.prompt?.trim() || '',
                    systemPrompt
                )
                const scores = Array.isArray(rawScores) && rawScores.length > 0 ? rawScores : null
                if (scores) {
                    const bestIdx = scores.indexOf(Math.max(...scores))
                    partner = candidates[bestIdx] || candidates[0]
                } else {
                    partner = candidates[0]
                }
            } else {
                partner = candidates[0]
            }
        } catch {
            partner = candidates[0]
        }

        if (!partner) {
            toast.error(t('toast_no_match', 'No match found. Try again.'))
            return
        }

        // Create match atomically — deduct credit only for NEW matches
        const u1 = user.id < partner.id ? user.id : partner.id
        const u2 = user.id < partner.id ? partner.id : user.id
        const { data: existing } = await supabase.from('matches')
            .select('id').eq('user1_id', u1).eq('user2_id', u2).maybeSingle()

        if (!existing) {
            // Use atomic RPC: inserts match AND decrements credit in one transaction
            const { error: boostError } = await supabase.rpc('create_boost_match', {
                p_user_id: user.id,
                p_partner_id: partner.id,
            })
            if (boostError) {
                if (boostError.message?.includes('insufficient_credits')) {
                    onBuyCredits()
                    return
                }
                throw boostError
            }
            const newCredits = Math.max(0, (subscription.credits ?? 1) - 1)
            const newStatus = newCredits === 0 ? 'empty' : (subscription.status === 'trial' ? 'trial' : 'active')
            setSubscription(s => ({ ...s, credits: newCredits, status: newStatus }))
        }

        const updated = await getMeetingHistory(user.id)
        setHistory(updated)

        toast.success(`🎉 ${t('toast_match_found', 'Match found')}: ${partner.name}!`, {
            duration: 4000,
            style: {
                background: 'linear-gradient(135deg, #007aff, #5856d6)',
                color: '#fff', borderRadius: 20, fontWeight: 700,
                fontSize: 15, padding: '14px 24px',
            },
        })
        onMatchFound()
    }

    return { boosting, hasCredits, handleBoost }
}
