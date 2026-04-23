import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// Common countries with dial codes — names use i18n keys
const COUNTRIES = [
    { code: '+852', flag: '🇭🇰', nameKey: 'cc_hk' },
    { code: '+853', flag: '🇲🇴', nameKey: 'cc_mo' },
    { code: '+86', flag: '🇨🇳', nameKey: 'cc_cn' },
    { code: '+1', flag: '🇺🇸', nameKey: 'cc_us' },
    { code: '+44', flag: '🇬🇧', nameKey: 'cc_gb' },
    { code: '+61', flag: '🇦🇺', nameKey: 'cc_au' },
    { code: '+65', flag: '🇸🇬', nameKey: 'cc_sg' },
    { code: '+81', flag: '🇯🇵', nameKey: 'cc_jp' },
    { code: '+82', flag: '🇰🇷', nameKey: 'cc_kr' },
    { code: '+91', flag: '��🇳', nameKey: 'cc_in' },
    { code: '+7', flag: '🇷🇺', nameKey: 'cc_ru' },
    { code: '+998', flag: '🇺🇿', nameKey: 'cc_uz' },
    { code: '+49', flag: '🇩🇪', nameKey: 'cc_de' },
    { code: '+33', flag: '🇫🇷', nameKey: 'cc_fr' },
    { code: '+34', flag: '🇪🇸', nameKey: 'cc_es' },
    { code: '+39', flag: '🇮🇹', nameKey: 'cc_it' },
    { code: '+55', flag: '🇧🇷', nameKey: 'cc_br' },
    { code: '+971', flag: '🇦🇪', nameKey: 'cc_ae' },
    { code: '+966', flag: '🇸🇦', nameKey: 'cc_sa' },
    { code: '+60', flag: '🇲🇾', nameKey: 'cc_my' },
    { code: '+66', flag: '🇹🇭', nameKey: 'cc_th' },
    { code: '+84', flag: '🇻🇳', nameKey: 'cc_vn' },
    { code: '+63', flag: '🇵🇭', nameKey: 'cc_ph' },
    { code: '+62', flag: '🇮🇩', nameKey: 'cc_id' },
    { code: '+886', flag: '🇹🇼', nameKey: 'cc_tw' },
]

export function CountrySelect({ value, onChange }) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[0]

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 17, fontWeight: 600, color: 'var(--app-text)',
                    fontFamily: 'inherit', padding: '0 10px 0 0',
                    borderRight: '1px solid var(--app-border)',
                }}
            >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{selected.flag}</span>
                <span>{selected.code}</span>
                <span style={{ fontSize: 9, color: 'var(--app-hint)', marginTop: 1 }}>▼</span>
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                    background: 'var(--app-card)',
                    border: '0.5px solid var(--app-border)',
                    borderRadius: 14,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    overflow: 'hidden auto', zIndex: 100, minWidth: 200,
                    maxHeight: 320,
                    animation: 'fadeInUp 0.15s ease',
                }}>
                    {COUNTRIES.map((c, i) => (
                        <div
                            key={c.code}
                            onClick={() => { onChange(c.code); setOpen(false) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 16px',
                                cursor: 'pointer',
                                fontSize: 15, fontWeight: 600,
                                color: c.code === value ? 'var(--app-primary)' : 'var(--app-text)',
                                background: c.code === value ? 'rgba(0,122,255,0.06)' : 'transparent',
                                borderBottom: i < COUNTRIES.length - 1 ? '0.5px solid var(--app-border)' : 'none',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(120,120,128,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = c.code === value ? 'rgba(0,122,255,0.06)' : 'transparent'}
                        >
                            <span style={{ fontSize: 22 }}>{c.flag}</span>
                            <span style={{ flex: 1 }}>{t(c.nameKey, c.nameKey)} {c.code}</span>
                            {c.code === value && <span style={{ color: 'var(--app-primary)' }}>✓</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
