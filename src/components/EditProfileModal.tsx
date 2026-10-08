import React, { useEffect, useState } from 'react';
import { Camera, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { countries, getCities, getCountryByName, getRegions } from '../data/locationOptions';
import { supabaseService } from '../services/supabaseService';

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

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, athleteProfile, recruiterProfile, updateProfile, updateAthleteProfile, updateRecruiterProfile } = useAuth();

  const [nombre, setNombre] = useState(profile?.nombre || '');
  const [primerNombre, setPrimerNombre] = useState(profile?.primer_nombre || '');
  const [segundoNombre, setSegundoNombre] = useState(profile?.segundo_nombre || '');
  const [primerApellido, setPrimerApellido] = useState(profile?.primer_apellido || '');
  const [segundoApellido, setSegundoApellido] = useState(profile?.segundo_apellido || '');
  const [paisNacimiento, setPaisNacimiento] = useState(profile?.pais_nacimiento || '');
  const [regionNacimiento, setRegionNacimiento] = useState(profile?.region_nacimiento || '');
  const [ciudadNacimiento, setCiudadNacimiento] = useState(profile?.ciudad_nacimiento || '');
  const [ubicacion, setUbicacion] = useState(profile?.ubicacion || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');

  // Campos de atleta
  const [disciplina, setDisciplina] = useState(athleteProfile?.disciplina || 'Fútbol');
  const [deportePersonalizado, setDeportePersonalizado] = useState(
    athleteProfile?.disciplina && !commonSports.includes(athleteProfile.disciplina)
      ? athleteProfile.disciplina
      : ''
  );
  const [posicion, setPosicion] = useState(athleteProfile?.posicion || 'Delantero');
  const [edad, setEdad] = useState(athleteProfile?.edad || 22);
  const [partidos, setPartidos] = useState(athleteProfile?.partidos || 120);
  const [goles, setGoles] = useState(athleteProfile?.goles || 85);
  const [asistencias, setAsistencias] = useState(athleteProfile?.asistencias || 42);
  const [genero, setGenero] = useState<'masculino' | 'femenino' | 'no_especificado' | ''>(athleteProfile?.genero || '');
  const [nivelDeportivo, setNivelDeportivo] = useState<'amateur' | 'formativo' | 'semiprofesional' | 'profesional' | 'elite' | ''>(athleteProfile?.nivel_deportivo || '');
  const [disponibilidad, setDisponibilidad] = useState<'disponible' | 'buscando_equipo' | 'pruebas' | 'contrato_vigente' | 'no_disponible' | ''>(athleteProfile?.disponibilidad || '');
  const [clubActual, setClubActual] = useState(athleteProfile?.club_actual || '');
  const [academia, setAcademia] = useState(athleteProfile?.academia || '');
  const [experienciaAnios, setExperienciaAnios] = useState(athleteProfile?.experiencia_anios || 0);
  const [logros, setLogros] = useState<string[]>(athleteProfile?.logros || []);
  const [nuevoLogro, setNuevoLogro] = useState('');

  // Campos de reclutador
  const [nombreClub, setNombreClub] = useState(recruiterProfile?.nombre_club || '');
  const [deportistasContactados, setDeportistasContactados] = useState(recruiterProfile?.deportistas_contactados || 150);
  const [contrataciones, setContrataciones] = useState(recruiterProfile?.contrataciones || 12);
  const [scoutsActivos, setScoutsActivos] = useState(recruiterProfile?.scouts_activos || 8);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const selectedCountry = getCountryByName(paisNacimiento);
  const availableRegions = selectedCountry ? getRegions(selectedCountry.code) : [];
  const selectedRegion = availableRegions.find((region) => region.name === regionNacimiento);
  const availableCities = selectedCountry && selectedRegion
    ? getCities(selectedCountry.code, selectedRegion.code)
    : [];

  useEffect(() => {
    if (!avatarFile) return;
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La imagen no puede superar los 5 MB.');
      return;
    }
    setErrorMessage('');
    setAvatarFile(file);
  };

  const handleAddAchievement = () => {
    const achievement = nuevoLogro.trim();
    if (!achievement || logros.includes(achievement)) return;
    setLogros((current) => [...current, achievement]);
    setNuevoLogro('');
  };

  if (!isOpen || !profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        avatarUrl = await supabaseService.uploadAvatar(avatarFile, profile.id);
      }

      await updateProfile({
        nombre,
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre || undefined,
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido || undefined,
        pais_nacimiento: paisNacimiento,
        region_nacimiento: regionNacimiento,
        ciudad_nacimiento: ciudadNacimiento,
        ubicacion,
        bio,
        avatar_url: avatarUrl,
      });

      if (profile.rol === 'deportista') {
        await updateAthleteProfile({
          disciplina: disciplina === 'Otro' ? deportePersonalizado : disciplina,
          posicion,
          edad: Number(edad),
          partidos: Number(partidos),
          goles: Number(goles),
          asistencias: Number(asistencias),
          genero: genero || undefined,
          nivel_deportivo: nivelDeportivo || undefined,
          disponibilidad: disponibilidad || undefined,
          club_actual: clubActual || undefined,
          academia: academia || undefined,
          experiencia_anios: Number(experienciaAnios),
          logros: logros.filter(Boolean),
        });
      } else {
        await updateRecruiterProfile({
          nombre_club: nombreClub,
          deportistas_contactados: Number(deportistasContactados),
          contrataciones: Number(contrataciones),
          scouts_activos: Number(scoutsActivos),
        });
      }

      onClose();
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      setErrorMessage('No se pudo guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[#0d9488] text-white flex items-center justify-center text-xl font-bold">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Vista previa del perfil" className="w-full h-full object-cover" />
              ) : (
                profile.nombre.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100">
                <Camera className="w-3.5 h-3.5" />
                Cambiar foto
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="hidden" />
              </label>
              <p className="text-[11px] text-slate-500 mt-2">JPG, PNG o WebP · máximo 5 MB</p>
            </div>
          </div>

          {errorMessage && <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{errorMessage}</p>}

          {/* Nombre y Ubicación */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nombre Completo / Institución
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {profile.rol === 'deportista' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" required placeholder="Primer nombre" value={primerNombre} onChange={(e) => setPrimerNombre(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <input type="text" placeholder="Segundo nombre (opcional)" value={segundoNombre} onChange={(e) => setSegundoNombre(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <input type="text" required placeholder="Primer apellido" value={primerApellido} onChange={(e) => setPrimerApellido(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <input type="text" placeholder="Segundo apellido (opcional)" value={segundoApellido} onChange={(e) => setSegundoApellido(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select required value={paisNacimiento} onChange={(e) => { setPaisNacimiento(e.target.value); setRegionNacimiento(''); setCiudadNacimiento(''); }} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <option value="" disabled>Selecciona un país</option>
              {countries.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}
            </select>
            <select required value={regionNacimiento} disabled={!paisNacimiento} onChange={(e) => { setRegionNacimiento(e.target.value); setCiudadNacimiento(''); }} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm disabled:opacity-50">
              <option value="" disabled>Selecciona una región</option>
              {availableRegions.map((region) => <option key={region.code} value={region.name}>{region.name}</option>)}
            </select>
            <select required value={ciudadNacimiento} disabled={!regionNacimiento} onChange={(e) => setCiudadNacimiento(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm disabled:opacity-50">
              <option value="" disabled>Selecciona una ciudad</option>
              {availableCities.map((city) => <option key={city.code} value={city.name}>{city.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Biografía / Descripción
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Opciones Deportista */}
          {profile.rol === 'deportista' && (
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-[#10B981] uppercase tracking-wider">
                Métricas del Deportista
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Deporte</span>
                  <select
                    value={commonSports.includes(disciplina) ? disciplina : 'Otro'}
                    onChange={(e) => setDisciplina(e.target.value === 'Otro' ? 'Otro' : e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    {commonSports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Posición</span>
                  <input
                    type="text"
                    value={posicion}
                    onChange={(e) => setPosicion(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Edad</span>
                  <input
                    type="number"
                    value={edad}
                    onChange={(e) => setEdad(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-2">Logros destacados</label>
                <div className="space-y-2">
                  {logros.map((logro, index) => (
                    <div key={`${logro}-${index}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={logro}
                        onChange={(e) => setLogros((current) => current.map((item, itemIndex) => itemIndex === index ? e.target.value : item))}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                      <button type="button" onClick={() => setLogros((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Eliminar logro">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nuevoLogro}
                      onChange={(e) => setNuevoLogro(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAchievement(); } }}
                      placeholder="Ej. Campeón nacional 2025"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                    <button type="button" onClick={handleAddAchievement} className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100" aria-label="Agregar logro">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={genero} onChange={(e) => setGenero(e.target.value as typeof genero)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <option value="">Género</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="no_especificado">No especificado</option>
                </select>
                <select value={nivelDeportivo} onChange={(e) => setNivelDeportivo(e.target.value as typeof nivelDeportivo)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <option value="">Nivel deportivo</option>
                  <option value="amateur">Amateur</option>
                  <option value="formativo">Formativo</option>
                  <option value="semiprofesional">Semiprofesional</option>
                  <option value="profesional">Profesional</option>
                  <option value="elite">Élite</option>
                </select>
                <select value={disponibilidad} onChange={(e) => setDisponibilidad(e.target.value as typeof disponibilidad)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <option value="">Disponibilidad</option>
                  <option value="disponible">Disponible</option>
                  <option value="buscando_equipo">Buscando equipo</option>
                  <option value="pruebas">Disponible para pruebas</option>
                  <option value="contrato_vigente">Contrato vigente</option>
                  <option value="no_disponible">No disponible</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" placeholder="Club actual" value={clubActual} onChange={(e) => setClubActual(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                <input type="text" placeholder="Academia" value={academia} onChange={(e) => setAcademia(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                <input type="number" min="0" placeholder="Años de experiencia" value={experienciaAnios} onChange={(e) => setExperienciaAnios(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              {(!commonSports.includes(disciplina) || disciplina === 'Otro') && (
                <input
                  type="text"
                  required
                  placeholder="Escribe tu deporte"
                  value={deportePersonalizado}
                  onChange={(e) => setDeportePersonalizado(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Partidos</span>
                  <input
                    type="number"
                    value={partidos}
                    onChange={(e) => setPartidos(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Goles</span>
                  <input
                    type="number"
                    value={goles}
                    onChange={(e) => setGoles(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Asistencias</span>
                  <input
                    type="number"
                    value={asistencias}
                    onChange={(e) => setAsistencias(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Opciones Reclutador */}
          {profile.rol === 'reclutador' && (
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                Métricas del Club / Scouting
              </h3>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Nombre del Club</span>
                <input
                  type="text"
                  value={nombreClub}
                  onChange={(e) => setNombreClub(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Contactados</span>
                  <input
                    type="number"
                    value={deportistasContactados}
                    onChange={(e) => setDeportistasContactados(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Fichajes</span>
                  <input
                    type="number"
                    value={contrataciones}
                    onChange={(e) => setContrataciones(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Scouts</span>
                  <input
                    type="number"
                    value={scoutsActivos}
                    onChange={(e) => setScoutsActivos(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-[#1E3A8A] text-white hover:bg-blue-900 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
