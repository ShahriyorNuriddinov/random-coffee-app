import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useApp } from '@/store/useAppStore'
import { postMoment, uploadMomentImage, supabase } from '@/lib/supabaseClient'
import { translateText } from '@/lib/aiUtils'
import toast from 'react-hot-toast'

// Compress image to max 800px and ~200KB
async function compressImage(file, maxWidth = 800, quality = 0.75) {
    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1)
            canvas.width = img.width * ratio
            canvas.height = img.height * ratio
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url)
                resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file)
            }, 'image/jpeg', quality)
        }
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
        img.src = url
    })
}

export default function NewMomentModal({ onClose, onPosted }) {
    const { t } = useTranslation()
    const { user, subscription, setSubscription } = useApp()
    const [text, setText] = useState('')
    const [images, setImages] = useState([]) // max 4
    const [loading, setLoading] = useState(false)
    const fileRef = useRef()
    const currentLang = i18n.language // 'en' or 'zh'

    const handleImage = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        const remaining = 4 - images.length
        const toAdd = files.slice(0, remaining)
        const compressed = await Promise.all(toAdd.map(f => compressImage(f)))
        const previews = compressed.map(f => ({ file: f, url: URL.createObjectURL(f) }))
        setImages(prev => [...prev, ...previews])
    }

    const removeImage = (i) => {
        setImages(prev => prev.filter((_, idx) => idx !== i))
    }

    const handlePost = async () => {
        if (!text.trim()) { toast.error('Write something first'); return }
        if (!user?.id) return
        setLoading(true)

        let imageUrl = null
        let imageUrls = null
        if (images.length > 0) {
            const uploaded = await Promise.all(images.map(img => uploadMomentImage(user.id, img.file)))
            const validUrls = uploaded.filter(Boolean)
            imageUrl = validUrls[0] || null
            imageUrls = validUrls.length > 1 ? validUrls : null
        }

        const trimmedText = text.trim()
        // currentLang already declared at component level

        let text_en = null
        let text_zh = null
        if (currentLang === 'zh') {
            text_zh = trimmedText
            text_en = await translateText(trimmedText, 'en').catch((e) => { console.error('[translate zh→en]', e); return null })
        } else {
            text_en = trimmedText
            text_zh = await translateText(trimmedText, 'zh').catch((e) => { console.error('[translate en→zh]', e); return null })
        }
        console.log('[moment] lang:', currentLang, '| text_en:', text_en, '| text_zh:', text_zh)

        const result = await postMoment(user.id, trimmedText, imageUrl, text_en, text_zh, imageUrls)
            || await postMoment(user.id, trimmedText, imageUrl, null, null, imageUrls)
        setLoading(false)

        if (result) {
            const newCredits = (subscription.credits ?? 0) + 1
            const newStatus = newCredits > 0 ? 'active' : 'empty'
            setSubscription(s => ({ ...s, credits: newCredits, status: newStatus }))
            await supabase.from('profiles').update({ coffee_credits: newCredits, subscription_status: newStatus }).eq('id', user.id)
            toast.success('Posted! +1 credit earned ☕')
            onPosted?.(result)
            onClose()
        } else {
            toast.error('Failed to post. Try again.')
        }
    }

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--app-card)', width: '100%', maxWidth: 400,
                borderRadius: 20, boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                border: '0.5px solid var(--app-border)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '24px 20px', textAlign: 'center', boxSizing: 'border-box',
            }}>
                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #ffd700, #ffa500)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16, boxShadow: '0 4px 10px rgba(255,165,0,0.3)' }}>
                    🎁
                </div>

                <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: 'var(--app-text)', letterSpacing: -0.4 }}>
                    {t('share_story')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.5, marginBottom: 16, textAlign: 'left', width: '100%' }}>
                    <div style={{ background: 'rgba(0,122,255,0.06)', borderRadius: 10, padding: '10px 12px', border: '0.5px solid rgba(0,122,255,0.1)', fontWeight: 500, color: '#0055b3' }}>
                        ☕ {currentLang === 'zh'
                            ? '每次完成咖啡约见后，您可以在这里分享体验并获得 +1 积分！'
                            : 'After each coffee meeting you can share your experience here and earn +1 credit!'}
                    </div>
                </div>

                <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder={t('write_something')} rows={4}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '0.5px solid var(--app-border)', background: 'var(--app-bg)', color: 'var(--app-text)', fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
                />

                {/* Image previews */}
                {images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%', marginBottom: 12 }}>
                        {images.map((img, i) => (
                            <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden' }}>
                                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => removeImage(i)} style={{
                                    position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer',
                                    fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>✕</button>
                            </div>
                        ))}
                        {images.length < 4 && (
                            <div onClick={() => fileRef.current.click()} style={{
                                aspectRatio: '1/1', borderRadius: 8, border: '1px dashed rgba(120,120,128,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: 20, color: 'rgba(120,120,128,0.4)',
                            }}>+</div>
                        )}
                    </div>
                )}

                {images.length === 0 && (
                    <button onClick={() => fileRef.current.click()} style={{
                        width: '100%', padding: '11px 0', borderRadius: 12,
                        border: '0.5px dashed var(--app-border)', background: 'transparent',
                        color: 'var(--app-hint)', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12,
                    }}>
                        📷 Add Photos (up to 4)
                    </button>
                )}

                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImage} />

                <button onClick={handlePost} disabled={loading || !text.trim()} className="btn-gradient" style={{ borderRadius: 14, marginBottom: 8 }}>
                    {loading ? '...' : t('post_btn')}
                </button>
                <button onClick={onClose} style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: 'rgba(120,120,128,0.1)', color: 'var(--app-text)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('cancel')}
                </button>
            </div>
        </div>
    )
}
