import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './presentation/context/AuthContext'
import { ProtectedRoute } from './presentation/components/ProtectedRoute'
import { WelcomePage } from './presentation/pages/WelcomePage'
import { LoginPage } from './presentation/pages/LoginPage'
import { SignupPage } from './presentation/pages/SignupPage'
import { DashboardPage } from './presentation/pages/DashboardPage'
import { DesignPage } from './presentation/pages/DesignPage'
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
