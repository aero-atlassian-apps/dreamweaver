---
name: react-components
description: >
  Use this skill when creating new React components, refactoring existing components,
  implementing design system primitives, optimizing component performance, or ensuring
  accessibility compliance. Covers: file organization, props design, composition patterns,
  memo/callback optimization, ARIA attributes, keyboard navigation, and CSS best practices.
---

# React Component Development

This skill provides guidance for creating high-quality React components following modern best practices, accessibility standards, and performance optimization.

## When to use this skill

- When creating new React components
- When refactoring existing components
- When implementing design system components
- When optimizing component performance
- When ensuring accessibility compliance

## Component Structure

### File Organization

```
src/components/
├── ui/                     # Generic UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.css
│   │   └── index.ts
│   └── Card/
├── features/               # Feature-specific components
│   ├── StoryPlayer/
│   └── VoiceRecorder/
└── layouts/                # Layout components
    ├── AppLayout/
    └── DashboardLayout/
```

### Basic Component Template

```tsx
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

## Best Practices

### 1. Props Design

```tsx
// ✅ Good: Extend native element props
interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  error?: string;
}

// ❌ Bad: Only custom props, no native element support
interface InputProps {
  value: string;
  onChange: (val: string) => void;
}
```

### 2. Composition over Configuration

```tsx
// ✅ Good: Composable components
<Card>
  <Card.Header>
    <Card.Title>Story Details</Card.Title>
  </Card.Header>
  <Card.Content>
    {/* Content here */}
  </Card.Content>
</Card>

// ❌ Bad: Prop-heavy component
<Card
  title="Story Details"
  headerActions={[...]}
  content={...}
  footerContent={...}
/>
```

### 3. State Management

```tsx
// Local state for UI-only concerns
const [isOpen, setIsOpen] = useState(false);

// Derived state instead of duplicated state
const isValid = useMemo(() => email.includes('@'), [email]);

// Custom hooks for complex logic
const { data, isLoading, error } = useStoryData(storyId);
```

### 4. Performance Optimization

```tsx
// Memoize expensive computations
const sortedStories = useMemo(
  () => stories.sort((a, b) => b.date - a.date),
  [stories]
);

// Memoize callbacks passed to children
const handleClick = useCallback(() => {
  onSelect(item.id);
}, [item.id, onSelect]);

// Virtualize long lists
<VirtualList
  items={stories}
  itemHeight={80}
  renderItem={(story) => <StoryCard story={story} />}
/>
```

## Accessibility Requirements

### 1. Semantic HTML

```tsx
// ✅ Use correct HTML elements
<nav aria-label="Main navigation">
  <button onClick={handleMenu}>Menu</button>
</nav>

// ❌ Avoid div soup
<div onClick={handleMenu}>Menu</div>
```

### 2. ARIA Attributes

```tsx
// Modal with proper accessibility
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Action</h2>
  <p id="modal-description">Are you sure?</p>
</div>
```

### 3. Keyboard Navigation

```tsx
// Handle keyboard events
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      onSelect();
      break;
    case 'Escape':
      onClose();
      break;
  }
};
```

### 4. Focus Management

```tsx
// Trap focus in modals
useEffect(() => {
  if (isOpen) {
    const previouslyFocused = document.activeElement;
    modalRef.current?.focus();
    
    return () => {
      (previouslyFocused as HTMLElement)?.focus();
    };
  }
}, [isOpen]);
```

## CSS Best Practices

### 1. Component-Scoped Styles

```css
/* Button.css */
.btn {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

/* Variants */
.btn--primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

/* Sizes */
.btn--sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
.btn--md { padding: 0.5rem 1rem; font-size: 1rem; }
.btn--lg { padding: 0.75rem 1.5rem; font-size: 1.125rem; }
```

### 2. Design Tokens

```css
/* Use CSS custom properties from design system */
.card {
  background: var(--surface-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-4);
}
```

## Testing Patterns

```tsx
import { render, screen, userEvent } from '@testing-library/react';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when loading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```
