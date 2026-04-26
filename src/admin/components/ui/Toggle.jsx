// iOS-style toggle switch
export default function Toggle({ checked, onChange }) {
    return (
        <label className="relative inline-block w-11 h-[26px] flex-shrink-0 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="opacity-0 w-0 h-0"
            />
            <span
                className={`absolute inset-0 rounded-full transition-colors duration-300 ${checked ? 'bg-[#34c759]' : 'bg-[#e5e5ea]'
                    }`}
            >
                <span
                    className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] bg-white rounded-full shadow transition-transform duration-300 ${checked ? 'translate-x-[18px]' : ''
                        }`}
                />
            </span>
        </label>
    )
}
