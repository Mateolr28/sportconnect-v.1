import React from 'react';
import { Building2, MapPin, Edit3, Target, Globe, Mail, Phone, CalendarDays, CheckCircle2 } from 'lucide-react';
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
  const wantedProfiles = recruiter?.perfiles_buscados || [];

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
                  {recruiter?.tipo_institucion || 'Institución deportiva'}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.ubicacion || 'Ubicación no especificada'}
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

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(recruiter?.deportes_buscados || []).map((sport) => <span key={sport} className="bg-[#10B981] text-white text-xs font-semibold px-2.5 py-1 rounded-md">{sport}</span>)}
            </div>

            {/* Descripción */}
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl pt-1">
              {profile.bio || 'Este reclutador aún no ha agregado una presentación.'}
            </p>

            {/* Métricas del Reclutador */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {recruiter?.deportistas_contactados || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">Deportistas contactados</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {recruiter?.contrataciones || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">Contrataciones</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xl md:text-2xl font-black text-white block">
                  {recruiter?.scouts_activos || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">Scouts activos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(wantedProfiles.length > 0 || (recruiter?.categorias_buscadas || []).length > 0) && <section className="space-y-4">
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
              {(recruiter?.categorias_buscadas || []).length > 0 && <div className="flex flex-wrap gap-2"><span className="text-xs font-bold text-slate-500">Categorías:</span>{recruiter?.categorias_buscadas?.map((item) => <span key={item} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">{item}</span>)}</div>}
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
      </section>}

      {(recruiter?.filosofia || recruiter?.proceso_seleccion || recruiter?.beneficios?.length || recruiter?.sitio_web || recruiter?.email_contacto || recruiter?.telefono_contacto || recruiter?.anio_fundacion || recruiter?.sede_principal) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(recruiter.filosofia || recruiter.proceso_seleccion) && <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"><h2 className="font-bold text-slate-900">Nuestra propuesta</h2>{recruiter.filosofia && <div><h3 className="text-xs font-bold text-emerald-700 uppercase">Filosofía</h3><p className="text-sm text-slate-600 mt-1">{recruiter.filosofia}</p></div>}{recruiter.proceso_seleccion && <div><h3 className="text-xs font-bold text-emerald-700 uppercase">Proceso de selección</h3><p className="text-sm text-slate-600 mt-1">{recruiter.proceso_seleccion}</p></div>}</div>}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"><h2 className="font-bold text-slate-900">Información institucional</h2>{recruiter.sede_principal && <p className="flex gap-2 text-sm text-slate-600"><MapPin className="w-4 h-4 text-emerald-600" />{recruiter.sede_principal}</p>}{recruiter.anio_fundacion && <p className="flex gap-2 text-sm text-slate-600"><CalendarDays className="w-4 h-4 text-emerald-600" />Desde {recruiter.anio_fundacion}</p>}{recruiter.email_contacto && <p className="flex gap-2 text-sm text-slate-600"><Mail className="w-4 h-4 text-emerald-600" />{recruiter.email_contacto}</p>}{recruiter.telefono_contacto && <p className="flex gap-2 text-sm text-slate-600"><Phone className="w-4 h-4 text-emerald-600" />{recruiter.telefono_contacto}</p>}{recruiter.sitio_web && <a href={recruiter.sitio_web} target="_blank" rel="noreferrer" className="flex gap-2 text-sm text-blue-700 hover:underline"><Globe className="w-4 h-4" />Visitar sitio web</a>}</div>
        </section>
      )}

      {(recruiter?.beneficios || []).length > 0 && <section className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5"><h2 className="font-bold text-slate-900 mb-3">Lo que ofrecemos</h2><div className="flex flex-wrap gap-3">{recruiter?.beneficios?.map((benefit) => <span key={benefit} className="flex items-center gap-1.5 text-sm text-emerald-800"><CheckCircle2 className="w-4 h-4" />{benefit}</span>)}</div></section>}

    </div>
  );
};
