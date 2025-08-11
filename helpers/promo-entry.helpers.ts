/**
 * Promo Entry Helpers
 * Utility functions untuk menangani promo entry dari QR scan
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
 * Generate URL untuk promo entry
 */
export const generatePromoEntryUrl = (promoId: string, baseUrl: string = 'https://promo.huehuy.com'): string => {
  return `${baseUrl}/entry?promoId=${promoId}`;
};

/**
 * Parse promo ID dari URL
 */
export const parsePromoIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('promoId');
  } catch (error) {
    return null;
  }
};

/**
 * Validasi format promo ID
 */
export const isValidPromoId = (promoId: string): boolean => {
  // Promo ID bisa berupa angka atau string alfanumerik
  return /^[a-zA-Z0-9\-_]+$/.test(promoId) && promoId.length >= 1 && promoId.length <= 50;
};
