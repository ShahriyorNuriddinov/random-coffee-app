// Admin panel top header — title + lang switcher
import PropTypes from 'prop-types'
import LangSwitcher from './LangSwitcher'
import { getT } from '../i18n'

export default function AdminHeader({ tab, lang, setLang }) {
    const t = getT('nav', lang)

    return (
        <div className="bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
            <span className="text-2xl font-extrabold tracking-tight">
                {t[tab] ?? tab}
            </span>
            <LangSwitcher lang={lang} setLang={setLang} />
        </div>
    )
}

AdminHeader.propTypes = {
    tab: PropTypes.string.isRequired,
    lang: PropTypes.string.isRequired,
    setLang: PropTypes.func.isRequired,
}
