import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { isValidPromoId, savePromoId, token_cookie_name } from '../../helpers';

export default function PromoDetailEntry() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { promoId } = router.query;
    
    if (!promoId) {
      // Jika tidak ada promoId, redirect ke app utama
      router.replace('/app');
      return;
    }

    // Cek apakah ini adalah promoId yang valid (untuk sistem baru)
    if (isValidPromoId(promoId)) {
      // Simpan promoId ke sessionStorage
      savePromoId(promoId);
      
      // Redirect ke halaman detail promo dengan communityId yang sesuai
      router.replace(`/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=promo-entry`);
    } else {
      // Jika tidak valid sebagai promoId, treat sebagai code (sistem lama)
      // Cek apakah user sudah login
      const userToken = Cookies.get(token_cookie_name);

      if (userToken) {
        // Jika sudah login, langsung redirect ke halaman promo
        router.replace(`/promo/${promoId}`);
      } else {
        // Jika belum login, redirect ke halaman quick entry (single page)
        router.replace(`/promo-entry/quick?code=${promoId}`);
      }
    }
  }, [router]);

  // Loading screen sementara redirect
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-500">Memproses...</p>
      </div>
    </div>
  );
}
