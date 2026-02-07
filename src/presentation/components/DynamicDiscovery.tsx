
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

const cards = [
    { id: 1, title: 'Vision', image: '/illustrations/vision_sketchnote.png', description: 'Transforming bedtime into connection.', link: '/docs/vision' },
    { id: 2, title: 'The Problem', image: '/illustrations/problem_sketchnote.png', description: 'Solving parental exhaustion and guilt.', link: '/docs/problem' },
    { id: 3, title: 'Target Users', image: '/illustrations/users_sketchnote.png', description: 'Designed for modern families.', link: '/docs/users' },
    { id: 4, title: 'Features', image: '/illustrations/features_sketchnote.png', description: 'Agentic storytelling engine.', link: '/docs/features' },
    { id: 5, title: 'Agentic AI', image: '/illustrations/agentic_sketchnote.png', description: 'Goal-directed behavior, not just prompts.', link: '/docs/agentic' },
    { id: 6, title: 'Gemini 3', image: '/illustrations/gemini_sketchnote.png', description: 'Powered by next-gen multimodal AI.', link: '/docs/gemini' },
    { id: 7, title: 'Architecture', image: '/illustrations/arch_sketchnote.png', description: 'Scalable, modern tech stack.', link: '/docs/architecture' },
    { id: 8, title: 'Event Flow', image: '/illustrations/diagrams_sketchnote.png', description: 'Real-time agent communication.', link: '/docs/diagrams' },
];

export const DynamicDiscovery = () => {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    const x = useTransform(scrollYProgress, [0, 1], ["1%", "-95%"]);

    return (
        <section ref={targetRef} className="relative h-[300vh] bg-background-dark">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                <motion.div style={{ x }} className="flex gap-8 px-12">
                    {cards.map((card) => (
                        <Card key={card.id} card={card} />
                    ))}
                </motion.div>
            </div>

            <div className="absolute top-10 left-10 z-10">
                <h2 className="text-4xl font-serif text-white mb-2">Discover DreamWeaver</h2>
                <p className="text-text-subtle">Scroll to explore the architecture behind the magic.</p>
            </div>
        </section>
    );
};

const Card = ({ card }: { card: typeof cards[0] }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="group relative h-[450px] w-[350px] overflow-hidden rounded-2xl bg-card-dark border border-white/5 transition-transform duration-300 hover:scale-105 hover:border-accent-primary/50 shadow-2xl">
            {!imgError ? (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${card.image})` }}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center">
                    <span className="text-6xl opacity-20">🎨</span>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80" />

            <div className="absolute bottom-0 left-0 p-6">
                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-accent-primary transition-colors">{card.title}</h3>
                <p className="text-sm text-text-secondary">{card.description}</p>
            </div>

            {/* Hidden img to trigger onError */}
            {!imgError && (
                <img
                    src={card.image}
                    alt={card.title}
                    className="hidden"
                    onError={() => setImgError(true)}
                />
            )}
        </div>
    );
};
