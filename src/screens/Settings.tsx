import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { api } from '@/lib/api';
import soundEngine from '@/utils/soundEngine';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const {
    soundEnabled,
    animationsEnabled,
    dynamicScoring,
    streakEnabled,
    recoveryBonusEnabled,
    showRankingAfterQuestion,
    specialQuestionsEnabled,
    updateSetting,
    saveSettings,
  } = useSettingsStore();

  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const handleToggle = (key: any, currentVal: boolean) => {
    updateSetting(key, !currentVal);
    if (key === 'soundEnabled') {
      soundEngine.setEnabled(!currentVal);
      if (!currentVal) soundEngine.playCorrect();
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await api.backup.export({ includeHistory });
      if (res && res.success) {
        setBackupMessage('Backup exportado com sucesso!');
        setBackupModalOpen(false);
        setTimeout(() => setBackupMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Erro ao exportar backup: ' + err.message);
    }
  };

  const handleImportBackup = async () => {
    try {
      const res = await api.backup.import();
      if (res && res.success) {
        setBackupMessage(`Backup importado com sucesso! (${res.quizCount || 0} quizzes)`);
        setTimeout(() => setBackupMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Erro ao importar backup: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NeoBrutalistButton variant="ghost" size="sm" onClick={() => navigate('/')}>
            ← VOLTAR
          </NeoBrutalistButton>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
            CONFIGURAÇÕES
          </h1>
        </div>
      </div>

      {backupMessage && (
        <div style={{ background: '#00C851', color: 'white', border: '3px solid #0A0A0A', padding: '1rem', fontWeight: 800, marginBottom: '1.5rem', boxShadow: '4px 4px 0 #0A0A0A' }}>
          ✅ {backupMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Audio & Animations */}
        <NeoBrutalistCard style={{ padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', marginTop: 0, marginBottom: '1.25rem' }}>
            🔊 ÁUDIO & VISUAL
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Efeitos Sonoros (Web Audio)</div>
                <div style={{ color: '#555', fontSize: '0.9rem' }}>Sons de contagem, acerto, ultrapassagem e pódio</div>
              </div>
              <NeoBrutalistButton
                variant={soundEnabled ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleToggle('soundEnabled', soundEnabled)}
              >
                {soundEnabled ? 'LIGADO (ON)' : 'DESLIGADO (OFF)'}
              </NeoBrutalistButton>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #DDD', paddingTop: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Animações Físicas do Ranking</div>
                <div style={{ color: '#555', fontSize: '0.9rem' }}>Deslocamento dos cards e ultrapassagens fluidas</div>
              </div>
              <NeoBrutalistButton
                variant={animationsEnabled ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleToggle('animationsEnabled', animationsEnabled)}
              >
                {animationsEnabled ? 'LIGADO (ON)' : 'DESLIGADO (OFF)'}
              </NeoBrutalistButton>
            </div>
          </div>
        </NeoBrutalistCard>

        {/* Dynamic Rules */}
        <NeoBrutalistCard style={{ padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', marginTop: 0, marginBottom: '1.25rem' }}>
            ⚡ REGRAS DE PONTUAÇÃO PADRÃO
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Pontuação Dinâmica por Velocidade</div>
                <div style={{ color: '#555', fontSize: '0.9rem' }}>Bônus proporcional ao tempo em que a questão foi respondida</div>
              </div>
              <NeoBrutalistButton
                variant={dynamicScoring ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleToggle('dynamicScoring', dynamicScoring)}
              >
                {dynamicScoring ? 'ON' : 'OFF'}
              </NeoBrutalistButton>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #DDD', paddingTop: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Streak (Sequência de Acertos)</div>
                <div style={{ color: '#555', fontSize: '0.9rem' }}>Bônus extra por acertos consecutivos (máx +30)</div>
              </div>
              <NeoBrutalistButton
                variant={streakEnabled ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleToggle('streakEnabled', streakEnabled)}
              >
                {streakEnabled ? 'ON' : 'OFF'}
              </NeoBrutalistButton>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #DDD', paddingTop: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Bônus de Recuperação</div>
                <div style={{ color: '#555', fontSize: '0.9rem' }}>Pequeno bônus aos grupos que estão atrás, sem punir a liderança</div>
              </div>
              <NeoBrutalistButton
                variant={recoveryBonusEnabled ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleToggle('recoveryBonusEnabled', recoveryBonusEnabled)}
              >
                {recoveryBonusEnabled ? 'ON' : 'OFF'}
              </NeoBrutalistButton>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #DDD', paddingTop: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Mostrar Ranking após cada Questão</div>
                <div style={{ color: '#555', fontSize: '0.9rem' }}>Exibir animação e ranking antes da próxima questão</div>
              </div>
              <NeoBrutalistButton
                variant={showRankingAfterQuestion ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleToggle('showRankingAfterQuestion', showRankingAfterQuestion)}
              >
                {showRankingAfterQuestion ? 'ON' : 'OFF'}
              </NeoBrutalistButton>
            </div>
          </div>
        </NeoBrutalistCard>

        {/* Backup & Portability */}
        <NeoBrutalistCard style={{ padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', marginTop: 0, marginBottom: '1.25rem' }}>
            💾 BACKUP E PORTABILIDADE (.hootka)
          </h2>
          <p style={{ color: '#555', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
            Leve seus quizzes e histórico para outros computadores escolares mesmo sem internet.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <NeoBrutalistButton variant="primary" size="md" onClick={() => setBackupModalOpen(true)}>
              📤 EXPORTAR BACKUP
            </NeoBrutalistButton>
            <NeoBrutalistButton variant="secondary" size="md" onClick={handleImportBackup}>
              📥 IMPORTAR BACKUP
            </NeoBrutalistButton>
          </div>
        </NeoBrutalistCard>

        {/* About Card */}
        <NeoBrutalistCard style={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, margin: '0 0 0.5rem' }}>
            hootka — v1.0.0
          </h3>
          <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
            Aplicativo desktop 100% offline para game shows educativos em sala de aula com cards físicos. Não requer internet, celulares de alunos ou serviços externos.
          </p>
        </NeoBrutalistCard>
      </div>

      {/* Backup Export Modal */}
      <NeoBrutalistModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        title="EXPORTAR BACKUP"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontWeight: 600 }}>Escolha o conteúdo a ser incluído no arquivo <code>.hootka</code>:</p>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            Incluir histórico de partidas e respostas
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <NeoBrutalistButton variant="ghost" size="md" onClick={() => setBackupModalOpen(false)}>
              CANCELAR
            </NeoBrutalistButton>
            <NeoBrutalistButton variant="primary" size="md" onClick={handleExportBackup}>
              EXPORTAR ARQUIVO .hootka
            </NeoBrutalistButton>
          </div>
        </div>
      </NeoBrutalistModal>
    </div>
  );
};

export default Settings;
