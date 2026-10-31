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
  /** true cuando el usuario llegó desde el enlace del correo y debe elegir una contraseña nueva */
  isRecovering: boolean;
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
    categoria?: string;
    modalidad_competencia?: string;
  }) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  cancelRecovery: () => Promise<void>;
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
  // El enlace de recuperación llega con type=recovery en la URL; también lo avisa el evento PASSWORD_RECOVERY
  const [isRecovering, setIsRecovering] = useState<boolean>(
    () => typeof window !== 'undefined' && /type=recovery/.test(window.location.hash + window.location.search)
  );
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') setIsRecovering(true);
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
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error ? new Error(error.message) : null };
      } catch (err) {
        console.error('No se pudo conectar con Supabase para iniciar sesión:', err);
        return {
          error: new Error(
            'No se pudo conectar con Supabase. Verifica VITE_SUPABASE_URL, tu conexión de red y que el proyecto siga activo.'
          ),
        };
      }
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
    disciplina = '',
    posicion = '',
    categoria = '',
    modalidad_competencia = '',
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
    categoria?: string;
    modalidad_competencia?: string;
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
            especialidad: posicion,
            categoria,
            modalidad_competencia,
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

        if (error.code === 'user_already_exists' || /already registered/i.test(error.message)) {
          return { error: new Error('Este correo ya está registrado. Inicia sesión o recupera tu contraseña.') };
        }

        return { error: new Error(error.message) };
      }

      // Con confirmación de email activa, Supabase no devuelve error para un correo existente:
      // responde con un usuario sin identidades para no revelar qué correos están registrados.
      if (data.user && data.user.identities?.length === 0) {
        return { error: new Error('Este correo ya está registrado. Inicia sesión o recupera tu contraseña.') };
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
            especialidad: posicion,
            categoria,
            modalidad_competencia,
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

  // Enviar el correo de recuperación (la respuesta no revela si el correo existe)
  const requestPasswordReset = async (email: string) => {
    if (!configured) {
      return { error: new Error('Supabase no está configurado. No se puede enviar el correo de recuperación.') };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) {
        if (error.status === 429) {
          return { error: new Error('Solicitaste demasiados correos seguidos. Espera unos minutos antes de intentarlo de nuevo.') };
        }
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err) {
      console.error('No se pudo solicitar la recuperación de contraseña:', err);
      return { error: new Error('No se pudo conectar con Supabase. Revisa tu conexión e inténtalo de nuevo.') };
    }
  };

  // Guardar la contraseña nueva durante la sesión de recuperación
  const updatePassword = async (newPassword: string) => {
    if (!configured) return { error: new Error('Supabase no está configurado.') };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      const message = /different from the old password/i.test(error.message)
        ? 'La contraseña nueva debe ser distinta de la anterior.'
        : /expired|session/i.test(error.message)
          ? 'El enlace de recuperación venció. Solicita uno nuevo.'
          : error.message;
      return { error: new Error(message) };
    }
    // Cierra las demás sesiones abiertas con la contraseña anterior
    await supabase.auth.signOut({ scope: 'others' }).catch(() => undefined);
    setIsRecovering(false);
    // Limpia el token de la URL para que no se reutilice al recargar
    if (typeof window !== 'undefined') window.history.replaceState({}, document.title, window.location.pathname);
    return { error: null };
  };

  // Abandonar la recuperación sin cambiar la contraseña
  const cancelRecovery = async () => {
    setIsRecovering(false);
    if (typeof window !== 'undefined') window.history.replaceState({}, document.title, window.location.pathname);
    if (configured) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setAthleteProfile(null);
    setRecruiterProfile(null);
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
        isRecovering,
        login,
        register,
        logout,
        requestPasswordReset,
        updatePassword,
        cancelRecovery,
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
