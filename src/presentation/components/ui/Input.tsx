import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className = '',
            label,
            error,
            leftIcon,
            rightIcon,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || props.name

        return (
            <div className={`space-y-1.5 w-full ${className}`}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-xs font-medium text-text-subtle uppercase tracking-wide ml-1 block"
                    >
                        {label}
                    </label>
                )}

                <div className="relative group">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle transition-colors group-focus-within:text-primary pointer-events-none">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className={`
              w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white placeholder-slate-500 
              transition-all text-sm outline-none
              focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-white/10
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}
            `}
                        {...props}
                    />

                    {/* Right Icon */}
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-1.5 ml-1 animate-fade-in-up">
                        <span className="text-red-400 text-xs">{error}</span>
                    </div>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
