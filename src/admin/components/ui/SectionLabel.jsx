// Gray uppercase section label used throughout admin panel
export default function SectionLabel({ children, className = '' }) {
    return (
        <p className={`text-[12px] uppercase tracking-wide font-semibold text-gray-400 mb-2 pl-1 ${className}`}>
            {children}
        </p>
    )
}
