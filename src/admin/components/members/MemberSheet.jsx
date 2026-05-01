import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Save, Ban, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getMemberById, updateMember, banMember, unbanMember } from '../../lib/adminSupabase'
import { getT } from '../../i18n'
import Spinner from '../ui/Spinner'
import SectionLabel from '../ui/SectionLabel'
import Card from '../ui/Card'
import FullScreenModal from '../ui/FullScreenModal'
import { PrimaryButton } from '../ui/PrimaryButton'

// Format DOB from ISO string to DD.MM.YYYY
function formatDob(dob) {
    if (!dob) return '—'
    try {
        const d = new Date(dob)
        if (isNaN(d.getTime())) return dob
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}.${mm}.${yyyy}`
    } catch { return dob }
}

// 2×2 square photo grid
function PhotoGrid({ photos, avatarUrl }) {
    const allPhotos = (() => {
        const seen = new Set()
        const result = []
        const candidates = avatarUrl ? [avatarUrl, ...(photos || [])] : (photos || [])
        for (const p of candidates) {
            if (p && !seen.has(p)) { seen.add(p); result.push(p) }
        }
        return result.slice(0, 4)
    })()

    if (allPhotos.length === 0) {
        return (
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
                <span className="text-3xl">👤</span>
            </div>
        )
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: allPhotos.length === 1 ? '1fr' : '1fr 1fr',
            gridTemplateRows: allPhotos.length <= 2 ? '120px' : '120px 120px',
            gap: 3,
            borderRadius: 16,
            overflow: 'hidden',
            width: '100%',
            maxWidth: 280,
            margin: '0 auto',
        }}>
            {allPhotos.map((photo, i) => (
                <div key={i} style={{
                    gridColumn: allPhotos.length === 1 ? '1 / -1'
                        : allPhotos.length === 3 && i === 0 ? '1 / -1'
                            : 'auto',
                    overflow: 'hidden',
                }}>
                    <img
                        src={photo}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                </div>
            ))}
        </div>
    )
}

const SUBSCRIPTION_OPTIONS = [
    { value: 'trial', label: 'Trial' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'cancelled', label: 'Cancelled' },
]

export default function MemberSheet({ memberId, member: memberProp, onClose, lang }) {
    const [member, setMember] = useState(memberProp || null)
    const [loading, setLoading] = useState(!memberProp)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({})
    const t = getT('members', lang)
    const tc = getT('common', lang)

    useEffect(() => {
        if (memberProp) {
            setMember(memberProp)
            initForm(memberProp)
            setLoading(false)
            return
        }
        if (memberId) {
            getMemberById(memberId).then(m => {
                setMember(m)
                initForm(m)
                setLoading(false)
            })
        }
    }, [memberId, memberProp])

    const initForm = (m) => {
        setForm({
            name: m?.name || '',
            email: m?.email || '',
            coffee_credits: m?.coffee_credits ?? 0,
            subscription_status: m?.subscription_status || 'trial',
            about: m?.about || '',
            gives: m?.gives || '',
            wants: m?.wants || '',
            wechat: m?.wechat || '',
            whatsapp: m?.whatsapp || '',
            region: m?.region || 'Hong Kong',
        })
    }

    const set = key => val => setForm(f => ({ ...f, [key]: val }))

    const handleSave = async () => {
        setSaving(true)
        const actualMemberId = memberId || member?.id
        const res = await updateMember(actualMemberId, form)
        setSaving(false)
        if (res.success) { toast.success(tc.saved); onClose() }
        else toast.error(res.error)
    }

    const handleBan = async () => {
        if (!confirm(member?.banned ? t.unbanConfirm : t.banConfirm)) return
        const actualMemberId = memberId || member?.id
        const res = member?.banned ? await unbanMember(actualMemberId) : await banMember(actualMemberId)
        if (res.success) { toast.success(tc.done); onClose() }
        else toast.error(res.error)
    }

    return (
        <FullScreenModal title={t.editTitle} onClose={onClose}>
            {loading ? (
                <div className="flex items-center justify-center h-40"><Spinner size={8} /></div>
            ) : (
                <div className="px-2 py-3 flex flex-col gap-4">

                    {/* Photos — 2×2 grid */}
                    <PhotoGrid photos={member?.photos} avatarUrl={member?.avatar_url} />

                    {/* Name + ID */}
                    <div className="text-center">
                        <div className="text-[17px] font-bold text-gray-800">{member?.name || '—'}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">ID: {member?.id?.slice(0, 12)}...</div>
                        {member?.banned && (
                            <span className="inline-block mt-1 bg-red-100 text-red-500 text-[11px] font-bold px-3 py-1 rounded-full uppercase">{t.bannedBadge}</span>
                        )}
                    </div>

                    {/* System info (readonly) */}
                    <div>
                        <SectionLabel>{t.sysInfo}</SectionLabel>
                        <Card>
                            {[
                                { label: t.regDate, value: member?.created_at ? new Date(member.created_at).toLocaleDateString() : '—' },
                                { label: t.dob, value: formatDob(member?.dob) },
                                { label: t.gender, value: member?.gender || '—', capitalize: true },
                            ].map(({ label, value, capitalize }, i, arr) => (
                                <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}>
                                    <span className="text-[14px] font-medium text-gray-600">{label}</span>
                                    <span className={`text-[14px] text-gray-400 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
                                </div>
                            ))}
                        </Card>
                    </div>

                    {/* Editable profile fields */}
                    <div>
                        <SectionLabel>{t.profile}</SectionLabel>
                        <Card>
                            {/* Name */}
                            <div className="flex items-center px-4 py-3 border-b border-black/5">
                                <span className="text-[14px] font-medium text-gray-600 w-24 flex-shrink-0">{t.name}</span>
                                <input type="text" value={form.name} onChange={e => set('name')(e.target.value)}
                                    className="flex-1 text-right text-[14px] font-medium outline-none bg-transparent text-gray-700" />
                            </div>
                            {/* Email */}
                            <div className="flex items-center px-4 py-3 border-b border-black/5">
                                <span className="text-[14px] font-medium text-gray-600 w-24 flex-shrink-0">{t.email}</span>
                                <input type="email" value={form.email} onChange={e => set('email')(e.target.value)}
                                    className="flex-1 text-right text-[14px] font-medium outline-none bg-transparent text-gray-700" />
                            </div>
                            {/* Region */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                                <span className="text-[14px] font-medium text-gray-600">{t.location}</span>
                                <select value={form.region} onChange={e => set('region')(e.target.value)}
                                    className="text-[14px] font-medium text-gray-700 bg-transparent outline-none cursor-pointer text-right">
                                    <option value="Hong Kong">🇭🇰 Hong Kong</option>
                                    <option value="Macau">🇲🇴 Macau</option>
                                    <option value="Mainland">🇨🇳 Mainland China</option>
                                    <option value="Other">🌍 Other</option>
                                </select>
                            </div>
                            {/* Credits */}
                            <div className="flex items-center px-4 py-3 border-b border-black/5">
                                <span className="text-[14px] font-medium text-gray-600 w-28 flex-shrink-0">{t.credits}</span>
                                <input type="number" value={form.coffee_credits} onChange={e => set('coffee_credits')(+e.target.value)}
                                    className="flex-1 text-right text-[15px] font-semibold text-[#007aff] outline-none bg-transparent" />
                            </div>
                            {/* Subscription status */}
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-[14px] font-medium text-gray-600">{t.subscription}</span>
                                <select value={form.subscription_status} onChange={e => set('subscription_status')(e.target.value)}
                                    className="text-[14px] font-semibold bg-transparent outline-none cursor-pointer text-right"
                                    style={{ color: form.subscription_status === 'active' ? '#34c759' : form.subscription_status === 'trial' ? '#ff9500' : '#8e8e93' }}>
                                    {SUBSCRIPTION_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </Card>
                    </div>

                    {/* About / Gives / Wants */}
                    {[
                        { key: 'about', label: t.about, rows: 3 },
                        { key: 'gives', label: t.gives, rows: 2 },
                        { key: 'wants', label: t.wants, rows: 2 },
                    ].map(({ key, label, rows }) => (
                        <div key={key}>
                            <SectionLabel>{label}</SectionLabel>
                            <Card className="p-4">
                                <textarea value={form[key]} onChange={e => set(key)(e.target.value)}
                                    rows={rows} className="w-full text-[14px] outline-none bg-transparent text-gray-700 resize-none" />
                            </Card>
                        </div>
                    ))}

                    {/* Activity */}
                    <div>
                        <SectionLabel>{t.activityTitle}</SectionLabel>
                        <Card>
                            {[
                                { label: t.actMeetings, value: member?.meetings_count ?? '—' },
                                { label: t.actPosts, value: member?.moments_count ?? '—' },
                                { label: t.actReferrals, value: member?.referral_count ?? 0 },
                                { label: t.actInvitedBy, value: member?.referred_by_phone || (member?.referred_by ? member.referred_by.slice(0, 8) + '...' : '—') },
                            ].map(({ label, value }, i, arr) => (
                                <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}>
                                    <span className="text-[14px] font-medium text-gray-600">{label}</span>
                                    <span className="text-[14px] font-bold text-[#007aff]">{value}</span>
                                </div>
                            ))}
                        </Card>
                    </div>

                    {/* Messengers */}
                    <div>
                        <SectionLabel>{t.messengers}</SectionLabel>
                        <Card>
                            <div className="flex items-center px-4 py-3 border-b border-black/5">
                                <span className="text-[14px] font-medium text-gray-600 w-24 flex-shrink-0">WeChat</span>
                                <input type="text" value={form.wechat} onChange={e => set('wechat')(e.target.value)}
                                    className="flex-1 text-right text-[14px] outline-none bg-transparent text-gray-700" placeholder="wechat_id" />
                            </div>
                            <div className="flex items-center px-4 py-3">
                                <span className="text-[14px] font-medium text-gray-600 w-24 flex-shrink-0">WhatsApp</span>
                                <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp')(e.target.value)}
                                    className="flex-1 text-right text-[14px] outline-none bg-transparent text-gray-700" placeholder="+852 0000 0000" />
                            </div>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pb-4">
                        <PrimaryButton onClick={handleSave} disabled={saving}>
                            <Save size={18} /> {saving ? '...' : tc.save}
                        </PrimaryButton>
                        <button onClick={handleBan}
                            className={`w-full py-4 rounded-2xl text-[16px] font-bold border border-black/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${member?.banned ? 'bg-green-50 text-green-600' : 'bg-white text-red-500'}`}>
                            {member?.banned
                                ? <><CheckCircle size={18} /> {t.unbanBtn}</>
                                : <><Ban size={18} /> {t.banBtn}</>}
                        </button>
                    </div>

                </div>
            )}
        </FullScreenModal>
    )
}

MemberSheet.propTypes = {
    memberId: PropTypes.string,
    member: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
}
