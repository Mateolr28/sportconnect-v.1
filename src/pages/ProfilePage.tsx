import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Profile, AthleteProfile, RecruiterProfile, Post } from '../types';
import { AthleteProfileView } from '../components/AthleteProfileView';
import { RecruiterProfileView } from '../components/RecruiterProfileView';
import { EditProfileModal } from '../components/EditProfileModal';
import { supabaseService } from '../services/supabaseService';
import { FollowListModal } from '../components/FollowListModal';
import { FollowListType } from '../components/FollowStats';

interface ProfilePageProps {
  viewingUserId?: string | null;
  onContactAthlete: (profile: Profile) => void;
  onNavigateToFeed: () => void;
  onViewProfile?: (userId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  viewingUserId,
  onContactAthlete,
  onNavigateToFeed,
  onViewProfile,
}) => {
  const { profile: loggedInProfile, athleteProfile: loggedInAthlete, recruiterProfile: loggedInRecruiter } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [targetAthlete, setTargetAthlete] = useState<AthleteProfile | null>(null);
  const [targetRecruiter, setTargetRecruiter] = useState<RecruiterProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [openList, setOpenList] = useState<FollowListType | null>(null);

  const isOwnProfile = !viewingUserId || viewingUserId === loggedInProfile?.id;
  const targetUserId = isOwnProfile ? loggedInProfile?.id : viewingUserId;

  useEffect(() => {
    if (!targetUserId) return;
    let isMounted = true;
    setOpenList(null);
    Promise.all([
      supabaseService.getFollowCounts(targetUserId),
      loggedInProfile && !isOwnProfile
        ? supabaseService.getFollowingIds(loggedInProfile.id)
        : Promise.resolve([] as string[]),
    ])
      .then(([nextCounts, followingIds]) => {
        if (!isMounted) return;
        setCounts(nextCounts);
        setIsFollowing(followingIds.includes(targetUserId));
      })
      .catch((err) => console.error('Error cargando seguidores:', err));
    return () => {
      isMounted = false;
    };
  }, [targetUserId, loggedInProfile?.id, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!loggedInProfile || !targetUserId || isOwnProfile) return;
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (wasFollowing ? -1 : 1)) }));
    try {
      if (wasFollowing) await supabaseService.unfollowUser(loggedInProfile.id, targetUserId);
      else await supabaseService.followUser(loggedInProfile.id, targetUserId);
    } catch (err) {
      console.error('Error al actualizar seguimiento:', err);
      setIsFollowing(wasFollowing);
      setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (wasFollowing ? 1 : -1)) }));
    }
  };

  const followProps = {
    followers: counts.followers,
    following: counts.following,
    isFollowing,
    onToggleFollow: isOwnProfile ? undefined : handleToggleFollow,
    onOpenFollowList: setOpenList,
  };

  const handleDeletePost = async (post: Post) => {
    if (!isOwnProfile || !loggedInProfile) return;
    await supabaseService.deletePost(post.id, loggedInProfile.id, post.storage_path);
    setUserPosts((currentPosts) => currentPosts.filter((currentPost) => currentPost.id !== post.id));
  };

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
          posts={userPosts}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => setIsEditModalOpen(true)}
          onContactAthlete={onContactAthlete}
          onDeletePost={isOwnProfile ? handleDeletePost : undefined}
          {...followProps}
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
          {...followProps}
        />
      )}

      {openList && targetUserId && (
        <FollowListModal
          userId={targetUserId}
          type={openList}
          onClose={() => setOpenList(null)}
          onViewProfile={(id) => onViewProfile?.(id)}
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
