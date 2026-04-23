import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

const OPTIONS = ['30_70', '50_50', '70_30']

export default function BalanceSelector({ value, onChange }) {
    const { t } = useTranslation()

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">{t('balance_title')}</div>
            <Card>
                {OPTIONS.map((opt, i) => (
                    <div
                        key={opt}
                        onClick={() => onChange(opt)}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 16px', cursor: 'pointer',
                            borderBottom: i < OPTIONS.length - 1 ? '0.5px solid var(--app-border)' : 'none',
                        }}
                    >
                        <span style={{ fontSize: 16, color: 'var(--app-text)' }}>{t(`bal_${opt}`)}</span>
                        <span style={{ color: 'var(--app-primary)', fontWeight: 700, opacity: value === opt ? 1 : 0 }}>✓</span>
                    </div>
                ))}
            </Card>
        </div>
    )
}
