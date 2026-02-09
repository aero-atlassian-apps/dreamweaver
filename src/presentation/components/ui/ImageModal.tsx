import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'

interface ImageModalProps {
    src: string | null
    alt?: string
    onClose: () => void
}

export function ImageModal({ src, alt, onClose }: ImageModalProps) {
    return (
        <AnimatePresence>
            {src && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-10"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative max-w-7xl max-h-full w-auto h-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#050510]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={src}
                            alt={alt || "Full screen view"}
                            className="max-h-[85vh] w-auto object-contain"
                        />

                        <div className="absolute top-4 right-4">
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={onClose}
                                className="bg-black/50 hover:bg-black/70 text-white rounded-full border border-white/10"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
