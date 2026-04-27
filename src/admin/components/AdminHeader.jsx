// Admin panel top header — title + lang switcher
import PropTypes from 'prop-types'
import LangSwitcher from './LangSwitcher'
import { getT } from '../i18n'

export default function AdminHeader({ tab, lang, setLang }) {
    const t = getT('nav', lang)

    return (
        <div className="bg-white border-b border-black/5 sticky top-0 z-10">
            <div className="w-full max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
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
