import { Toaster } from 'react-hot-toast'
import { AppProvider, useApp } from '@/store/useAppStore'
import ErrorBoundary from '@/components/ErrorBoundary'
import OnboardingScreen from '@/screens/OnboardingScreen'
import PhoneScreen from '@/screens/PhoneScreen'
import OtpScreen from '@/screens/OtpScreen'
import PersonalScreen from '@/screens/PersonalScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import ProfileEditScreen from '@/screens/ProfileEditScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import FaqScreen from '@/screens/FaqScreen'
import PeopleScreen from '@/screens/PeopleScreen'
import MeetingsScreen from '@/screens/MeetingsScreen'
import MomentsScreen from '@/screens/MomentsScreen'

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

  const map = {
    onboarding: <OnboardingScreen />,
    phone: <PhoneScreen />,
    otp: <OtpScreen />,
    personal: <PersonalScreen />,
    settings: <SettingsScreen />,
    'profile-edit': <ProfileEditScreen />,
    profile: <ProfileScreen />,
    faq: <FaqScreen />,
    moments: <MomentsScreen />,
    people: <PeopleScreen />,
    meetings: <MeetingsScreen />,
  }

  return map[screen] ?? <OnboardingScreen />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <OfflineBanner />
        <div style={{ minHeight: '100vh', background: '#f5f7fb', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 1000, minHeight: '100vh', background: '#ffffff', position: 'relative' }}>
            <Router />
          </div>
        </div>
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
