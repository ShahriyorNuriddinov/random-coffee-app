import { useState } from 'react'
import { cn } from '@/lib/utils'

export function DatePicker({ value, onChange, label, lang = 'en' }) {
    const placeholder = lang === 'zh' ? '日日.月月.年年年年' : 'DD.MM.YYYY'

    // internal string state for display
    const [text, setText] = useState(() => {
        if (!value) return ''
        return [
            String(value.getDate()).padStart(2, '0'),
            String(value.getMonth() + 1).padStart(2, '0'),
            String(value.getFullYear()),
        ].join('.')
    })

    const handleChange = (e) => {
        const raw = e.target.value

        // strip non-digits, keep only numbers
        const digits = raw.replace(/\D/g, '').slice(0, 8)

        // build masked string
        let masked = ''
        if (digits.length > 0) masked += digits.slice(0, 2)
        if (digits.length > 2) masked += '.' + digits.slice(2, 4)
        if (digits.length > 4) masked += '.' + digits.slice(4, 8)

        setText(masked)

        // validate and emit Date when 8 digits entered
        if (digits.length === 8) {
            const d = parseInt(digits.slice(0, 2), 10)
            const m = parseInt(digits.slice(2, 4), 10)
            const y = parseInt(digits.slice(4, 8), 10)
            const date = new Date(y, m - 1, d)
            if (
                date.getFullYear() === y &&
                date.getMonth() + 1 === m &&
                date.getDate() === d
            ) {
                onChange(date)
                return
            }
        }
        onChange(null)
    }

    return (
        <div className={cn(
            'w-full rounded-[14px] px-4 py-3 mb-2',
            'border border-[var(--app-border)] bg-[var(--app-card)]',
        )}>
            {label && <span className="input-card-label">{label}</span>}
            <input
                type="text"
                value={text}
                onChange={handleChange}
                placeholder={placeholder}
                inputMode="numeric"
                maxLength={10}
                style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: 17,
                    fontWeight: 500,
                    color: 'var(--app-text)',
                    background: 'transparent',
                    fontFamily: 'inherit',
                }}
            />
        </div>
    )
}
