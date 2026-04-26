// Admin bottom navigation bar — 6 tabs including Notifications
import { LayoutDashboard, Users, Image, Newspaper, Bell, Settings } from 'lucide-react'
import { getT } from '../i18n'

const TABS = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'members', icon: Users },
    { id: 'moments', icon: Image },
    { id: 'news', icon: Newspaper },
    { id: 'notifications', icon: Bell },
    { id: 'settings', icon: Settings },
]

export default function AdminBottomNav({ tab, setTab, lang, unreadCount = 0 }) {
    const t = getT('nav', lang)

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-black/5 flex justify-around pt-2 pb-6 z-10">
            {TABS.map(({ id, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex flex-col items-center gap-[3px] flex-1 text-[10px] font-semibold transition-colors ${tab === id ? 'text-[#007aff]' : 'text-[#a2a2a7]'
                        }`}
                >
                    <div className="relative">
                        <Icon size={20} strokeWidth={2} />
                        {id === 'notifications' && unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: -5, right: -7,
                                background: '#ff3b30', color: '#fff',
                                fontSize: 9, fontWeight: 800,
                                minWidth: 16, height: 16, borderRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 3px', lineHeight: 1,
                            }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <span>{t[id]}</span>
                </button>
            ))}
        </div>
    )
}
