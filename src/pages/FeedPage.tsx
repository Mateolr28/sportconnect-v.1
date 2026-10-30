import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Post, FeedFilters, Profile } from '../types';
import { VideoCard } from '../components/VideoCard';
import { FilterModal } from '../components/FilterModal';
import { CommentsModal } from '../components/CommentsModal';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

interface FeedPageProps {
  onContactAthlete: (athlete: Profile) => void;
  onViewProfile: (userId: string) => void;
  onNavigateToUpload: () => void;
  /** 'following': solo publicaciones de personas seguidas. 'all': todas las publicaciones (descubrir talentos). */
  mode?: 'following' | 'all';
  onNavigateToTalents?: () => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  onContactAthlete,
  onViewProfile,
  onNavigateToUpload,
  mode = 'following',
  onNavigateToTalents,
}) => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FeedFilters>({
    searchQuery: '',
    deporte: 'Todos',
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);

  const fetchPosts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [data, ids] = await Promise.all([
        supabaseService.getPosts(filters),
        profile ? supabaseService.getFollowingIds(profile.id) : Promise.resolve([] as string[]),
      ]);
      setFollowingIds(ids);
      setPosts(
        mode === 'following'
          ? data.filter((post) => ids.includes(post.user_id) || post.user_id === profile?.id)
          : data
      );
    } catch (err) {
      console.error('Error al cargar feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters, mode]);

  const handleToggleFollow = async (userId: string) => {
    if (!profile) return;
    const wasFollowing = followingIds.includes(userId);
    setFollowingIds((current) => (wasFollowing ? current.filter((id) => id !== userId) : [...current, userId]));
    try {
      if (wasFollowing) await supabaseService.unfollowUser(profile.id, userId);
      else await supabaseService.followUser(profile.id, userId);
    } catch (err) {
      console.error('Error al actualizar seguimiento:', err);
      setFollowingIds((current) => (wasFollowing ? [...current, userId] : current.filter((id) => id !== userId)));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, searchQuery }));
  };

  const handleApplyFilters = (newFilters: FeedFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      {/* 1. Barra superior de Búsqueda y Filtros */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar deportistas, deportes, equipos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
          </form>

          {/* Botón Filtros */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Filtros</span>
            {filters.deporte !== 'Todos' && (
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Lista de Publicaciones / Feed */}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {mode === 'following' ? 'Siguiendo' : 'Descubrir talentos'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'following'
              ? 'Publicaciones de las personas que sigues.'
              : 'Todas las publicaciones de la comunidad. Entra a un perfil y sigue para ver sus nuevas publicaciones en Inicio.'}
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-4 bg-slate-200 rounded" />
                    <div className="w-24 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-full aspect-[16/10] bg-slate-200 rounded-xl" />
                <div className="w-full h-8 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            {mode === 'following' ? (
              <>
                <p className="text-slate-600 font-semibold text-base">
                  {followingIds.length === 0
                    ? 'Aún no sigues a nadie'
                    : 'No hay publicaciones para mostrar'}
                </p>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  {followingIds.length === 0
                    ? 'Explora talentos, entra a sus perfiles y sigue a quienes te interesen para ver aquí sus nuevas publicaciones.'
                    : 'Las personas que sigues aún no han publicado, o ningún resultado coincide con los filtros actuales.'}
                </p>
                {onNavigateToTalents && (
                  <button
                    onClick={onNavigateToTalents}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm mt-2"
                  >
                    <span>Descubrir talentos</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-slate-600 font-semibold text-base">
                  No se encontraron publicaciones con los filtros actuales
                </p>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Intenta cambiar los filtros de búsqueda o sé el primero en publicar una foto o video deportivo.
                </p>
                <button
                  onClick={onNavigateToUpload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition-colors shadow-sm mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear publicación</span>
                </button>
              </>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <VideoCard
              key={post.id}
              post={post}
              onOpenComments={(p) => setSelectedPostForComments(p)}
              onContactAthlete={(athleteUser) => onContactAthlete(athleteUser)}
              onViewProfile={onViewProfile}
              isFollowing={followingIds.includes(post.user_id)}
              onToggleFollow={handleToggleFollow}
            />
          ))
        )}
      </div>

      {/* Modal de Filtros */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Modal de Comentarios */}
      <CommentsModal
        post={selectedPostForComments}
        onClose={() => setSelectedPostForComments(null)}
        onCommentAdded={() => fetchPosts(true)}
      />
    </div>
  );
};
