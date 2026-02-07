import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './presentation/context/AuthContext'
import { VoiceProfileProvider } from './presentation/context/VoiceProfileContext'
import { StoryProvider } from './presentation/context/StoryContext'
import { ProtectedRoute } from './presentation/components/ProtectedRoute'
import './index.css'

// Lazy Load Pages for Performance
const WelcomePage = lazy(() => import('./presentation/pages/WelcomePage').then(module => ({ default: module.WelcomePage })))
const LoginPage = lazy(() => import('./presentation/pages/LoginPage').then(module => ({ default: module.LoginPage })))
const SignupPage = lazy(() => import('./presentation/pages/SignupPage').then(module => ({ default: module.SignupPage })))
const DashboardPage = lazy(() => import('./presentation/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const DesignPage = lazy(() => import('./presentation/pages/DesignPage').then(module => ({ default: module.DesignPage })))
const StoryRequestPage = lazy(() => import('./presentation/pages/StoryRequestPage').then(module => ({ default: module.StoryRequestPage })))
const StoryViewPage = lazy(() => import('./presentation/pages/StoryViewPage').then(module => ({ default: module.StoryViewPage })))
const VoiceOnboardingPage = lazy(() => import('./presentation/pages/VoiceOnboardingPage').then(module => ({ default: module.VoiceOnboardingPage })))
const StoryHistoryPage = lazy(() => import('./presentation/pages/StoryHistoryPage').then(module => ({ default: module.StoryHistoryPage })))
const GrandmaViewerPage = lazy(() => import('./presentation/pages/public/GrandmaViewerPage').then(module => ({ default: module.GrandmaViewerPage })))
const DemoPage = lazy(() => import('./presentation/pages/public/DemoPage').then(module => ({ default: module.DemoPage })))
const CompanionCollectionPage = lazy(() => import('./presentation/pages/CompanionCollectionPage').then(module => ({ default: module.CompanionCollectionPage })))
const ProfilePage = lazy(() => import('./presentation/pages/ProfilePage').then(module => ({ default: module.ProfilePage })))
const StoryLibraryPage = lazy(() => import('./presentation/pages/StoryLibraryPage').then(module => ({ default: module.StoryLibraryPage })))
const LiveModePage = lazy(() => import('./presentation/pages/LiveModePage').then(module => ({ default: module.LiveModePage })))
const VoiceSettingsPage = lazy(() => import('./presentation/pages/VoiceSettingsPage').then(module => ({ default: module.VoiceSettingsPage })))

function App() {
  return (
    <AuthProvider>
      <VoiceProfileProvider>
        <StoryProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen bg-background-dark flex items-center justify-center text-white">Loading...</div>}>
              <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/share/:token" element={<GrandmaViewerPage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/design" element={<DesignPage />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stories/new"
                  element={
                    <ProtectedRoute>
                      <StoryRequestPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stories/:id"
                  element={
                    <ProtectedRoute>
                      <StoryViewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stories/history"
                  element={
                    <ProtectedRoute>
                      <StoryLibraryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stories/library"
                  element={
                    <ProtectedRoute>
                      <StoryLibraryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/voice/onboarding"
                  element={
                    <ProtectedRoute>
                      <VoiceOnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/companions"
                  element={
                    <ProtectedRoute>
                      <CompanionCollectionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/memory"
                  element={
                    <ProtectedRoute>
                      <StoryHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/live"
                  element={
                    <ProtectedRoute>
                      <LiveModePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/voice"
                  element={
                    <ProtectedRoute>
                      <VoiceSettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </StoryProvider>
      </VoiceProfileProvider>
    </AuthProvider>
  )
}

export default App
