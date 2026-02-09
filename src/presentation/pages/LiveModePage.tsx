import { useNavigate } from 'react-router-dom'
import { LiveStorySession } from '../components/LiveStorySession'
import { useAuth } from '../context/AuthContext'
import { FeatureDemoLayout } from '../layouts/FeatureDemoLayout'
import { VisionLink } from '../components/VisionLink'

export function LiveModePage() {
    const navigate = useNavigate()
    const { user } = useAuth()

    const childName = user?.user_metadata?.['child_name'] || 'Child'
    const childAge = user?.user_metadata?.['child_age'] || 5

    // 1. Defining the "Real Life Moment" (Intro)
    const IntroContent = (
        <div className="space-y-6">
            <div className="inline-block p-4 rounded-full bg-indigo-500/10 mb-4 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <span className="material-symbols-outlined text-4xl text-indigo-300">bedtime</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 leading-tight">
                The Real Life Moment
            </h1>

            <div className="space-y-4 text-lg md:text-xl text-indigo-200/60 font-light leading-relaxed max-w-lg mx-auto">
                <p>It's <span className="text-white font-medium">8:30 PM</span>. The house is quiet.</p>
                <p>Lights are dimmed. You are tired.</p>
                <p>{childName} is waiting for a story, but you have no energy left.</p>
            </div>
            <p className="text-xs text-white/30 uppercase tracking-widest mt-8">
                Powered by Gemini 2.0 Flash (Low Latency)
            </p>
        </div>
    );

    // 2. Defining the Value Proposition (Outro)
    const OutroContent = (
        <div className="space-y-6 text-indigo-200/80 leading-relaxed font-light">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500">bolt</span>
                        Zero Mental Load
                    </h3>
                    <p className="text-sm">the parent pushes one button. The AI takes the lead, managing the energy and the narrative arc.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500">verified_user</span>
                        Safety First
                    </h3>
                    <p className="text-sm">Real-time filtering ensures appropriate content, while active listening adapts to the child's mood.</p>
                </div>
            </div>
            <p className="italic text-white/50 pt-4">"A Bedtime Conductor, not just a chatbot."</p>
        </div>
    );

    return (
        <FeatureDemoLayout
            title="Bedtime Lab"
            subtitle="Live Interactive Mode"
            onBack={() => navigate('/journey')} // Linking back to Hub
            extraAction={<VisionLink />}
            introContent={IntroContent}
            demoContent={
                <div className="w-full flex justify-center">
                    <LiveStorySession
                        childName={childName}
                        childAge={childAge}
                    />
                </div>
            }
            outroContent={OutroContent}
        />
    )
}
