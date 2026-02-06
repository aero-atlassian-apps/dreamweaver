import { describe, expect, it } from 'vitest'
import { estimateFinOpsCost } from './GeminiAIGateway.js'

describe('estimateFinOpsCost', () => {
    it('returns null for non-object usage', () => {
        expect(estimateFinOpsCost(null)).toBeNull()
        expect(estimateFinOpsCost(undefined)).toBeNull()
        expect(estimateFinOpsCost('x')).toBeNull()
    })

    it('computes token totals and cost estimate deterministically', () => {
        const usage = {
            promptTokenCount: 1000,
            candidatesTokenCount: 500,
            totalTokenCount: 1500
        }

        const result = estimateFinOpsCost(usage)
        expect(result).not.toBeNull()
        expect(result?.tokensInput).toBe(1000)
        expect(result?.tokensOutput).toBe(500)
        expect(result?.tokensTotal).toBe(1500)

        const expectedCost = (1000 * 0.000000075) + (500 * 0.0000003)
        expect(result?.costEstimateUsd).toBeCloseTo(expectedCost, 12)
    })
})

