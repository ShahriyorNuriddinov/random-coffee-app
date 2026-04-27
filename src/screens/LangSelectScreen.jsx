import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'

const LANGS = [
    { code: 'en', label: 'English', flag: '🇬🇧', sub: 'English' },
    { code: 'zh', label: '中文', flag: '🇨🇳', sub: 'Chinese' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺', sub: 'Russian' },
]

const LANG_KEY = 'rc_lang_selected'

export default function LangSelectScreen() {
    const { i18n } = useTranslation()
    const { setScreen } = useApp()

    const handleSelect = (code) => {
        i18n.changeLanguage(code)
        localStorage.setItem('rc_lang', code)
        localStorage.setItem(LANG_KEY, '1')
        setScreen('onboarding')
    }

    return (
        <div className="app-screen" style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px', gap: 32,
        }}>
            {/* Logo */}
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: 64, fontWeight: 900, letterSpacing: -2,
                    background: 'linear-gradient(135deg, #007aff, #5856d6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', marginBottom: 8,
                }}>RC</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--app-text)', marginBottom: 6 }}>
                    Random Coffee
                </div>
                <div style={{ fontSize: 14, color: 'var(--app-hint)', maxWidth: 260, lineHeight: 1.5 }}>
                    Choose your language / 选择语言 / Выберите язык
                </div>
            </div>

            {/* Language options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
                {LANGS.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => handleSelect(lang.code)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '18px 20px', borderRadius: 16,
                            background: 'var(--app-card)',
                            border: '0.5px solid var(--app-border)',
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.15s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span style={{ fontSize: 32 }}>{lang.flag}</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--app-text)' }}>
                                {lang.label}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--app-hint)' }}>
                                {lang.sub}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', color: 'var(--app-hint)', fontSize: 18 }}>›</div>
                    </button>
                ))}
            </div>
        </div>
    )
}
