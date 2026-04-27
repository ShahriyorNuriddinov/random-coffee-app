import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'

const ALL_LANGS = [
    { code: 'en', label: 'EN', settingKey: 'lang_en' },
    { code: 'zh', label: '中文', settingKey: 'lang_zh' },
    { code: 'ru', label: 'RU', settingKey: null }, // always shown
]

export default function LangSwitcher() {
    const { i18n } = useTranslation()
    const current = i18n.language
    const [enabledLangs, setEnabledLangs] = useState(ALL_LANGS)

    useEffect(() => {
        supabase.from('app_settings').select('lang_en,lang_zh').eq('id', 1).single()
            .then(({ data }) => {
                if (!data) return
                const filtered = ALL_LANGS.filter(l => {
                    if (!l.settingKey) return true // ru always shown
                    return data[l.settingKey] !== false
                })
                setEnabledLangs(filtered.length > 0 ? filtered : ALL_LANGS)
            })
            .catch(() => { })
    }, [])

    const set = (lang) => {
        i18n.changeLanguage(lang)
        localStorage.setItem('rc_lang', lang)
    }

    return (
        <div style={{ display: 'flex', background: 'rgba(120,120,128,0.12)', borderRadius: 10, padding: 2, gap: 1 }}>
            {enabledLangs.map(({ code, label }) => (
                <div
                    key={code}
                    onClick={() => set(code)}
                    style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: current === code ? 'var(--app-text)' : 'var(--app-hint)',
                        cursor: 'pointer',
                        borderRadius: 8,
                        background: current === code ? 'var(--app-card)' : 'transparent',
                        boxShadow: current === code ? '0 2px 5px rgba(0,0,0,0.15)' : 'none',
                        transition: 'all 0.2s',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </div>
            ))}
        </div>
    )
}
