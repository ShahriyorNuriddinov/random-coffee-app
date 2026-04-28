// HTML: meetings.html → #searching-content
import { useTranslation } from 'react-i18next'

export default function SearchingBlock({ onPeople, onBoost, boosting, filters }) {
    const { t } = useTranslation()
    const hasFilters = filters && (
        (filters.regions?.length > 0) ||
        (filters.langs?.length > 0) ||
        !!filters.prompt?.trim()
    )

    return (
        <div style={{
            background: 'var(--app-card)', borderRadius: 20,
            padding: '30px 16px', border: '0.5px solid var(--app-border)',
            textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}>
            <div style={{
                width: 40, height: 40,
                border: '3px solid rgba(0,122,255,0.1)',
                borderTop: '3px solid var(--app-primary)',
                borderRadius: '50%', margin: '0 auto 16px',
                animation: 'spin 1s linear infinite',
            }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--app-text)', marginBottom: 8 }}>
                {t('searching_title')}
            </div>
            <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.4, marginBottom: 24 }}>
                {t('searching_hint')}
            </div>

            {/* Active filter indicator — HTML: .prompt-indicator */}
            {hasFilters && (
                <div style={{
                    background: 'rgba(0,122,255,0.05)',
                    border: '0.5px solid rgba(0,122,255,0.15)',
                    borderRadius: 12, padding: '10px 12px',
                    fontSize: 12, color: '#0056b3', marginBottom: 20,
                    textAlign: 'left', display: 'flex', gap: 8,
                }}>
                    <span>🎯</span>
                    <div>
                        <strong>{t('active_search', 'Active search request:')}</strong><br />
                        {[
                            filters.regions?.length > 0 && `${t('filter_location')}: ${filters.regions.join(', ')}`,
                            filters.langs?.length > 0 && `${t('filter_languages')}: ${filters.langs.join(', ')}`,
                            filters.prompt?.trim() && `"${filters.prompt}"`,
                        ].filter(Boolean).join(' · ')}
                    </div>
                </div>
            )}

            <button
                onClick={onBoost}
                disabled={boosting}
                style={{
                    width: '100%', padding: 14, borderRadius: 14, border: 'none',
                    background: boosting ? 'rgba(0,122,255,0.5)' : 'linear-gradient(45deg, #007aff, #00c6ff)',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: boosting ? 'default' : 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 6px 16px rgba(0,122,255,0.2)', marginBottom: 16,
                    transition: 'all 0.2s',
                }}
            >
                {boosting ? t('boosting_btn') : t('boost_btn')}
            </button>

            <div style={{
                background: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12,
                fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.4, textAlign: 'left',
            }}>
                💡 {t('boost_hint')}{' '}
                <span onClick={onPeople} style={{ color: 'var(--app-primary)', fontWeight: 700, cursor: 'pointer' }}>
                    {t('nav_people').toUpperCase()}
                </span>
                {' '}{t('boost_hint_suffix')}
            </div>
        </div>
    )
}
