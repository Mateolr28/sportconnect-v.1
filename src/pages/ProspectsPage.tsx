import React, { useEffect, useState } from 'react';
import { Bookmark, MessageCircle, Trash2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { Profile, Prospect, ProspectStatus } from '../types';

interface ProspectsPageProps {
  onViewProfile: (userId: string) => void;
  onContactAthlete: (profile: Profile) => void;
}

const STATUSES: Array<{ id: ProspectStatus; label: string; badge: string }> = [
  { id: 'interesado', label: 'Interesado', badge: 'bg-blue-50 text-blue-700' },
  { id: 'contactado', label: 'Contactado', badge: 'bg-violet-50 text-violet-700' },
  { id: 'en_pruebas', label: 'En pruebas', badge: 'bg-amber-50 text-amber-700' },
  { id: 'fichado', label: 'Fichado', badge: 'bg-emerald-50 text-emerald-700' },
  { id: 'descartado', label: 'Descartado', badge: 'bg-slate-100 text-slate-600' },
];

export const ProspectsPage: React.FC<ProspectsPageProps> = ({ onViewProfile, onContactAthlete }) => {
  const { profile } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [filter, setFilter] = useState<ProspectStatus | 'todos'>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    let isMounted = true;
    setIsLoading(true);
    supabaseService
      .getProspects(profile.id)
      .then((data) => isMounted && setProspects(data))
      .catch((err) => {
        console.error('Error cargando prospectos:', err);
        if (isMounted) setError('No se pudieron cargar tus prospectos.');
      })
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  if (!profile) return null;

  const patch = (athleteId: string, changes: Partial<Prospect>) =>
    setProspects((prev) => prev.map((p) => (p.athlete_id === athleteId ? { ...p, ...changes } : p)));

  const handleStatus = async (prospect: Prospect, estado: ProspectStatus) => {
    const previous = prospect.estado;
    patch(prospect.athlete_id, { estado });
    try {
      await supabaseService.updateProspect(profile.id, prospect.athlete_id, { estado });
    } catch (err) {
      console.error('Error actualizando estado:', err);
      patch(prospect.athlete_id, { estado: previous });
    }
  };

  const handleNotes = async (prospect: Prospect, notas: string) => {
    const clean = notas.trim() || null;
    if (clean === (prospect.notas || null)) return;
    try {
      await supabaseService.updateProspect(profile.id, prospect.athlete_id, { notas: clean });
      patch(prospect.athlete_id, { notas: clean });
    } catch (err) {
      console.error('Error guardando notas:', err);
      window.alert('No se pudieron guardar las notas.');
    }
  };

  const handleRemove = async (prospect: Prospect) => {
    if (!window.confirm('¿Quitar a este deportista de tus prospectos?')) return;
    try {
      await supabaseService.removeProspect(profile.id, prospect.athlete_id);
      setProspects((prev) => prev.filter((p) => p.athlete_id !== prospect.athlete_id));
    } catch (err) {
      console.error('Error quitando prospecto:', err);
    }
  };

  const visible = filter === 'todos' ? prospects : prospects.filter((p) => p.estado === filter);

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prospectos</h1>
            <p className="text-xs text-slate-500">Deportistas que marcaste y el avance de cada proceso.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{ id: 'todos' as const, label: 'Todos' }, ...STATUSES].map((s) => {
            const count = s.id === 'todos' ? prospects.length : prospects.filter((p) => p.estado === s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  filter === s.id
                    ? 'bg-[#1E3A8A] text-white border-transparent'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400">Cargando prospectos...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
            {prospects.length === 0
              ? 'Aún no tienes prospectos. Abre el perfil de un deportista y pulsa "Marcar prospecto".'
              : 'No hay prospectos en este estado.'}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((prospect) => {
              const athleteProfile = prospect.athlete_profile;
              if (!athleteProfile) return null;
              const status = STATUSES.find((s) => s.id === prospect.estado) || STATUSES[0];
              return (
                <div key={prospect.athlete_id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#0d9488] text-white flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                        {athleteProfile.avatar_url ? (
                          <img src={athleteProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          athleteProfile.nombre.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{athleteProfile.nombre}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {[prospect.athlete?.disciplina, prospect.athlete?.posicion, athleteProfile.ubicacion]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded ${status.badge}`}>{status.label}</span>
                      <select
                        value={prospect.estado}
                        onChange={(e) => handleStatus(prospect, e.target.value as ProspectStatus)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                        aria-label="Cambiar estado"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    defaultValue={prospect.notas || ''}
                    onBlur={(e) => handleNotes(prospect, e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Notas privadas sobre este deportista..."
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewProfile(prospect.athlete_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <User className="w-3.5 h-3.5" />
                      Ver perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => onContactAthlete(athleteProfile)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#10B981] rounded-lg hover:bg-emerald-600"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Contactar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(prospect)}
                      className="ml-auto p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Quitar de prospectos"
                      aria-label="Quitar de prospectos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
