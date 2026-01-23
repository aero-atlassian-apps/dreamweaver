import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './presentation/context/AuthContext'
import { VoiceProfileProvider } from './presentation/context/VoiceProfileContext'
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

function App() {
  return (
    <AuthProvider>
      <VoiceProfileProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background-dark flex items-center justify-center text-white">Loading...</div>}>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/design" element={<DesignPage />} />
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
                    <StoryHistoryPage />
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
            </Routes>
          </Suspense>
        </BrowserRouter>
      </VoiceProfileProvider>
    </AuthProvider>
  )
}

export default App
