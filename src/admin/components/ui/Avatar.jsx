// User avatar — shows image if available, otherwise colored initials
const COLORS = ['#007aff', '#ff9500', '#34c759', '#5856d6', '#ff3b30', '#ff2d55']

export const getAvatarColor = (id = '') =>
    COLORS[id.charCodeAt(0) % COLORS.length]

export default function Avatar({ name, url, size = 36, color = '#007aff' }) {
    const initials = (name || '?')
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    if (url) {
        return (
            <img
                src={url}
                alt={name}
                className="rounded-full object-cover flex-shrink-0"
                style={{ width: size, height: size }}
            />
        )
    }

    return (
        <div
            className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
        >
            {initials}
        </div>
    )
}
