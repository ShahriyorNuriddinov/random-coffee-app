// Primary gradient button + Danger variant
export function PrimaryButton({ children, onClick, disabled, className = '' }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full bg-gradient-to-br from-[#007aff] to-[#5856d6] text-white py-4 rounded-2xl text-[16px] font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${className}`}
        >
            {children}
        </button>
    )
}

export function DangerButton({ children, onClick, className = '' }) {
    return (
        <button
            onClick={onClick}
            className={`w-full bg-white text-red-500 border border-black/5 py-4 rounded-2xl text-[16px] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${className}`}
        >
            {children}
        </button>
    )
}

export function SecondaryButton({ children, onClick, disabled, className = '' }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full bg-white border border-black/5 text-[#007aff] py-3 rounded-xl text-[15px] font-bold active:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2 ${className}`}
        >
            {children}
        </button>
    )
}
