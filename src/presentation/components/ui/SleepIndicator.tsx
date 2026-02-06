interface SleepIndicatorProps {
    /** Sleep detection percentage (0-100) */
    percentage: number
    /** Optional size variant */
    size?: 'sm' | 'md'
    /** Optional custom class */
    className?: string
}

/**
 * Sleep detection indicator badge matching the Stitch mockup.
 * Shows moon emoji with percentage in a pill badge.
 */
export function SleepIndicator({
    percentage,
    size = 'md',
    className = ''
}: SleepIndicatorProps) {
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs gap-1',
        md: 'px-3 py-1.5 text-sm gap-1.5'
    }

    // Color based on sleep likelihood
    const getColor = () => {
        if (percentage >= 70) return 'text-accent-green'
        if (percentage >= 40) return 'text-primary'
        return 'text-warning'
    }

    return (
        <div
            className={`
        inline-flex items-center rounded-full 
        bg-primary/10 border border-primary/20 backdrop-blur-sm
        ${sizeClasses[size]}
        ${className}
      `}
        >
            <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>🌙</span>
            <span className={`font-semibold ${getColor()}`}>{percentage}%</span>
        </div>
    )
}
