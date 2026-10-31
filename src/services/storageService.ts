import { supabase, isSupabaseConfigured } from '../lib/supabase';


export const storageService = {
  async uploadVideo(
    file: File,
    userId: string,
    onProgress?: (percent: number) => void,
    options?: { thumbnail?: Blob }
  ): Promise<{ url: string; path: string; thumbnailUrl?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop() || 'mp4';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        if (onProgress) onProgress(30);

        const { error: uploadError } = await supabase.storage
          .from('sports-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'video/mp4',
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('sports-videos')
          .getPublicUrl(filePath);

        let thumbnailUrl: string | undefined;
        if (options?.thumbnail) {
          const thumbnailPath = `${filePath.replace(/\.[^/.]+$/, '')}-thumbnail.jpg`;
          const { error: thumbnailError } = await supabase.storage
            .from('sports-videos')
            .upload(thumbnailPath, options.thumbnail, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/jpeg',
            });

          if (!thumbnailError) {
            const { data: thumbnailData } = supabase.storage
              .from('sports-videos')
              .getPublicUrl(thumbnailPath);
            thumbnailUrl = thumbnailData.publicUrl;
          }
        }

        if (onProgress) onProgress(100);

        return {
          url: publicData.publicUrl,
          path: filePath,
          thumbnailUrl,
        };
      } catch (err) {
        console.warn('Error subiendo video a Supabase Storage, usando blob/simulación:', err);
      }
    }

    // Modo simulación local con barra de progreso
    for (let p = 10; p <= 100; p += 20) {
      if (onProgress) onProgress(p);
      await new Promise((r) => setTimeout(r, 120));
    }

    const localUrl = URL.createObjectURL(file);
    return {
      url: localUrl,
      path: `simulated/${userId}/${file.name}`,
      thumbnailUrl: options?.thumbnail ? URL.createObjectURL(options.thumbnail) : undefined,
    };
  },

  async uploadImage(file: File, userId: string, onProgress?: (percent: number) => void): Promise<{ url: string; path: string }> {
    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        onProgress?.(30);
        const { error } = await supabase.storage.from('sports-videos').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });
        if (error) throw error;

        const { data } = supabase.storage.from('sports-videos').getPublicUrl(filePath);
        onProgress?.(100);
        return { url: data.publicUrl, path: filePath };
      } catch (err) {
        console.warn('Error subiendo imagen a Supabase Storage, usando blob local:', err);
      }
    }

    for (let p = 10; p <= 100; p += 20) {
      onProgress?.(p);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    return {
      url: URL.createObjectURL(file),
      path: `simulated/${userId}/${file.name}`,
    };
  },

  async uploadAvatar(file: File, userId: string): Promise<string> {
    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Actualizar tabla profiles
        await supabase.from('profiles').update({ avatar_url: publicData.publicUrl }).eq('id', userId);

        return publicData.publicUrl;
      } catch (err) {
        console.warn('Error subiendo avatar a Supabase Storage:', err);
      }
    }

    return URL.createObjectURL(file);
  },
};
