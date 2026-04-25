import { useState } from 'react'
import { useApp } from '@/store/useAppStore'
import { getMeetingHistory, getPeople, supabase } from '@/lib/supabaseClient'
import { calcMatchScoresBatch } from '@/lib/aiUtils'
import toast from 'react-hot-toast'

export function useMeetingBoost({ history, setHistory, searchFilters, hasActiveFilters, onBuyCredits, onMatchFound }) {
    const { user, subscription, setSubscription, profile } = useApp()
    const [boosting, setBoosting] = useState(false)

    const hasCredits = !subscription.status || subscription.status === 'trial' || subscription.status === 'active' || (subscription.credits ?? 0) > 0

    const handleBoost = async () => {
        if (!user?.id) return
        if (!hasCredits) { onBuyCredits(); return }

        setBoosting(true)
        try {
            let people = await getPeople(user.id)
            const matchedIds = new Set(history.map(m => m.partner?.id))

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
                return
            }

            const myProfile = {
                gives: profile.gives || '',
                wants: profile.wants || '',
                about: profile.about || '',
            }

            let partner
            try {
                if (myProfile.gives || myProfile.wants || searchFilters.prompt?.trim()) {
                    const scores = await calcMatchScoresBatch(myProfile, candidates, searchFilters.prompt?.trim() || '')
                    const bestIdx = (scores?.length > 0) ? scores.indexOf(Math.max(...scores)) : 0
                    partner = candidates[bestIdx] || candidates[0]
                } else {
                    partner = candidates[0]
                }
            } catch {
                partner = candidates[0]
            }

            if (!partner) {
                toast.error('No match found. Try again.')
                return
            }

            // Create match (prevent duplicates)
            const u1 = user.id < partner.id ? user.id : partner.id
            const u2 = user.id < partner.id ? partner.id : user.id
            const { data: existing } = await supabase.from('matches')
                .select('id').eq('user1_id', u1).eq('user2_id', u2).maybeSingle()
            if (!existing) {
                await supabase.from('matches').insert({ user1_id: u1, user2_id: u2 })
            }

            // Deduct credit
            if (subscription.status !== 'trial') {
                const newCredits = Math.max(0, (subscription.credits || 0) - 1)
                const newStatus = newCredits === 0 ? 'empty' : 'active'
                setSubscription(s => ({ ...s, credits: newCredits, status: newStatus }))
                await supabase.from('profiles').update({
                    coffee_credits: newCredits,
                    subscription_status: newStatus,
                }).eq('id', user.id)
            }

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
            onMatchFound()
        } catch {
            toast.error('Something went wrong. Try again.')
        } finally {
            setBoosting(false)
        }
    }

    return { boosting, hasCredits, handleBoost }
}
