/**
 * InMemoryEventBus Tests - TDD Phase 1: RED
 * 
 * Write these tests FIRST before implementing InMemoryEventBus.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InMemoryEventBus } from './InMemoryEventBus'
import type { DomainEvent, EventBusPort } from '../../application/ports/EventBusPort'

interface TestEvent extends DomainEvent {
    type: 'TEST_EVENT'
    payload: { message: string }
}

interface AnotherEvent extends DomainEvent {
    type: 'ANOTHER_EVENT'
    payload: { count: number }
}

describe('InMemoryEventBus', () => {
    let eventBus: EventBusPort

    beforeEach(() => {
        eventBus = new InMemoryEventBus()
    })

    describe('publish and subscribe', () => {
        it('should publish and receive events', async () => {
            const handler = vi.fn()
            eventBus.subscribe<TestEvent>('TEST_EVENT', handler)

            const event: TestEvent = {
                type: 'TEST_EVENT',
                payload: { message: 'Hello' },
                timestamp: new Date(),
            }

            await eventBus.publish(event)

            expect(handler).toHaveBeenCalledOnce()
            expect(handler).toHaveBeenCalledWith(event)
        })

        it('should support multiple subscribers for same event type', async () => {
            const handler1 = vi.fn()
            const handler2 = vi.fn()

            eventBus.subscribe<TestEvent>('TEST_EVENT', handler1)
            eventBus.subscribe<TestEvent>('TEST_EVENT', handler2)

            const event: TestEvent = {
                type: 'TEST_EVENT',
                payload: { message: 'Multi' },
                timestamp: new Date(),
            }

            await eventBus.publish(event)

            expect(handler1).toHaveBeenCalledOnce()
            expect(handler2).toHaveBeenCalledOnce()
        })

        it('should only notify subscribers of matching event type', async () => {
            const testHandler = vi.fn()
            const anotherHandler = vi.fn()

            eventBus.subscribe<TestEvent>('TEST_EVENT', testHandler)
            eventBus.subscribe<AnotherEvent>('ANOTHER_EVENT', anotherHandler)

            const event: TestEvent = {
                type: 'TEST_EVENT',
                payload: { message: 'Only me' },
                timestamp: new Date(),
            }

            await eventBus.publish(event)

            expect(testHandler).toHaveBeenCalledOnce()
            expect(anotherHandler).not.toHaveBeenCalled()
        })
    })

    describe('unsubscribe', () => {
        it('should unsubscribe correctly', async () => {
            const handler = vi.fn()
            const unsubscribe = eventBus.subscribe<TestEvent>('TEST_EVENT', handler)

            const event: TestEvent = {
                type: 'TEST_EVENT',
                payload: { message: 'First' },
                timestamp: new Date(),
            }

            await eventBus.publish(event)
            expect(handler).toHaveBeenCalledOnce()

            // Unsubscribe
            unsubscribe()

            const secondEvent: TestEvent = {
                type: 'TEST_EVENT',
                payload: { message: 'Second' },
                timestamp: new Date(),
            }

            await eventBus.publish(secondEvent)

            // Should still be called only once (from first publish)
            expect(handler).toHaveBeenCalledOnce()
        })
    })

    describe('error handling', () => {
        it('should continue publishing to other handlers if one throws', async () => {
            const errorHandler = vi.fn().mockImplementation(() => {
                throw new Error('Handler error')
            })
            const successHandler = vi.fn()

            eventBus.subscribe<TestEvent>('TEST_EVENT', errorHandler)
            eventBus.subscribe<TestEvent>('TEST_EVENT', successHandler)

            const event: TestEvent = {
                type: 'TEST_EVENT',
                payload: { message: 'Test' },
                timestamp: new Date(),
            }

            // Should not throw
            await eventBus.publish(event)

            expect(errorHandler).toHaveBeenCalledOnce()
            expect(successHandler).toHaveBeenCalledOnce()
        })
    })
})
