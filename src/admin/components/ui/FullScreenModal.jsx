// Full-screen modal (slides up from bottom)
// Used for: member edit, news editor
import { X } from 'lucide-react'

export default function FullScreenModal({ title, onClose, rightAction, children }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f2f4f7]">
            {/* Header */}
            <div className="bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between flex-shrink-0">
                {typeof onClose === 'string' ? (
                    // String = left cancel button (for news editor style)
                    <button className="text-[#007aff] text-[15px] font-medium" onClick={() => { }}>
                        {onClose}
                    </button>
                ) : (
                    <button onClick={onClose}>
                        <X size={22} className="text-gray-400" />
                    </button>
                )}
                <span className="text-[18px] font-extrabold">{title}</span>
                {rightAction ? rightAction : <div className="w-6" />}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto pb-8">
                {children}
            </div>
        </div>
    )
}
