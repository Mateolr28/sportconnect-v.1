import React, { useEffect, useState } from 'react';
import {
  Award,
  BadgeCheck,
  BrainCircuit,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  UserRound,
  X,
} from 'lucide-react';
import { AthleteSearchResult, Profile } from '../types';
import { supabaseService } from '../services/supabaseService';

interface SearchPageProps {
  onViewProfile: (userId: string) => void;
  onContactAthlete: (athlete: Profile) => void;
}

type AgeRange = '' | 'under15' | '15-17' | '18-20' | '21-23' | '24-27' | '28+' | 'custom';
type SearchFilters = {
  sports: string[];
  positions: string[];
  ageRange: AgeRange;
  minAge: string;
  maxAge: string;
  location: string;
  gender: string;
  level: string;
  availability: string;
  club: string;
  academy: string;
  experience: string;
};

const sports = ['Fútbol', 'Baloncesto', 'Voleibol', 'Atletismo', 'Natación', 'Ciclismo', 'Tenis', 'Béisbol', 'Boxeo', 'Gimnasia', 'Otros'];
const positionsBySport: Record<string, string[]> = {
  Fútbol: ['Portero', 'Defensa central', 'Lateral derecho', 'Lateral izquierdo', 'Mediocampista', 'Extremo', 'Delantero'],
  Baloncesto: ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'],
  Voleibol: ['Colocador', 'Líbero', 'Central', 'Punta', 'Opuesto'],
  Atletismo: ['Velocidad', 'Fondo', 'Saltos', 'Lanzamientos'],
  Natación: ['Libre', 'Espalda', 'Braza', 'Mariposa'],
};
const levels = [['amateur', 'Amateur'], ['formativo', 'Formativo'], ['semiprofesional', 'Semiprofesional'], ['profesional', 'Profesional'], ['elite', 'Élite']];
const availabilityOptions = [['disponible', 'Disponible'], ['buscando_equipo', 'Buscando equipo'], ['pruebas', 'Disponible para pruebas'], ['contrato_vigente', 'Contrato vigente'], ['no_disponible', 'No disponible']];
const suggestionCategories = ['Deportes', 'Posiciones', 'Clubes', 'Academias', 'Ciudades', 'Categorías'];

const emptyFilters: SearchFilters = {
  sports: [], positions: [], ageRange: '', minAge: '', maxAge: '', location: '', gender: '', level: '', availability: '', club: '', academy: '', experience: '',
};

const initials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const normalize = (value?: string | number) => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const SearchPage: React.FC<SearchPageProps> = ({ onViewProfile, onContactAthlete }) => {
  const [athletes, setAthletes] = useState<AthleteSearchResult[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiSummary, setAiSummary] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    supabaseService.searchAthletes()
      .then(setAthletes)
      .catch(() => setErrorMessage('No pudimos cargar el directorio de deportistas.'))
      .finally(() => setIsLoading(false));
  }, []);

  const allPositions = Array.from(new Set(draftFilters.sports.flatMap((sport) => positionsBySport[sport] || [])));
  const filteredAthletes = athletes.filter(({ profile, athlete }) => {
    const searchable = normalize([profile.nombre, profile.ubicacion, profile.ciudad_nacimiento, athlete.disciplina, athlete.posicion, athlete.club_actual, athlete.academia].join(' '));
    const normalizedQuery = normalize(query);
    const age = athlete.edad;
    const minAge = filters.ageRange === 'under15' ? undefined : filters.ageRange === '15-17' ? 15 : filters.ageRange === '18-20' ? 18 : filters.ageRange === '21-23' ? 21 : filters.ageRange === '24-27' ? 24 : filters.ageRange === '28+' ? 28 : filters.ageRange === 'custom' && filters.minAge ? Number(filters.minAge) : undefined;
    const maxAge = filters.ageRange === 'under15' ? 14 : filters.ageRange === '15-17' ? 17 : filters.ageRange === '18-20' ? 20 : filters.ageRange === '21-23' ? 23 : filters.ageRange === '24-27' ? 27 : filters.ageRange === 'custom' && filters.maxAge ? Number(filters.maxAge) : undefined;

    return (!normalizedQuery || searchable.includes(normalizedQuery))
      && (!filters.sports.length || filters.sports.some((sport) => sport === 'Otros' ? !sports.slice(0, -1).some((item) => normalize(athlete.disciplina) === normalize(item)) : normalize(athlete.disciplina) === normalize(sport)))
      && (!filters.positions.length || filters.positions.some((position) => normalize(athlete.posicion).includes(normalize(position))))
      && (minAge === undefined || age >= minAge)
      && (maxAge === undefined || age <= maxAge)
      && (!filters.location || normalize([profile.ubicacion, profile.pais_nacimiento, profile.region_nacimiento, profile.ciudad_nacimiento].join(' ')).includes(normalize(filters.location)))
      && (!filters.gender || athlete.genero === filters.gender)
      && (!filters.level || athlete.nivel_deportivo === filters.level)
      && (!filters.availability || athlete.disponibilidad === filters.availability)
      && (!filters.club || normalize(athlete.club_actual).includes(normalize(filters.club)))
      && (!filters.academy || normalize(athlete.academia).includes(normalize(filters.academy)))
      && (!filters.experience || (athlete.experiencia_anios ?? 0) >= Number(filters.experience));
  });

  const suggestions = query.trim() ? athletes.filter(({ profile, athlete }) => normalize([profile.nombre, athlete.disciplina, athlete.posicion, profile.ubicacion].join(' ')).includes(normalize(query))).slice(0, 5) : [];

  const toggleDraftArray = (key: 'sports' | 'positions', value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  };

  const handleAiSearch = () => {
    const text = normalize(query);
    const next = { ...emptyFilters };
    const interpreted: string[] = [];
    const sport = sports.find((item) => text.includes(normalize(item)));
    if (sport) { next.sports = [sport]; interpreted.push(`⚽ ${sport}`); }
    const position = Object.values(positionsBySport).flat().find((item) => text.includes(normalize(item)));
    if (position) { next.positions = [position]; interpreted.push(`🎯 ${position}`); }
    const ageMatch = text.match(/(?:menor de|sub[- ]?)\s*(\d+)/);
    if (ageMatch) { next.ageRange = 'custom'; next.maxAge = String(Number(ageMatch[1]) - 1); interpreted.push(`🎂 Menor de ${ageMatch[1]} años`); }
    const availability = availabilityOptions.find(([value, label]) => text.includes(normalize(label)) || text.includes(normalize(value.replace('_', ' '))));
    if (availability) { next.availability = availability[0]; interpreted.push(`🟢 ${availability[1]}`); }
    const location = athletes.map(({ profile }) => profile.ciudad_nacimiento || profile.ubicacion).find((item) => item && text.includes(normalize(item)));
    if (location) { next.location = location; interpreted.push(`📍 ${location}`); }
    setFilters(next);
    setAiSummary(interpreted.length ? interpreted : ['No se detectaron filtros estructurados; se usará el texto completo.']);
  };

  const activeFilterCount = filters.sports.length + filters.positions.length + [filters.ageRange, filters.location, filters.gender, filters.level, filters.availability, filters.club, filters.academy, filters.experience].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f7f9fc] pb-16">
      <header className="bg-[#0b1426] text-white px-5 py-8 md:px-10 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-5 mb-8">
            <div>
              <p className="text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">Talent discovery</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">Encuentra el próximo talento.</h1>
              <p className="text-slate-300 text-sm md:text-base mt-3 max-w-xl">Explora perfiles deportivos, compara trayectorias y conecta con deportistas que encajan con tu búsqueda.</p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-emerald-400/15 items-center justify-center text-emerald-300"><Target className="w-6 h-6" /></div>
          </div>
          <div className="relative max-w-4xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && isAiMode) handleAiSearch(); }} className="w-full bg-white text-slate-900 rounded-2xl pl-14 pr-44 py-4 text-sm md:text-base shadow-xl outline-none placeholder:text-slate-400" placeholder="Busca deportistas, deportes, posiciones, clubes o talentos..." />
            <button type="button" onClick={() => { setIsAiMode(!isAiMode); setAiSummary([]); }} className={`absolute right-2 top-2 bottom-2 rounded-xl px-3 md:px-4 text-xs font-bold flex items-center gap-2 transition-colors ${isAiMode ? 'bg-emerald-400 text-[#0b1426]' : 'bg-slate-100 text-slate-700 hover:bg-emerald-100'}`}><Sparkles className="w-4 h-4" /> <span className="hidden md:inline">Buscar con IA</span></button>
            {suggestions.length > 0 && !isAiMode && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-20 bg-white rounded-2xl p-2 shadow-2xl border border-slate-200 text-slate-900">
                {suggestions.map(({ profile, athlete }) => <button key={profile.id} type="button" onClick={() => { setQuery(profile.nombre); setAiSummary([]); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left"><span className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">{initials(profile.nombre)}</span><span className="flex-1"><strong className="block text-sm">{profile.nombre}</strong><small className="text-slate-500">Deportista · {athlete.disciplina} · {athlete.posicion}</small></span><ChevronRight className="w-4 h-4 text-slate-400" /></button>)}
                <div className="border-t border-slate-100 mt-1 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Deportistas</div>
                {suggestionCategories.filter((category) => normalize(category).includes(normalize(query))).map((category) => <button key={category} type="button" onClick={() => { setQuery(category); setIsAiMode(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-left"><span className="w-8 h-8 rounded-lg bg-slate-100 text-[#1E3A8A] flex items-center justify-center"><Target className="w-4 h-4" /></span><span className="text-sm font-semibold">{category}</span><span className="ml-auto text-xs text-slate-400">Categoría</span></button>)}
              </div>
            )}
          </div>
          {isAiMode && <div className="mt-3 flex items-center gap-2 text-xs text-emerald-200"><BrainCircuit className="w-4 h-4" /> Escribe una necesidad en lenguaje natural y pulsa Enter o vuelve a tocar el botón.</div>}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-10 py-7">
        {aiSummary.length > 0 && <section className="mb-6 bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Entendimos que buscas</p><div className="flex flex-wrap gap-2 mt-3">{aiSummary.map((item) => <span key={item} className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold">{item}</span>)}</div></div><button type="button" onClick={() => { setAiSummary([]); setFilters(emptyFilters); }} className="text-xs text-slate-500 hover:text-slate-900">Limpiar interpretación</button></div></section>}

        <div className="flex flex-col lg:flex-row gap-7 items-start">
          <aside className={`w-full lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sticky top-5 shadow-sm">
              <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-[#1E3A8A]" /><h2 className="font-bold text-slate-900 text-sm">Filtros avanzados</h2></div><button onClick={() => setShowFilters(false)} className="lg:hidden text-slate-400"><X className="w-4 h-4" /></button></div>
              <div className="space-y-5">
                <FilterSection title="Deporte"><div className="flex flex-wrap gap-2">{sports.map((sport) => <button key={sport} type="button" onClick={() => toggleDraftArray('sports', sport)} className={`px-2.5 py-1.5 rounded-lg border text-xs ${draftFilters.sports.includes(sport) ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>{sport}</button>)}</div></FilterSection>
                <FilterSection title="Posición"><div className="flex flex-wrap gap-2">{(allPositions.length ? allPositions : Object.values(positionsBySport).flat()).map((position) => <button key={position} type="button" onClick={() => toggleDraftArray('positions', position)} className={`px-2.5 py-1.5 rounded-lg border text-xs ${draftFilters.positions.includes(position) ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>{position}</button>)}</div></FilterSection>
                <FilterSection title="Edad"><select value={draftFilters.ageRange} onChange={(e) => setDraftFilters({ ...draftFilters, ageRange: e.target.value as AgeRange })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs"><option value="">Cualquier edad</option><option value="under15">Menor de 15</option><option value="15-17">15-17</option><option value="18-20">18-20</option><option value="21-23">21-23</option><option value="24-27">24-27</option><option value="28+">28+</option><option value="custom">Rango personalizado</option></select>{draftFilters.ageRange === 'custom' && <div className="grid grid-cols-2 gap-2 mt-2"><input type="number" placeholder="Desde" value={draftFilters.minAge} onChange={(e) => setDraftFilters({ ...draftFilters, minAge: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2 text-xs" /><input type="number" placeholder="Hasta" value={draftFilters.maxAge} onChange={(e) => setDraftFilters({ ...draftFilters, maxAge: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2 text-xs" /></div>}</FilterSection>
                <FilterSection title="Ubicación"><input value={draftFilters.location} onChange={(e) => setDraftFilters({ ...draftFilters, location: e.target.value })} placeholder="País, región o ciudad" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs" /><p className="text-[11px] text-slate-400 mt-2">Ejemplo: Medellín + 50 km</p></FilterSection>
                <FilterSection title="Perfil deportivo"><div className="grid grid-cols-2 gap-2"><select value={draftFilters.gender} onChange={(e) => setDraftFilters({ ...draftFilters, gender: e.target.value })} className="border border-slate-200 rounded-xl px-2 py-2 text-xs"><option value="">Género</option><option value="masculino">Masculino</option><option value="femenino">Femenino</option><option value="no_especificado">No especificado</option></select><select value={draftFilters.level} onChange={(e) => setDraftFilters({ ...draftFilters, level: e.target.value })} className="border border-slate-200 rounded-xl px-2 py-2 text-xs"><option value="">Nivel</option>{levels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><select value={draftFilters.availability} onChange={(e) => setDraftFilters({ ...draftFilters, availability: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs mt-2"><option value="">Disponibilidad</option>{availabilityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FilterSection>
                <FilterSection title="Club y academia"><input value={draftFilters.club} onChange={(e) => setDraftFilters({ ...draftFilters, club: e.target.value })} placeholder="Club" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs mb-2" /><input value={draftFilters.academy} onChange={(e) => setDraftFilters({ ...draftFilters, academy: e.target.value })} placeholder="Academia" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" /></FilterSection>
                <FilterSection title="Experiencia"><input type="number" min="0" value={draftFilters.experience} onChange={(e) => setDraftFilters({ ...draftFilters, experience: e.target.value })} placeholder="Años mínimos" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" /></FilterSection>
              </div>
              <div className="flex gap-2 mt-6 pt-5 border-t border-slate-100"><button type="button" onClick={() => { setDraftFilters(emptyFilters); setFilters(emptyFilters); }} className="flex-1 text-xs font-semibold text-slate-500 hover:text-slate-900">Limpiar</button><button type="button" onClick={() => { setFilters(draftFilters); setShowFilters(false); }} className="flex-1 bg-[#1E3A8A] text-white rounded-xl py-2.5 text-xs font-bold">Aplicar filtros</button></div>
            </div>
          </aside>

          <section className="flex-1 min-w-0 w-full"><div className="flex items-center justify-between gap-3 mb-5"><div><div className="flex items-center gap-2"><h2 className="text-xl font-black text-slate-900">Deportistas</h2>{activeFilterCount > 0 && <span className="bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5 text-[11px] font-bold">{activeFilterCount} activos</span>}</div><p className="text-xs text-slate-500 mt-1">{filteredAthletes.length} perfiles que coinciden con tu búsqueda</p></div><button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold"><Filter className="w-4 h-4" /> Filtros</button></div>
            {isLoading ? <div className="grid sm:grid-cols-2 gap-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-60 bg-white border border-slate-200 rounded-2xl animate-pulse" />)}</div> : errorMessage ? <div className="bg-white border border-red-200 rounded-2xl p-8 text-center text-sm text-red-700">{errorMessage}</div> : filteredAthletes.length === 0 ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center"><UserRound className="w-9 h-9 mx-auto text-slate-300" /><h3 className="font-bold text-slate-800 mt-3">No encontramos candidatos</h3><p className="text-xs text-slate-500 mt-1">Prueba quitando algún filtro o usando otra búsqueda.</p></div> : <div className="grid sm:grid-cols-2 gap-4">{filteredAthletes.map(({ profile, athlete }) => <AthleteCard key={profile.id} profile={profile} athlete={athlete} onViewProfile={onViewProfile} onContactAthlete={onContactAthlete} />)}</div>}
          </section>
        </div>
      </main>
    </div>
  );
};

const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => <div><label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">{title}</label>{children}</div>;

const AthleteCard: React.FC<{ profile: Profile; athlete: AthleteSearchResult['athlete']; onViewProfile: (id: string) => void; onContactAthlete: (profile: Profile) => void }> = ({ profile, athlete, onViewProfile, onContactAthlete }) => <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all"><div className="h-20 bg-[#0b1426] relative"><div className="absolute -bottom-7 left-5 w-14 h-14 rounded-2xl bg-teal-600 border-4 border-white text-white flex items-center justify-center text-sm font-black">{initials(profile.nombre)}</div><span className="absolute top-4 right-4 bg-emerald-400 text-[#0b1426] rounded-full px-2.5 py-1 text-[10px] font-bold">{athlete.disciplina}</span></div><div className="p-5 pt-10"><div className="flex items-start justify-between gap-3"><div><button onClick={() => onViewProfile(profile.id)} className="font-black text-slate-900 hover:text-[#1E3A8A] text-left">{profile.nombre}</button><p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.ciudad_nacimiento || profile.ubicacion || 'Ubicación no disponible'}</p></div><BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" /></div><div className="flex flex-wrap gap-2 mt-4"><span className="bg-slate-100 text-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold">{athlete.posicion}</span><span className="bg-slate-100 text-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold">{athlete.edad} años</span>{athlete.nivel_deportivo && <span className="bg-slate-100 text-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold"><Award className="w-3 h-3 inline mr-1" />{athlete.nivel_deportivo}</span>}</div>{(athlete.club_actual || athlete.academia) && <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500"><p className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />{athlete.club_actual || athlete.academia}</p>{athlete.academia && athlete.club_actual && <p className="flex items-center gap-2"><Target className="w-3.5 h-3.5" />{athlete.academia}</p>}</div>}<div className="flex gap-2 mt-5"><button onClick={() => onViewProfile(profile.id)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Ver perfil</button><button onClick={() => onContactAthlete(profile)} className="flex-1 bg-[#1E3A8A] text-white rounded-xl py-2.5 text-xs font-bold hover:bg-blue-900">Contactar</button></div></div></article>;
