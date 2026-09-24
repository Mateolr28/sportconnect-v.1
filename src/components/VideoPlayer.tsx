import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  duration?: string;
  badgeText?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  duration = '0:45',
  badgeText,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div
      onClick={togglePlay}
      className="relative w-full aspect-[16/10] bg-black rounded-xl overflow-hidden cursor-pointer group shadow-sm"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        playsInline
        loop
        className="w-full h-full object-cover"
        onEnded={() => setIsPlaying(false)}
      />

      {/* Badge superior izquierdo (ej. Delantero • 22 años) */}
      {badgeText && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
            {badgeText}
          </span>
        </div>
      )}

      {/* Botón central Play cuando está pausado */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all z-10">
          <div className="w-14 h-14 rounded-full bg-white/95 text-[#1E3A8A] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 pl-1">
            <Play className="w-6 h-6 fill-current" />
          </div>
        </div>
      )}

      {/* Controles inferiores (duración, audio, pantalla completa) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-colors"
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={handleFullscreen}
          className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-colors"
          title="Pantalla completa"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-mono px-2 py-1 rounded-md flex items-center gap-1">
          <Play className="w-3 h-3 fill-current opacity-70" />
          {duration}
        </span>
      </div>
    </div>
  );
};
