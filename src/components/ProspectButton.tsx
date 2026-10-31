import React, { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';

interface ProspectButtonProps {
  athleteId: string;
}

// Botón para que un reclutador marque a un deportista como prospecto. Para otros roles no se muestra.
export const ProspectButton: React.FC<ProspectButtonProps> = ({ athleteId }) => {
  const { profile } = useAuth();
  const [isProspect, setIsProspect] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const isRecruiter = profile?.rol === 'reclutador';

  useEffect(() => {
    if (!profile || !isRecruiter) return;
    let isMounted = true;
    supabaseService
      .getProspectIds(profile.id)
      .then((ids) => isMounted && setIsProspect(athleteId in ids))
      .catch((err) => console.error('Error cargando prospectos:', err));
    return () => {
      isMounted = false;
    };
  }, [profile?.id, isRecruiter, athleteId]);

  if (!profile || !isRecruiter) return null;

  const handleClick = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      if (isProspect) await supabaseService.removeProspect(profile.id, athleteId);
      else await supabaseService.addProspect(profile.id, athleteId);
      setIsProspect(!isProspect);
    } catch (err) {
      console.error('Error actualizando prospecto:', err);
      window.alert('No se pudo actualizar tu lista de prospectos.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 ${
        isProspect
          ? 'bg-amber-400 text-slate-900 hover:bg-amber-300'
          : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
      }`}
    >
      {isProspect ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
      <span>{isProspect ? 'En prospectos' : 'Marcar prospecto'}</span>
    </button>
  );
};
