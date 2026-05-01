import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabaseClient'

const ALL_LANGS = [
    { code: 'en', label: 'EN', settingKey: 'lang_en' },
    { code: 'zh', label: '中文', settingKey: 'lang_zh' },
    { code: 'ru', label: 'RU', settingKey: 'lang_ru' },
]

export default function LangSwitcher() {
    const { i18n } = useTranslation()
    const current = i18n.language
    const [enabledLangs, setEnabledLangs] = useState([ALL_LANGS[0]])

    useEffect(() => {
        supabase
            .from('app_settings')
            .select('lang_en, lang_zh, lang_ru')
            .eq('id', 1)
            .single()
            .then(({ data }) => {
                if (!data) {
                    setEnabledLangs(ALL_LANGS)
                    return
                }
                const filtered = ALL_LANGS.filter(l => {
                    if (l.settingKey === 'lang_en') return data.lang_en !== false
                    if (l.settingKey === 'lang_zh') return data.lang_zh !== false
                    if (l.settingKey === 'lang_ru') return data.lang_ru !== false
                    return true
                })
                const available = filtered.length > 0 ? filtered : [ALL_LANGS[0]]
                setEnabledLangs(available)

                // Agar joriy til o'chirilgan bo'lsa — birinchi mavjud tilga o'tkazish
                const currentLang = localStorage.getItem('rc_lang') || i18n.language
                const isCurrentEnabled = available.some(l => l.code === currentLang)
                if (!isCurrentEnabled && available.length > 0) {
                    const fallback = available[0].code
                    i18n.changeLanguage(fallback)
                    localStorage.setItem('rc_lang', fallback)
                }
            })
            .catch(() => { setEnabledLangs(ALL_LANGS) })
    }, [])

    const set = (lang) => {
        i18n.changeLanguage(lang)
        localStorage.setItem('rc_lang', lang)
    }

    // Faqat bitta til bo'lsa — toggle ko'rsatmaslik
    if (enabledLangs.length === 1) {
        return (
            <span style={{
                fontSize: 11, fontWeight: 700,
                color: 'var(--app-hint)',
                padding: '4px 8px',
            }}>
                {enabledLangs[0].label}
            </span>
        )
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
