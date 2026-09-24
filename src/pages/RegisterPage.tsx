import React, { useState } from 'react';
import { Dumbbell, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onRegisterSuccess,
}) => {
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<UserRole>('deportista');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const { error } = await register({
      nombre: nombre.trim(),
      email: email.trim(),
      password,
      rol,
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Error al crear la cuenta en Supabase.');
    } else {
      onRegisterSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1128] via-[#0d1b3e] to-[#040817] flex items-center justify-center p-4">
      {/* Tarjeta Blanca Centrada */}
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center mx-auto shadow-md">
            <Dumbbell className="w-7 h-7 -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Crear cuenta</h1>
            <p className="text-xs text-slate-500 mt-1">Únete a la comunidad deportiva</p>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario de Registro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              required
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all"
            />
          </div>

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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all"
            />
          </div>

          {/* Selector visual de Tipo de cuenta */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tipo de cuenta
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Tarjeta Deportista */}
              <button
                type="button"
                onClick={() => setRol('deportista')}
                className={`p-3.5 rounded-2xl border text-center transition-all ${
                  rol === 'deportista'
                    ? 'border-[#10B981] bg-emerald-50/40 text-emerald-950 font-bold ring-1 ring-[#10B981]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`block text-xs font-bold ${rol === 'deportista' ? 'text-[#10B981]' : 'text-slate-900'}`}>
                  Deportista
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Mostrar talento</span>
              </button>

              {/* Tarjeta Reclutador */}
              <button
                type="button"
                onClick={() => setRol('reclutador')}
                className={`p-3.5 rounded-2xl border text-center transition-all ${
                  rol === 'reclutador'
                    ? 'border-[#10B981] bg-emerald-50/40 text-emerald-950 font-bold ring-1 ring-[#10B981]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`block text-xs font-bold ${rol === 'reclutador' ? 'text-[#10B981]' : 'text-slate-900'}`}>
                  Reclutador
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Encontrar talento</span>
              </button>
            </div>
          </div>

          {/* Botón Verde Registrarse #10B981 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#10B981] hover:bg-emerald-600 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        {/* Enlace Iniciar Sesión */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-[#1E3A8A] font-semibold hover:underline"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
