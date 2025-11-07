/**
 * Promo Entry Helpers
 * Utility functions untuk menangani promo entry dari QR scan
 * Mendukung promo dengan atau tanpa komunitas
 */

const PROMO_ID_KEY = 'huehuy_promo_id';
const OTP_SENT_KEY = 'last_otp_sent';
const OTP_TIME_KEY = 'otp_sent_time';

/**
 * Simpan promo ID ke sessionStorage
 */
export const savePromoId = (promoId: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(PROMO_ID_KEY, promoId);
  }
};

/**
 * Ambil promo ID dari sessionStorage
 */
export const getPromoId = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(PROMO_ID_KEY);
  }
  return null;
};

/**
 * Hapus promo ID dari sessionStorage
 */
export const clearPromoId = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PROMO_ID_KEY);
  }
};

/**
 * Cek apakah OTP sudah dikirim dalam waktu dekat (untuk mencegah spam)
 */
export const isOtpRecentlySent = (): { isSent: boolean; remainingTime: number } => {
  if (typeof window !== 'undefined') {
    const lastSent = sessionStorage.getItem(OTP_SENT_KEY);
    const sentTime = sessionStorage.getItem(OTP_TIME_KEY);
    
    if (lastSent && sentTime) {
      const timeDiff = Date.now() - parseInt(sentTime);
      const cooldownTime = 60000; // 60 detik
      
      if (timeDiff < cooldownTime) {
        return {
          isSent: true,
          remainingTime: Math.ceil((cooldownTime - timeDiff) / 1000)
        };
      }
    }
  }
  
  return { isSent: false, remainingTime: 0 };
};

/**
 * Tandai bahwa OTP sudah dikirim
 */
export const markOtpSent = (): void => {
  if (typeof window !== 'undefined') {
    const now = Date.now().toString();
    sessionStorage.setItem(OTP_SENT_KEY, now);
    sessionStorage.setItem(OTP_TIME_KEY, now);
  }
};

/**
 * Hapus marker OTP
 */
export const clearOtpMarker = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(OTP_SENT_KEY);
    sessionStorage.removeItem(OTP_TIME_KEY);
  }
};

/**
 * Generate URL halaman detail promo (bukan QR Entry)
 * Mendukung promo dengan atau tanpa komunitas
 * Catatan: Tambahkan flag autoRegister & source agar halaman detail tahu asalnya dari QR Scan
 */
export const generatePromoEntryUrl = (
  promoId: string,
  communityId?: string | null,
  baseUrl: string = 'https://v2.huehuy.com'
): string => {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  const qs = new URLSearchParams({ autoRegister: '1', source: 'qr_scan' });

  if (communityId) {
    qs.set('communityId', communityId);
  }

  return `${cleanBase}/app/komunitas/promo/${promoId}?${qs.toString()}`;
};

/**
 * Generate LINK QR-ENTRY untuk suatu promo.
 * Hasil akhirnya adalah: /qr-entry?qr_data=<encoded(detailPromoUrl)>
 * - Tidak wajib komunitas: jika communityId tidak diisi → promo umum tetap valid
 * - Jika ada communityId → tetap diteruskan sebagai query ke halaman promo
 * Opsi aman dipakai untuk membuat QR dari Kubus.
 */
export const generateQrEntryLinkForPromo = (
  promoId: string,
  communityId?: string | null,
  baseUrl: string = 'https://v2.huehuy.com'
): string => {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  // Tidak menambahkan autoClaim: user harus menekan tombol klaim sendiri di halaman promo
  const detailUrl = generatePromoEntryUrl(promoId, communityId, baseUrl);
  const encoded = encodeURIComponent(detailUrl);
  return `${cleanBase}/qr-entry?qr_data=${encoded}`;
};

/**
 * Helper membuat QR-entry link dengan base dari window.location.origin (jika di browser)
 */
export const generateSelfQrEntryLinkForPromo = (
  promoId: string,
  communityId?: string | null
): string | null => {
  if (typeof window === 'undefined') return null;
  const origin = window.location.origin.replace(/\/+$/, '');
  return generateQrEntryLinkForPromo(promoId, communityId || undefined, origin);
};

/**
 * Parse promo ID dan community ID dari URL
 */
export const parsePromoDataFromUrl = (url: string): { promoId: string | null; communityId: string | null } => {
  try {
    const urlObj = new URL(url);
    const promoId = urlObj.searchParams.get('promoId') || extractPromoIdFromPath(urlObj.pathname);
    const communityId = urlObj.searchParams.get('communityId');
    
    return { promoId, communityId };
  } catch (error) {
    return { promoId: null, communityId: null };
  }
};

/**
 * Helper: Extract promo ID dari path URL
 * Pattern: /app/komunitas/promo/{promoId}
 */
const extractPromoIdFromPath = (pathname: string): string | null => {
  const match = pathname.match(/\/app\/komunitas\/promo\/(\d+)/);
  return match ? match[1] : null;
};

/**
 * Validasi format promo ID
 */
export const isValidPromoId = (promoId: string): boolean => {
  // Promo ID bisa berupa angka atau string alfanumerik
  return /^[a-zA-Z0-9\-_]+$/.test(promoId) && promoId.length >= 1 && promoId.length <= 50;
};

/**
 * Cek apakah promo memerlukan membership komunitas
 * @param promoData - Data promo yang di-fetch dari API
 */
export const requiresCommunityMembership = (promoData: any): boolean => {
  // Promo memerlukan membership jika punya community_id
  return Boolean(promoData?.community_id || promoData?.rawCube?.community_id);
};

/**
 * Get community ID dari promo data
 */
export const getCommunityIdFromPromo = (promoData: any): string | null => {
  return promoData?.community_id || promoData?.rawCube?.community_id || null;
};
