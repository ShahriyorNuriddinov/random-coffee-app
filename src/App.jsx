import { lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { AppProvider, useApp } from '@/store/useAppStore'
import ErrorBoundary from '@/components/ErrorBoundary'

// Critical screens — loaded immediately
import OnboardingScreen from '@/screens/OnboardingScreen'
import LangSelectScreen from '@/screens/LangSelectScreen'
import PhoneScreen from '@/screens/PhoneScreen'
import OtpScreen from '@/screens/OtpScreen'
import PersonalScreen from '@/screens/PersonalScreen'

// Non-critical screens — lazy loaded
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'))
const ProfileEditScreen = lazy(() => import('@/screens/ProfileEditScreen'))
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'))
const FaqScreen = lazy(() => import('@/screens/FaqScreen'))
const PeopleScreen = lazy(() => import('@/screens/PeopleScreen'))
const MeetingsScreen = lazy(() => import('@/screens/MeetingsScreen'))
const MomentsScreen = lazy(() => import('@/screens/MomentsScreen'))

function ScreenFallback() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--app-bg, #f4f7f9)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e5e5ea', borderTopColor: '#007aff', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function OfflineBanner() {
  const { isOnline } = useApp()
  if (isOnline) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#ff3b30', color: '#fff', textAlign: 'center',
      padding: '8px 16px', fontSize: 13, fontWeight: 700,
      fontFamily: '-apple-system, sans-serif',
    }}>
      No internet connection
    </div>
  )
}

function Router() {
  const { screen } = useApp()

  const critical = {
    'lang-select': <LangSelectScreen />,
    onboarding: <OnboardingScreen />,
    phone: <PhoneScreen />,
    otp: <OtpScreen />,
    personal: <PersonalScreen />,
  }

  if (critical[screen]) return critical[screen]

  const lazy_map = {
    settings: SettingsScreen,
    'profile-edit': ProfileEditScreen,
    profile: ProfileScreen,
    faq: FaqScreen,
    moments: MomentsScreen,
    people: PeopleScreen,
    meetings: MeetingsScreen,
  }

  const LazyScreen = lazy_map[screen]
  if (!LazyScreen) return <OnboardingScreen />

  return (
    <Suspense fallback={<ScreenFallback />}>
      <LazyScreen key={screen} />
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <OfflineBanner />
        <Router />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(0,0,0,0.82)',
              color: '#fff',
              borderRadius: 20,
              fontWeight: 600,
              fontSize: 14,
              padding: '12px 24px',
            },
            success: { iconTheme: { primary: '#34c759', secondary: '#fff' } },
            error: { style: { background: '#ff3b30' } },
          }}
        />
      </AppProvider>
    </ErrorBoundary>
  )
}
