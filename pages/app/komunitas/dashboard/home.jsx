/* eslint-disable no-console */
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import CommunityBottomBar from './CommunityBottomBar';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { distanceConvert } from '../../../../helpers/distanceConvert.helpers';

// Custom hook untuk handle image loading dengan fallback
const useImageWithFallback = (src, fallback = '/default-avatar.png') => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setIsError(false);
  }, [src]);

  const handleError = () => {
    if (!isError) {
      console.warn('Image failed to load:', imageSrc);
      setIsError(true);
      setImageSrc(fallback);
    }
  };

  const handleLoad = () => {
    if (!isError) {
      console.log('Image loaded successfully:', imageSrc);
    }
  };

  return { imageSrc, handleError, handleLoad, isError };
};

const getNormalizedType = (ad, cube = null) => {
  const t1 = String(ad?.type || '').toLowerCase();
  const t2 = String(cube?.type || ad?.cube?.type || '').toLowerCase();
  const ct = String(cube?.content_type || ad?.content_type || '').toLowerCase();

  // Informasi menang duluan
  if (normalizeBoolLike(ad?.is_information) || normalizeBoolLike(ad?.cube?.is_information) || normalizeBoolLike(cube?.is_information)) return 'information';
  if (t1 === 'information' || t2 === 'information' || ['kubus-informasi', 'information', 'informasi'].includes(ct)) return 'information';

  // Voucher
  if (t1 === 'voucher' || normalizeBoolLike(ad?.is_voucher) || normalizeBoolLike(ad?.voucher)) return 'voucher';

  // Iklan (HANYA dari type/flag, BUKAN kategori)
  if (t1 === 'iklan' || t2 === 'iklan' || normalizeBoolLike(ad?.is_advertising) || normalizeBoolLike(ad?.advertising)) return 'iklan';

  // Default aman
  return 'promo';
};

// tambahkan helper normalisasi gambar
const normalizeImageSrc = (raw) => {
  if (!raw) return '/default-avatar.png';
  if (typeof raw !== 'string') return '/default-avatar.png';
  const s = raw.trim();
  if (!s) return '/default-avatar.png';

  // absolute URL -> return as is
  if (/^https?:\/\//i.test(s)) return s;
  // data URI -> return as is
  if (/^data:/i.test(s)) return s;

  // Handle storage paths
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiBase = baseUrl.replace(/\/api\/?$/, '');

  // Remove leading slashes and api/storage prefix
  let path = s.replace(/^\/+/, '').replace(/^api\/storage\//i, 'storage/');

  // Add storage prefix if needed for common directories (including communities)
  if (/^(ads|promos|uploads|images|files|banners|communities)\//i.test(path)) {
    path = `storage/${path}`;
  }

  // If path doesn't start with storage and isn't absolute, add leading slash
  if (!path.startsWith('storage/') && !path.startsWith('/')) {
    path = `/${path}`;
  }

  // Build full URL for storage paths
  if (path.startsWith('storage/')) {
    const fullUrl = `${apiBase}/${path}`.replace(/([^:]\/)\/+/g, '$1');

    // Debug logging untuk troubleshooting
    console.log('normalizeImageSrc debug:', {
      input: raw,
      cleanPath: path,
      fullUrl,
      apiBase
    });

    return fullUrl;
  }

  // For other paths, ensure leading slash
  return path.startsWith('/') ? path : `/${path}`;
};

// Helper khusus untuk logo komunitas (mirip dengan komunitas.jsx)
const buildLogoUrl = (logo) => {
  try {
    if (!logo) return '/default-avatar.png';
    if (/^https?:\/\//i.test(logo)) return logo; // already absolute

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const apiBase = baseUrl.replace(/\/api\/?$/, '');

    const cleanLogo = String(logo)
      .replace(/^\/+/, "")
      .replace(/^api\/storage\//, "storage/");

    // Handle different path formats for community logos
    let finalPath;
    if (cleanLogo.startsWith("storage/")) {
      finalPath = `/${cleanLogo}`;
    } else if (cleanLogo.startsWith("communities/")) {
      // Path sudah dalam format communities/, tambahkan storage/
      finalPath = `/storage/${cleanLogo}`;
    } else if (cleanLogo.includes("/")) {
      // Path dengan folder, pastikan ada storage/
      finalPath = `/storage/${cleanLogo}`;
    } else {
      // File name saja, asumsikan di folder communities
      finalPath = `/storage/communities/${cleanLogo}`;
    }

    const fullUrl = `${apiBase}${finalPath}`.replace(/([^:]\/)\/+/g, '$1');

    // Debug logging untuk troubleshooting
    console.log('buildLogoUrl debug:', {
      input: logo,
      cleanLogo,
      finalPath,
      fullUrl,
      apiBase
    });

    // Validasi URL sebelum return
    try {
      new URL(fullUrl);
      return fullUrl;
    } catch {
      console.warn('Invalid URL generated for logo:', fullUrl);
      return '/default-avatar.png';
    }
  } catch (error) {
    console.warn('Error building logo URL:', error, 'for logo:', logo);
    return '/default-avatar.png';
  }
};

// === [ADD] helpers biar label konsisten seperti di app/index.jsx ===
const getAdImage = (ad) =>
  ad?.image_1 || ad?.image_2 || ad?.image_3 || ad?.picture_source || '';

const normalizeBoolLike = (val) => {
  if (val === true || val === 1) return true;
  if (typeof val === 'number') return val === 1;
  if (Array.isArray(val)) return val.length > 0 && (val.includes(1) || val.includes('1') || val.includes(true));
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (['1', 'true', 'y', 'yes', 'ya', 'iya', 'on'].includes(s)) return true;
    if (['0', 'false', 'n', 'no', 'off', ''].includes(s)) return false;
    try { return normalizeBoolLike(JSON.parse(val)); } catch { }
  }
  return !!val;
};

const getIsInformation = (item) => {
  if (!item) return false;

  // Prioritas pengecekan:
  // 1. Field is_information di item atau cube
  const itemInfo = normalizeBoolLike(item?.is_information);
  const cubeInfo = normalizeBoolLike(item?.cube?.is_information);

  // 2. Content type yang spesifik untuk kubus informasi
  const itemContentType = String(item?.content_type || '').toLowerCase();
  const cubeContentType = String(item?.cube?.content_type || '').toLowerCase();
  const contentTypeInfo = ['kubus-informasi', 'information', 'informasi'].includes(itemContentType) ||
    ['kubus-informasi', 'information', 'informasi'].includes(cubeContentType);

  // 3. Type field yang menunjukkan informasi
  const itemType = String(item?.type || '').toLowerCase();
  const cubeType = String(item?.cube?.type || '').toLowerCase();
  const typeInfo = ['information', 'informasi', 'kubus-informasi'].includes(itemType) ||
    ['information', 'informasi', 'kubus-informasi'].includes(cubeType);

  // 4. Cube type name yang menunjukkan informasi
  const cubeTypeName = String(item?.cube_type?.name || item?.cube?.cube_type?.name || '').toLowerCase();
  const cubeTypeInfo = ['information', 'informasi', 'kubus informasi', 'kubus-informasi'].includes(cubeTypeName);

  // 5. Khusus untuk cube yang langsung diterima (bukan melalui ad)
  const directCubeCheck = item?.ads !== undefined; // Jika ada property ads, kemungkinan ini cube langsung

  return itemInfo || cubeInfo || contentTypeInfo || typeInfo || cubeTypeInfo;
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

// Helper function to get additional informational data
const getAdditionalInfo = (ad, cube, communityData) => {
  const info = {};

  // Get creation date
  const createdAt = ad?.created_at || cube?.created_at;
  if (createdAt) {
    const date = new Date(createdAt);
    info.createdDate = date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Get status information
  if (ad) {
    info.status = ad.status || 'active';
    info.type = ad.type || 'general';

    // Get grab information for vouchers/promos
    if (ad.max_grab) {
      info.maxGrab = ad.unlimited_grab ? 'Unlimited' : `${ad.max_grab} tersisa`;
    }

    // Get validation type
    if (ad.validation_type) {
      info.validationType = ad.validation_type === 'auto' ? 'Auto Validasi' : 'Manual Validasi';
    }
  }

  // Get community info
  if (communityData) {
    info.communityName = communityData.name;
    info.memberCount = communityData.members || 0;
  }

  return info;
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

export default function CommunityDashboard({ communityId }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [communityData, setCommunityData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tambah state untuk widget komunitas (type=information)
  const [widgetData, setWidgetData] = useState([]);
  // ad_category: data options dan level (posisi) widget dimana kategori harus muncul
  const [adCategories, setAdCategories] = useState([]);
  const [adCategoryLevel, setAdCategoryLevel] = useState(null);

  // Use custom hook for avatar image handling
  const avatarUrl = communityData?.avatar ? buildLogoUrl(communityData.avatar) : '/default-avatar.png';
  const { imageSrc: avatarSrc, handleError: handleAvatarError, handleLoad: handleAvatarLoad, isError: avatarError } = useImageWithFallback(avatarUrl);
  // Fetch widget komunitas (type=information)
  useEffect(() => {
    const fetchWidgetData = async () => {
      if (!communityId) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const apiBase = baseUrl.replace(/\/api\/?$/, '');
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : '';
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(`${apiBase}/api/admin/dynamic-content?type=information&community_id=${communityId}`, { headers });
        const json = await res.json();
        let widgets = Array.isArray(json?.data) ? json.data.filter((w) => w.is_active) : [];

        // === NEW: fetch promo widgets and pick shuffle_cube entries so "Promo/Iklan Acak" can show in community dashboard
        try {
          const promoRes = await fetch(`${apiBase}/api/admin/dynamic-content?type=promo&community_id=${communityId}`, { headers });
          const promoJson = await promoRes.json();
          const promoWidgets = Array.isArray(promoJson?.data) ? promoJson.data : [];
          // keep only active shuffle_cube widgets
          const shuffleWidgets = promoWidgets.filter(w => w?.is_active && String(w.source_type || '').toLowerCase() === 'shuffle_cube');
          if (shuffleWidgets.length) {
            // merge with information widgets, dedupe by id
            const map = new Map();
            widgets.concat(shuffleWidgets).forEach(w => { if (w?.id != null) map.set(w.id, w); });
            widgets = Array.from(map.values());
          }
        } catch (e) {
          console.warn('Failed to fetch promo widgets for shuffle_cube merge:', e);
        }

        // 🔹 Cari widget ad_category: ambil kategorinya dan hapus widget agar tidak dirender dua kali
        const adCategoryWidget = widgets.find((w) => w.source_type === 'ad_category');
        if (adCategoryWidget) {
          try {
            const catRes = await fetch(`${apiBase}/api/admin/options/ad-category?community_id=${communityId}`, { headers });
            const catJson = await catRes.json();
            if (catJson?.message === 'success' && Array.isArray(catJson.data)) {
              setAdCategories(catJson.data);
              setAdCategoryLevel(adCategoryWidget.level ?? null);
            } else {
              setAdCategories([]);
              setAdCategoryLevel(null);
            }
          } catch (e) {
            console.error('Gagal ambil ad_category saat fetch widget:', e);
            setAdCategories([]);
            setAdCategoryLevel(null);
          }

          // remove the ad_category widget so it won't render via WidgetRenderer
          widgets = widgets.filter((w) => w.id !== adCategoryWidget.id);
        } else {
          setAdCategories([]);
          setAdCategoryLevel(null);
        }

        // 🔹 Urutkan widget berdasarkan level naik
        widgets = widgets.sort((a, b) => (a.level || 0) - (b.level || 0));
        setWidgetData(widgets);
      } catch (err) {
        console.error('Gagal ambil widget data:', err);
        setWidgetData([]);
        setAdCategories([]);
        setAdCategoryLevel(null);
      }
    };

    fetchWidgetData();
  }, [communityId]);

  // ======== UI TOKENS (BIAR KONSISTEN) ========
  const COLORS = {
    olive: '#5a6e1d',
    oliveSoft: 'rgba(90,110,29,0.1)',
    oliveBorder: '#cdd0b3',
    textDark: '#2B3A55',
  };

  // ======== SHUFFLE CUBE WIDGET ========
  const ShuffleCubeWidget = ({ widget }) => {
    const { size, name } = widget;
    const [shuffleData, setShuffleData] = useState([]);
    const [shuffleLoading, setShuffleLoading] = useState(true);

    useEffect(() => {
      const fetchShuffleData = async () => {
        try {
          setShuffleLoading(true);
          const encryptedToken = Cookies.get(token_cookie_name);
          const token = encryptedToken ? Decrypt(encryptedToken) : '';
          const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };

          // NORMALISASI: selalu panggil /api/shuffle-ads
          const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const apiBase = rawApi.replace(/\/api\/?$/, '');
          const response = await fetch(
            `${apiBase}/api/shuffle-ads?community_id=${communityId}`,
            { headers }
          );

          if (response.ok) {
            const data = await response.json();
            console.log('Shuffle ads response:', data);
            setShuffleData(
              Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
            );
          } else {
            console.error('Failed to fetch shuffle ads:', response.status, await response.text());
          }
        } catch (error) {
          console.error('Error fetching shuffle ads:', error);
        } finally {
          setShuffleLoading(false);
        }
      };

      if (communityId) {
        fetchShuffleData();
      }
    }, [communityId]);

    if (shuffleLoading) {
      return (
        <div className="mb-6">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white">{name}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[16px] bg-white/10 animate-pulse flex-shrink-0 backdrop-blur-md"
                style={{ minWidth: 320, height: 200 }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (!shuffleData?.length) return null;

    return (
      <div className="mb-6">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">{name}</h2>
          {widget.description && (
            <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {shuffleData.map((item, index) => {
            const cube = item?.cube;
            const ad = item;
            if (!cube && !ad) return null;

            const imageUrl = normalizeImageSrc(
              ad?.image_1 ||
              ad?.image ||
              ad?.picture_source ||
              cube?.image ||
              '/default-avatar.png'
            );
            const title = ad?.title || cube?.label || 'Promo';
            const merchant = ad?.merchant || communityData?.name || 'Merchant';
            const categoryData = getCategoryWithIcon(ad, cube, communityData);

            // Use glassmorphism styling consistent with home dashboard
            if (size === 'XL-Ads') {
              return (
                <div
                  key={ad?.id || cube?.id || index}
                  className="relative rounded-[18px] overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-lg flex-shrink-0 hover:scale-[1.02] hover:bg-white/15 transition-all duration-300"
                  style={{
                    minWidth: 320,
                    maxWidth: 360,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (ad?.id) {
                      router.push(`/app/iklan/${ad.id}?communityId=${communityId}`);
                    }
                  }}
                >
                  <div className="relative w-full h-[290px] bg-white/5 flex items-center justify-center">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-contain p-2"
                    />
                    <div className="absolute top-3 left-3 bg-black/40 text-white text-[11px] font-semibold px-3 py-[3px] rounded-full shadow-sm border border-white/30 backdrop-blur-sm">
                      {merchant}
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-black/20 backdrop-blur-sm p-4 border-t border-white/20">
                    <h3 className="text-[15px] font-bold text-white leading-snug mb-2 line-clamp-1">
                      {title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="bg-white/20 text-white text-[11px] font-semibold px-3 py-[3px] rounded-md border border-white/40 backdrop-blur-sm flex items-center gap-1">
                        {categoryData.icon}
                        {categoryData.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Default size handling with glassmorphism
            return (
              <div
                key={ad?.id || cube?.id || index}
                className="rounded-[16px] overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-lg flex-shrink-0 hover:scale-[1.02] hover:bg-white/15 transition-all duration-300"
                style={{
                  minWidth: 320,
                  maxWidth: 360,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (ad?.id) {
                    router.push(`/app/iklan/${ad.id}?communityId=${communityId}`);
                  }
                }}
              >
                <div className="relative w-full h-[200px] bg-white/5 flex items-center justify-center">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-white leading-snug mb-2 line-clamp-2 drop-shadow-sm">
                    {title}
                  </h3>
                  <p className="text-[12px] text-white/80 mb-2 drop-shadow-sm">{merchant}</p>
                  <span className="bg-white/20 text-white text-[11px] font-semibold px-2 py-1 rounded border border-white/30 backdrop-blur-sm flex items-center gap-1 w-fit">
                    {categoryData.icon}
                    {categoryData.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Komponen renderer widget sederhana (bisa diupgrade sesuai kebutuhan)
  function WidgetRenderer({ widget }) {
    const { source_type, size, dynamic_content_cubes, name, content_type, description } = widget;

    // Handle shuffle_cube widgets (add this)
    if (source_type === 'shuffle_cube') {
      return <ShuffleCubeWidget widget={widget} communityId={communityId} communityData={communityData} />;
    }

    // ===== Kotak Kategori (mirip di promo.jsx) =====
    if (content_type === 'category' && Array.isArray(dynamic_content_cubes) && dynamic_content_cubes.length > 0) {
      return (
        <div className="mb-6">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white">{name}</h2>
            {description && <p className="text-sm text-white/80 mt-[1px]">{description}</p>}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dynamic_content_cubes.map((catData, index) => {
              // support both shapes: { cube: {...} } or direct cube object
              const cube = catData?.cube || catData;
              if (!cube) return null;

              const imgSrc =
                cube.image ||
                cube.picture_source ||
                cube.image_1 ||
                catData?.image ||
                '/default-avatar.png';
              const label = cube.category || cube.label || cube.name || catData?.label || 'Kategori';
              const id = cube.id ?? cube.value ?? index;

              return (
                <div
                  key={id}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-all duration-300"
                  style={{ minWidth: 90 }}
                  onClick={() =>
                    router.push(`/app/komunitas/category?categoryId=${id}&communityId=${communityId}`)
                  }
                >
                  <div className="relative w-[90px] aspect-square rounded-[12px] overflow-hidden border border-white/30 bg-white/20 backdrop-blur-md shadow-lg">
                    <Image
                      src={normalizeImageSrc(imgSrc)}
                      alt={label}
                      fill
                      className="object-cover brightness-90"
                    />
                    <div className="absolute bottom-0 left-0 w-full text-center bg-white/40 backdrop-blur-md py-1.5 px-1">
                      <p className="text-[11px] text-slate-900 font-medium line-clamp-1">{label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (widget.content_type === 'nearby') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [items, setItems] = useState([]);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [loading, setLoading] = useState(true);

      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        let mounted = true;
        (async () => {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const apiBase = baseUrl.replace(/\/api\/?$/, '');
            const headers = { 'Content-Type': 'application/json' };

            let lat = null, lng = null;
            if (typeof navigator !== 'undefined' && navigator.geolocation) {
              await new Promise((resolve) => navigator.geolocation.getCurrentPosition(
                (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
                () => resolve(),
                { enableHighAccuracy: true, timeout: 5000 }
              ));
            }
            if (lat == null || lng == null) { setItems([]); setLoading(false); return; }

            const res = await fetch(`${apiBase}/api/ads/promo-nearest/${lat}/${lng}`, { headers });
            const json = await res.json();
            if (!mounted) return;

            const list = Array.isArray(json?.data) ? json.data : [];
            // normalisasi dan filter: hanya tampilkan item yang diklasifikasikan sebagai 'promo'
            const normalized = list
              .map((row) => {
                const ad = row?.ad || row?.ads?.[0] || row;
                const cube = row?.cube || ad?.cube || row?.ad?.cube || {};
                return { cube: { ...cube, ads: ad ? [ad] : [] }, ad };
              })
              .filter(item => getNormalizedType(item.ad, item.cube) === 'promo');


            setItems(normalized);
          } finally { if (mounted) setLoading(false); }
        })();
        return () => { mounted = false; };
      }, [communityId]);

      if (loading) return <div className="text-white/80 text-sm mb-4">Memuat {widget.name || 'terdekat'}…</div>;
      if (!items.length) return null;

      return (
        <div className="mb-6">
          {(widget.name || widget.description) && (
            <div className="mb-2 px-1">
              {widget.name && <h2 className="text-lg font-bold text-white">{widget.name}</h2>}
              {widget.description && <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>}
            </div>
          )}
          {/* LIST VERTIKAL – biarkan seperti ini */}
          <div className="flex flex-col gap-3 mt-4">
            {items.map((cubeData, key) => {
              const cube = cubeData?.cube;
              if (!cube) return null;
              const ad = cube?.ads?.[0] || null;

              const isInformationCube = getIsInformation(cube) || getIsInformation(ad);
              const imageUrl = ad ? getAdImage(ad) : (cube.image || cube.picture_source || '/default-avatar.png');
              const title = ad?.title || cube.label || cube.name || 'Promo';
              const address = ad?.cube?.address || cube.address || '';
              const distanceRaw = ad?.distance ?? cube?.distance ?? null;
              const worldName = ad?.cube?.world?.name || cube?.world?.name || 'General';

              let href = '#';
              if (isInformationCube) {
                const code = cube.code || ad?.cube?.code || ad?.code;
                if (code) href = `/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(code)}${communityId ? `&communityId=${communityId}` : ''}`;
              } else if (ad?.id) {
                href = getIsAdvertising(ad, cube)
                  ? `/app/iklan/${ad.id}${communityId ? `?communityId=${communityId}` : ''}`
                  : `/app/komunitas/promo/detail_promo?promoId=${ad.id}${communityId ? `&communityId=${communityId}` : ''}`;
              }

              return (
                <Link href={href} key={key}>
                  <div className="grid grid-cols-4 gap-3 p-3 rounded-[15px] bg-white/40 backdrop-blur-sm border border-white/30 hover:scale-[1.01] transition-transform">
                    <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-300">
                      <Image src={normalizeImageSrc(imageUrl)} alt={title} width={700} height={700} className="w-full h-full object-cover" />
                    </div>
                    <div className="col-span-3">
                      <p className="font-semibold text-white drop-shadow-sm limit__line__1">{title}</p>
                      {!!address && <p className="text-white/90 text-xs my-1 limit__line__2 drop-shadow-sm">{address}</p>}
                      <div className="flex flex-wrap gap-2 mt-2 items-center text-white/90">
                        {distanceRaw != null && (
                          <>
                            <span className="text-xs"><FontAwesomeIcon icon={faLocationDot} /> {distanceConvert(distanceRaw)}</span>
                            <span className="text-xs"> | </span>
                          </>
                        )}
                        <span className="text-xs font-semibold"><FontAwesomeIcon icon={faGlobe} /> {worldName}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      );
    }

    if (widget.content_type === 'recommendation') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [items, setItems] = useState([]);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [loading, setLoading] = useState(true);

      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        let mounted = true;
        (async () => {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const apiBase = baseUrl.replace(/\/api\/?$/, '');
            const headers = { 'Content-Type': 'application/json' };
            const res = await fetch(`${apiBase}/api/ads/promo-recommendation`, { headers });
            const json = await res.json();
            if (!mounted) return;

            const list = Array.isArray(json?.data) ? json.data : [];
            const normalized = list.map((row) => {
              const ad = row?.ad || row?.ads?.[0] || row;
              const cube = row?.cube || ad?.cube || row?.ad?.cube || {};
              return { cube: { ...cube, ads: ad ? [ad] : [] } };
            });

            setItems(normalized);
          } catch {
            setItems([]);
          } finally {
            setLoading(false);
          }
        })();
        return () => { mounted = false; };
      }, [communityId]);

      if (loading) return <div className="text-white/80 text-sm mb-4">Memuat {widget.name || 'rekomendasi'}…</div>;
      if (!items.length) return null;

      return (
        <div className="mb-6">
          {(widget.name || widget.description) && (
            <div className="mb-2 px-1">
              {widget.name && <h2 className="text-lg font-bold text-white">{widget.name}</h2>}
              {widget.description && <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>}
            </div>
          )}

          {/* LIST HORIZONTAL + sembunyikan scrollbar */}
          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="flex flex-nowrap gap-4 w-max">
              {items.map((cubeData, index) => {
                const cube = cubeData?.cube;
                if (!cube) return null;
                const ad = cube?.ads?.[0] || null;

                const isInformationCube = getIsInformation(cube) || getIsInformation(ad);
                const imageUrl = ad ? getAdImage(ad) : (cube.image || '/default-avatar.png');
                const title = ad?.title || cube.label || 'Promo';
                const description = ad?.description || cube.description || '';
                const address = ad?.cube?.address || cube.address || '';

                let href = '#';
                if (isInformationCube) {
                  const code = cube.code || ad?.cube?.code || ad?.code;
                  if (code) href = `/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(code)}${communityId ? `&communityId=${communityId}` : ''}`;
                } else if (ad?.id) {
                  href = getIsAdvertising(ad, cube)
                    ? `/app/iklan/${ad.id}${communityId ? `?communityId=${communityId}` : ''}`
                    : `/app/komunitas/promo/detail_promo?promoId=${ad.id}${communityId ? `&communityId=${communityId}` : ''}`;
                }

                // Kartu ukuran M (ringkas, horizontal-friendly)
                return (
                  <Link href={href} key={index}>
                    <div
                      className="flex flex-col rounded-[12px] overflow-hidden border border-white/20 shadow-lg flex-shrink-0 hover:scale-[1.02] transition-all duration-300 bg-white/10 backdrop-blur-md"
                      style={{ minWidth: 200, maxWidth: 220, height: 280 }}
                    >
                      <div className="relative w-full overflow-hidden">
                        <div className="w-full aspect-square relative">
                          <Image src={normalizeImageSrc(imageUrl)} alt={title} fill className="object-cover" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-8" />
                      </div>

                      <div className="flex-1 p-3 bg-white/20 backdrop-blur-md border-t border-white/20">
                        <h3 className="text-[14px] font-bold text-white line-clamp-2 leading-tight mb-1 drop-shadow-sm">{title}</h3>
                        {description && <p className="text-[11px] text-white/90 leading-relaxed line-clamp-2 mb-2 drop-shadow-sm">{description}</p>}
                        {address && <p className="text-[10px] text-white/80 line-clamp-1 drop-shadow-sm">{address}</p>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (source_type === 'cube' && Array.isArray(dynamic_content_cubes) && dynamic_content_cubes.length > 0) {
      // layout logic handled inline per size case
      return (
        <div className="mb-6">
          {/* Header Widget */}
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white">{name}</h2>
            {widget.description && (
              <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
            )}
          </div>


          {/* Konten Scrollable */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dynamic_content_cubes.map((cubeData, index) => {
              const cube = cubeData?.cube;
              if (!cube) return null;

              // Ambil 1 ad yang menempel ke cube (kalau ada)
              const ad = cube.ads?.[0] || null;

              // Cek apakah ini kubus informasi
              const isInformationCube = getIsInformation(cube) || getIsInformation(ad);

              // Siapkan data untuk kartu dengan prioritas yang benar:
              let imageUrl, title, merchant, address, categoryData, description;

              if (isInformationCube) {
                // Untuk kubus informasi, prioritaskan data dari cube
                imageUrl = cube.picture_source || cube.image || (ad ? getAdImage(ad) : '/default-avatar.png');
                title = cube.label || cube.name || ad?.title || 'Informasi';
                merchant = cube.merchant || communityData?.name || ad?.merchant || 'Informasi';
                address = cube.address || ad?.cube?.address || '';
                categoryData = getCategoryWithIcon(ad, cube, communityData);
                description = cube.description || ad?.description || '';
              } else {
                // Untuk promo/iklan, prioritaskan data dari ad
                imageUrl = ad ? getAdImage(ad) : (cube.image || '/default-avatar.png');
                title = ad?.title || cube.label || 'Promo';
                merchant = ad?.merchant || communityData?.name || 'Merchant';
                address = ad?.cube?.address || cube.address || '';
                categoryData = ad ? getCategoryWithIcon(ad, cube, communityData) : getCategoryWithIcon(null, cube, communityData);
                description = ad?.description || cube.description || '';
              }


              // --- lalu bagian layout (XL-Ads/XL/L/S/M) dengan glassmorphism effect ---
              if (size === 'XL-Ads') {
                return (
                  <div
                    key={cube?.id || index}
                    className="rounded-[16px] overflow-hidden border border-white/20 shadow-xl flex-shrink-0 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md"
                    style={{ minWidth: 320, maxWidth: 350, cursor: 'pointer' }}
                    onClick={() => {
                      if (isInformationCube) {
                        // Untuk kubus informasi, prioritaskan code dari cube
                        const code = cube.code || ad?.cube?.code || ad?.code;
                        if (code) {
                          const targetUrl = communityId
                            ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
                            : `/app/kubus-informasi/kubus-infor?code=${code}`;
                          router.push(targetUrl);
                        } else {
                          console.warn('Kubus informasi tidak memiliki code yang valid:', { cube, ad });
                        }
                        return;
                      }
                      if (ad?.id) {
                        // Cek apakah ini iklan/advertising
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
                      }
                    }}
                  >
                    {/* Image Section */}
                    <div className="relative w-full bg-white/20 backdrop-blur-sm overflow-hidden">
                      <div className="w-full aspect-[4/3] relative">
                        <Image src={normalizeImageSrc(imageUrl)} alt={title} fill className="object-cover" />
                      </div>
                      <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] font-semibold px-2 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-1">
                        <span>{categoryData.icon}</span>
                        <span>{categoryData.label}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-3 bg-white/20 backdrop-blur-md border-t border-white/20">
                      <h3 className="text-base font-bold text-white line-clamp-2 mb-1 drop-shadow-sm">{title}</h3>
                      {description && (
                        <p className="text-xs text-white/90 leading-relaxed mb-2 line-clamp-2 drop-shadow-sm">
                          {description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-white/30 border border-white/40 text-white text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm">
                            {merchant}
                          </span>
                          {categoryData.additionalInfo.createdDate && (
                            <span className="text-[10px] text-white/80">
                              {categoryData.additionalInfo.createdDate}
                            </span>
                          )}
                        </div>
                        {categoryData.additionalInfo.maxGrab && (
                          <span className="text-[10px] text-white font-medium bg-white/20 px-2 py-1 rounded-md">
                            {categoryData.additionalInfo.maxGrab}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (size === 'XL') {
                return (
                  <div
                    key={cube.id || index}
                    className="rounded-[16px] overflow-hidden border border-white/20 shadow-xl flex-shrink-0 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md"
                    style={{ minWidth: 320, maxWidth: 350, cursor: 'pointer' }}
                    onClick={() => {
                      if (isInformationCube) {
                        // Untuk kubus informasi, prioritaskan code dari cube
                        const code = cube.code || ad?.cube?.code || ad?.code;
                        if (code) {
                          const targetUrl = communityId
                            ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
                            : `/app/kubus-informasi/kubus-infor?code=${code}`;
                          router.push(targetUrl);
                        } else {
                          console.warn('Kubus informasi tidak memiliki code yang valid:', { cube, ad });
                        }
                        return;
                      }
                      if (ad?.id) {
                        // Cek apakah ini iklan/advertising
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
                      }
                    }}
                  >
                    {/* Image Section */}
                    <div className="relative w-full bg-white/20 backdrop-blur-sm overflow-hidden">
                      <div className="w-full aspect-[4/3] relative">
                        <Image src={normalizeImageSrc(imageUrl)} alt={title} fill className="object-cover" />
                      </div>
                      <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] font-semibold px-2 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-1">
                        <span>{categoryData.icon}</span>
                        <span>{categoryData.label}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-3 bg-white/20 backdrop-blur-md border-t border-white/20">
                      <h3 className="text-base font-bold text-white line-clamp-2 mb-1 drop-shadow-sm">{title}</h3>
                      {description && (
                        <p className="text-xs text-white/90 leading-relaxed mb-2 line-clamp-2 drop-shadow-sm">
                          {description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="bg-white/30 border border-white/40 text-white text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm truncate flex-1">
                          {merchant}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (size === 'L') {
                return (
                  <div
                    key={cube.id || index}
                    className="flex rounded-[16px] overflow-hidden border border-white/20 shadow-xl flex-shrink-0 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md"
                    style={{ minWidth: 320, maxWidth: 350, cursor: 'pointer' }}
                    onClick={() => {
                      if (isInformationCube) {
                        // Untuk kubus informasi, prioritaskan code dari cube
                        const code = cube.code || ad?.cube?.code || ad?.code;
                        if (code) {
                          const targetUrl = communityId
                            ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
                            : `/app/kubus-informasi/kubus-infor?code=${code}`;
                          router.push(targetUrl);
                        } else {
                          console.warn('Kubus informasi tidak memiliki code yang valid:', { cube, ad });
                        }
                        return;
                      }
                      if (ad?.id) {
                        // Cek apakah ini iklan/advertising
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
                      }
                    }}
                  >
                    {/* Image Section */}
                    <div className="w-2/5 relative bg-white/20 backdrop-blur-sm overflow-hidden">
                      <Image src={normalizeImageSrc(imageUrl)} alt={title} fill className="object-cover" />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] font-semibold px-2 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-1">
                        <span>{categoryData.icon}</span>
                        <span>{categoryData.label}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="w-3/5 p-3 bg-white/20 backdrop-blur-md border-l border-white/20 flex flex-col justify-between">
                      <div className="flex-1">
                        <h3 className="text-[14px] font-bold text-white line-clamp-2 leading-tight mb-1 drop-shadow-sm">{title}</h3>
                        {description && (
                          <p className="text-[12px] text-white/90 leading-relaxed line-clamp-2 mb-2 drop-shadow-sm">
                            {description}
                          </p>
                        )}
                        {address && <p className="text-[11px] text-white/80 line-clamp-1 drop-shadow-sm">{address}</p>}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-white/30 border border-white/40 text-white text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm">
                            {merchant}
                          </span>
                          {categoryData.additionalInfo.createdDate && (
                            <span className="text-[10px] text-white/80">
                              {categoryData.additionalInfo.createdDate}
                            </span>
                          )}
                        </div>
                        {categoryData.additionalInfo.maxGrab && (
                          <span className="text-[10px] text-blue-200 font-medium">
                            {categoryData.additionalInfo.maxGrab}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // S / M
              const isM = size === 'M';
              return (
                <div
                  key={cube.id || index}
                  className="flex flex-col rounded-[12px] overflow-hidden border border-white/20 shadow-lg flex-shrink-0 hover:scale-[1.02] transition-all duration-300 bg-white/10 backdrop-blur-md"
                  style={{
                    minWidth: isM ? 200 : 160,
                    maxWidth: isM ? 220 : 180,
                    height: isM ? 280 : 240,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (isInformationCube) {
                      // Untuk kubus informasi, prioritaskan code dari cube
                      const code = cube.code || ad?.cube?.code || ad?.code;
                      if (code) {
                        const targetUrl = communityId
                          ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
                          : `/app/kubus-informasi/kubus-infor?code=${code}`;
                        router.push(targetUrl);
                      } else {
                        console.warn('Kubus informasi tidak memiliki code yang valid:', { cube, ad });
                      }
                      return;
                    }
                    if (ad?.id) {
                      // Cek apakah ini iklan/advertising
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
                    }
                  }}
                >
                  {/* Image Section */}
                  <div className="relative w-full bg-white/20 backdrop-blur-sm overflow-hidden">
                    <div className="w-full aspect-square relative">
                      <Image
                        src={normalizeImageSrc(imageUrl)}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] font-semibold px-2 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-1">
                      <span>{categoryData.icon}</span>
                      <span>{categoryData.label}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-8"></div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-3 bg-white/20 backdrop-blur-md border-t border-white/20 flex flex-col justify-between">
                    <div className="flex-1">
                      <h3 className={`${isM ? 'text-[14px]' : 'text-[13px]'} font-bold text-white line-clamp-2 leading-tight mb-1 drop-shadow-sm`}>
                        {title}
                      </h3>
                      {description && (
                        <p className={`${isM ? 'text-[11px]' : 'text-[10px]'} text-white/90 leading-relaxed line-clamp-${isM ? '3' : '2'} mb-2 drop-shadow-sm`}>
                          {description}
                        </p>
                      )}
                      {address && (
                        <p className={`${isM ? 'text-[10px]' : 'text-[9px]'} text-white/80 line-clamp-1 drop-shadow-sm`}>
                          {address}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <div className="flex flex-col gap-1">
                        <span className="bg-white/30 border border-white/40 text-white text-[9px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm block text-center truncate">
                          {merchant}
                        </span>
                        <div className="flex items-center justify-between">
                          {categoryData.additionalInfo.createdDate && (
                            <span className="text-[8px] text-white/70">
                              {categoryData.additionalInfo.createdDate}
                            </span>
                          )}
                          {categoryData.additionalInfo.maxGrab && (
                            <span className="text-[8px] text-blue-200 font-medium">
                              {categoryData.additionalInfo.maxGrab}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }



  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch community data from API
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!communityId) return;

      try {
        setLoading(true);
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : '';

        // Handle API URL properly - remove /api if it exists, then add it back
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const apiUrl = baseUrl.replace(/\/api\/?$/, '');

        const response = await fetch(`${apiUrl}/api/communities/${communityId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (response.ok) {
          const result = await response.json();
          const community = result.data || result;

          // Debug logging untuk avatar/logo
          console.log('Community API Response:', {
            logo: community.logo,
            avatar: community.avatar,
            fullCommunity: community
          });

          // Use API response directly, no dummy/default values
          setCommunityData({
            id: community.id,
            name: community.name,
            description: community.description ?? null,
            members: community.members ?? 0,
            category: community.category ?? null,
            location: community.location ?? null,
            privacy: community.privacy ?? null,
            isVerified: community.isVerified ?? community.is_verified ?? null,
            avatar: community.logo ?? null,
            bg_color_1: community.bg_color_1 ?? null,
            bg_color_2: community.bg_color_2 ?? null,
          });
        } else {
          // No dummy fallback — set null so UI shows "not found" or handle accordingly
          setCommunityData(null);
        }
      } catch (error) {
        // On error, don't inject dummy data — set null
        setCommunityData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [communityId]);

  // Note: promo fetching removed from this screen to keep component focused.

  // Function untuk menentukan gradient berdasarkan bg_color dari backend (tanpa dummy fallback)
  const getCommunityGradient = (bgColor1, bgColor2) => {
    // Jika ada bg_color_1 dan bg_color_2 dari backend, gunakan itu
    if (bgColor1 && bgColor2) {
      return {
        backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`,
      };
    }
    // Jika hanya ada bg_color_1, buat gradasi dengan versi transparan/gelapnya
    if (bgColor1) {
      return {
        backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor1}dd)`,
      };
    }
    // Fallback minimal jika BE tidak mengirim warna
    return {
      backgroundImage: 'linear-gradient(135deg, #16a34a, #059669)',
    };
  };

  // Loading state
  if (!isClient || loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-background min-h-screen w-full relative z-20 bg-gradient-to-br from-cyan-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-primary rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Memuat...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-slate-600">
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

  // Admin-style dashboard layout
  return (
    <>
      <div className="relative lg:mx-auto lg:max-w-md min-h-screen" style={typeof communityBgStyle === 'object' ? communityBgStyle : {}}>
        {/* Dimmer overlay to ensure content stays readable over strong backgrounds */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-0 pointer-events-none" />
        <div className="container mx-auto relative z-10 pb-28">
          {/* Content over full-page background (no header) */}
          <div className="min-h-screen w-full">
            <div className="px-6 pt-6">
              {/* Community intro block (not a header) */}
              <div className="mb-6">
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-4 text-white shadow-sm">
                  {/* Avatar, title, dan deskripsi dalam satu baris */}
                  <div className="flex items-start gap-4">
                    {/* Avatar komunitas - Square shape */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-white/40 bg-white/10 flex-shrink-0 shadow-lg">
                      {!avatarError && communityData.avatar ? (
                        <Image
                          src={avatarSrc}
                          alt={`Logo ${communityData.name}`}
                          fill
                          className="object-cover"
                          onError={handleAvatarError}
                          onLoad={handleAvatarLoad}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/30 to-white/10">
                          <span className="text-white/80 text-xl font-bold">
                            {communityData.name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        </div>
                      )}
                      {/* Overlay untuk efek glass */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    </div>

                    {/* Title dan deskripsi di sebelah kanan */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold mb-1 text-white">{communityData.name}</h2>
                      {communityData.description && (
                        <p className="text-sm opacity-90 leading-relaxed text-white/90 line-clamp-2">{communityData.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Komunitas Section (type=information) */}
              {(widgetData.length > 0 || adCategories.length > 0) && (
                <div className="mb-6">
                  {(() => {
                    // Create combined items with widgets and categories at correct level
                    const items = [];

                    // Add all widgets
                    widgetData.forEach(widget => {
                      items.push({
                        type: 'widget',
                        level: widget.level || 0,
                        data: widget
                      });
                    });

                    // Add category block if available
                    if (adCategories.length > 0 && adCategoryLevel !== null) {
                      items.push({
                        type: 'categories',
                        level: adCategoryLevel,
                        data: adCategories
                      });
                    }

                    // Sort by level
                    items.sort((a, b) => a.level - b.level);

                    // Render items
                    return items.map((item) => {
                      if (item.type === 'widget') {
                        return <WidgetRenderer key={item.data.id} widget={item.data} />;
                      } else if (item.type === 'categories') {
                        return (
                          <div key="categories" className="mb-6">
                            <div className="mb-2">
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {item.data.map((cat) => {
                                const imgSrc = cat.image || cat.picture_source || '/default-avatar.png';
                                const label = cat.label || cat.name || 'Kategori';
                                const id = cat.id || cat.value;

                                return (
                                  <div
                                    key={id}
                                    className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-all duration-300"
                                    style={{ minWidth: 90 }}
                                    onClick={() =>
                                      router.push(`/app/komunitas/category?categoryId=${id}&communityId=${communityId}`)
                                    }
                                  >
                                    <div className="relative w-[90px] aspect-square rounded-[12px] overflow-hidden border border-white/30 bg-white/20 backdrop-blur-md shadow-lg">
                                      <Image
                                        src={normalizeImageSrc(imgSrc)}
                                        alt={label}
                                        fill
                                        className="object-cover brightness-90"
                                      />
                                      <div className="absolute bottom-0 left-0 w-full text-center bg-white/40 backdrop-blur-md py-1.5 px-1">
                                        <p className="text-[11px] text-slate-900 font-medium line-clamp-1">{label}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    });
                  })()}
                </div>
              )}

              {/* Upcoming Events removed - not used */}

            </div>
          </div>
        </div>

        <CommunityBottomBar
          active={'community'}
          communityId={communityData.id}
        />
      </div>
    </>
  );
}

// ======= Add: ShuffleCubeWidget (mirip promo.jsx) =======
const ShuffleCubeWidget = ({ widget, communityId, communityData }) => {
  const { name, size } = widget;
  const [shuffleData, setShuffleData] = useState([]);
  const [loadingShuffle, setLoadingShuffle] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchShuffleData = async () => {
      const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiBase = rawApi.replace(/\/api\/?$/, '');
      // candidate endpoints (try in order)
      const candidates = [
        { name: 'public promo recommendation', url: `${apiBase}/api/ads/promo-recommendation` },
        { name: 'public promo nearest (no-loc)', url: `${apiBase}/api/ads/promo-nearest/0/0` }, // placeholder if BE ignores coords
        { name: 'protected shuffle ads', url: `${apiBase}/api/shuffle-ads` }, // needs auth
        { name: 'admin promo dynamic-content (shuffle widgets)', url: `${apiBase}/api/admin/dynamic-content?type=promo&community_id=${communityId}&paginate=all` }
      ];

      console.log('[ShuffleCubeWidget] fetch start, communityId=', communityId, 'apiBase=', apiBase);

      let got = [];
      for (const c of candidates) {
        try {
          console.log('[ShuffleCubeWidget] trying:', c.name, c.url);
          const headers = { 'Content-Type': 'application/json' };
          // If candidate is admin/protected, attempt with credentials (browser will send cookie if present)
          const opts = { headers, credentials: 'include' };

          const res = await fetch(c.url, opts);
          console.log('[ShuffleCubeWidget] response', c.name, res.status, res.statusText);
          let json;
          try { json = await res.json(); } catch (e) { json = null; console.warn('[ShuffleCubeWidget] invalid json for', c.name, e); }

          console.log('[ShuffleCubeWidget] payload', c.name, json);

          // normalize possible shapes: { data: [...] } or [...]
          const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : (Array.isArray(json?.ads) ? json.ads : []));
          if (Array.isArray(list) && list.length > 0) {
            console.log('[ShuffleCubeWidget] found data from', c.name, 'count=', list.length);
            got = list;
            break;
          }
        } catch (err) {
          console.error('[ShuffleCubeWidget] fetch error for', c.name, err);
        }
      }

      if (!mounted) return;
      if (got.length) {
        setShuffleData(got);
        console.log('[ShuffleCubeWidget] setShuffleData count=', got.length);
      } else {
        console.warn('[ShuffleCubeWidget] no data found from any candidate endpoints');
        setShuffleData([]);
      }
      if (mounted) setLoadingShuffle(false);
    };

    if (communityId) {
      fetchShuffleData().catch(e => {
        console.error('[ShuffleCubeWidget] unexpected error', e);
        if (mounted) { setShuffleData([]); setLoadingShuffle(false); }
      });
    } else {
      console.log('[ShuffleCubeWidget] communityId missing, skipping fetch');
      setLoadingShuffle(false);
    }

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  if (loadingShuffle) {
    return (
      <div className="mb-6">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">{name}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map(i => <div key={i} className="rounded-[16px] bg-gray-200 animate-pulse flex-shrink-0" style={{ minWidth: 320, height: 200 }} />)}
        </div>
      </div>
    );
  }

  if (!shuffleData?.length) return null;

  return (
    <div className="mb-6">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">{name}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {shuffleData.map((item, idx) => {
          const cube = item?.cube;
          const ad = item;
          // use normalized helpers to decide category (prioritize ad data)
          const imageUrl = normalizeImageSrc(ad?.image_1 || ad?.image || ad?.picture_source || cube?.image || '/default-avatar.png');
          const title = ad?.title || cube?.label || 'Promo';
          const merchant = ad?.merchant || communityData?.name || 'Merchant';
          const categoryData = getCategoryWithIcon(ad, cube, communityData);
          const category = categoryData?.label || getCategoryLabel(ad, cube) || 'Promo';

          return (
            <div
              key={ad?.id || cube?.id || idx}
              className="rounded-[16px] overflow-hidden border border-[#e6e6e6] bg-white shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
              style={{ minWidth: 320, maxWidth: 360, cursor: 'pointer' }}
              onClick={() => {
                // prefer ad (promo) navigation, fallback to cube (info)
                const promoId = ad?.id;
                if (promoId) {
                  const targetUrl = communityId
                    ? `/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=${communityId}`
                    : `/app/promo/detail_promo?promoId=${promoId}`;
                  router.push(targetUrl);
                  return;
                }
                const code = cube?.code;
                if (code) {
                  const targetUrl = communityId
                    ? `/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(code)}&communityId=${communityId}`
                    : `/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(code)}`;
                  router.push(targetUrl);
                }
              }}
            >
              <div className="relative w-full h-[200px] bg-white flex items-center justify-center">
                <Image src={imageUrl} alt={title} fill className="object-contain p-2" />
              </div>
              <div className="p-4">
                <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-2 line-clamp-2">{title}</h3>
                <p className="text-[12px] text-slate-600 mb-2">{merchant}</p>
                <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-1 rounded">{category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
