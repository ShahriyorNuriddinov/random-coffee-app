import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

const COUNTRIES = [
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

function FlagBadge({ iso }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 20, borderRadius: 4,
            background: 'var(--app-primary)', opacity: 0.85,
            fontSize: 10, fontWeight: 800, color: '#fff',
            letterSpacing: 0.3, flexShrink: 0,
        }}>
            {iso}
        </span>
    )
}

export function CountrySelect({ value, onChange }) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
    const btnRef = useRef(null)
    const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[0]

    useEffect(() => {
        const handler = (e) => {
            if (btnRef.current && !btnRef.current.closest('[data-country-select]')?.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleOpen = () => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setDropPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 220) })
        }
        setOpen(o => !o)
    }

    return (
        <div data-country-select style={{ position: 'relative', flexShrink: 0 }}>
            <button
                ref={btnRef}
                type="button"
                onClick={handleOpen}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 16, fontWeight: 600, color: 'var(--app-text)',
                    fontFamily: 'inherit', padding: '0 10px 0 0',
                    borderRight: '1px solid var(--app-border)',
                }}
            >
                <FlagBadge iso={selected.iso} />
                <span>{selected.code}</span>
                <span style={{ fontSize: 9, color: 'var(--app-hint)' }}>▼</span>
            </button>

            {open && createPortal(
                <div
                    data-country-select
                    style={{
                        position: 'fixed',
                        top: dropPos.top,
                        left: dropPos.left,
                        minWidth: dropPos.width,
                        background: 'var(--app-card)',
                        border: '0.5px solid var(--app-border)',
                        borderRadius: 14,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        overflow: 'hidden auto',
                        zIndex: 9999,
                        maxHeight: 300,
                        animation: 'fadeInUp 0.15s ease',
                    }}
                >
                    {COUNTRIES.map((c, i) => (
                        <div
                            key={c.code}
                            onClick={() => { onChange(c.code); setOpen(false) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '11px 14px',
                                cursor: 'pointer',
                                fontSize: 14, fontWeight: 600,
                                color: c.code === value ? 'var(--app-primary)' : 'var(--app-text)',
                                background: c.code === value ? 'rgba(0,122,255,0.06)' : 'transparent',
                                borderBottom: i < COUNTRIES.length - 1 ? '0.5px solid var(--app-border)' : 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(120,120,128,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = c.code === value ? 'rgba(0,122,255,0.06)' : 'transparent'}
                        >
                            <FlagBadge iso={c.iso} />
                            <span style={{ flex: 1 }}>{t(c.nameKey, c.iso)} {c.code}</span>
                            {c.code === value && <span style={{ color: 'var(--app-primary)' }}>✓</span>}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    )
}
