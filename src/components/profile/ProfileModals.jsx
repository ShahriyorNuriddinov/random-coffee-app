import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export function RefModal({ referralCode, onClose }) {
    const { t } = useTranslation()
    const siteUrl = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const link = referralCode ? `${siteUrl}/ref/${referralCode}` : '...'
    const handleCopy = () => {
        if (!referralCode) return
        navigator.clipboard?.writeText(link)
        toast.success(t('toast_link_copied', 'Link copied!'))
        onClose()
    }
    return (
        <Modal title={t('ref_title', 'Invite Friends, Get Free Credits!')} onClose={onClose}>
            <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16 }}>
                {t('ref_desc', 'Share your unique link. When a friend signs up and activates a subscription, both of you get +1 free coffee credit!')}
            </p>
            <input readOnly value={link} style={{
                width: '100%', padding: 12, borderRadius: 10,
                border: '1px solid var(--app-border)', background: 'var(--app-bg)',
                color: 'var(--app-text)', fontSize: 13, boxSizing: 'border-box',
                marginBottom: 12, fontFamily: 'inherit',
            }} />
            <button className="btn-gradient" onClick={handleCopy}>{t('ref_copy', 'Copy Link')}</button>
        </Modal>
    )
}

export function GiftModal({ onClose }) {
    const { t } = useTranslation()
    const [giftEmail, setGiftEmail] = useState('')
    const [selected, setSelected] = useState(0)
    const [plans, setPlans] = useState(null)
    const [step, setStep] = useState('select') // 'select' | 'processing' | 'success' | 'error'
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        supabase
            .from('app_settings')
            .select('standard_price,standard_cups,best_price,best_cups')
            .eq('id', 1)
            .single()
            .then(({ data }) => {
                const sp = Number(data?.standard_price ?? 15)
                const sc = Number(data?.standard_cups ?? 1)
                const bp = Number(data?.best_price ?? 30)
                const bc = Number(data?.best_cups ?? 3)
                setPlans([
                    { price: `HK$${sp}`, credits: sc, desc: t('gift_plan_month') },
                    { price: `HK$${bp}`, credits: bc, desc: t('gift_plan_year') },
                ])
            })
            .catch(() => setPlans([
                { price: 'HK$15', credits: 1, desc: t('gift_plan_month') },
                { price: 'HK$30', credits: 3, desc: t('gift_plan_year') },
            ]))
    }, [])

    const plan = (plans ?? [])[selected]

    const handlePay = async () => {
        // Validate email
        if (!giftEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(giftEmail.trim())) {
            toast.error(t('err_email'))
            return
        }
        if (!plan) return

        setLoading(true)
        setStep('processing')

        try {
            // Find recipient by email
            const { data: recipient } = await supabase
                .from('profiles')
                .select('id, name, coffee_credits')
                .eq('email', giftEmail.trim().toLowerCase())
                .maybeSingle()

            if (!recipient) {
                setStep('error')
                setLoading(false)
                return
            }

            // Add credits to recipient (mock payment — same as BuyCreditsModal mock flow)
            const { error } = await supabase.rpc('increment_credits', {
                p_user_id: recipient.id,
                p_credits: plan.credits,
            })

            if (error) throw error

            setStep('success')
        } catch (e) {
            console.error('[GiftModal]', e)
            setStep('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal title={t('gift_title')} onClose={onClose}>

            {/* ── Select ── */}
            {step === 'select' && (<>
                <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16 }}>
                    {t('gift_desc_email')}
                </p>
                <input
                    type="email"
                    value={giftEmail}
                    onChange={e => setGiftEmail(e.target.value)}
                    placeholder={t('email_placeholder')}
                    style={{
                        width: '100%', padding: 12, borderRadius: 10,
                        border: '1px solid var(--app-border)', background: 'var(--app-bg)',
                        color: 'var(--app-text)', fontSize: 15, boxSizing: 'border-box',
                        marginBottom: 12, fontFamily: 'inherit', outline: 'none',
                    }}
                />
                {plans === null ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid rgba(0,122,255,0.15)', borderTop: '3px solid var(--app-primary)', animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : plans.map((p, i) => (
                    <div key={i} onClick={() => setSelected(i)} style={{
                        background: selected === i ? 'rgba(0,122,255,0.06)' : 'rgba(120,120,128,0.06)',
                        border: selected === i ? '1.5px solid var(--app-primary)' : '1.5px solid transparent',
                        padding: '12px 16px', borderRadius: 12, marginBottom: 8,
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--app-primary)' }}>
                                {p.price} · {p.credits === 1 ? t('plan_cup', { count: p.credits }) : t('plan_cups', { count: p.credits })}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--app-hint)', marginTop: 2 }}>{p.desc}</div>
                        </div>
                        <span style={{
                            width: 20, height: 20, borderRadius: '50%',
                            border: `2px solid ${selected === i ? 'var(--app-primary)' : 'var(--app-hint)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {selected === i && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--app-primary)' }} />}
                        </span>
                    </div>
                ))}
                <button
                    className="btn-gradient"
                    style={{ marginTop: 8 }}
                    disabled={plans === null || loading}
                    onClick={handlePay}
                >
                    {t('gift_pay_btn')}
                </button>
            </>)}

            {/* ── Processing ── */}
            {step === 'processing' && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,122,255,0.15)', borderTop: '3px solid var(--app-primary)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)' }}>{t('processing')}</div>
                </div>
            )}

            {/* ── Success ── */}
            {step === 'success' && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>
                        {t('payment_success')}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--app-hint)', marginBottom: 20, lineHeight: 1.5 }}>
                        {plan?.credits} {t('payment_success_hint')} {giftEmail}
                    </div>
                    <button className="btn-gradient" style={{ borderRadius: 14 }} onClick={onClose}>
                        {t('got_it')}
                    </button>
                </div>
            )}

            {/* ── Error (user not found) ── */}
            {step === 'error' && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>
                        {t('payment_failed')}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--app-hint)', marginBottom: 20, lineHeight: 1.5 }}>
                        {t('err_email')} — пользователь с таким email не найден.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn-gradient" style={{ borderRadius: 14 }} onClick={() => setStep('select')}>
                            {t('try_again')}
                        </button>
                        <button onClick={onClose} style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            )}

        </Modal>
    )
}
