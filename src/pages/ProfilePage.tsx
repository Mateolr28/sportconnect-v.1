import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Profile, AthleteProfile, RecruiterProfile, Post } from '../types';
import { AthleteProfileView } from '../components/AthleteProfileView';
import { RecruiterProfileView } from '../components/RecruiterProfileView';
import { EditProfileModal } from '../components/EditProfileModal';
import { supabaseService } from '../services/supabaseService';
import { INITIAL_POSTS } from '../lib/mockData';

interface ProfilePageProps {
  viewingUserId?: string | null;
  onContactAthlete: (profile: Profile) => void;
  onNavigateToFeed: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  viewingUserId,
  onContactAthlete,
  onNavigateToFeed,
}) => {
  const { profile: loggedInProfile, athleteProfile: loggedInAthlete, recruiterProfile: loggedInRecruiter } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [targetAthlete, setTargetAthlete] = useState<AthleteProfile | null>(null);
  const [targetRecruiter, setTargetRecruiter] = useState<RecruiterProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnProfile = !viewingUserId || viewingUserId === loggedInProfile?.id;

  useEffect(() => {
    async function loadData() {
      if (isOwnProfile) {
        setTargetProfile(loggedInProfile);
        setTargetAthlete(loggedInAthlete);
        setTargetRecruiter(loggedInRecruiter);

        // Cargar posts del usuario activo
        if (loggedInProfile) {
          const allPosts = await supabaseService.getPosts();
          setUserPosts(allPosts.filter((p) => p.user_id === loggedInProfile.id));
        }
      } else if (viewingUserId) {
        setIsLoading(true);
        try {
          const res = await supabaseService.getProfile(viewingUserId);
          setTargetProfile(res.profile);
          setTargetAthlete(res.athlete || null);
          setTargetRecruiter(res.recruiter || null);

          const allPosts = await supabaseService.getPosts();
          setUserPosts(allPosts.filter((p) => p.user_id === viewingUserId));
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadData();
  }, [viewingUserId, isOwnProfile, loggedInProfile, loggedInAthlete, loggedInRecruiter]);

  if (isLoading) {
    return (
      <div className="p-10 text-center text-slate-400 text-sm">
        Cargando perfil deportivo...
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="p-10 text-center text-slate-500 text-sm">
        No se encontró el perfil solicitado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8">
      {targetProfile.rol === 'deportista' ? (
        <AthleteProfileView
          profile={targetProfile}
          athlete={targetAthlete}
          posts={userPosts.length > 0 ? userPosts : INITIAL_POSTS}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => setIsEditModalOpen(true)}
          onContactAthlete={onContactAthlete}
        />
      ) : (
        <RecruiterProfileView
          profile={targetProfile}
          recruiter={targetRecruiter}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => setIsEditModalOpen(true)}
          onFindAthletes={onNavigateToFeed}
          onViewAthlete={(athId) => {
            // ver atleta desde reclutador
          }}
        />
      )}

      {/* Modal de edición */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
