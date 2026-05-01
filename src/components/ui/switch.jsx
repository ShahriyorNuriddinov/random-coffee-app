// Simple iOS-style toggle switch — no external dependencies
function Switch({ checked, onCheckedChange, className, disabled, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 44,
        height: 26,
        borderRadius: 13,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#007aff' : '#e5e5ea',
        transition: 'background 0.2s',
        flexShrink: 0,
        padding: 0,
        opacity: disabled ? 0.5 : 1,
      }}
      {...props}
    >
      <span style={{
        position: 'absolute',
        left: checked ? 20 : 2,
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

export { Switch }
