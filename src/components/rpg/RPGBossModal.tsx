import React from 'react';
import { motion } from 'framer-motion';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';

interface RPGBossModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const RPGBossModal: React.FC<RPGBossModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  return (
    <NeoBrutalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="🐉 DESAFIO DO CHEFÃO DO REINO!"
      size="lg"
    >
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontSize: '5rem', marginBottom: '1rem' }}
        >
          🐉
        </motion.div>

        <div
          style={{
            display: 'inline-block',
            background: '#FF3B00',
            color: '#FFFFFF',
            border: '3px solid #0A0A0A',
            boxShadow: '4px 4px 0 #0A0A0A',
            padding: '0.4rem 1.5rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '1.4rem',
            letterSpacing: '0.04em',
            marginBottom: '1rem',
          }}
        >
          O GUARDIÃO DA FLORESTA DESPERTOU!
        </div>

        <p
          style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: '#111',
            maxWidth: '560px',
            margin: '0 auto 1.5rem',
            lineHeight: 1.5,
          }}
        >
          Uma das equipes alcançou a lendária <strong>Casa 24</strong>! A próxima questão é um{' '}
          <span style={{ color: '#E74C3C', fontWeight: 900 }}>DESAFIO DE ELITE VALENDO 300 XP</span>!
          Quem responder corretamente conquistará os atalhos sagrados rumo ao Castelo do Conhecimento!
        </p>

        <div
          style={{
            background: '#FFF3CD',
            border: '2px solid #0A0A0A',
            padding: '0.75rem 1.25rem',
            display: 'inline-flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '1rem',
          }}
        >
          <span>🏆 RECOMPENSA: +300 XP</span>
          <span>⚡ AVANÇO: +4 CASAS</span>
          <span>🛡️ GLÓRIA NO REINO</span>
        </div>

        <div>
          <NeoBrutalistButton
            variant="primary"
            size="xl"
            onClick={onProceed}
            style={{
              fontSize: '1.25rem',
              padding: '1rem 3rem',
              background: '#FF3B00',
              color: '#FFFFFF',
            }}
          >
            ⚔️ ENFRENTAR O DESAFIO DO CHEFÃO!
          </NeoBrutalistButton>
        </div>
      </div>
    </NeoBrutalistModal>
  );
};

export default RPGBossModal;
