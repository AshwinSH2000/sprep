import { Navigate, Route, Routes } from 'react-router-dom'
import { ArchivePage } from './components/archive/ArchivePage'
import { ChangePasswordPage } from './components/account/ChangePasswordPage'
import { ProfilePage } from './components/account/ProfilePage'
import { LoginPage } from './components/auth/LoginPage'
import { RegisterPage } from './components/auth/RegisterPage'
import { RequireAuth } from './components/auth/RequireAuth'
import { Dashboard } from './components/dashboard/Dashboard'
import { AppShell } from './components/layout/AppShell'
import { NotesPage } from './components/notes/NotesPage'
import { StatsPage } from './components/stats/StatsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
