// ─── PersonCard — HTML: people.html → .user-card ─────────────────────────────
import { useState } from 'react'

export default function PersonCard({ person, liked, onLike, onOpen }) {
    const regionFlag = person.region === 'Macau' ? '🇲🇴'
        : person.region === 'Mainland China' ? '🇨🇳' : '🇭🇰'

    const tags = Array.isArray(person.tags) ? person.tags.slice(0, 3) : []
    const langs = Array.isArray(person.languages) ? person.languages : []

    const map = { '30_70': [30, 70], '50_50': [50, 50], '70_30': [70, 30] }
    const [fun, ben] = map[person.balance] || [50, 50]

    return (
        <div style={{
            background: 'var(--app-card)', borderRadius: 20, padding: 20,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            border: '0.5px solid var(--app-border)',
        }}>
            {/* .card-header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                {/* .profile-info */}
                <div
                    onClick={onOpen}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', flex: 1, minWidth: 0 }}
                >
                    {/* .avatar-container */}
                    <div style={{
                        width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                        backgroundImage: person.avatar_url ? `url(${person.avatar_url})` : 'none',
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        backgroundColor: 'rgba(120,120,128,0.1)',
                        border: '1.5px solid white',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {!person.avatar_url && <span style={{ fontSize: 22 }}>👤</span>}
                    </div>

                    {/* .name-wrapper */}
                    <div style={{ minWidth: 0 }}>
                        {/* .user-name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.2, color: 'var(--app-text)' }}>
                                {person.name}
                            </span>
                            {person.score > 0 && (
                                <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    background: 'rgba(0,122,255,0.1)', color: 'var(--app-primary)',
                                    padding: '2px 6px', borderRadius: 6,
                                }}>
                                    {person.score}%
                                </span>
                            )}
                        </div>
                        {/* .meta-geo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--app-hint)', marginBottom: 5 }}>
                            <span>{regionFlag}</span>
                            <span>{person.city || person.region}</span>
                        </div>
                        {/* .card-languages-tags */}
                        {langs.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {langs.map(l => (
                                    <span key={l} style={{
                                        background: 'rgba(0,0,0,0.03)', padding: '3px 6px',
                                        borderRadius: 5, fontSize: 11, fontWeight: 600, color: '#555',
                                    }}>{l}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* .interest-btn */}
                <button
                    onClick={onLike}
                    style={{
                        flexShrink: 0, marginLeft: 12,
                        padding: '10px 16px', borderRadius: 12, border: 'none',
                        cursor: 'pointer',
                        background: liked
                            ? 'rgba(255,59,48,0.08)'
                            : 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                        color: liked ? '#ff3b30' : '#fff',
                        fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                        boxShadow: liked ? 'none' : '0 4px 10px rgba(0,122,255,0.15)',
                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                    }}
                >
                    {liked ? 'Cancel ✕' : 'Interest'}
                </button>
            </div>

            {/* .info-section — About Me */}
            {person.about && (
                <InfoSection label="About Me" text={person.about} borderColor="rgba(0,122,255,0.2)" onClick={onOpen} />
            )}

            {/* .info-section.give — Can Give */}
            {person.gives && (
                <InfoSection label="Can Give" text={person.gives} borderColor="rgba(52,199,89,0.2)" onClick={onOpen} />
            )}

            {/* .info-section.take — Wants to Get */}
            {person.wants && (
                <InfoSection label="Wants to Get" text={person.wants} borderColor="rgba(255,149,0,0.2)" onClick={onOpen} />
            )}

            {/* .balance-section */}
            {person.balance && (
                <div style={{ paddingTop: 4 }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: 'var(--app-hint)',
                        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
                    }}>
                        Meeting Balance
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--app-text)', marginBottom: 6 }}>
                        <span>{fun}% Fun</span>
                        <span>{ben}% Benefits</span>
                    </div>
                    <div style={{ width: '100%', height: 5, background: 'rgba(120,120,128,0.12)', borderRadius: 3, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${fun}%`, background: '#ff9500', borderRadius: 3 }} />
                        <div style={{ position: 'absolute', left: `${fun}%`, top: 0, height: '100%', width: `${ben}%`, background: 'var(--app-primary)', borderRadius: 3 }} />
                    </div>
                </div>
            )}

            {/* AI tags */}
            {tags.length > 0 && (
                <div style={{ display: 'flex', gap: 5, marginTop: 12, flexWrap: 'wrap' }}>
                    {tags.map((tag, i) => (
                        <span key={i} style={{
                            fontSize: 11, fontWeight: 600,
                            background: 'rgba(0,122,255,0.08)', color: 'var(--app-primary)',
                            padding: '3px 8px', borderRadius: 8,
                        }}>{tag}</span>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── .info-section with expandable text ──────────────────────────────────────
function InfoSection({ label, text, borderColor }) {
    const [expanded, setExpanded] = useState(false)
    const isLong = text.length > 120

    return (
        <div style={{ marginBottom: 16, paddingLeft: 12, borderLeft: `2px solid ${borderColor}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-hint)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                {label}
            </div>
            <div
                onClick={() => isLong && setExpanded(e => !e)}
                style={{
                    fontSize: 14, lineHeight: 1.45, color: 'var(--app-text)',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: expanded ? 'unset' : 3,
                    WebkitBoxOrient: 'vertical',
                    cursor: isLong ? 'pointer' : 'default',
                }}
            >
                {text}
            </div>
            {isLong && !expanded && (
                <span
                    onClick={() => setExpanded(true)}
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-primary)', cursor: 'pointer' }}
                >
                    ... more
                </span>
            )}
        </div>
    )
}
