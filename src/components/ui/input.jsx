import { cn } from '@/lib/utils'

/**
 * InputCard — iOS-style card wrapper with accessible label
 */
function InputCard({ label, inputId, children, className }) {
    return (
        <div className={cn('input-card', className)}>
            {label && (
                <label htmlFor={inputId} className="input-card-label">
                    {label}
                </label>
            )}
            {children}
        </div>
    )
}

/**
 * Input — bare transparent input inside InputCard
 */
function Input({ className, style, ...props }) {
    return (
        <input
            className={cn(
                'w-full border-none outline-none text-[17px] font-medium bg-transparent font-[inherit]',
                'text-[var(--app-text)]',
                className
            )}
            style={{
                color: 'var(--app-text)',
                WebkitTextFillColor: 'var(--app-text)',
                caretColor: 'var(--app-primary)',
                ...style,
            }}
            {...props}
        />
    )
}

export { InputCard, Input }
