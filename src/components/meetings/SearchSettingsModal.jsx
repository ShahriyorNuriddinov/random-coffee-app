// HTML: meetings.html → #modal-settings
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function SearchSettingsModal({ filters, onApply, onClose }) {
    const { t } = useTranslation()
    const [regions, setRegions] = useState(filters?.regions || [])
    const [langs, setLangs] = useState(filters?.langs || [])
    const [prompt, setPrompt] = useState(filters?.prompt || '')

    const toggle = (arr, setArr, val) =>
        setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

    const handleApply = () => { onApply?.({ regions, langs, prompt }); onClose() }
    const handleClear = () => {
        setRegions([]); setLangs([]); setPrompt('')
        onApply?.({ regions: [], langs: [], prompt: '' }); onClose()
    }

    const Tag = ({ label, active, onToggle }) => (
        <div onClick={onToggle} style={{
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            background: active ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.04)',
            color: active ? 'var(--app-primary)' : '#555',
            fontSize: 12, fontWeight: 600,
            boxShadow: active ? 'inset 0 0 0 1px rgba(0,122,255,0.2)' : 'none',
            transition: 'all 0.2s', userSelect: 'none',
        }}>{label}</div>
    )

    const hasActive = regions.length > 0 || langs.length > 0 || prompt.trim()

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--app-card)', width: '100%', maxWidth: 400,
                borderRadius: 20, padding: 24, boxSizing: 'border-box',
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 20, textAlign: 'center' }}>
                    {t('search_settings_title')}
                </div>

                <SectionLabel>{t('target_location')}</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {[
                        { val: 'Hong Kong', label: t('region_hk') },
                        { val: 'Macau', label: t('region_mo') },
                        { val: 'Mainland China', label: t('region_cn') },
                    ].map(r => (
                        <Tag key={r.val} label={r.label} active={regions.includes(r.val)} onToggle={() => toggle(regions, setRegions, r.val)} />
                    ))}
                </div>

                <SectionLabel>{t('langs_title')}</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {[
                        { val: 'EN', label: t('lang_en') },
                        { val: 'CAN', label: t('lang_canton') },
                        { val: 'ZH', label: t('lang_zh') },
                    ].map(l => (
                        <Tag key={l.val} label={l.label} active={langs.includes(l.val)} onToggle={() => toggle(langs, setLangs, l.val)} />
                    ))}
                </div>

                <SectionLabel>{t('custom_search')}</SectionLabel>
                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={t('custom_search_placeholder')}
                    style={{
                        width: '100%', padding: 12, borderRadius: 10,
                        border: '1px solid var(--app-border)',
                        background: 'var(--app-bg)', color: 'var(--app-text)',
                        fontSize: 14, fontFamily: 'inherit',
                        boxSizing: 'border-box', outline: 'none', marginBottom: 20,
                    }}
                />

                {hasActive && (
                    <div style={{
                        background: 'rgba(0,122,255,0.05)', border: '0.5px solid rgba(0,122,255,0.15)',
                        borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#0056b3',
                        marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start',
                    }}>
                        <span>🎯</span>
                        <div>
                            <strong>{t('active_search')}</strong><br />
                            {[
                                regions.length > 0 && `Location: ${regions.join(', ')}`,
                                langs.length > 0 && `Languages: ${langs.join(', ')}`,
                                prompt && `"${prompt}"`,
                            ].filter(Boolean).join(' · ')}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn-gradient" style={{ borderRadius: 14 }} onClick={handleApply}>
                        {t('apply_filters')}
                    </button>
                    <button onClick={handleClear} style={{
                        width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                        background: 'rgba(120,120,128,0.1)', color: '#ff3b30',
                        fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        {t('turn_off_filters')}
                    </button>
                    <button onClick={onClose} style={{
                        width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                        background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                        fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    )
}

function SectionLabel({ children }) {
    return (
        <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--app-hint)',
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
        }}>
            {children}
        </div>
    )
}
