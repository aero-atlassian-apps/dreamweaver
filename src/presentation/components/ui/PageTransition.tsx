import React from 'react'

export interface PageTransitionProps {
    children: React.ReactNode
    className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
    return (
        <div className={`animate-fade-in-up w-full ${className}`}>
            {children}
        </div>
    )
}
