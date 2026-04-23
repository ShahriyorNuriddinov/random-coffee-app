import { cn } from '@/lib/utils'

/**
 * InputCard — iOS-style card wrapper with label
 */
function InputCard({ label, children, className }) {
    return (
        <div className={cn('input-card', className)}>
            {label && <span className="input-card-label">{label}</span>}
            {children}
        </div>
    )
}

/**
 * Input — bare transparent input inside InputCard
 */
function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                'w-full border-none outline-none text-[17px] font-medium bg-transparent',
                'text-[var(--app-text)] placeholder:text-[#c7c7cc] font-[inherit]',
                className
            )}
            {...props}
        />
    )
}

export { InputCard, Input }
