import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getSettings, saveSettings, getStaff, removeStaff } from '../lib/adminSupabase'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import SectionLabel from '../components/ui/SectionLabel'
import Card from '../components/ui/Card'
import { PrimaryButton, SecondaryButton } from '../components/ui/PrimaryButton'
import AiPromptEditor, { DEFAULT_AI_PROMPT } from '../components/settings/AiPromptEditor'
import AddStaffSheet from '../components/settings/AddStaffSheet'
import StaffRow from '../components/settings/StaffRow'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

// ─── Number field row ─────────────────────────────────────────────────────────
function SettingField({ label, value, onChange, isLast }) {
    return (
        <div className={`flex items-center justify-between px-4 py-3 ${!isLast ? 'border-b border-black/5' : ''}`}>
            <span className="text-[14px] font-medium text-gray-600">{label}</span>
            <input type="number" value={value ?? ''} onChange={e => onChange(+e.target.value)}
                className="w-20 text-right text-[15px] font-semibold text-[#007aff] outline-none bg-transparent" />
        </div>
    )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AdminSettings() {
    const { lang } = useAdmin()
    const [settings, setSettings] = useState({
        standard_price: 15, standard_cups: 1,
        best_price: 30, best_cups: 3,
        reward_referral: 1, reward_birthday: 2, reward_post: 1,
        lang_en: true, lang_zh: true,
        ai_matching_prompt: DEFAULT_AI_PROMPT,
    })
    const [staff, setStaff] = useState([])
    const [showAddStaff, setShowAddStaff] = useState(false)
    const [saving, setSaving] = useState(false)

    const t = getT('settings', lang)

    useEffect(() => {
        let cancelled = false
        getSettings().then(s => {
            if (!cancelled && s) setSettings(prev => ({ ...prev, ...s, ai_matching_prompt: s.ai_matching_prompt || DEFAULT_AI_PROMPT }))
        }).catch(() => { })
        getStaff().then(s => { if (!cancelled) setStaff(s) }).catch(() => { })
        return () => { cancelled = true }
    }, [])

    const handleSave = async () => {
        setSaving(true)
        const res = await saveSettings(settings)
        setSaving(false)
        if (res.success) toast.success(t.settingsSaved)
        else toast.error(res.error)
    }

    const handleRemoveStaff = async (id, name) => {
        const confirmMsg = typeof t.removeConfirm === 'function'
            ? t.removeConfirm(name)
            : `Remove ${name}?`
        if (!confirm(confirmMsg)) return
        const res = await removeStaff(id)
        if (res.success) { toast.success(t.removed); setStaff(s => s.filter(x => x.id !== id)) }
        else toast.error(res.error)
    }

    const set = key => val => setSettings(s => ({ ...s, [key]: val }))

    return (
        <div className="p-5 flex flex-col gap-5 pb-8">
            {showAddStaff && (
                <AddStaffSheet
                    onAdd={() => { setShowAddStaff(false); getStaff().then(setStaff) }}
                    onClose={() => setShowAddStaff(false)}
                    lang={lang}
                />
            )}

            {/* Tariffs */}
            <div>
                <SectionLabel>{t.tariffs}</SectionLabel>
                <Card>
                    <SettingField label={t.stdPrice} value={settings.standard_price} onChange={set('standard_price')} />
                    <SettingField label={t.stdCups} value={settings.standard_cups} onChange={set('standard_cups')} />
                    <SettingField label={t.bestPrice} value={settings.best_price} onChange={set('best_price')} />
                    <SettingField label={t.bestCups} value={settings.best_cups} onChange={set('best_cups')} isLast />
                </Card>
            </div>

            {/* Rewards */}
            <div>
                <SectionLabel>{t.rewards}</SectionLabel>
                <Card>
                    <SettingField label={t.refReward} value={settings.reward_referral} onChange={set('reward_referral')} />
                    <SettingField label={t.bdReward} value={settings.reward_birthday} onChange={set('reward_birthday')} />
                    <SettingField label={t.postReward} value={settings.reward_post} onChange={set('reward_post')} isLast />
                </Card>
            </div>

            {/* Languages */}
            <div>
                <SectionLabel>{t.languages}</SectionLabel>
                <Card>
                    {[{ key: 'lang_en', label: 'English' }, { key: 'lang_zh', label: '中文 (Chinese)' }]
                        .map(({ key, label }, i, arr) => (
                            <div key={key} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}>
                                <span className="text-[14px] font-medium text-gray-600">{label}</span>
                                <Switch checked={!!settings[key]} onCheckedChange={set(key)} />
                            </div>
                        ))}
                </Card>
            </div>

            {/* AI Prompt */}
            <AiPromptEditor value={settings.ai_matching_prompt} onChange={set('ai_matching_prompt')} lang={lang} />

            {/* Staff */}
            <div>
                <SectionLabel>{t.staffTitle}</SectionLabel>
                <Card className="mb-3">
                    {staff.length === 0 ? (
                        <div className="px-4 py-4 text-[14px] text-gray-400 text-center">{t.noStaff}</div>
                    ) : staff.map((s, i) => (
                        <StaffRow key={s.id} member={s} onRemove={handleRemoveStaff} lang={lang} isLast={i === staff.length - 1} />
                    ))}
                </Card>
                <SecondaryButton onClick={() => setShowAddStaff(true)}>
                    <Plus size={18} /> {t.addStaff}
                </SecondaryButton>
            </div>

            {/* Save */}
            <PrimaryButton onClick={handleSave} disabled={saving}>
                {saving ? '...' : t.saveAll}
            </PrimaryButton>
        </div>
    )
}
