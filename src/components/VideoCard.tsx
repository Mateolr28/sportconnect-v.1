import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { Post, Profile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

interface VideoCardProps {
  post: Post;
  onOpenComments: (post: Post) => void;
  onContactAthlete: (athleteUser: Profile) => void;
  onViewProfile?: (userId: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  post,
  onOpenComments,
  onContactAthlete,
  onViewProfile,
}) => {
  const { profile } = useAuth();
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(Boolean(post.is_liked_by_user));
  const [isSaved, setIsSaved] = useState(Boolean(post.is_saved_by_user));
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = async () => {
    if (!profile) return;
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Actualización optimista en UI
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const result = await supabaseService.toggleLike(post.id, profile.id);
      setLikesCount(result.count);
      setIsLiked(result.liked);
    } catch {
      // Revertir en caso de error
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.titulo || 'Video en SportConnect',
        text: post.descripcion,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      // feedback simple
    }
  };

  const authorName = post.autor?.nombre || 'Carlos Martínez';
  const authorInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const badgeText = `${post.athlete_info?.posicion || 'Delantero'} • ${post.athlete_info?.edad || 22} años`;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* 1. Encabezado de la publicación */}
      <div className="p-4 flex items-center justify-between">
        <div
          onClick={() => onViewProfile && post.user_id && onViewProfile(post.user_id)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Avatar iniciales */}
          <div className="w-11 h-11 rounded-full bg-[#0d9488] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:opacity-90 transition-opacity">
            {authorInitials}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors">
                {authorName}
              </span>
              {/* Etiqueta verde del deporte */}
              <span className="bg-[#10B981] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {post.deporte || 'Fútbol'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {post.autor?.ubicacion || 'Madrid, España'} • Hace 3 horas
            </p>
          </div>
        </div>

        {/* Botón Guardar / Bookmark */}
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="p-2 text-slate-400 hover:text-slate-800 transition-colors"
          title={isSaved ? 'Guardado' : 'Guardar publicación'}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-slate-800 text-slate-800' : ''}`} />
        </button>
      </div>

      {/* 2. Reproductor de Video */}
      <div className="px-4">
        <VideoPlayer
          src={post.video_url}
          poster={post.thumbnail_url}
          duration={post.duracion || '0:45'}
          badgeText={badgeText}
        />
      </div>

      {/* 3. Acciones de interacción: Likes, Comentarios, Compartir */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Botón Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-transform ${
                likeAnimating ? 'scale-125' : 'scale-100'
              } ${isLiked ? 'text-rose-600' : 'text-slate-700 hover:text-rose-600'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Botón Comentarios */}
            <button
              onClick={() => onOpenComments(post)}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-[#1E3A8A] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count || (post.comments?.length ?? 0)}</span>
            </button>
          </div>

          {/* Botón Compartir */}
          <button
            onClick={handleShare}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            title="Compartir"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* 4. Descripción del post */}
        <div className="text-sm text-slate-800 leading-relaxed">
          <span className="font-bold mr-1.5">{authorName}</span>
          <span>{post.descripcion}</span>
        </div>

        {/* Ver comentarios */}
        {(post.comments_count > 0 || (post.comments && post.comments.length > 0)) && (
          <button
            onClick={() => onOpenComments(post)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors block text-left"
          >
            Ver los {post.comments_count || post.comments?.length || 2} comentarios
          </button>
        )}

        {/* 5. Botón principal: Contactar deportista */}
        <div className="pt-1">
          <button
            onClick={() => {
              if (post.autor) {
                onContactAthlete(post.autor);
              }
            }}
            className="w-full bg-[#1E3A8A] hover:bg-blue-900 active:scale-[0.99] text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>Contactar deportista</span>
          </button>
        </div>
      </div>
    </article>
  );
};
