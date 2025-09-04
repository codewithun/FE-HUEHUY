import {
  faArrowLeft,
  faCheckCircle,
  faSearch,
  faTimes,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from "js-cookie";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import { token_cookie_name } from "../../../helpers";
import { Decrypt } from "../../../helpers/encryption.helpers";

// --- ADD: helper aman untuk ngebangun URL logo ---
const buildLogoUrl = (apiUrl, logo) => {
  try {
    if (!logo) return null;

    // kalau sudah absolute (http/https), langsung pakai
    if (/^https?:\/\//i.test(logo)) return logo;

    // pastikan base pakai URL() supaya slash2 rapi
    const base = new URL(apiUrl);

    // file statis sebaiknya TIDAK di bawah /api → hapus /api kalau ada
    base.pathname = base.pathname.replace(/\/api\/?$/, "/");

    // normalisasi path "logo" dari backend
    // contoh: "api/storage/xxx" → "storage/xxx"
    const cleanLogo = String(logo)
      .replace(/^\/+/, "")                  // hapus leading slash
      .replace(/^api\/storage\//, "storage/");

    // pastikan ada prefix /storage saat perlu
    const relative = cleanLogo.startsWith("storage/")
      ? `/${cleanLogo}`
      : `/storage/${cleanLogo}`;

    return new URL(relative, base).toString();
  } catch {
    return null;
  }
};

// --- ADD: API helper functions ---
const getAuthHeaders = () => {
  const encryptedToken = Cookies.get(token_cookie_name);
  const token = encryptedToken ? Decrypt(encryptedToken) : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const joinCommunityAPI = async (communityId) => {
  // Handle API URL properly - remove /api if it exists, then add it back
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiUrl = baseUrl.replace(/\/api\/?$/, "");
  
  const response = await fetch(`${apiUrl}/api/communities/${communityId}/join`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal bergabung dengan komunitas');
  }
  
  return response.json();
};

const fetchCommunitiesWithMembership = async () => {
  // Handle API URL properly - remove /api if it exists, then add it back
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiUrl = baseUrl.replace(/\/api\/?$/, "");
  
  try {
    // Try the with-membership endpoint first
    const response = await fetch(`${apiUrl}/api/communities/with-membership`, {
      headers: getAuthHeaders(),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
    }
  } catch (error) {
  }
  
  // Fallback: Get all communities and user's communities separately
  try {
    const [communitiesResponse, userCommunitiesResponse] = await Promise.all([
      fetch(`${apiUrl}/api/admin/communities`, { headers: getAuthHeaders() }),
      fetch(`${apiUrl}/api/communities/user-communities`, { headers: getAuthHeaders() }).catch(() => null)
    ]);
    
    const allCommunities = await communitiesResponse.json();
    let userCommunities = [];
    
    // If user-communities endpoint works, get user's joined communities
    if (userCommunitiesResponse && userCommunitiesResponse.ok) {
      const userCommunitiesData = await userCommunitiesResponse.json();
      userCommunities = userCommunitiesData.data || userCommunitiesData || [];
    }
    
    // Mark communities as joined based on user communities
    const userCommunityIds = userCommunities.map(uc => uc.id);
    const communitiesWithMembership = (allCommunities.data || allCommunities || []).map(community => ({
      ...community,
      isJoined: userCommunityIds.includes(community.id),
      members: community.members || 0
    }));
    
    return communitiesWithMembership;
  } catch (fallbackError) {
    // Return empty array if all fails
    return [];
  }
};

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

  // Updated: Fetch communities with membership status
  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const data = await fetchCommunitiesWithMembership();

      // Process communities data to construct proper logo URLs for Next.js Image
      const list = Array.isArray(data) ? data : (data?.data || []);
      const processedCommunities = list.map((community) => ({
        ...community,
        logo: buildLogoUrl((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, ""), community.logo),
        // Ensure isJoined field exists (backend should provide this)
        isJoined: community.isJoined || community.is_joined || false,
      }));
      setCommunities(processedCommunities);

    } catch (err) {
      setCommunities([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  // Filter communities sesuai tab dan pencarian
  const filteredCommunities = () => {
    let data = communities;
    if (activeTab === 'komunitasku') {
      data = data.filter(c => c.isJoined); // sesuaikan dengan field backend
    } else if (activeTab === 'belum-gabung') {
      data = data.filter(c => !c.isJoined);
    }
    if (searchQuery) {
      data = data.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return data;
  };

  // Function untuk handle buka komunitas - redirect langsung ke dashboard
  const handleOpenCommunity = (communityId) => {
    router.push(`/app/komunitas/dashboard/${communityId}`);
  };

  // Format number function with consistent locale
  const formatNumber = (num) => {
    if (!isClient) return num ? num.toString() : "0";
    if (typeof num !== "number") return "0";
    return num.toLocaleString('id-ID');
  };

  const notJoinedCommunities = communities.filter(c => !c.isJoined);

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 pb-28">
          {/* Header Banner dengan ilustrasi 3D style - IMPROVED */}
          <div className="w-full bg-primary relative overflow-hidden">
            {/* Background decoration - lebih subtle */}
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-16 h-16 bg-cyan-400 rounded-full opacity-15"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 bg-teal-300 rounded-full opacity-10"></div>
              <div className="absolute top-12 left-1/4 w-8 h-8 bg-cyan-300 rounded-full opacity-15"></div>
            </div>

            <div className="relative px-4 py-6 text-white">
              {/* Header dengan back button */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Link href="/app">
                    <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
                  </Link>
                  <h1 className="text-xl font-bold">Komunitas</h1>
                </div>
              </div>

              {/* Ilustrasi area dengan 3D characters - IMPROVED */}
              <div className="flex items-center justify-center py-6 relative">
                {/* Central illustration placeholder - 3 characters with speech bubbles */}
                <div className="flex items-center gap-3">
                  {/* Character 1 */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-8 h-8 bg-orange-200 rounded-full"></div>
                    </div>
                    <div className="absolute -top-6 -left-1 bg-white text-primary px-2 py-1 rounded-lg text-xs shadow-sm">
                      💬
                    </div>
                  </div>

                  {/* Character 2 (center with ADS badge) */}
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

                  {/* Character 3 */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="absolute -top-6 -right-1 bg-white text-primary px-2 py-1 rounded-lg text-xs shadow-sm">
                      📋
                    </div>
                  </div>
                </div>

                {/* Floating elements - lebih kecil dan subtle */}
                <div className="absolute top-2 left-6 bg-blue-400 text-white p-1.5 rounded-lg text-xs shadow-sm">
                  👍
                </div>
                <div className="absolute bottom-2 right-6 bg-green-400 text-white p-1.5 rounded-lg text-xs shadow-sm">
                  📢
                </div>
              </div>

              {/* Tagline - Clean dan Simple */}
              <div className="text-center mt-6 mb-4">
                <p className="text-lg font-semibold text-white drop-shadow-md">
                  Lebih mudah berbagi promo sesama anggota komunitas
                </p>
              </div>
            </div>
          </div>

          {/* Content area - matching background gradient */}
          <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
            <div className="relative -top-5 px-4">
              {/* Search Bar - matching style from index */}
              <div className="mb-6">
                <div className="w-full bg-white border border__primary px-6 py-4 rounded-[20px] flex justify-between items-center shadow-sm">
                  <input
                    type="text"
                    placeholder="Cari komunitas?..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none bg-transparent"
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="text__primary"
                  />
                </div>
              </div>
            </div>

            {/* Content with proper padding */}
            <div className="px-4 pb-6">
              {/* Tab navigation */}
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

              {/* Communities List */}
              {/* Show recommended communities section only when viewing all or joined communities */}


              {/* Komunitas Lainnya section */}
              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-slate-900 text-lg font-semibold">Komunitas Lainnya</h2>
                  <p className="text-slate-600 text-sm">
                    Temukan komunitas baru yang menarik
                  </p>
                </div>

                {/* Other Communities List */}
                <div className="space-y-3">
                  {loading ? (
                    <div>Loading komunitas...</div>
                  ) : (
                    filteredCommunities().map((community) => (
                      <CommunityCard
                        key={community.id}
                        community={community}
                        type={community.isJoined ? 'joined' : 'notJoined'}
                        onOpenCommunity={handleOpenCommunity}
                        formatNumber={formatNumber}
                        refreshCommunities={fetchCommunities}
                        setActiveTab={setActiveTab}
                        onShowJoinPopup={(community) => {
                          setSelectedCommunity(community);
                          setShowJoinPopup(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Confirmation Popup */}
        {showJoinPopup && selectedCommunity && (
          <JoinConfirmationPopup
            community={selectedCommunity}
            onConfirm={async () => {
              try {
                await joinCommunityAPI(selectedCommunity.id);
                setShowJoinPopup(false);
                setSelectedCommunity(null);
                
                // Update the specific community as joined
                setCommunities(prev => prev.map(community => 
                  community.id === selectedCommunity.id 
                    ? { ...community, isJoined: true }
                    : community
                ));
                
                setActiveTab('komunitasku');
              } catch (error) {
                // Silent error handling - just close popup and don't update state
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

// Join Confirmation Popup Component
function JoinConfirmationPopup({ community, onConfirm, onCancel }) {
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Bergabung Komunitas</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
          </button>
        </div>

        {/* Community Info */}
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
            <p className="text-sm text-slate-600">{community.members || 0} anggota</p>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="mb-6">
          <p className="text-slate-700 text-center leading-relaxed">
            Apakah Anda yakin ingin bergabung dengan komunitas <span className="font-semibold">{community.name}</span>?
          </p>
          <div className="mt-4 bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600" />
              <span>Anda akan mendapatkan akses ke promo eksklusif komunitas</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Bergabung...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUsers} />
                Bergabung
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Community Card Component - IMPROVED dengan type untuk membedakan joined/notJoined
function CommunityCard({ community, type, onOpenCommunity, formatNumber, refreshCommunities, setActiveTab, onShowJoinPopup }) {
  const [joinError, setJoinError] = useState('');
  const [isJoined, setIsJoined] = useState(community.isJoined);
  const [justJoined, setJustJoined] = useState(false);

  // Update isJoined when community prop changes
  useEffect(() => {
    setIsJoined(community.isJoined);
    if (community.isJoined && !isJoined) {
      setJustJoined(true);
      setTimeout(() => setJustJoined(false), 2000);
    }
  }, [community.isJoined]);

  const handleJoinCommunity = (e) => {
    e.stopPropagation(); // Prevent opening community when clicking join button
    
    // Check if already joined
    if (isJoined || community.isJoined) {
      return;
    }
    
    // Show join popup
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
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      className={`bg-white bg-opacity-60 backdrop-blur-sm rounded-[15px] p-4 shadow-sm border transition-all duration-300 cursor-pointer ${
        justJoined 
          ? 'border-green-300 bg-green-50 shadow-md' 
          : isJoined 
            ? 'border-primary bg-primary/5' 
            : 'border-slate-200 hover:shadow-md'
      }`}
      onClick={() => onOpenCommunity(community.id)}
    >
      <div className="flex gap-3">
        {/* Community Avatar */}
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

        {/* Community Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-slate-900 text-sm truncate pr-2">
              {community.name}
              {justJoined && (
                <span className="ml-2 text-xs text-green-600 font-medium">✓ Bergabung!</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {community.isVerified && (
                <span className="text-blue-500 text-xs">✓</span>
              )}
              {community.privacy === 'private' && (
                <span className="text-gray-400 text-xs">🔒</span>
              )}
            </div>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed mb-2">
            {community.description}
          </p>

          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(community.category)}`}>
              {community.category}
            </span>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{formatNumber(community.members)} anggota</span>
              {type === 'joined' || isJoined ? (
                <div className="flex items-center gap-1">
                  <span className="text-primary font-medium">
                    {community.activePromos || 0} promo
                  </span>
                  {isJoined && (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleJoinCommunity}
                  className="bg-primary text-white px-3 py-1 rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  Gabung
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}