/**
 * Base card container
 */
export function Card({ children, style }) {
    return (
        <div style={{
            background: 'var(--app-card)',
            borderRadius: 14,
            border: '0.5px solid var(--app-border)',
            overflow: 'hidden',
            ...style,
        }}>
            {children}
        </div>
    )
}

/**
 * Single row inside a Card
 * @param {string} label
 * @param {ReactNode} value - right side content
 * @param {ReactNode} right - icon/toggle on far right
 * @param {function} onClick
 * @param {boolean} isLast - removes bottom border
 */
export function CardRow({ label, value, right, onClick, isLast }) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '13px 16px',
                cursor: onClick ? 'pointer' : 'default',
                borderBottom: isLast ? 'none' : '0.5px solid var(--app-border)',
            }}
        >
            <span style={{ fontWeight: 500, fontSize: 15, color: 'var(--app-text)' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {value}
                {right}
                {onClick && <span style={{ color: 'var(--app-hint)', fontSize: 12 }}>▶</span>}
            </div>
        </div>
    )
}
