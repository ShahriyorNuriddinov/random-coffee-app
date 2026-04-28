import { useState } from 'react'
import { CheckCircle, XCircle, CheckSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMomentsAdmin, approveMoment, rejectMoment, supabase } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import SectionLabel from '../components/ui/SectionLabel'
import SegmentedControl from '../components/ui/SegmentedControl'
import BottomSheet, { SheetHeader, SheetAction } from '../components/ui/BottomSheet'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Reject reason sheet ──────────────────────────────────────────────────────
function RejectSheet({ onConfirm, onClose, lang }) {
    const t = getT('moments', lang)
    return (
        <BottomSheet onClose={onClose}>
            <SheetHeader title={t.selectReason} />
            {t.reasons.map(reason => (
                <SheetAction key={reason} label={reason} onClick={() => onConfirm(reason)} danger />
            ))}
            <SheetAction label={getT('common', lang).cancel} onClick={onClose} cancel />
        </BottomSheet>
    )
}

// ─── Single moment card ───────────────────────────────────────────────────────
function MomentCard({ moment: m, onApprove, onReject, showActions, lang, selected, onSelect }) {
    const t = getT('moments', lang)
    const image = m.image_url || m.image_urls?.[0]
    const authorName = m.is_admin_post ? 'Random Coffee Team' : (m.author?.name || '—')
    const initials = authorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${selected ? 'border-[#007aff]' : 'border-black/5'}`}>
            {image && <img src={image} alt="" className="w-full max-h-56 object-cover" />}

            <div className="p-4 flex flex-col gap-3">
                {/* Author row */}
                <div className="flex items-center gap-2">
                    {showActions && (
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onSelect?.(m.id)}
                            className="w-4 h-4 accent-[#007aff] cursor-pointer flex-shrink-0"
                        />
                    )}
                    <Avatar size="sm">
                        <AvatarImage src={m.author?.avatar_url} alt={authorName} />
                        <AvatarFallback className={m.is_admin_post ? 'bg-primary text-primary-foreground text-[10px]' : 'text-[10px]'}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] font-semibold text-gray-700">{authorName}</span>
                    <span className="text-[11px] text-gray-400 ml-auto">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>

                {/* Text */}
                <p className="text-[14px] text-gray-700 leading-relaxed">{m.text}</p>

                {/* Status badge */}
                {m.status && m.status !== 'pending' && (
                    <Badge
                        variant={m.status === 'approved' ? 'default' : 'destructive'}
                        className="self-start uppercase text-[10px]"
                    >
                        {m.status}
                    </Badge>
                )}

                {/* Moderation actions */}
                {showActions && (
                    <div className="flex gap-3 pt-2 border-t border-black/5">
                        <button
                            onClick={() => onReject(m.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-xl text-[14px] font-semibold active:scale-[0.97] transition-all"
                        >
                            <XCircle size={16} /> {t.reject}
                        </button>
                        <button
                            onClick={() => onApprove(m.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl text-[14px] font-semibold active:scale-[0.97] transition-all"
                        >
                            <CheckCircle size={16} /> {t.approve}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AdminMoments() {
    const { lang } = useAdmin()
    const [status, setStatus] = useState('pending')
    const [rejectTarget, setRejectTarget] = useState(null)
    const [selected, setSelected] = useState(new Set())
    const [bulkLoading, setBulkLoading] = useState(false)
    const queryClient = useQueryClient()

    const t = getT('moments', lang)

    const { data, isLoading } = useQuery({
        queryKey: ['admin-moments', status],
        queryFn: () => getMomentsAdmin({ status }),
    })

    const moments = data?.moments ?? []
    const total = data?.total ?? 0

    const { data: statCounts = { pending: 0, approved: 0, rejected: 0 } } = useQuery({
        queryKey: ['admin-moments-counts'],
        queryFn: async () => {
            const [p, a, r] = await Promise.all([
                getMomentsAdmin({ status: 'pending', page: 0, limit: 1 }),
                getMomentsAdmin({ status: 'approved', page: 0, limit: 1 }),
                getMomentsAdmin({ status: 'rejected', page: 0, limit: 1 }),
            ])
            return { pending: p?.total || 0, approved: a?.total || 0, rejected: r?.total || 0 }
        },
        staleTime: 30 * 1000,
    })

    const handleApprove = async (id) => {
        const moment = moments.find(m => m.id === id)
        if (!moment || moment.status !== 'pending') {
            toast(t.approvedMsg)
            queryClient.invalidateQueries({ queryKey: ['admin-moments'] })
            return
        }
        const res = await approveMoment(id)
        if (res.success) {
            if (moment?.author?.id) {
                const { data: cfg } = await supabase.from('app_settings').select('reward_post').eq('id', 1).single()
                const reward = Number(cfg?.reward_post ?? 1)
                if (reward > 0) {
                    const { data: profile } = await supabase.from('profiles').select('coffee_credits').eq('id', moment.author.id).single()
                    if (profile) {
                        await supabase.from('profiles').update({
                            coffee_credits: (profile.coffee_credits ?? 0) + reward,
                            subscription_status: 'active',
                            updated_at: new Date().toISOString(),
                        }).eq('id', moment.author.id)
                    }
                }
            }
            toast.success(t.approvedMsg)
            queryClient.invalidateQueries({ queryKey: ['admin-moments'] })
            queryClient.invalidateQueries({ queryKey: ['admin-moments-counts'] })
        } else toast.error(res.error)
    }

    const handleReject = async (reason) => {
        const res = await rejectMoment(rejectTarget, reason)
        setRejectTarget(null)
        if (res.success) {
            toast.success(t.rejectedMsg)
            queryClient.invalidateQueries({ queryKey: ['admin-moments'] })
            queryClient.invalidateQueries({ queryKey: ['admin-moments-counts'] })
        } else toast.error(res.error)
    }

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const selectAll = () => {
        const pendingIds = moments.filter(m => !m.status || m.status === 'pending').map(m => m.id)
        setSelected(prev => prev.size === pendingIds.length ? new Set() : new Set(pendingIds))
    }

    const handleBulkApprove = async () => {
        if (!selected.size) return
        setBulkLoading(true)
        const ids = [...selected]
        await Promise.all(ids.map(id => handleApprove(id)))
        setSelected(new Set())
        setBulkLoading(false)
        toast.success(`${ids.length} posts approved`)
    }

    const handleBulkReject = async () => {
        if (!selected.size) return
        setBulkLoading(true)
        const ids = [...selected]
        await Promise.all(ids.map(id => rejectMoment(id, 'Bulk rejected')))
        setSelected(new Set())
        setBulkLoading(false)
        queryClient.invalidateQueries({ queryKey: ['admin-moments'] })
        queryClient.invalidateQueries({ queryKey: ['admin-moments-counts'] })
        toast.success(`${ids.length} posts rejected`)
    }

    const tabs = [
        { id: 'pending', label: t.pending },
        { id: 'approved', label: t.approved },
        { id: 'rejected', label: t.rejected },
        { id: 'all', label: t.all },
    ]

    return (
        <div className="px-4 py-4 flex flex-col gap-4">
            {rejectTarget && (
                <RejectSheet
                    onConfirm={handleReject}
                    onClose={() => setRejectTarget(null)}
                    lang={lang}
                />
            )}

            {/* ── Stat cards: Pending / Approved / Rejected ── */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: t.pending, count: statCounts.pending, color: '#ff9500' },
                    { label: t.approved, count: statCounts.approved, color: '#34c759' },
                    { label: t.rejected, count: statCounts.rejected, color: '#ff3b30' },
                ].map(({ label, count, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-3 text-center border border-black/5 shadow-sm">
                        <p className="text-[18px] font-extrabold" style={{ color }}>{count}</p>
                        <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            <SegmentedControl tabs={tabs} value={status} onChange={v => { setStatus(v); setSelected(new Set()) }} />

            {/* Bulk actions toolbar — only for pending */}
            {status === 'pending' && moments.length > 0 && (
                <div className="flex items-center gap-2 bg-white rounded-xl border border-black/5 px-3 py-2 shadow-sm">
                    <button onClick={selectAll} className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-600">
                        <CheckSquare size={16} className={selected.size > 0 ? 'text-[#007aff]' : 'text-gray-400'} />
                        {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                    </button>
                    {selected.size > 0 && (
                        <>
                            <div className="flex-1" />
                            <button
                                onClick={handleBulkApprove}
                                disabled={bulkLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-[12px] font-bold disabled:opacity-50"
                            >
                                <CheckCircle size={13} /> Approve all
                            </button>
                            <button
                                onClick={handleBulkReject}
                                disabled={bulkLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-[12px] font-bold disabled:opacity-50"
                            >
                                <XCircle size={13} /> Reject all
                            </button>
                        </>
                    )}
                </div>
            )}

            <SectionLabel>{t[status] || t.all} ({total})</SectionLabel>

            {isLoading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-black/5 p-4 flex flex-col gap-3" style={{ opacity: 1 - i * 0.2 }}>
                            <div className="flex items-center gap-2">
                                <Skeleton className="size-7 rounded-full" />
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-3 w-16 ml-auto" />
                            </div>
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                        </div>
                    ))}
                </div>
            ) : moments.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-[14px]">{t.noItems}</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {moments.map(m => (
                        <MomentCard
                            key={m.id}
                            moment={m}
                            onApprove={handleApprove}
                            onReject={id => setRejectTarget(id)}
                            showActions={(status === 'pending' || status === 'all') && (!m.status || m.status === 'pending')}
                            lang={lang}
                            selected={selected.has(m.id)}
                            onSelect={toggleSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
