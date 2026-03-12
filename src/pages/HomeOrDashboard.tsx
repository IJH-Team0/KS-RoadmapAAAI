import { useAuth } from '@/contexts/AuthContext'
import { Dashboard } from '@/pages/Dashboard'
import { Applicaties } from '@/pages/Applicaties'

export function HomeOrDashboard() {
  const { effectiveRole } = useAuth()
  return effectiveRole === 'gebruiker' ? <Applicaties /> : <Dashboard />
}
