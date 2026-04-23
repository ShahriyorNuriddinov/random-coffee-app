/**
 * Reusable modal overlay
 * @param {string} title
 * @param {ReactNode} children
 * @param {function} onClose
 */
export default function Modal({ title, children, onClose }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 100, padding: 20,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--app-card)', borderRadius: 20, padding: 24,
                    maxWidth: 360, width: '100%',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                }}
            >
                <div style={{
                    fontSize: 18, fontWeight: 800, marginBottom: 12,
                    color: 'var(--app-text)', textAlign: 'center',
                }}>
                    {title}
                </div>

                {children}

                <button
                    onClick={onClose}
                    style={{
                        width: '100%', marginTop: 8,
                        background: 'rgba(120,120,128,0.1)',
                        border: 'none', borderRadius: 12,
                        padding: '12px 0', fontSize: 15, fontWeight: 600,
                        cursor: 'pointer', color: 'var(--app-text)', fontFamily: 'inherit',
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    )
}
