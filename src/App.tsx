import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './presentation/context/AuthContext'
import { ProtectedRoute } from './presentation/components/ProtectedRoute'
import { WelcomePage } from './presentation/pages/WelcomePage'
import { LoginPage } from './presentation/pages/LoginPage'
import { SignupPage } from './presentation/pages/SignupPage'
import { DashboardPage } from './presentation/pages/DashboardPage'
import { DesignPage } from './presentation/pages/DesignPage'
import { StoryRequestPage } from './presentation/pages/StoryRequestPage'
import { StoryViewPage } from './presentation/pages/StoryViewPage'
import { VoiceOnboardingPage } from './presentation/pages/VoiceOnboardingPage'
import { StoryHistoryPage } from './presentation/pages/StoryHistoryPage'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
