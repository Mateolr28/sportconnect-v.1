import React from 'react';
import { Home, User, Upload, MessageCircle, LogOut, Dumbbell, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { profile, logout } = useAuth();

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'descubrir', label: 'Descubrir', icon: Search },
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'subir', label: 'Subir video', icon: Upload },
    { id: 'mensajes', label: 'Mensajes', icon: MessageCircle },
  ];

  // Obtener iniciales del perfil
  const getInitials = (name?: string) => {
    if (!name) return 'SC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col justify-between z-30 select-none">
      {/* Parte superior: Logo y navegación */}
      <div>
        {/* Logo SportConnect */}
        <div className="p-6 pb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm">
            <Dumbbell className="w-5 h-5 -rotate-45" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">SportConnect</span>
        </div>

        {/* Links de navegación */}
        <nav className="px-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Parte inferior: Usuario activo */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* Perfil del usuario activo */}
        <div className="relative">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#0d9488] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {getInitials(profile?.nombre)}
            </div>
            <div className="overflow-hidden flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {profile?.nombre || 'Usuario'}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {profile?.rol || 'Deportista'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
