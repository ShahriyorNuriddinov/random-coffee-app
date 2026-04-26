import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

export function RefModal({ referralCode, onClose }) {
    const { t } = useTranslation()
    const link = referralCode ? `https://randomcoffee.app/ref/${referralCode}` : '...'
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
    const [giftPhone, setGiftPhone] = useState('')
    const [selected, setSelected] = useState(0)
    const plans = [
        { price: 'HK$299', credits: 4, desc: t('gift_plan_month', '~1 month of networking') },
        { price: 'HK$1,999', credits: 50, desc: t('gift_plan_year', '~1 year of networking') },
    ]
    return (
        <Modal title={t('gift_title', 'Gift Coffee Credits')} onClose={onClose}>
            <p style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16 }}>
                {t('gift_desc', "Enter your friend's phone number and choose a package.")}
            </p>
            <input type="tel" value={giftPhone} onChange={e => setGiftPhone(e.target.value)}
                placeholder="Friend's phone number" style={{
                    width: '100%', padding: 12, borderRadius: 10,
                    border: '1px solid var(--app-border)', background: 'var(--app-bg)',
                    color: 'var(--app-text)', fontSize: 15, boxSizing: 'border-box',
                    marginBottom: 12, fontFamily: 'inherit', outline: 'none',
                }} />
            {plans.map((p, i) => (
                <div key={i} onClick={() => setSelected(i)} style={{
                    background: selected === i ? 'rgba(0,122,255,0.06)' : 'rgba(120,120,128,0.06)',
                    border: selected === i ? '1.5px solid var(--app-primary)' : '1.5px solid transparent',
                    padding: '12px 16px', borderRadius: 12, marginBottom: 8,
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--app-primary)' }}>{p.price}</div>
                        <div style={{ fontSize: 12, color: 'var(--app-hint)', marginTop: 2 }}>{p.desc}</div>
                    </div>
                    <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${selected === i ? 'var(--app-primary)' : 'var(--app-hint)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {selected === i && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--app-primary)' }} />}
                    </span>
                </div>
            ))}
            <button className="btn-gradient" style={{ marginTop: 8 }} onClick={onClose}>{t('gift_pay_btn', 'Continue to Payment')}</button>
        </Modal>
    )
}
