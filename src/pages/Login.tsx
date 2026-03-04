import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ijsselheem-lichtblauw p-4">
      <div className="w-full max-w-sm rounded-[20px] border border-ijsselheem-accentblauw/30 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ijsselheem-donkerblauw mb-2">Roadmap AAAI</h1>
        <p className="text-sm text-ijsselheem-donkerblauw mb-6">Log in met je e-mail en wachtwoord.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-ijsselheem-donkerblauw mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-ijsselheem mt-1"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-ijsselheem-donkerblauw mb-1">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-ijsselheem mt-1"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[16px] bg-ijsselheem-donkerblauw px-3 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}
