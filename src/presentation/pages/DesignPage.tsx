import { Button, Card, Input, Heading, Text } from '../components/ui'

export function DesignPage() {
    return (
        <div className="min-h-screen bg-background-dark text-white font-sans p-6 md:p-10 pb-20">
            {/* Header */}
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                    <img src="/logo-icon-backgroundless.png" alt="DreamWeaver" className="h-12 w-12" />
                    <div>
                        <Heading level={1} variant="serif" glow>Design System</Heading>
                        <Text variant="subtle" size="sm">Lullaby v2 — Living Style Guide</Text>
                    </div>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-primary/50 via-transparent to-transparent"></div>
            </header>

            {/* Color Palette */}
            <section className="mb-12">
                <Heading level={2} variant="sans" className="mb-6">Color Palette</Heading>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <ColorSwatch name="Primary" color="#7a9eff" variable="--color-primary" />
                    <ColorSwatch name="Background" color="#0f1423" variable="--color-background-dark" />
                    <ColorSwatch name="Card" color="#161b2c" variable="--color-card-dark" />
                    <ColorSwatch name="Accent Green" color="#4ade80" variable="--color-accent-green" />
                    <ColorSwatch name="Text Subtle" color="#94a3b8" variable="--color-text-subtle" />
                    <ColorSwatch name="Success" color="#4ade80" variable="--color-success" />
                    <ColorSwatch name="Warning" color="#fcd34d" variable="--color-warning" />
                    <ColorSwatch name="Error" color="#f87171" variable="--color-error" />
                    <ColorSwatch name="Accent Secondary" color="#b8a1ff" variable="--color-accent-secondary" />
                    <ColorSwatch name="Accent Tertiary" color="#ff9ecd" variable="--color-accent-tertiary" />
                </div>
            </section>

            {/* Typography */}
            <section className="mb-12">
                <Heading level={2} variant="sans" className="mb-6">Typography</Heading>
                <Card variant="solid" padding="lg" className="space-y-6">
                    <div>
                        <Text variant="subtle" size="xs" className="uppercase tracking-wider mb-2">Heading (Serif - Newsreader)</Text>
                        <Heading level={1} variant="serif">The Quick Brown Fox</Heading>
                        <Heading level={2} variant="serif">Jumps Over the Lazy Dog</Heading>
                        <Heading level={3} variant="serif">Pack My Box With Five</Heading>
                    </div>
                    <div className="h-px w-full bg-white/5"></div>
                    <div>
                        <Text variant="subtle" size="xs" className="uppercase tracking-wider mb-2">Heading (Sans - Inter)</Text>
                        <Heading level={1} variant="sans">The Quick Brown Fox</Heading>
                        <Heading level={2} variant="sans">Jumps Over the Lazy Dog</Heading>
                    </div>
                    <div className="h-px w-full bg-white/5"></div>
                    <div>
                        <Text variant="subtle" size="xs" className="uppercase tracking-wider mb-2">Body Text (Inter)</Text>
                        <Text size="lg" variant="primary">Large text for emphasis.</Text>
                        <Text size="md" variant="secondary">Default body text for paragraphs and descriptions.</Text>
                        <Text size="sm" variant="subtle">Small text for metadata and captions.</Text>
                        <Text size="xs" variant="muted">Tiny text for fine print.</Text>
                    </div>
                </Card>
            </section>

            {/* Buttons */}
            <section className="mb-12">
                <Heading level={2} variant="sans" className="mb-6">Buttons</Heading>
                <Card variant="solid" padding="lg">
                    <div className="flex flex-wrap gap-4 mb-6">
                        <Button variant="primary">Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="icon"><span className="material-symbols-outlined">settings</span></Button>
                        <Button variant="danger">Danger</Button>
                    </div>
                    <div className="flex flex-wrap gap-4 mb-6">
                        <Button variant="primary" size="sm">Small</Button>
                        <Button variant="primary" size="md">Medium</Button>
                        <Button variant="primary" size="lg">Large</Button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Button variant="primary" isLoading>Loading</Button>
                        <Button variant="primary" disabled>Disabled</Button>
                        <Button variant="primary" rightIcon={<span className="material-symbols-outlined text-lg">arrow_forward</span>}>With Icon</Button>
                    </div>
                </Card>
            </section>

            {/* Inputs */}
            <section className="mb-12">
                <Heading level={2} variant="sans" className="mb-6">Inputs</Heading>
                <Card variant="solid" padding="lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Default" placeholder="Enter text..." />
                        <Input label="With Value" value="sarah@example.com" onChange={() => { }} />
                        <Input
                            label="With Icon"
                            placeholder="Search..."
                            leftIcon={<span className="material-symbols-outlined text-lg">search</span>}
                        />
                        <Input
                            label="With Error"
                            placeholder="Password"
                            type="password"
                            error="Password must be at least 8 characters"
                        />
                    </div>
                </Card>
            </section>

            {/* Cards */}
            <section className="mb-12">
                <Heading level={2} variant="sans" className="mb-6">Cards</Heading>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card variant="solid" padding="md">
                        <Heading level={4} variant="sans" className="mb-2">Solid Card</Heading>
                        <Text variant="subtle" size="sm">Default opaque background.</Text>
                    </Card>
                    <Card variant="glass" padding="md">
                        <Heading level={4} variant="sans" className="mb-2">Glass Card</Heading>
                        <Text variant="subtle" size="sm">Glassmorphism effect.</Text>
                    </Card>
                    <Card variant="interactive" padding="md">
                        <Heading level={4} variant="sans" className="mb-2">Interactive Card</Heading>
                        <Text variant="subtle" size="sm">Hover for lift effect.</Text>
                    </Card>
                </div>
            </section>

            {/* Utilities */}
            <section className="mb-12">
                <Heading level={2} variant="sans" className="mb-6">Utilities & Effects</Heading>
                <Card variant="solid" padding="lg">
                    <div className="flex flex-wrap gap-6 items-center">
                        <div className="space-y-1">
                            <Text variant="subtle" size="xs" className="uppercase">Text Glow</Text>
                            <p className="text-2xl font-bold text-glow">Glowing Text</p>
                        </div>
                        <div className="space-y-1">
                            <Text variant="subtle" size="xs" className="uppercase">Hover Lift</Text>
                            <div className="bg-card-dark p-4 rounded-xl hover-lift cursor-pointer border border-white/10">Hover me</div>
                        </div>
                        <div className="space-y-1">
                            <Text variant="subtle" size="xs" className="uppercase">Click Squish</Text>
                            <button className="bg-primary text-background-dark px-4 py-2 rounded-xl click-squish font-bold">Click me</button>
                        </div>
                        <div className="space-y-1">
                            <Text variant="subtle" size="xs" className="uppercase">Pulse Border</Text>
                            <div className="bg-card-dark p-4 rounded-xl border border-accent-green/40 animate-pulse-border">AI Suggestion</div>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Footer */}
            <footer className="text-center pt-8 border-t border-white/5">
                <Text variant="muted" size="sm">DreamWeaver Design System — Lullaby v2</Text>
            </footer>
        </div>
    )
}

// Helper component for color swatches
function ColorSwatch({ name, color, variable }: { name: string; color: string; variable: string }) {
    return (
        <div className="flex flex-col gap-2">
            <div
                className="h-16 rounded-xl border border-white/10 shadow-lg"
                style={{ backgroundColor: color }}
            ></div>
            <Text variant="primary" size="sm" weight="medium">{name}</Text>
            <Text variant="muted" size="xs" className="font-mono">{variable}</Text>
        </div>
    )
}
