// Full-screen modal (slides up from bottom)
import PropTypes from 'prop-types'
import { X } from 'lucide-react'

export default function FullScreenModal({ title, onClose, rightAction, children }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f2f4f7]">
            <div className="bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between flex-shrink-0">
                {typeof onClose === 'string' ? (
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
            <div className="flex-1 overflow-y-auto pb-8">
                {children}
            </div>
        </div>
    )
}

FullScreenModal.propTypes = {
    title: PropTypes.string.isRequired,
    onClose: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    rightAction: PropTypes.node,
    children: PropTypes.node,
}
