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
  return baseUrl.replace(/\/api\/?$/, "");
};

/** =========================
 * Logo URL builder (aman)
 * ========================= */
const buildLogoUrl = (apiUrl, logo) => {
  try {
    if (!logo) return null;
    if (/^https?:\/\//i.test(logo)) return logo;

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
    "Accept": "application/json",
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
    error.code = res.status;
    if (errBody && typeof errBody === 'object') {
      try { Object.assign(error, errBody); } catch { }
    }
    throw error;
  }
  return res.json();
};

const requestJoinCommunityAPI = async (communityId) => {
  const apiUrl = getApiBase();
  const headers = getAuthHeaders();

  if (!("Authorization" in headers)) {
    throw new Error("Sesi habis. Silakan login ulang.");
  }

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

const normalizeCommunities = (raw) => {
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  return list.map((c) => {
    const privacyRaw = c.privacy ?? c.world_type ?? c.type ?? 'public';
    const privacyStr = String(privacyRaw || '').toLowerCase();
    let privacy = privacyStr === 'pribadi' ? 'private' : (privacyStr || 'public');

    const isPrivateFlag = (c.is_private ?? c.private);
    if (typeof isPrivateFlag !== 'undefined') {
      const b = typeof isPrivateFlag === 'number' ? Boolean(isPrivateFlag) : Boolean(isPrivateFlag);
      if (b) privacy = 'private';
    }

    const isJoinedRaw = c.isJoined ?? c.is_joined ?? false;
    const isJoined = typeof isJoinedRaw === 'number' ? Boolean(isJoinedRaw) : Boolean(isJoinedRaw);

    const hasRequestedRaw = c.hasRequested ?? c.has_requested ?? c.requestPending ?? false;
    const hasRequested = typeof hasRequestedRaw === 'number' ? Boolean(hasRequestedRaw) : Boolean(hasRequestedRaw);

    const membersNum = Number(c.members ?? 0);
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
    return [];
  }

  const candidates = [
    `${apiUrl}/api/communities/with-membership`,
    `${apiUrl}/api/admin/communities/with-membership`,
    `${apiUrl}/api/admin/communities`,
    `${apiUrl}/api/communities`,
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

    const normalized = normalizeCommunities(data);

    if (url.endsWith('/with-membership')) {
      return normalized;
    }

    if (normalized.length) {
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
      } catch { }
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

  const [notification, setNotification] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    actionText: '',
    onAction: null,
    autoClose: 3000,
  });

  const showNotification = useCallback((config) => {
    setNotification(prev => ({
      ...prev,
      ...config,
      show: true
    }));
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchCommunitiesWithMembership();
      const apiBase = getApiBase();
      const processed = list.map(c => ({
        ...c,
        logo: buildLogoUrl(apiBase, c.logo || undefined),
      }));
      setCommunities(processed);
    } catch (error) {
      console.error('Fetch communities error:', error);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  useEffect(() => {
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
      } catch { }
    };

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
    data = data.filter((c) => (c.is_active === undefined ? true : Boolean(c.is_active)));

    if (activeTab === 'komunitasku') {
      data = data.filter(c => Boolean(c.isJoined) || Boolean(c.hasRequested));
    } else if (activeTab === 'belum-gabung') {
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

  const stats = useMemo(() => {
    const joined = communities.filter(c => Boolean(c.isJoined) || Boolean(c.hasRequested)).length;
    const available = communities.filter(c => !c.isJoined && !c.hasRequested).length;
    return { joined, available };
  }, [communities]);

  const handleOpenCommunity = useCallback((communityId) => {
    router.push(`/app/komunitas/dashboard/${communityId}`);
  }, [router]);

  const formatNumber = useCallback((num) => {
    if (!isClient) return num ? String(num) : "0";
    if (typeof num !== "number" || Number.isNaN(num)) return "0";
    return num.toLocaleString('id-ID');
  }, [isClient]);

  const handleJoinAction = useCallback(async (community) => {
    try {
      const rawPrivacy = String(community?.privacy || '').toLowerCase();
      const privacy = rawPrivacy === 'pribadi' ? 'private' : (rawPrivacy || 'public');
      
      if (privacy === 'private') {
        await requestJoinCommunityAPI(community.id);
        showNotification({
          type: 'success',
          title: 'Permintaan dikirim',
          message: 'Tunggu persetujuan admin komunitas.',
          autoClose: 3000,
        });
      } else {
        await joinCommunityAPI(community.id);
        showNotification({
          type: 'success',
          title: 'Berhasil bergabung',
          message: `Anda sekarang anggota ${community.name}.`,
          autoClose: 3000,
        });
        try {
          localStorage.setItem(
            'community:membership',
            JSON.stringify({ id: community.id, action: 'join', delta: +1, at: Date.now() })
          );
        } catch { }
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
  }, [showNotification, fetchCommunities]);

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="relative">
            <div className="w-full aspect-[16/6] overflow-hidden bg-gradient-to-r from-[#0b2e13] to-[#14532d] flex items-center justify-center z-10" />
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
              <div className="bg-white border border-primary rounded-[20px] flex items-center overflow-hidden">
                <div className="flex-1">
                  <div className="px-6 py-3 flex items-center gap-3">
                    <FontAwesomeIcon icon={faSearch} className="text-primary" />
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
                  {['semua', 'komunitasku', 'belum-gabung'].map((tab) => (
                    <button
                      key={tab}
                      className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'semua' ? 'Semua Komunitas' : 
                       tab === 'komunitasku' ? 'Komunitas Saya' : 'Tersedia'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 py-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#d8d8d8] bg-[#0b2e13]/5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-[#0b2e13] text-white">
                      <FontAwesomeIcon icon={faUsers} className="text-sm" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[#14532d]">Bergabung</p>
                      <p className="text-lg font-semibold text-slate-900">{stats.joined}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#d8d8d8] bg-[#0b2e13]/5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-[#14532d] text-white">
                      <FontAwesomeIcon icon={faGlobe} className="text-sm" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[#14532d]">Tersedia</p>
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
                    <div className="bg-white rounded-xl p-8 text-center border border-[#d8d8d8] bg-[#0b2e13]/5">
                      <div className="w-16 h-16 bg-white border border-[#d8d8d8] rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faUsers} className="text-[#14532d] text-xl" />
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
                        onJoinRequest={handleJoinAction}
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
 * Community Card Component
 * ========================= */
function CommunityCard({
  community,
  onOpenCommunity,
  formatNumber,
  onJoinRequest,
}) {
  const rawPrivacy = String(community?.privacy || '').toLowerCase();
  const privacy = rawPrivacy === 'pribadi' ? 'private' : (rawPrivacy || 'public');
  const isPrivate = privacy === 'private';
  const isJoined = Boolean(community.isJoined);
  const hasRequested = Boolean(community.hasRequested);

  const getCommunityGradient = useCallback((bgColor1, bgColor2) => {
    if (bgColor1 && bgColor2) {
      return { backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor2})` };
    }
    if (bgColor1) {
      return { backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor1}dd)` };
    }
    return { backgroundImage: 'linear-gradient(135deg, #0b2e13, #14532d)' };
  }, []);

  const getCategoryColor = useCallback((category) => {
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
  }, []);

  const handleClickCard = useCallback(() => {
    if (isJoined) {
      onOpenCommunity(community.id);
    } else if (isPrivate && !hasRequested) {
      onJoinRequest(community);
    }
  }, [isJoined, isPrivate, hasRequested, community.id, onOpenCommunity, onJoinRequest, community]);

  const handleJoinClick = useCallback((e) => {
    e.stopPropagation();
    if (isJoined || hasRequested) return;
    onJoinRequest(community);
  }, [isJoined, hasRequested, community, onJoinRequest]);

  const cardClasses = useMemo(() => {
    const base = "bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md";
    if (isJoined) {
      return `${base} border-primary/20 hover:border-primary/30 cursor-pointer`;
    }
    if (isPrivate && !hasRequested) {
      return `${base} border-slate-200 hover:border-slate-300 cursor-pointer`;
    }
    return `${base} border-slate-200 cursor-default`;
  }, [isJoined, isPrivate, hasRequested]);

  const cardTitle = useMemo(() => {
    if (isJoined) return 'Klik untuk masuk ke komunitas';
    if (isPrivate) {
      return hasRequested 
        ? 'Permintaan bergabung menunggu persetujuan' 
        : 'Komunitas privat — klik untuk minta bergabung';
    }
    return 'Gabung dulu untuk membuka komunitas';
  }, [isJoined, isPrivate, hasRequested]);

  return (
    <div
      className={cardClasses}
      onClick={handleClickCard}
      title={cardTitle}
    >
      <div
        className="h-3 w-full rounded-t-xl"
        style={getCommunityGradient(community.bg_color_1, community.bg_color_2)}
      />

      <div className="p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              {community.logo && /^https?:\/\/[^ "]+$/.test(community.logo) ? (
                <Image
                  src={community.logo}
                  width={56}
                  height={56}
                  alt={`Logo ${community.name}`}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="w-full h-full rounded-xl flex items-center justify-center"
                  style={getCommunityGradient(community.bg_color_1, community.bg_color_2)}
                >
                  <span className="text-white text-sm font-bold drop-shadow">
                    {community.name?.substring(0, 2).toUpperCase() || 'CO'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-base leading-tight truncate">
                  {community.name}
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

            <p className="text-slate-600 text-sm leading-relaxed mb-3 line-clamp-2">
              {community.description || 'Tidak ada deskripsi tersedia.'}
            </p>

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

              <div className="flex items-center">
                {isJoined ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1 text-xs" />
                    Anggota
                  </span>
                ) : hasRequested ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                    <FontAwesomeIcon icon={faClock} className="mr-1 text-xs" />
                    Menunggu
                  </span>
                ) : (
                  <button
                    onClick={handleJoinClick}
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