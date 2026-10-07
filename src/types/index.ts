// ==============================================================================
// SPORTCONNECT - TIPOS DE DATOS TYPESCRIPT
// ==============================================================================

export type UserRole = 'deportista' | 'reclutador';

export interface Profile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  pais_nacimiento?: string;
  region_nacimiento?: string;
  ciudad_nacimiento?: string;
  ubicacion?: string;
  avatar_url?: string;
  bio?: string;
  fecha_registro?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AthleteProfile {
  id?: string;
  user_id: string;
  disciplina: string;
  posicion: string;
  edad: number;
  partidos: number;
  goles: number;
  asistencias: number;
  logros: string[];
  genero?: 'masculino' | 'femenino' | 'no_especificado';
  nivel_deportivo?: 'amateur' | 'formativo' | 'semiprofesional' | 'profesional' | 'elite';
  disponibilidad?: 'disponible' | 'buscando_equipo' | 'pruebas' | 'contrato_vigente' | 'no_disponible';
  club_actual?: string;
  academia?: string;
  experiencia_anios?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AthleteSearchResult {
  profile: Profile;
  athlete: AthleteProfile;
}

export interface RecruiterProfile {
  id?: string;
  user_id: string;
  nombre_club: string;
  tipo_institucion?: string;
  deportistas_contactados: number;
  contrataciones: number;
  scouts_activos: number;
  perfiles_buscados: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  contenido: string;
  created_at: string;
  updated_at?: string;
  autor?: {
    nombre: string;
    avatar_url?: string;
    rol: UserRole;
  };
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  video_url: string;
  storage_path?: string;
  thumbnail_url?: string;
  titulo?: string;
  descripcion: string;
  deporte: string;
  duracion?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at?: string;
  autor?: Profile;
  athlete_info?: Partial<AthleteProfile>;
  is_liked_by_user?: boolean;
  is_saved_by_user?: boolean;
  comments?: Comment[];
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  contenido: string;
  leido: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
  other_participant?: Profile;
  last_message?: Message;
  unread_count?: number;
  participants?: Profile[];
}

export interface FeedFilters {
  searchQuery: string;
  deporte: string;
  minEdad?: number;
  maxEdad?: number;
  posicion?: string;
  ubicacion?: string;
}
