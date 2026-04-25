// ─── PeopleFilterModal — HTML: people.html → #modal-filter ──────────────────
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function PeopleFilterModal({ filters, onApply, onClose }) {
    const { t } = useTranslation()
    const [regions, setRegions] = useState(filters.regions || [])
    const [langs, setLangs] = useState(filters.langs || [])

    const toggle = (arr, setArr, val) =>
        setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])

    const handleApply = () => { onApply({ regions, langs }); onClose() }
    const handleClear = () => { setRegions([]); setLangs([]); onApply({ regions: [], langs: [] }); onClose() }

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--app-card)', width: '100%', maxWidth: 400,
                borderRadius: 20, padding: 24, boxSizing: 'border-box',
                maxHeight: '90vh', overflowY: 'auto', textAlign: 'center',
            }}>
                {/* .modal-header */}
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 16 }}>
                    {t('filters_title')}
                </div>

                {/* Target Location */}
                <div style={{ marginBottom: 16, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-hint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                        {t('target_location')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[
                            { val: 'Hong Kong', label: t('region_hk') },
                            { val: 'Macau', label: t('region_mo') },
                            { val: 'Mainland', label: t('region_cn') },
                            { val: 'Other', label: t('region_other') },
                        ].map(r => (
                            <SelectableTag
                                key={r.val}
                                label={r.label}
                                selected={regions.includes(r.val)}
                                onToggle={() => toggle(regions, setRegions, r.val)}
                            />
                        ))}
                    </div>
                </div>

                {/* Languages */}
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-hint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                        {t('langs_title')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[
                            { val: 'EN', label: t('lang_en') },
                            { val: 'ZH', label: t('lang_zh') },
                            { val: 'CAN', label: t('lang_canton') },
                            { val: 'RU', label: t('lang_ru') },
                        ].map(l => (
                            <SelectableTag
                                key={l.val}
                                label={l.label}
                                selected={langs.includes(l.val)}
                                onToggle={() => toggle(langs, setLangs, l.val)}
                            />
                        ))}
                    </div>
                </div>

                {/* .modal-actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn-gradient" style={{ borderRadius: 14 }} onClick={handleApply}>
                        {t('apply_filters')}
                    </button>
                    <button onClick={handleClear} style={{
                        width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                        background: 'rgba(120,120,128,0.06)', color: '#ff3b30',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        {t('clear_filters')}
                    </button>
                    <button onClick={onClose} style={{
                        width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                        background: 'rgba(120,120,128,0.06)', color: 'var(--app-text)',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── .selectable-tag ─────────────────────────────────────────────────────────
function SelectableTag({ label, selected, onToggle }) {
    return (
        <div onClick={onToggle} style={{
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            background: selected ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.04)',
            color: selected ? 'var(--app-primary)' : '#555',
            fontSize: 12, fontWeight: 600,
            boxShadow: selected ? 'inset 0 0 0 1px rgba(0,122,255,0.2)' : 'none',
            transition: 'all 0.2s', userSelect: 'none',
        }}>
            {label}
        </div>
    )
}
