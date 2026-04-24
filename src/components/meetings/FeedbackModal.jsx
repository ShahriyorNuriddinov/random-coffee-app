// HTML: meetings.html → #modal-feedback
import { useState } from 'react'
import { useApp } from '@/store/useAppStore'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function FeedbackModal({ onClose, onPost, matchId }) {
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
        setStep('reward')
    }

    const handleSaveFail = async () => {
        await saveFeedback({ status: 'fail', reason: failReason })
        onClose()
        toast.success('Feedback sent. Thank you!')
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
                            How did the meeting go?
                        </div>
                        <RadioBtn label="The meeting took place 🤝" onClick={() => setStep('success')} />
                        <RadioBtn label="Something went wrong / Cancelled ❌" onClick={() => setStep('fail')} />
                        <button onClick={onClose} style={{
                            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                            background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
                        }}>Cancel</button>
                    </>
                )}

                {/* ── Success ── */}
                {step === 'success' && (
                    <>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 12 }}>
                            Rate the meeting
                        </div>
                        <div style={{ textAlign: 'left', marginBottom: 12 }}>
                            {RATINGS.map(r => (
                                <RadioBtn key={r} label={r} active={rating === r} onClick={() => setRating(r)} />
                            ))}
                        </div>
                        <div style={{ textAlign: 'left', marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--app-hint)' }}>
                                Add a note (optional)
                            </div>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Write down your thoughts about the meeting..."
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
                                This note will only be visible to you.
                            </div>
                        </div>
                        <button
                            className="btn-gradient"
                            style={{ borderRadius: 14, marginTop: 12 }}
                            onClick={handleSaveSuccess}
                            disabled={saving}
                        >
                            {saving ? '...' : 'Save'}
                        </button>
                        <button onClick={onClose} style={{
                            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                            background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
                        }}>Cancel</button>
                    </>
                )}

                {/* ── Fail ── */}
                {step === 'fail' && (
                    <>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 12 }}>
                            What went wrong?
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            {FAIL_REASONS.map(r => (
                                <RadioBtn key={r} label={r} active={failReason === r} onClick={() => setFailReason(r)} />
                            ))}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--app-hint)', margin: '12px 0', textAlign: 'center' }}>
                            No one will see your answers. We use this to improve AI matching.
                        </div>
                        <button
                            className="btn-gradient"
                            style={{ borderRadius: 14 }}
                            onClick={handleSaveFail}
                            disabled={saving || !failReason}
                        >
                            {saving ? '...' : 'Send'}
                        </button>
                        <button onClick={onClose} style={{
                            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                            background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
                        }}>Cancel</button>
                    </>
                )}

                {/* ── Reward ── */}
                {step === 'reward' && (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', marginBottom: 8 }}>
                            Meeting Confirmed!
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.4, marginBottom: 20 }}>
                            Share your experience in Moments and earn +1 ☕!
                        </div>
                        <button className="btn-gradient" style={{ borderRadius: 14, marginBottom: 8 }}
                            onClick={() => { onClose(); onPost?.() }}>
                            Write a Post (+1 ☕)
                        </button>
                        <button onClick={onClose} style={{
                            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                            background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)',
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}>Skip</button>
                    </>
                )}
            </div>
        </div>
    )
}
