import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getMomentsAdmin, approveMoment, rejectMoment } from '../lib/adminSupabase'
import { supabase } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import Spinner from '../components/ui/Spinner'
import SectionLabel from '../components/ui/SectionLabel'
import SegmentedControl from '../components/ui/SegmentedControl'
import BottomSheet, { SheetHeader, SheetAction } from '../components/ui/BottomSheet'

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
function MomentCard({ moment: m, onApprove, onReject, showActions, lang }) {
    const t = getT('moments', lang)
    const image = m.image_url || m.image_urls?.[0]

    return (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
            {image && <img src={image} alt="" className="w-full max-h-56 object-cover" />}

            <div className="p-4 flex flex-col gap-3">
                {/* Author row */}
                <div className="flex items-center gap-2">
                    {m.author?.avatar_url
                        ? <img src={m.author.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                        : <div className="w-7 h-7 rounded-full bg-[#007aff] flex items-center justify-center text-white text-[11px] font-bold">
                            {(m.author?.name || '?')[0]}
                        </div>
                    }
                    <span className="text-[13px] font-semibold text-gray-700">{m.is_admin_post ? 'Random Coffee Team' : (m.author?.name || '—')}</span>
                    <span className="text-[11px] text-gray-400 ml-auto">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>

                {/* Text */}
                <p className="text-[14px] text-gray-700 leading-relaxed">{m.text}</p>

                {/* Status badge */}
                {m.status && m.status !== 'pending' && (
                    <span className={`self-start text-[11px] font-bold px-2 py-0.5 rounded-lg uppercase ${m.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                        }`}>
                        {m.status}
                    </span>
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
    const [moments, setMoments] = useState([])
    const [total, setTotal] = useState(0)
    const [status, setStatus] = useState('pending')
    const [loading, setLoading] = useState(true)
    const [rejectTarget, setRejectTarget] = useState(null)

    const t = getT('moments', lang)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getMomentsAdmin({ status })
        setMoments(res.moments)
        setTotal(res.total)
        setLoading(false)
    }, [status])

    useEffect(() => { load() }, [load])

    // ─── Stat counts (fetch all 3 in parallel) ────────────────────────────────
    const [statCounts, setStatCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
    useEffect(() => {
        Promise.all([
            getMomentsAdmin({ status: 'pending', page: 0, limit: 1 }),
            getMomentsAdmin({ status: 'approved', page: 0, limit: 1 }),
            getMomentsAdmin({ status: 'rejected', page: 0, limit: 1 }),
        ]).then(([p, a, r]) => setStatCounts({
            pending: p?.total || 0,
            approved: a?.total || 0,
            rejected: r?.total || 0,
        })).catch(() => { })
    }, [])

    const handleApprove = async (id) => {
        // Check current status to prevent double-crediting
        const moment = moments.find(m => m.id === id)
        if (!moment || moment.status !== 'pending') {
            toast(t.approvedMsg)
            setMoments(m => m.filter(x => x.id !== id))
            return
        }
        const res = await approveMoment(id)
        if (res.success) {
            if (moment?.author?.id) {
                const { data: profile } = await supabase
                    .from('profiles').select('coffee_credits').eq('id', moment.author.id).single()
                if (profile) {
                    await supabase.from('profiles').update({
                        coffee_credits: (profile.coffee_credits ?? 0) + 1,
                        subscription_status: 'active',
                        updated_at: new Date().toISOString(),
                    }).eq('id', moment.author.id)
                }
            }
            toast.success(t.approvedMsg)
            setMoments(m => m.filter(x => x.id !== id))
        } else toast.error(res.error)
    }

    const handleReject = async (reason) => {
        const res = await rejectMoment(rejectTarget, reason)
        setRejectTarget(null)
        if (res.success) {
            toast.success(t.rejectedMsg)
            setMoments(m => m.filter(x => x.id !== rejectTarget))
        } else toast.error(res.error)
    }

    const tabs = [
        { id: 'pending', label: t.pending },
        { id: 'approved', label: t.approved },
        { id: 'rejected', label: t.rejected },
        { id: 'all', label: t.all },
    ]

    return (
        <div className="p-5 flex flex-col gap-4">
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

            <SegmentedControl tabs={tabs} value={status} onChange={setStatus} />

            <SectionLabel>{t[status] || t.all} ({total})</SectionLabel>

            {loading ? (
                <div className="flex items-center justify-center h-32"><Spinner /></div>
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
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
