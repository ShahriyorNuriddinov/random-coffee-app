import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'
import PersonCard from '@/components/people/PersonCard'
import PersonProfileSheet from '@/components/people/PersonProfileSheet'
import PeopleFilterModal from '@/components/people/PeopleFilterModal'
import { getPeople, likeUser, unlikeUser, getLikedUserIds, checkMatchExists } from '@/lib/supabaseClient'
import { calcMatchScoresBatch } from '@/lib/aiUtils'

export default function PeopleScreen() {
    const { t } = useTranslation()
    const { user, profile } = useApp()
    const [people, setPeople] = useState([])
    const [likedIds, setLikedIds] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [showFilter, setShowFilter] = useState(false)
    const [filters, setFilters] = useState({ regions: [], langs: [] })
    const [search, setSearch] = useState('')
    useEffect(() => {
        if (!user?.id) return
        load()
    }, [user?.id, profile?.tags?.length])

    const load = async () => {
        setLoading(true)
        const [allPeople, liked] = await Promise.all([
            getPeople(user.id),
            getLikedUserIds(user.id),
        ])
        setLikedIds(new Set(liked))

        const myProfile = {
            gives: profile.gives || '',
            wants: profile.wants || '',
            about: profile.about || '',
            tags: Array.isArray(profile.tags) ? profile.tags : [],
        }

        const candidates = allPeople.filter(p => p.name && p.about)

        // Check cache first (valid for 30 min per session)
        const cacheKey = `ai_scores_${user.id}_${candidates.map(p => p.id).join(',').slice(0, 100)}`
        let scores
        try {
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) {
                const { data, ts } = JSON.parse(cached)
                if (Date.now() - ts < 30 * 60 * 1000) {
                    scores = data
                    console.log('[AI Cache] Using cached scores')
                }
            }
        } catch { }

        if (!scores) {
            scores = await calcMatchScoresBatch(myProfile, candidates)
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify({ data: scores, ts: Date.now() }))
            } catch { }
        }

        const sorted = candidates
            .map((p, i) => ({ ...p, score: scores[i] ?? 0 }))
            .sort((a, b) => b.score - a.score)

        setPeople(sorted)
        setLoading(false)
    }

    // Filter + search logic
    const filtered = useMemo(() => {
        return people.filter(p => {
            const q = search.toLowerCase()
            const matchSearch = !q ||
                p.name?.toLowerCase().includes(q) ||
                p.about?.toLowerCase().includes(q) ||
                p.region?.toLowerCase().includes(q) ||
                p.city?.toLowerCase().includes(q)

            const matchRegion = !filters.regions.length ||
                filters.regions.includes(p.region)

            const matchLang = !filters.langs.length ||
                (Array.isArray(p.languages) && p.languages.some(l => filters.langs.includes(l)))

            return matchSearch && matchRegion && matchLang
        })
    }, [people, search, filters])

    const hasActiveFilters = filters.regions.length > 0 || filters.langs.length > 0

    const handleLike = async (person) => {
        if (!user?.id) return

        // If already liked — unlike (cancel request)
        if (likedIds.has(person.id)) {
            setLikedIds(prev => { const next = new Set(prev); next.delete(person.id); return next })
            await unlikeUser(user.id, person.id)
            toast.success(`Request cancelled`)
            return
        }

        // Optimistic update
        setLikedIds(prev => new Set([...prev, person.id]))
        const result = await likeUser(user.id, person.id)
        if (!result.success) {
            setLikedIds(prev => { const next = new Set(prev); next.delete(person.id); return next })
            toast.error('Failed to send interest')
            return
        }
        const isMatch = await checkMatchExists(user.id, person.id)
        if (isMatch) {
            toast.success(`🎉 It's a Match with ${person.name}!`, {
                duration: 4000,
                style: {
                    background: 'linear-gradient(135deg, #007aff, #5856d6)',
                    color: '#fff', borderRadius: 20, fontWeight: 700,
                    fontSize: 15, padding: '14px 24px',
                },
            })
        } else {
            toast.success(`❤️ Interest sent to ${person.name}`)
        }
    }

    return (
        <div className="app-screen">
            <ScreenHeader
                title={t('nav_people')}
                right={
                    <button
                        onClick={() => setShowFilter(true)}
                        style={{
                            width: 34, height: 34, borderRadius: '50%',
                            border: hasActiveFilters
                                ? '1px solid rgba(0,122,255,0.3)'
                                : '1px solid transparent',
                            background: hasActiveFilters
                                ? 'rgba(0,122,255,0.1)'
                                : 'rgba(120,120,128,0.1)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: hasActiveFilters ? 'var(--app-primary)' : '#555',
                            position: 'relative',
                        }}
                    >
                        {/* Filter icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm5 7h8v-2H8v2z" />
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

            {/* Search bar */}
            <div style={{ padding: '12px 16px 0', background: 'var(--app-card)', borderBottom: '0.5px solid var(--app-border)' }}>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, bio, location..."
                    style={{
                        width: '100%', padding: '11px 14px',
                        borderRadius: 12, border: '0.5px solid var(--app-border)',
                        background: 'var(--app-bg)',
                        fontSize: 15, color: 'var(--app-text)',
                        outline: 'none', fontFamily: 'inherit',
                        boxSizing: 'border-box', marginBottom: 12,
                    }}
                />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                {loading ? (
                    <LoadingSkeleton />
                ) : filtered.length === 0 ? (
                    <EmptyState hasSearch={!!search || hasActiveFilters} />
                ) : (
                    <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
                        <div style={{ fontSize: 13, color: 'var(--app-hint)', textAlign: 'center', lineHeight: 1.4, padding: '0 10px' }}>
                            {t('people_ai_hint')}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--app-hint)', marginLeft: 2 }}>
                            {filtered.length} {filtered.length === 1 ? 'person' : 'people'} found
                        </div>
                        {filtered.map(person => (
                            <PersonCard
                                key={person.id}
                                person={person}
                                liked={likedIds.has(person.id)}
                                onLike={() => handleLike(person)}
                                onOpen={() => setSelected(person)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Profile bottom sheet */}
            {selected && (
                <PersonProfileSheet
                    person={selected}
                    liked={likedIds.has(selected.id)}
                    onLike={() => { handleLike(selected); setSelected(null) }}
                    onClose={() => setSelected(null)}
                />
            )}

            {/* Filter modal */}
            {showFilter && (
                <PeopleFilterModal
                    filters={filters}
                    onApply={setFilters}
                    onClose={() => setShowFilter(false)}
                />
            )}

            <BottomNav active="people" />
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    height: 180, borderRadius: 20,
                    background: 'var(--app-card)',
                    border: '0.5px solid var(--app-border)',
                    opacity: 1 - i * 0.2,
                }} />
            ))}
        </div>
    )
}

function EmptyState({ hasSearch }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 40, textAlign: 'center', marginTop: 60,
        }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
                {hasSearch ? '🔍' : '👥'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--app-text)', marginBottom: 8 }}>
                {hasSearch ? 'No results' : 'No people yet'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, maxWidth: 260 }}>
                {hasSearch
                    ? 'Try changing your search or filters.'
                    : 'Be the first to complete your profile and appear here!'}
            </div>
        </div>
    )
}
