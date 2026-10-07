import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, AthleteProfile, RecruiterProfile, UserRole } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  athleteProfile: AthleteProfile | null;
  recruiterProfile: RecruiterProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (data: {
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    email: string;
    password: string;
    rol: UserRole;
    pais_nacimiento: string;
    region_nacimiento: string;
    ciudad_nacimiento: string;
    edad?: number;
    disciplina?: string;
    posicion?: string;
  }) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<void>;
  updateAthleteProfile: (updatedData: Partial<AthleteProfile>) => Promise<void>;
  updateRecruiterProfile: (updatedData: Partial<RecruiterProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();

  // Cargar sesión inicial
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        if (configured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser(session.user);
            await fetchProfileData(session.user.id);
          } else if (mounted) {
            // Sin sesión activa
            setUser(null);
            setProfile(null);
          }
        } else if (mounted) {
          setUser(null);
          setProfile(null);
          setAthleteProfile(null);
          setRecruiterProfile(null);
        }
      } catch (err) {
        console.error('Error cargando sesión de Supabase:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadSession();

    // Escuchar cambios de autenticación en Supabase
    if (configured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfileData(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setAthleteProfile(null);
          setRecruiterProfile(null);
        }
        setIsLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [configured]);

  // Obtener perfil y sub-perfil desde PostgreSQL
  const fetchProfileData = async (userId: string) => {
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr) throw profileErr;
      setProfile(profileData);

      if (profileData.rol === 'deportista') {
        const { data: athleteData } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        setAthleteProfile(athleteData || null);
        setRecruiterProfile(null);
      } else {
        const { data: recruiterData } = await supabase
          .from('recruiter_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        setRecruiterProfile(recruiterData || null);
        setAthleteProfile(null);
      }
    } catch (err) {
      console.warn('No se pudo obtener el perfil de Supabase aún:', err);
    }
  };

  // Iniciar Sesión con Supabase Auth
  const login = async (email: string, password: string) => {
    if (configured) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } else {
      return { error: new Error('Supabase no está configurado. No se puede iniciar una sesión de prueba.') };
    }
  };

  // Registro con Supabase Auth
  const register = async ({
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    email,
    password,
    rol,
    pais_nacimiento,
    region_nacimiento,
    ciudad_nacimiento,
    edad,
    disciplina = 'Fútbol',
    posicion = 'Delantero',
  }: {
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    email: string;
    password: string;
    rol: UserRole;
    pais_nacimiento: string;
    region_nacimiento: string;
    ciudad_nacimiento: string;
    edad?: number;
    disciplina?: string;
    posicion?: string;
  }) => {
    const nombre = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
      .filter(Boolean)
      .join(' ');
    const ubicacion = `${ciudad_nacimiento}, ${region_nacimiento}, ${pais_nacimiento}`;

    if (configured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            rol,
            ubicacion,
            pais_nacimiento,
            region_nacimiento,
            ciudad_nacimiento,
            edad,
            disciplina,
            posicion,
          },
        },
      });

      if (error) {
        if (error.status === 429) {
          return {
            error: new Error(
              'Supabase ha limitado temporalmente los registros por email. Desactiva la confirmación de email en Authentication > Providers > Email o espera unos minutos antes de volver a intentarlo.'
            ),
          };
        }

        return { error: new Error(error.message) };
      }

      if (data.user) {
        // En caso de que el trigger no esté aún aplicado en la instancia, aseguramos profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          nombre,
          email,
          rol,
          ubicacion,
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          pais_nacimiento,
          region_nacimiento,
          ciudad_nacimiento,
        });

        if (rol === 'deportista') {
          await supabase.from('athlete_profiles').upsert({
            user_id: data.user.id,
            disciplina,
            posicion,
            edad: edad || 20,
            partidos: 0,
            goles: 0,
            asistencias: 0,
            logros: [],
          });
        } else {
          await supabase.from('recruiter_profiles').upsert({
            user_id: data.user.id,
            nombre_club: nombre,
            tipo_institucion: 'Club Profesional',
            deportistas_contactados: 0,
            contrataciones: 0,
            scouts_activos: 1,
            perfiles_buscados: ['Delanteros veloces', 'Mediocampistas creativos'],
          });
        }
      }

      return { error: null };
    } else {
      return { error: new Error('Supabase no está configurado. No se puede crear una cuenta de prueba.') };
    }
  };

  // Cerrar sesión
  const logout = async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sportconnect_demo_user');
    setUser(null);
    setProfile(null);
    setAthleteProfile(null);
    setRecruiterProfile(null);
  };

  // Actualizar perfil
  const updateProfile = async (updatedData: Partial<Profile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updatedData };
    setProfile(updated);

    if (configured) {
      await supabase.from('profiles').update(updatedData).eq('id', profile.id);
    }
  };

  // Actualizar perfil de atleta
  const updateAthleteProfile = async (updatedData: Partial<AthleteProfile>) => {
    if (!athleteProfile) return;
    const updated = { ...athleteProfile, ...updatedData };
    setAthleteProfile(updated);

    if (configured && profile) {
      await supabase.from('athlete_profiles').update(updatedData).eq('user_id', profile.id);
    }
  };

  // Actualizar perfil de reclutador
  const updateRecruiterProfile = async (updatedData: Partial<RecruiterProfile>) => {
    if (!recruiterProfile) return;
    const updated = { ...recruiterProfile, ...updatedData };
    setRecruiterProfile(updated);

    if (configured && profile) {
      await supabase.from('recruiter_profiles').update(updatedData).eq('user_id', profile.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        athleteProfile,
        recruiterProfile,
        isLoading,
        isConfigured: configured,
        login,
        register,
        logout,
        updateProfile,
        updateAthleteProfile,
        updateRecruiterProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
