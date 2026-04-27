// Admin panel top header — title + lang switcher
import PropTypes from 'prop-types'
import LangSwitcher from './LangSwitcher'
import { getT } from '../i18n'

export default function AdminHeader({ tab, lang, setLang }) {
    const t = getT('nav', lang)

    return (
        <div className="bg-white border-b border-black/5 sticky top-0 z-10">
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}
                className="py-4 flex items-center justify-between">
                <span className="text-2xl font-extrabold tracking-tight">
                    {t[tab] ?? tab}
                </span>
                <LangSwitcher lang={lang} setLang={setLang} />
            </div>
        </div>
    )
}

AdminHeader.propTypes = {
    tab: PropTypes.string.isRequired,
    lang: PropTypes.string.isRequired,
    setLang: PropTypes.func.isRequired,
}
