import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'

const LANGS = [
    { code: 'EN', key: 'lang_en' },
    { code: 'ZH', key: 'lang_zh' },
    { code: 'CAN', key: 'lang_canton' },
]

export default function LanguagesCard({ selected, onChange }) {
    const { t } = useTranslation()

    const toggle = (code) => {
        onChange(
            selected.includes(code)
                ? selected.filter(l => l !== code)
                : [...selected, code]
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">{t('langs_title')}</div>
            <Card>
                {LANGS.map((lang, i) => (
                    <div
                        key={lang.code}
                        onClick={() => toggle(lang.code)}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 16px', cursor: 'pointer',
                            borderBottom: i < LANGS.length - 1 ? '0.5px solid var(--app-border)' : 'none',
                        }}
                    >
                        <span style={{ fontSize: 16, color: 'var(--app-text)' }}>{t(lang.key)}</span>
                        <span style={{ color: 'var(--app-primary)', fontWeight: 700, opacity: selected.includes(lang.code) ? 1 : 0 }}>✓</span>
                    </div>
                ))}
            </Card>
            <p style={{ fontSize: 13, color: 'var(--app-hint)', marginTop: 8, marginLeft: 4, lineHeight: 1.4 }}>
                {t('langs_desc')}
            </p>
        </div>
    )
}
