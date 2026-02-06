/**
 * Load Test Script - Story Generation
 * 
 * Simulates concurrent users requesting stories.
 * Usage: npx tsx scripts/load_test_story.ts [users] [iterations]
 */

const BASE_URL = 'http://127.0.0.1:3001/api/v1/stories'

async function runLoadTest(concurrentUsers: number = 5, iterationsPerUser: number = 2) {
    console.log(`Starting load test: ${concurrentUsers} users, ${iterationsPerUser} iterations each...`)
    const startTime = Date.now()
    const latencies: number[] = []
    let errors = 0
    let success = 0

    const makeRequest = async (userId: number) => {
        for (let i = 0; i < iterationsPerUser; i++) {
            const iterStart = Date.now()
            try {
                // Generate a simple story request
                const res = await fetch(`${BASE_URL}/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer mock_load_test_token',
                        'x-user-id': `load_test_user_${userId}`
                    },
                    body: JSON.stringify({
                        theme: 'space adventure',
                        childName: 'Tester',
                        childAge: 7,
                        duration: 'short'
                    })
                })

                if (res.ok) {
                    success++
                } else {
                    const txt = await res.text()
                    console.error(`Req failed: ${res.status} - ${txt}`)
                    errors++
                }
            } catch (e) {
                console.error('Network error:', e)
                errors++
            }
            latencies.push(Date.now() - iterStart)
        }
    }

    // Launch concurrent users
    const promises = []
    for (let i = 0; i < concurrentUsers; i++) {
        promises.push(makeRequest(i))
    }

    await Promise.all(promises)

    const totalTime = Date.now() - startTime
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length

    // Sort for percentiles
    latencies.sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0

    console.log('\n--- Load Test Results ---')
    console.log(`Total Requests:  ${success + errors}`)
    console.log(`Successful:      ${success}`)
    console.log(`Failed:          ${errors}`)
    console.log(`Total Duration:  ${(totalTime / 1000).toFixed(2)}s`)
    console.log(`Throughput:      ${((success + errors) / (totalTime / 1000)).toFixed(2)} req/s`)
    console.log('\nLatency Metrics (ms):')
    console.log(`Average:         ${avgLatency.toFixed(2)}`)
    console.log(`P50 (Median):    ${p50}`)
    console.log(`P95:             ${p95}`)
    console.log(`P99:             ${p99}`)
    console.log('-------------------------')
}

// Run if called directly
// Default: 5 users, 1 request each (keep it light to avoid massive AI costs)
runLoadTest(5, 1).catch(console.error)
