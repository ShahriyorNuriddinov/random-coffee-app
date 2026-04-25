// HTML: meetings.html → .history-item
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function HistoryItem({ match, onPost }) {
    const { t } = useTranslation()
    const [showNote, setShowNote] = useState(false)
    const { partner, createdAt } = match
    if (!partner) return null

    const regionFlag = partner.region === 'Macau' ? '🇲🇴'
        : partner.region === 'Mainland' ? '🇨🇳'
            : partner.region === 'Other' ? '🌍'
                : '🇭🇰'

    const dateStr = new Date(createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    })

    return (
        <div style={{ borderBottom: '0.5px solid var(--app-border)', paddingBottom: 12, marginBottom: 12 }}>
            {/* .history-item row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        backgroundImage: partner.avatar_url ? `url(${partner.avatar_url})` : 'none',
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        backgroundColor: 'rgba(120,120,128,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {!partner.avatar_url && <span style={{ fontSize: 18 }}>👤</span>}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--app-text)' }}>
                            {partner.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--app-hint)' }}>{dateStr}</div>
                    </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#34c759' }}>{t('history_success')}</div>
            </div>

            {/* .notes-preview */}
            {showNote && (
                <div style={{
                    fontSize: 12, color: 'var(--app-hint)',
                    background: 'rgba(120,120,128,0.05)',
                    padding: 10, borderRadius: 8, marginBottom: 8,
                }}>
                    📝 <strong>{t('history_note')}:</strong> {t('history_matched_with')} {partner.name}. {regionFlag} {partner.region}
                </div>
            )}

            {/* .notes-toggle-btn */}
            <button onClick={() => setShowNote(n => !n)} style={{
                background: 'none', border: 'none', padding: '4px 4px',
                fontSize: 12, fontWeight: 700, color: 'var(--app-primary)',
                cursor: 'pointer', fontFamily: 'inherit',
            }}>
                {showNote ? t('hide_note') : t('show_note')}
            </button>

            {/* .btn-beautiful-post */}
            <button onClick={onPost} style={{
                marginTop: 8, width: '100%',
                background: 'linear-gradient(135deg, rgba(0,122,255,0.1), rgba(0,198,255,0.1))',
                color: 'var(--app-primary)',
                border: '1px solid rgba(0,122,255,0.2)',
                padding: 12, borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
                {t('write_post')}
            </button>
        </div>
    )
}
