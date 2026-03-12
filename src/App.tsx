import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { Login } from '@/pages/Login'
import { HomeOrDashboard } from '@/pages/HomeOrDashboard'
import { NieuweAanvraag } from '@/pages/NieuweAanvraag'
import { NieuweProgramma } from '@/pages/NieuweProgramma'
import { NieuweFeature } from '@/pages/NieuweFeature'
import { Backlog } from '@/pages/Backlog'
import { BacklogDetail } from '@/pages/BacklogDetail'
import { Beoordelen } from '@/pages/Beoordelen'
import { StoriesMaken } from '@/pages/StoriesMaken'
import { Planning } from '@/pages/Planning'
import { PublicatieAfronden } from '@/pages/PublicatieAfronden'
import { Rapportage } from '@/pages/Rapportage'
import { UitlegLayout } from '@/pages/uitleg/UitlegLayout'
import { UitlegOverzicht } from '@/pages/uitleg/UitlegOverzicht'
import { UitlegProces } from '@/pages/uitleg/UitlegProces'
import { UitlegBeveiligingsniveaus } from '@/pages/uitleg/UitlegBeveiligingsniveaus'
import { UitlegPrioriteitsscore } from '@/pages/uitleg/UitlegPrioriteitsscore'
import { Roadmap } from '@/pages/Roadmap'
import { Applicaties } from '@/pages/Applicaties'
import { ApplicatiesBeheren } from '@/pages/ApplicatiesBeheren'
import { Beheer } from '@/pages/Beheer'
import { WensIndienen } from '@/pages/WensIndienen'
import { Wensen } from '@/pages/Wensen'
import { WensDetail } from '@/pages/WensDetail'

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
        <Route index element={<HomeOrDashboard />} />
        <Route path="nieuw" element={<NieuweAanvraag />} />
        <Route path="nieuw/programma" element={<NieuweProgramma />} />
        <Route path="nieuw/feature" element={<NieuweFeature />} />
        <Route path="backlog" element={<Backlog />} />
        <Route path="backlog/feature/:featureId" element={<BacklogDetail />} />
        <Route path="backlog/:id" element={<BacklogDetail />} />
        <Route path="beoordelen" element={<Beoordelen />} />
        <Route path="stories-maken" element={<StoriesMaken />} />
        <Route path="planning" element={<Planning />} />
        <Route path="publicatie-afronden" element={<PublicatieAfronden />} />
        <Route path="rapportage" element={<Rapportage />} />
        <Route path="uitleg" element={<UitlegLayout />}>
          <Route index element={<UitlegOverzicht />} />
          <Route path="proces" element={<UitlegProces />} />
          <Route path="beveiligingsniveaus" element={<UitlegBeveiligingsniveaus />} />
          <Route path="prioriteitsscore" element={<UitlegPrioriteitsscore />} />
        </Route>
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="applicaties" element={<Applicaties />} />
        <Route path="applicaties-beheren" element={<ApplicatiesBeheren />} />
        <Route path="beheer" element={<Beheer />} />
        <Route path="wens-indienen" element={<WensIndienen />} />
        <Route path="wensen" element={<Wensen />} />
        <Route path="wensen/:id" element={<WensDetail />} />
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
