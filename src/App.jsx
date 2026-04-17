import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, lazy, Suspense } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider, useData } from './context/DataContext'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Cash = lazy(() => import('./pages/Cash'))
const Team = lazy(() => import('./pages/Team'))
const StudentDetail = lazy(() => import('./pages/StudentDetail'))
const Tournaments = lazy(() => import('./pages/Tournaments'))
const TournamentDetail = lazy(() => import('./pages/TournamentDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const AddStudent = lazy(() => import('./pages/AddStudent'))
const AddTournament = lazy(() => import('./pages/AddTournament'))
const AddTrainer = lazy(() => import('./pages/AddTrainer'))
const TrainerDetail = lazy(() => import('./pages/TrainerDetail'))
const Groups = lazy(() => import('./pages/Groups'))
const Author = lazy(() => import('./pages/Author'))
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'))
const CreateInternalTournament = lazy(() => import('./pages/CreateInternalTournament'))
const InternalTournamentDetail = lazy(() => import('./pages/InternalTournamentDetail'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Materials = lazy(() => import('./pages/Materials'))
const Clubs = lazy(() => import('./pages/Clubs'))
const ClubDetail = lazy(() => import('./pages/ClubDetail'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  )
}

function AppRoutes() {
  const { auth } = useAuth()
  const { reload } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const prevAuth = useRef(null)

  useEffect(() => {
    if (!prevAuth.current && auth && location.pathname !== '/') {
      navigate('/', { replace: true })
    }
    prevAuth.current = auth
  }, [auth])

  if (!auth) return <Login onLogin={reload} />

  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/materials" element={<Materials />} />
        {auth.role === 'trainer' && <Route path="/add-student" element={<AddStudent />} />}
        {auth.role === 'trainer' && <Route path="/groups" element={<Groups />} />}
        {auth.role === 'trainer' && <Route path="/create-internal-tournament" element={<CreateInternalTournament />} />}
        {auth.role === 'trainer' && <Route path="/attendance/:groupId" element={<Attendance />} />}
        <Route path="/internal-tournament/:id" element={<InternalTournamentDetail />} />
        {auth.role === 'superadmin' && <Route path="/add-tournament" element={<AddTournament />} />}
        {auth.role === 'superadmin' && <Route path="/add-trainer" element={<AddTrainer />} />}
        {auth.role === 'superadmin' && <Route path="/trainer/:id" element={<TrainerDetail />} />}
        {auth.role === 'superadmin' && <Route path="/clubs" element={<Clubs />} />}
        {(auth.role === 'superadmin' || (auth.role === 'trainer' && auth.user?.isHeadTrainer)) && <Route path="/club/:id" element={<ClubDetail />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}
