import React from 'react'

// =====================================
// HEADING COMPONENT
// =====================================

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    level?: 1 | 2 | 3 | 4 | 5 | 6
    variant?: 'serif' | 'sans'
    glow?: boolean
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
    (
        {
            className = '',
            level = 1,
            variant = 'serif',
            glow = false,
            children,
            ...props
        },
        ref
    ) => {
        // Size mapping based on level
        const sizes: Record<number, string> = {
            1: 'text-4xl md:text-5xl',
            2: 'text-3xl md:text-4xl',
            3: 'text-2xl md:text-3xl',
            4: 'text-xl md:text-2xl',
            5: 'text-lg md:text-xl',
            6: 'text-base md:text-lg'
        }

        // Font family based on variant
        const fonts = {
            serif: 'font-serif',
            sans: 'font-sans'
        }

        // Base styles
        const baseStyles = 'font-bold tracking-tight text-white'
        const glowClass = glow ? 'text-glow' : ''

        const combinedClassName = `${baseStyles} ${sizes[level]} ${fonts[variant]} ${glowClass} ${className}`

        // Render appropriate heading level
        switch (level) {
            case 1: return <h1 ref={ref} className={combinedClassName} {...props}>{children}</h1>
            case 2: return <h2 ref={ref} className={combinedClassName} {...props}>{children}</h2>
            case 3: return <h3 ref={ref} className={combinedClassName} {...props}>{children}</h3>
            case 4: return <h4 ref={ref} className={combinedClassName} {...props}>{children}</h4>
            case 5: return <h5 ref={ref} className={combinedClassName} {...props}>{children}</h5>
            case 6: return <h6 ref={ref} className={combinedClassName} {...props}>{children}</h6>
            default: return <h1 ref={ref} className={combinedClassName} {...props}>{children}</h1>
        }
    }
)

Heading.displayName = 'Heading'


// =====================================
// TEXT COMPONENT
// =====================================

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'primary' | 'secondary' | 'subtle' | 'muted'
    as?: 'p' | 'span' | 'div' | 'label'
    weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
    (
        {
            className = '',
            size = 'md',
            variant = 'primary',
            as = 'p',
            weight = 'normal',
            children,
            ...props
        },
        ref
    ) => {
        const Tag = as

        // Size mapping
        const sizes: Record<string, string> = {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl'
        }

        // Color variants
        const variants: Record<string, string> = {
            primary: 'text-white',
            secondary: 'text-slate-200',
            subtle: 'text-text-subtle',
            muted: 'text-slate-500'
        }

        // Font weights
        const weights: Record<string, string> = {
            normal: 'font-normal',
            medium: 'font-medium',
            semibold: 'font-semibold',
            bold: 'font-bold'
        }

        // Base styles
        const baseStyles = 'font-sans leading-relaxed'

        return React.createElement(
            Tag,
            {
                ref,
                className: `${baseStyles} ${sizes[size]} ${variants[variant]} ${weights[weight]} ${className}`,
                ...props
            },
            children
        )
    }
)

Text.displayName = 'Text'
