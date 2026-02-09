import { useNavigate } from 'react-router-dom'

export function VisionLink({ className = '' }: { className?: string }) {
    const navigate = useNavigate()
    return (
        <button
            onClick={() => navigate('/vision')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 transition-all text-[10px] font-bold uppercase tracking-wider ${className}`}
        >
            <span className="text-sm">⚡</span>
            <span>Vision</span>
        </button>
    )
}
