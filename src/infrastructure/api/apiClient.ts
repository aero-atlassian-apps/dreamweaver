/**
 * API Client Utility
 * 
 * Centralized fetch wrapper that prepends the API base URL.
 * [OPS-01] Ensures all API calls respect VITE_API_BASE_URL for split deployments.
 */

const RAW_API_BASE = import.meta.env['VITE_API_BASE_URL'] || ''

function stripTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '')
}

function normalizeApiBase(base: string): string {
    const trimmed = stripTrailingSlash(base.trim())
    if (!trimmed) return ''
    return trimmed
}

function normalizePath(path: string): string {
    const trimmed = path.trim()
    if (!trimmed) return '/'
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function joinUrl(base: string, path: string): string {
    if (!base) return path

    const cleanBase = stripTrailingSlash(base)
    const cleanPath = normalizePath(path)

    if (cleanBase.endsWith('/api/v1') && cleanPath.startsWith('/api/v1/')) {
        return `${cleanBase}${cleanPath.slice('/api/v1'.length)}`
    }

    return `${cleanBase}${cleanPath}`
}

export function getApiOrigin(): string {
    const base = API_BASE
    if (!base) return ''
    try {
        return new URL(base).origin
    } catch {
        return ''
    }
}

export function stripApiVersionFromBase(base: string): string {
    const clean = stripTrailingSlash(base)
    if (!clean) return ''
    if (clean.endsWith('/api/v1')) return clean.slice(0, -'/api/v1'.length)
    return clean
}

const API_BASE = normalizeApiBase(RAW_API_BASE)

/**
 * Fetch wrapper that prepends the configured API base URL.
 * 
 * @param path - The API path (e.g., '/api/v1/stories/generate')
 * @param options - Standard fetch options
 * @returns Promise<Response>
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
    const fullUrl = joinUrl(API_BASE, path)
    return fetch(fullUrl, options)
}

/**
 * Get the API base URL for debugging or dynamic URL construction.
 */
export function getApiBase(): string {
    return API_BASE;
}
