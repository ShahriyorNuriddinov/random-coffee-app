import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

export default function MessengersCard({ wechat, whatsapp, onChange }) {
    const { t } = useTranslation()

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">{t('messengers_title')}</div>
            <Card>
                <Row label="WeChat">
                    <input
                        type="text"
                        value={wechat}
                        onChange={e => onChange('wechat', e.target.value)}
                        placeholder="ID"
                    />
                </Row>
                <Row label="WhatsApp" isLast>
                    <input
                        type="tel"
                        value={whatsapp}
                        onChange={e => onChange('whatsapp', e.target.value)}
                        placeholder="Phone number"
                    />
                </Row>
            </Card>
            <p className="tip-text">{t('tip_wechat')}</p>
        </div>
    )
}

function Row({ label, children, isLast }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px',
            borderBottom: isLast ? 'none' : '0.5px solid var(--app-border)',
            gap: 12,
        }}>
            <span style={{ fontSize: 16, fontWeight: 500, width: 85, flexShrink: 0, color: 'var(--app-text)' }}>
                {label}
            </span>
            <div style={{ flex: 1 }}>
                {/* clone child with styles */}
                {children && (
                    <input
                        type={children.props.type}
                        value={children.props.value}
                        onChange={children.props.onChange}
                        placeholder={children.props.placeholder}
                        style={{
                            width: '100%', border: 'none', outline: 'none',
                            fontSize: 16, color: 'var(--app-text)',
                            background: 'transparent', fontFamily: 'inherit',
                        }}
                    />
                )}
            </div>
        </div>
    )
}
