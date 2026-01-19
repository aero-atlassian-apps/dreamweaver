
import { createMiddleware } from 'hono/factory'
import { container, ServiceContainer } from '../di/container'

type Env = {
    Variables: {
        services: ServiceContainer
    }
}

export const diMiddleware = createMiddleware<Env>(async (c, next) => {
    c.set('services', container)
    await next()
})
