// HTML: meetings.html → #modal-feedback
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import { supabase, completeMeeting, cancelMeeting } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function FeedbackModal({ onClose, onPost, matchId }) {
    const { t } = useTranslation()
    const { user } = useApp()
    const [step, setStep] = useState('initial')
    const [rating, setRating] = useState(null)
    const [note, setNote] = useState('')
    const [failReason, setFailReason] = useState(null)
    const [saving, setSaving] = useState(false)

    const RATINGS = ['Not great 😒', 'Fine 😐', 'Good 😊', 'Excellent 🤩']
    const FAIL_REASONS = [
        'Time conflict ⏳',
        'Not interested 🤷‍♂️',
        "Didn't like the partner 👎",
        'No response 📭',
        'Custom reason ✏️',
    ]

    const saveFeedback = async ({ status, ratingVal, noteVal, reason }) => {
        if (!user?.id) return
        setSaving(true)
        try {
            await supabase.from('meeting_feedback').upsert({
                user_id: user.id,
                match_id: matchId || null,
                status,
                rating: ratingVal || null,
                note: noteVal || null,
                fail_reason: reason || null,
                created_at: new Date().toISOString(),
            })
        } catch (e) {
            console.error('[FeedbackModal] save error:', e)
        } finally {
            setSaving(false)
        }
    }

    const handleSaveSuccess = async () => {
        await saveFeedback({ status: 'success', ratingVal: rating, noteVal: note })
        if (matchId) await completeMeeting(matchId)
        setStep('reward')
    }

    const handleSaveFail = async () => {
        await saveFeedback({ status: 'fail', reason: failReason })
        if (matchId) await cancelMeeting(matchId)
        onClose()
        toast.success(t('send') + ' ✓')
    }

    const RadioBtn = ({ label, active, onClick }) => (
        <div onClick={onClick} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            background: active ? 'rgba(0,122,255,0.08)' : 'rgba(0,0,0,0.03)',
            border: active ? '1px solid rgba(0,122,255,0.2)' : '1px solid transparent',
            borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            color: active ? 'var(--app-primary)' : 'var(--app-text)',
            transition: 'all 0.2s', marginBottom: 8,
        }}>
            {label}
            {active && <span style={{ color: 'var(--app-primary)' }}>✓</span>}
        </div>
    )

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--app-card)', width: '100%', maxWidth: 400,
                borderRadius: 20, padding: 24, boxSizing: 'border-box',
                maxHeight: '90vh', overflowY: 'auto', textAlign: 'center',
            }}>

                {/* ── Initial ── */}
                {step === 'initial' && (
                    <>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 16 }}>
                            {t('feedback_went')}
                        </div>
                        <RadioBtn label={t('feedback_took_place')} onClick={() => setStep('success')} />
                        <RadioBtn label={t('feedback_cancelled')} onClick={() => setStep('fail')} />
                        <button onClick={onClose} style={{
                            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                            background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
                        }}>{t('cancel')}</button>
                    </>
                )}

                {/* ── Success ── */}
                {step === 'success' && (
                    <>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 12 }}>
                            {t('rate_meeting')}
                        </div>
                        <div style={{ textAlign: 'left', marginBottom: 12 }}>
                            {RATINGS.map(r => (
                                <RadioBtn key={r} label={r} active={rating === r} onClick={() => setRating(r)} />
                            ))}
                        </div>
                        <div style={{ textAlign: 'left', marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--app-hint)' }}>
                                {t('add_note')}
                            </div>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder={t('note_placeholder')}
                                rows={3}
                                style={{
                                    width: '100%', padding: 12, borderRadius: 10,
                                    border: '1px solid var(--app-border)',
                                    background: 'var(--app-bg)', color: 'var(--app-text)',
                                    fontSize: 14, fontFamily: 'inherit',
                                    resize: 'none', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                            <div style={{ fontSize: 11, color: 'var(--app-hint)', marginTop: 6 }}>
                                {t('note_private')}
                            </div>
                        </div>
                        <button className="btn-gradient" style={{ borderRadius: 14, marginTop: 12 }}
                            onClick={handleSaveSuccess} disabled={saving}>
                            {saving ? '...' : t('save')}
                        </button>
                        <button onClick={onClose} style={{
                            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                            background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
                        }}>{t('cancel')}</button>
                    </>
                )}

                {/* ── Fail ── */}
                {step === 'fail' && (
                    <>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 12 }}>
                            {t('what_went_wrong')}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            {FAIL_REASONS.map(r => (
                                <RadioBtn key={r} label={r} active={failReason === r} onClick={() => setFailReason(r)} />
                            ))}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--app-hint)', margin: '12px 0', textAlign: 'center' }}>
                            {t('feedback_private')}
                        </div>
                        <button className="btn-gradient" style={{ borderRadius: 14 }}
                            onClick={handleSaveFail} disabled={saving || !failReason}>
                            {saving ? '...' : t('send')}
                        </button>
                        <button onClick={onClose} style={{
                            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                            background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
                        }}>{t('cancel')}</button>
                    </>
                )}

                {/* ── Reward ── */}
                {step === 'reward' && (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>
                            {t('meeting_confirmed')}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.4, marginBottom: 20 }}>
                            {t('meeting_confirmed_hint')}
                        </div>
                        <button className="btn-gradient" style={{ borderRadius: 14, marginBottom: 8 }}
                            onClick={() => { onClose(); onPost?.() }}>
                            {t('write_post')}
                        </button>
                        <button onClick={onClose} style={{
                            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                            background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}>{t('skip')}</button>
                    </>
                )}
            </div>
        </div>
    )
}
