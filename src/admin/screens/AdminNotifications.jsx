import { useEffect, useState } from 'react'
import { UserPlus, FileText, CreditCard, Shuffle, AlertTriangle, ChevronRight, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import Spinner from '../components/ui/Spinner'
import MemberSheet from '../components/members/MemberSheet'

// ─── i18n ─────────────────────────────────────────────────────────────────────
const NOTIF_I18N = {
    en: {
        title: 'Live Notifications',
        all: 'All Events',
        profile: 'Profiles',
        finance: 'Finance',
        meet: 'Meetings',
        post: 'Content',
        alert: 'Alerts',
        viewProfile: 'View Profile',
        viewInvoice: 'View Invoice',
        viewMatch: 'View Match',
        authorProfile: 'Author Profile',
        investigate: 'Investigate',
        approve: 'Approve',
        reject: 'Reject',
        banUser: 'Ban User',
        noItems: 'No notifications.',
        badges: { profile: 'Profile', finance: 'Finance', meet: 'Meetings', post: 'Moments', alert: 'Alert' },
    },
    zh: {
        title: '实时通知',
        all: '全部事件',
        profile: '用户',
        finance: '财务',
        meet: '会议',
        post: '内容',
        alert: '警报',
        viewProfile: '查看资料',
        viewInvoice: '查看发票',
        viewMatch: '查看匹配',
        authorProfile: '作者资料',
        investigate: '调查',
        approve: '通过',
        reject: '拒绝',
        banUser: '封禁用户',
        noItems: '暂无通知。',
        badges: { profile: '用户', finance: '财务', meet: '会议', post: '动态', alert: '警报' },
    },
}

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = ['all', 'profile', 'finance', 'meet', 'post', 'alert']

const ICON_CONFIG = {
    profile: { icon: UserPlus, bg: 'rgba(0,122,255,0.1)', color: '#007aff' },
    finance: { icon: CreditCard, bg: 'rgba(52,199,89,0.1)', color: '#34c759' },
    meet: { icon: Shuffle, bg: 'rgba(255,149,0,0.1)', color: '#ff9500' },
    post: { icon: FileText, bg: 'rgba(88,86,214,0.1)', color: '#5856d6' },
    alert: { icon: AlertTriangle, bg: 'rgba(255,59,48,0.1)', color: '#ff3b30' },
}

const BADGE_COLORS = {
    profile: 'bg-blue-50 text-[#007aff]',
    finance: 'bg-green-50 text-[#34c759]',
    meet: 'bg-orange-50 text-[#ff9500]',
    post: 'bg-purple-50 text-[#5856d6]',
    alert: 'bg-red-50 text-[#ff3b30]',
}

// ─── Build notifications from real Supabase data ──────────────────────────────
const buildNotifications = (profiles, matches, moments, payments) => {
    const notifs = []

    // New registrations (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    profiles
        .filter(p => new Date(p.created_at) > weekAgo)
        .slice(0, 5)
        .forEach(p => {
            notifs.push({
                id: `reg-${p.id}`,
                category: 'profile',
                title_en: 'New Registration',
                title_zh: '新用户注册',
                desc_en: `User ${p.name || p.email?.split('@')[0] || 'Unknown'} registered. Email: ${p.email || '—'}`,
                desc_zh: `用户 ${p.name || p.email?.split('@')[0] || '未知'} 已注册。邮箱：${p.email || '—'}`,
                time: p.created_at,
                link_en: 'View Profile',
                link_zh: '查看资料',
                userId: p.id,
            })
        })

    // Pending moments
    moments
        .filter(m => !m.status || m.status === 'pending')
        .slice(0, 5)
        .forEach(m => {
            notifs.push({
                id: `moment-${m.id}`,
                category: 'post',
                title_en: 'Post Pending Moderation',
                title_zh: '动态待审核',
                desc_en: `${m.author?.name || 'User'} created a new post. Needs approval.`,
                desc_zh: `${m.author?.name || '用户'} 发布了新动态，需要审核。`,
                time: m.created_at,
                link_en: 'Author Profile',
                link_zh: '作者资料',
                momentId: m.id,
                needsModeration: true,
            })
        })

    // Recent payments
    payments.slice(0, 3).forEach(p => {
        notifs.push({
            id: `pay-${p.id}`,
            category: 'finance',
            title_en: 'Subscription Purchased',
            title_zh: '订阅已购买',
            desc_en: `User purchased a plan for HK$ ${p.amount}. ${p.credits} cups credited.`,
            desc_zh: `用户购买了 HK$ ${p.amount} 的套餐，已充值 ${p.credits} 杯。`,
            time: p.created_at,
            link_en: 'View Invoice',
            link_zh: '查看发票',
        })
    })

    // Recent matches
    matches.slice(0, 3).forEach(m => {
        const u1 = m.user1?.name || 'User A'
        const u2 = m.user2?.name || 'User B'
        notifs.push({
            id: `match-${m.id}`,
            category: 'meet',
            title_en: 'Successful Match!',
            title_zh: '匹配成功！',
            desc_en: `AI matched ${u1} and ${u2} for a coffee meeting.`,
            desc_zh: `AI 成功将 ${u1} 和 ${u2} 匹配为咖啡会面。`,
            time: m.created_at,
            link_en: 'View Match',
            link_zh: '查看匹配',
        })
    })

    // Sort by time descending
    return notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
}

// ─── Time formatter ───────────────────────────────────────────────────────────
const formatTime = (iso, lang = 'en') => {
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return lang === 'zh' ? '刚刚' : 'Just now'
    if (diff < 3600) return lang === 'zh' ? `${Math.floor(diff / 60)}分钟前` : `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return lang === 'zh' ? `${Math.floor(diff / 3600)}小时前` : `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString()
}

// ─── Single notification card ─────────────────────────────────────────────────
function NotifCard({ notif, lang, onApprove, onBan, onViewProfile }) {
    const t = NOTIF_I18N[lang]
    const cfg = ICON_CONFIG[notif.category] || ICON_CONFIG.profile
    const Icon = cfg.icon
    const title = lang === 'zh' ? notif.title_zh : notif.title_en
    const desc = lang === 'zh' ? notif.desc_zh : notif.desc_en
    const link = lang === 'zh' ? notif.link_zh : notif.link_en
    const badge = t.badges[notif.category] || notif.category

    return (
        <div className="bg-white rounded-2xl border border-black/[0.08] p-4 flex gap-3 shadow-sm">
            {/* Icon box */}
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.bg }}
            >
                <Icon size={18} style={{ color: cfg.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-[15px] font-bold text-gray-900 leading-tight">{title}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{formatTime(notif.time, lang)}</p>
                    </div>
                    {/* Eye icon for posts */}
                    {notif.category === 'post' && (
                        <button className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Eye size={16} className="text-[#007aff]" />
                        </button>
                    )}
                </div>

                <p className="text-[13px] text-gray-600 leading-relaxed">{desc}</p>

                {/* Moderation actions for pending posts */}
                {notif.needsModeration && (
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => onApprove?.(notif.momentId)}
                            className="flex-1 py-2.5 bg-[#34c759] text-white rounded-xl text-[13px] font-bold active:scale-[0.97] transition-all"
                        >
                            {t.approve}
                        </button>
                        <button
                            onClick={() => toast(lang === 'en' ? 'Open Moments tab to reject' : '请在动态页面拒绝')}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-[13px] font-bold active:scale-[0.97] transition-all"
                        >
                            {t.reject}
                        </button>
                    </div>
                )}

                {/* Alert ban action */}
                {notif.category === 'alert' && (
                    <div className="mt-2">
                        <button
                            onClick={() => onBan?.(notif.userId)}
                            className="py-2.5 px-4 bg-red-50 text-red-500 rounded-xl text-[13px] font-bold active:scale-[0.97] transition-all"
                        >
                            {t.banUser}
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-1">
                    <button
                        onClick={() => notif.userId && onViewProfile?.(notif.userId)}
                        className="flex items-center gap-1 text-[12px] font-semibold text-[#007aff] active:opacity-60"
                    >
                        {link} <ChevronRight size={12} />
                    </button>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${BADGE_COLORS[notif.category]}`}>
                        {badge}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AdminNotifications() {
    const { lang } = useAdmin()
    const [notifs, setNotifs] = useState([])
    const [filter, setFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const [selectedMemberId, setSelectedMemberId] = useState(null)

    const t = NOTIF_I18N[lang]

    const loadData = async () => {
        try {
            const [profilesRes, matchesRes, momentsRes, paymentsRes] = await Promise.all([
                supabase.from('profiles').select('id, name, email, created_at').order('created_at', { ascending: false }).limit(20),
                supabase.from('matches').select('id, created_at, user1:user1_id(id,name), user2:user2_id(id,name)').order('created_at', { ascending: false }).limit(10),
                supabase.from('moments').select('id, text, created_at, status, author:user_id(id,name,avatar_url)').order('created_at', { ascending: false }).limit(10),
                supabase.from('payments').select('id, amount, credits, created_at').order('created_at', { ascending: false }).limit(10),
            ])
            const built = buildNotifications(
                profilesRes.data || [],
                matchesRes.data || [],
                momentsRes.data || [],
                paymentsRes.data || [],
            )
            setNotifs(built)
        } catch (err) {
            console.error('[AdminNotifications] load error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()

        // ── Realtime subscriptions ────────────────────────────────
        const channels = [
            supabase.channel('rt_moments_notif')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'moments' }, () => loadData())
                .subscribe(),
            supabase.channel('rt_profiles_notif')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => loadData())
                .subscribe(),
            supabase.channel('rt_matches_notif')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, () => loadData())
                .subscribe(),
            supabase.channel('rt_payments_notif')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, () => loadData())
                .subscribe(),
        ]

        return () => channels.forEach(c => supabase.removeChannel(c))
    }, [])

    const handleApprove = async (momentId) => {
        const { error } = await supabase.from('moments').update({ status: 'approved' }).eq('id', momentId)
        if (!error) {
            // Give +1 credit to the post author
            const { data: moment } = await supabase
                .from('moments').select('user_id').eq('id', momentId).single()
            if (moment?.user_id) {
                const { data: profile } = await supabase
                    .from('profiles').select('coffee_credits').eq('id', moment.user_id).single()
                if (profile) {
                    const newCredits = (profile.coffee_credits ?? 0) + 1
                    await supabase.from('profiles').update({
                        coffee_credits: newCredits,
                        subscription_status: 'active',
                        updated_at: new Date().toISOString(),
                    }).eq('id', moment.user_id)
                }
            }
            toast.success(lang === 'en' ? 'Approved!' : '已通过！')
            setNotifs(n => n.filter(x => x.momentId !== momentId))
        }
    }

    const handleBan = async (userId) => {
        if (!userId) return
        const msg = lang === 'en' ? 'Ban this user?' : '确定封禁该用户？'
        if (!confirm(msg)) return
        const { error } = await supabase.from('profiles').update({ banned: true }).eq('id', userId)
        if (!error) {
            toast.success(lang === 'en' ? 'User banned.' : '用户已封禁。')
            setNotifs(n => n.filter(x => x.userId !== userId))
        } else {
            toast.error(error.message)
        }
    }

    const filtered = filter === 'all' ? notifs : notifs.filter(n => n.category === filter)

    return (
        <div className="flex flex-col h-full">
            {/* MemberSheet overlay */}
            {selectedMemberId && (
                <MemberSheet
                    memberId={selectedMemberId}
                    onClose={() => setSelectedMemberId(null)}
                    lang={lang}
                />
            )}

            {/* Filter tabs — horizontal scroll */}
            <div className="bg-white border-b border-black/5 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${filter === cat
                            ? 'bg-gray-900 text-white'
                            : 'bg-black/[0.06] text-gray-600'
                            }`}
                    >
                        {t[cat]}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-8">
                {loading ? (
                    <div className="flex items-center justify-center h-40"><Spinner size={8} /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center text-gray-400 py-16 text-[14px]">{t.noItems}</div>
                ) : (
                    filtered.map(notif => (
                        <NotifCard
                            key={notif.id}
                            notif={notif}
                            lang={lang}
                            onApprove={handleApprove}
                            onBan={handleBan}
                            onViewProfile={setSelectedMemberId}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
