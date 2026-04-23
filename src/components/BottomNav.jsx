import { useApp } from '@/store/useAppStore'
import { useTranslation } from 'react-i18next'

const tabs = [
    { key: 'moments', icon: '▦', labelKey: 'nav_moments' },
    { key: 'people', icon: '👥', labelKey: 'nav_people' },
    { key: 'meetings', icon: '☕', labelKey: 'nav_meet' },
    { key: 'faq', icon: '?', labelKey: 'nav_faq' },
    { key: 'profile', icon: '👤', labelKey: 'nav_profile' },
]

export default function BottomNav({ active }) {
    const { setScreen } = useApp()
    const { t } = useTranslation()

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            backgroundColor: 'var(--app-card)',
            backdropFilter: 'blur(10px)',
            borderTop: '0.5px solid var(--app-border)',
            display: 'flex',
            padding: '6px 0 20px',
            zIndex: 10,
        }}>
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setScreen(tab.key)}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2, flex: 1, minWidth: 0,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: active === tab.key ? 'var(--app-primary)' : '#a2a2a7',
                        fontSize: 9, fontWeight: 600, fontFamily: 'inherit',
                        transition: 'color 0.15s',
                        padding: '4px 2px',
                    }}
                >
                    <span style={{ fontSize: 18, lineHeight: 1, marginBottom: 2 }}>{tab.icon}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {t(tab.labelKey)}
                    </span>
                </button>
            ))}
        </div>
    )
}
