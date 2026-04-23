import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { Card } from '@/components/ui/Card'

const DIAL_CODES = [
    { code: '+852', iso: 'HK' },
    { code: '+853', iso: 'MO' },
    { code: '+86', iso: 'CN' },
    { code: '+65', iso: 'SG' },
    { code: '+1', iso: 'US' },
    { code: '+44', iso: 'GB' },
    { code: '+7', iso: 'RU' },
    { code: '+998', iso: 'UZ' },
    { code: '+81', iso: 'JP' },
    { code: '+82', iso: 'KR' },
    { code: '+91', iso: 'IN' },
]

function DialPicker({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const btnRef = useRef(null)
    const selected = DIAL_CODES.find(c => c.code === value) || DIAL_CODES[0]

    useEffect(() => {
        const handler = (e) => {
            if (btnRef.current && !btnRef.current.contains(e.target) &&
                !document.getElementById('dial-dropdown')?.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleOpen = () => {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            setPos({ top: r.bottom + 6, left: r.left })
        }
        setOpen(o => !o)
    }

    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
                ref={btnRef}
                type="button"
                onClick={handleOpen}
                style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(0,122,255,0.08)',
                    border: '0.5px solid rgba(0,122,255,0.2)',
                    borderRadius: 10, padding: '5px 10px',
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 14, fontWeight: 700,
                    color: 'var(--app-primary)',
                }}
            >
                <span>{selected.iso}</span>
                <span style={{ opacity: 0.7 }}>{selected.code}</span>
                <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
            </button>

            {open && createPortal(
                <div
                    id="dial-dropdown"
                    style={{
                        position: 'fixed',
                        top: pos.top,
                        left: pos.left,
                        background: 'var(--app-card)',
                        border: '0.5px solid var(--app-border)',
                        borderRadius: 14,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        zIndex: 99999,
                        minWidth: 130,
                    }}
                >
                    {DIAL_CODES.map((c, i) => {
                        const isSelected = c.code === value
                        return (
                            <div
                                key={c.code}
                                onClick={() => { onChange(c.code); setOpen(false) }}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '11px 14px',
                                    cursor: 'pointer',
                                    fontSize: 15, fontWeight: 600,
                                    color: isSelected ? 'var(--app-primary)' : 'var(--app-text)',
                                    background: isSelected ? 'rgba(0,122,255,0.06)' : 'transparent',
                                    borderBottom: i < DIAL_CODES.length - 1
                                        ? '0.5px solid var(--app-border)' : 'none',
                                }}
                            >
                                <span>{c.iso} <span style={{ color: 'var(--app-hint)', fontWeight: 500 }}>{c.code}</span></span>
                                {isSelected && <span style={{ color: 'var(--app-primary)', fontSize: 13 }}>✓</span>}
                            </div>
                        )
                    })}
                </div>,
                document.body
            )}
        </div>
    )
}

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
                {/* WeChat */}
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

                {/* WhatsApp */}
                <div style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10,
                }}>
                    <span style={{ fontSize: 16, fontWeight: 600, width: 90, flexShrink: 0, color: 'var(--app-text)' }}>
                        {t('whatsapp_label')}
                    </span>
                    <DialPicker value={waCode} onChange={handleCodeChange} />
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
