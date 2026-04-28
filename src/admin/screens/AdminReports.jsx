import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import SectionLabel from '../components/ui/SectionLabel'
import SegmentedControl from '../components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'
import MemberSheet from '../components/members/MemberSheet'

export default function AdminReports() {
    const { lang } = useAdmin()
    const [status, setStatus] = useState('pending')
    const [selectedMember, setSelectedMember] = useState(null)
    const queryClient = useQueryClient()

    const t = getT('reports', lang)

    const { data: reports = [], isLoading, error } = useQuery({
        queryKey: ['admin-reports', status],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('admin_reports_view')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('[AdminReports] Error:', error)
                throw new Error(error.message)
            }

            return data || []
        },
        retry: 1,
        staleTime: 30000, // 30 seconds
    })

    if (error) {
        return (
            <div className="p-5">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <div className="text-red-600 font-semibold mb-2">Failed to load reports</div>
                    <div className="text-sm text-red-500">{error.message}</div>
                </div>
            </div>
        )
    }

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
            toast.success(lang === 'en' ? 'Status updated' : '状态已更新')
        },
        onError: () => {
            toast.error(lang === 'en' ? 'Failed to update' : '更新失败')
        }
    })

    const blockUserMutation = useMutation({
        mutationFn: async ({ reportedId, reportId, reason, reporterName }) => {
            // Block the reported user by admin
            const { error: blockError } = await supabase
                .from('profiles')
                .update({
                    banned: true,
                    ban_reason: reason,
                    banned_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportedId) // reportedId is already TEXT (profiles.id)

            if (blockError) {
                console.error('[blockUserMutation] Block error:', blockError)
                throw blockError
            }

            // Update report with admin action
            const { error: reportError } = await supabase
                .from('reports')
                .update({
                    status: 'resolved',
                    admin_notes: `✅ User banned by admin\n📋 Report Type: ${reason}\n👤 Reported by: ${reporterName}\n⏰ Action taken: ${new Date().toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId)

            if (reportError) {
                console.error('[blockUserMutation] Report update error:', reportError)
                throw reportError
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
            queryClient.invalidateQueries({ queryKey: ['admin-members'] })
            toast.success(lang === 'en' ? '✅ User blocked successfully' : '✅ 用户已被封禁')
        },
        onError: (error) => {
            console.error('[blockUserMutation] error:', error)
            toast.error(lang === 'en' ? '❌ Failed to block user' : '❌ 封禁失败')
        }
    })

    const handleUpdateStatus = (reportId, newStatus) => {
        updateStatusMutation.mutate({ reportId, newStatus, adminNotes: null })
    }

    const handleBlockUser = (reportedId, reportId, reason, reporterName) => {
        if (!confirm(lang === 'en'
            ? 'Are you sure you want to block this user? This action will ban them from the platform.'
            : '确定要封禁此用户吗？此操作将禁止他们使用平台。')) {
            return
        }
        blockUserMutation.mutate({ reportedId, reportId, reason, reporterName })
    }

    const handleViewProfile = async (userId) => {
        // Fetch full member data
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('[handleViewProfile] error:', error)
            toast.error(lang === 'en' ? 'Failed to load profile' : '加载失败')
            return
        }

        if (data) {
            setSelectedMember(data)
        }
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
                            onBlockUser={handleBlockUser}
                            onViewProfile={handleViewProfile}
                            lang={lang}
                        />
                    ))}
                </div>
            )}

            {/* Member Profile Sheet */}
            {selectedMember && (
                <MemberSheet
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                    lang={lang}
                />
            )}
        </div>
    )
}

function ReportCard({ report, onUpdateStatus, onBlockUser, onViewProfile, lang }) {
    // Debug: Log report to see the reason
    console.log('[ReportCard] Report:', report)

    const reasonIcons = {
        'Spam': '📧',
        'Inappropriate': '⚠️',
        'Fake profile': '🎭',
        'Harassment': '🚨',
    }

    const reasonColors = {
        'Spam': '#ff9500',
        'Inappropriate': '#ff9500',
        'Fake profile': '#ff9500',
        'Harassment': '#ff3b30',
    }

    const statusColors = {
        'pending': '#ff9500',
        'reviewed': '#007aff',
        'resolved': '#34c759',
        'dismissed': '#8e8e93',
    }

    return (
        <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
            {/* Header with Report Type */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        style={{
                            fontSize: 32,
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${reasonColors[report.reason] || '#ff9500'}15`,
                            borderRadius: 12,
                        }}
                    >
                        {reasonIcons[report.reason] || '⚠️'}
                    </div>
                    <div>
                        <div className="text-[16px] font-bold mb-1" style={{ color: reasonColors[report.reason] || '#ff9500' }}>
                            {report.reason || 'Unknown'}
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
                    <button
                        onClick={() => report.reporter_id && onViewProfile(report.reporter_id)}
                        className="text-left w-full hover:bg-gray-100 active:bg-gray-200 rounded-lg p-1.5 -m-1.5 transition-colors"
                        style={{ cursor: report.reporter_id ? 'pointer' : 'default' }}
                    >
                        <div className="text-[13px] font-semibold text-gray-900 flex items-center gap-1">
                            {report.reporter_name || 'Unknown'}
                            {report.reporter_id && <span className="text-[10px]">👁️</span>}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                            {report.reporter_email || 'No email'}
                        </div>
                    </button>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        {lang === 'en' ? 'Reported User' : '被举报人'}
                    </div>
                    <button
                        onClick={() => report.reported_id && onViewProfile(report.reported_id)}
                        className="text-left w-full hover:bg-gray-100 active:bg-gray-200 rounded-lg p-1.5 -m-1.5 transition-colors"
                        style={{ cursor: report.reported_id ? 'pointer' : 'default' }}
                    >
                        <div className="text-[13px] font-semibold text-gray-900 flex items-center gap-1">
                            {report.reported_name || 'Unknown'}
                            {report.reported_id && <span className="text-[10px]">👁️</span>}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                            {report.reported_email || 'No email'}
                        </div>
                    </button>
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
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdateStatus(report.id, 'reviewed')}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white text-[13px] font-semibold rounded-lg active:bg-blue-600 transition-colors"
                        >
                            {lang === 'en' ? '👁️ Review' : '👁️ 审核'}
                        </button>
                        <button
                            onClick={() => onUpdateStatus(report.id, 'dismissed')}
                            className="flex-1 px-3 py-2 bg-gray-400 text-white text-[13px] font-semibold rounded-lg active:bg-gray-500 transition-colors"
                        >
                            {lang === 'en' ? '✕ Dismiss' : '✕ 驳回'}
                        </button>
                    </div>
                    <button
                        onClick={() => onBlockUser(report.reported_id, report.id, report.reason, report.reporter_name)}
                        className="w-full px-3 py-2.5 bg-red-500 text-white text-[14px] font-bold rounded-lg active:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🚫</span>
                        <span>{lang === 'en' ? 'Block User' : '封禁用户'}</span>
                    </button>
                </div>
            )}

            {report.status === 'reviewed' && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdateStatus(report.id, 'resolved')}
                            className="flex-1 px-3 py-2 bg-green-500 text-white text-[13px] font-semibold rounded-lg active:bg-green-600 transition-colors"
                        >
                            {lang === 'en' ? '✓ Resolve' : '✓ 解决'}
                        </button>
                        <button
                            onClick={() => onUpdateStatus(report.id, 'dismissed')}
                            className="flex-1 px-3 py-2 bg-gray-400 text-white text-[13px] font-semibold rounded-lg active:bg-gray-500 transition-colors"
                        >
                            {lang === 'en' ? '✕ Dismiss' : '✕ 驳回'}
                        </button>
                    </div>
                    <button
                        onClick={() => onBlockUser(report.reported_id, report.id, report.reason, report.reporter_name)}
                        className="w-full px-3 py-2.5 bg-red-500 text-white text-[14px] font-bold rounded-lg active:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🚫</span>
                        <span>{lang === 'en' ? 'Block User' : '封禁用户'}</span>
                    </button>
                </div>
            )}

            {report.status === 'resolved' && (
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                    <div className="text-[13px] font-semibold text-green-700">
                        ✓ {lang === 'en' ? 'Resolved' : '已解决'}
                    </div>
                </div>
            )}

            {report.status === 'dismissed' && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <div className="text-[13px] font-semibold text-gray-600">
                        ✕ {lang === 'en' ? 'Dismissed' : '已驳回'}
                    </div>
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
