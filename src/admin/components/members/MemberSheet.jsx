import { useEffect, useState } from 'react'
import { Save, Ban, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getMemberById, updateMember, banMember, unbanMember } from '../../lib/adminSupabase'
import { getT } from '../../i18n'
import Spinner from '../ui/Spinner'
import SectionLabel from '../ui/SectionLabel'
import Card from '../ui/Card'
import Avatar, { getAvatarColor } from '../ui/Avatar'
import FullScreenModal from '../ui/FullScreenModal'
import Toggle from '../ui/Toggle'
import { PrimaryButton } from '../ui/PrimaryButton'

export default function MemberSheet({ memberId, onClose, lang }) {
    const [member, setMember] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({})
    const t = getT('members', lang)
    const tc = getT('common', lang)

    useEffect(() => {
        getMemberById(memberId).then(m => {
            setMember(m)
            setForm({
                name: m?.name || '',
                email: m?.email || '',
                coffee_credits: m?.coffee_credits || 0,
                about: m?.about || '',
                gives: m?.gives || '',
                wants: m?.wants || '',
                wechat: m?.wechat || '',
                whatsapp: m?.whatsapp || '',
                email_verified: m?.email_verified ?? false,
            })
            setLoading(false)
        })
    }, [memberId])

    const set = key => val => setForm(f => ({ ...f, [key]: val }))

    const handleSave = async () => {
        setSaving(true)
        const res = await updateMember(memberId, form)
        setSaving(false)
        if (res.success) { toast.success(tc.saved); onClose() }
        else toast.error(res.error)
    }

    const handleBan = async () => {
        if (!confirm(member?.banned ? t.unbanConfirm : t.banConfirm)) return
        const res = member?.banned ? await unbanMember(memberId) : await banMember(memberId)
        if (res.success) { toast.success(tc.done); onClose() }
        else toast.error(res.error)
    }

    return (
        <FullScreenModal title={t.editTitle} onClose={onClose}>
            {loading ? (
                <div className="flex items-center justify-center h-40"><Spinner size={8} /></div>
            ) : (
                <div className="p-5 flex flex-col gap-5">

                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <Avatar name={member?.name} url={member?.avatar_url} size={80} color={getAvatarColor(member?.id)} />
                        <p className="text-[12px] text-gray-400">ID: {member?.id?.slice(0, 8)}...</p>
                        {member?.banned && (
                            <span className="bg-red-100 text-red-500 text-[11px] font-bold px-3 py-1 rounded-full uppercase">{t.bannedBadge}</span>
                        )}
                    </div>

                    {/* System info (readonly) */}
                    <div>
                        <SectionLabel>{t.sysInfo}</SectionLabel>
                        <Card>
                            {[
                                { label: t.regDate, value: member?.created_at ? new Date(member.created_at).toLocaleDateString() : '—' },
                                { label: t.dob, value: member?.dob || '—' },
                                { label: t.gender, value: member?.gender || '—', capitalize: true },
                                { label: t.location, value: member?.region || '—' },
                            ].map(({ label, value, capitalize }, i, arr) => (
                                <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}>
                                    <span className="text-[14px] font-medium text-gray-600">{label}</span>
                                    <span className={`text-[14px] text-gray-400 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-black/5">
                                <span className="text-[14px] font-medium text-gray-600">{t.subscription}</span>
                                <span className={`text-[12px] font-bold px-2 py-1 rounded-lg ${member?.subscription_status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {member?.subscription_status === 'active'
                                        ? `${t.active}${member?.subscription_until ? ` · ${new Date(member.subscription_until).toLocaleDateString()}` : ''}`
                                        : t.inactive}
                                </span>
                            </div>
                            <div className="flex items-center px-4 py-3 border-t border-black/5">
                                <span className="text-[14px] font-medium text-gray-600 w-28 flex-shrink-0">{t.credits}</span>
                                <input
                                    type="number"
                                    value={form.coffee_credits}
                                    onChange={e => set('coffee_credits')(+e.target.value)}
                                    className="flex-1 text-right text-[15px] font-semibold text-[#007aff] outline-none bg-transparent"
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Editable fields */}
                    <div>
                        <SectionLabel>{t.profile}</SectionLabel>
                        <Card>
                            {[
                                { key: 'name', label: t.name, type: 'text' },
                                { key: 'email', label: t.email, type: 'email' },
                            ].map(({ key, label, type }, i, arr) => (
                                <div key={key} className={`flex items-center px-4 py-3 ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}>
                                    <span className="text-[14px] font-medium text-gray-600 w-24 flex-shrink-0">{label}</span>
                                    <input type={type} value={form[key]}
                                        onChange={e => set(key)(e.target.value)}
                                        className="flex-1 text-right text-[14px] font-medium outline-none bg-transparent text-gray-700" />
                                </div>
                            ))}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-black/5">
                                <span className="text-[14px] font-medium text-gray-600">{t.emailVerified}</span>
                                <Toggle checked={!!form.email_verified} onChange={set('email_verified')} />
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
                                { label: t.actInvitedBy, value: member?.referred_by ? member.referred_by.slice(0, 8) + '...' : '—' },
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
                    <div className="flex flex-col gap-3">
                        <PrimaryButton onClick={handleSave} disabled={saving}>
                            <Save size={18} /> {saving ? '...' : tc.save}
                        </PrimaryButton>
                        <button onClick={handleBan}
                            className={`w-full py-4 rounded-2xl text-[16px] font-bold border border-black/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${member?.banned ? 'bg-green-50 text-green-600' : 'bg-white text-red-500'
                                }`}>
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
