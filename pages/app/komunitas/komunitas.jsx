/* eslint-disable no-console */
import {
  faArrowLeft,
  faCheckCircle,
  faClock,
  faGlobe,
  faLock,
  faPlus,
  faSearch,
  faTags,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from "js-cookie";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import FlexibleNotification from '../../../components/construct.components/notification/FlexibleNotification';
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
    const errBody = await res.json().catch(() => ({}));
    const error = new Error(errBody?.message || errBody?.error || 'Gagal bergabung dengan komunitas');
    // sematkan properti tambahan supaya caller bisa memutuskan fallback
    error.code = res.status;
    if (errBody && typeof errBody === 'object') {
      try { Object.assign(error, errBody); } catch {}
    }
    throw error;
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

  // Selaraskan dengan backend: treat 'pribadi' as private
  let privacy = privacyStr === 'pribadi' ? 'private' : (privacyStr || 'public');

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
      bg_color_1: c.bg_color_1 ?? null,
      bg_color_2: c.bg_color_2 ?? null,
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
  
  // Notification states
  const [notification, setNotification] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    actionText: '',
    onAction: null
  });

  const showNotification = (config) => {
    setNotification({
      show: true,
      ...config
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

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
      // Termasuk yang sudah request (pending) sebagai bagian dari komunitas saya
      data = data.filter(c => Boolean(c.isJoined) || Boolean(c.hasRequested));
    } else if (activeTab === 'belum-gabung') {
      // Tersedia = belum bergabung dan belum request
      data = data.filter(c => !c.isJoined && !c.hasRequested);
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

  // Hitung statistik ringkas: gabungkan pending sebagai "Bergabung" (sudah ajukan)
  const stats = useMemo(() => {
    const joined = communities.filter(c => Boolean(c.isJoined) || Boolean(c.hasRequested)).length;
    const available = communities.filter(c => !c.isJoined && !c.hasRequested).length;
    return { joined, available };
  }, [communities]);

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
          <div className="relative">
            {/* Banner (centered) */}
            <div className="w-full aspect-[16/6] overflow-hidden bg-gradient-to-r from-[#5a6e1d] to-[#7a8e3a] flex items-center justify-center z-10" />
            {/* Glass header overlay at top-left */}
            <div className="absolute top-3 left-4 z-30">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/25 backdrop-blur-md border border-white/40 shadow-sm">
                <Link href="/app" title="Kembali" className="text-white">
                  <FontAwesomeIcon icon={faArrowLeft} className="text-base" />
                </Link>
                <h1 className="text-sm font-semibold text-white drop-shadow-sm">Kelola Komunitas</h1>
              </div>
            </div>
          </div>

          <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-4 relative z-20 bg-gradient-to-br from-cyan-50">
            <div className="relative -top-4 px-4">
              <div className="bg-white border border__primary rounded-[20px] flex items-center overflow-hidden">
                <div className="flex-1">
                  <div className="px-6 py-3 flex items-center gap-3">
                    <FontAwesomeIcon icon={faSearch} className="text__primary" />
                    <input
                      type="text"
                      placeholder="Cari komunitas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-transparent border-b border-[#cdd0b3]">
              <div className="px-4">
                <div className="flex space-x-8">
                  <button
                    className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'semua'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => setActiveTab('semua')}
                  >
                    Semua Komunitas
                  </button>
                  <button
                    className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'komunitasku'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => setActiveTab('komunitasku')}
                  >
                    Komunitas Saya
                  </button>
                  <button
                    className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'belum-gabung'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => setActiveTab('belum-gabung')}
                  >
                    Tersedia
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 py-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#d8d8d8] bg-[#5a6e1d]/5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-[#5a6e1d] text-white">
                      <FontAwesomeIcon icon={faUsers} className="text-sm" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[#3f4820]">Bergabung</p>
                      <p className="text-lg font-semibold text-slate-900">{stats.joined}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#d8d8d8] bg-[#5a6e1d]/5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-[#7a8e3a] text-white">
                      <FontAwesomeIcon icon={faGlobe} className="text-sm" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[#3f4820]">Tersedia</p>
                      <p className="text-lg font-semibold text-slate-900">{stats.available}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-slate-900 text-lg font-semibold">
                    {activeTab === 'semua' ? 'Semua Komunitas' :
                      activeTab === 'komunitasku' ? 'Komunitas Saya' : 'Komunitas Tersedia'}
                  </h2>
                  <p className="text-slate-600 text-sm">
                    {activeTab === 'semua' ? 'Daftar lengkap komunitas yang tersedia' :
                      activeTab === 'komunitasku' ? 'Komunitas yang sudah Anda ikuti' : 'Komunitas yang bisa Anda ikuti'}
                  </p>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                        <p className="text-slate-500">Memuat komunitas...</p>
                      </div>
                    </div>
                  ) : filteredCommunities.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center border border-[#d8d8d8] bg-[#5a6e1d]/5">
                      <div className="w-16 h-16 bg-white border border-[#d8d8d8] rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faUsers} className="text-[#3f4820] text-xl" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {activeTab === 'komunitasku' ? 'Belum Ada Komunitas' : 'Tidak Ada Hasil'}
                      </h3>
                      <p className="text-slate-600 text-sm">
                        {activeTab === 'komunitasku'
                          ? 'Anda belum bergabung dengan komunitas apapun'
                          : searchQuery
                            ? `Tidak ditemukan komunitas dengan kata kunci "${searchQuery}"`
                            : 'Belum ada komunitas yang tersedia'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredCommunities.map((community) => (
                      <CommunityCard
                        key={community.id}
                        community={community}
                        onOpenCommunity={handleOpenCommunity}
                        formatNumber={formatNumber}
                        onShowJoinPopup={async (c) => {
                          try {
                            const rawPrivacy = String(c?.privacy || '').toLowerCase();
                            const privacy = rawPrivacy === 'pribadi' ? 'private' : (rawPrivacy || 'public');
                            if (privacy === 'private') {
                              await requestJoinCommunityAPI(c.id);
                              showNotification({
                                type: 'success',
                                title: 'Permintaan dikirim',
                                message: 'Tunggu persetujuan admin komunitas.',
                                autoClose: 3000,
                              });
                            } else {
                              await joinCommunityAPI(c.id);
                              showNotification({
                                type: 'success',
                                title: 'Berhasil bergabung',
                                message: `Anda sekarang anggota ${c.name}.`,
                                autoClose: 3000,
                              });
                              try {
                                localStorage.setItem(
                                  'community:membership',
                                  JSON.stringify({ id: c.id, action: 'join', delta: +1, at: Date.now() })
                                );
                              } catch {}
                              fetchCommunities();
                            }
                          } catch (error) {
                            console.error('Join error:', error);
                            showNotification({
                              type: 'error',
                              title: 'Gagal',
                              message: error?.message || 'Gagal memproses permintaan.',
                              autoClose: 5000,
                            });
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            <FlexibleNotification
              show={notification.show}
              onClose={hideNotification}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              actionText={notification.actionText}
              onAction={notification.onAction}
              autoClose={notification.autoClose}
              position="center"
              size="md"
            />

            <BottomBarComponent active={'community'} />
          </div>
        </div>
      </div>
    </>
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
  
  // Gunakan privacy yang sudah dinormalisasi; map 'pribadi' -> 'private'
  const rawPrivacy = String(community?.privacy || '').toLowerCase();
  const privacy = rawPrivacy === 'pribadi' ? 'private' : (rawPrivacy || 'public');
  const isPrivate = privacy === 'private';
  
  const [justJoined, setJustJoined] = useState(false);

  // Gradient murni dari warna BE (tanpa dummy kategori)
  const getCommunityGradient = (bgColor1, bgColor2) => {
    if (bgColor1 && bgColor2) {
      return { backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor2})` };
    }
    if (bgColor1) {
      return { backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor1}dd)` };
    }
    return { backgroundImage: 'linear-gradient(135deg, #5a6e1d, #3f4820)' };
  };

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
      'Shopping': 'bg-purple-50 text-purple-700 border-purple-200',
      'Event': 'bg-blue-50 text-blue-700 border-blue-200',
      'Kuliner': 'bg-orange-50 text-orange-700 border-orange-200',
      'Otomotif': 'bg-slate-50 text-slate-700 border-slate-200',
      'Fashion': 'bg-pink-50 text-pink-700 border-pink-200',
      'Hobi': 'bg-green-50 text-green-700 border-green-200',
      'Bisnis': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Kesehatan': 'bg-red-50 text-red-700 border-red-200',
      'Teknologi': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'Travel': 'bg-yellow-50 text-yellow-700 border-yellow-200'
    };
    return colors[category || ''] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div
      className={`
        bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md
        ${justJoined
          ? 'border-green-300 bg-green-50 ring-2 ring-green-200'
          : isJoined
            ? 'border-primary/20 hover:border-primary/30 cursor-pointer'
            : 'border-slate-200 hover:border-slate-300'
        }
        ${isJoined ? 'cursor-pointer' : isPrivate && !community.hasRequested ? 'cursor-pointer' : 'cursor-default'}
      `}
      onClick={() => {
        if (isJoined) return handleClickCard();
        if (isPrivate && !community.hasRequested) return onShowJoinPopup(community);
      }}
      title={
        isJoined
          ? 'Klik untuk masuk ke komunitas'
          : isPrivate
            ? (community.hasRequested ? 'Permintaan bergabung menunggu persetujuan' : 'Komunitas privat — klik untuk minta bergabung')
            : 'Gabung dulu untuk membuka komunitas'
      }
    >
      {/* Community Color Banner */}
      <div 
        className="h-3 w-full rounded-t-xl"
        style={getCommunityGradient(community.bg_color_1, community.bg_color_2)}
      />
      
      <div className="p-5">
        <div className="flex gap-4">
          {/* Community Logo */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              {community.logo && /^https?:\/\/[^ "]+$/.test(community.logo) ? (
                <Image
                  src={community.logo}
                  width={56}
                  height={56}
                  alt="Community Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full rounded-xl flex items-center justify-center"
                  style={getCommunityGradient(community.bg_color_1, community.bg_color_2)}
                >
                  <span className="text-white text-sm font-bold drop-shadow">
                    {community.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Community Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-base leading-tight truncate">
                  {community.name}
                  {justJoined && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✓ Bergabung!
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {community.isVerified && (
                    <span className="inline-flex items-center text-blue-600" title="Terverifikasi">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                    </span>
                  )}
                  {isPrivate && (
                    <span className="inline-flex items-center text-slate-400" title="Komunitas privat">
                      <FontAwesomeIcon icon={faLock} className="text-xs" />
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(community.category)}`}>
                    {community.category || 'Umum'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-600 text-sm leading-relaxed mb-3 line-clamp-2">
              {community.description || 'Tidak ada deskripsi tersedia.'}
            </p>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faUsers} className="text-xs" />
                  <span>{formatNumber(community.members)} anggota</span>
                </div>
                {isJoined && (
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faTags} className="text-xs" />
                    <span className="text-primary font-medium">
                      {community.activePromos || 0} promo
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center">
                {isJoined ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1 text-xs" />
                      Anggota
                    </span>
                  </div>
                ) : community.hasRequested ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                    <FontAwesomeIcon icon={faClock} className="mr-1 text-xs" />
                    Menunggu
                  </span>
                ) : (
                  <button
                    onClick={handleJoinCommunity}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <FontAwesomeIcon icon={isPrivate ? faUsers : faPlus} className="mr-1.5 text-xs" />
                    {isPrivate ? 'Minta Bergabung' : 'Gabung'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
