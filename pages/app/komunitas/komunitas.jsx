import {
  faArrowLeft,
  faCheckCircle,
  faLock,
  faSearch,
  faTimes,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from "js-cookie";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import { token_cookie_name } from "../../../helpers";
import { Decrypt } from "../../../helpers/encryption.helpers";

/** =========================
 * Util API base
 * ========================= */
const getApiBase = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // pastikan tidak double /api
  return baseUrl.replace(/\/api\/?$/, "");
};

/** =========================
 * Logo URL builder (aman)
 * ========================= */
const buildLogoUrl = (apiUrl, logo) => {
  try {
    if (!logo) return null;
    if (/^https?:\/\//i.test(logo)) return logo; // already absolute

    const base = new URL(apiUrl);
    base.pathname = base.pathname.replace(/\/api\/?$/, "/");

    const cleanLogo = String(logo)
      .replace(/^\/+/, "")
      .replace(/^api\/storage\//, "storage/");

    const relative = cleanLogo.startsWith("storage/")
      ? `/${cleanLogo}`
      : `/storage/${cleanLogo}`;

    return new URL(relative, base).toString();
  } catch {
    return null;
  }
};

/** =========================
 * Auth header helper
 * ========================= */
const getAuthHeaders = () => {
  const encryptedToken = Cookies.get(token_cookie_name);
  const token = encryptedToken ? Decrypt(encryptedToken) : "";
  return {
    "Content-Type": "application/json",
    "Accept": "application/json", // <-- penting untuk Laravel
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/** =========================
 * API calls
 * ========================= */
const joinCommunityAPI = async (communityId) => {
  const apiUrl = getApiBase();
  const headers = getAuthHeaders();

  if (!("Authorization" in headers)) {
    throw new Error("Sesi habis. Silakan login ulang.");
  }

  const res = await fetch(`${apiUrl}/api/communities/${communityId}/join`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.error || 'Gagal bergabung dengan komunitas');
  }
  return res.json();
};

// Kirim permintaan bergabung (untuk komunitas private)
const requestJoinCommunityAPI = async (communityId) => {
  const apiUrl = getApiBase();
  const headers = getAuthHeaders();

  if (!("Authorization" in headers)) {
    throw new Error("Sesi habis. Silakan login ulang.");
  }

  // Coba beberapa endpoint umum: pilih yang tersedia di backend
  const candidates = [
    { url: `${apiUrl}/api/communities/${communityId}/join-request`, method: 'POST', body: undefined },
    { url: `${apiUrl}/api/member-requests`, method: 'POST', body: JSON.stringify({ community_id: communityId }) },
  ];

  let lastErr;
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, { method: c.method, headers, body: c.body });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        lastErr = new Error(err?.message || err?.error || `Gagal mengirim permintaan bergabung (${res.status})`);
        continue;
      }
      return await res.json().catch(() => ({}));
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Gagal mengirim permintaan bergabung');
};

/**
 * @typedef {Object} CommunityItem
 * @property {number} id
 * @property {string} name
 * @property {string=} description
 * @property {string=} category
 * @property {string|null=} logo
 * @property {'public'|'private'|string=} privacy
 * @property {boolean=} is_verified
 * @property {boolean=} isVerified
 * @property {boolean|number=} is_joined
 * @property {boolean|number=} isJoined
 * @property {number|string=} members
 * @property {number=} activePromos
 * @property {boolean=} is_active
 */

/** Normalisasi bentuk respons dari backend menjadi array CommunityItem */
const normalizeCommunities = (raw) => {
  // backend kita sekarang balikin { data: [...] }, tapi handle array langsung
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  return list.map((c) => {
    // Normalisasi privacy dari beberapa kemungkinan field
    const privacyRaw = c.privacy ?? c.world_type ?? c.type ?? 'public';
    const privacyStr = String(privacyRaw || '').toLowerCase();

    // Hanya "private" yang benar-benar private. "pribadi" tidak lagi dianggap private.
    let privacy = (privacyStr === 'private') ? 'private' : (privacyStr || 'public');

    // Tetap hormati flag boolean is_private/private bila ada.
    const isPrivateFlag = (c.is_private ?? c.private);
    if (typeof isPrivateFlag !== 'undefined') {
      const b = typeof isPrivateFlag === 'number' ? Boolean(isPrivateFlag) : Boolean(isPrivateFlag);
      if (b) privacy = 'private';
    }

    const isJoinedRaw = c.isJoined ?? c.is_joined ?? false;
    const isJoined = typeof isJoinedRaw === 'number'
      ? Boolean(isJoinedRaw)
      : Boolean(isJoinedRaw);

    const hasRequestedRaw = c.hasRequested ?? c.has_requested ?? c.requestPending ?? false;
    const hasRequested = typeof hasRequestedRaw === 'number'
      ? Boolean(hasRequestedRaw)
      : Boolean(hasRequestedRaw);

    const membersNum = Number(c.members ?? 0);
    // Normalisasi status aktif
    const isActive = (typeof c?.is_active === 'boolean')
      ? c.is_active
      : (typeof c?.is_active === 'number' ? c.is_active > 0 : undefined);
    return {
      id: Number(c.id),
      name: String(c.name ?? ''),
      description: c.description ?? '',
      category: c.category ?? '',
      logo: c.logo ?? null,
      privacy,
      isVerified: Boolean(c.isVerified ?? c.is_verified ?? false),
      isJoined,
      hasRequested,
      members: Number.isFinite(membersNum) ? membersNum : 0,
      activePromos: Number(c.activePromos ?? 0),
      is_active: isActive,
    };
  });
};

const fetchCommunitiesWithMembership = async () => {
  const apiUrl = getApiBase();
  const headers = getAuthHeaders();

  if (!("Authorization" in headers)) {
    // biar FE bisa fallback ke tampilan kosong tanpa crash
    return [];
  }

  const candidates = [
    `${apiUrl}/api/communities/with-membership`,     // utama (auth)
    `${apiUrl}/api/admin/communities/with-membership`, // fallback admin (kalau diset)
    `${apiUrl}/api/admin/communities`,               // fallback list admin
    `${apiUrl}/api/communities`,                     // fallback list public
  ];

  const tryFetch = async (url) => {
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  };

  for (const url of candidates) {
    const data = await tryFetch(url);
    if (!data) continue;

    // bentuk standar
    const normalized = normalizeCommunities(data);

    // kalau ini endpoint utama (with-membership), biasanya sudah ada isJoined
    if (url.endsWith('/with-membership')) {
      return normalized;
    }

    // kalau bukan, mungkin belum ada isJoined → biarkan fallback di bawah yang ngisi dari user-communities
    if (normalized.length) {
      // coba lengkapi membership dari /user-communities
      try {
        const ucRes = await fetch(`${apiUrl}/api/communities/user-communities`, { headers });
        if (ucRes.ok) {
          const ucData = await ucRes.json().catch(() => ({}));
          const userCommunities = normalizeCommunities(ucData);
          const userIds = new Set(userCommunities.map(u => u.id));
          return normalized.map(c => ({
            ...c,
            isJoined: userIds.has(c.id),
          }));
        }
      } catch {}
      return normalized;
    }
  }

  return [];
};

/** =========================
 * Komponen utama
 * ========================= */
export default function Komunitas() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  /** Fetch communities (dibungkus useCallback supaya jadi stable dependency) */
  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchCommunitiesWithMembership();
      // build absolute logo url disini biar 1x proses
      const apiBase = getApiBase();
      const processed = list.map(c => ({
        ...c,
        logo: buildLogoUrl(apiBase, c.logo || undefined),
      }));
      setCommunities(processed);
    } catch {
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  /** ====== SYNC lintas halaman/tab & saat balik fokus ====== */
  useEffect(() => {
    // Saat tab lain mengubah membership (emit via localStorage), kita update lokal
    const onStorage = (e) => {
      if (e.key !== 'community:membership' || !e.newValue) return;
      try {
        const data = JSON.parse(e.newValue);
        const { id, action, delta } = data || {};
        if (!id) return;

        setCommunities(prev =>
          prev.map(c => {
            if (c.id !== Number(id)) return c;
            const d = Number.isFinite(delta) ? delta : (action === 'join' ? +1 : -1);
            const nextMembers = Math.max(0, (c.members || 0) + d);
            return {
              ...c,
              isJoined: action === 'join',
              members: nextMembers,
            };
          })
        );
      } catch {}
    };

    // Saat user balik ke tab ini → refetch biar pasti akurat
    const onFocusOrVisible = () => {
      if (!document.hidden) fetchCommunities();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [fetchCommunities]);

  const filteredCommunities = useMemo(() => {
    let data = [...communities];

    // Tampilkan hanya komunitas aktif (is_active === true). Jika field tidak ada, biarkan tampil.
    data = data.filter((c) => (c.is_active === undefined ? true : Boolean(c.is_active)));

    if (activeTab === 'komunitasku') {
      data = data.filter(c => Boolean(c.isJoined));
    } else if (activeTab === 'belum-gabung') {
      data = data.filter(c => !c.isJoined);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.category ?? '').toLowerCase().includes(q)
      );
    }

    return data;
  }, [communities, activeTab, searchQuery]);

  const handleOpenCommunity = (communityId) => {
    router.push(`/app/komunitas/dashboard/${communityId}`);
  };

  const formatNumber = (num) => {
    if (!isClient) return num ? String(num) : "0";
    if (typeof num !== "number" || Number.isNaN(num)) return "0";
    return num.toLocaleString('id-ID');
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 pb-28">
          {/* Header */}
          <div className="w-full bg-primary relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-16 h-16 bg-cyan-400 rounded-full opacity-15"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 bg-teal-300 rounded-full opacity-10"></div>
              <div className="absolute top-12 left-1/4 w-8 h-8 bg-cyan-300 rounded-full opacity-15"></div>
            </div>

            <div className="relative px-4 py-6 text-white">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Link href="/app">
                    <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
                  </Link>
                  <h1 className="text-xl font-bold">Komunitas</h1>
                </div>
              </div>

              {/* Ilustrasi */}
              <div className="flex items-center justify-center py-6 relative">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-8 h-8 bg-orange-200 rounded-full"></div>
                    </div>
                    <div className="absolute -top-6 -left-1 bg-white text-primary px-2 py-1 rounded-lg text-xs shadow-sm">
                      💬
                    </div>
                  </div>

                  <div className="relative">
                    <div className="w-18 h-18 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-12 h-12 bg-blue-200 rounded-full"></div>
                    </div>
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                      ADS
                    </div>
                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-primary px-2 py-1 rounded-lg text-xs shadow-sm">
                      👑
                    </div>
                  </div>

                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="absolute -top-6 -right-1 bg-white text-primary px-2 py-1 rounded-lg text-xs shadow-sm">
                      📋
                    </div>
                  </div>
                </div>

                <div className="absolute top-2 left-6 bg-blue-400 text-white p-1.5 rounded-lg text-xs shadow-sm">
                  👍
                </div>
                <div className="absolute bottom-2 right-6 bg-green-400 text-white p-1.5 rounded-lg text-xs shadow-sm">
                  📢
                </div>
              </div>

              <div className="text-center mt-6 mb-4">
                <p className="text-lg font-semibold text-white drop-shadow-md">
                  Lebih mudah berbagi promo sesama anggota komunitas
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
            <div className="relative -top-5 px-4">
              <div className="mb-6">
                <div className="w-full bg-white border border__primary px-6 py-4 rounded-[20px] flex justify-between items-center shadow-sm">
                  <input
                    type="text"
                    placeholder="Cari komunitas?..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none bg-transparent"
                  />
                  <FontAwesomeIcon icon={faSearch} className="text__primary" />
                </div>
              </div>
            </div>

            <div className="px-4 pb-6">
              <div className="flex mb-4 border-b border-slate-200">
                <button
                  className={`px-4 py-2 ${activeTab === 'semua' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('semua')}
                >
                  Semua
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'komunitasku' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('komunitasku')}
                >
                  Komunitasku
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'belum-gabung' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('belum-gabung')}
                >
                  Belum Gabung
                </button>
              </div>

              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-slate-900 text-lg font-semibold">Komunitas Lainnya</h2>
                  <p className="text-slate-600 text-sm">Temukan komunitas baru yang menarik</p>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div>Loading komunitas...</div>
                  ) : (
                    filteredCommunities.map((community) => (
                      <CommunityCard
                        key={community.id}
                        community={community}
                        type={community.isJoined ? 'joined' : 'notJoined'}
                        onOpenCommunity={handleOpenCommunity}
                        formatNumber={formatNumber}
                        refreshCommunities={fetchCommunities}
                        setActiveTab={setActiveTab}
                        onShowJoinPopup={(c) => {
                          setSelectedCommunity(c);
                          setShowJoinPopup(true);
                        }}
                        // ====== Tambahkan updater agar parent bisa update state setelah join ======
                        onApplyDelta={(id, joinOrLeave, delta) => {
                          setCommunities(prev => prev.map(item => {
                            if (item.id !== id) return item;
                            const d = Number.isFinite(delta) ? delta : (joinOrLeave === 'join' ? +1 : -1);
                            return {
                              ...item,
                              isJoined: joinOrLeave === 'join',
                              members: Math.max(0, (item.members || 0) + d),
                            };
                          }));
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Popup */}
        {showJoinPopup && selectedCommunity && (
          <JoinConfirmationPopup
            community={selectedCommunity}
            isPrivate={String(selectedCommunity?.privacy || '').toLowerCase() === 'private'}
            onConfirm={async () => {
              try {
                const isPriv = String(selectedCommunity?.privacy || '').toLowerCase() === 'private';
                if (isPriv) {
                  await requestJoinCommunityAPI(selectedCommunity.id);
                  setShowJoinPopup(false);
                  setSelectedCommunity(null);

                  // Tandai sebagai sudah mengirim permintaan (pending)
                  setCommunities(prev => prev.map(c => (
                    c.id === selectedCommunity.id ? { ...c, hasRequested: true } : c
                  )));

                  alert('Permintaan bergabung terkirim. Menunggu persetujuan admin.');
                } else {
                  await joinCommunityAPI(selectedCommunity.id);
                  setShowJoinPopup(false);
                  setSelectedCommunity(null);

                  // Optimistic + update angka members
                  setCommunities(prev =>
                    prev.map(c =>
                      c.id === selectedCommunity.id
                        ? { ...c, isJoined: true, members: Math.max(0, (c.members || 0) + 1) }
                        : c
                    )
                  );
                  setActiveTab('komunitasku');

                  // Broadcast ke tab/halaman lain
                  localStorage.setItem(
                    'community:membership',
                    JSON.stringify({ id: selectedCommunity.id, action: 'join', delta: +1, at: Date.now() })
                  );
                }
              } catch (error) {
                alert(error?.message || (String(selectedCommunity?.privacy || '').toLowerCase() === 'private' ? 'Gagal mengirim permintaan bergabung' : 'Gagal bergabung'));
                setShowJoinPopup(false);
                setSelectedCommunity(null);
              }
            }}
            onCancel={() => {
              setShowJoinPopup(false);
              setSelectedCommunity(null);
            }}
          />
        )}

        <BottomBarComponent active={'community'} />
      </div>
    </>
  );
}

/** =========================
 * Join Confirmation Popup
 * ========================= */
function JoinConfirmationPopup({
  community,
  isPrivate,
  onConfirm,
  onCancel,
}) {
  const [isJoining, setIsJoining] = useState(false);

  const handleConfirm = async () => {
    setIsJoining(true);
    try {
      await onConfirm();
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">{isPrivate ? 'Minta Bergabung' : 'Bergabung Komunitas'}</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {community.logo && /^https?:\/\/[^ "]+$/.test(community.logo) ? (
              <Image
                src={community.logo}
                width={48}
                height={48}
                alt="Community Logo"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {community.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{community.name}</h4>
            <p className="text-sm text-slate-600">{(community.members ?? 0).toString()} anggota</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-slate-700 text-center leading-relaxed">
            {isPrivate ? (
              <>Kirim permintaan untuk bergabung ke komunitas <span className="font-semibold">{community.name}</span>. Permintaan Anda akan menunggu persetujuan admin.</>
            ) : (
              <>Apakah Anda yakin ingin bergabung dengan komunitas <span className="font-semibold">{community.name}</span>?</>
            )}
          </p>
          <div className="mt-4 bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600" />
              <span>{isPrivate ? 'Permintaan akan muncul pada daftar persetujuan admin.' : 'Anda akan mendapatkan akses ke promo eksklusif komunitas'}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isJoining}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {isPrivate ? 'Mengirim...' : 'Bergabung...'}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUsers} />
                {isPrivate ? 'Kirim Permintaan' : 'Bergabung'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** =========================
 * Community Card
 * ========================= */
function CommunityCard({
  community,
  onOpenCommunity,
  formatNumber,
  onShowJoinPopup,
}) {
  const [isJoined, setIsJoined] = useState(Boolean(community.isJoined));
  const isPrivate = String(community.privacy || '').toLowerCase() === 'private';
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    const next = Boolean(community.isJoined);
    if (next && !isJoined) {
      setJustJoined(true);
      setTimeout(() => setJustJoined(false), 2000);
    }
    setIsJoined(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community.isJoined]);

  const handleClickCard = () => onOpenCommunity(community.id);

  const handleJoinCommunity = (e) => {
    e.stopPropagation();
    if (isJoined || community.hasRequested) return;
    onShowJoinPopup(community);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Shopping': 'bg-purple-100 text-purple-800',
      'Event': 'bg-blue-100 text-blue-800',
      'Kuliner': 'bg-orange-100 text-orange-800',
      'Otomotif': 'bg-gray-100 text-gray-800',
      'Fashion': 'bg-pink-100 text-pink-800',
      'Hobi': 'bg-green-100 text-green-800',
      'Bisnis': 'bg-indigo-100 text-indigo-800',
      'Kesehatan': 'bg-red-100 text-red-800',
      'Teknologi': 'bg-cyan-100 text-cyan-800',
      'Travel': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      className={`bg-white bg-opacity-60 backdrop-blur-sm rounded-[15px] p-4 shadow-sm border transition-all duration-300 ${
        justJoined
          ? 'border-green-300 bg-green-50 shadow-md'
          : isJoined
            ? 'border-primary bg-primary/5 hover:shadow-md cursor-pointer'
            : isPrivate && !community.hasRequested
              ? 'border-slate-200 hover:shadow-md cursor-pointer'
              : 'border-slate-200 cursor-default'
      }`}
      onClick={() => {
        if (isJoined) return handleClickCard();
        if (isPrivate && !community.hasRequested) return onShowJoinPopup(community);
      }}
      aria-disabled={!isJoined}
      title={
        isJoined
          ? undefined
          : isPrivate
            ? (community.hasRequested ? 'Permintaan bergabung menunggu persetujuan' : 'Komunitas privat — klik untuk minta bergabung')
            : 'Gabung dulu untuk membuka komunitas'
      }
    >
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {community.logo && /^https?:\/\/[^ "]+$/.test(community.logo) ? (
            <Image
              src={community.logo}
              width={48}
              height={48}
              alt="Community Logo"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {community.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-slate-900 text-sm truncate pr-2">
              {community.name}
              {justJoined && <span className="ml-2 text-xs text-green-600 font-medium">✓ Bergabung!</span>}
            </h3>
            <div className="flex items-center gap-2">
              {community.isVerified && <span className="text-blue-500 text-xs">✓</span>}
              {community.privacy === 'private' && (
                <span className="text-gray-300 text-xs" title="Komunitas privat">
                  <FontAwesomeIcon icon={faLock} />
                </span>
              )}
            </div>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed mb-2">
            {community.description || '-'}
          </p>

          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(community.category)}`}>
              {community.category || 'Umum'}
            </span>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{formatNumber(community.members)} anggota</span>
              {isJoined ? (
                <div className="flex items-center gap-1">
                  <span className="text-primary font-medium">
                    {community.activePromos || 0} promo
                  </span>
                  <span className="text-green-600 text-sm">✓</span>
                </div>
              ) : (
                community.hasRequested ? (
                  <button
                    disabled
                    className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-medium cursor-not-allowed"
                    title="Menunggu persetujuan admin"
                  >
                    Menunggu Persetujuan
                  </button>
                ) : (
                  <button
                    onClick={handleJoinCommunity}
                    className="bg-primary text-white px-3 py-1 rounded-full font-medium hover:bg-primary/90 transition-colors"
                  >
                    {isPrivate ? 'Minta Bergabung' : 'Gabung'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
