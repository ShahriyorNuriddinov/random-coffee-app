import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie,
} from 'recharts'
import { CheckCircle, XCircle } from 'lucide-react'
import Card from '../ui/Card'

const tooltipStyle = {
    contentStyle: { borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13, padding: '8px 12px' },
    cursor: { fill: 'rgba(0,0,0,0.04)' },
}

// ─── Revenue area chart ───────────────────────────────────────────────────────
export function RevenueChart({ data, label }) {
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
export function MembersChart({ data, label }) {
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

// ─── Meeting satisfaction ratings ────────────────────────────────────────────
export function MeetingRatings({ t }) {
    const ratings = [
        { label: t.ratingExcellent, pct: 57.5, color: '#34c759' },
        { label: t.ratingGood, pct: 28.7, color: '#007aff' },
        { label: t.ratingNormal, pct: 9.7, color: '#ff9500' },
        { label: t.ratingBad, pct: 4.1, color: '#ff3b30' },
    ]
    return (
        <Card className="p-4 flex flex-col gap-3">
            {ratings.map((r, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[13px] font-semibold">
                        <span className="text-gray-700">{r.label}</span>
                        <span className="text-gray-400">{r.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                </div>
            ))}
        </Card>
    )
}

// ─── Meetings donut + legend ──────────────────────────────────────────────────
export function MeetingsSection({ successful, cancelled, t, onCancelledClick }) {
    const data = [
        { name: t.successful, value: successful, fill: '#34c759' },
        { name: t.cancelled, value: cancelled, fill: '#ff3b30' },
    ]
    const isEmpty = successful === 0 && cancelled === 0
    const displayData = isEmpty ? [{ name: 'empty', value: 1, fill: '#e5e5ea' }] : data

    return (
        <Card className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0">
                <ResponsiveContainer width={110} height={110}>
                    <PieChart>
                        <Pie data={displayData} cx="50%" cy="50%" innerRadius={32} outerRadius={52}
                            dataKey="value" paddingAngle={isEmpty ? 0 : 4} strokeWidth={0} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-[#34c759] flex-shrink-0" />
                    <div>
                        <p className="text-[12px] font-semibold text-gray-500">{t.successful}</p>
                        <p className="text-[22px] font-extrabold text-gray-900 leading-none">{successful}</p>
                    </div>
                </div>
                <button onClick={onCancelledClick} className="flex items-center gap-2 active:opacity-60 transition-opacity text-left">
                    <XCircle size={16} className="text-[#ff3b30] flex-shrink-0" />
                    <div>
                        <p className="text-[12px] font-semibold text-gray-500">{t.cancelled} ➔</p>
                        <p className="text-[22px] font-extrabold text-gray-900 leading-none">{cancelled}</p>
                    </div>
                </button>
            </div>
        </Card>
    )
}

// ─── Gender split bar ─────────────────────────────────────────────────────────
export function GenderBar({ men, women, total, t }) {
    const menPct = total ? Math.round(men / total * 100) : 50
    const womenPct = total ? Math.round(women / total * 100) : 50
    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-semibold text-gray-700">🙋‍♂️ {t.men}: <b>{men}</b></span>
                <span className="text-[14px] font-semibold text-gray-700">🙋‍♀️ {t.women}: <b>{women}</b></span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-[#007aff] transition-all duration-500" style={{ width: `${menPct}%` }} />
                <div className="h-full bg-[#ff2d55] transition-all duration-500" style={{ width: `${womenPct}%` }} />
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-[11px] text-[#007aff] font-semibold">{menPct}%</span>
                <span className="text-[11px] text-[#ff2d55] font-semibold">{womenPct}%</span>
            </div>
        </Card>
    )
}

// ─── Cancelled meetings modal ─────────────────────────────────────────────────
export function CancelledModal({ onClose, t }) {
    const reasons = [
        { label: t.cancelR1, count: '40%' },
        { label: t.cancelR2, count: '30%' },
        { label: t.cancelR3, count: '15%' },
        { label: t.cancelR4, count: '10%' },
    ]
    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#f2f4f7] rounded-t-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-black/5 rounded-t-2xl">
                    <span className="text-[17px] font-bold">{t.cancelTitle}</span>
                    <button onClick={onClose} className="text-[#007aff] font-semibold text-[15px]">{t.cancelDone}</button>
                </div>
                <div className="overflow-y-auto p-5 flex flex-col gap-4 pb-8">
                    <p className="text-[12px] uppercase tracking-wide font-semibold text-gray-400 pl-1">{t.cancelMainReasons}</p>
                    <div className="flex flex-col gap-2">
                        {reasons.map((r, i) => (
                            <div key={i} className="bg-white rounded-xl px-4 py-3 flex justify-between items-center border border-black/5">
                                <span className="text-[14px] font-semibold text-gray-800">{r.label}</span>
                                <span className="text-[13px] text-gray-400 font-medium">{r.count}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[12px] uppercase tracking-wide font-semibold text-gray-400 pl-1 mt-2">{t.cancelFeedback}</p>
                    <div className="bg-white rounded-xl p-4 border border-black/5 flex flex-col gap-1">
                        <span className="text-[13px] font-bold text-[#007aff]">@user_example</span>
                        <p className="text-[14px] text-gray-600 leading-relaxed">{t.cancelFeedbackText}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
