/* eslint-disable no-console */
import { faFacebook, faTelegram, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import {
  faCheck,
  faChevronRight,
  faComments,
  faCopy,
  faLink,
  faQrcode,
  faShare,
  faSignOutAlt,
  faSpinner,
  faTimes,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import CommunityBottomBar from '../dashboard/CommunityBottomBar';

export default function CommunityProfile() {
  const router = useRouter();
  const { id, communityId: idFromQueryAlt } = router.query;
  const [isClient, setIsClient] = useState(false);
  const [routerReady, setRouterReady] = useState(false);

  // Modal states
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (router.isReady) setRouterReady(true);
  }, [router.isReady]);

 
  const [communityData, setCommunityData] = useState(null);
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  // -------------------------
  // User profile from backend
  // -------------------------
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatar: '/api/placeholder/80/80',
    promoCount: 0,
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // Ambil ID efektif dari query ('id' / 'communityId')
  const effectiveCommunityId = useMemo(() => {
    const take = (v) => (Array.isArray(v) ? v[0] : v || '');
    const fromQuery = take(id) || take(idFromQueryAlt);
    return fromQuery ? fromQuery.toString() : null;
  }, [id, idFromQueryAlt]);

  // Gradient murni dari warna BE (hapus semua dummy mapping kategori)
  const getCommunityGradient = (bgColor1, bgColor2) => {
    if (bgColor1 && bgColor2) {
      return { backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor2})` };
    }
    if (bgColor1) {
      return { backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor1}dd)` };
    }
    return { backgroundImage: 'linear-gradient(135deg, #16a34a, #059669)' };
  };

  // Fetch community data from API
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!effectiveCommunityId || !routerReady) return;
      
      try {
        setLoadingCommunity(true);
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : '';
        
        // Handle API URL properly - remove /api if it exists, then add it back
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const apiBase = baseUrl.replace(/\/api\/?$/, '');
        
        const response = await fetch(`${apiBase}/api/communities/${effectiveCommunityId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (response.ok) {
          const result = await response.json();
          const community = result.data || result;
          
          setCommunityData({
            id: community.id,
            name: community.name,
            description: community.description ?? '',
            members: community.members ?? 0,
            category: community.category ?? 'Umum',
            isOwner: false, // This would come from membership data
            isAdmin: false, // This would come from membership data  
            isJoined: true, // User is viewing profile, so they must be joined
            privacy: community.privacy ?? 'public',
            activePromos: community.activePromos ?? 0,
            totalEvents: community.totalEvents ?? 0,
            unreadMessages: 0, // This would come from chat/message API
            isVerified: community.isVerified ?? community.is_verified ?? false,
            avatar: community.logo ?? '/api/placeholder/80/80',
            bg_color_1: community.bg_color_1 ?? null,
            bg_color_2: community.bg_color_2 ?? null,
          });
        } else {
          setCommunityData(null);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
        setCommunityData(null);
      } finally {
        setLoadingCommunity(false);
      }
    };

    fetchCommunityData();
  }, [effectiveCommunityId, routerReady]);

  useEffect(() => {
    if (!isClient) return;

    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : null;

        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${apiUrl.replace(/\/$/, '')}/account`, {
          method: 'GET',
          headers
        });

        if (res.ok) {
          const json = await res.json().catch(() => null);
          const profile =
            json?.data?.profile || json?.data || json?.profile || json || {};
          setUserData({
            name: profile?.name || profile?.full_name || userData.name,
            email: profile?.email || profile?.contact_email || userData.email,
            avatar: profile?.picture_source || profile?.avatar || userData.avatar,
            promoCount: profile?.promoCount ?? userData.promoCount
          });
        }
      } catch {
        // noop
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  const menuItems = [
    {
      id: 'member-request',
      title: 'Minta Menjadi Member (Bisa Memiliki Kubus)',
      icon: faUsers,
      action: () => setShowMembershipModal(true),
      hasChevron: true
    },
    {
      id: 'chat-admin',
      title: 'Chat Admin Komunitas',
      icon: faComments,
      action: () => router.push(`/app/komunitas/admin-chat/${effectiveCommunityId}`),
      hasChevron: true
    },
    {
      id: 'share-community',
      title: 'Bagikan Komunitas',
      icon: faShare,
      action: () => handleShare(),
      hasChevron: true
    },
    {
      id: 'qr-community',
      title: 'QR Komunitas',
      icon: faQrcode,
      action: () => setShowQRModal(true),
      hasChevron: true
    }
  ];

  // Handler functions
  const handleMembershipRequest = async () => {
    setMembershipLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // no alert — just close
      setShowMembershipModal(false);
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleShare = async () => {
    if (!effectiveCommunityId || !communityData) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/app/komunitas/join/${communityData?.id || effectiveCommunityId}`;
    const shareText = `Bergabung dengan komunitas ${communityData.name} di HueHuy!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Komunitas ${communityData.name}`,
          text: shareText,
          url: shareUrl
        });
        return; // done
      } catch (error) {
        // if user cancels, just return silently; otherwise show modal fallback
        if (error?.name === 'AbortError') return;
      }
    }

    // Fallback: open share modal with options
    setShowShareModal(true);
  };

  const getSharePayload = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/app/komunitas/join/${communityData?.id || effectiveCommunityId}`;
    const title = `Komunitas ${communityData?.name ?? ''}`;
    const text = `Bergabung dengan komunitas ${communityData?.name ?? ''} di HueHuy!`;
    return { url, title, text };
  };

  const openShare = (platform) => {
    const { url, title, text } = getSharePayload();
    const enc = encodeURIComponent;
    let shareLink = '';

    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${enc(`${text} ${url}`)}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
        break;
      case 'x':
        shareLink = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${enc(title)}&body=${enc(`${text}\n\n${url}`)}`;
        break;
      default:
        shareLink = url;
    }

    try {
      if (platform === 'email') {
        window.location.href = shareLink;
      } else {
        window.open(shareLink, '_blank', 'noopener,noreferrer');
      }
    } catch {}
  };

  const copyLink = async () => {
    const { url } = getSharePayload();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      try {
        const el = document.createElement('textarea');
        el.value = url;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {}
    }
  };

  const handleLeaveCommunity = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeaveCommunity = async () => {
    if (!routerReady || !effectiveCommunityId) {
      // no alert, just bail
      return;
    }
    setLeaveLoading(true);
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const base = apiUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/communities/${effectiveCommunityId}/leave`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        // silently fail (no alert), re-enable button
        return;
      }

      // Broadcast ke halaman lain/tab: turunkan members -1 & isJoined=false
      try {
        localStorage.setItem(
          'community:membership',
          JSON.stringify({
            id: Number(effectiveCommunityId),
            action: 'leave',
            delta: -1,
            at: Date.now()
          })
        );
      } catch {}

      // tutup modal & pergi ke halaman komunitas
      setShowLeaveConfirm(false);
      router.replace('/app/komunitas/komunitas');
    } catch {
      // silent
    } finally {
      setLeaveLoading(false);
    }
  };

  // Loading state
  if (!isClient || !routerReady || loadingCommunity) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-3 text-sm text-slate-600">
                  Loading komunitas...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Community not found
  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-600">
                  Komunitas tidak ditemukan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get community background style
  const communityBgStyle = getCommunityGradient(
    communityData?.bg_color_1,
    communityData?.bg_color_2
  );

  return (
    <>
      <div className="relative lg:mx-auto lg:max-w-md min-h-screen" style={typeof communityBgStyle === 'object' ? communityBgStyle : {}}>
        {/* Dimmer overlay to ensure readability over strong backgrounds */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-0 pointer-events-none" />

        {/* Content */}
        <div className="px-6 pb-28 relative z-10">
          <div className="pt-6" />

          {/* Page title */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white drop-shadow-sm">Profile Komunitas</h1>
          </div>

          {/* User Profile Card (solid white for readability) */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
            <div className="flex items-center gap-4">
              {loadingProfile ? (
                <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                  <Image
                    src={
                      userData.avatar && userData.avatar !== '/api/placeholder/80/80'
                        ? userData.avatar
                        : '/avatar.jpg'
                    }
                    width={64}
                    height={64}
                    alt={userData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                {loadingProfile ? (
                  <div>
                    <div className="h-6 bg-slate-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-bold text-slate-800 text-lg mb-1">
                      {userData.name}
                    </h2>
                    <p className="text-slate-600 text-sm mb-2">
                      {userData.email}
                    </p>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-sm font-medium">
                    Iklan/Promo: {userData.promoCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Community Info Card (solid white) - description removed as per request */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-0">
              {communityData.name}
            </h2>
          </div>

          {/* Menu Items */}
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div key={item.id} onClick={item.action} className="cursor-pointer">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                        <FontAwesomeIcon icon={item.icon} className="text-slate-600 text-lg" />
                      </div>
                      <span className="font-medium text-slate-800">{item.title}</span>
                    </div>
                    {item.hasChevron && (
                      <FontAwesomeIcon icon={faChevronRight} className="text-slate-400 text-sm" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Leave Community Button */}
          <div className="mt-8">
            <button
              onClick={handleLeaveCommunity}
              disabled={!routerReady || !effectiveCommunityId || leaveLoading}
              className="w-full bg-red-50 text-red-700 rounded-lg p-4 border border-red-200 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center border border-red-200">
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-red-600 text-lg" />
                  </div>
                  <span className="font-medium text-red-700">Keluar Komunitas</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <CommunityBottomBar active={'profile'} communityId={effectiveCommunityId} />

        {/* Membership Request Modal */}
        {showMembershipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-neuro">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Permintaan Membership</h3>
                <p className="text-slate-600 text-sm">
                  Apakah Anda yakin ingin mengajukan permintaan untuk menjadi member komunitas {communityData.name}?{' '}
                  Sebagai member, Anda akan dapat memiliki kubus dan mendapat akses khusus.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowMembershipModal(false)}
                  className="flex-1 bg-gray-100 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  disabled={membershipLoading}
                >
                  Batal
                </button>
                <button
                  onClick={handleMembershipRequest}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  disabled={membershipLoading}
                >
                  {membershipLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      Kirim Permintaan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-neuro text-center">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800">Huehuy QR CODE</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
                </button>
              </div>

              <p className="text-sm text-slate-500 mb-3">
                QR Komunitas {communityData.name}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-center">
                <QRCodeSVG
                  value={`${window.location.origin}/app/komunitas/join/${communityData?.id || effectiveCommunityId || 'NO_CODE'}`}
                  size={180}
                  level="H"
                  bgColor="#f8fafc"
                  fgColor="#0f172a"
                  includeMargin={true}
                  className="mx-auto rounded-lg"
                />
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Kode QR ini untuk membagikan komunitas agar bisa dibuka oleh calon pengunjung!
              </p>
            </div>
          </div>
        )}

        {/* Share Modal (fallback when native share unavailable) */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-neuro">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-slate-800">Bagikan Komunitas</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Pilih platform untuk membagikan link komunitas {communityData?.name}.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button onClick={() => openShare('whatsapp')} className="flex flex-col items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200">
                  <FontAwesomeIcon icon={faWhatsapp} className="text-green-600 text-xl" />
                  <span className="text-xs text-green-700">WhatsApp</span>
                </button>
                <button onClick={() => openShare('telegram')} className="flex flex-col items-center gap-2 p-3 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200">
                  <FontAwesomeIcon icon={faTelegram} className="text-sky-600 text-xl" />
                  <span className="text-xs text-sky-700">Telegram</span>
                </button>
                <button onClick={() => openShare('facebook')} className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200">
                  <FontAwesomeIcon icon={faFacebook} className="text-blue-600 text-xl" />
                  <span className="text-xs text-blue-700">Facebook</span>
                </button>
                <button onClick={() => openShare('x')} className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200">
                  <FontAwesomeIcon icon={faXTwitter} className="text-gray-800 text-xl" />
                  <span className="text-xs text-gray-800">X/Twitter</span>
                </button>
                <button onClick={() => openShare('email')} className="flex flex-col items-center gap-2 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200">
                  <FontAwesomeIcon icon={faShare} className="text-amber-700 text-xl" />
                  <span className="text-xs text-amber-800">Email</span>
                </button>
                <button onClick={copyLink} className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200">
                  <FontAwesomeIcon icon={faCopy} className="text-slate-700 text-xl" />
                  <span className="text-xs text-slate-700">Salin Link</span>
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FontAwesomeIcon icon={faLink} className="text-slate-500" />
                  <span className="text-xs text-slate-600 truncate max-w-[15rem]">
                    {getSharePayload().url}
                  </span>
                </div>
                <button onClick={copyLink} className="text-xs font-medium text-primary hover:underline">
                  {copied ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave confirmation modal */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-neuro">
              <h3 className="text-lg font-bold mb-2">Keluar Komunitas</h3>
              <p className="text-sm text-slate-600 mb-4">
                Apakah Anda yakin ingin keluar dari komunitas ini? Anda akan kehilangan akses member.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 bg-gray-100 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200"
                  disabled={leaveLoading}
                >
                  Batal
                </button>
                <button
                  onClick={confirmLeaveCommunity}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                  disabled={leaveLoading}
                >
                  {leaveLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Keluar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
