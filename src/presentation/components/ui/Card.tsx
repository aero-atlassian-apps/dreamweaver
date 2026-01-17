import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'solid' | 'glass' | 'interactive' | 'outline'
    interactive?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            className = '',
            variant = 'solid',
            interactive = false,
            padding = 'md',
            children,
            ...props
        },
        ref
    ) => {
        // Base styles
        const baseStyles = 'rounded-2xl overflow-hidden relative transition-all duration-300'

        // Variant styles
        const variants = {
            solid: 'bg-card-dark border border-white/5 shadow-lg',
            glass: 'glass-panel',
            outline: 'bg-transparent border border-white/10',
            interactive: 'bg-card-dark border border-white/5 shadow-lg hover:border-white/10 hover:shadow-xl hover:-translate-y-1 cursor-pointer group'
        }

        // Explicit interactive override if prop is set
        const interactiveStyles = interactive ? 'hover:border-white/10 hover:shadow-xl hover:-translate-y-1 cursor-pointer group' : ''

        // Padding styles
        const paddings = {
            none: '',
            sm: 'p-3',
            md: 'p-5',
            lg: 'p-8'
        }

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${interactiveStyles} ${paddings[padding]} ${className}`}
                {...props}
            >
                {children}
            </div>
        )
    }
)

Card.displayName = 'Card'
