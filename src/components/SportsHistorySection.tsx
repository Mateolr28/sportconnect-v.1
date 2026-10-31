import React, { useEffect, useState } from 'react';
import { History, Plus, Trash2, Shield, Medal } from 'lucide-react';
import { SportsHistoryEntry, SportsHistoryType } from '../types';
import { supabaseService } from '../services/supabaseService';

interface SportsHistorySectionProps {
  userId: string;
  isOwnProfile: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const [year, month] = value.split('-');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${months[Number(month) - 1] || ''} ${year}`.trim();
};

const emptyForm = { tipo: 'equipo' as SportsHistoryType, titulo: '', detalle: '', fecha_inicio: '', fecha_fin: '' };

export const SportsHistorySection: React.FC<SportsHistorySectionProps> = ({ userId, isOwnProfile }) => {
  const [entries, setEntries] = useState<SportsHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    supabaseService
      .getSportsHistory(userId)
      .then((data) => isMounted && setEntries(data))
      .catch((err) => console.error('Error cargando historial deportivo:', err))
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.titulo.trim() || !form.fecha_inicio) {
      setError('Indica el nombre y la fecha de inicio.');
      return;
    }
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      setError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    setIsSaving(true);
    try {
      const created = await supabaseService.addSportsHistory(userId, {
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        detalle: form.detalle.trim() || null,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
      });
      setEntries((prev) => [created, ...prev].sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)));
      setForm(emptyForm);
      setIsFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entry: SportsHistoryEntry) => {
    if (!window.confirm('¿Eliminar este registro de tu historial?')) return;
    try {
      await supabaseService.deleteSportsHistory(entry.id, userId);
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar el registro.');
    }
  };

  if (!isOwnProfile && !isLoading && entries.length === 0) return null;

  const inputClass =
    'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30';

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#10B981]" />
          <h2 className="text-lg font-bold text-slate-900">Historial deportivo</h2>
        </div>
        {isOwnProfile && !isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-slate-600 space-y-1">
              Tipo
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as SportsHistoryType })}
                className={inputClass}
              >
                <option value="equipo">Equipo / club</option>
                <option value="torneo">Torneo</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600 space-y-1 sm:col-span-2">
              {form.tipo === 'equipo' ? 'Nombre del equipo' : 'Nombre del torneo'}
              <input
                type="text"
                maxLength={120}
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          <label className="text-xs font-semibold text-slate-600 space-y-1 block">
            {form.tipo === 'equipo' ? 'Rol o posición (opcional)' : 'Resultado o participación (opcional)'}
            <input
              type="text"
              maxLength={300}
              value={form.detalle}
              onChange={(e) => setForm({ ...form, detalle: e.target.value })}
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600 space-y-1">
              Desde
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 space-y-1">
              Hasta (vacío si continúa)
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setForm(emptyForm);
                setError('');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold bg-[#10B981] text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Cargando historial...</p>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 text-sm">
          Aún no has registrado equipos ni torneos. Agrega tu trayectoria para que los reclutadores la conozcan.
        </div>
      ) : (
        <ol className="relative border-l-2 border-slate-200 ml-3 space-y-4">
          {entries.map((entry) => {
            const Icon = entry.tipo === 'equipo' ? Shield : Medal;
            return (
              <li key={entry.id} className="ml-6">
                <span className="absolute -left-[13px] w-6 h-6 rounded-full bg-white border-2 border-[#10B981] text-[#10B981] flex items-center justify-center">
                  <Icon className="w-3 h-3" />
                </span>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{entry.titulo}</h3>
                      <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {entry.tipo === 'equipo' ? 'Equipo' : 'Torneo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(entry.fecha_inicio)} — {entry.fecha_fin ? formatDate(entry.fecha_fin) : 'Actualidad'}
                    </p>
                    {entry.detalle && <p className="text-sm text-slate-700 mt-1.5">{entry.detalle}</p>}
                  </div>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Eliminar registro"
                      aria-label="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
