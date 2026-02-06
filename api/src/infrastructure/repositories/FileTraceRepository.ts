import { TraceRepositoryPort } from '../../application/ports/TraceRepositoryPort.js'
import { ReasoningTrace } from '../../domain/agents/BedtimeConductorAgent.js'
import * as fs from 'fs/promises'
import * as path from 'path'

export class FileTraceRepository implements TraceRepositoryPort {
    private logPath: string

    constructor(baseDir: string = 'logs') {
        const root = process.cwd() // Should be api root
        this.logPath = path.join(root, baseDir, 'traces.jsonl')
    }

    async save(trace: ReasoningTrace): Promise<void> {
        try {
            await fs.mkdir(path.dirname(this.logPath), { recursive: true })
            const line = JSON.stringify(trace) + '\n'
            await fs.appendFile(this.logPath, line, 'utf-8')
        } catch (error) {
            console.error('Failed to save reasoning trace', error)
        }
    }
}
