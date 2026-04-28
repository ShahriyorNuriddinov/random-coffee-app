/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 */

const REQUIRED_ENV_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
]

const OPTIONAL_ENV_VARS = [
    'VITE_GROQ_API_KEY',
    'VITE_OPENAI_API_KEY',
    'VITE_AIRWALLEX_ENV',
]

export function validateEnvironment() {
    const missing = []
    const warnings = []

    // Check required variables
    for (const varName of REQUIRED_ENV_VARS) {
        if (!import.meta.env[varName]) {
            missing.push(varName)
        }
    }

    // Check optional but recommended variables
    for (const varName of OPTIONAL_ENV_VARS) {
        if (!import.meta.env[varName]) {
            warnings.push(varName)
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing)
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    if (warnings.length > 0) {
        console.warn('⚠️  Missing optional environment variables:', warnings)
        console.warn('Some features may not work correctly.')
    }

    // Validate Supabase URL format
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        console.error('❌ Invalid VITE_SUPABASE_URL: must start with https://')
        throw new Error('Invalid VITE_SUPABASE_URL format')
    }

    console.log('✅ Environment variables validated successfully')
}
