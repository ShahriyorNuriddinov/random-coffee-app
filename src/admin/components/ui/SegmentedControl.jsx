// iOS-style segmented control (tab switcher)
// tabs: [{ id, label, danger? }]
export default function SegmentedControl({ tabs, value, onChange }) {
    return (
        <div className="flex bg-[#ebebeb] rounded-[10px] p-[3px]">
            {tabs.map(({ id, label, danger }) => (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    className={`flex-1 text-center text-[12px] font-semibold py-[6px] rounded-lg transition-all ${value === id
                            ? 'bg-white shadow ' + (danger ? 'text-red-500' : 'text-gray-900')
                            : danger
                                ? 'text-red-400'
                                : 'text-gray-400'
                        }`}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}
