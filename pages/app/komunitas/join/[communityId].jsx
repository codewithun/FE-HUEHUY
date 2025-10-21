import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../../helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function JoinCommunity() {
  const router = useRouter();
  const { communityId } = router.query;

useEffect(() => {
  if (!router.isReady) return; // pastikan query sudah siap

  const token = Cookies.get(token_cookie_name);
  if (!token) {
    router.replace(`/login?redirect=/app/komunitas/join/${router.query.communityId}`);
    return;
  }

  // Sudah login, langsung proses join
  router.replace(`/app/komunitas/profile/${router.query.communityId}`);
}, [router.isReady, router]);

 return (
  <div className="min-h-screen flex flex-col items-center justify-center text-center">
    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400 text-2xl mb-3" />
    <p>Memproses join komunitas...</p>
  </div>
);
}