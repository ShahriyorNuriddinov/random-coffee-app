/**
 * Spinner — always-spinning loader
 * Uses a self-contained <style> injected once into <head>
 * so the keyframe is never lost when navigating between screens.
 */

let injected = false

function injectKeyframe() {
    if (injected || typeof document === 'undefined') return
    injected = true
    const id = 'rc-spin-keyframe'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
        @keyframes rc-spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `
    document.head.appendChild(style)
}

export default function Spinner({
    size = 40,
    thickness = 3,
    color = 'var(--app-primary)',
    trackColor = 'rgba(0,122,255,0.12)',
    style: extraStyle = {},
}) {
    injectKeyframe()

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                border: `${thickness}px solid ${trackColor}`,
                borderTopColor: color,
                animation: 'rc-spin 0.9s linear infinite',
                flexShrink: 0,
                ...extraStyle,
            }}
        />
    )
}
