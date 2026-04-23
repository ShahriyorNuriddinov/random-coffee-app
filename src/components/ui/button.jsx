import { cn } from '@/lib/utils'

/**
 * App Button — 3 variants:
 *  - "gradient" (default): blue gradient, full-width, 17px
 *  - "ghost": transparent, primary color text
 *  - "outline": bordered
 */
function Button({ className, variant = 'gradient', children, ...props }) {
    if (variant === 'gradient') {
        return (
            <button
                className={cn('btn-gradient', className)}
                {...props}
            >
                {children}
            </button>
        )
    }
    if (variant === 'ghost') {
        return (
            <button
                className={cn('btn-ghost-primary', className)}
                {...props}
            >
                {children}
            </button>
        )
    }
    // outline
    return (
        <button
            className={cn(
                'w-full py-3 rounded-[14px] text-[15px] font-semibold border cursor-pointer transition-opacity active:opacity-60',
                'border-[var(--app-border)] bg-transparent text-[var(--app-text)]',
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}

export { Button }
