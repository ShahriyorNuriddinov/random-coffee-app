import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BottomNav from '@/components/BottomNav'
import ScreenHeader from '@/components/ui/ScreenHeader'

const PRINCIPLES = [
    { nameKey: 'p1_name', textKey: 'p1_text', num: '01' },
    { nameKey: 'p2_name', textKey: 'p2_text', num: '02' },
    { nameKey: 'p3_name', textKey: 'p3_text', num: '03' },
]

const FAQS = [
    { q: 'q1', a: 'a1' },
    { q: 'q2', a: 'a2' },
    { q: 'q3', a: 'a3' },
    { q: 'q4', a: 'a4' },
    { q: 'q5', a: 'a5' },
]

export default function FaqScreen() {
    const { t } = useTranslation()
    const [openIdx, setOpenIdx] = useState(null)

    return (
        <div className="app-screen">
            <ScreenHeader title="FAQ" />

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
                <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20 }}>

                    <div>
                        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: 'var(--app-text)' }}>
                            {t('p_title')}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.4 }}>
                            {t('p_subtitle')}
                        </div>
                    </div>

                    {PRINCIPLES.map(p => (
                        <PrincipleCard key={p.num} num={p.num} name={t(p.nameKey)} text={t(p.textKey)} />
                    ))}

                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)' }}>
                        {t('faq_title')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {FAQS.map((item, i) => (
                            <AccordionItem
                                key={item.q}
                                question={t(item.q)}
                                answer={t(item.a)}
                                open={openIdx === i}
                                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                            />
                        ))}
                    </div>

                </div>
            </div>

            <BottomNav active="faq" />
        </div>
    )
}

function PrincipleCard({ num, name, text }) {
    return (
        <div style={{
            background: 'var(--app-card)', borderRadius: 16, padding: 20,
            border: '0.5px solid var(--app-border)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--app-text)' }}>{name}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--app-primary)', opacity: 0.8 }}>{num}</div>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--app-hint)' }}>{text}</div>
        </div>
    )
}

function AccordionItem({ question, answer, open, onToggle }) {
    return (
        <div style={{
            background: 'var(--app-card)', borderRadius: 14,
            border: '0.5px solid var(--app-border)', overflow: 'hidden',
        }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%', padding: '14px 16px',
                    background: 'none', border: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', fontSize: 15, fontWeight: 600,
                    color: 'var(--app-text)', fontFamily: 'inherit',
                    textAlign: 'left', gap: 12,
                }}
            >
                <span>{question}</span>
                <span style={{
                    fontSize: 11, color: 'var(--app-hint)', flexShrink: 0,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s',
                }}>▼</span>
            </button>

            {open && (
                <div style={{
                    padding: '12px 16px 14px',
                    fontSize: 14, lineHeight: 1.5, color: 'var(--app-hint)',
                    borderTop: '0.5px solid var(--app-border)',
                }}>
                    {answer}
                </div>
            )}
        </div>
    )
}
