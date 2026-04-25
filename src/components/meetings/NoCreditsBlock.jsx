// HTML: meetings.html → #no-cups-content
import { useTranslation } from 'react-i18next'

export default function NoCreditsBlock({ onTopUp }) {
    const { t } = useTranslation()
    return (
        <div style={{
            background: 'var(--app-card)', borderRadius: 20,
            padding: '28px 20px', border: '0.5px solid var(--app-border)',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 50, marginBottom: 16 }}>😔</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--app-text)', marginBottom: 8 }}>
                {t('no_cups_title')}
            </div>
            <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.4, marginBottom: 20 }}>
                {t('no_cups_hint')}
            </div>
            <button onClick={onTopUp} style={{
                width: '100%', padding: 14, borderRadius: 14, border: 'none',
                background: 'linear-gradient(45deg, #007aff, #00c6ff)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
            }}>
                {t('topup_balance')}
            </button>
        </div>
    )
}
