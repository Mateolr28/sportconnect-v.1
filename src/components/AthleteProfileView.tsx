import React, { useState } from 'react';
import { MapPin, Edit3, Trophy, Play, MessageCircle, Trash2 } from 'lucide-react';
import { Profile, AthleteProfile, Post } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { FollowButton } from './FollowButton';
import { FollowStats, FollowListType } from './FollowStats';

interface AthleteProfileViewProps {
  profile: Profile;
  athlete: AthleteProfile | null;
  posts: Post[];
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onContactAthlete?: (profile: Profile) => void;
  onDeletePost?: (post: Post) => Promise<void>;
  followers?: number;
  following?: number;
  isFollowing?: boolean;
  onToggleFollow?: () => Promise<void> | void;
  onOpenFollowList?: (type: FollowListType) => void;
}

export const AthleteProfileView: React.FC<AthleteProfileViewProps> = ({
  profile,
  athlete,
  posts,
  isOwnProfile,
  onEditProfile,
  onContactAthlete,
  onDeletePost,
  followers = 0,
  following = 0,
  isFollowing = false,
  onToggleFollow,
  onOpenFollowList,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<Post | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const initials = profile.nombre
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const achievements = athlete?.logros || [];
  const sport = athlete?.disciplina?.toLowerCase() || '';
  const statLabels = sport.includes('baloncesto')
    ? ['Partidos', 'Puntos', 'Asistencias']
    : sport.includes('tenis')
      ? ['Partidos', 'Victorias', 'Asistencias']
      : sport.includes('atletismo') || sport.includes('natación') || sport.includes('ciclismo')
        ? ['Competencias', 'Medallas', 'Podios']
        : sport.includes('voleibol')
          ? ['Partidos', 'Puntos', 'Bloqueos']
          : ['Partidos', 'Goles', 'Asistencias'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header Hero Banner */}
      <div className="bg-[#0b1426] text-white rounded-2xl overflow-hidden shadow-sm relative">
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-start gap-6">
          {/* Avatar cuadrado verde esmeralda */}
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[#0d9488] text-white flex items-center justify-center font-bold text-3xl shadow-lg flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`Foto de ${profile.nombre}`} className="w-full h-full object-cover rounded-2xl" />
            ) : initials}
          </div>

          {/* Información del deportista */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {profile.nombre}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {profile.ubicacion || 'Madrid, España'}
                  </span>
                  {(profile.ciudad_nacimiento || profile.region_nacimiento || profile.pais_nacimiento) && (
                    <span>
                      Nacimiento: {[profile.ciudad_nacimiento, profile.region_nacimiento, profile.pais_nacimiento].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <FollowStats followers={followers} following={following} onOpenList={onOpenFollowList} />
                </div>
              </div>

              {/* Botón de acción: Editar o Contactar */}
              <div className="flex items-center gap-3">
                {isOwnProfile ? (
                  <button
                    onClick={onEditProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar perfil</span>
                  </button>
                ) : (
                  <>
                  {onToggleFollow && (
                    <FollowButton variant="dark" isFollowing={isFollowing} onToggle={onToggleFollow} />
                  )}
                  {onContactAthlete && (
                    <button
                      onClick={() => onContactAthlete(profile)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Contactar deportista</span>
                    </button>
                  )}
                  </>
                )}
              </div>
            </div>

            {/* Badges deportivas */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="bg-[#10B981] text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                {athlete?.disciplina || 'Deporte no especificado'}
              </span>
              <span className="bg-white/10 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                {athlete?.posicion || 'Posición no especificada'}
              </span>
              {athlete?.categoria && (
                <span className="bg-white/10 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                  {athlete.categoria}
                </span>
              )}
              {athlete?.modalidad_competencia && (
                <span className="bg-white/10 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                  {athlete.modalidad_competencia}
                </span>
              )}
              <span className="bg-white/10 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                {athlete?.edad ? `${athlete.edad} años` : 'Edad no especificada'}
              </span>
            </div>

            {/* Biografía */}
            {profile.bio && (
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl pt-1">
                {profile.bio}
              </p>
            )}

            {/* Métricas destacadas en bloque oscuro */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {athlete?.partidos ?? 0}+
                </span>
                <span className="text-xs text-slate-400 font-medium">{statLabels[0]}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {athlete?.goles ?? 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">{statLabels[1]}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {athlete?.asistencias ?? 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">{statLabels[2]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sección: Logros destacados */}
      {achievements.length > 0 && <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#10B981]" />
          <h2 className="text-lg font-bold text-slate-900">Logros destacados</h2>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.map((logro, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:border-[#10B981] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-800">{logro}</span>
            </div>
            ))}
          </div>
      </section>}

      {/* 3. Sección: Galería de videos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Galería de videos</h2>
          <span className="text-xs text-slate-500 font-medium">
            {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'}
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            Aún no has publicado ningún contenido. ¡Comparte tus mejores jugadas en la pestaña "Publicar"!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all group"
              >
                {/* Thumbnail con botón Play y duración */}
                <div
                  onClick={() => setSelectedVideo(post)}
                  className="relative aspect-[16/10] bg-slate-900 overflow-hidden"
                >
                  <img
                    src={post.media_type === 'image'
                      ? post.video_url
                      : post.thumbnail_url || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop&q=80'}
                    alt={post.titulo || (post.media_type === 'image' ? 'Foto' : 'Video')}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  {post.media_type !== 'image' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="w-11 h-11 rounded-full bg-white/95 text-[#1E3A8A] flex items-center justify-center shadow pl-0.5">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  )}
                  {post.media_type !== 'image' && (
                    <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[11px] font-mono px-2 py-0.5 rounded">
                      {post.duracion || '0:45'}
                    </span>
                  )}
                </div>

                {/* Título y descripción */}
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {post.titulo || post.descripcion}
                    </h3>
                    {isOwnProfile && onDeletePost && (
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (!window.confirm('¿Quieres eliminar este video? Esta acción no se puede deshacer.')) return;

                          setDeletingPostId(post.id);
                          try {
                            await onDeletePost(post);
                          } catch (error) {
                            window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el video.');
                          } finally {
                            setDeletingPostId(null);
                          }
                        }}
                        disabled={deletingPostId === post.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar mi video"
                        aria-label="Eliminar mi video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span className="text-[#10B981] font-semibold">{post.deporte}</span>
                    <span>{post.likes_count} likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal para ver el contenido al hacer clic */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{selectedVideo.titulo || 'Reproductor de video'}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {selectedVideo.media_type === 'image' ? (
                <img
                  src={selectedVideo.video_url}
                  alt={selectedVideo.titulo || 'Foto deportiva'}
                  className="w-full max-h-[60vh] object-contain rounded-xl bg-slate-100"
                />
              ) : (
                <VideoPlayer
                  src={selectedVideo.video_url}
                  poster={selectedVideo.thumbnail_url}
                  duration={selectedVideo.duracion}
                />
              )}
              <p className="mt-3 text-sm text-slate-700">{selectedVideo.descripcion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
