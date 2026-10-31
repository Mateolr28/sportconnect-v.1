import { Post, FeedFilters } from '../types';

export const normalizeSearchValue = (value?: string | number) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

export const postMatchesFilters = (post: Post, filters?: FeedFilters) => {
  if (!filters) return true;

  const athlete = post.athlete_info;
  const author = post.autor;
  const searchable = normalizeSearchValue([
    post.titulo,
    post.descripcion,
    post.deporte,
    author?.nombre,
    author?.primer_nombre,
    author?.segundo_nombre,
    author?.primer_apellido,
    author?.segundo_apellido,
    author?.ubicacion,
    author?.pais_nacimiento,
    author?.region_nacimiento,
    author?.ciudad_nacimiento,
    athlete?.disciplina,
    athlete?.posicion,
    athlete?.categoria,
    athlete?.especialidad,
    athlete?.modalidad_competencia,
    athlete?.club_actual,
    athlete?.academia,
  ].join(' '));
  const queryTerms = normalizeSearchValue(filters.searchQuery).split(/\s+/).filter(Boolean);
  const age = Number(athlete?.edad);
  const location = normalizeSearchValue([
    author?.ubicacion,
    author?.pais_nacimiento,
    author?.region_nacimiento,
    author?.ciudad_nacimiento,
  ].join(' '));

  return (!queryTerms.length || queryTerms.every((term) => searchable.includes(term)))
    && (!filters.deporte || filters.deporte === 'Todos' || normalizeSearchValue(post.deporte).includes(normalizeSearchValue(filters.deporte)))
    && (filters.minEdad === undefined || age >= filters.minEdad)
    && (filters.maxEdad === undefined || age <= filters.maxEdad)
    && (!filters.posicion || normalizeSearchValue(athlete?.posicion).includes(normalizeSearchValue(filters.posicion)))
    && (!filters.ubicacion || location.includes(normalizeSearchValue(filters.ubicacion)));
};
