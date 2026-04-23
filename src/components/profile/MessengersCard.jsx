import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { CountrySelect } from '@/components/ui/country-select'

export default function MessengersCard({ wechat, whatsapp, onChange }) {
    const { t } = useTranslation()

    // Parse stored whatsapp value: may be "+852 XXXX XXXX" or just digits
    const parseWhatsapp = (val) => {
        if (!val) return { code: '+852', number: '' }
        const match = val.match(/^(\+\d{1,4})\s*(.*)$/)
        if (match) return { code: match[1], number: match[2] }
        return { code: '+852', number: val }
    }

    const parsed = parseWhatsapp(whatsapp)
    const [waCode, setWaCode] = useState(parsed.code)
    const [waNumber, setWaNumber] = useState(parsed.number)

    const handleCodeChange = (code) => {
        setWaCode(code)
        onChange('whatsapp', waNumber ? `${code} ${waNumber}` : '')
    }

    const handleNumberChange = (e) => {
        const num = e.target.value.replace(/[^\d\s\-]/g, '')
        setWaNumber(num)
        onChange('whatsapp', num ? `${waCode} ${num}` : '')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">{t('messengers_title')}</div>
            <Card>
                {/* WeChat row */}
                <div style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px',
                    borderBottom: '0.5px solid var(--app-border)', gap: 12,
                }}>
                    <span style={{ fontSize: 16, fontWeight: 500, width: 85, flexShrink: 0, color: 'var(--app-text)' }}>
                        WeChat
                    </span>
                    <input
                        type="text"
                        value={wechat}
                        onChange={e => onChange('wechat', e.target.value)}
                        placeholder="ID"
                        style={{
                            flex: 1, border: 'none', outline: 'none',
                            fontSize: 16, color: 'var(--app-text)',
                            background: 'transparent', fontFamily: 'inherit',
                        }}
                    />
                </div>

                {/* WhatsApp row with country code picker */}
                <div style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12,
                }}>
                    <span style={{ fontSize: 16, fontWeight: 500, width: 85, flexShrink: 0, color: 'var(--app-text)' }}>
                        {t('whatsapp_label')}
                    </span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CountrySelect value={waCode} onChange={handleCodeChange} />
                        <input
                            type="tel"
                            value={waNumber}
                            onChange={handleNumberChange}
                            placeholder="XXXX XXXX"
                            inputMode="tel"
                            style={{
                                flex: 1, border: 'none', outline: 'none',
                                fontSize: 16, color: 'var(--app-text)',
                                background: 'transparent', fontFamily: 'inherit',
                            }}
                        />
                    </div>
                </div>
            </Card>
            <p className="tip-text">{t('tip_wechat')}</p>
        </div>
    )
}
