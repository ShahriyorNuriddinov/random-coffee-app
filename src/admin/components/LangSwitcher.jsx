// Language switcher — EN / 中文 / RU
import PropTypes from 'prop-types'

export default function LangSwitcher({ lang, setLang }) {
    const langs = [
        { code: 'en', label: 'EN' },
        { code: 'zh', label: '中文' },
        { code: 'ru', label: 'RU' },
    ]
    return (
        <div className="flex bg-black/[0.08] rounded-[10px] p-[2px]" style={{ width: 120 }}>
            {langs.map(l => (
                <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`flex-1 text-center py-1 text-[11px] font-bold rounded-lg transition-all ${lang === l.code ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                >
                    {l.label}
                </button>
            ))}
        </div>
    )
}

LangSwitcher.propTypes = {
    lang: PropTypes.string.isRequired,
    setLang: PropTypes.func.isRequired,
}
