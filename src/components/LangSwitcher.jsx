import { useTranslation } from 'react-i18next'

const LANGS = [
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '中文' },
    { code: 'ru', label: 'RU' },
]

export default function LangSwitcher() {
    const { i18n } = useTranslation()
    const current = i18n.language

    const set = (lang) => {
        i18n.changeLanguage(lang)
        localStorage.setItem('rc_lang', lang)
    }

    return (
        <div style={{ display: 'flex', background: 'rgba(120,120,128,0.12)', borderRadius: 10, padding: 2, gap: 1 }}>
            {LANGS.map(({ code, label }) => (
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
