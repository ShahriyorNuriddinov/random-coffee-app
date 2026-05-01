import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import { getMeetingHistory, supabase } from '@/lib/supabaseClient'
import { calcMatchScoresBatch } from '@/lib/aiUtils'
import toast from 'react-hot-toast'

const sendDebugLog = (hypothesisId, location, message, data = {}, runId = 'pre-fix') => {
    // #region agent log
    fetch('http://127.0.0.1:7546/ingest/1915d07c-c702-44b3-b490-5edefe1507f0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7767a3' },
        body: JSON.stringify({
            sessionId: '7767a3',
            runId,
            hypothesisId,
            location,
            message,
            data,
            timestamp: Date.now(),
        }),
    }).catch(() => { })
    // #endregion
}

// Cache AI prompt once per session
let _cachedAiPrompt = null
const getAiPrompt = async () => {
    if (_cachedAiPrompt !== null) return _cachedAiPrompt
    const { data } = await supabase.from('app_settings').select('ai_matching_prompt').eq('id', 1).single()
    _cachedAiPrompt = data?.ai_matching_prompt || ''
    return _cachedAiPrompt
}

// Find best AI match from candidates based on profile similarity
const findBestCandidate = async (myProfile, candidates, customPrompt = '') => {
    if (!candidates.length) return null
    try {
        if (myProfile.gives || myProfile.wants || myProfile.about) {
            const systemPrompt = await getAiPrompt()
            sendDebugLog('H5', 'src/hooks/useMeetingBoost.jsx:findBestCandidate:beforeScoring', 'Before AI scoring', {
                candidatesCount: candidates.length,
                hasCustomPrompt: !!customPrompt?.trim(),
                hasSystemPrompt: !!systemPrompt?.trim(),
            })
            const scores = await calcMatchScoresBatch(myProfile, candidates, customPrompt, systemPrompt)
            if (Array.isArray(scores) && scores.length > 0) {
                const bestIdx = scores.indexOf(Math.max(...scores))
                sendDebugLog('H5', 'src/hooks/useMeetingBoost.jsx:findBestCandidate:afterScoring', 'After AI scoring', {
                    scoresCount: scores.length,
                    bestIdx,
                    bestScore: scores[bestIdx] ?? null,
                })
                return candidates[bestIdx] || candidates[0]
            }
        }
    } catch { }
    return candidates[0]
}

export function useMeetingBoost({ history, setHistory, searchFilters, onBuyCredits, onMatchFound }) {
    const { user, subscription, setSubscription, profile } = useApp()
    const { t } = useTranslation()
    const [boosting, setBoosting] = useState(false)
    const [boostActive, setBoostActive] = useState(false)
    const channelRef = useRef(null)

    const hasCredits = (subscription.credits ?? 0) > 0
    const isProfileComplete = !!(profile.about?.trim() && profile.gives?.trim() && profile.wants?.trim() && profile.avatar)
    sendDebugLog('H6', 'src/hooks/useMeetingBoost.jsx:hookRender', 'Boost hook rendered', {
        userIdExists: !!user?.id,
        hasCredits,
        isProfileComplete,
    })

    // On mount: sync boost_active state from DB
    useEffect(() => {
        if (!user?.id) return
        supabase.from('profiles').select('boost_active').eq('id', user.id).single()
            .then(({ data }) => {
                if (data?.boost_active) {
                    setBoostActive(true)
                    setBoosting(true)
                    subscribeToMatches()
                }
            })
            .catch(() => { })
    }, [user?.id])

    // Cleanup on unmount
    useEffect(() => {
        return () => { unsubscribeFromMatches() }
    }, [])

    const subscribeToMatches = () => {
        if (channelRef.current || !user?.id) return

        const channel = supabase
            .channel(`boost_wait_${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'matches',
            }, async (payload) => {
                const m = payload.new
                // Check if this match involves current user
                if (m.user1_id !== user.id && m.user2_id !== user.id) return
                // Match found while waiting — deactivate boost and notify
                await deactivateBoost()
                const updated = await getMeetingHistory(user.id)
                setHistory(updated)
                toast.success(`🎉 ${t('toast_match_found')}!`, {
                    duration: 5000,
                    style: { background: 'linear-gradient(135deg, #007aff, #5856d6)', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: 15, padding: '14px 24px' },
                })
                onMatchFound()
            })
            .subscribe()

        channelRef.current = channel
    }

    const unsubscribeFromMatches = () => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
            channelRef.current = null
        }
    }

    const deactivateBoost = async () => {
        if (!user?.id) return
        await supabase.from('profiles')
            .update({ boost_active: false, updated_at: new Date().toISOString() })
            .eq('id', user.id)
        setBoostActive(false)
        setBoosting(false)
        unsubscribeFromMatches()
    }

    const handleBoost = async () => {
        if (!user?.id) {
            sendDebugLog('H6', 'src/hooks/useMeetingBoost.jsx:handleBoost:noUser', 'Early return: user missing', {})
            return
        }

        // Toggle off if already active
        if (boostActive) {
            sendDebugLog('H6', 'src/hooks/useMeetingBoost.jsx:handleBoost:alreadyActive', 'Boost already active, toggling off', {})
            await deactivateBoost()
            toast(t('boost_deactivated'), { icon: '⏹️' })
            return
        }

        if (!hasCredits) {
            sendDebugLog('H6', 'src/hooks/useMeetingBoost.jsx:handleBoost:noCredits', 'Early return: no credits', {})
            onBuyCredits()
            return
        }
        if (!isProfileComplete) {
            sendDebugLog('H6', 'src/hooks/useMeetingBoost.jsx:handleBoost:incompleteProfile', 'Early return: profile incomplete', {})
            toast.error(t('toast_profile_incomplete'))
            return
        }

        setBoosting(true)
        sendDebugLog('H1', 'src/hooks/useMeetingBoost.jsx:handleBoost:start', 'Boost started', {
            hasCredits,
            isProfileComplete,
            historyCount: history.length,
            hasSearchPrompt: !!searchFilters?.prompt?.trim(),
        })

        try {
            const myProfile = {
                about: profile.about || '',
                gives: profile.gives || '',
                wants: profile.wants || '',
            }
            const matchedIds = new Set(history.map(m => m.partner?.id))

            // ── Step 1: Find other users with boost_active = true ──────────────
            const { data: boostUsers } = await supabase
                .from('profiles')
                .select('id, name, about, gives, wants, about_zh, gives_zh, wants_zh, about_ru, gives_ru, wants_ru, tags, languages, balance, region, city, avatar_url, photos')
                .eq('boost_active', true)
                .neq('id', user.id)
                .not('name', 'is', null)
                .neq('banned', true)
                .is('deleted_at', null)

            // Filter: complete profiles, not already matched
            const candidates = (boostUsers || []).filter(p =>
                !matchedIds.has(p.id) &&
                p.about?.trim() && p.gives?.trim() && p.wants?.trim() && p.avatar_url
            )
            sendDebugLog('H1', 'src/hooks/useMeetingBoost.jsx:handleBoost:candidates', 'Boost candidates prepared', {
                boostUsersCount: (boostUsers || []).length,
                candidatesCount: candidates.length,
                alreadyMatchedCount: matchedIds.size,
            })

            // ── Step 2: Deduct credit FIRST (atomic) ──────────────────────────
            const { error: creditErr } = await supabase.rpc('increment_credits', {
                p_user_id: user.id,
                p_credits: -1,
            })
            if (creditErr) {
                sendDebugLog('H2', 'src/hooks/useMeetingBoost.jsx:handleBoost:creditError', 'Credit deduction failed', {
                    hasCreditError: true,
                })
                toast.error(t('toast_generic_error'))
                setBoosting(false)
                return
            }
            const newCredits = Math.max(0, (subscription.credits ?? 1) - 1)
            setSubscription(s => ({
                ...s,
                credits: newCredits,
                status: newCredits === 0 ? 'empty' : s.status,
            }))

            // ── Step 3: If mutual boost users exist — AI match immediately ─────
            if (candidates.length > 0) {
                const partner = await findBestCandidate(myProfile, candidates, searchFilters.prompt?.trim() || '')

                if (partner) {
                    sendDebugLog('H5', 'src/hooks/useMeetingBoost.jsx:handleBoost:partnerSelected', 'Partner selected for boost match', {
                        partnerIdExists: !!partner.id,
                        partnerNameExists: !!partner.name,
                    })
                    // Create match (no credit deduction — already done above)
                    const u1 = user.id < partner.id ? user.id : partner.id
                    const u2 = user.id < partner.id ? partner.id : user.id

                    const { data: existing } = await supabase.from('matches')
                        .select('id').eq('user1_id', u1).eq('user2_id', u2).maybeSingle()

                    if (!existing) {
                        await supabase.from('matches').insert({
                            user1_id: u1,
                            user2_id: u2,
                            boost_used: true,
                        })
                    }

                    // Deactivate boost for both
                    await Promise.all([
                        supabase.from('profiles').update({ boost_active: false, updated_at: new Date().toISOString() }).eq('id', user.id),
                        supabase.from('profiles').update({ boost_active: false, updated_at: new Date().toISOString() }).eq('id', partner.id),
                    ])

                    setBoostActive(false)
                    setBoosting(false)

                    const updated = await getMeetingHistory(user.id)
                    setHistory(updated)

                    toast.success(`🎉 ${t('toast_match_found')}: ${partner.name}!`, {
                        duration: 5000,
                        style: { background: 'linear-gradient(135deg, #007aff, #5856d6)', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: 15, padding: '14px 24px' },
                    })
                    onMatchFound()
                    return
                }
            }

            // ── Step 4: No mutual boost user found — activate and wait ─────────
            await supabase.from('profiles')
                .update({ boost_active: true, updated_at: new Date().toISOString() })
                .eq('id', user.id)
            sendDebugLog('H4', 'src/hooks/useMeetingBoost.jsx:handleBoost:waitingMode', 'No immediate partner, waiting mode enabled', {
                userIdExists: !!user.id,
            })
            setBoostActive(true)

            // Subscribe to realtime — when another user boosts and gets matched with us
            subscribeToMatches()

            toast.success(t('boost_activated_waiting'), {
                duration: 4000,
                style: { background: 'linear-gradient(45deg, #007aff, #00c6ff)', color: '#fff', borderRadius: 20, fontWeight: 700 },
            })
            onMatchFound() // show boost modal

        } catch (err) {
            sendDebugLog('H4', 'src/hooks/useMeetingBoost.jsx:handleBoost:catchError', 'Boost flow exception', {
                errorMessage: err?.message || 'unknown',
            })
            console.error('[Boost]', err)
            toast.error(t('toast_generic_error'))
            setBoosting(false)
        }
    }

    return { boosting, boostActive, hasCredits, handleBoost }
}
