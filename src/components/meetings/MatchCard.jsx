import { useState, useEffect, useMemo } from 'react'
import { useApp } from '@/store/useAppStore'
import { useTranslation } from 'react-i18next'
import { explainMatch, generateMeetingQuestions, translateProfile } from '@/lib/aiUtils'

export default function MatchCard({ match, onPost, onFeedback }) {
    const { partner, createdAt } = match
    const { profile } = useApp()
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const [showAbout, setShowAbout] = useState(false)
    const [showGives, setShowGives] = useState(false)
    const [showWants, setShowWants] = useState(false)
    const [matchReason, setMatchReason] = useState(null)
    const [questions, setQuestions] = useState([])
    const [showQuestions, setShowQuestions] = useState(false)
    const [loadingAI, setLoadingAI] = useState(false)
    const [aiTranslated, setAiTranslated] = useState(null)

    // displayPartner: use DB _zh fields directly, no async needed
    const displayPartner = useMemo(() => {
        if (!partner) return partner
        if (lang !== 'zh') return partner
        // DB has translations
        if (partner.about_zh || partner.gives_zh || partner.wants_zh) {
            return {
                ...partner,
                about: partner.about_zh || partner.about,
                gives: partner.gives_zh || partner.gives,
                wants: partner.wants_zh || partner.wants,
            }
        }
        // AI translated fallback
        if (aiTranslated) return aiTranslated
        return partner
    }, [partner, lang, aiTranslated])

    // Only call AI if DB translations missing
    useEffect(() => {
        if (!partner || lang !== 'zh') { setAiTranslated(null); return }
        if (partner.about_zh || partner.gives_zh || partner.wants_zh) return // DB has it
        const cacheKey = `match_tr_${partner.id}`
        try {
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) { setAiTranslated(JSON.parse(cached)); return }
        } catch { }
        translateProfile(partner, 'zh').then(result => {
            if (result) {
                setAiTranslated({ ...partner, ...result })
                try { sessionStorage.setItem(cacheKey, JSON.stringify({ ...partner, ...result })) } catch { }
            }
        })
    }, [partner?.id, lang])

    useEffect(() => {
        if (!partner || !profile?.gives || !profile?.wants) return
        if (!partner.gives && !partner.wants) return
        setMatchReason(null)
        const load = async () => {
            const reason = await explainMatch(
                { gives: profile.gives, wants: profile.wants },
                { gives: partner.gives, wants: partner.wants },
                lang
            )
            if (reason) setMatchReason(reason)
        }
        load()
    }, [partner?.id, lang])

    const handleLoadQuestions = async () => {
        if (!partner) return
        if (questions.length > 0) { setShowQuestions(v => !v); return }
        setLoadingAI(true)
        const qs = await generateMeetingQuestions(
            { about: profile.about, gives: profile.gives, wants: profile.wants },
            { about: partner.about, gives: partner.gives, wants: partner.wants },
            lang
        )
        setQuestions(qs)
        setShowQuestions(true)
        setLoadingAI(false)
    }

    if (!partner) return null

    const regionFlag = partner.region === 'Macau' ? '🇲🇴'
        : partner.region === 'Mainland' ? '🇨🇳'
            : partner.region === 'Other' ? '�'
                : '🇭🇰'

    const dateStr = new Date(createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    })

    const handleWhatsApp = () => {
        if (!partner.whatsapp) return
        const num = partner.whatsapp.replace(/[\s+]/g, '')
        window.open(`https://wa.me/${num}`)
    }

    const handleWeChat = () => {
        if (!partner.wechat) return
        navigator.clipboard?.writeText(partner.wechat)
            .then(() => alert(`WeChat ID copied: ${partner.wechat}`))
            .catch(() => alert(`WeChat ID: ${partner.wechat}`))
    }

    return (
        <div style={{
            background: 'var(--app-card)', borderRadius: 20,
            border: '0.5px solid var(--app-border)', padding: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}>
            {/* Match header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'linear-gradient(45deg, #007aff, #00c6ff)',
                        opacity: 0.15, filter: 'blur(6px)',
                    }} />
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        backgroundImage: partner.avatar_url ? `url(${partner.avatar_url})` : 'none',
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        backgroundColor: 'rgba(120,120,128,0.1)',
                        border: '2px solid white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                        position: 'relative', zIndex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {!partner.avatar_url && <span style={{ fontSize: 26 }}>👤</span>}
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)', letterSpacing: -0.2, marginBottom: 4 }}>
                        {partner.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--app-hint)', marginBottom: 6 }}>
                        <span>{regionFlag}</span>
                        <span>{partner.region}</span>
                    </div>
                    {partner.languages?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {partner.languages.map(l => (
                                <span key={l} style={{
                                    background: 'rgba(0,0,0,0.03)', padding: '3px 8px',
                                    borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#555',
                                }}>{l}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Match Reason */}
            {matchReason && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(0,122,255,0.06), rgba(88,86,214,0.06))',
                    border: '0.5px solid rgba(0,122,255,0.15)',
                    borderRadius: 12, padding: '10px 14px', marginBottom: 16,
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>🤝</span>
                    <div style={{ fontSize: 13, color: 'var(--app-text)', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: 'var(--app-primary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {lang === 'zh' ? '为什么你们匹配' : 'Why you match'}
                        </span>
                        <br />
                        {matchReason}
                    </div>
                </div>
            )}

            {/* About */}
            {displayPartner.about && (
                <InfoSection
                    label={lang === 'zh' ? '关于我' : 'About me'}
                    text={displayPartner.about}
                    borderColor="rgba(0,122,255,0.2)"
                    expanded={showAbout}
                    onToggle={() => setShowAbout(v => !v)}
                />
            )}

            {/* Gives */}
            {displayPartner.gives && (
                <InfoSection
                    label={lang === 'zh' ? '能提供' : 'Can give'}
                    text={displayPartner.gives}
                    borderColor="rgba(52,199,89,0.2)"
                    expanded={showGives}
                    onToggle={() => setShowGives(v => !v)}
                />
            )}

            {/* Wants */}
            {displayPartner.wants && (
                <InfoSection
                    label={lang === 'zh' ? '想获得' : 'Wants to get'}
                    text={displayPartner.wants}
                    borderColor="rgba(255,149,0,0.2)"
                    expanded={showWants}
                    onToggle={() => setShowWants(v => !v)}
                />
            )}

            {/* Balance */}
            {partner.balance && <BalanceBar balance={partner.balance} />}

            {/* AI Conversation Starters */}
            <button
                onClick={handleLoadQuestions}
                disabled={loadingAI}
                style={{
                    width: '100%', padding: '11px 0', borderRadius: 12,
                    border: '0.5px solid rgba(0,122,255,0.2)',
                    background: 'rgba(0,122,255,0.04)',
                    color: 'var(--app-primary)', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: loadingAI ? 0.6 : 1,
                }}
            >
                {loadingAI ? '⏳ Loading...' : showQuestions
                    ? (lang === 'zh' ? '▲ 隐藏问题' : '▲ Hide Questions')
                    : (lang === 'zh' ? '💬 会面对话开场白' : '💬 Meeting Conversation Starters')}
            </button>

            {showQuestions && questions.length > 0 && (
                <div style={{
                    background: 'rgba(0,0,0,0.03)', borderRadius: 12,
                    padding: '12px 14px', marginBottom: 14,
                }}>
                    {questions.map((q, i) => (
                        <div key={i} style={{
                            fontSize: 13, color: 'var(--app-text)', lineHeight: 1.5,
                            paddingBottom: i < questions.length - 1 ? 8 : 0,
                            marginBottom: i < questions.length - 1 ? 8 : 0,
                            borderBottom: i < questions.length - 1 ? '0.5px solid var(--app-border)' : 'none',
                        }}>
                            <span style={{ color: 'var(--app-primary)', fontWeight: 700 }}>{i + 1}.</span> {q}
                        </div>
                    ))}
                </div>
            )}

            {/* Contact buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {partner.whatsapp && (
                    <button onClick={handleWhatsApp} style={{
                        padding: 14, borderRadius: 12, border: 'none',
                        background: 'rgba(37,211,102,0.12)', color: '#25d366',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        WhatsApp
                    </button>
                )}
                {partner.wechat && (
                    <button onClick={handleWeChat} style={{
                        padding: 14, borderRadius: 12, border: 'none',
                        background: 'rgba(7,193,96,0.12)', color: '#07c160',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        Copy WeChat ID
                    </button>
                )}
                {!partner.whatsapp && !partner.wechat && (
                    <div style={{ fontSize: 13, color: 'var(--app-hint)', textAlign: 'center', padding: '8px 0' }}>
                        Contact info not available yet
                    </div>
                )}
            </div>

            {/* Complete Meeting */}
            {onFeedback && (
                <button onClick={onFeedback} style={{
                    width: '100%', padding: 14, borderRadius: 14, border: 'none',
                    background: 'rgba(120,120,128,0.08)', color: 'var(--app-text)',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    marginBottom: 10,
                }}>
                    {lang === 'zh' ? '完成会面' : 'Complete Meeting'}
                </button>
            )}

            <div style={{ fontSize: 12, color: 'var(--app-hint)' }}>
                {lang === 'zh' ? `匹配于 ${dateStr}` : `Matched on ${dateStr}`}
            </div>
        </div>
    )
}

function InfoSection({ label, text, borderColor, expanded, onToggle }) {
    const isLong = text.length > 120
    return (
        <div style={{ marginBottom: 20, paddingLeft: 12, borderLeft: `2px solid ${borderColor}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-hint)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                {label}
            </div>
            <div style={{
                fontSize: 14, lineHeight: 1.5, color: 'var(--app-text)',
                display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden',
                WebkitLineClamp: expanded ? 'unset' : 3,
            }}>
                {text}
            </div>
            {isLong && (
                <button onClick={onToggle} style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--app-primary)',
                    background: 'none', border: 'none', padding: '4px 0 0',
                    cursor: 'pointer', fontFamily: 'inherit',
                }}>
                    {expanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </div>
    )
}

function BalanceBar({ balance }) {
    const map = { '30_70': [30, 70], '50_50': [50, 50], '70_30': [70, 30] }
    const [fun, ben] = map[balance] || [50, 50]
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--app-text)', marginBottom: 8 }}>
                <span>{fun}% Fun</span>
                <span>{ben}% Benefits</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(120,120,128,0.12)', borderRadius: 3, position: 'relative', marginBottom: 6 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${fun}%`, background: '#ff9500', borderRadius: 3 }} />
                <div style={{ position: 'absolute', left: `${fun}%`, top: 0, height: '100%', width: `${ben}%`, background: 'var(--app-primary)', borderRadius: 3 }} />
            </div>
        </div>
    )
}
