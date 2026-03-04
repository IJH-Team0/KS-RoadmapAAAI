import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { NieuweAanvraag } from '@/pages/NieuweAanvraag'
import { Backlog } from '@/pages/Backlog'
import { BacklogDetail } from '@/pages/BacklogDetail'
import { Beoordelen } from '@/pages/Beoordelen'
import { StoriesMaken } from '@/pages/StoriesMaken'
import { Planning } from '@/pages/Planning'
import { Rapportage } from '@/pages/Rapportage'
import { Uitleg } from '@/pages/Uitleg'
import { Roadmap } from '@/pages/Roadmap'
import { Applicaties } from '@/pages/Applicaties'
import { ApplicatiesBeheren } from '@/pages/ApplicatiesBeheren'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700">Laden...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="nieuw" element={<NieuweAanvraag />} />
        <Route path="backlog" element={<Backlog />} />
        <Route path="backlog/feature/:featureId" element={<BacklogDetail />} />
        <Route path="backlog/:id" element={<BacklogDetail />} />
        <Route path="beoordelen" element={<Beoordelen />} />
        <Route path="stories-maken" element={<StoriesMaken />} />
        <Route path="planning" element={<Planning />} />
        <Route path="rapportage" element={<Rapportage />} />
        <Route path="uitleg" element={<Uitleg />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="applicaties" element={<Applicaties />} />
        <Route path="applicaties-beheren" element={<ApplicatiesBeheren />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
