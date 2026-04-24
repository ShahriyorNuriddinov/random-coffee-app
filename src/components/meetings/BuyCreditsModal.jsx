/**
 * BuyCreditsModal — Airwallex payment integration
 *
 * Flow:
 * 1. User selects plan
 * 2. Frontend calls Supabase Edge Function → Airwallex creates Payment Intent
 * 3. Airwallex Checkout opens (hosted page or embedded)
 * 4. On success → confirmPayment() adds credits to user
 *
 * To enable real payments:
 * 1. Get Airwallex credentials: https://www.airwallex.com/hk
 * 2. Set in Supabase Dashboard → Settings → Edge Functions:
 *    AIRWALLEX_CLIENT_ID, AIRWALLEX_API_KEY, AIRWALLEX_ENV=prod
 * 3. Load Airwallex JS SDK (add to index.html):
 *    <script src="https://checkout.airwallex.com/assets/bundle.x.min.js"></script>
 */

import { useState } from 'react'
import { useApp } from '@/store/useAppStore'
import { supabase, confirmPayment } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

const PLANS = [
    {
        label: 'Standard',
        price: 'HK$299',
        amount: 299,
        credits: 4,
        desc: '4 Cups / ~1 Month',
    },
    {
        label: 'Best Value',
        price: 'HK$1,999',
        amount: 1999,
        credits: 50,
        desc: '50 Cups / ~1 Year',
        badge: 'Best Value',
    },
]

export default function BuyCreditsModal({ onClose }) {
    const { user, setSubscription } = useApp()
    const [selected, setSelected] = useState(0)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState('select') // select | processing | success | error
    const [errorMsg, setErrorMsg] = useState('')

    const plan = PLANS[selected]

    const handlePay = async () => {
        if (!user?.id) return
        setLoading(true)
        setStep('processing')

        try {
            // 1. Create Payment Intent via Edge Function
            const { data, error } = await supabase.functions.invoke('create-payment-intent', {
                body: {
                    userId: user.id,
                    amount: plan.amount,
                    currency: 'HKD',
                    credits: plan.credits,
                },
            })

            if (error || !data?.success) {
                throw new Error(data?.error || 'Failed to create payment intent')
            }

            // 2. Mock mode (no credentials) — skip real payment
            if (data.mock) {
                console.log('[BuyCredits] Mock payment — skipping Airwallex checkout')
                await handlePaymentSuccess(data.paymentIntentId)
                return
            }

            // 3. Real Airwallex Checkout
            // Requires Airwallex JS SDK loaded in index.html:
            // <script src="https://checkout.airwallex.com/assets/bundle.x.min.js"></script>
            if (typeof window.Airwallex === 'undefined') {
                // Fallback: open Airwallex hosted checkout in new tab
                // In production, use embedded checkout instead
                toast.error('Payment SDK not loaded. Please refresh and try again.')
                setStep('error')
                setErrorMsg('Payment SDK not loaded')
                setLoading(false)
                return
            }

            window.Airwallex.init({
                env: import.meta.env.VITE_AIRWALLEX_ENV || 'demo',
                origin: window.location.origin,
            })

            const paymentResult = await window.Airwallex.redirectToCheckout({
                env: import.meta.env.VITE_AIRWALLEX_ENV || 'demo',
                intent_id: data.paymentIntentId,
                client_secret: data.clientSecret,
                currency: 'HKD',
                successUrl: `${window.location.origin}?payment=success&intent=${data.paymentIntentId}&credits=${plan.credits}`,
                failUrl: `${window.location.origin}?payment=failed`,
            })

            if (paymentResult?.status === 'SUCCEEDED') {
                await handlePaymentSuccess(data.paymentIntentId)
            }

        } catch (e) {
            console.error('[BuyCredits]', e)
            setStep('error')
            setErrorMsg(e.message || 'Payment failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handlePaymentSuccess = async (paymentIntentId) => {
        const result = await confirmPayment({
            userId: user.id,
            paymentIntentId,
            credits: plan.credits,
            amount: plan.amount,
            method: 'airwallex',
        })

        if (result.success) {
            setSubscription(s => ({
                ...s,
                credits: result.newCredits,
                status: 'active',
            }))
            setStep('success')
        } else {
            setStep('error')
            setErrorMsg('Payment confirmed but credits not added. Contact support.')
        }
    }

    return (
        <div onClick={step === 'processing' ? undefined : onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--app-card)', width: '100%', maxWidth: 400,
                borderRadius: 20, padding: 24, boxSizing: 'border-box', textAlign: 'center',
            }}>

                {/* ── Select plan ── */}
                {step === 'select' && (
                    <>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>
                            Get Coffee Credits ☕
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16 }}>
                            1 credit = 1 AI-matched meeting per week
                        </p>

                        {/* Plan selector */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                            {PLANS.map((p, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelected(i)}
                                    style={{
                                        background: selected === i ? 'rgba(0,122,255,0.06)' : 'rgba(120,120,128,0.06)',
                                        border: selected === i ? '1.5px solid var(--app-primary)' : '1.5px solid transparent',
                                        padding: '14px 16px', borderRadius: 14,
                                        cursor: 'pointer', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--app-primary)' }}>{p.price}</div>
                                        <div style={{ fontSize: 12, color: 'var(--app-hint)', marginTop: 2 }}>{p.desc}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {p.badge && (
                                            <span style={{
                                                background: 'rgba(52,199,89,0.15)', color: '#34c759',
                                                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                                            }}>
                                                {p.badge}
                                            </span>
                                        )}
                                        <span style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            border: `2px solid ${selected === i ? 'var(--app-primary)' : 'var(--app-hint)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {selected === i && (
                                                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--app-primary)' }} />
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment methods */}
                        <div style={{
                            fontSize: 12, color: 'var(--app-hint)', marginBottom: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                            <span>🔒</span>
                            <span>Visa · Mastercard · WeChat Pay · Alipay · FPS</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                                className="btn-gradient"
                                style={{ borderRadius: 14 }}
                                onClick={handlePay}
                                disabled={loading}
                            >
                                Pay {plan.price}
                            </button>
                            <button onClick={onClose} style={{
                                width: '100%', padding: '13px 0', borderRadius: 14,
                                border: 'none', background: 'rgba(120,120,128,0.1)',
                                color: 'var(--app-text)', fontSize: 15, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                Cancel
                            </button>
                        </div>
                    </>
                )}

                {/* ── Processing ── */}
                {step === 'processing' && (
                    <>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            border: '3px solid rgba(0,122,255,0.15)',
                            borderTop: '3px solid var(--app-primary)',
                            margin: '0 auto 20px',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--app-text)', marginBottom: 8 }}>
                            Processing payment...
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)' }}>
                            Please wait, do not close this window.
                        </div>
                        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
                    </>
                )}

                {/* ── Success ── */}
                {step === 'success' && (
                    <>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>
                            Payment Successful!
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', marginBottom: 24, lineHeight: 1.5 }}>
                            {plan.credits} coffee credits added to your account.
                        </div>
                        <button className="btn-gradient" style={{ borderRadius: 14 }} onClick={onClose}>
                            Start Matching 🚀
                        </button>
                    </>
                )}

                {/* ── Error ── */}
                {step === 'error' && (
                    <>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>😔</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>
                            Payment Failed
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--app-hint)', marginBottom: 24, lineHeight: 1.5 }}>
                            {errorMsg || 'Something went wrong. Please try again.'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="btn-gradient" style={{ borderRadius: 14 }} onClick={() => setStep('select')}>
                                Try Again
                            </button>
                            <button onClick={onClose} style={{
                                width: '100%', padding: '13px 0', borderRadius: 14,
                                border: 'none', background: 'rgba(120,120,128,0.1)',
                                color: 'var(--app-text)', fontSize: 15, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
