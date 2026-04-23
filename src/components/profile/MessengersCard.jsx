import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

const DIAL_CODES = [
    { code: '+852', iso: 'HK', nameKey: 'cc_hk' },
    { code: '+853', iso: 'MO', nameKey: 'cc_mo' },
    { code: '+86', iso: 'CN', nameKey: 'cc_cn' },
    { code: '+1', iso: 'US', nameKey: 'cc_us' },
    { code: '+44', iso: 'GB', nameKey: 'cc_gb' },
    { code: '+61', iso: 'AU', nameKey: 'cc_au' },
    { code: '+65', iso: 'SG', nameKey: 'cc_sg' },
    { code: '+81', iso: 'JP', nameKey: 'cc_jp' },
    { code: '+82', iso: 'KR', nameKey: 'cc_kr' },
    { code: '+91', iso: 'IN', nameKey: 'cc_in' },
    { code: '+7', iso: 'RU', nameKey: 'cc_ru' },
    { code: '+998', iso: 'UZ', nameKey: 'cc_uz' },
    { code: '+49', iso: 'DE', nameKey: 'cc_de' },
    { code: '+33', iso: 'FR', nameKey: 'cc_fr' },
    { code: '+34', iso: 'ES', nameKey: 'cc_es' },
    { code: '+39', iso: 'IT', nameKey: 'cc_it' },
    { code: '+55', iso: 'BR', nameKey: 'cc_br' },
    { code: '+971', iso: 'AE', nameKey: 'cc_ae' },
    { code: '+966', iso: 'SA', nameKey: 'cc_sa' },
    { code: '+60', iso: 'MY', nameKey: 'cc_my' },
    { code: '+66', iso: 'TH', nameKey: 'cc_th' },
    { code: '+84', iso: 'VN', nameKey: 'cc_vn' },
    { code: '+63', iso: 'PH', nameKey: 'cc_ph' },
    { code: '+62', iso: 'ID', nameKey: 'cc_id' },
    { code: '+886', iso: 'TW', nameKey: 'cc_tw' },
]

export default function MessengersCard({ wechat, whatsapp, onChange }) {
    const { t } = useTranslation()

    const parseWhatsapp = (val) => {
        if (!val) return { code: '+852', number: '' }
        const match = val.match(/^(\+\d{1,4})\s*(.*)$/)
        if (match) return { code: match[1], number: match[2] }
        return { code: '+852', number: val }
    }

    const parsed = parseWhatsapp(whatsapp)
    const [waCode, setWaCode] = useState(parsed.code)
    const [waNumber, setWaNumber] = useState(parsed.number)

    const handleCodeChange = (e) => {
        const code = e.target.value
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
                {/* WeChat qatori */}
                <div style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px',
                    borderBottom: '0.5px solid var(--app-border)', gap: 12,
                }}>
                    <span style={{ fontSize: 16, fontWeight: 600, width: 90, flexShrink: 0, color: 'var(--app-text)' }}>
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

                {/* WhatsApp qatori: label | select | input */}
                <div style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 8,
                }}>
                    <span style={{ fontSize: 16, fontWeight: 600, width: 90, flexShrink: 0, color: 'var(--app-text)' }}>
                        {t('whatsapp_label')}
                    </span>
                    <select
                        value={waCode}
                        onChange={handleCodeChange}
                        style={{
                            border: 'none', outline: 'none',
                            background: 'transparent', fontFamily: 'inherit',
                            fontSize: 15, fontWeight: 600,
                            color: 'var(--app-primary)', cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        {DIAL_CODES.map(c => (
                            <option key={c.code} value={c.code}>
                                {c.iso} {c.code}
                            </option>
                        ))}
                    </select>
                    <input
                        type="tel"
                        value={waNumber}
                        onChange={handleNumberChange}
                        placeholder="9123 4567"
                        inputMode="tel"
                        style={{
                            flex: 1, border: 'none', outline: 'none',
                            fontSize: 16, color: 'var(--app-text)',
                            background: 'transparent', fontFamily: 'inherit',
                            minWidth: 0,
                        }}
                    />
                </div>
            </Card>
            <p className="tip-text">{t('tip_wechat')}</p>
        </div>
    )
}
