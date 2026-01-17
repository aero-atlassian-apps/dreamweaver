/**
 * BottomNavigation - Mobile bottom navigation bar
 * 
 * Extracted from DashboardPage for Single Responsibility.
 */

interface NavItem {
    id: string
    label: string
    icon: string
    isActive?: boolean
}

interface BottomNavigationProps {
    activeItem?: string
    onNavigate: (itemId: string) => void
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'stories', label: 'Stories', icon: 'auto_stories' },
    { id: 'memory', label: 'Memory', icon: 'graphic_eq' },
    { id: 'profile', label: 'Profile', icon: 'person' },
]

export function BottomNavigation({ activeItem = 'home', onNavigate }: BottomNavigationProps) {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background-dark/95 backdrop-blur-xl pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
            <div className="flex h-[4rem] items-center justify-around px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.id === activeItem
                    return (
                        <button
                            key={item.id}
                            className={`group flex flex-1 flex-col items-center justify-center gap-1.5 pt-2 active:scale-95 transition-transform ${isActive ? '' : 'text-text-subtle hover:text-slate-200'
                                }`}
                            onClick={() => onNavigate(item.id)}
                        >
                            <span
                                className={`material-symbols-outlined text-[26px] ${isActive
                                        ? 'text-primary drop-shadow-[0_0_8px_rgba(122,158,255,0.4)]'
                                        : ''
                                    }`}
                                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                                {item.icon}
                            </span>
                            <span className={`text-[10px] ${isActive ? 'font-semibold text-primary' : 'font-medium group-hover:font-semibold'}`}>
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
