import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, athleteProfile, recruiterProfile, updateProfile, updateAthleteProfile, updateRecruiterProfile } = useAuth();

  const [nombre, setNombre] = useState(profile?.nombre || '');
  const [ubicacion, setUbicacion] = useState(profile?.ubicacion || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // Campos de atleta
  const [disciplina, setDisciplina] = useState(athleteProfile?.disciplina || 'Fútbol');
  const [posicion, setPosicion] = useState(athleteProfile?.posicion || 'Delantero');
  const [edad, setEdad] = useState(athleteProfile?.edad || 22);
  const [partidos, setPartidos] = useState(athleteProfile?.partidos || 120);
  const [goles, setGoles] = useState(athleteProfile?.goles || 85);
  const [asistencias, setAsistencias] = useState(athleteProfile?.asistencias || 42);

  // Campos de reclutador
  const [nombreClub, setNombreClub] = useState(recruiterProfile?.nombre_club || 'FC Barcelona Academy');
  const [deportistasContactados, setDeportistasContactados] = useState(recruiterProfile?.deportistas_contactados || 150);
  const [contrataciones, setContrataciones] = useState(recruiterProfile?.contrataciones || 12);
  const [scoutsActivos, setScoutsActivos] = useState(recruiterProfile?.scouts_activos || 8);

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        nombre,
        ubicacion,
        bio,
      });

      if (profile.rol === 'deportista') {
        await updateAthleteProfile({
          disciplina,
          posicion,
          edad: Number(edad),
          partidos: Number(partidos),
          goles: Number(goles),
          asistencias: Number(asistencias),
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
                  <input
                    type="text"
                    value={disciplina}
                    onChange={(e) => setDisciplina(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
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
