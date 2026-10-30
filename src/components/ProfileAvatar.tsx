import React, { useState } from 'react';
import { Profile } from '../types';

interface ProfileAvatarProps {
  profile?: Profile;
  sizeClassName: string;
  textClassName: string;
  backgroundClassName?: string;
  statusClassName?: string;
}

const getInitials = (name?: string) => {
  if (!name) return 'SC';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profile,
  sizeClassName,
  textClassName,
  backgroundClassName = 'bg-[#0d9488]',
  statusClassName,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(profile?.avatar_url && !imageFailed);

  return (
    <div
      className={`${sizeClassName} rounded-full overflow-hidden text-white flex items-center justify-center font-bold ${textClassName} shadow-sm flex-shrink-0 relative ${backgroundClassName}`}
    >
      {showImage ? (
        <img
          src={profile?.avatar_url}
          alt={`Foto de perfil de ${profile?.nombre || 'usuario'}`}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(profile?.nombre)
      )}
      {statusClassName && (
        <span className={`absolute bottom-0 right-0 rounded-full bg-[#10B981] border-2 border-white ${statusClassName}`} />
      )}
    </div>
  );
};
