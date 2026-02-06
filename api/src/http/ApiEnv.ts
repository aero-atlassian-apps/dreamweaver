import type { ServiceContainer } from '../di/container.js'

export type ApiBindings = {
    SUPABASE_URL?: string
    SUPABASE_SERVICE_ROLE_KEY?: string
    SUPABASE_ANON_KEY?: string
}

export type ApiUser = {
    id: string
    email?: string
    role?: string
}

export type ApiVariables = {
    services: ServiceContainer
    requestId: string
    traceId: string
    spanId: string
    user?: ApiUser
    accessToken?: string // Unified auth token for RLS
}

export type ApiEnv = {
    Bindings: ApiBindings
    Variables: ApiVariables
}

export type ApiAuthedVariables = ApiVariables & {
    user: ApiUser
}

export type ApiAuthedEnv = {
    Bindings: ApiBindings
    Variables: ApiAuthedVariables
}
