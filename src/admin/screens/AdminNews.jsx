import { useEffect, useState } from 'react'
import { Plus, MoreHorizontal, Pin, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getNews, createNews, updateNews, deleteNews, supabase } from '../lib/adminSupabase'
import { uploadMomentImage } from '@/lib/supabaseClient'
import { translateText } from '@/lib/aiUtils'
import { useAdmin } from '../AdminApp'
import { getT } from '../i18n'
import Spinner from '../components/ui/Spinner'
import SectionLabel from '../components/ui/SectionLabel'
import Card from '../components/ui/Card'
import BottomSheet, { SheetHeader, SheetAction } from '../components/ui/BottomSheet'

// ─── Image uploader ───────────────────────────────────────────────────────────
function ImageUploader({ imageUrl, setImageUrl, lang }) {
    const [uploading, setUploading] = useState(false)
    const t = getT('news', lang)

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        const url = await uploadMomentImage('admin', file)
        setUploading(false)
        if (url) setImageUrl(url)
        else toast.error(t.uploadFailed)
    }

    return (
        <div>
            <SectionLabel>{t.imageLabel}</SectionLabel>
            {imageUrl && (
                <div className="relative mb-3">
                    <img src={imageUrl} alt="" className="w-full max-h-48 object-cover rounded-xl" />
                    <button
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
                    >
                        <X size={14} className="text-white" />
                    </button>
                </div>
            )}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#007aff] rounded-xl py-4 cursor-pointer active:bg-blue-50 transition-colors">
                <span className="text-[14px] font-semibold text-[#007aff]">
                    {uploading ? '...' : imageUrl ? t.changePhoto : t.uploadPhoto}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
        </div>
    )
}

// ─── News editor (full screen) ────────────────────────────────────────────────
function NewsEditor({ item, onSave, onClose, lang }) {
    const [text, setText] = useState(item?.text || '')
    const [imageUrl, setImageUrl] = useState(item?.image_url || '')
    const [saving, setSaving] = useState(false)
    const t = getT('news', lang)

    const handleSave = async () => {
        if (!text.trim()) { toast.error(t.enterContent); return }
        setSaving(true)
        const isChinese = /[\u4e00-\u9fff]/.test(text)
        const payload = isChinese
            ? { text: '', text_zh: text.trim(), image_url: imageUrl }
            : { text: text.trim(), text_zh: '', image_url: imageUrl }
        const res = await onSave(payload)
        setSaving(false)
        // Background translate to the other language silently
        if (res?.id) {
            const target = isChinese ? 'en' : 'zh'
            translateText(text.trim(), target)
                .then(translated => {
                    if (!translated) return
                    const update = isChinese ? { text: translated } : { text_zh: translated }
                    updateNews(res.id, update).catch(() => { })
                })
                .catch(() => { })
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f2f4f7]">
            {/* Header */}
            <div className="bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between flex-shrink-0">
                <button onClick={onClose} className="text-[#007aff] text-[15px] font-medium">
                    {getT('common', lang).cancel}
                </button>
                <span className="text-[17px] font-bold">
                    {item ? t.editPost : t.newPost}
                </span>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-[#007aff] text-[15px] font-bold disabled:opacity-50"
                >
                    {saving ? '...' : item ? getT('common', lang).save : t.publish}
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                <ImageUploader imageUrl={imageUrl} setImageUrl={setImageUrl} lang={lang} />

                <div>
                    <SectionLabel>{t.contentEn}</SectionLabel>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        rows={5}
                        placeholder="Write post content..."
                        className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-[14px] outline-none resize-none"
                    />
                </div>
            </div>
        </div>
    )
}

// ─── Post actions sheet ───────────────────────────────────────────────────────
function PostActionsSheet({ item, onEdit, onPin, onDelete, onClose, lang }) {
    const t = getT('news', lang)
    return (
        <BottomSheet onClose={onClose}>
            <SheetHeader title={t.managePost} />
            <SheetAction label={t.editPost} onClick={onEdit} icon={Pencil} />
            <SheetAction label={item?.pinned ? t.unpin : t.pinToTop} onClick={onPin} icon={Pin} />
            <SheetAction label={t.deletePost} onClick={onDelete} icon={Trash2} danger />
            <SheetAction label={getT('common', lang).cancel} onClick={onClose} cancel />
        </BottomSheet>
    )
}

// ─── Single news card ─────────────────────────────────────────────────────────
function NewsCard({ item, onActions, lang }) {
    const t = getT('news', lang)

    // Count total reactions across all emoji
    const totalReactions = item.reactions
        ? Object.values(item.reactions).reduce((s, v) => s + v, 0)
        : 0

    return (
        <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${item.pinned ? 'border-[#007aff]' : 'border-black/5'}`}>
            {item.pinned && (
                <div className="flex items-center gap-1 px-4 pt-3 text-[12px] font-bold text-[#007aff]">
                    <Pin size={12} /> {t.pinnedLabel}
                </div>
            )}
            {item.image_url && (
                <img src={item.image_url} alt="" className="w-full max-h-48 object-cover" />
            )}
            <div className="p-4 flex flex-col gap-2">
                <p className="text-[14px] text-gray-700 leading-relaxed">
                    {lang === 'zh' && item.text_zh ? item.text_zh : item.text}
                </p>

                {/* Reactions row (from HTML: 🔥42, 🎉15, 👍30) */}
                {item.reactions && Object.keys(item.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-black/5">
                        {Object.entries(item.reactions).map(([emoji, count]) => (
                            <div key={emoji} className="flex items-center gap-1 bg-[#f1f2f6] rounded-xl px-2 py-1 text-[12px] font-semibold text-gray-600">
                                <span>{emoji}</span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    <button
                        onClick={() => onActions(item)}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200"
                    >
                        <MoreHorizontal size={16} className="text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AdminNews() {
    const { lang } = useAdmin()
    const [news, setNews] = useState([])
    const [loading, setLoading] = useState(true)
    const [editorItem, setEditorItem] = useState(undefined) // undefined=closed, null=new, obj=edit
    const [actionsItem, setActionsItem] = useState(null)

    const t = getT('news', lang)

    const load = async () => {
        setLoading(true)
        try {
            setNews(await getNews())
        } catch { setNews([]) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        const res = editorItem?.id
            ? await updateNews(editorItem.id, payload)
            : await createNews(payload)
        if (res.success) {
            toast.success(editorItem?.id ? getT('common', lang).saved : t.publishedMsg)
            // If new post — also publish to moments feed as approved
            if (!editorItem?.id) {
                const { error: mErr } = await supabase.from('moments').insert({
                    text: payload.text || payload.text_zh || '',
                    text_zh: payload.text_zh || '',
                    image_url: payload.image_url || null,
                    image_urls: payload.image_url ? [payload.image_url] : [],
                    status: 'approved',
                    is_admin_post: true,
                })
                if (mErr) console.error('[AdminNews] moments insert error:', mErr)
            }
            load()
        } else toast.error(res.error)
        setEditorItem(undefined)
        return res.data || (editorItem?.id ? { id: editorItem.id } : null)
    }

    const handlePin = async () => {
        if (!actionsItem) return
        await updateNews(actionsItem.id, { pinned: !actionsItem.pinned })
        toast.success(getT('common', lang).done)
        load()
        setActionsItem(null)
    }

    const handleDelete = async () => {
        if (!actionsItem) return
        if (!confirm(t.deleteConfirm)) return
        const res = await deleteNews(actionsItem.id)
        if (res.success) { toast.success(getT('common', lang).deleted); load() }
        else toast.error(res.error)
        setActionsItem(null)
    }

    return (
        <div className="p-5 flex flex-col gap-4">
            {editorItem !== undefined && (
                <NewsEditor
                    item={editorItem}
                    onSave={handleSave}
                    onClose={() => setEditorItem(undefined)}
                    lang={lang}
                />
            )}
            {actionsItem && (
                <PostActionsSheet
                    item={actionsItem}
                    onEdit={() => { setEditorItem(actionsItem); setActionsItem(null) }}
                    onPin={handlePin}
                    onDelete={handleDelete}
                    onClose={() => setActionsItem(null)}
                    lang={lang}
                />
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center">
                    <p className="text-2xl font-extrabold text-[#007aff]">{news.length}</p>
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mt-1">{t.totalPosts}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-extrabold text-[#ff9500]">{news.filter(n => n.pinned).length}</p>
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mt-1">{t.pinned}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-2xl font-extrabold text-[#34c759]">{news.reduce((sum, n) => sum + (n.reactions_count || 0), 0)}</p>
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mt-1">{lang === 'zh' ? '总反应' : 'Reactions'}</p>
                </Card>
            </div>            {/* Add button */}
            <button
                onClick={() => setEditorItem(null)}
                className="w-full flex items-center justify-center gap-2 bg-[#007aff] text-white py-3 rounded-xl text-[15px] font-bold active:scale-[0.98] transition-all shadow-md"
            >
                <Plus size={18} /> {t.addPost}
            </button>

            {loading ? (
                <div className="flex items-center justify-center h-32"><Spinner /></div>
            ) : news.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-[14px]">{t.noPosts}</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {news.map(item => (
                        <NewsCard key={item.id} item={item} onActions={setActionsItem} lang={lang} />
                    ))}
                </div>
            )}
        </div>
    )
}
