// White card with border and shadow — base container
export default function Card({ children, className = '', onClick }) {
    const base = 'bg-white rounded-2xl border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
    if (onClick) {
        return (
            <button onClick={onClick} className={`${base} w-full text-left ${className}`}>
                {children}
            </button>
        )
    }
    return <div className={`${base} ${className}`}>{children}</div>
}
