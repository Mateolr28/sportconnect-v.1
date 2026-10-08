import React from 'react';
import { Building2, MapPin, Edit3, Target, ArrowRight } from 'lucide-react';
import { Profile, RecruiterProfile } from '../types';

interface RecruiterProfileViewProps {
  profile: Profile;
  recruiter: RecruiterProfile | null;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onFindAthletes?: () => void;
  onViewAthlete?: (athleteId: string) => void;
}

export const RecruiterProfileView: React.FC<RecruiterProfileViewProps> = ({
  profile,
  recruiter,
  isOwnProfile,
  onEditProfile,
  onFindAthletes,
  onViewAthlete,
}) => {
  const wantedProfiles = recruiter?.perfiles_buscados && recruiter.perfiles_buscados.length > 0
    ? recruiter.perfiles_buscados
    : [
        'Delanteros veloces (18-23 años)',
        'Mediocampistas creativos (17-22 años)',
        'Defensas centrales (18-24 años)',
      ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header Banner Reclutador */}
      <div className="bg-[#0b1426] text-white rounded-2xl overflow-hidden shadow-sm relative">
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-start gap-6">
          {/* Logo del club / avatar corporativo */}
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white text-[#1E3A8A] flex items-center justify-center shadow-lg flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`Logo de ${profile.nombre}`} className="w-full h-full object-cover rounded-2xl" />
            ) : <Building2 className="w-12 h-12" />}
          </div>

          {/* Información del club o reclutador */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {recruiter?.nombre_club || profile.nombre}
                </h1>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {recruiter?.tipo_institucion || 'Club de Fútbol Profesional'}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.ubicacion || 'Barcelona, España'}
                  </span>
                  {(profile.ciudad_nacimiento || profile.region_nacimiento || profile.pais_nacimiento) && (
                    <span>
                      Nacimiento: {[profile.ciudad_nacimiento, profile.region_nacimiento, profile.pais_nacimiento].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Botón Editar perfil */}
              {isOwnProfile && (
                <button
                  onClick={onEditProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar perfil</span>
                </button>
              )}
            </div>

            {/* Badges deportivas */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="bg-[#10B981] text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                Fútbol
              </span>
              <span className="bg-[#10B981] text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                Fútbol Sala
              </span>
            </div>

            {/* Descripción */}
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl pt-1">
              {profile.bio ||
                'Academia de fútbol profesional buscando talento joven para nuestras categorías inferiores. Enfocados en desarrollar futuras estrellas del fútbol con metodología de primer nivel y clase mundial.'}
            </p>

            {/* Métricas del Reclutador */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {recruiter?.deportistas_contactados || 150}+
                </span>
                <span className="text-xs text-slate-400 font-medium">Deportistas contactados</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {recruiter?.contrataciones || 12}
                </span>
                <span className="text-xs text-slate-400 font-medium">Contrataciones</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {recruiter?.scouts_activos || 8}
                </span>
                <span className="text-xs text-slate-400 font-medium">Scouts activos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sección: Perfiles que buscamos */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-[#10B981] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Perfiles que buscamos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {wantedProfiles.map((p, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:border-[#10B981] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-800">{p}</span>
            </div>
          ))}
        </div>

        {/* Botón Buscar deportistas */}
        <div className="pt-1">
          <button
            onClick={onFindAthletes}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Target className="w-4 h-4" />
            <span>Buscar deportistas</span>
          </button>
        </div>
      </section>

    </div>
  );
};
