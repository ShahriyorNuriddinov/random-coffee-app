// Reusable loading spinner
export default function Spinner({ size = 7, color = 'border-[#007aff]' }) {
    return (
        <div
            className={`w-${size} h-${size} border-2 ${color} border-t-transparent rounded-full animate-spin`}
        />
    )
}
