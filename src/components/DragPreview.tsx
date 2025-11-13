import { motion, AnimatePresence } from 'motion/react';
import { Source } from '../App';
import { createPortal } from 'react-dom';

interface DragPreviewProps {
  isVisible: boolean;
  x: number;
  y: number;
  source?: Source;
  icon?: React.ReactNode;
  color?: string;
}

export function DragPreview({ isVisible, x, y, source, icon, color }: DragPreviewProps) {
  const displayIcon = icon || source?.icon;
  const displayColor = color || source?.color;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.9, scale: 1.1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: 'fixed',
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute inset-0 rounded-3xl blur-xl"
            style={{ backgroundColor: displayColor, opacity: 0.6 }}
          />

          {/* Icon */}
          <div
            className="relative w-20 h-20 rounded-3xl flex items-center justify-center text-4xl border-4 border-white shadow-2xl"
            style={{ backgroundColor: displayColor }}
          >
            <motion.div
              animate={{
                rotate: [0, -5, 5, -5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                ease: 'easeInOut',
              }}
            >
              {displayIcon}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
