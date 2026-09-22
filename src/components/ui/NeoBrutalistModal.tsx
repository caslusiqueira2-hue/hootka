import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ModalSize = 'sm' | 'md' | 'lg';

interface NeoBrutalistModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showClose?: boolean;
}

const sizeWidths: Record<ModalSize, string> = {
  sm: '400px',
  md: '580px',
  lg: '760px',
};

const NeoBrutalistModal: React.FC<NeoBrutalistModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(10,10,10,0.65)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: sizeWidths[size],
                maxWidth: '95vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: '#F5F0E8',
                border: '3px solid #0A0A0A',
                boxShadow: '10px 10px 0 #0A0A0A',
                borderRadius: '2px',
                zIndex: 1001,
                position: 'relative',
              }}
            >
              {(title || showClose) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 24px 14px',
                    borderBottom: '3px solid #0A0A0A',
                    backgroundColor: '#FFD600',
                  }}
                >
                  {title && (
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0A0A0A', margin: 0 }}>
                      {title}
                    </h2>
                  )}
                  {showClose && (
                    <motion.button
                      onClick={onClose}
                      whileHover={{ x: 2, y: 2, boxShadow: '2px 2px 0 #0A0A0A' }}
                      whileTap={{ x: 4, y: 4, boxShadow: '0px 0px 0 #0A0A0A' }}
                      transition={{ type: 'tween', duration: 0.05 }}
                      style={{
                        background: '#FFFFFF',
                        border: '3px solid #0A0A0A',
                        boxShadow: '4px 4px 0 #0A0A0A',
                        borderRadius: '2px',
                        width: '36px',
                        height: '36px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 900,
                        fontSize: '18px',
                        color: '#0A0A0A',
                        flexShrink: 0,
                        marginLeft: 'auto',
                      }}
                    >
                      ✕
                    </motion.button>
                  )}
                </div>
              )}
              <div style={{ padding: '24px' }}>{children}</div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NeoBrutalistModal;
