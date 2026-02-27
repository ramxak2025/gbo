import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider, useData } from './context/DataContext'

import InstallPrompt from './components/InstallPrompt'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cash from './pages/Cash'
import Team from './pages/Team'
import StudentDetail from './pages/StudentDetail'
import Tournaments from './pages/Tournaments'
import TournamentDetail from './pages/TournamentDetail'
import Profile from './pages/Profile'
import AddStudent from './pages/AddStudent'
import AddTournament from './pages/AddTournament'
import AddTrainer from './pages/AddTrainer'
import TrainerDetail from './pages/TrainerDetail'
import Groups from './pages/Groups'
import Author from './pages/Author'
import NotificationSettings from './pages/NotificationSettings'
import CreateInternalTournament from './pages/CreateInternalTournament'
import InternalTournamentDetail from './pages/InternalTournamentDetail'
import Attendance from './pages/Attendance'

function AppRoutes() {
  const { auth } = useAuth()
  const { reload } = useData()

  if (!auth) return <Login onLogin={reload} />

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      {auth.role === 'trainer' && <Route path="/cash" element={<Cash />} />}
      <Route path="/team" element={<Team />} />
      <Route path="/student/:id" element={<StudentDetail />} />
      <Route path="/tournaments" element={<Tournaments />} />
      <Route path="/tournaments/:id" element={<TournamentDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/notifications" element={<NotificationSettings />} />
      <Route path="/author" element={<Author />} />
      {auth.role === 'trainer' && <Route path="/add-student" element={<AddStudent />} />}
      {auth.role === 'trainer' && <Route path="/groups" element={<Groups />} />}
      {auth.role === 'trainer' && <Route path="/create-internal-tournament" element={<CreateInternalTournament />} />}
      {auth.role === 'trainer' && <Route path="/attendance/:groupId" element={<Attendance />} />}
      <Route path="/internal-tournament/:id" element={<InternalTournamentDetail />} />
      {auth.role === 'superadmin' && <Route path="/add-tournament" element={<AddTournament />} />}
      {auth.role === 'superadmin' && <Route path="/add-trainer" element={<AddTrainer />} />}
      {auth.role === 'superadmin' && <Route path="/trainer/:id" element={<TrainerDetail />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <InstallPrompt />
          </BrowserRouter>
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  )
}
