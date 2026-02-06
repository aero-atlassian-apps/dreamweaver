import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ProfilePage } from './ProfilePage'
import { BrowserRouter } from 'react-router-dom'

// Mock apiClient
const mockApiFetch = vi.fn()
vi.mock('../../infrastructure/api/apiClient', () => ({
    apiFetch: (...args: any[]) => mockApiFetch(...args)
}))

// Mock Auth
const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        useAuth: () => mockUseAuth()
    }
})

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue({
            user: { email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
            session: { access_token: 'fake_token' },
            signOut: vi.fn()
        })
    })

    it('renders and fetches preferences', async () => {
        mockApiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: { mic_enabled: true, reminders_enabled: false, weekly_digest_enabled: true }
            })
        })

        render(
            <BrowserRouter>
                <ProfilePage />
            </BrowserRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument()
        })

        // Initial fetch
        expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/user/preferences', expect.objectContaining({
            headers: { Authorization: 'Bearer fake_token' }
        }))
    })
})
