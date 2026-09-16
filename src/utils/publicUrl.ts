/** Resolve a file under `public/` against Vite BASE_PATH. */
export function publicUrl(rel: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const path = rel.replace(/^\//, '');
  return `${base}${path}`;
}
