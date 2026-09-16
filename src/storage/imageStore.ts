/** IndexedDB blob store for user-supplied photos (PWA, no backend). */

export type ImageSlot = 'profile' | 'outfit' | 'sex-straf' | 'calendar';

export interface StoredImageMeta {
  id: string;
  slot: ImageSlot;
  name: string;
  mime: string;
  createdAt: string;
}

interface StoredImageRecord extends StoredImageMeta {
  blob: Blob;
}

const DB_NAME = 'frida-images-v1';
const STORE = 'blobs';
const MAX_PER_SLOT = 16;
const MAX_EDGE = 1280;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('slot', 'slot', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listImages(slot?: ImageSlot): Promise<StoredImageMeta[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const os = tx.objectStore(STORE);
    const rows = (await reqToPromise(os.getAll())) as StoredImageRecord[];
    const mapped = rows
      .filter((r) => (slot ? r.slot === slot : true))
      .map(({ id, slot: s, name, mime, createdAt }) => ({
        id,
        slot: s,
        name,
        mime,
        createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return mapped;
  } finally {
    db.close();
  }
}

export async function getImageBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const row = (await reqToPromise(tx.objectStore(STORE).get(id))) as
      | StoredImageRecord
      | undefined;
    return row?.blob ?? null;
  } finally {
    db.close();
  }
}

async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file.slice(0, file.size, file.type || 'application/octet-stream');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82),
  );
  return blob ?? file;
}

export async function addImage(slot: ImageSlot, file: File): Promise<StoredImageMeta> {
  const existing = await listImages(slot);
  if (existing.length >= MAX_PER_SLOT) {
    throw new Error(`Maks ${MAX_PER_SLOT} billeder i denne slot.`);
  }
  const blob = await compress(file);
  const rec: StoredImageRecord = {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slot,
    name: file.name || 'foto',
    mime: blob.type || file.type || 'image/jpeg',
    createdAt: new Date().toISOString(),
    blob,
  };
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    await reqToPromise(tx.objectStore(STORE).put(rec));
  } finally {
    db.close();
  }
  const { blob: _b, ...meta } = rec;
  return meta;
}

export async function deleteImage(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    await reqToPromise(tx.objectStore(STORE).delete(id));
  } finally {
    db.close();
  }
}
