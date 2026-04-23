import { useState } from 'react'

/**
 * iOS-style toggle switch
 * @param {boolean} checked
 * @param {function} onChange
 */
export function Toggle({ checked, onChange }) {
    return (
        <div
            onClick={e => { e.stopPropagation(); onChange(!checked) }}
            style={{
                position: 'relative', width: 44, height: 26,
                flexShrink: 0, cursor: 'pointer',
            }}
        >
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 26,
                background: checked ? '#34c759' : '#e5e5ea',
                transition: 'background 0.3s',
            }} />
            <div style={{
                position: 'absolute', width: 22, height: 22,
                background: 'white', borderRadius: '50%',
                top: 2, left: checked ? 20 : 2,
                transition: 'left 0.3s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }} />
        </div>
    )
}

/**
 * Stateful toggle (manages its own state)
 */
export function StatefulToggle({ defaultChecked = true }) {
    const [on, setOn] = useState(defaultChecked)
    return <Toggle checked={on} onChange={setOn} />
}
