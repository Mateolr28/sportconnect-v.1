import React, { useState } from 'react';
import { X, Database, Shield, CheckCircle2, AlertTriangle, Copy, Check } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseInfoModal: React.FC<SupabaseInfoModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const configured = isSupabaseConfigured();

  if (!isOpen) return null;

  const copyMigrationNote = () => {
    navigator.clipboard.writeText(
      `-- El script SQL completo está listo en supabase/migrations/0001_sportconnect_schema.sql y supabase/seed.sql`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Estado de Integración con Supabase</h3>
              <p className="text-xs text-slate-500">PostgreSQL • Auth • Storage • Realtime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-600 leading-relaxed">
          {/* Status banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              configured
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            {configured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">
                {configured
                  ? 'Conectado al proyecto de Supabase en Vivo'
                  : 'Modo Deportivo Activo con Soporte para Supabase'}
              </p>
              <p className="mt-1">
                {configured
                  ? 'Las operaciones de autenticación, base de datos y archivos se ejecutan directamente en tu instancia de Supabase.'
                  : 'La aplicación incluye toda la lógica de clientes Supabase, consultas PostgreSQL, políticas RLS y buckets de Storage. Al agregar las claves en .env o Secrets, se conectará inmediatamente.'}
              </p>
            </div>
          </div>

          {/* Componentes de Supabase utilizados */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Shield className="w-4 h-4 text-[#1E3A8A]" />
              Módulos Nativos de Supabase Implementados
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-[11px]">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <strong>Supabase Auth:</strong> Sesiones y Roles
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <strong>PostgreSQL:</strong> Perfiles, Posts, Likes, Chats
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <strong>Supabase Storage:</strong> sports-videos y avatars
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <strong>Supabase Realtime:</strong> Mensajería en vivo
              </li>
            </ul>
          </div>

          {/* Archivos SQL en el proyecto */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span>Archivos SQL provistos:</span>
              <button
                onClick={copyMigrationNote}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-emerald-400">/supabase/migrations/0001_sportconnect_schema.sql</p>
            <p className="text-blue-300">/supabase/seed.sql</p>
            <p className="text-slate-400">/supabase/config.toml</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1E3A8A] text-white hover:bg-blue-900 font-semibold rounded-xl text-xs transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
