import LangSwitcher from '@/components/LangSwitcher'
import DarkToggle from '@/components/DarkToggle'

/**
 * Reusable top header for main screens
 * @param {string} title
 * @param {ReactNode} right - optional extra content on the right
 */
export default function ScreenHeader({ title, right }) {
    return (
        <div style={{
            background: 'var(--app-card)',
            padding: '16px 20px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '0.5px solid var(--app-border)',
            flexShrink: 0,
        }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: 'var(--app-text)' }}>
                {title}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {right}
                <DarkToggle />
                <LangSwitcher />
            </div>
        </div>
    )
}
