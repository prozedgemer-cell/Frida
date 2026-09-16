import { useCallback, useEffect, useState } from 'react';
import {
  addImage,
  deleteImage,
  getImageBlob,
  listImages,
  type ImageSlot,
  type StoredImageMeta,
} from '../storage/imageStore';

export function useImageLibrary(slot: ImageSlot) {
  const [items, setItems] = useState<StoredImageMeta[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await listImages(slot);
      setItems(list);
      setUrls((prev) => {
        const keep = new Set(list.map((x) => x.id));
        for (const [id, url] of Object.entries(prev)) {
          if (!keep.has(id)) URL.revokeObjectURL(url);
        }
        return prev;
      });
      const next: Record<string, string> = {};
      for (const meta of list) {
        const blob = await getImageBlob(meta.id);
        if (blob) next[meta.id] = URL.createObjectURL(blob);
      }
      setUrls((prev) => {
        for (const url of Object.values(prev)) URL.revokeObjectURL(url);
        return next;
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke læse billeder');
    }
  }, [slot]);

  useEffect(() => {
    void refresh();
    return () => {
      setUrls((prev) => {
        for (const url of Object.values(prev)) URL.revokeObjectURL(url);
        return {};
      });
    };
  }, [refresh]);

  const add = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        await addImage(slot, file);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kunne ikke gemme billede');
      } finally {
        setBusy(false);
      }
    },
    [slot, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        await deleteImage(id);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kunne ikke slette');
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  return { items, urls, error, busy, add, remove, refresh };
}
