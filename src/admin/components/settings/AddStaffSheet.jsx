import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { addStaff } from '../../lib/adminSupabase'
import { getT } from '../../i18n'

export default function AddStaffSheet({ onAdd, onClose, lang }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'moderator' })
    const [saving, setSaving] = useState(false)
    const t = getT('settings', lang)
    const tc = getT('common', lang)

    const handleCreate = async () => {
        if (!form.name) { toast.error(lang === 'en' ? 'Enter name' : '请输入姓名'); return }
        if (!form.email) { toast.error(lang === 'en' ? 'Enter email' : '请输入邮箱'); return }
        setSaving(true)
        const res = await addStaff(form)
        setSaving(false)
        if (res.success) { toast.success(t.staffAdded); onAdd() }
        else toast.error(res.error)
    }

    const fields = [
        { key: 'name', label: t.staffName, type: 'text', placeholder: 'Alex M.' },
        { key: 'email', label: t.staffEmail, type: 'email', placeholder: 'alex@example.com' },
        { key: 'phone', label: t.staffPhone, type: 'tel', placeholder: '+852 0000 0000' },
    ]

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-t-2xl pb-8 px-5 pt-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <span className="text-[18px] font-extrabold">{t.addStaffTitle}</span>
                    <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="flex flex-col gap-3 mb-5">
                    {fields.map(({ key, label, type, placeholder }) => (
                        <div key={key} className="bg-[#f2f4f7] border border-black/5 rounded-xl px-4 py-3">
                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
                            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                placeholder={placeholder} className="w-full text-[15px] outline-none bg-transparent text-gray-900" />
                        </div>
                    ))}
                    <div className="bg-[#f2f4f7] border border-black/5 rounded-xl px-4 py-3">
                        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.staffRole}</label>
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                            className="w-full text-[15px] outline-none bg-transparent text-gray-900">
                            <option value="moderator">{t.moderator}</option>
                            <option value="admin">{t.admin}</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-[#f2f4f7] text-gray-700 py-4 rounded-xl text-[15px] font-bold">
                        {tc.cancel}
                    </button>
                    <button onClick={handleCreate} disabled={saving}
                        className="flex-[2] bg-gradient-to-br from-[#007aff] to-[#5856d6] text-white py-4 rounded-xl text-[15px] font-bold disabled:opacity-50">
                        {saving ? '...' : t.create}
                    </button>
                </div>
            </div>
        </div>
    )
}
