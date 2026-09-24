import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { UploadPage } from './pages/UploadPage';
import { MessagesPage } from './pages/MessagesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SupabaseInfoModal } from './components/SupabaseInfoModal';
import { supabaseService } from './services/supabaseService';
import { Profile } from './types';
import { Home, User, Upload, MessageCircle } from 'lucide-react';

function AppContent() {
  const { user, profile, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

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
          onSelectTab={(tab) => {
            if (tab === 'perfil') setViewingUserId(null); // Ver perfil propio
            setCurrentTab(tab);
          }}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
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
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

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
