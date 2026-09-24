import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Film, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';

interface UploadPageProps {
  onPostCreated: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onPostCreated }) => {
  const { profile, athleteProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [deporte, setDeporte] = useState<string>('Fútbol');
  const [descripcion, setDescripcion] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sportsList = [
    'Fútbol',
    'Baloncesto',
    'Atletismo',
    'Tenis',
    'Natación',
    'Voleibol',
    'Fútbol Sala',
    'Gimnasia',
    'Béisbol',
  ];

  const handleFile = (file: File) => {
    setErrorMsg(null);

    // Validación de tamaño (Máximo 500 MB)
    const maxSizeBytes = 500 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg('El archivo excede el tamaño máximo permitido de 500 MB.');
      return;
    }

    // Validación de extensiones permitidas: MP4, MOV, AVI
    const validExtensions = ['mp4', 'mov', 'avi'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
      setErrorMsg('Formato de video no válido. Formatos soportados: MP4, MOV, AVI.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Por favor selecciona o arrastra un video deportivo.');
      return;
    }

    if (!descripcion.trim()) {
      setErrorMsg('Por favor ingresa una descripción para tu video.');
      return;
    }

    if (!profile) {
      setErrorMsg('Debes estar autenticado para publicar videos.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg(null);

    try {
      // 1. Subir a Supabase Storage
      const { url, path } = await supabaseService.uploadVideo(
        selectedFile,
        profile.id,
        (progress) => setUploadProgress(progress)
      );

      // 2. Crear post en la base de datos
      await supabaseService.createPost({
        user_id: profile.id,
        video_url: url,
        storage_path: path,
        titulo: descripcion.slice(0, 40),
        descripcion: descripcion.trim(),
        deporte,
        duracion: '1:00',
        thumbnail_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1000&auto=format&fit=crop&q=80',
        autor: profile,
        athlete_info: {
          posicion: athleteProfile?.posicion || 'Delantero',
          edad: athleteProfile?.edad || 22,
        },
      });

      setSuccessMsg('¡Video publicado exitosamente en SportConnect!');
      setTimeout(() => {
        onPostCreated();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir el video.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8 flex justify-center pb-20">
      <div className="w-full max-w-3xl space-y-6">
        {/* Encabezado */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Subir video
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Comparte tus mejores momentos deportivos con reclutadores
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Zona de Drag & Drop con borde punteado */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Video</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`bg-white border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-[#1E3A8A] bg-blue-50/40'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo"
                onChange={handleSelectFile}
                className="hidden"
              />

              {videoPreviewUrl ? (
                <div className="space-y-3">
                  <div className="w-full max-w-sm mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-sm">
                    <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{selectedFile?.name}</p>
                  <p className="text-[11px] text-[#10B981] font-medium">
                    Haz clic para seleccionar otro archivo
                  </p>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  {/* Ícono en caja azul claro */}
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">Arrastra tu video aquí</p>
                    <p className="text-xs text-slate-500 mt-0.5">o haz clic para seleccionar un archivo</p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Formatos soportados: MP4, MOV, AVI • Máximo 500MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Barra de progreso de subida si está subiendo */}
          {isUploading && (
            <div className="space-y-1.5 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Subiendo video a Supabase Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Selector de Deporte */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Deporte</label>
            <select
              value={deporte}
              onChange={(e) => setDeporte(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] shadow-xs"
            >
              {sportsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Descripción */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Descripción</label>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Describe tu rendimiento, logros destacados, contexto del video..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] shadow-xs resize-none"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{descripcion.length}/500 caracteres</span>
            </div>
          </div>

          {/* Caja: Consejos para un mejor video */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 space-y-2.5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              Consejos para un mejor video
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-[#10B981] font-bold">✓</span>
                Graba en buena calidad con buena iluminación
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#10B981] font-bold">✓</span>
                Destaca tus mejores jugadas en los primeros 15 segundos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#10B981] font-bold">✓</span>
                Evita música con derechos de autor para mayor alcance
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#10B981] font-bold">✓</span>
                Añade descripción detallada de tu posición, rol y minutos de juego
              </li>
            </ul>
          </div>

          {/* Botón Publicar Video */}
          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-[#1E3A8A] hover:bg-blue-900 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Film className="w-4 h-4" />
            <span>{isUploading ? 'Procesando y publicando...' : 'Publicar video'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
