# React Component Example: Button

This example demonstrates the recommended pattern for building React components.

## Input Request
"Create a button component with primary, secondary, and ghost variants, with loading state support"

## Output Component

```tsx
// src/components/ui/Button/Button.tsx
import { memo, forwardRef, type ComponentPropsWithoutRef } from 'react';
import './Button.css';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { 
      variant = 'primary', 
      size = 'md', 
      isLoading = false, 
      disabled,
      children, 
      className,
      ...props 
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={`btn btn--${variant} btn--${size} ${className ?? ''}`}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? <LoadingSpinner /> : children}
      </button>
    );
  }
));
```

## Key Patterns Used

1. **Named export with memo** - Prevents unnecessary re-renders
2. **forwardRef** - Allows parent access to DOM node
3. **Named function** - Better debugging in React DevTools
4. **Prop spreading** - Supports all native button attributes
5. **Accessibility** - Uses `aria-busy` for loading state
