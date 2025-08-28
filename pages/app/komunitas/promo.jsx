import { faGift, faSearch, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';
import CommunityBottomBar from './dashboard/CommunityBottomBar';

const CommunityPromoPage = () => {
  const router = useRouter();
  const { communityId } = router.query;
  const [communityData, setCommunityData] = useState(null);
  const [promoData, setPromoData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  // baseUrl = apiUrl tanpa trailing `/api`, tanpa trailing slash
  const baseUrl = (apiUrl || '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

  // ---- URL helpers ----
  const isAbsoluteUrl = (u) =>
    typeof u === 'string' && /^https?:\/\//i.test(u);

  const isPlaceholder = (u) =>
    typeof u === 'string' && u.startsWith('/api/placeholder');

  /**
   * Build final image URL (robust):
   * - absolute: pakai apa adanya
   * - placeholder: pakai apa adanya
   * - relatif: normalisasi dulu → mapping ke "storage/..." bila perlu → gabungkan ke baseUrl (apiUrl tanpa /api)
   */
  const buildImageUrl = (raw) => {
    const fallback = '/api/placeholder/150/120';
    if (typeof raw !== 'string') return fallback;

    let url = raw.trim();
    if (!url) return fallback;

    // 1) Sudah absolute? langsung pakai
    if (isAbsoluteUrl(url)) return url;

    // 2) Placeholder? biarkan
    if (isPlaceholder(url)) return url;

    // 3) Normalisasi path relatif dari backend
    //    - backend sering kirim "promos/xxx.webp" → seharusnya "storage/promos/xxx.webp"
    //    - kalau backend kirim "api/storage/xxx" → jadikan "storage/xxx"
    let path = url.replace(/^\/+/, '');                   // buang leading slash
    path = path.replace(/^api\/storage\//, 'storage/');   // api/storage → storage

    // Jika bukan diawali "storage/", tetapi diawali folder konten seperti "promos/", "uploads/", arahkan ke storage
    if (/^(promos|uploads|images|files)\//i.test(path)) {
      path = `storage/${path}`;
    }

    // 4) Gabungkan dengan baseUrl (tanpa /api, tanpa trailing slash)
    const finalUrl = `${baseUrl}/${path}`;

    // 5) Validasi akhir
    return /^https?:\/\//i.test(finalUrl) ? finalUrl : fallback;
  };

  const getAuthHeaders = () => {
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      return token
        ? {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
        : { 'Content-Type': 'application/json' };
    } catch (e) {
      return { 'Content-Type': 'application/json' };
    }
  };

  const normalizePromos = (arr = []) => {
    return (Array.isArray(arr) ? arr : []).map((p) => {
      const raw =
        p.image_url ??
        p.image ??
        p.image_path ??
        '/api/placeholder/150/120';

      const image = buildImageUrl(raw);

      return {
        id: p.id ?? p.promo_id ?? Math.random(),
        title: p.title ?? p.name ?? 'Promo',
        merchant: p.merchant ?? p.community?.name ?? 'Merchant',
        distance: p.distance ?? '0 KM',
        location: p.location ?? p.community?.location ?? 'Location',
        image
      };
    });
  };

  useEffect(() => {
    if (communityId) {
      fetchCommunityData();
      fetchPromoData();
    }
  }, [communityId]);

  const fetchCommunityData = async () => {
    try {
      const res = await fetch(`${apiUrl}/communities/${communityId}`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const json = await res.json();
        const community = json.data || json;
        setCommunityData({
          id: community.id,
          name: community.name || 'Komunitas',
          location: community.location || 'Location'
        });
      } else {
        // Fallback to dummy data if API fails
        setCommunityData({
          id: communityId,
          name: 'dbotanica Bandung',
          location: 'Bandung'
        });
      }
    } catch (error) {
      // Fallback to dummy data
      setCommunityData({
        id: communityId,
        name: 'dbotanica Bandung',
        location: 'Bandung'
      });
    }
  };

  const fetchPromoData = async () => {
    setLoading(true);
    try {
      // Fetch regular promos
      const promoRes = await fetch(`${apiUrl}/communities/${communityId}/promos`, {
        headers: getAuthHeaders()
      });
      
      if (promoRes.ok) {
        const promoJson = await promoRes.json();
        const promoData = Array.isArray(promoJson?.data) ? promoJson.data : Array.isArray(promoJson) ? promoJson : [];
        setPromoData(normalizePromos(promoData));
      }
    } catch (error) {
      // Keep empty arrays if API fails
    } finally {
      setLoading(false);
    }
  };

  const handlePromoClick = (promoId) => {
    router.push(`/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=${communityId}`);
  };

  const PromoCard = ({ promo }) => (
    <div 
      className="bg-white rounded-[16px] shadow-sm overflow-hidden mb-4 hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-50"
      onClick={() => handlePromoClick(promo.id)}
    >
      <div className="flex p-5">
        <div className="w-20 h-20 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100">
          <Image 
            src={promo.image} 
            alt={promo.title}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            placeholder="blur"
            blurDataURL="/default-avatar.png"
          />
        </div>
        <div className="flex-1 ml-4 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 mb-1">
            {promo.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-1">
            {promo.merchant}
          </p>
        </div>
      </div>
    </div>
  );

  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen flex items-center justify-center px-4 py-4">
        <div className="text-center bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-sm p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data komunitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
      {/* Header */}
      <div className="bg-primary w-full h-[100px] rounded-b-[30px] shadow-sm px-6 mb-4 relative">
        <div className="flex items-center justify-center h-full">
          {/* Search Bar */}
          <div className="w-full bg-white px-4 py-3 rounded-[20px] flex items-center shadow-sm">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Cari promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        <div className="lg:mx-auto lg:max-w-md">
          {/* Promo Terdekat Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Promo Terkini</h2>
              <div className="bg-blue-50 p-2 rounded-lg">
                <FontAwesomeIcon icon={faTag} className="text-blue-500 text-sm" />
              </div>
            </div>

            {/* Promo Cards */}
            {promoData.length > 0 ? (
              promoData
                .filter(promo => 
                  searchQuery === '' || 
                  promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  promo.merchant.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((promo) => (
                  <PromoCard key={promo.id} promo={promo} />
                ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-[12px]">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faGift} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Belum ada promo tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <CommunityBottomBar active="promo" communityId={communityId} />
    </div>
  );
};

export default CommunityPromoPage;
