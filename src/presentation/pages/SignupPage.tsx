import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { PageTransition } from '../components/ui/PageTransition'

export function SignupPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const { signUp } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await signUp(email, password, name)
        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-card-dark/50 to-transparent pointer-events-none"></div>
            <div className="absolute -top-[10%] -left-[10%] w-96 h-96 bg-accent-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

            <PageTransition className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-4 hover:scale-105 transition-transform duration-300">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <img src="/logo-icon.png" alt="Logo" className="w-full h-full object-contain relative z-10" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight font-serif">Create Account</h1>
                    <p className="text-text-subtle mt-1 text-sm">Start your magical journey</p>
                </div>

                {/* Form Card */}
                <Card variant="glass" padding="lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 rounded-xl flex items-center gap-2 animate-fade-in-up">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {error}
                            </div>
                        )}

                        <Input
                            label="Parent's Name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Sarah"
                            required
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="parent@example.com"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={loading}
                            className="mt-2"
                            rightIcon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                        >
                            Get Started
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-text-subtle text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </Card>
            </PageTransition>
        </div>
    )
}
