import { Trash2 } from 'lucide-react'
import { getT } from '../../i18n'

export default function StaffRow({ member, onRemove, lang, isLast }) {
    const t = getT('settings', lang)
    return (
        <div className={`flex items-center justify-between px-4 py-3 ${!isLast ? 'border-b border-black/5' : ''}`}>
            <div>
                <p className="text-[15px] font-semibold text-gray-900">{member.name}</p>
                <p className="text-[12px] text-gray-400">{member.email || member.phone}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg uppercase ${member.role === 'admin' ? 'bg-blue-100 text-[#007aff]' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {member.role === 'admin' ? t.admin : t.moderator}
                </span>
                <button onClick={() => onRemove(member.id, member.name)} className="text-red-400 active:scale-90 transition-transform">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}
