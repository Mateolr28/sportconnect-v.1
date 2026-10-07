import React, { useState } from 'react';
import { Dumbbell, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { countries, getCities, getCountryByName, getRegions } from '../data/locationOptions';

const commonSports = [
  'Fútbol',
  'Baloncesto',
  'Tenis',
  'Atletismo',
  'Natación',
  'Ciclismo',
  'Voleibol',
  'Béisbol',
  'Boxeo',
  'Gimnasia',
  'Rugby',
  'Hockey',
];

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onRegisterSuccess,
}) => {
  const { register } = useAuth();
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [paisNacimiento, setPaisNacimiento] = useState('');
  const [regionNacimiento, setRegionNacimiento] = useState('');
  const [ciudadNacimiento, setCiudadNacimiento] = useState('');
  const [edad, setEdad] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [deportePersonalizado, setDeportePersonalizado] = useState('');
  const [posicion, setPosicion] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<UserRole>('deportista');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const selectedCountry = getCountryByName(paisNacimiento);
  const availableRegions = selectedCountry ? getRegions(selectedCountry.code) : [];
  const selectedRegion = availableRegions.find((region) => region.name === regionNacimiento);
  const availableCities = selectedCountry && selectedRegion
    ? getCities(selectedCountry.code, selectedRegion.code)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !primerNombre.trim() ||
      !primerApellido.trim() ||
      !paisNacimiento.trim() ||
      !regionNacimiento.trim() ||
      !ciudadNacimiento.trim() ||
      !email.trim() ||
      !password ||
      (rol === 'deportista' && (!edad || (!disciplina.trim() && !deportePersonalizado.trim()) || !posicion.trim()))
    ) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const edadNumero = Number(edad);
    if (rol === 'deportista' && (!Number.isInteger(edadNumero) || edadNumero < 10 || edadNumero > 50)) {
      setErrorMsg('La edad debe estar entre 10 y 50 años.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const { error } = await register({
      primer_nombre: primerNombre.trim(),
      segundo_nombre: segundoNombre.trim() || undefined,
      primer_apellido: primerApellido.trim(),
      segundo_apellido: segundoApellido.trim() || undefined,
      email: email.trim(),
      password,
      rol,
      pais_nacimiento: paisNacimiento.trim(),
      region_nacimiento: regionNacimiento.trim(),
      ciudad_nacimiento: ciudadNacimiento.trim(),
      edad: rol === 'deportista' ? edadNumero : undefined,
      disciplina: (disciplina === 'Otro' ? deportePersonalizado : disciplina).trim(),
      posicion: posicion.trim(),
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
      <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl space-y-6">
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
            <p className="text-xs font-bold text-slate-700 mb-2">Datos personales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" required placeholder="Primer nombre" value={primerNombre} onChange={(e) => setPrimerNombre(e.target.value)} className="form-input" />
              <input type="text" placeholder="Segundo nombre (opcional)" value={segundoNombre} onChange={(e) => setSegundoNombre(e.target.value)} className="form-input" />
              <input type="text" required placeholder="Primer apellido" value={primerApellido} onChange={(e) => setPrimerApellido(e.target.value)} className="form-input" />
              <input type="text" placeholder="Segundo apellido (opcional)" value={segundoApellido} onChange={(e) => setSegundoApellido(e.target.value)} className="form-input" />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">Lugar de nacimiento</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select required value={paisNacimiento} onChange={(e) => { setPaisNacimiento(e.target.value); setRegionNacimiento(''); setCiudadNacimiento(''); }} className="form-input">
                <option value="" disabled>Selecciona un país</option>
                {countries.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}
              </select>
              <select required value={regionNacimiento} disabled={!paisNacimiento} onChange={(e) => { setRegionNacimiento(e.target.value); setCiudadNacimiento(''); }} className="form-input disabled:opacity-50">
                <option value="" disabled>Selecciona una región</option>
                {availableRegions.map((region) => <option key={region.code} value={region.name}>{region.name}</option>)}
              </select>
              <select required value={ciudadNacimiento} disabled={!regionNacimiento} onChange={(e) => setCiudadNacimiento(e.target.value)} className="form-input disabled:opacity-50">
                <option value="" disabled>Selecciona una ciudad</option>
                {availableCities.map((city) => <option key={city.code} value={city.name}>{city.name}</option>)}
              </select>
            </div>
          </div>

          {rol === 'deportista' && (
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Perfil deportivo</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="number" required min="10" max="50" placeholder="Edad" value={edad} onChange={(e) => setEdad(e.target.value)} className="form-input" />
                <select required value={disciplina} onChange={(e) => setDisciplina(e.target.value)} className="form-input">
                  <option value="" disabled>Selecciona un deporte</option>
                  {commonSports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
                  <option value="Otro">Otro</option>
                </select>
                <input type="text" required placeholder="Posición" value={posicion} onChange={(e) => setPosicion(e.target.value)} className="form-input" />
              </div>
              {disciplina === 'Otro' && (
                <input type="text" required placeholder="Escribe tu deporte" value={deportePersonalizado} onChange={(e) => setDeportePersonalizado(e.target.value)} className="form-input mt-3" />
              )}
            </div>
          )}

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
