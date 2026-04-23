import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Toggle'

export default function ModesCard({ showAge, datingMode, datingGender, onChange }) {
    const { t } = useTranslation()

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">{t('modes_title')}</div>
            <Card>
                <ModeRow
                    label={t('show_age')}
                    checked={showAge}
                    onToggle={() => onChange('showAge', !showAge)}
                />
                <ModeRow
                    label={t('dating_mode')}
                    checked={datingMode}
                    onToggle={() => onChange('datingMode', !datingMode)}
                />
                {datingMode && (
                    <>
                        <CheckRow
                            label={t('meet_men')}
                            checked={datingGender === 'men'}
                            onClick={() => onChange('datingGender', 'men')}
                        />
                        <CheckRow
                            label={t('meet_women')}
                            checked={datingGender === 'women'}
                            onClick={() => onChange('datingGender', 'women')}
                            isLast
                        />
                    </>
                )}
            </Card>
            <p style={{ fontSize: 13, color: 'var(--app-hint)', marginTop: 8, marginLeft: 4, lineHeight: 1.4 }}>
                {t('dating_desc')}
            </p>
        </div>
    )
}

function ModeRow({ label, checked, onToggle }) {
    return (
        <div
            onClick={onToggle}
            style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', cursor: 'pointer',
                borderBottom: '0.5px solid var(--app-border)',
            }}
        >
            <span style={{ fontSize: 16, color: 'var(--app-text)' }}>{label}</span>
            <Toggle checked={checked} onChange={onToggle} />
        </div>
    )
}

function CheckRow({ label, checked, onClick, isLast }) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', cursor: 'pointer',
                borderBottom: isLast ? 'none' : '0.5px solid var(--app-border)',
            }}
        >
            <span style={{ fontSize: 16, color: 'var(--app-text)' }}>{label}</span>
            <span style={{ color: 'var(--app-primary)', fontWeight: 700, opacity: checked ? 1 : 0 }}>✓</span>
        </div>
    )
}
