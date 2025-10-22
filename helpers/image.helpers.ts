export function resolveUserImageUrl(user?: any): string {
  // Base API (e.g., http://localhost:8000 or https://api.domain.com)
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
  // Storage base is API base without trailing /api
  const storageBase = apiBase.replace(/\/api\/?$/, '');

  const src =
    user?.picture_source ||
    user?.picture ||
    user?.photo_url ||
    user?.avatar_url ||
    user?.avatar ||
    user?.image_url ||
    '';

  if (!src) return '';

  // If absolute URL (Google OAuth or already public), return as is
  if (/^https?:\/\//i.test(src)) return src;

  // Helper to safely encode only the path part (keep slashes)
  const encodePath = (p: string) => encodeURI(p.replace(/^\/+/, ''));

  // If already looks like /storage/... or storage/...
  if (/^\/?storage\//i.test(src)) {
    const clean = encodePath(src);
    return `${storageBase}/${clean}`.replace(/([^:]\/)\/+/, '$1');
  }

  // Otherwise, treat as relative path inside storage
  return `${storageBase}/storage/${encodePath(src)}`.replace(/([^:]\/)\/+/, '$1');
}
