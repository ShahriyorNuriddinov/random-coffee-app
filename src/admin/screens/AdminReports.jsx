import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import SectionLabel from '../components/ui/SectionLabel'
import SegmentedControl from '../components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminReports() {
    const { lang } = useAdmin()
    const [status, setStatus] = useState('pending')
    const queryClient = useQueryClient()

    const t = getT('reports', lang)

    const { data: reports = [], isLoading } = useQuery({
        queryKey: ['admin-reports', status],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('admin_reports_view')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('[AdminReports] Error:', error)
                return []
            }
            return data || []
        },
    })

    const updateStatusMutation = useMutation({
        mutationFn: async ({ reportId, newStatus, adminNotes }) => {
            const { error } = await supabase
                .from('reports')
                .update({
                    status: newStatus,
                    admin_notes: adminNotes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
        },
    })

    const handleUpdateStatus = (reportId, newStatus) => {
        updateStatusMutation.mutate({ reportId, newStatus, adminNotes: null })
    }

    const statusTabs = [
        { id: 'pending', label: lang === 'en' ? 'Pending' : '待处理' },
        { id: 'reviewed', label: lang === 'en' ? 'Reviewed' : '已审核' },
        { id: 'resolved', label: lang === 'en' ? 'Resolved' : '已解决' },
        { id: 'dismissed', label: lang === 'en' ? 'Dismissed' : '已驳回' },
    ]

    return (
        <div className="p-5 flex flex-col gap-4">
            <SectionLabel className="mb-0">
                {lang === 'en' ? 'User Reports' : '用户举报'} ({reports.length})
            </SectionLabel>

            <SegmentedControl tabs={statusTabs} value={status} onChange={setStatus} />

            {isLoading ? (
                <LoadingSkeleton />
            ) : reports.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-[14px]">
                    {lang === 'en' ? 'No reports found' : '暂无举报'}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {reports.map(report => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onUpdateStatus={handleUpdateStatus}
                            lang={lang}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function ReportCard({ report, onUpdateStatus, lang }) {
    const [expanded, setExpanded] = useState(false)

    const reasonIcons = {
        'Spam': '📧',
        'Inappropriate': '⚠️',
        'Fake profile': '🎭',
        'Harassment': '🚨',
    }

    const statusColors = {
        'pending': '#ff9500',
        'reviewed': '#007aff',
        'resolved': '#34c759',
        'dismissed': '#8e8e93',
    }

    return (
        <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <span style={{ fontSize: 24 }}>
                        {reasonIcons[report.reason] || '⚠️'}
                    </span>
                    <div>
                        <div className="text-[14px] font-bold text-gray-900">
                            {report.reason}
                        </div>
                        <div className="text-[12px] text-gray-500">
                            {new Date(report.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                    </div>
                </div>
                <span
                    style={{
                        background: `${statusColors[report.status]}15`,
                        color: statusColors[report.status],
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase"
                >
                    {report.status}
                </span>
            </div>

            {/* Reporter & Reported */}
            <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 rounded-xl">
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        {lang === 'en' ? 'Reporter' : '举报人'}
                    </div>
                    <div className="text-[13px] font-semibold text-gray-900">
                        {report.reporter_name || 'Unknown'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                        {report.reporter_email || 'No email'}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        {lang === 'en' ? 'Reported User' : '被举报人'}
                    </div>
                    <div className="text-[13px] font-semibold text-gray-900">
                        {report.reported_name || 'Unknown'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                        {report.reported_email || 'No email'}
                    </div>
                </div>
            </div>

            {/* Admin Notes */}
            {report.admin_notes && (
                <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">
                        Admin Notes
                    </div>
                    <div className="text-[12px] text-gray-700">
                        {report.admin_notes}
                    </div>
                </div>
            )}

            {/* Actions */}
            {report.status === 'pending' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => onUpdateStatus(report.id, 'reviewed')}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-[13px] font-semibold rounded-lg active:bg-blue-600"
                    >
                        {lang === 'en' ? 'Review' : '审核'}
                    </button>
                    <button
                        onClick={() => onUpdateStatus(report.id, 'resolved')}
                        className="flex-1 px-3 py-2 bg-green-500 text-white text-[13px] font-semibold rounded-lg active:bg-green-600"
                    >
                        {lang === 'en' ? 'Resolve' : '解决'}
                    </button>
                    <button
                        onClick={() => onUpdateStatus(report.id, 'dismissed')}
                        className="flex-1 px-3 py-2 bg-gray-400 text-white text-[13px] font-semibold rounded-lg active:bg-gray-500"
                    >
                        {lang === 'en' ? 'Dismiss' : '驳回'}
                    </button>
                </div>
            )}

            {report.status === 'reviewed' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => onUpdateStatus(report.id, 'resolved')}
                        className="flex-1 px-3 py-2 bg-green-500 text-white text-[13px] font-semibold rounded-lg active:bg-green-600"
                    >
                        {lang === 'en' ? 'Mark Resolved' : '标记为已解决'}
                    </button>
                    <button
                        onClick={() => onUpdateStatus(report.id, 'dismissed')}
                        className="flex-1 px-3 py-2 bg-gray-400 text-white text-[13px] font-semibold rounded-lg active:bg-gray-500"
                    >
                        {lang === 'en' ? 'Dismiss' : '驳回'}
                    </button>
                </div>
            )}
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
                <div
                    key={i}
                    className="bg-white rounded-2xl border border-black/5 p-4"
                    style={{ opacity: 1 - i * 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex flex-col gap-2 flex-1">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-20 w-full rounded-xl mb-3" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 flex-1 rounded-lg" />
                        <Skeleton className="h-9 flex-1 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    )
}
