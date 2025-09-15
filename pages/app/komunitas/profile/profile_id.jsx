/* eslint-disable no-console */
import {
  faCheck,
  faChevronRight,
  faComments,
  faCopy,
  faQrcode,
  faShare,
  faSignOutAlt,
  faSpinner,
  faTimes,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (router.isReady) setRouterReady(true);
  }, [router.isReady]);

  // Real community data from API
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
      action: () => router.push('/app/komunitas/scanner'),
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
    const shareUrl = `${window.location.origin}/app/komunitas/join/${effectiveCommunityId}`;
    const shareText = `Bergabung dengan komunitas ${communityData.name} di HueHuy!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Komunitas ${communityData.name}`,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        // silent fallback
        if (error?.name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(shareUrl);
          } catch {}
        }
      }
    } else {
      // silent fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
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
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="w-full bg-primary h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-2 text-sm drop-shadow-neuro">
                Loading komunitas...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Community not found
  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="w-full bg-primary h-32 flex items-center justify-center rounded-b-[40px] shadow-neuro">
            <div className="text-white text-center">
              <p className="mt-2 text-sm drop-shadow-neuro">
                Komunitas tidak ditemukan
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
        <div className="container mx-auto relative z-10 pb-28 min-h-screen">
          {/* Header dengan gradient */}
          <div className="w-full bg-primary relative overflow-hidden rounded-b-[40px] shadow-neuro">
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full opacity-10"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-full opacity-10"></div>
              <div className="absolute top-12 left-1/4 w-8 h-8 bg-white rounded-full opacity-10"></div>
            </div>

            <div className="relative px-6 py-6 text-white">
              {/* User Profile Card */}
              <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-neuro">
                <div className="flex items-center gap-4">
                  {loadingProfile ? (
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-neuro-in">
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
                        <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                    ) : (
                      <>
                        <h2 className="font-bold text-white text-lg mb-1 drop-shadow-neuro">
                          {userData.name}
                        </h2>
                        <p className="text-white text-opacity-80 text-sm mb-2 drop-shadow-neuro">
                          {userData.email}
                        </p>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-white text-opacity-90 text-sm font-medium drop-shadow-neuro">
                        Iklan/Promo: {userData.promoCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Title */}
              <div className="mb-4">
                <h3 className="text-white text-lg font-semibold drop-shadow-neuro">
                  Komunitas {communityData.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20">
            <div className="px-4 pt-6">
              {/* Menu Items */}
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div key={item.id} onClick={item.action} className="cursor-pointer">
                    <div className="bg-white rounded-xl p-4 shadow-neuro hover:scale-[1.01] transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shadow-neuro-in">
                            <FontAwesomeIcon icon={item.icon} className="text-slate-400 text-lg" />
                          </div>
                          <span className="font-medium text-slate-700">{item.title}</span>
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
                  className="w-full bg-red-50 text-red-700 rounded-xl p-4 shadow-neuro-in hover:scale-[1.01] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shadow-neuro-in">
                        <FontAwesomeIcon icon={faSignOutAlt} className="text-red-500 text-lg" />
                      </div>
                      <span className="font-medium text-red-700">Keluar Komunitas</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
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
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-neuro">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">QR Komunitas</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
                </button>
              </div>

              <div className="text-center">
                <div className="bg-gray-100 rounded-xl p-6 mb-4">
                  <div className="w-48 h-48 mx-auto bg-white rounded-lg p-4 shadow-neuro-in">
                    {/* QR Code placeholder - in real app this would be generated */}
                    <div className="w-full h-full bg-qr-pattern bg-center bg-no-repeat bg-contain"></div>
                    <style jsx>{`
                      .bg-qr-pattern {
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23000'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23fff'/%3E%3Crect x='30' y='10' width='10' height='10' fill='%23fff'/%3E%3Crect x='50' y='10' width='10' height='10' fill='%23fff'/%3E%3Crect x='70' y='10' width='10' height='10' fill='%23fff'/%3E%3Crect x='10' y='30' width='10' height='10' fill='%23fff'/%3E%3Crect x='30' y='30' width='10' height='10' fill='%23fff'/%3E%3Crect x='50' y='30' width='10' height='10' fill='%23fff'/%3E%3Crect x='70' y='30' width='10' height='10' fill='%23fff'/%3E%3C/svg%3E");
                      }
                    `}</style>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 mb-2">{communityData.name}</h4>
                <p className="text-slate-600 text-sm mb-4">Scan QR code ini untuk bergabung dengan komunitas</p>

                <button
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/app/komunitas/join/${effectiveCommunityId}`;
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                    } catch {}
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faCopy} />
                  Salin Link Komunitas
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
