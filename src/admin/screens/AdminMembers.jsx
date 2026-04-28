import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMembers, supabase } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import { useDebounce } from '@/hooks/useDebounce'
import SectionLabel from '../components/ui/SectionLabel'
import SegmentedControl from '../components/ui/SegmentedControl'
import MemberSheet from '../components/members/MemberSheet'
import { GroupedMemberList } from '../components/members/MemberRow'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminMembers() {
    const { lang } = useAdmin()
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300) // Debounce search input
    const [status, setStatus] = useState('active')
    const [selectedId, setSelectedId] = useState(null)
    const [newToday, setNewToday] = useState(0)
    const queryClient = useQueryClient()

    const t = getT('members', lang)

    const { data, isLoading } = useQuery({
        queryKey: ['admin-members', debouncedSearch, status], // Use debounced value
        queryFn: () => getMembers({ search: debouncedSearch, status }),
    })

    const members = data?.members ?? []
    const total = data?.total ?? 0

    // Load new today count on mount
    useState(() => {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        supabase.from('profiles').select('id', { count: 'exact', head: true })
            .gte('created_at', todayStart.toISOString())
            .then(({ count }) => setNewToday(count || 0))
            .catch((err) => console.error('[AdminMembers] Failed to load new today count:', err))
    })

    const exportCSV = () => {
        if (!members.length) return
        const headers = ['Name', 'Email', 'Region', 'Status', 'Credits', 'Registered']
        const rows = members.map(m => [
            m.name || '',
            m.email || '',
            m.region || '',
            m.subscription_status || '',
            m.coffee_credits ?? 0,
            new Date(m.created_at).toLocaleDateString(),
        ])
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `members_${status}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const statusTabs = [
        { id: 'active', label: t.active },
        { id: 'inactive', label: t.inactive },
        { id: 'banned', label: t.banned, danger: true },
    ]

    return (
        <div className="p-5 flex flex-col gap-4">
            {selectedId && (
                <MemberSheet
                    memberId={selectedId}
                    onClose={() => { setSelectedId(null); queryClient.invalidateQueries({ queryKey: ['admin-members'] }) }}
                    lang={lang}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <SectionLabel className="mb-0">{t.listTitle} ({total})</SectionLabel>
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#007aff]">
                        {lang === 'en' ? 'New Today' : '今日新增'}: +{newToday}
                    </span>
                    <button
                        onClick={exportCSV}
                        title="Export CSV"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-black/5 rounded-lg text-[12px] font-semibold text-gray-600 shadow-sm active:bg-gray-50"
                    >
                        <Download size={13} /> CSV
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-white border border-black/5 rounded-xl pl-9 pr-4 py-3 text-[14px] outline-none shadow-sm" />
            </div>

            {/* Filter tabs */}
            <SegmentedControl tabs={statusTabs} value={status} onChange={setStatus} />

            {/* List */}
            {isLoading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-black/5 px-4 py-3 flex items-center gap-3" style={{ opacity: 1 - i * 0.15 }}>
                            <Skeleton className="size-9 rounded-full shrink-0" />
                            <div className="flex flex-col gap-2 flex-1">
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-5 w-14 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : members.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-[14px]">{t.noResults}</div>
            ) : (
                <GroupedMemberList members={members} onSelect={setSelectedId} lang={lang} />
            )}
        </div>
    )
}
