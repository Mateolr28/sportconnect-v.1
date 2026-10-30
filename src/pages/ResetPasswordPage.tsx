import React, { useState } from 'react';
import { Dumbbell, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { evaluatePassword, PASSWORD_MAX_LENGTH } from '../lib/passwordPolicy';

export const ResetPasswordPage: React.FC = () => {
  const { user, profile, updatePassword, cancelRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const evaluation = evaluatePassword(password, {
    email: user?.email,
    names: [profile?.primer_nombre || '', profile?.segundo_nombre || '', profile?.primer_apellido || '', profile?.segundo_apellido || '', profile?.nombre || ''],
  });
  const passwordsMatch = password === confirmPassword;
  const strengthColors = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-600'];
  const inputClass = 'w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation.valid) {
      const missing = evaluation.checks.filter((check) => !check.ok).map((check) => check.label.toLowerCase());
      setErrorMsg(`La contraseña no cumple los requisitos de seguridad: ${missing.join('; ')}.`);
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg('Las contraseñas no coinciden. Escríbelas de nuevo.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      window.alert('Tu contraseña se actualizó correctamente. Cerramos tus otras sesiones abiertas por seguridad.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1128] via-[#0d1b3e] to-[#040817] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center mx-auto shadow-md">
            <Dumbbell className="w-7 h-7 -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Crea tu contraseña nueva</h1>
            <p className="text-xs text-slate-500 mt-1">
              {user?.email ? `Cuenta: ${user.email}` : 'Elige una contraseña segura para tu cuenta.'}
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
            <label htmlFor="reset-password" className="block text-xs font-bold text-slate-700 mb-1.5">Contraseña nueva</label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                maxLength={PASSWORD_MAX_LENGTH}
                placeholder="Crea una contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <div className="mt-2.5 space-y-2" aria-live="polite">
                <div className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        key={level}
                        className={`h-1.5 rounded-full transition-colors ${evaluation.score >= level ? strengthColors[evaluation.score] : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 w-12 text-right">{evaluation.label}</span>
                </div>
                <ul className="grid grid-cols-1 gap-y-1">
                  {evaluation.checks.map((check) => (
                    <li key={check.id} className={`text-[11px] flex items-center gap-1.5 ${check.ok ? 'text-emerald-600' : 'text-slate-500'}`}>
                      <span aria-hidden="true" className="w-3 text-center font-bold">{check.ok ? '✓' : '•'}</span>
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="reset-password-confirm" className="block text-xs font-bold text-slate-700 mb-1.5">Repite la contraseña</label>
            <input
              id="reset-password-confirm"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder="Escríbela otra vez"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
              className={`${inputClass} ${confirmPassword.length > 0 && !passwordsMatch ? 'border-red-300 focus:ring-red-400' : ''}`}
            />
            {confirmPassword.length > 0 && (
              <p className={`mt-1.5 text-[11px] font-medium ${passwordsMatch ? 'text-emerald-600' : 'text-red-600'}`} aria-live="polite">
                {passwordsMatch ? '✓ Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !evaluation.valid || !passwordsMatch || !confirmPassword}
            className="w-full bg-[#10B981] hover:bg-emerald-600 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar contraseña nueva'}
          </button>
        </form>

        <div className="text-center">
          <button onClick={cancelRecovery} className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
