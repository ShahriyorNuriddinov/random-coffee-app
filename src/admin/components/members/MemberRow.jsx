import PropTypes from 'prop-types'
import { ChevronRight } from 'lucide-react'
import { getT } from '../../i18n'
import Avatar, { getAvatarColor } from '../ui/Avatar'
import Card from '../ui/Card'

// ─── Single member row ────────────────────────────────────────────────────────
export function MemberRow({ member, onClick, lang, isLast }) {
    const t = getT('members', lang)
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 text-left active:bg-black/[0.02] transition-colors ${!isLast ? 'border-b border-black/5' : ''}`}
        >
            <div className="flex items-center gap-3">
                <Avatar name={member.name} url={member.avatar_url} size={36} color={getAvatarColor(member.id)} />
                <div>
                    <p className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                        {member.name || '—'}
                        {member.banned && (
                            <span className="text-[10px] bg-red-100 text-red-500 font-bold px-1.5 py-0.5 rounded">BAN</span>
                        )}
                    </p>
                    <p className="text-[12px] text-gray-400">{member.email || member.region || '—'}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${member.subscription_status === 'active'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                    }`}>
                    {member.subscription_status === 'active' ? t.active : t.free}
                </span>
                <ChevronRight size={16} className="text-gray-300" />
            </div>
        </button>
    )
}

// ─── Members grouped by date: Today / Yesterday / Earlier ────────────────────
export function GroupedMemberList({ members, onSelect, lang }) {
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    const groups = [
        { label: lang === 'en' ? 'Today' : '今日', items: members.filter(m => new Date(m.created_at).toDateString() === today) },
        { label: lang === 'en' ? 'Yesterday' : '昨日', items: members.filter(m => new Date(m.created_at).toDateString() === yesterday) },
        { label: lang === 'en' ? 'Earlier' : '更早', items: members.filter(m => { const d = new Date(m.created_at).toDateString(); return d !== today && d !== yesterday }) },
    ].filter(g => g.items.length > 0)

    if (groups.length === 0) {
        return (
            <Card>
                {members.map((m, i) => (
                    <MemberRow key={m.id} member={m} onClick={() => onSelect(m.id)} lang={lang} isLast={i === members.length - 1} />
                ))}
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {groups.map(group => (
                <div key={group.label}>
                    <p className="text-[12px] uppercase tracking-wide font-semibold text-gray-400 mb-2 pl-1">{group.label}</p>
                    <Card>
                        {group.items.map((m, i) => (
                            <MemberRow key={m.id} member={m} onClick={() => onSelect(m.id)} lang={lang} isLast={i === group.items.length - 1} />
                        ))}
                    </Card>
                </div>
            ))}
        </div>
    )
}

MemberRow.propTypes = {
    member: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        avatar_url: PropTypes.string,
        region: PropTypes.string,
        subscription_status: PropTypes.string,
        banned: PropTypes.bool,
    }).isRequired,
    onClick: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
    isLast: PropTypes.bool,
}

GroupedMemberList.propTypes = {
    members: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
}
