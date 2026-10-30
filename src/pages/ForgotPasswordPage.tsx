import React, { useEffect, useState } from 'react';
import { Dumbbell, AlertCircle, MailCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  /** El usuario llegó con un enlace de recuperación vencido o ya utilizado */
  linkExpired?: boolean;
}

// Segundos que debe esperar el usuario antes de pedir otro correo (evita abuso y límites de envío)
const RESEND_SECONDS = 60;

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin, linkExpired = false }) => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    linkExpired ? 'El enlace de recuperación venció o ya se usó. Solicita uno nuevo.' : null
  );
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || isLoading) return;

    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Escribe un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    const { error } = await requestPasswordReset(cleanEmail);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    // El mensaje es el mismo exista o no la cuenta, para no revelar qué correos están registrados
    setSent(true);
    setCooldown(RESEND_SECONDS);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1128] via-[#0d1b3e] to-[#040817] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center mx-auto shadow-md">
            {sent ? <MailCheck className="w-7 h-7" /> : <Dumbbell className="w-7 h-7 -rotate-45" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {sent ? 'Revisa tu correo' : 'Recuperar contraseña'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {sent
                ? 'Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva. Revisa también la carpeta de spam.'
                : 'Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || cooldown > 0}
            className="w-full bg-[#1E3A8A] hover:bg-blue-900 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading
              ? 'Enviando...'
              : cooldown > 0
                ? `Reenviar en ${cooldown} s`
                : sent
                  ? 'Reenviar enlace'
                  : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <div className="text-center">
          <button onClick={onBackToLogin} className="text-xs font-semibold text-[#1E3A8A] hover:underline">
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
