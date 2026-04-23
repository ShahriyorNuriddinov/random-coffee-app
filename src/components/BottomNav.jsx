import { useApp } from '@/store/useAppStore'
import { useTranslation } from 'react-i18next'

// CSS-based icons matching the HTML version exactly
function IconMoments() {
    return (
        <div style={{ width: 24, height: 24, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
                width: 16, height: 11,
                border: '2px solid currentColor',
                borderRadius: 3,
                position: 'absolute', top: 6, left: 4,
            }} />
        </div>
    )
}

function IconPeople() {
    return (
        <div style={{ width: 24, height: 24, position: 'relative' }}>
            {/* First user head */}
            <div style={{
                width: 6, height: 6,
                border: '2px solid currentColor', borderRadius: '50%',
                position: 'absolute', top: 2, left: 3,
            }} />
            {/* First user body */}
            <div style={{
                width: 10, height: 5,
                border: '2px solid currentColor',
                borderRadius: '4px 4px 0 0', borderBottom: 0,
                position: 'absolute', bottom: 3, left: 1,
            }} />
            {/* Second user head */}
            <div style={{
                width: 5, height: 5,
                border: '2px solid currentColor', borderRadius: '50%',
                position: 'absolute', top: 4, right: 3,
            }} />
            {/* Second user body */}
            <div style={{
                width: 8, height: 4,
                border: '2px solid currentColor',
                borderRadius: '4px 4px 0 0', borderBottom: 0,
                position: 'absolute', bottom: 5, right: 1,
            }} />
        </div>
    )
}

function IconMeet() {
    return (
        <div style={{ width: 24, height: 24, position: 'relative' }}>
            {/* Cup body */}
            <div style={{
                width: 14, height: 10,
                border: '2px solid currentColor',
                borderRadius: '0 0 6px 6px',
                position: 'absolute', bottom: 4, left: 3,
            }} />
            {/* Cup handle */}
            <div style={{
                width: 4, height: 6,
                border: '2px solid currentColor',
                borderRadius: '0 3px 3px 0', borderLeft: 0,
                position: 'absolute', bottom: 6, right: 2,
            }} />
            {/* Steam */}
            <div style={{
                fontSize: 10, color: 'currentColor',
                position: 'absolute', top: 2, left: 8,
                lineHeight: 1,
            }}>~</div>
        </div>
    )
}

function IconFaq() {
    return (
        <div style={{ width: 24, height: 24, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'currentColor', lineHeight: 1 }}>?</span>
        </div>
    )
}

function IconProfile() {
    return (
        <div style={{ width: 24, height: 24, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Circle outline */}
            <div style={{
                width: 18, height: 18,
                border: '2px solid currentColor', borderRadius: '50%',
                position: 'absolute',
            }} />
            {/* Head dot */}
            <div style={{
                width: 6, height: 6,
                background: 'currentColor', borderRadius: '50%',
                position: 'absolute', top: 5, left: 9,
            }} />
            {/* Shoulders */}
            <div style={{
                width: 10, height: 4,
                background: 'currentColor',
                borderRadius: '4px 4px 0 0',
                position: 'absolute', bottom: 3, left: 7,
            }} />
        </div>
    )
}

const ICON_MAP = {
    moments: <IconMoments />,
    people: <IconPeople />,
    meetings: <IconMeet />,
    faq: <IconFaq />,
    profile: <IconProfile />,
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
                            fontSize: 10, fontWeight: 600,
                            fontFamily: 'inherit',
                            transition: 'color 0.15s',
                            padding: '2px 0',
                            textDecoration: 'none',
                        }}
                    >
                        {ICON_MAP[tab.key]}
                        <span>{t(tab.labelKey)}</span>
                    </button>
                )
            })}
        </div>
    )
}
