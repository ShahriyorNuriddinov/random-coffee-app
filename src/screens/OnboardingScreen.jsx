import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import DarkToggle from '@/components/DarkToggle'

const slides = [
    { key: 'logo', isLogo: true },
    { key: '1', icon: '👋', titleKey: 'slide1_title', textKey: 'slide1_text' },
    { key: '2', icon: '🧠', titleKey: 'slide2_title', textKey: 'slide2_text' },
    { key: '3', icon: '☕️', titleKey: 'slide3_title', textKey: 'slide3_text' },
    { key: '4', icon: '💡', titleKey: 'slide4_title', textKey: 'slide4_text' },
    { key: '5', icon: '📈', titleKey: 'slide5_title', textKey: 'slide5_text' },
    { key: '6', icon: '🚀', titleKey: 'slide6_title', textKey: 'slide6_text' },
]

export default function OnboardingScreen() {
    const { t } = useTranslation()
    const { setScreen, darkMode } = useApp()
    const [current, setCurrent] = useState(0)
    const sliderRef = useRef(null)

    const handleScroll = () => {
        if (!sliderRef.current) return
        const idx = Math.round(sliderRef.current.scrollLeft / sliderRef.current.clientWidth)
        setCurrent(idx)
    }

    const isLast = current === slides.length - 1

    return (
        <div className="app-screen" style={{ background: 'var(--app-card)' }}>
            <div style={{
                position: 'absolute', top: 20, right: 20,
                display: 'flex', gap: 8, alignItems: 'center', zIndex: 30
            }}>
                <DarkToggle />
            </div>
            <div
                ref={sliderRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    minHeight: 0,
                }}
            >
                {slides.map((slide, i) => (
                    <div
                        key={slide.key} style={{
                            minWidth: '100%',
                            minHeight: '70vh',
                            scrollSnapAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '40px',
                            textAlign: 'center',
                            background: darkMode
                                ? 'var(--app-bg)'
                                : i % 2 === 0
                                    ? 'linear-gradient(180deg,#fff 0%,rgba(244,247,249,0.5) 100%)'
                                    : 'linear-gradient(180deg,#fff 0%,rgba(230,236,240,0.3) 100%)',
                        }}
                    >
                        {slide.isLogo ? (
                            <>
                                <div className="gradient-text" style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2, marginBottom: 5 }}>RC</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--app-text)', marginBottom: 12 }}>Random Coffee</div>
                                <div style={{ fontSize: 14, color: 'var(--app-hint)', fontWeight: 500, maxWidth: 250 }}>{t('slogan')}</div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 80, marginBottom: 30, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>{slide.icon}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, letterSpacing: -0.8, lineHeight: 1.2, color: 'var(--app-text)' }}>
                                    {t(slide.titleKey)}
                                </div>
                                <div style={{ fontSize: 15, color: 'var(--app-hint)', lineHeight: 1.5, fontWeight: 500 }}>
                                    {t(slide.textKey)}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            {/* Dots */}
            <div style={{
                position: 'absolute',
                bottom: isLast ? 120 : 28,
                left: 0, right: 0,
                display: 'flex', justifyContent: 'center', gap: 8,
                pointerEvents: 'none',
                transition: 'bottom 0.3s',
            }}>
                {slides.map((slide, i) => (
                    <div key={`dot-${slide.key}`} style={{
                        width: i === current ? 20 : 8,
                        height: 8,
                        borderRadius: i === current ? 4 : '50%',
                        background: i === current ? 'var(--app-primary)' : '#d1d1d6',
                        transition: 'all 0.3s',
                    }} />
                ))}
            </div>

            {/* Get Started button */}
            <div style={{
                position: 'absolute',
                bottom: 40,
                left: 0, right: 0,
                padding: '0 24px',
                opacity: isLast ? 1 : 0,
                transform: isLast ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.4s ease 0.1s',
                pointerEvents: isLast ? 'auto' : 'none',
                display: 'flex',
                justifyContent: 'center',
            }}>
                <button
                    className="btn-gradient"
                    onClick={() => setScreen('phone')}
                    style={{ borderRadius: 16, padding: '15px 0', fontSize: 17 }}
                >
                    {t('get_started')}
                </button>
            </div>
        </div>
    )
}

