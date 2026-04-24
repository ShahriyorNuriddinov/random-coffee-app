export default function BoostModal({ onClose }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 200, padding: 24,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: 24,
                    padding: '36px 28px 28px',
                    maxWidth: 380, width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                }}
            >
                {/* Lightning icon */}
                <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>⚡</div>

                <div style={{
                    fontSize: 22, fontWeight: 800, color: '#1c1c1e',
                    marginBottom: 12, letterSpacing: -0.5,
                }}>
                    Boost Activated!
                </div>

                <p style={{
                    fontSize: 15, color: '#8e8e93', lineHeight: 1.55,
                    marginBottom: 28, fontWeight: 400,
                }}>
                    We are looking for a match for you among users who have also enabled Boost. This may take an indefinite amount of time depending on available pairs.
                </p>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '16px 0',
                        borderRadius: 16, border: 'none',
                        background: 'linear-gradient(90deg, #007aff 0%, #00c6ff 100%)',
                        color: '#fff', fontSize: 17, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 6px 20px rgba(0,122,255,0.3)',
                    }}
                >
                    Got it
                </button>
            </div>
        </div>
    )
}
