/**
 * DreamCompanion Entity
 * 
 * Collectible companions that children unlock by creating stories.
 * Gamification element to drive retention.
 */

export type CompanionSpecies = 'owl' | 'fox' | 'bear' | 'rabbit' | 'dragon'

export interface DreamCompanionProps {
    id: string
    name: string
    species: CompanionSpecies
    description: string
    unlockThreshold: number // Number of stories required
    isUnlocked: boolean
    unlockedAt?: Date
}

export class DreamCompanion {
    readonly id: string
    readonly name: string
    readonly species: CompanionSpecies
    readonly description: string
    readonly unlockThreshold: number
    private _isUnlocked: boolean
    private _unlockedAt?: Date

    private constructor(props: DreamCompanionProps) {
        this.id = props.id
        this.name = props.name
        this.species = props.species
        this.description = props.description
        this.unlockThreshold = props.unlockThreshold
        this._isUnlocked = props.isUnlocked
        this._unlockedAt = props.unlockedAt
    }

    get isUnlocked(): boolean {
        return this._isUnlocked
    }

    get unlockedAt(): Date | undefined {
        return this._unlockedAt
    }

    static create(props: DreamCompanionProps): DreamCompanion {
        return new DreamCompanion(props)
    }

    /**
     * Check if companion should be unlocked based on story count
     */
    checkUnlock(storyCount: number): boolean {
        if (this._isUnlocked) return false // Already unlocked
        if (storyCount >= this.unlockThreshold) {
            this.unlock()
            return true // Just unlocked
        }
        return false
    }

    private unlock(): void {
        this._isUnlocked = true
        this._unlockedAt = new Date()
    }
}

// Static Definitions of Companions
export const AVAILABLE_COMPANIONS: DreamCompanionProps[] = [
    {
        id: 'c_luna',
        name: 'Luna the Owl',
        species: 'owl',
        description: 'A wise owl who loves stories about the moon.',
        unlockThreshold: 3,
        isUnlocked: false
    },
    {
        id: 'c_rusty',
        name: 'Rusty the Fox',
        species: 'fox',
        description: 'A clever fox who enjoys adventures in the forest.',
        unlockThreshold: 5,
        isUnlocked: false
    },
    {
        id: 'c_barnaby',
        name: 'Barnaby the Bear',
        species: 'bear',
        description: 'A gentle giant who loves cozy bedtime tales.',
        unlockThreshold: 10,
        isUnlocked: false
    }
]
