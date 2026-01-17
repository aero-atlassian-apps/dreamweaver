import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Button } from './Button'

describe('Button', () => {
    it('renders with correct text', () => {
        render(
            <BrowserRouter>
                <Button>Click me</Button>
            </BrowserRouter>
        )
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('is disabled when isLoading', () => {
        render(
            <BrowserRouter>
                <Button isLoading>Loading</Button>
            </BrowserRouter>
        )
        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies primary variant by default', () => {
        render(
            <BrowserRouter>
                <Button>Primary</Button>
            </BrowserRouter>
        )
        const button = screen.getByRole('button')
        expect(button.className).toContain('bg-primary')
    })
})
