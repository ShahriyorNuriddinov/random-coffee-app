import { useEffect, useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { getMembers, supabase } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import SectionLabel from '../components/ui/SectionLabel'
import SegmentedControl from '../components/ui/SegmentedControl'
import MemberSheet from '../components/members/MemberSheet'
import { GroupedMemberList } from '../components/members/MemberRow'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminMembers() {
    const { lang } = useAdmin()
    const [members, setMembers] = useState([])
    const [total, setTotal] = useState(0)
    const [newToday, setNewToday] = useState(0)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('active')
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)

    const t = getT('members', lang)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getMembers({ search, status })
        setMembers(res.members)
        setTotal(res.total)
        setLoading(false)
    }, [search, status])

    useEffect(() => { load() }, [load])

    // New today count — direct Supabase query, no limit issue
    useEffect(() => {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', todayStart.toISOString())
            .then(({ count }) => setNewToday(count || 0))
            .catch(() => { })
    }, [])

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
                    onClose={() => { setSelectedId(null); load() }}
                    lang={lang}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <SectionLabel className="mb-0">{t.listTitle} ({total})</SectionLabel>
                <span className="text-[13px] font-semibold text-[#007aff]">
                    {lang === 'en' ? 'New Today' : '今日新增'}: +{newToday}
                </span>
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
            {loading ? (
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
