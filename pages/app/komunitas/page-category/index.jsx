/* eslint-disable no-console */
import { faArrowLeft, faGlobe, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../../helpers';
import { distanceConvert } from '../../../../helpers/distanceConvert.helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import CommunityBottomBar from '../dashboard/CommunityBottomBar';

// Helper functions (copied from home.jsx)
const useImageWithFallback = (src, fallback = '/default-avatar.png') => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isError, setIsError] = useState(false);

  const handleError = () => {
    if (!isError) {
      setImageSrc(fallback);
      setIsError(true);
    }
  };

  const handleLoad = () => {
    setIsError(false);
  };

  useEffect(() => {
    setImageSrc(src);
    setIsError(false);
  }, [src]);

  return {
    imageSrc,
    handleError,
    handleLoad,
    isError
  };
};

const getNormalizedType = (ad, cube = null) => {
  // Prioritize ad data over cube data
  if (ad?.type) return ad.type;
  if (cube?.type) return cube.type;
  
  // Check for information indicators
  if (ad?.is_information || cube?.is_information) return 'information';
  if (ad?.content_type === 'information' || cube?.content_type === 'information') return 'information';
  
  // Check for voucher indicators
  if (ad?.is_voucher || cube?.is_voucher) return 'voucher';
  if (ad?.content_type === 'voucher' || cube?.content_type === 'voucher') return 'voucher';
  
  // Check for advertising indicators
  if (ad?.is_advertising || cube?.is_advertising) return 'iklan';
  if (ad?.content_type === 'advertising' || cube?.content_type === 'advertising') return 'iklan';
  
  // Default to promo
  return 'promo';
};

const normalizeImageSrc = (raw) => {
  if (!raw || typeof raw !== 'string') return '/default-avatar.png';
  
  // If already absolute URL, return as-is
  if (/^https?:\/\//i.test(raw)) return raw;
  
  // If starts with /, treat as absolute path from domain
  if (raw.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const cleanBase = baseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    return `${cleanBase}${raw}`;
  }
  
  // Otherwise, treat as relative to storage
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanBase = baseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  return `${cleanBase}/storage/${raw}`;
};

const buildLogoUrl = (logo) => {
  if (!logo) return '/default-avatar.png';
  if (typeof logo !== 'string') return '/default-avatar.png';
  
  // If already absolute URL, return as-is
  if (/^https?:\/\//i.test(logo)) return logo;
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanBase = baseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  
  // If starts with /, treat as absolute path from domain
  if (logo.startsWith('/')) {
    return `${cleanBase}${logo}`;
  }
  
  // Otherwise, treat as relative to storage
  return `${cleanBase}/storage/${logo}`;
};

const getAdImage = (ad) =>
  ad?.image_1 || ad?.image || ad?.picture_source || '/default-avatar.png';

const normalizeBoolLike = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return false;
};

const getIsInformation = (item) => {
  if (!item) return false;
  
  // Check various possible fields for information type
  if (item.type === 'information') return true;
  if (item.content_type === 'information') return true;
  if (normalizeBoolLike(item.is_information)) return true;
  
  // Check if it's explicitly not advertising or voucher
  const isAd = normalizeBoolLike(item.is_advertising);
  const isVoucher = normalizeBoolLike(item.is_voucher);
  
  // If it has information-like properties and is not ad/voucher
  if (!isAd && !isVoucher && (item.description || item.content)) {
    return true;
  }
  
  return false;
};

const getIsAdvertising = (ad, cube = null) => getNormalizedType(ad, cube) === 'iklan';

const getCategoryLabel = (ad, cube = null) => {
  const t = getNormalizedType(ad, cube);
  if (t === 'information') return 'Informasi';
  if (t === 'voucher') return 'Voucher';
  if (t === 'iklan') return 'Advertising';
  return 'Promo';
};

// Professional SVG icons for categories
const CategoryIcons = {
  advertising: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" />
    </svg>
  ),
  information: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
    </svg>
  ),
  voucher: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4,4A2,2 0 0,0 2,6V10C3.11,10 4,10.9 4,12A2,2 0 0,1 2,14V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V14C20.89,14 20,13.1 20,12A2,2 0 0,1 22,10V6A2,2 0 0,0 20,4H4M4,6H20V8.54C18.81,9.23 18,10.53 18,12C18,13.47 18.81,14.77 20,15.46V18H4V15.46C5.19,14.77 6,13.47 6,12C6,10.53 5.19,9.23 4,8.54V6Z" />
    </svg>
  ),
  promo: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.77,14.05 22,13.55 22,13C22,12.45 21.77,11.95 21.41,11.58Z" />
    </svg>
  ),
  default: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.77,14.05 22,13.55 22,13C22,12.45 21.77,11.95 21.41,11.58Z" />
    </svg>
  )
};

// Helper function to get appropriate icon for each category type
const getCategoryIcon = (category) => {
  const categoryLower = String(category || '').toLowerCase();

  switch (categoryLower) {
    case 'advertising':
      return CategoryIcons.advertising;
    case 'informasi':
    case 'information':
      return CategoryIcons.information;
    case 'voucher':
      return CategoryIcons.voucher;
    case 'promo':
      return CategoryIcons.promo;
    default:
      return CategoryIcons.default;
  }
};

const getAdditionalInfo = (ad, cube, communityData) => {
  // Try to get location info
  const location = ad?.location || cube?.location || communityData?.location;
  const distance = ad?.distance || cube?.distance;
  
  if (location && distance) {
    return `${location} • ${distanceConvert(distance)}`;
  } else if (location) {
    return location;
  } else if (distance) {
    return distanceConvert(distance);
  }
  
  return null;
};

// Helper function to get category with icon and additional info
const getCategoryWithIcon = (ad, cube = null, communityData = null) => {
  const label = getCategoryLabel(ad, cube);
  const icon = getCategoryIcon(label);
  const additionalInfo = getAdditionalInfo(ad, cube, communityData);

  return {
    label,
    icon,
    additionalInfo,
    display: label // Remove emoji from display since we're using SVG
  };
};

export default function CategoryPage() {
  const router = useRouter();
  const { categoryId, communityId } = router.query;
  const [isClient, setIsClient] = useState(false);
  const [communityData, setCommunityData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [cubesData, setCubesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use custom hook for avatar image handling
  const avatarUrl = communityData?.avatar ? buildLogoUrl(communityData.avatar) : '/default-avatar.png';
  const { imageSrc: avatarSrc, handleError: handleAvatarError, handleLoad: handleAvatarLoad, isError: avatarError } = useImageWithFallback(avatarUrl);

  // Function untuk menentukan background berdasarkan data komunitas (sama seperti dashboard)
  const getCommunityBackground = (communityData) => {
    // Prioritas 1: Background image jika ada
    if (communityData?.background_image) {
      return {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${buildLogoUrl(communityData.background_image)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Prioritas 2: Gradient dari bg_color_1 dan bg_color_2
    if (communityData?.bg_color_1 && communityData?.bg_color_2) {
      return {
        backgroundImage: `linear-gradient(135deg, ${communityData.bg_color_1}, ${communityData.bg_color_2})`,
      };
    }
    
    // Prioritas 3: Single color dengan transparansi
    if (communityData?.bg_color_1) {
      return {
        backgroundImage: `linear-gradient(135deg, ${communityData.bg_color_1}, ${communityData.bg_color_1}dd)`,
      };
    }
    
    // Fallback default
    return {
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!categoryId || !communityId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const apiBase = baseUrl.replace(/\/api\/?$/, '');
        const headers = { 'Content-Type': 'application/json' };

        // Get authentication token
        const token = Cookies.get(token_cookie_name);
        if (token) {
          try {
            const decryptedToken = Decrypt(token);
            headers['Authorization'] = `Bearer ${decryptedToken}`;
          } catch (e) {
            console.warn('Failed to decrypt token:', e);
          }
        }

        // Fetch community data
        const communityRes = await fetch(`${apiBase}/api/communities/${communityId}`, { headers });
        const communityJson = await communityRes.json();
        
        if (communityRes.ok && (communityJson?.data || communityJson?.id)) {
          setCommunityData(communityJson.data || communityJson);
        }

        // Fetch category data
        const categoryRes = await fetch(`${apiBase}/api/admin/options/ad-category/${categoryId}?community_id=${communityId}`, { headers });
        const categoryJson = await categoryRes.json();
        if (categoryJson?.message === 'success' && categoryJson.data) {
          setCategoryData(categoryJson.data);
        }

        // Fetch cubes by category
        const params = new URLSearchParams({
          ad_category_id: categoryId,
          community_id: communityId,
          limit: 50
        });

        const cubesRes = await fetch(`${apiBase}/api/cubes-by-category?${params}`, { headers });
        const cubesJson = await cubesRes.json();
        
        if (cubesJson?.message === 'success' && Array.isArray(cubesJson.data)) {
          setCubesData(cubesJson.data);
        } else {
          setCubesData([]);
        }

      } catch (error) {
        console.error('Error fetching category data:', error);
        setCubesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, communityId]);

  if (!isClient) {
    return null; // Prevent SSR mismatch
  }

  if (loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-background min-h-screen w-full relative z-20 bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-primary rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-background min-h-screen w-full relative z-20 bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-primary rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Komunitas tidak ditemukan</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get community background style (sama seperti dashboard)
  const backgroundStyle = getCommunityBackground(communityData);

  return (
    <>
      <div className="relative lg:mx-auto lg:max-w-md min-h-screen" style={backgroundStyle}>
        {/* Dimmer overlay to ensure content stays readable over strong backgrounds */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-0 pointer-events-none" />
        
        <div className="relative z-10 min-h-screen">
          {/* Header */}
          <div className="sticky top-0 z-30 bg-white/20 backdrop-blur-md border-b border-white/30">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-300"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-white text-lg" />
              </button>

              <div className="flex-1 text-center">
                <h1 className="text-lg font-bold text-white">
                  {categoryData?.label || categoryData?.name || 'Kategori'}
                </h1>
                <p className="text-sm text-white/80">
                  {communityData?.name}
                </p>
              </div>

              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                <Image
                  src={avatarSrc}
                  alt={communityData?.name || 'Community'}
                  width={40}
                  height={40}
                  className="object-cover"
                  onError={handleAvatarError}
                  onLoad={handleAvatarLoad}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 pb-20">
            {cubesData.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-white/80 text-lg mb-2">Tidak ada kubus ditemukan</div>
                <div className="text-white/60 text-sm">
                  Belum ada kubus yang ditambahkan ke kategori ini
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cubesData.map((item, index) => {
                  const cube = item?.cube;
                  const ad = item?.ad;
                  
                  if (!cube && !ad) return null;

                  const isInformationCube = getIsInformation(cube) || getIsInformation(ad);
                  const imageUrl = item.image || (ad ? getAdImage(ad) : (cube?.image || cube?.picture_source || '/default-avatar.png'));
                  const title = item.title || ad?.title || cube?.label || cube?.name || 'Promo';
                  const description = item.description || ad?.description || cube?.description || '';
                  const merchant = item.merchant || cube?.name || ad?.merchant || 'Merchant';
                  const categoryData = getCategoryWithIcon(ad, cube, communityData);

                  return (
                    <div
                      key={ad?.id || cube?.id || index}
                      className="rounded-[16px] overflow-hidden border border-white/30 bg-white/20 backdrop-blur-md shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        if (getIsAdvertising(ad, cube)) {
                          // Arahkan ke halaman iklan yang mendukung community background
                          const targetUrl = communityId
                            ? `/app/iklan/${ad.id}?communityId=${communityId}`
                            : `/app/iklan/${ad.id}`;
                          router.push(targetUrl);
                        } else {
                          // Arahkan ke halaman promo
                          const targetUrl = communityId
                            ? `/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`
                            : `/app/promo/detail_promo?promoId=${ad.id}`;
                          router.push(targetUrl);
                        }
                      }}
                    >
                      {/* Image Section */}
                      <div className="relative w-full bg-white/20 backdrop-blur-sm overflow-hidden">
                        <div className="w-full aspect-[4/3] relative">
                          <Image 
                            src={normalizeImageSrc(imageUrl)} 
                            alt={title} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                        <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] font-semibold px-2 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-1">
                          <span>{categoryData.icon}</span>
                          <span>{categoryData.label}</span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-3 bg-white/20 backdrop-blur-md border-t border-white/20">
                        <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                          {title}
                        </h3>
                        
                        {description && (
                          <p className="text-white/80 text-xs line-clamp-2 mb-2">
                            {description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faGlobe} className="text-white/60 text-xs" />
                            <span className="text-white/80 text-xs font-medium">
                              {merchant}
                            </span>
                          </div>
                          
                          {categoryData.additionalInfo && (
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faLocationDot} className="text-white/60 text-xs" />
                              <span className="text-white/60 text-xs">
                                {categoryData.additionalInfo}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <CommunityBottomBar
            active={'category'}
            communityId={communityData.id}
          />
        </div>
      </div>
    </>
  );
}