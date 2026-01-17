/**
 * ActiveGoal Entity - Domain entity for tracking bedtime goals
 * 
 * Pure domain logic with no external dependencies.
 */

export type GoalId = string
export type GoalType = 'CHILD_ASLEEP' | 'STORY_COMPLETED' | 'RELAXATION_ACHIEVED'
export type GoalStatus = 'active' | 'achieved' | 'abandoned'

export interface ActiveGoalProps {
    id: GoalId
    type: GoalType
    targetTime: Date
    description: string
    status: GoalStatus
    progress: number // 0-100
    createdAt: Date
    achievedAt?: Date
}

export interface CreateGoalInput {
    type: GoalType
    targetMinutes: number
    description?: string
}

export class ActiveGoal {
    private constructor(
        public readonly id: GoalId,
        public readonly type: GoalType,
        public readonly targetTime: Date,
        public readonly description: string,
        private _status: GoalStatus,
        private _progress: number,
        public readonly createdAt: Date,
        private _achievedAt: Date | undefined,
    ) { }

    get status(): GoalStatus {
        return this._status
    }

    get progress(): number {
        return this._progress
    }

    get achievedAt(): Date | undefined {
        return this._achievedAt
    }

    get isActive(): boolean {
        return this._status === 'active'
    }

    get isAchieved(): boolean {
        return this._status === 'achieved'
    }

    /**
     * Create goal from props (for hydration)
     */
    static create(props: ActiveGoalProps): ActiveGoal {
        return new ActiveGoal(
            props.id,
            props.type,
            props.targetTime,
            props.description,
            props.status,
            props.progress,
            props.createdAt,
            props.achievedAt,
        )
    }

    /**
     * Create a new goal
     */
    static createNew(input: CreateGoalInput): ActiveGoal {
        const now = new Date()
        const targetTime = new Date(now.getTime() + input.targetMinutes * 60 * 1000)

        const description = input.description ?? ActiveGoal.getDefaultDescription(input.type, input.targetMinutes)

        return new ActiveGoal(
            `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            input.type,
            targetTime,
            description,
            'active',
            0,
            now,
            undefined,
        )
    }

    private static getDefaultDescription(type: GoalType, minutes: number): string {
        switch (type) {
            case 'CHILD_ASLEEP':
                return `Child asleep in ${minutes} minutes`
            case 'STORY_COMPLETED':
                return `Complete story within ${minutes} minutes`
            case 'RELAXATION_ACHIEVED':
                return `Achieve relaxation in ${minutes} minutes`
        }
    }

    /**
     * Update progress (0-100)
     */
    updateProgress(progress: number): void {
        if (this._status !== 'active') {
            throw new Error('Cannot update progress on non-active goal')
        }
        this._progress = Math.min(100, Math.max(0, progress))
    }

    /**
     * Mark goal as achieved
     */
    markAchieved(): void {
        if (this._status !== 'active') {
            throw new Error('Cannot achieve non-active goal')
        }
        this._status = 'achieved'
        this._progress = 100
        this._achievedAt = new Date()
    }

    /**
     * Abandon the goal
     */
    abandon(): void {
        if (this._status !== 'active') {
            throw new Error('Cannot abandon non-active goal')
        }
        this._status = 'abandoned'
    }

    /**
     * Get remaining time in minutes
     */
    getRemainingMinutes(): number {
        const now = new Date()
        const remaining = (this.targetTime.getTime() - now.getTime()) / 60000
        return Math.max(0, remaining)
    }

    /**
     * Convert to plain object
     */
    toJSON(): ActiveGoalProps {
        return {
            id: this.id,
            type: this.type,
            targetTime: this.targetTime,
            description: this.description,
            status: this._status,
            progress: this._progress,
            createdAt: this.createdAt,
            achievedAt: this._achievedAt,
        }
    }
}
