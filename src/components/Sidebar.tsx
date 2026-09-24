import React, { useState } from 'react';
import { Home, User, Upload, MessageCircle, LogOut, RefreshCw, Dumbbell, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { INITIAL_PROFILES } from '../lib/mockData';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSupabaseModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenSupabaseModal }) => {
  const { profile, logout, switchDemoUser, isConfigured } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
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

      {/* Parte inferior: Indicador Supabase y Usuario activo */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* Badge de estado Supabase */}
        <button
          onClick={onOpenSupabaseModal}
          className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          title="Ver estado de conexión con Supabase"
        >
          <div className="flex items-center gap-2 text-slate-600">
            <Database className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="font-medium">Supabase Backend</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'
            }`}
          />
        </button>

        {/* Perfil del usuario activo */}
        <div className="relative">
          <div
            onClick={() => setShowSwitchMenu(!showSwitchMenu)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
          >
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
            <span title="Cambiar usuario">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </span>
          </div>

          {/* Menú desplegable para alternar rol / usuario de prueba */}
          {showSwitchMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 text-xs z-50">
              <p className="font-semibold text-slate-500 px-2 py-1 uppercase text-[10px] tracking-wider">
                Cambiar de rol / perfil:
              </p>
              {INITIAL_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    switchDemoUser(p.id);
                    setShowSwitchMenu(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    profile?.id === p.id ? 'bg-blue-50 text-[#1E3A8A] font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{p.nombre}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                    {p.rol}
                  </span>
                </button>
              ))}
              <div className="border-t border-slate-100 mt-2 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowSwitchMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
