import { Navigate, Route, Routes } from 'react-router-dom'
import { ArchivePage } from './components/archive/ArchivePage'
import { LoginPage } from './components/auth/LoginPage'
import { RequireAuth } from './components/auth/RequireAuth'
import { Dashboard } from './components/dashboard/Dashboard'
import { AppShell } from './components/layout/AppShell'
import { NotesPage } from './components/notes/NotesPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/notes" element={<NotesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
