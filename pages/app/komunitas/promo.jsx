/* eslint-disable no-console */
import { faGift, faSearch } from '@fortawesome/free-solid-svg-icons';
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
  const [widgetData, setWidgetData] = useState([]); // widgets "hunting"
  const [adCategories, setAdCategories] = useState([]); // ambil ad_category di parent
  const [adCategoryLevel, setAdCategoryLevel] = useState(null); // level untuk posisi kategori
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // baseUrl = apiUrl tanpa trailing `/api`, tanpa trailing slash
  const baseUrl = (apiUrl || '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

  // ---- URL helpers ----
  const isAbsoluteUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
  const FALLBACK_IMAGE = '/default-avatar.png';

  const buildImageUrl = (raw) => {
    const fallback = FALLBACK_IMAGE;
    if (typeof raw !== 'string') return fallback;

    let url = raw.trim();
    if (!url) return fallback;

    // Jika fallback/local asset, jangan diprefix ke baseUrl (hindari host remote)
    if (/^\/?default-avatar\.png$/i.test(url)) return fallback;

    // Paksa placeholder lama ke fallback lokal
    if (/^\/?api\/placeholder\//i.test(url) || /^placeholder\//i.test(url)) {
      return fallback;
    }

    if (isAbsoluteUrl(url)) return url;

    // buang leading slash dan normalisasi
    let path = url.replace(/^\/+/, '');
    path = path.replace(/^api\/storage\//i, 'storage/');

    // map folder publik ke storage/*
    if (/^(ads|promos|uploads|images|files|banners)\//i.test(path)) {
      path = `storage/${path}`;
    }

    const finalUrl = `${baseUrl}/${path}`.replace(/([^:]\/)\/+/g, '$1');
    return /^https?:\/\//i.test(finalUrl) ? finalUrl : fallback;
  };

  const getAuthHeaders = () => {
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      return token
        ? {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
        : { 'Content-Type': 'application/json' };
    } catch (e) {
      return { 'Content-Type': 'application/json' };
    }
  };

  // === Helper functions untuk label (sama seperti di home.jsx) ===
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

    return itemInfo || cubeInfo || contentTypeInfo || typeInfo || cubeTypeInfo;
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

  // Fungsi untuk mengidentifikasi iklan/advertising
  const getIsAdvertising = (ad, cube = null) => {
    return getNormalizedType(ad, cube) === 'iklan';
  };

  const normalizePromos = (arr = []) => {
    let promos = (Array.isArray(arr) ? arr : []).map((p) => {
      // Ambil gambar dari ads[0] jika ada
      let ad = Array.isArray(p.ads) && p.ads.length > 0 ? p.ads[0] : null;
      let raw =
        ad?.image_1 ||
        ad?.image ||
        ad?.picture_source ||
        p.image_url ||
        p.image ||
        p.image_path ||
        FALLBACK_IMAGE;

      const image = buildImageUrl(raw);

      return {
        id: p.id ?? p.promo_id ?? ad?.id ?? Math.random(),
        title: p.title ?? ad?.title ?? p.name ?? 'Promo',
        merchant: p.merchant ?? p.community?.name ?? ad?.merchant ?? 'Merchant',
        distance: p.distance ?? '0 KM',
        location: p.location ?? p.community?.location ?? 'Location',
        image,
        created_at: p.created_at ?? ad?.created_at,
        updated_at: p.updated_at ?? ad?.updated_at,
        // Tambahkan informasi untuk identifikasi iklan
        type: ad?.type ?? p.type,
        ad_category: ad?.ad_category ?? p.ad_category,
        is_advertising: ad?.is_advertising ?? p.is_advertising,
        advertising: ad?.advertising ?? p.advertising,
      };
    });

    promos.sort((a, b) => {
      const ta = new Date(a.updated_at || a.created_at || 0).getTime() || 0;
      const tb = new Date(b.updated_at || b.created_at || 0).getTime() || 0;
      if (tb !== ta) return tb - ta;
      const ia = Number(a.id),
        ib = Number(b.id);
      if (!Number.isNaN(ia) && !Number.isNaN(ib)) return ib - ia;
      return 0;
    });

    return promos;
  };

  // We intentionally call top-level async helpers when communityId changes.
  // Disable exhaustive-deps here because these helpers are stable in this component.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (communityId) {
      fetchCommunityData();
      fetchPromoData();
      fetchWidgetData(); // widgets "hunting"
    }
  }, [communityId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const fetchCommunityData = async () => {
    try {
      const res = await fetch(`${apiUrl}/communities/${communityId}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const community = json.data || json;
        setCommunityData({
          id: community.id,
          name: community.name || 'Komunitas',
          location: community.location || 'Location',
          bg_color_1: community.bg_color_1 ?? null,
          bg_color_2: community.bg_color_2 ?? null,
        });
      } else {
        // Jangan pakai dummy; biarkan null agar UI menampilkan state kosong
        setCommunityData(null);
      }
    } catch (error) {
      setCommunityData(null);
    }
  };

  const fetchPromoData = async () => {
    setLoading(true);
    try {
      const promoRes = await fetch(
        `${apiUrl}/communities/${communityId}/promos`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (promoRes.ok) {
        const promoJson = await promoRes.json();
        const promoData = Array.isArray(promoJson?.data)
          ? promoJson.data
          : Array.isArray(promoJson)
            ? promoJson
            : [];
        setPromoData(normalizePromos(promoData));
      }
    } catch (error) {
      console.error('Error fetching promo data:', error);
    } finally {
      setLoading(false);
    }
  };

  // fetch widget data (type=hunting, content_type=promo, active)
  const fetchWidgetData = async () => {
    try {
      const headers = getAuthHeaders();
      const urls = [
        `${apiUrl}/admin/dynamic-content?type=information&community_id=${communityId}&paginate=all`,
        `${apiUrl}/admin/dynamic-content?type=hunting&community_id=${communityId}&paginate=all`,
      ];
      const [infoRes, huntingRes] = await Promise.all(urls.map((u) => fetch(u, { headers })));
  
      const toArray = async (res) => {
        if (!res?.ok) return [];
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      };
  
      let infoWidgets = await toArray(infoRes);
      let huntingWidgets = await toArray(huntingRes);
  
      let widgets = [...infoWidgets, ...huntingWidgets]
        .filter((w) => w.is_active)
        .sort((a, b) => (a.level || 0) - (b.level || 0));
  
      const adCategoryWidget = widgets.find((w) => w.source_type === 'ad_category');
      if (adCategoryWidget) {
        try {
          const catRes = await fetch(
            `${apiUrl}/admin/options/ad-category?community_id=${communityId}`,
            { headers }
          );
          const catResult = await catRes.json();
          const cats = catResult?.message === 'success' && Array.isArray(catResult.data)
            ? catResult.data
            : Array.isArray(catResult) ? catResult : [];
          setAdCategories(cats);
          setAdCategoryLevel(adCategoryWidget.level ?? null);
        } catch (e) {
          setAdCategories([]);
          setAdCategoryLevel(null);
        }
        widgets = widgets.filter((w) => w.id !== adCategoryWidget.id);
      } else {
        setAdCategories([]);
        setAdCategoryLevel(null);
      }
  
      setWidgetData(widgets);
    } catch (error) {
      console.error('Error fetching widget data:', error);
      setAdCategories([]);
      setAdCategoryLevel(null);
    }
  };



  // ======== HELPER FUNCTIONS ========
  // Function gradient murni dari warna BE (tanpa dummy mapping kategori)
  const getCommunityGradient = (bgColor1, bgColor2) => {
    if (bgColor1 && bgColor2) {
      return { backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor2})` };
    }
    if (bgColor1) {
      return { backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor1}dd)` };
    }
    return { backgroundImage: 'linear-gradient(135deg, #16a34a, #059669)' };
  };

  const handlePromoClick = (promoId, promo = null) => {
    // Cek apakah ini iklan/advertising berdasarkan data promo
    if (promo && getIsAdvertising(promo)) {
      // Arahkan ke halaman iklan yang mendukung community background
      router.push(`/app/iklan/${promoId}?communityId=${communityId}`);
    } else {
      // Arahkan ke halaman promo
      router.push(
        `/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=${communityId}`
      );
    }
  };

  // ======== UI TOKENS (BIAR KONSISTEN) ========
  // (Removed unused COLORS to satisfy lint)

  // ======== SHUFFLE CUBE WIDGET ========
  // Di dalam function ShuffleCubeWidget
  const ShuffleCubeWidget = ({ widget }) => {
    const { size, name } = widget;
    const [shuffleData, setShuffleData] = useState([]);
    const [shuffleLoading, setShuffleLoading] = useState(true);
  
    useEffect(() => {
      const fetchShuffleData = async () => {
        try {
          setShuffleLoading(true);
          const token = Cookies.get(token_cookie_name);
          const headers = { 'Content-Type': 'application/json' };
          if (token) {
            const decryptedToken = Decrypt(token);
            headers.Authorization = `Bearer ${decryptedToken}`;
          }
  
          // GUNAKAN baseUrl + /api agar konsisten di semua environment
          const response = await fetch(
            `${baseUrl}/api/shuffle-ads?community_id=${communityId}`,
            { headers }
          );
  
          if (response.ok) {
            const data = await response.json();
            setShuffleData(
              Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
            );
          } else {
            console.error('Failed to fetch shuffle ads:', response.status);
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
            <h2 className="text-lg font-bold text-slate-900">{name}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[16px] bg-gray-200 animate-pulse flex-shrink-0"
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
          <h2 className="text-lg font-bold text-slate-900">{name}</h2>
          {widget.description && (
            <p className="text-sm text-slate-600 mt-[1px]">{widget.description}</p>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {shuffleData.map((item, index) => {
            const cube = item?.cube;
            const ad = item;
            if (!cube && !ad) return null;

            const imageUrl = buildImageUrl(
              ad?.image_1 ||
              ad?.image ||
              ad?.picture_source ||
              cube?.image ||
              FALLBACK_IMAGE
            );
            const title = ad?.title || cube?.label || 'Promo';
            const merchant = ad?.merchant || communityData?.name || 'Merchant';
            const category = cube?.category || 'Informasi';

            // Use same styling as regular cube widgets
            if (size === 'XL-Ads') {
              return (
                <div
                  key={ad?.id || cube?.id || index}
                  className="relative rounded-[18px] overflow-hidden border shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 bg-white"
                  style={{
                    minWidth: 320,
                    maxWidth: 360,
                    borderColor: '#d8d8d8',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (ad?.id) {
                      router.push(`/app/iklan/${ad.id}?communityId=${communityId}`);
                    }
                  }}
                >
                  <div className="relative w-full h-[290px] bg-white flex items-center justify-center">
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
                      <span className="bg-white/20 text-white text-[11px] font-semibold px-3 py-[3px] rounded-md border border-white/40 backdrop-blur-sm">
                        {category}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Default size handling
            return (
              <div
                key={ad?.id || cube?.id || index}
                className="rounded-[16px] overflow-hidden border border-[#e6e6e6] bg-white shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
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
                <div className="relative w-full h-[200px] bg-white flex items-center justify-center">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                    {title}
                  </h3>
                  <p className="text-[12px] text-slate-600 mb-2">{merchant}</p>
                  <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-1 rounded">
                    {category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ======== WIDGET RENDERER (S, M, L, XL, XL-Ads) ========
  const WidgetRenderer = ({ widget }) => {
    const { source_type, size, dynamic_content_cubes, name, content_type } = widget;

    // jika widget adalah ad_category kita hide UI di sini (data sudah diambil di parent)
    if (source_type === 'ad_category') return null;

    // Handle shuffle_cube widget
    if (source_type === 'shuffle_cube') {
      return <ShuffleCubeWidget widget={widget} />;
    }

    // 🟢 Kotak Kategori Biasa dari dynamic_content_cubes (versi lama)
    if (content_type === 'category' && dynamic_content_cubes?.length) {
      return (
        <div className="mb-6">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-slate-900">{name}</h2>
            {widget.description && (
              <p className="text-sm text-slate-600 mt-[1px]">{widget.description}</p>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {dynamic_content_cubes.map((catData, index) => {
              const cube = catData?.cube;
              if (!cube) return null;

              return (
                <div
                  key={cube.id || index}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-all"
                  style={{ minWidth: 90 }}
                  onClick={() => {
                    router.push(
                      `/app/komunitas/promo?categoryId=${cube.id}&communityId=${communityId}`
                    );
                  }}
                >
                  <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border border-[#d8d8d8] bg-white shadow-sm mb-2">
                    <Image
                      src={buildImageUrl(cube.image)}
                      alt={cube.category}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-[12px] text-slate-700 font-medium text-center line-clamp-2">
                    {cube.category}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (source_type !== 'cube' || !dynamic_content_cubes?.length) return null;

    return (
      <div className="mb-6">
        {/* Header Widget */}
        <div className="mb-2">
          <h2 className="text-lg font-bold text-slate-900">{name}</h2>
          {widget.description && (
            <p className="text-sm text-slate-600 mt-[1px]">
              {widget.description}
            </p>
          )}
        </div>

        {/* Scrollable horizontal container */}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {dynamic_content_cubes.map((cubeData, index) => {
            const cube = cubeData?.cube;
            if (!cube) return null;

            const ad = cube?.ads?.[0];
            const imageUrl = buildImageUrl(
              ad?.image_1 ||
              ad?.image ||
              ad?.picture_source ||
              cube?.image ||
              FALLBACK_IMAGE
            );
            const title = ad?.title || cube?.label || 'Promo';
            const merchant = ad?.merchant || communityData?.name || 'Merchant';
            const description = ad?.description || '';
            // Gunakan fungsi getCategoryLabel untuk mendapatkan label yang benar
            const categoryLabel = getCategoryLabel(ad, cube);
            const categoryIcon = getCategoryIcon(categoryLabel);

            // ===== XL-ADS
            if (size === 'XL-Ads') {
              return (
                <div
                  key={cube?.id || index}
                  className="relative rounded-[18px] overflow-hidden border shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 bg-white"
                  style={{
                    minWidth: 320,
                    maxWidth: 360,
                    borderColor: '#d8d8d8',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (ad?.id) {
                      // Cek apakah ini iklan/advertising
                      if (getIsAdvertising(ad, cube)) {
                        // Arahkan ke halaman iklan yang mendukung community background
                        router.push(`/app/iklan/${ad.id}?communityId=${communityId}`);
                      } else {
                        // Arahkan ke halaman promo
                        router.push(
                          `/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`
                        );
                      }
                    }
                  }}
                >
                  {/* Gambar */}
                  <div className="relative w-full h-[290px] bg-white flex items-center justify-center">
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

                  {/* Bottom gradient glass overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-black/20 backdrop-blur-sm p-4 border-t border-white/20">
                    <h3 className="text-[15px] font-bold text-white leading-snug mb-2 line-clamp-1">
                      {title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="bg-white/20 text-white text-[11px] font-semibold px-3 py-[3px] rounded-md border border-white/40 backdrop-blur-sm flex items-center gap-1">
                        {categoryIcon}
                        {categoryLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // ===== XL 
            if (size === 'XL') {
              return (
                <div
                  key={cube.id || index}
                  className="rounded-[16px] overflow-hidden border border-[#e6e6e6] bg-white shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                  style={{
                    minWidth: 320,
                    maxWidth: 360,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (ad?.id) {
                      // Cek apakah ini iklan/advertising
                      if (getIsAdvertising(ad, cube)) {
                        // Arahkan ke halaman iklan yang mendukung community background
                        router.push(`/app/iklan/${ad.id}?communityId=${communityId}`);
                      } else {
                        // Arahkan ke halaman promo
                        router.push(
                          `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                        );
                      }
                    }
                  }}
                >
                  {/* Gambar di atas */}
                  <div className="relative w-full h-[180px] bg-white flex items-center justify-center">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-contain p-2"
                    />
                    {/* Merchant Badge */}
                    <div className="absolute top-3 left-3 bg-white/80 text-[#5a6e1d] text-[11px] font-semibold px-3 py-[3px] rounded-full shadow-sm">
                      {merchant}
                    </div>
                  </div>

                  {/* Konten bawah */}
                  <div className="p-4 bg-white border-t border-[#e6e6e6]">
                    <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1 line-clamp-2">
                      {title}
                    </h3>
                    <p className="text-[13px] text-slate-700 line-clamp-2 mb-3">
                      {description || 'Temukan berbagai keseruan menarik di komunitas ini!'}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="bg-transparent border border-[#cdd0b3] text-[#3f4820] text-[11px] font-semibold px-3 py-[3px] rounded-md flex items-center gap-1">
                        {categoryIcon}
                        {categoryLabel}
                      </span>
                      <FontAwesomeIcon
                        icon={faGift}
                        className="text-[#3f4820] text-[14px] opacity-80"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            // ===== L 
            if (size === 'L') {
              return (
                <div
                  key={cube.id || index}
                  className="flex items-center rounded-[14px] overflow-hidden border border-[#e6e6e6] bg-white shadow-md flex-shrink-0 hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
                  style={{
                    minWidth: 280,
                    maxWidth: 320,
                    height: 130,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (ad?.id) {
                      // Cek apakah ini iklan/advertising
                      if (getIsAdvertising(ad, cube)) {
                        // Arahkan ke halaman iklan yang mendukung community background
                        router.push(`/app/iklan/${ad.id}?communityId=${communityId}`);
                      } else {
                        // Arahkan ke halaman promo
                        router.push(
                          `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                        );
                      }
                    }
                  }}
                >
                  {/* Gambar kiri */}
                  <div className="relative w-[40%] h-full bg-white flex items-center justify-center overflow-hidden">
                    <div className="w-[90%] h-[90%] relative">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-contain rounded-[10px]"
                      />
                    </div>
                  </div>

                  {/* Konten kanan */}
                  <div className="flex-1 h-full p-3 flex flex-col justify-between bg-white border-l border-[#e6e6e6]">
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug mb-1">
                        {title}
                      </h3>
                      <p className="text-[13px] text-slate-700 line-clamp-2">
                        {description || 'Welcome to Huehuy!'}
                      </p>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="bg-transparent border border-[#cdd0b3] text-[#3f4820] text-[11px] font-semibold px-3 py-[3px] rounded-md flex items-center gap-1">
                        {categoryIcon}
                        {categoryLabel}
                      </span>
                      <FontAwesomeIcon
                        icon={faGift}
                        className="text-[#3f4820] text-[13px] opacity-80"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            // ===== S / M 
            if (size === 'S' || size === 'M') {
              const isM = size === 'M';
              return (
                <div
                  key={cube.id || index}
                  className="flex flex-col rounded-[12px] overflow-hidden border border-[#e6e6e6] bg-white shadow-sm flex-shrink-0 hover:scale-[1.02] transition-all duration-300"
                  style={{
                    minWidth: isM ? 180 : 140,
                    maxWidth: isM ? 200 : 160,
                    cursor: 'pointer'
                  }}
                  onClick={() =>
                    router.push(
                      `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                    )
                  }
                >
                  {/* Gambar */}
                  <div
                    className="relative w-full bg-white flex items-center justify-center overflow-hidden"
                    style={{ height: isM ? 150 : 120 }}
                  >
                    <div className="w-[90%] h-[90%] relative">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-contain rounded-[8px]"
                      />
                    </div>
                  </div>

                  {/* Konten bawah */}
                  <div className="p-2 bg-white border-t border-[#e6e6e6]">
                    <h3
                      className={`${isM ? 'text-[14px]' : 'text-[13px]'
                        } font-bold text-slate-900 line-clamp-2 mb-0.5`}
                    >
                      {title}
                    </h3>
                    <p
                      className={`${isM ? 'text-[12px]' : 'text-[11px]'
                        } text-slate-700 line-clamp-1`}
                    >
                      {description || 'Welcome to Huehuy!'}
                    </p>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="bg-transparent border border-[#cdd0b3] text-[#3f4820] text-[10px] font-semibold px-2 py-[2px] rounded-md flex items-center gap-1">
                        {categoryIcon}
                        {categoryLabel}
                      </span>
                      <FontAwesomeIcon
                        icon={faGift}
                        className="text-[#3f4820] text-[11px] opacity-80"
                      />
                    </div>
                  </div>
                </div>
              );
            }
            // fallback (shouldn't happen)
            return null;
          })}
        </div>
      </div>
    );
  };

  const PromoCard = ({ promo }) => (
    <div
      className="bg-white rounded-[16px] shadow-sm overflow-hidden mb-4 hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-50"
      onClick={() => handlePromoClick(promo.id, promo)}
      style={{ minWidth: 220 }} // buat card bisa jadi item horizontal
    >
      <div className="flex p-4 items-center">
        <div className="w-28 h-28 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100">
          {/* ukuran diperbesar */}
          <Image
            src={promo.image}
            alt={promo.title}
            width={112}
            height={112}
            className="w-full h-full object-cover"
            placeholder="blur"
            blurDataURL="/default-avatar.png"
          />
        </div>
        <div className="flex-1 ml-4 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 mb-1">
            {promo.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-1">{promo.merchant}</p>
        </div>
      </div>
    </div>
  );

  // Get community background style
  const communityBgStyle = getCommunityGradient(
    communityData?.bg_color_1,
    communityData?.bg_color_2
  );

  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen flex items-center justify-center px-4 py-4">
        <div className="text-center bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data komunitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative lg:mx-auto lg:max-w-md min-h-screen" style={typeof communityBgStyle === 'object' ? communityBgStyle : {}}>
      {/* Dimmer overlay to ensure readability over strong backgrounds */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-0 pointer-events-none" />

      {/* Content */}
      <div className="px-6 pb-24 relative z-10">
        <div className="pt-6" />
        {/* Page title + search (glass) */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white drop-shadow-sm mb-3">Promo Komunitas</h1>
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-lg shadow-sm border border-white/30 flex items-center">
            <FontAwesomeIcon icon={faSearch} className="text-white/80 mr-3" />
            <input
              type="text"
              placeholder="Cari promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-white placeholder-white/70 bg-transparent outline-none"
            />
          </div>
        </div>

        <div className="lg:mx-auto lg:max-w-md">
          {/* Render Widgets dengan level-aware ordering */}
          {(widgetData.length > 0 || adCategories.length > 0) && (
            <>
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
                        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                          {item.data.map((cat) => {
                            const imgSrc = cat.image || buildImageUrl(cat.picture_source) || '/default-avatar.png';
                            const label = cat.label || cat.name || 'Kategori';
                            const id = cat.id || cat.value;

                            return (
                              <div
                                key={id}
                                className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-all"
                                style={{ minWidth: 90 }}
                                onClick={() =>
                                  router.push(`/app/komunitas/promo?categoryId=${id}&communityId=${communityId}`)
                                }
                              >
                                <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border border-[#d8d8d8] bg-white shadow-sm mb-2">
                                  <Image
                                    src={imgSrc}
                                    alt={label}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <p className="text-[12px] text-slate-700 font-medium text-center line-clamp-2">
                                  {label}
                                </p>
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
            </>
          )}

          {/* Render promo list sebagai horizontal scroller */}
          {promoData.length > 0 && (
            <div className="mb-6">
              <div className="mb-2">
                <h2 className="text-lg font-bold text-white">Promo Terbaru</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar">
                {promoData.map((p) => (
                  <div key={p.id} className="flex-shrink-0">
                    <PromoCard promo={p} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CommunityBottomBar active="promo" communityId={communityId} />
    </div>
  );
};

export default CommunityPromoPage;
