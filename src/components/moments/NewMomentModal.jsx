// ─── NewMomentModal — HTML shablon: moments.html → #addPostModal ─────────────

import { useState, useRef } from 'react'
import { useApp } from '@/store/useAppStore'
import { postMoment, uploadMomentImage, supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export default function NewMomentModal({ onClose, onPosted }) {
    const { user, subscription, setSubscription } = useApp()
    const [text, setText] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileRef = useRef()

    const handleImage = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    const handlePost = async () => {
        if (!text.trim()) { toast.error('Write something first'); return }
        if (!user?.id) return
        setLoading(true)

        let imageUrl = null
        if (imageFile) {
            imageUrl = await uploadMomentImage(user.id, imageFile)
        }

        const result = await postMoment(user.id, text.trim(), imageUrl)

        setLoading(false)

        if (result) {
            // +1 credit reward for posting
            const newCredits = (subscription.credits ?? 0) + 1
            setSubscription(s => ({ ...s, credits: newCredits }))
            await supabase.from('profiles').update({ coffee_credits: newCredits }).eq('id', user.id)

            toast.success('Posted! +1 credit earned ☕')
            onPosted?.(result)
            onClose()
        } else {
            toast.error('Failed to post. Try again.')
        }
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: 20,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--app-card)',
                    width: '100%', maxWidth: 400,
                    borderRadius: 20, overflow: 'hidden',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                    border: '0.5px solid var(--app-border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '24px 20px', textAlign: 'center',
                    boxSizing: 'border-box',
                }}
            >
                {/* Icon */}
                <div style={{
                    width: 44, height: 44,
                    background: 'linear-gradient(135deg, #ffd700, #ffa500)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, marginBottom: 16,
                    boxShadow: '0 4px 10px rgba(255,165,0,0.3)',
                }}>
                    🎁
                </div>

                <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: 'var(--app-text)', letterSpacing: -0.4 }}>
                    Share Your Story
                </div>
                <div style={{ fontSize: 14, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 20, textAlign: 'left' }}>
                    Share your coffee meeting experience.
                    <div style={{
                        background: 'rgba(0,122,255,0.06)', borderRadius: 10,
                        padding: '10px 12px', border: '0.5px solid rgba(0,122,255,0.1)',
                        marginTop: 10, fontWeight: 500, color: '#0055b3',
                    }}>
                        🎉 Your post earns you <strong>+1 coffee cup</strong> after moderation!
                    </div>
                </div>

                {/* Text input */}
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="How was your meeting? Share your experience..."
                    rows={4}
                    style={{
                        width: '100%', padding: 12, borderRadius: 12,
                        border: '0.5px solid var(--app-border)',
                        background: 'var(--app-bg)', color: 'var(--app-text)',
                        fontSize: 15, fontFamily: 'inherit',
                        resize: 'none', outline: 'none',
                        boxSizing: 'border-box', marginBottom: 12,
                    }}
                />

                {/* Image preview */}
                {imagePreview && (
                    <div style={{ width: '100%', marginBottom: 12, position: 'relative' }}>
                        <img
                            src={imagePreview}
                            alt=""
                            style={{ width: '100%', borderRadius: 12, maxHeight: 180, objectFit: 'cover' }}
                        />
                        <button
                            onClick={() => { setImageFile(null); setImagePreview(null) }}
                            style={{
                                position: 'absolute', top: 8, right: 8,
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)', border: 'none',
                                color: '#fff', cursor: 'pointer', fontSize: 14,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Add photo */}
                {!imagePreview && (
                    <button
                        onClick={() => fileRef.current.click()}
                        style={{
                            width: '100%', padding: '11px 0', borderRadius: 12,
                            border: '0.5px dashed var(--app-border)',
                            background: 'transparent', color: 'var(--app-hint)',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'inherit', marginBottom: 12,
                        }}
                    >
                        📷 Add Photo
                    </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />

                {/* Post button */}
                <button
                    onClick={handlePost}
                    disabled={loading || !text.trim()}
                    className="btn-gradient"
                    style={{ borderRadius: 14, marginBottom: 8 }}
                >
                    {loading ? '...' : 'Post'}
                </button>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '13px 0', borderRadius: 14,
                        border: 'none', background: 'rgba(120,120,128,0.1)',
                        color: 'var(--app-text)', fontSize: 15, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
