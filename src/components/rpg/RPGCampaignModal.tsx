import React, { useState, useEffect } from 'react';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';
import type { RPGCampaignProfile } from '@/types';

interface RPGCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAMPAIGN_STORAGE_KEY = 'hootka_rpg_campaign_profiles';

export const RPGCampaignModal: React.FC<RPGCampaignModalProps> = ({ isOpen, onClose }) => {
  const [profiles, setProfiles] = useState<RPGCampaignProfile[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
        if (raw) {
          const dict: Record<string, RPGCampaignProfile> = JSON.parse(raw);
          const list = Object.values(dict).sort((a, b) => b.totalXp - a.totalXp);
          setProfiles(list);
        } else {
          setProfiles([]);
        }
      } catch {
        setProfiles([]);
      }
    }
  }, [isOpen]);

  const handleClearHistory = () => {
    if (window.confirm('Deseja realmente zerar o histórico de campanhas do RPG?')) {
      localStorage.removeItem(CAMPAIGN_STORAGE_KEY);
      setProfiles([]);
    }
  };

  return (
    <NeoBrutalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="📜 CRÔNICAS E PROGRESSÃO DO REINO"
      size="lg"
    >
      <div style={{ padding: '0.5rem 0' }}>
        <p style={{ fontWeight: 700, color: '#444', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Registro contínuo de evolução das turmas e equipes ao longo de todas as partidas de RPG. O XP acumulado desbloqueia títulos honorários e níveis lendários!
        </p>

        {profiles.length === 0 ? (
          <NeoBrutalistCard style={{ padding: '2rem', textAlign: 'center', background: '#F5F0E8' }}>
            <span style={{ fontSize: '3rem' }}>🛡️</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, margin: '0.5rem 0' }}>
              NENHUMA CAMPANHA REGISTRADA AINDA
            </h3>
            <p style={{ fontWeight: 600, color: '#666' }}>
              Complete partidas no modo RPG para registrar as lendas e títulos da sua sala de aula!
            </p>
          </NeoBrutalistCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {profiles.map((profile, idx) => (
              <NeoBrutalistCard
                key={profile.id || profile.name}
                style={{
                  padding: '1.25rem',
                  borderLeft: `10px solid ${profile.color || '#FFD600'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: profile.color || '#FFD600',
                      border: '3px solid #0A0A0A',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                    }}
                  >
                    {profile.emoji || '🦁'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h4
                        style={{
                          margin: 0,
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 900,
                          fontSize: '1.2rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {profile.name}
                      </h4>
                      <NeoBrutalistBadge variant="primary">
                        {idx + 1}º NO REINO
                      </NeoBrutalistBadge>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 900,
                          color: '#1A1AFF',
                          fontSize: '0.85rem',
                        }}
                      >
                        👑 {profile.title} (Nível {profile.level})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    background: '#FAF6EE',
                    padding: '0.5rem 1rem',
                    border: '2px solid #0A0A0A',
                    boxShadow: '3px 3px 0 #0A0A0A',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#666' }}>XP TOTAL</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.1rem', color: '#00C851' }}>
                      {profile.totalXp}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#666' }}>VITÓRIAS</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.1rem', color: '#FFD600' }}>
                      {profile.victories}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#666' }}>ACERTOS</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.1rem', color: '#1A1AFF' }}>
                      {profile.correctAnswers}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#666' }}>ULTRAPASSAGENS</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.1rem', color: '#FF3B00' }}>
                      {profile.overtakes || 0}
                    </div>
                  </div>
                </div>
              </NeoBrutalistCard>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          {profiles.length > 0 && (
            <button
              onClick={handleClearHistory}
              style={{
                background: '#FFEAEA',
                border: '2px solid #FF1744',
                color: '#FF1744',
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '0.8rem',
                padding: '0.4rem 0.8rem',
                cursor: 'pointer',
              }}
            >
              🗑️ ZERAR CRÔNICAS
            </button>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <NeoBrutalistButton variant="primary" size="md" onClick={onClose}>
              FECHAR ✕
            </NeoBrutalistButton>
          </div>
        </div>
      </div>
    </NeoBrutalistModal>
  );
};

export default RPGCampaignModal;
