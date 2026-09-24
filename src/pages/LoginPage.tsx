import React, { useState } from 'react';
import { Dumbbell, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister,
  onLoginSuccess,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const { error } = await login(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Credenciales incorrectas.');
    } else {
      onLoginSuccess();
    }
  };

  const fillQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('deporte2026!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1128] via-[#0d1b3e] to-[#040817] flex items-center justify-center p-4">
      {/* Tarjeta Blanca Centrada */}
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
        {/* Logo SportConnect */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center mx-auto shadow-md">
            <Dumbbell className="w-7 h-7 -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SportConnect</h1>
            <p className="text-xs text-slate-500 mt-1">Conectando talento deportivo</p>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Iniciar Sesión en Azul Marino #1E3A8A */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1E3A8A] hover:bg-blue-900 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Separador con "o" */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 absolute">o</span>
        </div>

        {/* Botón Crear cuenta */}
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-xs"
        >
          Crear cuenta
        </button>

        {/* Cuentas de demostración rápida */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 mb-1.5">Accesos de demostración rápida:</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('carlos.martinez@sportconnect.dev')}
              className="text-[11px] text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded-lg transition-colors"
            >
              Carlos (Deportista)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('scout.fcb@sportconnect.dev')}
              className="text-[11px] text-[#10B981] bg-emerald-50 hover:bg-emerald-100 font-semibold px-2.5 py-1 rounded-lg transition-colors"
            >
              Barça (Reclutador)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
