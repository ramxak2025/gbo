import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { loadData } from './utils/storage'

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

function AppRoutes() {
  const { auth } = useAuth()

  if (!auth) return <Login />

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      {auth.role === 'trainer' && <Route path="/cash" element={<Cash />} />}
      <Route path="/team" element={<Team />} />
      <Route path="/student/:id" element={<StudentDetail />} />
      <Route path="/tournaments" element={<Tournaments />} />
      <Route path="/tournaments/:id" element={<TournamentDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/author" element={<Author />} />
      {auth.role === 'trainer' && <Route path="/add-student" element={<AddStudent />} />}
      {auth.role === 'trainer' && <Route path="/groups" element={<Groups />} />}
      {auth.role === 'superadmin' && <Route path="/add-tournament" element={<AddTournament />} />}
      {auth.role === 'superadmin' && <Route path="/add-trainer" element={<AddTrainer />} />}
      {auth.role === 'superadmin' && <Route path="/trainer/:id" element={<TrainerDetail />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const [data, setData] = useState(() => loadData())

  return (
    <ThemeProvider>
      <DataProvider initialData={data} onDataChange={setData}>
        <AuthProvider data={data}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  )
}
