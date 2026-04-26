// Language switcher — EN / 中文
// Used in AdminApp header and AdminLogin
export default function LangSwitcher({ lang, setLang, width = 90 }) {
    return (
        <div
            className="flex bg-black/[0.08] rounded-[10px] p-[2px]"
            style={{ width }}
        >
            {['en', 'zh'].map(l => (
                <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 text-center py-1 text-[11px] font-bold rounded-lg transition-all ${lang === l ? 'bg-white shadow text-black' : 'text-gray-500'
                        }`}
                >
                    {l === 'en' ? 'EN' : '中文'}
                </button>
            ))}
        </div>
    )
}
