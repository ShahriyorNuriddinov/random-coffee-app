import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

const REGIONS = [
    { value: 'Hong Kong', label: '🇭🇰 Hong Kong' },
    { value: 'Macau', label: '🇲🇴 Macau' },
    { value: 'Mainland China', label: '🇨🇳 Mainland China' },
]

export default function BasicInfoCard({ profile, region, onRegionChange }) {
    const { t } = useTranslation()

    return (
        <div>
            <Card>
                <ReadonlyRow label={t('name_field')} value={profile.name} />
                <ReadonlyRow label={t('dob_field')} value={profile.dob ? new Date(profile.dob).toLocaleDateString() : ''} />
                <ReadonlyRow label={t('gender_field')} value={profile.gender === 'male' ? t('male') : t('female')} />
                <div style={{ padding: '14px 16px' }}>
                    <select
                        value={region}
                        onChange={e => onRegionChange(e.target.value)}
                        style={{
                            width: '100%', fontSize: 16, color: 'var(--app-text)',
                            background: 'transparent', border: 'none', outline: 'none',
                            fontFamily: 'inherit', cursor: 'pointer',
                        }}
                    >
                        {REGIONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>
            </Card>
            <p style={{ fontSize: 12, color: 'var(--app-hint)', marginTop: 6, marginLeft: 4 }}>
                {t('tip_readonly')}
            </p>
        </div>
    )
}

function ReadonlyRow({ label, value }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px',
            borderBottom: '0.5px solid var(--app-border)',
        }}>
            <span style={{ fontSize: 16, fontWeight: 500, width: 110, flexShrink: 0, color: 'var(--app-text)' }}>
                {label}
            </span>
            <span style={{ fontSize: 16, color: 'var(--app-hint)' }}>{value}</span>
        </div>
    )
}
