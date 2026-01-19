import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByText('Click me')).toBeDefined()
    })

    it('handles onClick events', () => {
        const handleClick = vi.fn()
        render(<Button onClick={handleClick}>Click me</Button>)

        fireEvent.click(screen.getByText('Click me'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('shows loading spinner when isLoading is true', () => {
        render(<Button isLoading>Click me</Button>)
        // Check if button is disabled
        expect(screen.getByRole('button')).toHaveProperty('disabled', true)
        // Check if loading spinner (or some indicator) is present
        // Implementation detail: The spinner is an empty span with 'animate-spin'
        const button = screen.getByRole('button')
        expect(button.innerHTML).toContain('animate-spin')
    })

    it('applies variant classes', () => {
        const { container } = render(<Button variant="danger">Delete</Button>)
        expect(container.firstChild).toHaveProperty('className', expect.stringContaining('bg-red-500/10'))
    })
})
