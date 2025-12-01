/* eslint-disable no-console */
import { faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import JoinRequestPopup from '../../../../components/construct.components/modal/JoinRequestPopup';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

export default function JoinCommunity() {
  const router = useRouter();
  const { communityId } = router.query;
  const [message, setMessage] = useState('Memproses join komunitas...');
  const [done, setDone] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const fromQR = router.query.from === 'qr';

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
        // 1) Ambil detail komunitas dengan auth agar dapat isJoined/hasRequested
        const communityRes = await fetch(`${apiBase}/api/communities/${communityId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!communityRes.ok) throw new Error('Gagal ambil data komunitas');

        const communityJson = await communityRes.json();
        const community = communityJson.data || communityJson;

        setCommunityName(community?.name || '');

        const isJoined = Boolean(community?.isJoined ?? community?.is_joined);
        const hasRequested = Boolean(community?.hasRequested ?? community?.has_requested);

        // 1a) Sudah member → untuk semua yang sudah joined masuk ke dashboard
        if (isJoined) {
          // Untuk semua member yang sudah joined (baik public maupun private), masuk ke dashboard
          router.replace(`/app/komunitas/dashboard/${communityId}`);
          return;
        }

        // 1b) Sudah request (pending) → tampilkan info menunggu
        if (hasRequested) {
          setMessage('Permintaan bergabung telah dikirim. Menunggu persetujuan admin.');
          setShowPopup(true);
          setDone(true);
          return;
        }

        // 2) Tentukan privacy
        const rawPrivacy = String(
          community?.privacy ?? community?.world_type ?? community?.type ?? ''
        ).toLowerCase();
        const privacy = rawPrivacy === 'pribadi' ? 'private' : (rawPrivacy || 'public');
        const isPrivate = privacy === 'private';

        // 3) Private → kirim join-request
        if (isPrivate) {
          const res = await fetch(`${apiBase}/api/communities/${communityId}/join-request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          let data = {};
          try { data = await res.json(); } catch { }
          console.log('Join request result:', data);

          setMessage('Permintaan bergabung telah dikirim. Menunggu persetujuan admin.');
          setShowPopup(true);
          setDone(true);
          return;
        }

        // 4) Public → coba join
        const joinRes = await fetch(`${apiBase}/api/communities/${communityId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (joinRes.ok) {
          // Broadcast agar daftar komunitas sinkron
          try {
            localStorage.setItem(
              'community:membership',
              JSON.stringify({
                id: Number(communityId),
                action: 'join',
                delta: +1,
                at: Date.now()
              })
            );
          } catch { }

          // Untuk public community yang berhasil join, langsung ke dashboard
          router.replace(`/app/komunitas/dashboard/${communityId}`);
          return;
        }

        // 4a) Tangani fallback error join
        let body = {};
        try { body = await joinRes.json(); } catch { }
        if (joinRes.status === 422 && (body?.already_joined || body?.message?.includes('sudah'))) {
          // Jika sudah joined, langsung ke dashboard
          router.replace(`/app/komunitas/dashboard/${communityId}`);
          return;
        }
        if (joinRes.status === 403 && body?.need_request) {
          // Server minta request join
          const reqRes = await fetch(`${apiBase}/api/communities/${communityId}/join-request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          // Abaikan hasil; tampilkan popup menunggu
          setMessage('Permintaan bergabung telah dikirim. Menunggu persetujuan admin.');
          setShowPopup(true);
          setDone(true);
          return;
        }

        setMessage(body?.message || 'Gagal bergabung ke komunitas.');
        setDone(true);
      } catch (err) {
        console.error(err);
        // Fallback terakhir: coba join langsung (tanpa info privacy)
        try {
          const res = await fetch(`${apiBase}/api/communities/${communityId}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            try {
              localStorage.setItem(
                'community:membership',
                JSON.stringify({
                  id: Number(communityId),
                  action: 'join',
                  delta: +1,
                  at: Date.now()
                })
              );
            } catch { }
            
            // Jika berhasil join, langsung ke dashboard
            router.replace(`/app/komunitas/dashboard/${communityId}`);
            return;
          }

          let body = {};
          try { body = await res.json(); } catch { }
          if (res.status === 403 && body?.need_request) {
            await fetch(`${apiBase}/api/communities/${communityId}/join-request`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            setMessage('Permintaan bergabung telah dikirim. Menunggu persetujuan admin.');
            setShowPopup(true);
            setDone(true);
            return;
          }
        } catch { }

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
            onClick={() => router.replace('/app/komunitas/komunitas')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/90 transition-all"
          >
            Kembali ke Daftar Komunitas
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
        onClose={() => router.replace(`/app/komunitas/komunitas`)}
        communityName={communityName}
      />
    </div>
  );
}
