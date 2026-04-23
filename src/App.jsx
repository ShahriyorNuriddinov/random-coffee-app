import { Toaster } from 'react-hot-toast'
import { AppProvider, useApp } from '@/store/useAppStore'
import OnboardingScreen from '@/screens/OnboardingScreen'
import PhoneScreen from '@/screens/PhoneScreen'
import OtpScreen from '@/screens/OtpScreen'
import PersonalScreen from '@/screens/PersonalScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import ProfileEditScreen from '@/screens/ProfileEditScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import FaqScreen from '@/screens/FaqScreen'
import BottomNav from '@/components/BottomNav'

function PlaceholderScreen({ title, navKey }) {
  return (
    <div className="app-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--app-hint)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--app-text)', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14 }}>Coming in Stage 2</div>
      </div>
      <BottomNav active={navKey} />
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
    moments: <PlaceholderScreen title="Moments" navKey="moments" />,
    people: <PlaceholderScreen title="People" navKey="people" />,
    meetings: <PlaceholderScreen title="Meetings" navKey="meetings" />,
  }

  return map[screen] ?? <OnboardingScreen />
}

export default function App() {
  return (
    <AppProvider>
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
  )
}
