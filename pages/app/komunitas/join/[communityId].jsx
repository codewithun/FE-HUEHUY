/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import JoinRequestPopup from '../../../../components/construct.components/modal/JoinRequestPopup';

export default function JoinCommunity() {
  const router = useRouter();
  const { communityId } = router.query;
  const [message, setMessage] = useState('Memproses join komunitas...');
  const [done, setDone] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [communityName, setCommunityName] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    const handleJoin = async () => {
      const tokenEnc = Cookies.get(token_cookie_name);
      if (!tokenEnc) {
        router.replace(`/login?redirect=/app/komunitas/join/${communityId}`);
        return;
      }

      const token = Decrypt(tokenEnc);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiBase = baseUrl.replace(/\/api\/?$/, '');

      try {
        // 1. Ambil detail komunitas dulu
        const communityRes = await fetch(`${apiBase}/api/communities/${communityId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!communityRes.ok) throw new Error('Gagal ambil data komunitas');

        const communityJson = await communityRes.json();
        const community = communityJson.data || communityJson;

        // 2. Cek jenis privacy (normalisasi agar tahan variasi nilai)
        const rawPrivacy = String(
          community?.privacy ?? community?.world_type ?? community?.type ?? ''
        ).toLowerCase();
        const isPrivate = rawPrivacy === 'private' || rawPrivacy === 'pribadi' ||
          community?.is_private === true || community?.private === true;

        if (isPrivate) {
          const res = await fetch(`${apiBase}/api/communities/${communityId}/join-request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          let data = {};
          try { data = await res.json(); } catch {}
          console.log('Join request result:', data);

          setCommunityName(community.name);
          setShowPopup(true);
          setMessage('Permintaan bergabung telah dikirim. Menunggu persetujuan admin.');
          setDone(true);
        } else {
          // langsung join
          await fetch(`${apiBase}/api/communities/${communityId}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          router.replace(`/app/komunitas/profile/${communityId}`);
        }
      } catch (err) {
        console.error(err);
        setMessage('Terjadi kesalahan, coba lagi nanti.');
        setDone(true);
      }
    };

    handleJoin();
  }, [router.isReady, router, communityId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      {done ? (
        <>
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl mb-3" />
          <p className="text-gray-700">{message}</p>
          <button
            onClick={() => router.replace(`/app/komunitas/profile/${communityId}`)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/90 transition-all"
          >
            Kembali ke Komunitas
          </button>
        </>
      ) : (
        <>
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400 text-2xl mb-3" />
          <p className="text-gray-700">{message}</p>
        </>
      )}
      <JoinRequestPopup
        show={showPopup}
        onClose={() => router.replace(`/app/komunitas/profile/${communityId}`)}
        communityName={communityName}
      />
    </div>
  );
}
