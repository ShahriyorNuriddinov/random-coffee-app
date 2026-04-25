import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info?.componentStack)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    height: '100vh', padding: 32, textAlign: 'center',
                    background: '#f4f7f9', fontFamily: '-apple-system, sans-serif',
                }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>☕</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', marginBottom: 8 }}>
                        Something went wrong
                    </div>
                    <div style={{ fontSize: 14, color: '#8e8e93', marginBottom: 24, lineHeight: 1.5 }}>
                        Please reload the app to continue.
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: 'linear-gradient(135deg, #007aff, #5856d6)',
                            color: '#fff', border: 'none', borderRadius: 14,
                            padding: '14px 32px', fontSize: 16, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        Reload App
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
