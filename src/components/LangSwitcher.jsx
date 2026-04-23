import { useTranslation } from 'react-i18next'

export default function LangSwitcher() {
    const { i18n } = useTranslation()
    const current = i18n.language

    const set = (lang) => i18n.changeLanguage(lang)

    return (
        <div className="lang-switcher">
            <div className={`lang-btn ${current === 'en' ? 'active' : ''}`} onClick={() => set('en')}>EN</div>
            <div className={`lang-btn ${current === 'zh' ? 'active' : ''}`} onClick={() => set('zh')}>中文</div>
        </div>
    )
}
