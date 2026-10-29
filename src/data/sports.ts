export interface SportDefinition {
  name: string;
  categories: string[];
  specialties: string[];
  competitionModes: string[];
}

export const sportDefinitions: SportDefinition[] = [
  { name: 'Fútbol', categories: ['Fútbol 11', 'Fútbol 7', 'Fútbol playa'], specialties: ['Portero', 'Defensa central', 'Lateral', 'Mediocampista', 'Extremo', 'Delantero'], competitionModes: ['Liga', 'Torneo eliminatorio', 'Fase de grupos', 'Todos contra todos'] },
  { name: 'Baloncesto', categories: ['5x5', '3x3', 'Baloncesto juvenil'], specialties: ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'], competitionModes: ['Liga', 'Playoffs', 'Torneo 3x3', 'Fase de grupos'] },
  { name: 'Voleibol', categories: ['Voleibol sala', 'Voleibol playa', 'Voleibol juvenil'], specialties: ['Colocador', 'Líbero', 'Central', 'Punta', 'Opuesto'], competitionModes: ['Liga', 'Torneo', 'Fase de grupos', 'Eliminación directa'] },
  { name: 'Atletismo', categories: ['Velocidad', 'Medio fondo y fondo', 'Saltos', 'Lanzamientos', 'Pruebas combinadas'], specialties: ['100/200/400 m', '800/1500 m', 'Fondo', 'Saltos', 'Lanzamientos', 'Decatlón/Heptatlón'], competitionModes: ['Marca individual', 'Series y final', 'Heptatlón', 'Decatlón'] },
  { name: 'Natación', categories: ['Piscina', 'Aguas abiertas', 'Natación artística', 'Clavados'], specialties: ['Libre', 'Espalda', 'Braza', 'Mariposa', 'Combinado', 'Relevos'], competitionModes: ['Series y final', 'Contrarreloj', 'Relevos', 'Puntuación'] },
  { name: 'Ciclismo', categories: ['Ruta', 'Pista', 'Mountain bike', 'BMX'], specialties: ['Ruta', 'Contrarreloj', 'Velocidad', 'Fondo', 'Descenso', 'Freestyle'], competitionModes: ['Etapas', 'Contrarreloj', 'Carrera por puntos', 'Eliminación'] },
  { name: 'Tenis', categories: ['Individual', 'Dobles', 'Tenis de mesa'], specialties: ['Individual', 'Dobles', 'Saque', 'Fondo de pista'], competitionModes: ['Individual', 'Dobles', 'Round robin', 'Eliminación directa'] },
  { name: 'Béisbol', categories: ['Béisbol 9 entradas', 'Softbol', 'Béisbol juvenil'], specialties: ['Lanzador', 'Receptor', 'Infield', 'Outfield', 'Bateador designado'], competitionModes: ['Liga', 'Series', 'Playoffs', 'Torneo'] },
  { name: 'Boxeo', categories: ['Olímpico', 'Profesional', 'Amateur'], specialties: ['Peso ligero', 'Peso wélter', 'Peso mediano', 'Peso pesado'], competitionModes: ['Combate individual', 'Torneo eliminatorio', 'Liga', 'Puntuación'] },
  { name: 'Gimnasia', categories: ['Artística', 'Rítmica', 'Trampolín', 'Acrobática'], specialties: ['Suelo', 'Salto', 'Barras', 'Anillas', 'Viga', 'All-around'], competitionModes: ['Rutina individual', 'Equipos', 'All-around', 'Final por aparato'] },
  { name: 'Rugby', categories: ['Rugby 15', 'Rugby 7', 'Rugby playa'], specialties: ['Pilar', 'Hooker', 'Apertura', 'Centro', 'Ala', 'Zaguero'], competitionModes: ['Liga', 'Torneo', 'Fase de grupos', 'Eliminación directa'] },
  { name: 'Hockey', categories: ['Hockey sobre césped', 'Hockey sobre hielo', 'Hockey sala'], specialties: ['Portero', 'Defensa', 'Mediocampo', 'Delantero'], competitionModes: ['Liga', 'Torneo', 'Series', 'Eliminación directa'] },
  { name: 'Fútbol Sala', categories: ['Futsal 5x5', 'Futsal juvenil', 'Fútbol sala femenino'], specialties: ['Portero', 'Cierre', 'Ala', 'Pívot'], competitionModes: ['Liga', 'Torneo', 'Playoffs', 'Fase de grupos'] },
  { name: 'Otros', categories: ['Otra disciplina'], specialties: ['Otra especialidad'], competitionModes: ['Liga', 'Torneo', 'Marca individual', 'Otro'] },
];

export const sportNames = sportDefinitions.map(({ name }) => name);
export const getSportDefinition = (name: string) =>
  sportDefinitions.find((sport) => sport.name === name) || sportDefinitions[sportDefinitions.length - 1];

export const achievementSuggestionsBySport: Record<string, string[]> = {
  Fútbol: ['Campeón de liga', 'Máximo goleador', 'Mejor jugador del torneo', 'Campeón regional'],
  Baloncesto: ['MVP del torneo', 'Líder de asistencias', 'Campeón de liga', 'Mejor quinteto'],
  Voleibol: ['MVP del torneo', 'Campeón regional', 'Mejor bloqueador', 'Mejor sacador'],
  Atletismo: ['Medalla de oro', 'Récord personal', 'Campeón regional', 'Clasificación nacional'],
  Natación: ['Medalla de oro', 'Récord personal', 'Campeón regional', 'Clasificación nacional'],
  Ciclismo: ['Ganador de etapa', 'Podio general', 'Campeón regional', 'Mejor tiempo personal'],
  Tenis: ['Campeón de torneo', 'Finalista regional', 'Mejor ranking', 'Racha de victorias'],
  Béisbol: ['MVP del torneo', 'Campeón de liga', 'Mejor lanzador', 'Líder de bateo'],
  Boxeo: ['Campeón regional', 'Medalla de oro', 'Mejor combate', 'Campeón nacional'],
  Gimnasia: ['Medalla de oro', 'Campeón nacional', 'Mejor rutina', 'Finalista regional'],
  Rugby: ['Campeón de liga', 'MVP del torneo', 'Mejor try', 'Campeón regional'],
  Hockey: ['Campeón de liga', 'MVP del torneo', 'Mejor goleador', 'Mejor portero'],
  'Fútbol Sala': ['Campeón de liga', 'Máximo goleador', 'MVP del torneo', 'Campeón regional'],
};
