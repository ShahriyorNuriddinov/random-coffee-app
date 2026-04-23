import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

const REGIONS = [
    { value: 'Hong Kong', label: '🇭🇰 Hong Kong' },
    { value: 'Macau', label: '🇲🇴 Macau' },
    { value: 'Mainland China', label: '🇨🇳 Mainland China' },
]

export default function BasicInfoCard({ profile, region, onRegionChange }) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)

    const selected = REGIONS.find(r => r.value === region) || REGIONS[0]

    return (
        <div>
            <Card style={{ overflow: 'visible' }}>
                <ReadonlyRow label={t('name_field')} value={profile.name} />
                <ReadonlyRow label={t('dob_field')} value={profile.dob ? new Date(profile.dob).toLocaleDateString() : ''} />
                <ReadonlyRow label={t('gender_field')} value={profile.gender === 'male' ? t('male') : t('female')} />

                {/* Custom region dropdown */}
                <div style={{ padding: '14px 16px', position: 'relative' }}>
                    <div
                        onClick={() => setOpen(o => !o)}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            cursor: 'pointer', fontSize: 16, color: 'var(--app-text)',
                        }}
                    >
                        <span>{selected.label}</span>
                        <span style={{ color: 'var(--app-hint)', fontSize: 12, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
                    </div>

                    {open && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                            background: 'var(--app-card)', border: '0.5px solid var(--app-border)',
                            borderRadius: 12, overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        }}>
                            {REGIONS.map(r => (
                                <div
                                    key={r.value}
                                    onClick={() => { onRegionChange(r.value); setOpen(false) }}
                                    style={{
                                        padding: '13px 16px', fontSize: 16,
                                        color: r.value === region ? 'var(--app-primary)' : 'var(--app-text)',
                                        fontWeight: r.value === region ? 600 : 400,
                                        cursor: 'pointer',
                                        borderBottom: '0.5px solid var(--app-border)',
                                        background: 'var(--app-card)',
                                    }}
                                >
                                    {r.label}
                                </div>
                            ))}
                        </div>
                    )}
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
