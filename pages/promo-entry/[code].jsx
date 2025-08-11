import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { token_cookie_name } from '../../helpers';

export default function PromoCodeHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { code } = router.query;
    
    if (!code) {
      // Jika tidak ada kode, redirect ke app utama
      router.replace('/app');
      return;
    }

    // Cek apakah user sudah login
    const userToken = Cookies.get(token_cookie_name);

    if (userToken) {
      // Jika sudah login, langsung redirect ke halaman promo
      router.replace(`/promo/${code}`);
    } else {
      // Jika belum login, redirect ke halaman quick entry (single page)
      router.replace(`/promo-entry/quick?code=${code}`);
    }
  }, [router]);

  // Loading screen sementara
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-500">Memproses kode promo...</p>
      </div>
    </div>
  );
}
