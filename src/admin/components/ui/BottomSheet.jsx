// Generic bottom sheet overlay
import PropTypes from 'prop-types'

export default function BottomSheet({ onClose, children }) {
    return (
        <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-white rounded-t-2xl pb-8"
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}

BottomSheet.propTypes = {
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
}

export function SheetAction({ label, onClick, danger, cancel, icon: Icon }) {
    return (
        <button
            onClick={onClick}
            className={`w-full py-4 text-center text-[17px] font-medium border-b border-black/5 active:bg-black/[0.02] flex items-center justify-center gap-2 ${cancel ? 'font-semibold text-gray-900' : danger ? 'text-red-500' : 'text-[#007aff]'}`}
        >
            {Icon && <Icon size={18} />}
            {label}
        </button>
    )
}

SheetAction.propTypes = {
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    danger: PropTypes.bool,
    cancel: PropTypes.bool,
    icon: PropTypes.elementType,
}

export function SheetHeader({ title }) {
    return (
        <div className="px-4 py-4 text-center text-[14px] font-semibold text-gray-400 border-b border-black/5">
            {title}
        </div>
    )
}

SheetHeader.propTypes = {
    title: PropTypes.string.isRequired,
}
