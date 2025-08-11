import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { isValidPromoId, savePromoId } from '../../helpers';

export default function PromoDetailEntry() {
  const router = useRouter();

  useEffect(() => {
    const { promoId } = router.query;
    
    if (promoId && isValidPromoId(promoId)) {
      // Simpan promoId ke sessionStorage
      savePromoId(promoId);
      
      // Redirect ke halaman detail promo dengan communityId yang sesuai
      router.replace(`/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=promo-entry`);
    } else {
      // Jika tidak ada promoId atau tidak valid, redirect ke app
      router.replace('/app');
    }
  }, [router]);

  // Loading screen sementara redirect
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-500">Memuat detail promo...</p>
      </div>
    </div>
  );
}
