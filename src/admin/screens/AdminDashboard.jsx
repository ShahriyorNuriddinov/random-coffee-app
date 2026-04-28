import { useEffect, useState } from 'react'
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import DashboardSkeleton from '../components/ui/Skeleton'
import SectionLabel from '../components/ui/SectionLabel'
import Card from '../components/ui/Card'
import SegmentedControl from '../components/ui/SegmentedControl'

// ─── Shared tooltip style ─────────────────────────────────────────────────────
const tooltipStyle = {
    contentStyle: {
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        fontSize: 13,
        padding: '8px 12px',
    },
    cursor: { fill: 'rgba(0,0,0,0.04)' },
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = '#007aff' }) {
    return (
        <Card className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">{label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
                    <Icon size={16} style={{ color }} />
                </div>
            </div>
            <div className="text-[26px] font-extrabold text-gray-900 leading-none">{value}</div>
            {sub && <div className="text-[12px] text-gray-400">{sub}</div>}
        </Card>
    )
}

// ─── Revenue area chart ───────────────────────────────────────────────────────
function RevenueChart({ data, label }) {
    return (
        <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007aff" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#007aff" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8e8e93' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...tooltipStyle} formatter={v => [`HK$ ${v.toLocaleString()}`, label]} />
                <Area type="monotone" dataKey="revenue" stroke="#007aff" strokeWidth={2.5}
                    fill="url(#adminRevGrad)" dot={false} activeDot={{ r: 5, fill: '#007aff', strokeWidth: 0 }} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// ─── New members bar chart ────────────────────────────────────────────────────
function MembersChart({ data, label }) {
    return (
        <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data} barSize={18} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8e8e93' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...tooltipStyle} formatter={v => [v, label]} />
                <Bar dataKey="count" fill="#007aff" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}

// ─── Meeting satisfaction — HTML style: progress bars ────────────────────────
function MeetingRatings({ t, ratings }) {
    if (!ratings) {
        return (
            <Card className="p-4">
                <p className="text-[13px] text-gray-400 text-center py-4">
                    {t.ratingNoData || 'No feedback data yet.'}
                </p>
            </Card>
        )
    }
    const items = [
        { label: t.ratingExcellent, pct: ratings.excellent, color: '#34c759' },
        { label: t.ratingGood, pct: ratings.good, color: '#007aff' },
        { label: t.ratingNormal, pct: ratings.normal, color: '#ff9500' },
        { label: t.ratingBad, pct: ratings.bad, color: '#ff3b30' },
    ]
    return (
        <Card className="p-4 flex flex-col gap-3">
            {items.map((r, i) => (
                <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[13px] font-semibold">
                        <span className="text-gray-800">{r.label}</span>
                        <span className="text-gray-400">{r.pct}%</span>
                    </div>
                    <div className="h-2 bg-[#e5e5ea] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                </div>
            ))}
        </Card>
    )
}

// ─── Cancelled meetings bottom sheet (real data from meeting_feedback) ────────
function CancelledModal({ onClose, t, cancelReasons = {} }) {
    const total = Object.values(cancelReasons).reduce((s, c) => s + c, 0) || 1
    const reasons = Object.entries(cancelReasons)
        .sort(([, a], [, b]) => b - a)
        .map(([label, count]) => ({
            label,
            pct: `${Math.round(count / total * 100)}%`,
            count,
        }))

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#f2f4f7] rounded-t-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-black/5 rounded-t-2xl">
                    <span className="text-[17px] font-bold">{t.cancelTitle}</span>
                    <button onClick={onClose} className="text-[#007aff] font-semibold text-[15px]">{t.cancelDone}</button>
                </div>
                <div className="overflow-y-auto p-5 flex flex-col gap-4 pb-8">
                    <p className="text-[12px] uppercase tracking-wide font-semibold text-gray-400 pl-1">{t.cancelMainReasons}</p>
                    {reasons.length === 0 ? (
                        <div className="bg-white rounded-xl px-4 py-3 border border-black/5">
                            <p className="text-[14px] text-gray-400 text-center">{t.noData || 'No data yet'}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {reasons.map((r, i) => (
                                <div key={i} className="bg-white rounded-xl px-4 py-3 flex justify-between items-center border border-black/5">
                                    <span className="text-[14px] font-semibold text-gray-800">{r.label}</span>
                                    <span className="text-[13px] text-gray-400 font-medium">{r.pct} ({r.count})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


// ─── Meetings breakdown — HTML style ─────────────────────────────────────────
function MeetingsSection({ successful, active, cancelled, t, onCancelledClick }) {
    const total = successful + active + cancelled
    return (
        <Card className="p-4 flex flex-col gap-3">
            <div className="flex justify-between text-[12px] uppercase tracking-wide font-semibold text-gray-400">
                <span>{t.totalMatches}</span>
                <span className="text-gray-900 font-extrabold text-[18px] leading-none">{total.toLocaleString()}</span>
            </div>
            <div className="flex gap-2 mt-1">
                <div className="flex-1 flex flex-col items-center py-3 rounded-xl bg-[#f0fdf4]">
                    <span className="text-[22px] font-extrabold text-[#34c759]">{successful.toLocaleString()}</span>
                    <span className="text-[11px] font-semibold text-gray-400 mt-0.5">{t.successful}</span>
                </div>
                <div className="flex-1 flex flex-col items-center py-3 rounded-xl bg-[#f0f8ff]">
                    <span className="text-[22px] font-extrabold text-[#007aff]">{active.toLocaleString()}</span>
                    <span className="text-[11px] font-semibold text-gray-400 mt-0.5">Active</span>
                </div>
                <button
                    onClick={onCancelledClick}
                    className="flex-1 flex flex-col items-center py-3 rounded-xl bg-[#fff1f0] active:opacity-70 transition-opacity"
                >
                    <span className="text-[22px] font-extrabold text-[#ff3b30]">{cancelled.toLocaleString()}</span>
                    <span className="text-[11px] font-semibold text-gray-400 mt-0.5">{t.cancelled} ➔</span>
                </button>
            </div>
        </Card>
    )
}

// ─── Gender split — HTML style ────────────────────────────────────────────────
function GenderBar({ men, women, total, t }) {
    const menPct = total ? Math.round(men / total * 100) : 50
    const womenPct = 100 - menPct
    return (
        <Card className="p-4 flex flex-col gap-3">
            <div className="flex justify-between text-[13px] font-semibold text-gray-700">
                <span>🙋‍♂️ {t.men}: <b>{men}</b></span>
                <span>🙋‍♀️ {t.women}: <b>{women}</b></span>
            </div>
            <div className="h-2 bg-[#e5e5ea] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#007aff] transition-all duration-500" style={{ width: `${menPct}%` }} />
                <div className="h-full bg-[#ff2d55] transition-all duration-500" style={{ width: `${womenPct}%` }} />
            </div>
            <div className="flex justify-between">
                <span className="text-[11px] text-[#007aff] font-semibold">{menPct}%</span>
                <span className="text-[11px] text-[#ff2d55] font-semibold">{womenPct}%</span>
            </div>
        </Card>
    )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { lang } = useAdmin()
    const [incomeTab, setIncomeTab] = useState('week')
    const [showCancelModal, setShowCancelModal] = useState(false)

    const t = getT('dashboard', lang)

    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-dashboard', incomeTab],
        queryFn: () => getDashboardStats(incomeTab),
        staleTime: 60 * 1000, // 1 min for dashboard
    })

    if (isLoading && !stats) return <DashboardSkeleton />

    const incomeTabs = [
        { id: 'today', label: t.today },
        { id: 'week', label: t.week },
        { id: 'month', label: t.month },
        { id: 'year', label: t.year },
    ]

    return (
        <div className="px-4 py-4 flex flex-col gap-5 pb-8">

            {showCancelModal && (
                <CancelledModal onClose={() => setShowCancelModal(false)} t={t} cancelReasons={stats.cancelReasons} />
            )}

            {/* ── Revenue ── */}
            <div>
                <SectionLabel>{t.income}</SectionLabel>
                <Card className="p-4">
                    <SegmentedControl tabs={incomeTabs} value={incomeTab} onChange={setIncomeTab} />
                    <div className="mt-4 mb-1">
                        <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">{t.revenue}</p>
                        <p className="text-[32px] font-extrabold text-gray-900 leading-tight">
                            {`HK$ ${stats.totalRevenue.toLocaleString()}`}
                        </p>
                    </div>
                    <RevenueChart data={stats.revenueByDay} label={t.revenue} />
                </Card>
            </div>

            {/* ── Key stats grid — HTML: Members Overview ── */}
            <div>
                <SectionLabel>{t.membersOverview || 'Members Overview'}</SectionLabel>
                {/* Full-width: total members + gender bar */}
                <Card className="p-4 mb-3 flex flex-col gap-2">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">{t.totalMembers}</p>
                    <p className="text-[26px] font-extrabold text-gray-900 leading-none">{stats.totalMembers.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-[12px] text-gray-400">
                        <span className="text-[#34c759] font-semibold">↑ +{stats.newThisWeek}</span>
                        <span>{t.newThisWeek}</span>
                        {stats.growthPct > 0 && (
                            <span className="ml-2 text-[#34c759] font-semibold">· {stats.growthPct}% vs last month</span>
                        )}
                    </div>
                    <div className="flex justify-between text-[13px] font-semibold text-gray-700 mt-1">
                        <span>🙋‍♂️ {t.men}: <b>{stats.men}</b></span>
                        <span>🙋‍♀️ {t.women}: <b>{stats.women}</b></span>
                    </div>
                    <div className="h-2 bg-[#e5e5ea] rounded-full overflow-hidden flex">
                        <div className="h-full bg-[#007aff] transition-all duration-500"
                            style={{ width: `${stats.totalMembers ? Math.round(stats.men / stats.totalMembers * 100) : 50}%` }} />
                        <div className="h-full bg-[#ff2d55] transition-all duration-500"
                            style={{ width: `${stats.totalMembers ? Math.round(stats.women / stats.totalMembers * 100) : 50}%` }} />
                    </div>
                </Card>
                {/* 2-col: active + new today */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard icon={TrendingUp} label={t.active}
                        value={stats.activeMembers.toLocaleString()}
                        sub={`${Math.round(stats.activeMembers / (stats.totalMembers || 1) * 100)}% ${t.ofTotal || 'of total'}`}
                        color="#34c759" />
                    <StatCard icon={Users} label={lang === 'ru' ? 'Новых сегодня' : lang === 'zh' ? '今日新增' : 'New Today'}
                        value={`+${stats.newToday ?? stats.newThisWeek}`}
                        sub={stats.newToday > 0 ? (lang === 'ru' ? 'Растём быстро!' : lang === 'zh' ? '增长迅速！' : 'Growing fast!') : ''}
                        color="#007aff" />
                </div>
            </div>

            {/* ── New members bar chart ── */}
            <div>
                <SectionLabel>{t.newMembers}</SectionLabel>
                <Card className="p-4">
                    <MembersChart data={stats.membersByDay} label={t.newMembersLabel} />
                </Card>
            </div>

            {/* ── Meetings donut + cancelled modal ── */}
            <div>
                <SectionLabel>{t.meetings}</SectionLabel>
                <MeetingsSection
                    successful={stats.successfulMatches}
                    active={stats.activeMatches}
                    cancelled={stats.cancelledMatches}
                    t={t}
                    onCancelledClick={() => setShowCancelModal(true)}
                />
            </div>

            {/* ── Meeting satisfaction ratings (real data) ── */}
            <div>
                <SectionLabel>{t.ratingTitle}</SectionLabel>
                <MeetingRatings t={t} ratings={stats.ratings} />
            </div>

            {/* ── Gender split ── */}
            <div>
                <SectionLabel>{t.genderDist}</SectionLabel>
                <GenderBar men={stats.men} women={stats.women} total={stats.totalMembers} t={t} />
            </div>

        </div>
    )
}
