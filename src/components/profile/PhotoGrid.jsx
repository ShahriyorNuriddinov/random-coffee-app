import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import { uploadPhoto, savePhotos } from '@/lib/supabaseClient'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export default function PhotoGrid({ photos, userId, onPhotosChange }) {
    const photosRef = useRef(photos)
    photosRef.current = photos

    const normalized = Array.isArray(photos)
        ? [...photos, null, null, null, null].slice(0, 4)
        : [null, null, null, null]

    const filled = normalized.filter(Boolean)

    const handlePick = (index) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            // Use ref to get latest photos (avoids stale closure)
            const base = Array.isArray(photosRef.current)
                ? [...photosRef.current, null, null, null, null].slice(0, 4)
                : [null, null, null, null]
            const preview = [...base]
            preview[index] = URL.createObjectURL(file)
            onPhotosChange(preview)
            if (userId) {
                const publicUrl = await uploadPhoto(userId, file, index)
                if (publicUrl) {
                    const current = Array.isArray(photosRef.current)
                        ? [...photosRef.current, null, null, null, null].slice(0, 4)
                        : [null, null, null, null]
                    current[index] = publicUrl
                    onPhotosChange(current)
                    await savePhotos(userId, current)
                }
            }
        }
        input.click()
    }

    const handleRemove = async (index, e) => {
        e.stopPropagation()
        const next = [...normalized]
        next[index] = null
        onPhotosChange(next)
        if (userId) await savePhotos(userId, next)
    }

    if (filled.length > 0) {
        return (
            <div>
                <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 10 }}>
                    <Swiper modules={[Pagination, Navigation]} pagination={{ clickable: true }} navigation style={{ borderRadius: 16 }}>
                        {filled.map((photo, i) => (
                            <SwiperSlide key={i}>
                                <div style={{ width: '100%', paddingTop: '75%', backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(120,120,128,0.08)' }} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                    {normalized.map((photo, i) => (
                        <button
                            key={`photo-${i}`}
                            onClick={() => handlePick(i)}
                            aria-label={photo ? `Photo ${i + 1}, click to change` : `Add photo ${i + 1}`}
                            style={{
                                aspectRatio: '1/1', borderRadius: 10,
                                backgroundImage: photo ? `url(${photo})` : 'none',
                                backgroundSize: 'cover', backgroundPosition: 'center',
                                backgroundColor: 'rgba(120,120,128,0.08)',
                                border: photo ? '2px solid transparent' : '1px dashed rgba(120,120,128,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                padding: 0,
                            }}>
                            {!photo && <span style={{ fontSize: 18, color: 'rgba(120,120,128,0.4)' }}>+</span>}
                            {photo && (
                                <button
                                    onClick={(e) => handleRemove(i, e)}
                                    aria-label={`Remove photo ${i + 1}`}
                                    style={{
                                        position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, color: '#fff', cursor: 'pointer', fontWeight: 700, border: 'none', padding: 0,
                                    }}>×</button>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {normalized.map((_, i) => (
                <button
                    key={`empty-${i}`}
                    onClick={() => handlePick(i)}
                    aria-label={`Add photo ${i + 1}`}
                    style={{
                        aspectRatio: '1/1', borderRadius: 12,
                        backgroundColor: 'rgba(120,120,128,0.08)',
                        border: '1px dashed rgba(120,120,128,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0,
                    }}>
                    <span style={{ fontSize: 22, color: 'rgba(120,120,128,0.4)' }}>+</span>
                </button>
            ))}
        </div>
    )
}
