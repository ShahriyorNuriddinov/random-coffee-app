import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

export default function AvatarUpload({ avatar, onFile }) {
    const { t } = useTranslation()
    const fileRef = useRef()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
                onClick={() => fileRef.current.click()}
                style={{
                    width: 100, height: 100, borderRadius: '50%',
                    backgroundImage: avatar ? `url(${avatar})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    backgroundColor: 'rgba(120,120,128,0.08)',
                    border: avatar ? '0.5px solid var(--app-border)' : '1px dashed var(--app-hint)',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
            >
                {!avatar && <span style={{ fontSize: 32, color: 'var(--app-hint)' }}>+</span>}
                {avatar && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'rgba(0,0,0,0.5)', color: '#fff',
                        fontSize: 10, fontWeight: 600, textAlign: 'center',
                        padding: '3px 0 5px', textTransform: 'uppercase',
                    }}>
                        Edit
                    </div>
                )}
            </div>
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => onFile(e.target.files[0])}
            />
            <p style={{ fontSize: 13, color: 'var(--app-hint)', marginTop: 8, textAlign: 'center' }}>
                {t('photo_hint')}
            </p>
        </div>
    )
}
