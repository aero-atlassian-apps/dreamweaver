
import { createMiddleware } from 'hono/factory'
import { container } from '../di/container.js'
import type { ApiEnv } from '../http/ApiEnv.js'

export const diMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
    c.set('services', container)
    await next()
})
