// Fachada que reúne los servicios por dominio. Los componentes siguen usando `supabaseService`.
import { profileService } from './profileService';
import { postsService } from './postsService';
import { chatService } from './chatService';
import { storageService } from './storageService';
import { followService } from './followService';
import { historyService } from './historyService';
import { prospectsService } from './prospectsService';

export const supabaseService = {
  ...profileService,
  ...postsService,
  ...chatService,
  ...storageService,
  ...followService,
  ...historyService,
  ...prospectsService,
};
