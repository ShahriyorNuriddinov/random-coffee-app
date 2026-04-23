import { useApp } from '@/store/useAppStore'
import { useTranslation } from 'react-i18next'

// Telegram-style clean SVG icons
const icons = {
    moments: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    people: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="3" />
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            <circle cx="17" cy="8" r="2.5" />
            <path d="M21 20c0-2.8-1.8-5.1-4-5.8" />
        </svg>
    ),
    meetings: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="2" x2="6" y2="4" />
            <line x1="10" y1="2" x2="10" y2="4" />
            <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
    ),
    faq: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.5-2.4 4" />
            <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
        </svg>
    ),
    profile: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    ),
}

const tabs = [
    { key: 'moments', labelKey: 'nav_moments' },
    { key: 'people', labelKey: 'nav_people' },
    { key: 'meetings', labelKey: 'nav_meet' },
    { key: 'faq', labelKey: 'nav_faq' },
    { key: 'profile', labelKey: 'nav_profile' },
]

export default function BottomNav({ active }) {
    const { setScreen } = useApp()
    const { t } = useTranslation()

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            backgroundColor: 'var(--app-card)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderTop: '0.5px solid var(--app-border)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 0 24px',
            zIndex: 10,
        }}>
            {tabs.map(tab => {
                const isActive = active === tab.key
                return (
                    <button
                        key={tab.key}
                        onClick={() => setScreen(tab.key)}
                        style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 3,
                            flex: 1,
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: isActive ? 'var(--app-primary)' : '#a2a2a7',
                            fontSize: 10, fontWeight: isActive ? 700 : 500,
                            fontFamily: 'inherit',
                            transition: 'color 0.15s',
                            padding: '2px 0',
                        }}
                    >
                        <div style={{
                            width: 24, height: 24,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            strokeWidth: isActive ? 2.2 : 1.8,
                        }}>
                            {icons[tab.key]}
                        </div>
                        <span>{t(tab.labelKey)}</span>
                    </button>
                )
            })}
        </div>
    )
}
