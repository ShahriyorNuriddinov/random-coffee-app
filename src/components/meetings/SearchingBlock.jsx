// HTML: meetings.html → #searching-content
import { useTranslation } from 'react-i18next'

export default function SearchingBlock({ onPeople, onBoost, boosting, boostActive, filters }) {
    const { t } = useTranslation()
    const hasFilters = filters && (
        (filters.regions?.length > 0) ||
        (filters.langs?.length > 0) ||
        !!filters.prompt?.trim()
    )

    return (
        <div style={{
            background: 'var(--app-card)', borderRadius: 20,
            padding: '30px 16px', border: boostActive ? '1.5px solid rgba(0,122,255,0.4)' : '0.5px solid var(--app-border)',
            textAlign: 'center', boxShadow: boostActive ? '0 4px 20px rgba(0,122,255,0.1)' : '0 4px 12px rgba(0,0,0,0.02)',
        }}>
            <div style={{
                width: 40, height: 40,
                border: `3px solid ${boostActive ? 'rgba(0,122,255,0.2)' : 'rgba(0,122,255,0.1)'}`,
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

            {/* Boost active indicator */}
            {boostActive && (
                <div style={{
                    background: 'rgba(0,122,255,0.08)',
                    border: '1px solid rgba(0,122,255,0.2)',
                    borderRadius: 12, padding: '10px 14px',
                    fontSize: 13, color: 'var(--app-primary)', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                    fontWeight: 600,
                }}>
                    ⚡ {t('boost_searching', 'Boost active — searching for a mutual match...')}
                </div>
            )}

            {/* Active filter indicator */}
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
                disabled={boosting && !boostActive}
                style={{
                    width: '100%', padding: 14, borderRadius: 14, border: 'none',
                    background: boostActive
                        ? 'rgba(255,59,48,0.1)'
                        : boosting
                            ? 'rgba(0,122,255,0.5)'
                            : 'linear-gradient(45deg, #007aff, #00c6ff)',
                    color: boostActive ? '#ff3b30' : '#fff',
                    fontSize: 14, fontWeight: 700,
                    cursor: (boosting && !boostActive) ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: boostActive ? 'none' : '0 6px 16px rgba(0,122,255,0.2)',
                    marginBottom: 16,
                    transition: 'all 0.2s',
                }}
            >
                {boostActive
                    ? t('boost_cancel', '⏹ Cancel Boost')
                    : boosting
                        ? t('boosting_btn')
                        : t('boost_btn')}
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
