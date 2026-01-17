import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className = '',
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            fullWidth = false,
            ...props
        },
        ref
    ) => {
        // Base styles
        const baseStyles = 'relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl overflow-hidden group select-none'

        // Variant styles
        const variants = {
            primary: 'bg-primary text-background-dark shadow-[0_4px_20px_rgba(122,158,255,0.4)] hover:shadow-[0_8px_25px_rgba(122,158,255,0.5)] hover:bg-primary/90',
            secondary: 'glass-panel text-white hover:bg-white/10 hover:border-white/20 shadow-lg',
            ghost: 'bg-transparent text-text-subtle hover:text-white hover:bg-white/5',
            icon: 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10',
            danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
        }

        // Size styles
        const sizes = {
            sm: 'text-xs h-9 px-4 gap-1.5',
            md: 'text-sm h-12 px-6 gap-2',
            lg: 'text-base h-14 px-8 gap-3',
            icon: 'h-10 w-10 p-0 rounded-full' // Specific for icon buttons
        }

        // Full width
        const widthClass = fullWidth ? 'w-full' : ''

        // Loading spinner
        const LoadingSpinner = () => (
            <span className="absolute inset-0 flex items-center justify-center bg-inherit">
                <span className="w-5 h-5 border-2 border-inherit border-t-transparent rounded-full animate-spin opacity-70"></span>
            </span>
        )

        // Glow effect for primary buttons
        const GlowEffect = () => (
            variant === 'primary' ? (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            ) : null
        )

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <LoadingSpinner />}
                <GlowEffect />

                <span className={`static z-10 flex items-center gap-inherit ${isLoading ? 'invisible' : ''}`}>
                    {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="flex-shrink-0 transition-transform group-hover:translate-x-1">{rightIcon}</span>}
                </span>
            </button>
        )
    }
)

Button.displayName = 'Button'
