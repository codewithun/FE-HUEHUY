import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { isValidPromoId, savePromoId, token_cookie_name } from '../../helpers';

export default function PromoEntryIndex() {
  const router = useRouter();

  useEffect(() => {
    const promoId = router.query.promoId;
    
    // Validasi dan simpan promoId ke sessionStorage jika ada dan valid
    if (promoId && isValidPromoId(promoId)) {
      savePromoId(promoId);
    }

    // Cek apakah user sudah login
    const userToken = Cookies.get(token_cookie_name);

    if (userToken) {
      // Jika sudah login, langsung redirect ke halaman detail promo
      if (promoId && isValidPromoId(promoId)) {
        router.replace(`/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=promo-entry`);
      } else {
        router.replace('/app');
      }
    } else {
      // Jika belum login, redirect ke halaman registrasi promo
      const redirectUrl = promoId && isValidPromoId(promoId)
        ? `/promo-entry/register?promoId=${promoId}` 
        : '/promo-entry/register';
      
      router.replace(redirectUrl);
    }
  }, [router]);

  // Loading screen sementara
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-500">Memuat halaman promo...</p>
      </div>
    </div>
  );
}
