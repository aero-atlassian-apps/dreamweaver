import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function WelcomePage() {
    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-background-dark overflow-x-hidden font-sans">
            {/* Ambient Background Glow Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Top glow resembling moonlight */}
                <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[150%] aspect-square bg-primary/10 rounded-full blur-[100px]"></div>
                {/* Subtle bottom gradient */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col flex-1 h-full px-6 py-8 items-center justify-between">
                {/* Header / Logo Section */}
                <div className="flex flex-col items-center gap-4 mt-4 animate-fade-in-up">
                    <div className="relative flex items-center justify-center w-28 h-28 mx-auto hover:scale-105 transition-transform duration-500">
                        {/* Glow effect behind logo */}
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                        <img
                            src="/logo-icon.png"
                            alt="DreamWeaver Moon Logo"
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(122,158,255,0.5)]"
                        />
                    </div>
                    <h1 className="text-white tracking-tight text-[32px] font-extrabold leading-tight text-center drop-shadow-lg font-serif">
                        DreamWeaver
                    </h1>
                </div>

                {/* Hero Illustration */}
                <div className="w-full max-w-[360px] flex-1 flex items-center justify-center py-8">
                    <div className="relative w-full aspect-[4/5] max-h-[500px]">
                        {/* Back glow behind image */}
                        <div className="absolute inset-4 bg-primary rounded-full blur-[50px] opacity-40 animate-pulse"></div>
                        {/* Image Card */}
                        <div
                            className="w-full h-full bg-center bg-no-repeat bg-cover rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden relative"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDtKAHlh_UbC9lyGOe5RGX4zf5jvgbyEfBMba3NPCIsdjFyMd3flps3YzB9FgYT_DbFeH4EgD8heaeMsBEo5KJQ5UFozto1A1fgUrNrwI0Fx6GAkL1a_m9Tu9HKTp9msKfbbUDlaZ6fskSCba25b9xY83isv4EC0Wlo0zIuWRimR6WWQhMw3uq05HiZF5WFfYxAW4V7ncwGe1FKkz1Y2ENnxRVcA6Grp98A1gLjQgOVHXwVQgjC5Qv2ccFOlB2b0_fL0JMiaBIzsxDc")' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-dark/60"></div>
                        </div>
                    </div>
                </div>

                {/* Bottom Content: Tagline & Buttons */}
                <div className="w-full max-w-md flex flex-col items-center gap-8 mb-4">
                    <p className="text-white/90 text-lg font-medium leading-relaxed text-center max-w-[300px]">
                        Your voice. Their stories.<br />
                        <span className="text-white/60">Memories that last forever.</span>
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <Link to="/signup" className="w-full">
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                className="h-14 rounded-full text-[17px] shadow-[0_8px_20px_-6px_rgba(122,158,255,0.6)] hover:shadow-[0_12px_24px_-4px_rgba(122,158,255,0.8)]"
                                rightIcon={<span className="material-symbols-outlined text-xl">arrow_forward</span>}
                            >
                                Get Started
                            </Button>
                        </Link>

                        <Link to="/login" className="w-full">
                            <Button
                                variant="icon"
                                size="lg"
                                fullWidth
                                className="h-14 rounded-full bg-transparent border border-white/10 hover:bg-white/5 text-white/90 text-[17px] font-semibold"
                            >
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
