import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resendConfirmation, continueAsGuest, loading } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowResend(false);

    if (!email.trim()) {
      setErrorMsg('Informe seu e-mail');
      return;
    }

    if (!password) {
      setErrorMsg('Informe sua senha');
      return;
    }

    setSubmitting(true);

    if (isLogin) {
      const res = await signIn(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setErrorMsg(res.error || 'Erro ao entrar');
        if (res.needsConfirmation) {
          setShowResend(true);
        }
      }
    } else {
      const res = await signUp(email, password);
      if (res.success) {
        if (res.needsConfirmation) {
          setSuccessMsg(
            `Cadastro realizado! Um e-mail de confirmação foi enviado para ${email}. Clique no link do e-mail para ativar sua conta e depois faça o login.`
          );
          setIsLogin(true);
          setShowResend(true);
        } else {
          setSuccessMsg('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => navigate('/'), 1200);
        }
      } else {
        setErrorMsg(res.error || 'Erro ao criar conta');
      }
    }

    setSubmitting(false);
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    const res = await resendConfirmation(email);
    setResending(false);
    if (res.success) {
      setSuccessMsg('Link de confirmação reenviado com sucesso! Verifique sua caixa de entrada ou spam.');
      setErrorMsg(null);
    } else {
      setErrorMsg(res.error || 'Não foi possível reenviar o link.');
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Neo-Brutalist shapes */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '200px',
          height: '200px',
          background: '#FFD600',
          border: '4px solid #0A0A0A',
          boxShadow: '6px 6px 0 #0A0A0A',
          transform: 'rotate(15deg)',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '180px',
          height: '180px',
          background: '#1A1AFF',
          border: '4px solid #0A0A0A',
          boxShadow: '6px 6px 0 #0A0A0A',
          transform: 'rotate(-10deg)',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ maxWidth: '440px', width: '100%', zIndex: 1 }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#FFD600',
              border: '4px solid #0A0A0A',
              boxShadow: '6px 6px 0 #0A0A0A',
              padding: '0.4rem 1.5rem',
              transform: 'rotate(-1deg)',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.5rem',
                fontWeight: 900,
                margin: 0,
                letterSpacing: '0.06em',
                lineHeight: 1.1,
              }}
            >
              HOOTKA
            </h1>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#333',
              marginTop: '0.75rem',
            }}
          >
            Área do Professor • Seus quizzes salvos na nuvem
          </p>
        </div>

        {/* Neo-Brutalist Form Card */}
        <NeoBrutalistCard style={{ padding: '2rem' }}>
          {/* Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorMsg(null);
              }}
              style={{
                background: isLogin ? '#FFD600' : '#FFFFFF',
                border: '3px solid #0A0A0A',
                boxShadow: isLogin ? '3px 3px 0 #0A0A0A' : 'none',
                padding: '0.65rem 0',
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              ENTRAR
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrorMsg(null);
              }}
              style={{
                background: !isLogin ? '#FFD600' : '#FFFFFF',
                border: '3px solid #0A0A0A',
                boxShadow: !isLogin ? '3px 3px 0 #0A0A0A' : 'none',
                padding: '0.65rem 0',
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              CRIAR CONTA
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                background: '#FF1744',
                color: '#FFFFFF',
                border: '3px solid #0A0A0A',
                boxShadow: '3px 3px 0 #0A0A0A',
                padding: '0.75rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                marginBottom: '1.25rem',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: '#00C851',
                color: '#FFFFFF',
                border: '3px solid #0A0A0A',
                boxShadow: '3px 3px 0 #0A0A0A',
                padding: '0.75rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              ✅ {successMsg}
            </div>
          )}

          {showResend && (
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  width: '100%',
                  background: '#FFD600',
                  border: '2px solid #0A0A0A',
                  boxShadow: '3px 3px 0 #0A0A0A',
                  padding: '0.6rem 1rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {resending ? 'REENVIANDO LINK...' : '📩 REENVIAR E-MAIL DE CONFIRMAÇÃO'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  marginBottom: '0.4rem',
                  letterSpacing: '0.04em',
                }}
              >
                E-MAIL DO PROFESSOR
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@escola.com"
                className="neo-input"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  marginBottom: '0.4rem',
                  letterSpacing: '0.04em',
                }}
              >
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="neo-input"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              />
              {!isLogin && (
                <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.3rem', display: 'block' }}>
                  (Qualquer senha simples, sem necessidade de maiúsculas ou símbolos)
                </span>
              )}
            </div>

            <NeoBrutalistButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={submitting || loading}
              style={{ marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 900 }}
            >
              {submitting
                ? 'PROCESSANDO...'
                : isLogin
                ? 'ACESSAR CONTA →'
                : 'CADASTRAR E ENTRAR →'}
            </NeoBrutalistButton>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              borderTop: '2px solid #0A0A0A',
              paddingTop: '1rem',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={handleGuest}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#555',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Continuar como convidado (Modo local sem login)
            </button>
          </div>
        </NeoBrutalistCard>
      </motion.div>
    </div>
  );
};

export default Auth;
