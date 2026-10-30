import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Profile } from '../types';
import { supabaseService } from '../services/supabaseService';
import { ProfileAvatar } from './ProfileAvatar';
import { FollowListType } from './FollowStats';

interface FollowListModalProps {
  userId: string;
  type: FollowListType;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ userId, type, onClose, onViewProfile }) => {
  const [people, setPeople] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    supabaseService
      .getFollowList(userId, type)
      .then((list) => {
        if (isMounted) setPeople(list);
      })
      .catch((err) => console.error('Error cargando lista de seguimiento:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [userId, type]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            {type === 'followers' ? 'Seguidores' : 'Seguidos'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {isLoading ? (
            <p className="p-8 text-center text-slate-400 text-sm">Cargando...</p>
          ) : people.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-sm">
              {type === 'followers' ? 'Aún no tiene seguidores.' : 'Aún no sigue a nadie.'}
            </p>
          ) : (
            people.map((person) => (
              <button
                key={person.id}
                onClick={() => {
                  onClose();
                  onViewProfile(person.id);
                }}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
              >
                <ProfileAvatar profile={person} sizeClassName="w-10 h-10" textClassName="text-sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{person.nombre}</p>
                  <p className="text-xs text-slate-500 capitalize">{person.rol}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
