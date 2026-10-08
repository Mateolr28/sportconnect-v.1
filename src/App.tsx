import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { UploadPage } from './pages/UploadPage';
import { MessagesPage } from './pages/MessagesPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SupabaseInfoModal } from './components/SupabaseInfoModal';
import { supabaseService } from './services/supabaseService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Profile } from './types';
import { Home, User, Upload, MessageCircle, Search } from 'lucide-react';

function AppContent() {
  const { user, profile, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [messageNotification, setMessageNotification] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) {
      setUnreadMessagesCount(0);
      return;
    }

    let isMounted = true;
    let previousCount = 0;

    const refreshUnreadCount = async () => {
      try {
        const chats = await supabaseService.getChats(profile.id);
        if (!isMounted) return;

        const nextCount = chats.reduce((total, chat) => total + (chat.unread_count || 0), 0);
        if (nextCount > previousCount && currentTab !== 'mensajes') {
          setMessageNotification(nextCount);
        }
        previousCount = nextCount;
        setUnreadMessagesCount(nextCount);
      } catch (error) {
        console.error('Error actualizando notificaciones de mensajes:', error);
      }
    };

    refreshUnreadCount();
    const interval = window.setInterval(refreshUnreadCount, 10000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [profile?.id, currentTab]);

  useEffect(() => {
    if (!profile || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const message = payload.new as { sender_id?: string };
        if (message.sender_id !== profile.id) {
          setMessageNotification((current) => (current || 0) + 1);
          setUnreadMessagesCount((current) => current + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Pantalla de carga inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1128] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-sm font-medium">Iniciando SportConnect...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar Login o Registro
  if (!user || !profile) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateToLogin={() => setAuthView('login')}
          onRegisterSuccess={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onNavigateToRegister={() => setAuthView('register')}
        onLoginSuccess={() => setCurrentTab('inicio')}
      />
    );
  }

  // Acción: Contactar deportista desde Feed o Perfil
  const handleContactAthlete = async (athleteProfile: Profile) => {
    try {
      const chat = await supabaseService.getOrCreateChat(
        profile.id,
        athleteProfile.id,
        athleteProfile
      );
      setActiveChatId(chat.id);
      setCurrentTab('mensajes');
    } catch (err) {
      console.error('Error al contactar deportista:', err);
    }
  };

  // Acción: Ver perfil específico
  const handleViewProfile = (userId: string) => {
    setViewingUserId(userId);
    setCurrentTab('perfil');
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-slate-900 font-sans antialiased">
      {/* Sidebar Lateral Fija (Desktop & Tablet) */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          unreadMessagesCount={unreadMessagesCount}
          onSelectTab={(tab) => {
            if (tab === 'perfil') setViewingUserId(null); // Ver perfil propio
            setCurrentTab(tab);
          }}
        />
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-0">
        {currentTab === 'inicio' && (
          <FeedPage
            onContactAthlete={handleContactAthlete}
            onViewProfile={handleViewProfile}
            onNavigateToUpload={() => setCurrentTab('subir')}
          />
        )}

        {currentTab === 'descubrir' && (
          <SearchPage
            onViewProfile={handleViewProfile}
            onContactAthlete={handleContactAthlete}
          />
        )}

        {currentTab === 'perfil' && (
          <ProfilePage
            viewingUserId={viewingUserId}
            onContactAthlete={handleContactAthlete}
            onNavigateToFeed={() => setCurrentTab('inicio')}
          />
        )}

        {currentTab === 'subir' && (
          <UploadPage
            onPostCreated={() => {
              setCurrentTab('inicio');
            }}
          />
        )}

        {currentTab === 'mensajes' && (
          <MessagesPage initialChatId={activeChatId} />
        )}
      </main>

      {/* Navegación Inferior Responsive (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around py-2.5 z-40 shadow-lg">
        {[
          { id: 'inicio', label: 'Inicio', icon: Home },
          { id: 'descubrir', label: 'Descubrir', icon: Search },
          { id: 'perfil', label: 'Perfil', icon: User },
          { id: 'subir', label: 'Subir', icon: Upload },
          { id: 'mensajes', label: 'Mensajes', icon: MessageCircle },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'perfil') setViewingUserId(null);
                setCurrentTab(item.id);
              }}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[#1E3A8A]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {item.id === 'mensajes' && unreadMessagesCount > 0 && (
                  <span className="absolute -right-3 -top-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {messageNotification !== null && messageNotification > 0 && (
        <div className="fixed right-5 top-5 z-50 bg-[#1E3A8A] text-white rounded-xl px-4 py-3 shadow-xl text-xs font-semibold flex items-center gap-3">
          <MessageCircle className="w-4 h-4" />
          <span>Tienes {messageNotification} mensaje{messageNotification === 1 ? '' : 's'} sin leer</span>
          <button
            type="button"
            onClick={() => setMessageNotification(null)}
            className="text-white/70 hover:text-white text-lg leading-none"
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      )}

      {/* Modal de información de Supabase */}
      <SupabaseInfoModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
