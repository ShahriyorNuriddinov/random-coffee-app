import { useApp } from '../store/useAppStore'

export default function DarkToggle() {
    const { darkMode, toggleDark } = useApp()
    return (
        <button
            onClick={toggleDark}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-full text-base cursor-pointer border-none"
            style={{ background: 'rgba(120,120,128,0.12)' }}
            title="Toggle dark mode"
        >
            {darkMode ? '☀️' : '🌙'}
        </button>
    )
}
