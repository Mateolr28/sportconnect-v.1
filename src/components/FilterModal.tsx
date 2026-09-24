import React, { useState } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { FeedFilters } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FeedFilters;
  onApplyFilters: (filters: FeedFilters) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
}) => {
  const [deporte, setDeporte] = useState(currentFilters.deporte || 'Todos');
  const [minEdad, setMinEdad] = useState<number | undefined>(currentFilters.minEdad);
  const [maxEdad, setMaxEdad] = useState<number | undefined>(currentFilters.maxEdad);
  const [posicion, setPosicion] = useState(currentFilters.posicion || '');
  const [ubicacion, setUbicacion] = useState(currentFilters.ubicacion || '');

  if (!isOpen) return null;

  const sportsList = ['Todos', 'Fútbol', 'Baloncesto', 'Atletismo', 'Tenis', 'Natación', 'Voleibol', 'Fútbol Sala'];

  const handleApply = () => {
    onApplyFilters({
      ...currentFilters,
      deporte,
      minEdad,
      maxEdad,
      posicion,
      ubicacion,
    });
    onClose();
  };

  const handleReset = () => {
    setDeporte('Todos');
    setMinEdad(undefined);
    setMaxEdad(undefined);
    setPosicion('');
    setUbicacion('');
    onApplyFilters({
      searchQuery: '',
      deporte: 'Todos',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Filter className="w-5 h-5 text-[#1E3A8A]" />
            <span>Filtros de búsqueda</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Deporte */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Deporte
            </label>
            <div className="grid grid-cols-2 gap-2">
              {sportsList.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDeporte(s)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                    deporte === s
                      ? 'bg-[#10B981] text-white border-[#10B981] shadow-sm font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Rango de Edad */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Rango de edad
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Mínima</span>
                <input
                  type="number"
                  placeholder="Ej. 16"
                  min="12"
                  max="45"
                  value={minEdad || ''}
                  onChange={(e) => setMinEdad(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Máxima</span>
                <input
                  type="number"
                  placeholder="Ej. 24"
                  min="12"
                  max="45"
                  value={maxEdad || ''}
                  onChange={(e) => setMaxEdad(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>
          </div>

          {/* Posición */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Posición táctica
            </label>
            <input
              type="text"
              placeholder="Ej. Delantero, Mediocampista, Portero..."
              value={posicion}
              onChange={(e) => setPosicion(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              País o Ciudad
            </label>
            <input
              type="text"
              placeholder="Ej. Madrid, Barcelona, Valencia..."
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 text-xs font-semibold bg-[#1E3A8A] text-white hover:bg-blue-900 rounded-xl transition-colors shadow-sm"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
