import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useApp } from '@/store/useAppStore'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PersonCard from '@/components/people/PersonCard'
import PersonProfileSheet from '@/components/people/PersonProfileSheet'
import PeopleFilterModal from '@/components/people/PeopleFilterModal'
import { getPeople, getLikedUserIds, getMatches, supabase } from '@/lib/supabaseClient'
import { calcMatchScoresBatch } from '@/lib/aiUtils'
import { usePeopleLike } from '@/hooks/usePeopleLike'
import BuyCreditsModal from '@/components/meetings/BuyCreditsModal'
import { Skeleton } from '@/components/ui/skeleton'

async function fetchPeople(userId, profile) {
    const [allPeople, liked, matches] = await Promise.all([
        getPeople(userId),
        getLikedUserIds(userId),
        getMatches(userId),
    ])

    const matchedIds = new Set(matches.map(m => m.partner?.id).filter(Boolean))

    const myProfile = {
        gives: profile.gives || '',
        wants: profile.wants || '',
        about: profile.about || '',
        tags: Array.isArray(profile.tags) ? profile.tags : [],
    }

    const candidates = allPeople.filter(p => p.name)
    const ids = candidates.map(p => p.id).sort().join(',')
    const hash = ids.length > 50 ? `${ids.length}_${ids.slice(0, 40)}_${ids.slice(-40)}` : ids
    const cacheKey = `ai_scores_${userId}_${hash}`
    let scores
    try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
            const { data, ts } = JSON.parse(cached)
            if (Date.now() - ts < 30 * 60 * 1000) scores = data
        }
    } catch { sessionStorage.removeItem(cacheKey) }

    if (!scores) {
        try { scores = await calcMatchScoresBatch(myProfile, candidates) } catch { scores = [] }
        if (!Array.isArray(scores)) scores = []
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: scores, ts: Date.now() })) } catch { }
    }

    const { data: likedMeData } = await supabase.from('likes').select('from_user_id').eq('to_user_id', userId)
    const likedMeIds = new Set((likedMeData || []).map(r => r.from_user_id))

    const sorted = candidates
        .map((p, i) => ({ ...p, score: Array.isArray(scores) ? (scores[i] ?? 0) : 0 }))
        .sort((a, b) => {
            const aLikedMe = likedMeIds.has(a.id) ? 1 : 0
            const bLikedMe = likedMeIds.has(b.id) ? 1 : 0
            if (bLikedMe !== aLikedMe) return bLikedMe - aLikedMe
            return b.score - a.score
        })

    return { people: sorted, likedIds: new Set(liked), matchedIds }
}

export default function PeopleScreen() {
    const { t, i18n } = useTranslation()
    const { user, profile, subscription } = useApp()
    const hasCredits = (subscription.credits ?? 0) > 0
    const { likedIds, setLikedIds, handleLike } = usePeopleLike()
    const [selected, setSelected] = useState(null)
    const [showFilter, setShowFilter] = useState(false)
    const [filters, setFilters] = useState({ regions: [], langs: [] })
    const [search, setSearch] = useState('')
    const [showBuyCredits, setShowBuyCredits] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ['people', user?.id],
        queryFn: () => fetchPeople(user.id, profile),
        enabled: !!user?.id,
        staleTime: 2 * 60 * 1000, // 2 min — people list doesn't change often
    })

    const people = data?.people ?? []
    const matchedIds = data?.matchedIds ?? new Set()

    useEffect(() => {
        if (data?.likedIds) setLikedIds(data.likedIds)
    }, [data, setLikedIds])

    const displayPeople = useMemo(() => {
        if (i18n.language === 'zh') return people.map(p => ({ ...p, about: p.about_zh || p.about, gives: p.gives_zh || p.gives, wants: p.wants_zh || p.wants }))
        if (i18n.language === 'ru') return people.map(p => ({ ...p, about: p.about_ru || p.about, gives: p.gives_ru || p.gives, wants: p.wants_ru || p.wants }))
        return people
    }, [people, i18n.language])

    const hasActiveFilters = filters.regions.length > 0 || filters.langs.length > 0

    const filtered = useMemo(() => {
        return displayPeople.filter(p => {
            const q = search.toLowerCase()
            const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.about?.toLowerCase().includes(q) || p.region?.toLowerCase().includes(q)
            const matchRegion = !filters.regions.length || filters.regions.includes(p.region)
            const matchLang = !filters.langs.length || (Array.isArray(p.languages) && p.languages.some(l => filters.langs.includes(l)))
            return matchSearch && matchRegion && matchLang
        })
    }, [displayPeople, search, filters])

    return (
        <div className="app-screen">
            <ScreenHeader
                title={t('nav_people')}
                right={
                    <button aria-label="Filter people" onClick={() => setShowFilter(true)} style={{
                        width: 34, height: 34, borderRadius: '50%',
                        border: hasActiveFilters ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
                        background: hasActiveFilters ? 'rgba(0,122,255,0.1)' : 'rgba(120,120,128,0.1)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: hasActiveFilters ? 'var(--app-primary)' : '#555', position: 'relative',
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm5 7h8v-2H8v2z" />
                        </svg>
                        {hasActiveFilters && <div style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: 'var(--app-primary)', border: '1.5px solid var(--app-card)' }} />}
                    </button>
                }
            />

            {!hasCredits ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <div style={{ background: 'var(--app-card)', borderRadius: 20, padding: 28, textAlign: 'center', maxWidth: 320, width: '100%', border: '0.5px solid var(--app-border)' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>{t('no_credits_title')}</div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 20 }}>{t('no_credits_people_hint')}</div>
                        <button onClick={() => setShowBuyCredits(true)} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #007aff, #5856d6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {t('topup_balance')}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ padding: '12px 16px 0', background: 'var(--app-card)', borderBottom: '0.5px solid var(--app-border)' }}>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={t('search_placeholder')}
                            style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid var(--app-border)', background: 'var(--app-bg)', fontSize: 15, color: 'var(--app-text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }}
                        />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                        {isLoading && !people.length ? <LoadingSkeleton /> : filtered.length === 0 ? <EmptyState hasSearch={!!search || hasActiveFilters} /> : (
                            <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
                                <div style={{ fontSize: 13, color: 'var(--app-hint)', textAlign: 'center', lineHeight: 1.4, padding: '0 10px' }}>
                                    {t('people_ai_hint')}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--app-hint)', marginLeft: 2 }}>
                                    {filtered.length} {t('people_found')}
                                </div>
                                {filtered.map(person => (
                                    <PersonCard key={person.id} person={person} liked={likedIds.has(person.id)}
                                        onLike={() => handleLike(person)}
                                        onOpen={() => setSelected(person)} />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {selected && <PersonProfileSheet
                person={selected}
                liked={likedIds.has(selected.id)}
                matched={matchedIds.has(selected.id)}
                onLike={() => { handleLike(selected); setSelected(null) }}
                onClose={() => setSelected(null)} />}
            {showFilter && <PeopleFilterModal filters={filters} onApply={setFilters} onClose={() => setShowFilter(false)} />}
            {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}
            <BottomNav active="people" />
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="screen-content flex flex-col gap-4 pt-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 flex gap-3" style={{ opacity: 1 - i * 0.2 }}>
                    <Skeleton className="size-14 rounded-full shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-full mt-1" />
                        <Skeleton className="h-3 w-4/5" />
                        <div className="flex gap-2 mt-1">
                            <Skeleton className="h-5 w-14 rounded-full" />
                            <Skeleton className="h-5 w-14 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function EmptyState({ hasSearch }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{hasSearch ? '🔍' : '👥'}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--app-text)', marginBottom: 8 }}>{hasSearch ? 'No results' : 'No people yet'}</div>
            <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, maxWidth: 260 }}>
                {hasSearch ? 'Try changing your search or filters.' : 'Be the first to complete your profile and appear here!'}
            </div>
        </div>
    )
}
