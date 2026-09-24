import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, AthleteProfile, RecruiterProfile, UserRole } from '../types';
import { INITIAL_PROFILES, INITIAL_ATHLETE_PROFILES, INITIAL_RECRUITER_PROFILES } from '../lib/mockData';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  athleteProfile: AthleteProfile | null;
  recruiterProfile: RecruiterProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (data: {
    nombre: string;
    email: string;
    password: string;
    rol: UserRole;
    ubicacion?: string;
  }) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<void>;
  updateAthleteProfile: (updatedData: Partial<AthleteProfile>) => Promise<void>;
  updateRecruiterProfile: (updatedData: Partial<RecruiterProfile>) => Promise<void>;
  switchDemoUser: (profileId: string) => void;
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
        } else {
          // Modo demostración: Cargar perfil inicial predeterminado (Carlos Martínez)
          const savedDemoUserId = localStorage.getItem('sportconnect_demo_user');
          const defaultUser = INITIAL_PROFILES.find((p) => p.id === savedDemoUserId) || INITIAL_PROFILES[0];
          
          setUser({
            id: defaultUser.id,
            email: defaultUser.email,
            user_metadata: { nombre: defaultUser.nombre, rol: defaultUser.rol },
          });
          setProfile(defaultUser);
          setAthleteProfile(INITIAL_ATHLETE_PROFILES[defaultUser.id] || null);
          setRecruiterProfile(INITIAL_RECRUITER_PROFILES[defaultUser.id] || null);
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
      // Modo demo / offline: buscar por email o crear sesión mock
      const matched = INITIAL_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
      const selected = matched || {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        nombre: email.split('@')[0],
        email,
        rol: (email.includes('scout') || email.includes('club') ? 'reclutador' : 'deportista') as UserRole,
        ubicacion: 'Madrid, España',
        avatar_url: undefined,
        fecha_registro: new Date().toISOString(),
      };

      localStorage.setItem('sportconnect_demo_user', selected.id);
      setUser({ id: selected.id, email: selected.email });
      setProfile(selected);
      if (selected.rol === 'deportista') {
        setAthleteProfile(INITIAL_ATHLETE_PROFILES[selected.id] || {
          user_id: selected.id,
          disciplina: 'Fútbol',
          posicion: 'Delantero',
          edad: 21,
          partidos: 45,
          goles: 24,
          asistencias: 12,
          logros: ['Subcampeón de Liga Juvenil', 'Máximo anotador'],
        });
        setRecruiterProfile(null);
      } else {
        setRecruiterProfile(INITIAL_RECRUITER_PROFILES[selected.id] || {
          user_id: selected.id,
          nombre_club: selected.nombre,
          tipo_institucion: 'Club Profesional',
          deportistas_contactados: 40,
          contrataciones: 5,
          scouts_activos: 3,
          perfiles_buscados: ['Jóvenes talentos Sub-21', 'Extremos y mediocentros'],
        });
        setAthleteProfile(null);
      }
      return { error: null };
    }
  };

  // Registro con Supabase Auth
  const register = async ({
    nombre,
    email,
    password,
    rol,
    ubicacion = 'Madrid, España',
  }: {
    nombre: string;
    email: string;
    password: string;
    rol: UserRole;
    ubicacion?: string;
  }) => {
    if (configured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            rol,
            ubicacion,
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
        });

        if (rol === 'deportista') {
          await supabase.from('athlete_profiles').upsert({
            user_id: data.user.id,
            disciplina: 'Fútbol',
            posicion: 'Delantero',
            edad: 20,
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
      // Modo demo
      const newId = 'usr-' + Math.random().toString(36).substring(2, 9);
      const newProfile: Profile = {
        id: newId,
        nombre,
        email,
        rol,
        ubicacion,
        fecha_registro: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('sportconnect_demo_user', newId);
      setUser({ id: newId, email });
      setProfile(newProfile);

      if (rol === 'deportista') {
        const ath: AthleteProfile = {
          user_id: newId,
          disciplina: 'Fútbol',
          posicion: 'Delantero',
          edad: 20,
          partidos: 0,
          goles: 0,
          asistencias: 0,
          logros: ['Nuevo talento en SportConnect'],
        };
        setAthleteProfile(ath);
        INITIAL_ATHLETE_PROFILES[newId] = ath;
        setRecruiterProfile(null);
      } else {
        const rec: RecruiterProfile = {
          user_id: newId,
          nombre_club: nombre,
          tipo_institucion: 'Club Deportivo',
          deportistas_contactados: 0,
          contrataciones: 0,
          scouts_activos: 1,
          perfiles_buscados: ['Delanteros veloces (18-23 años)'],
        };
        setRecruiterProfile(rec);
        INITIAL_RECRUITER_PROFILES[newId] = rec;
        setAthleteProfile(null);
      }
      INITIAL_PROFILES.push(newProfile);
      return { error: null };
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

  // Cambiar usuario de prueba (muy útil para alternar entre Deportista y Reclutador)
  const switchDemoUser = (profileId: string) => {
    const found = INITIAL_PROFILES.find((p) => p.id === profileId);
    if (found) {
      localStorage.setItem('sportconnect_demo_user', found.id);
      setUser({ id: found.id, email: found.email });
      setProfile(found);
      setAthleteProfile(INITIAL_ATHLETE_PROFILES[found.id] || null);
      setRecruiterProfile(INITIAL_RECRUITER_PROFILES[found.id] || null);
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
        switchDemoUser,
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
