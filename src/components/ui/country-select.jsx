import { useState, useRef, useEffect } from 'react'

const COUNTRIES = [
    { code: '+852', flag: '🇭🇰', name: 'HK' },
    { code: '+853', flag: '🇲🇴', name: 'MO' },
    { code: '+86', flag: '🇨🇳', name: 'CN' },
]

export function CountrySelect({ value, onChange }) {
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
                    overflow: 'hidden', zIndex: 100, minWidth: 160,
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
                            <span>{c.name} {c.code}</span>
                            {c.code === value && <span style={{ marginLeft: 'auto', color: 'var(--app-primary)' }}>✓</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
