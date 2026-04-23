import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

const REGIONS = [
    { value: 'Hong Kong', labelKey: 'region_hk' },
    { value: 'Macau', labelKey: 'region_mo' },
    { value: 'Mainland China', labelKey: 'region_cn' },
]

function formatDob(dob) {
    if (!dob) return ''
    // Parse as local date to avoid timezone shift (ISO string: YYYY-MM-DD...)
    const parts = String(dob).substring(0, 10).split('-')
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    const d = new Date(dob)
    if (isNaN(d.getTime())) return dob
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
}

export default function BasicInfoCard({ profile, region, city, onCityChange }) {
    const { t } = useTranslation()

    const selected = REGIONS.find(r => r.value === region) || REGIONS[0]

    return (
        <div>
            <Card style={{ overflow: 'visible' }}>
                <ReadonlyRow label={t('name_field')} value={profile.name} />
                <ReadonlyRow label={t('dob_field')} value={formatDob(profile.dob)} />
                <ReadonlyRow label={t('gender_field')} value={profile.gender === 'male' ? t('male') : t('female')} />
                <ReadonlyRow label={t('region_label')} value={t(selected.labelKey)} isLast={region !== 'Mainland China'} />
                {region === 'Mainland China' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', padding: '14px 16px',
                    }}>
                        <span style={{ fontSize: 16, fontWeight: 500, width: 110, flexShrink: 0, color: 'var(--app-text)' }}>
                            {t('city_label')}
                        </span>
                        <input
                            type="text"
                            value={city || ''}
                            onChange={e => onCityChange && onCityChange(e.target.value)}
                            placeholder={t('city_placeholder')}
                            style={{
                                flex: 1, border: 'none', outline: 'none',
                                fontSize: 16, color: 'var(--app-text)',
                                background: 'transparent', fontFamily: 'inherit',
                            }}
                        />
                    </div>
                )}
            </Card>
            <p style={{ fontSize: 12, color: 'var(--app-hint)', marginTop: 6, marginLeft: 4 }}>
                {t('tip_readonly')}
            </p>
        </div>
    )
}

function ReadonlyRow({ label, value, isLast }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px',
            borderBottom: isLast ? 'none' : '0.5px solid var(--app-border)',
        }}>
            <span style={{ fontSize: 16, fontWeight: 500, width: 110, flexShrink: 0, color: 'var(--app-text)' }}>
                {label}
            </span>
            <span style={{ fontSize: 16, color: 'var(--app-hint)' }}>{value}</span>
        </div>
    )
}
