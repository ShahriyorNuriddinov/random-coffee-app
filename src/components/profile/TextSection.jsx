import { useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'

/**
 * Section with auto-resizing textarea
 * @param {string} title
 * @param {string} tip
 * @param {string} value
 * @param {function} onChange
 * @param {string} placeholder
 */
export default function TextSection({ title, tip, value, onChange, placeholder }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">{title}</div>
            <Card>
                <div style={{ padding: '14px 16px' }}>
                    <AutoTextarea value={value} onChange={onChange} placeholder={placeholder} />
                </div>
            </Card>
            {tip && <p className="tip-text">{tip}</p>}
        </div>
    )
}

function AutoTextarea({ value, onChange, placeholder }) {
    const ref = useRef()

    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto'
            ref.current.style.height = ref.current.scrollHeight + 'px'
        }
    }, [value])

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            style={{
                width: '100%', border: 'none', outline: 'none',
                fontSize: 16, fontFamily: 'inherit',
                color: 'var(--app-text)', background: 'transparent',
                resize: 'none', lineHeight: 1.4, minHeight: 44, overflow: 'hidden',
            }}
        />
    )
}
