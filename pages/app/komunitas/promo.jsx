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
  const [adCategoryWidget, setAdCategoryWidget] = useState(null); // ad_category widget
  const [categoryBoxWidget, setCategoryBoxWidget] = useState(null); // category_box widget
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
    if (/^(ads|promos|uploads|images|files|banners|communities)\//i.test(path)) {
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
        // Field tambahan untuk routing detection seperti di home.jsx
        code: p.code ?? ad?.code,
        is_information: p.is_information ?? ad?.is_information,
        content_type: p.content_type ?? ad?.content_type,
        is_voucher: p.is_voucher ?? ad?.is_voucher,
        rawCube: p, // simpan raw cube untuk akses penuh
        cube: ad?.cube || null,
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

  // Fungsi handle klik promo - PERSIS seperti di home.jsx
  const handlePromoClick = (promo) => {
    const promoId = promo?.id;
    if (!promoId) {
      console.warn('Promo ID tidak tersedia:', promo);
      return;
    }

    // Extract ad and cube data
    const ad = promo?.rawCube?.ads?.[0] || promo;
    const cube = promo?.rawCube || promo?.cube;

    // Cek apakah ini kubus informasi (prioritas tertinggi)
    const isInformationCube = getIsInformation(cube) || getIsInformation(ad);

    if (isInformationCube) {
      // Untuk kubus informasi, prioritaskan code dari cube
      const code = cube?.code || ad?.cube?.code || ad?.code;
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

    // Cek apakah ini iklan/advertising
    if (getIsAdvertising(ad, cube)) {
      const targetUrl = communityId
        ? `/app/iklan/${promoId}?communityId=${communityId}`
        : `/app/iklan/${promoId}`;
      router.push(targetUrl);
      return;
    }

    // Default: promo/voucher
    const targetUrl = communityId
      ? `/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=${communityId}`
      : `/app/promo/detail_promo?promoId=${promoId}`;
    router.push(targetUrl);
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
      const authHeaders = getAuthHeaders();
      const base = apiUrl.replace(/\/api\/?$/, '');

      // helper fetch aman
      const tryJson = async (url, init) => {
        try {
          const r = await fetch(url, init);
          if (!r.ok) return null;
          const j = await r.json();
          return Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []);
        } catch {
          return null;
        }
      };

      // --- Fetch types relevant to promo page: promo + hunting + information (for ad_category widgets)
      const adminPromo = await tryJson(
        `${apiUrl}/admin/dynamic-content?type=promo&community_id=${communityId}&paginate=all`,
        { headers: authHeaders }
      );
      const adminHunting = await tryJson(
        `${apiUrl}/admin/dynamic-content?type=hunting&community_id=${communityId}&paginate=all`,
        { headers: authHeaders }
      );
      // Fetch information type to get ad_category and category_box widgets
      const adminInformation = await tryJson(
        `${apiUrl}/admin/dynamic-content?type=information&community_id=${communityId}&paginate=all`,
        { headers: authHeaders }
      );

      // public fallback (only if adminPromo not provided)
      const publicPromo = adminPromo?.length ? null : await tryJson(
        `${base}/dynamic-content?type=promo&community_id=${communityId}&paginate=all`,
        { headers: { 'Content-Type': 'application/json' }, credentials: 'include', mode: 'cors' }
      );
      const publicHunting = adminPromo?.length ? null : await tryJson(
        `${base}/dynamic-content?type=hunting&community_id=${communityId}&paginate=all`,
        { headers: { 'Content-Type': 'application/json' }, credentials: 'include', mode: 'cors' }
      );
      const publicInformation = adminPromo?.length ? null : await tryJson(
        `${base}/dynamic-content?type=information&community_id=${communityId}&paginate=all`,
        { headers: { 'Content-Type': 'application/json' }, credentials: 'include', mode: 'cors' }
      );

      // alias fallback (if neither admin nor public returned)
      const aliasPromo = (adminPromo?.length || publicPromo?.length) ? null : await tryJson(
        `${apiUrl}/dynamic-content?type=promo&community_id=${communityId}&paginate=all`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const aliasHunting = (adminPromo?.length || publicPromo?.length) ? null : await tryJson(
        `${apiUrl}/dynamic-content?type=hunting&community_id=${communityId}&paginate=all`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const aliasInformation = (adminPromo?.length || publicPromo?.length) ? null : await tryJson(
        `${apiUrl}/dynamic-content?type=information&community_id=${communityId}&paginate=all`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const merged = [
        ...(adminPromo || []),
        ...(adminHunting || []),
        ...(adminInformation || []),
        ...(publicPromo || []),
        ...(publicHunting || []),
        ...(publicInformation || []),
        ...(aliasPromo || []),
        ...(aliasHunting || []),
        ...(aliasInformation || []),
      ].filter(Boolean);

      if (!merged.length) {
        console.warn('Widget kosong: kemungkinan CORS/route tidak tersedia di local.');
        setWidgetData([]); setAdCategories([]); setAdCategoryLevel(null);
        return;
      }

      // dedupe + sort + tarik kategori
      const mapById = new Map();
      merged.forEach(w => { if (w?.id != null) mapById.set(w.id, w); });
      let widgets = [...mapById.values()]
        .filter(w => w?.is_active)
        .sort((a, b) => (a.level || 0) - (b.level || 0));

      // Identify both ad_category and category_box widgets
      const adCategoryWidget = widgets.find(w => 
        w.source_type === 'ad_category' || 
        w.content_type === 'category' ||
        (w.content_type === 'promo' && w.source_type === 'ad_category')
      );
      const categoryBoxWidget = widgets.find(w => 
        w.source_type === 'category_box' || 
        w.content_type === 'category_box' || 
        (w.name && w.name.toLowerCase().includes('kotak kategori'))
      );

      // Handle both ad_category and category_box widgets
      if (adCategoryWidget || categoryBoxWidget) {
        try {
          console.log('Fetching ad categories for widgets:', { adCategoryWidget, categoryBoxWidget });
          const catRes = await fetch(`${apiUrl}/admin/options/ad-category?community_id=${communityId}&full=1`, { headers: getAuthHeaders() });
          const catResult = await catRes.json();
          console.log('Ad category API response:', catResult);
          
          if (catResult?.message === 'success' && Array.isArray(catResult.data)) {
            console.log('Setting ad categories:', catResult.data);
            setAdCategories(catResult.data);
            // Set level based on ad_category widget specifically
            setAdCategoryLevel(adCategoryWidget?.level ?? 0);
          } else if (Array.isArray(catResult)) {
            console.log('Setting ad categories (array format):', catResult);
            setAdCategories(catResult);
            // Set level based on ad_category widget specifically
            setAdCategoryLevel(adCategoryWidget?.level ?? 0);
          } else {
            console.log('No valid ad category data found');
            setAdCategories([]); setAdCategoryLevel(null);
          }
        } catch (error) {
          console.error('Error fetching ad categories:', error);
          setAdCategories([]); setAdCategoryLevel(null);
        }
      } else {
        console.log('No ad category or category box widgets found');
        setAdCategories([]); setAdCategoryLevel(null);
      }

      // Set adCategoryWidget state
      if (adCategoryWidget) {
        setAdCategoryWidget(adCategoryWidget);
      } else {
        setAdCategoryWidget(null);
      }

      // Set categoryBoxWidget state
      if (categoryBoxWidget) {
        setCategoryBoxWidget(categoryBoxWidget);
      } else {
        setCategoryBoxWidget(null);
      }

      // Remove both ad_category and category_box widgets from main widgets array
      // (they will be handled separately in the rendering logic)
      if (adCategoryWidget) {
        widgets = widgets.filter(w => w.id !== adCategoryWidget.id);
      }
      if (categoryBoxWidget) {
        widgets = widgets.filter(w => w.id !== categoryBoxWidget.id);
      }

      setWidgetData(widgets);
    } catch (e) {
      console.error('Error fetching widget data:', e);
      setWidgetData([]); setAdCategories([]); setAdCategoryLevel(null);
      setAdCategoryWidget(null); setCategoryBoxWidget(null);
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

  // ======== UI TOKENS (BIAR KONSISTEN) ========
  // (Removed unused COLORS to satisfy lint)

  // ======== SUB-COMPONENTS FOR WIDGET TYPES (Hooks at top-level) ========
  
  // ======== AD CATEGORY WIDGET COMPONENT ========
  const AdCategoryWidget = ({ widget }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [loadingCategory, setLoadingCategory] = useState(false);

    // Fetch cubes by category
    const fetchCubesByCategory = async (categoryId) => {
      try {
        setLoadingCategory(true);
        const response = await fetch(`${apiUrl}/cubes-by-category?ad_category_id=${categoryId}&community_id=${communityId}`, {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const result = await response.json();
          const data = Array.isArray(result?.data) ? result.data : [];
          setCategoryData(data);
        } else {
          console.error('Failed to fetch category data:', response.status);
          setCategoryData([]);
        }
      } catch (error) {
        console.error('Error fetching category data:', error);
        setCategoryData([]);
      } finally {
        setLoadingCategory(false);
      }
    };

    // Auto-select first category if available
    useEffect(() => {
      if (adCategories.length > 0 && !selectedCategory) {
        const firstCategory = adCategories[0];
        setSelectedCategory(firstCategory);
        fetchCubesByCategory(firstCategory.id);
      }
    }, [adCategories]);

    const handleCategorySelect = (category) => {
      setSelectedCategory(category);
      fetchCubesByCategory(category.id);
    };

    const renderCubeCard = (item, index) => {
      const ad = item?.ad || item;
      const cube = item?.cube || ad?.cube;
      
      if (!ad && !cube) return null;

      const imageUrl = getAdImage(ad) || cube?.picture_source || '/default-avatar.png';
      const title = ad?.title || cube?.label || cube?.name || 'Promo';
      const merchant = cube?.name || ad?.merchant || 'Merchant';
      const description = ad?.description || cube?.description || '';
      const isInformationCube = getIsInformation(cube) || getIsInformation(ad);
      const categoryData = getCategoryWithIcon(ad, cube, communityData);

      const handleClick = () => {
        if (isInformationCube) {
          const code = cube?.code || ad?.cube?.code || ad?.code;
          if (code) {
            const targetUrl = communityId
              ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
              : `/app/kubus-informasi/kubus-infor?code=${code}`;
            router.push(targetUrl);
          }
          return;
        }
        if (ad?.id) {
          if (getIsAdvertising(ad, cube)) {
            const targetUrl = communityId
              ? `/app/iklan/${ad.id}?communityId=${communityId}`
              : `/app/iklan/${ad.id}`;
            router.push(targetUrl);
          } else {
            const targetUrl = communityId
              ? `/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`
              : `/app/promo/detail_promo?promoId=${ad.id}`;
            router.push(targetUrl);
          }
        }
      };

      const size = widget.size || 'M';

      // Size S - Compact card
      if (size === 'S') {
        return (
          <div
            key={ad?.id || cube?.id || index}
            className="flex rounded-[12px] overflow-hidden border border-white/20 shadow-lg flex-shrink-0 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 bg-white/10 backdrop-blur-md cursor-pointer"
            style={{ minWidth: 240, maxWidth: 280 }}
            onClick={handleClick}
          >
            <div className="relative w-16 h-16 bg-white/20 backdrop-blur-sm overflow-hidden">
              <Image src={buildImageUrl(imageUrl)} alt={title} fill className="object-cover" />
            </div>
            <div className="flex-1 p-2 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white text-xs line-clamp-1 mb-1">{title}</h3>
                <p className="text-xs text-white/70 line-clamp-1">{merchant}</p>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {categoryData?.icon}
                <span className="text-xs text-white/80">{categoryData?.label}</span>
              </div>
            </div>
          </div>
        );
      }

      // Size M - Medium card
      if (size === 'M') {
        return (
          <div
            key={ad?.id || cube?.id || index}
            className="flex rounded-[14px] overflow-hidden border border-white/20 shadow-lg flex-shrink-0 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 bg-white/10 backdrop-blur-md cursor-pointer"
            style={{ minWidth: 280, maxWidth: 320 }}
            onClick={handleClick}
          >
            <div className="relative w-20 h-20 bg-white/20 backdrop-blur-sm overflow-hidden">
              <Image src={buildImageUrl(imageUrl)} alt={title} fill className="object-cover" />
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">{title}</h3>
                <p className="text-xs text-white/70 line-clamp-1">{merchant}</p>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {categoryData?.icon}
                <span className="text-xs text-white/80">{categoryData?.label}</span>
              </div>
            </div>
          </div>
        );
      }

      // Size L - Large card
      if (size === 'L') {
        return (
          <div
            key={ad?.id || cube?.id || index}
            className="flex rounded-[16px] overflow-hidden border border-white/20 shadow-xl flex-shrink-0 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md cursor-pointer"
            style={{ minWidth: 320, maxWidth: 350 }}
            onClick={handleClick}
          >
            <div className="relative w-24 h-full bg-white/20 backdrop-blur-sm overflow-hidden">
              <Image src={buildImageUrl(imageUrl)} alt={title} fill className="object-cover" />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white text-base line-clamp-2 mb-2">{title}</h3>
                <p className="text-sm text-white/70 line-clamp-1 mb-1">{merchant}</p>
                <p className="text-xs text-white/60 line-clamp-2">{description}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {categoryData?.icon}
                <span className="text-sm text-white/80">{categoryData?.label}</span>
              </div>
            </div>
          </div>
        );
      }

      // Size XL - Extra large card
      if (size === 'XL') {
        return (
          <div
            key={ad?.id || cube?.id || index}
            className="rounded-[18px] overflow-hidden border border-white/20 shadow-xl flex-shrink-0 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md cursor-pointer"
            style={{ minWidth: 280, maxWidth: 320 }}
            onClick={handleClick}
          >
            <div className="relative w-full h-40 bg-white/20 backdrop-blur-sm overflow-hidden">
              <Image src={buildImageUrl(imageUrl)} alt={title} fill className="object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white text-base line-clamp-2 mb-2">{title}</h3>
              <p className="text-sm text-white/70 line-clamp-1 mb-2">{merchant}</p>
              <p className="text-xs text-white/60 line-clamp-3 mb-3">{description}</p>
              <div className="flex items-center gap-2">
                {categoryData?.icon}
                <span className="text-sm text-white/80">{categoryData?.label}</span>
              </div>
            </div>
          </div>
        );
      }

      // Size XL-Ads - Extra large ads format
      if (size === 'XL-Ads') {
        return (
          <div
            key={ad?.id || cube?.id || index}
            className="relative rounded-[18px] overflow-hidden border shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
            style={{ minWidth: 320, maxWidth: 360, borderColor: '#d8d8d8' }}
            onClick={handleClick}
          >
            <div className="relative w-full h-[290px] bg-white flex items-center justify-center">
              <Image
                src={buildImageUrl(imageUrl)}
                alt={title}
                fill
                className="object-contain p-2"
              />
            </div>
            <div className="p-4 bg-white">
              <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm line-clamp-1 mb-2">{merchant}</p>
              <p className="text-gray-500 text-xs line-clamp-3 mb-3">{description}</p>
              <div className="flex items-center gap-2">
                <div className="text-gray-600">{categoryData?.icon}</div>
                <span className="text-sm text-gray-600">{categoryData?.label}</span>
              </div>
            </div>
          </div>
        );
      }

      // Default fallback to M size
      return renderCubeCard({ ...item, size: 'M' }, index);
    };

    return (
      <div className="mb-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">{widget.name || 'Kategori Iklan'}</h2>
          {widget.description && (
            <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
          )}
        </div>

        {/* Category Selector */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {adCategories.map((category) => {
              const isSelected = selectedCategory?.id === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isSelected
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {category.label || category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loadingCategory ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[280px] h-[120px] bg-white/10 rounded-[16px] animate-pulse" />
            ))}
          </div>
        ) : categoryData.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categoryData.map((item, index) => renderCubeCard(item, index))}
          </div>
        ) : selectedCategory ? (
          <div className="text-center py-8 text-white/60">
            Tidak ada kubus untuk kategori &quot;{selectedCategory.label || selectedCategory.name}&quot;
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            Pilih kategori untuk melihat kubus
          </div>
        )}
      </div>
    );
  };

  const NearbyWidget = ({ widget, communityId, buildImageUrl, getIsInformation, getIsAdvertising }) => {
    const [items, setItems] = useState([]);
    const [loadingNearby, setLoadingNearby] = useState(true);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const base = apiUrl.replace(/\/api\/?$/, '');
          let lat = null, lng = null;
          if (navigator?.geolocation) {
            await new Promise(r => navigator.geolocation.getCurrentPosition(
              p => { lat = p.coords.latitude; lng = p.coords.longitude; r(); },
              () => r(),
              { enableHighAccuracy: true, timeout: 5000 }
            ));
          }
          if (lat == null || lng == null) { setItems([]); return; }
          const r = await fetch(`${base}/api/ads/promo-nearest/${lat}/${lng}`);
          const j = await r.json();
          const list = Array.isArray(j?.data) ? j.data : [];
          const normalized = list.map(row => {
            const ad = row?.ad || row?.ads?.[0] || row;
            const cube = row?.cube || ad?.cube || {};
            return { cube: { ...cube, ads: ad ? [ad] : [] }, ad };
          })
            // hanya tampilkan yang diklasifikasikan sebagai 'promo'
            .filter(item => getNormalizedType(item.ad, item.cube) === 'promo');
          if (mounted) setItems(normalized);
        } finally { if (mounted) setLoadingNearby(false); }
      })();
      return () => { mounted = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loadingNearby) return <div className="text-white/80 text-sm mb-4">Memuat {widget.name || 'terdekat'}…</div>;
    if (!items.length) return null;

    return (
      <div className="mb-6">
        {widget.name && <h2 className="text-lg font-bold text-white mb-2">{widget.name}</h2>}
        <div className="flex flex-col gap-3">
          {items.map((row, i) => {
            const cube = row?.cube; const ad = cube?.ads?.[0];
            const img = buildImageUrl(ad?.image_1 || ad?.image || ad?.picture_source || cube?.image);
            const title = ad?.title || cube?.label || 'Promo';
            const address = ad?.cube?.address || cube?.address || '';
            const isInfo = getIsInformation(cube) || getIsInformation(ad);

            const handleClick = () => {
              if (isInfo) {
                const code = cube?.code || ad?.cube?.code || ad?.code;
                if (code) router.push(`/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(code)}${communityId ? `&communityId=${communityId}` : ''}`);
              } else if (ad?.id) {
                const targetUrl = getIsAdvertising(ad, cube)
                  ? `/app/iklan/${ad.id}${communityId ? `?communityId=${communityId}` : ''}`
                  : `/app/komunitas/promo/detail_promo?promoId=${ad.id}${communityId ? `&communityId=${communityId}` : ''}`;
                router.push(targetUrl);
              }
            };

            return (
              <div
                key={i}
                className="grid grid-cols-4 gap-3 p-3 rounded-[15px] bg-white/40 backdrop-blur-sm border border-white/30 cursor-pointer hover:bg-white/50 transition-all"
                onClick={handleClick}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-300 relative">
                  <Image src={img} alt={title} fill className="object-cover" />
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-white drop-shadow-sm">{title}</p>
                  {!!address && <p className="text-white/90 text-xs my-1 drop-shadow-sm">{address}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ======== CATEGORY BOX WIDGET COMPONENT ========
  const CategoryBoxWidget = ({ widget }) => {
    return (
      <div className="mb-6">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">{widget.name || 'Kotak Kategori'}</h2>
          {widget.description && (
            <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
          )}
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {adCategories.map((category) => {
            const imgSrc = category.image || buildImageUrl(category.picture_source) || '/default-avatar.png';
            const label = category.label || category.name || 'Kategori';
            const id = category.id || category.value;

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
                    src={imgSrc}
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
  };

  const RecommendationWidget = ({ widget, communityId, buildImageUrl, getIsInformation, getIsAdvertising }) => {
    const [items, setItems] = useState([]);
    const [loadingRec, setLoadingRec] = useState(true);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const base = apiUrl.replace(/\/api\/?$/, '');
          const r = await fetch(`${base}/api/ads/promo-recommendation`);
          const j = await r.json();
          const list = Array.isArray(j?.data) ? j.data : [];
          const normalized = list.map(row => {
            const ad = row?.ad || row?.ads?.[0] || row;
            const cube = row?.cube || ad?.cube || {};
            return { cube: { ...cube, ads: ad ? [ad] : [] } };
          });
          if (mounted) setItems(normalized);
        } finally { if (mounted) setLoadingRec(false); }
      })();
      return () => { mounted = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loadingRec) return <div className="text-white/80 text-sm mb-4">Memuat {widget.name || 'rekomendasi'}…</div>;
    if (!items.length) return null;

    return (
      <div className="mb-6">
        {widget.name && <h2 className="text-lg font-bold text-white mb-2">{widget.name}</h2>}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {items.map((row, i) => {
            const cube = row?.cube; const ad = cube?.ads?.[0];
            const img = buildImageUrl(ad?.image_1 || ad?.image || ad?.picture_source || cube?.image);
            const title = ad?.title || cube?.label || 'Promo';
            const description = ad?.description || cube?.description || '';
            const address = ad?.cube?.address || cube?.address || '';
            const isInfo = getIsInformation(cube) || getIsInformation(ad);

            const handleClick = () => {
              if (isInfo) {
                const code = cube?.code || ad?.cube?.code || ad?.code;
                if (code) router.push(`/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(code)}${communityId ? `&communityId=${communityId}` : ''}`);
              } else if (ad?.id) {
                const targetUrl = getIsAdvertising(ad, cube)
                  ? `/app/iklan/${ad.id}${communityId ? `?communityId=${communityId}` : ''}`
                  : `/app/komunitas/promo/detail_promo?promoId=${ad.id}${communityId ? `&communityId=${communityId}` : ''}`;
                router.push(targetUrl);
              }
            };

            return (
              <div
                key={i}
                className="flex flex-col rounded-[12px] overflow-hidden border border-white/20 shadow-lg flex-shrink-0 bg-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all"
                style={{ minWidth: 200, maxWidth: 220, height: 280 }}
                onClick={handleClick}
              >
                <div className="relative w-full overflow-hidden">
                  <div className="w-full aspect-square relative">
                    <Image src={img} alt={title} fill className="object-cover" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-8" />
                </div>

                <div className="flex-1 p-3 bg-white/20 backdrop-blur-md border-t border-white/20">
                  <h3 className="text-[14px] font-bold text-white line-clamp-2 leading-tight mb-1 drop-shadow-sm">{title}</h3>
                  {description && <p className="text-[11px] text-white/90 leading-relaxed line-clamp-2 mb-2 drop-shadow-sm">{description}</p>}
                  {address && <p className="text-[10px] text-white/80 line-clamp-1 drop-shadow-sm">{address}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ======== SHUFFLE CUBE WIDGET (Promo Acak) ========
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
            const rawData = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            
            // Filter out voucher cubes from shuffle ads
            const filteredData = rawData.filter(item => {
              const ad = item;
              const cube = item?.cube;
              
              // Check if this is a voucher cube/ad
              const isVoucher = 
                // Check ad type
                String(ad?.type || '').toLowerCase() === 'voucher' ||
                // Check cube content_type
                String(cube?.content_type || '').toLowerCase() === 'voucher' ||
                // Check voucher flags
                normalizeBoolLike(ad?.is_voucher) ||
                normalizeBoolLike(ad?.voucher) ||
                // Check normalized type helper
                getNormalizedType(ad, cube) === 'voucher';
              
              // Return true to keep (exclude vouchers)
              return !isVoucher;
            });
            
            setShuffleData(filteredData);
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
            <h2 className="text-lg font-bold text-white">{name}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
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

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
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
            const categoryData = getCategoryWithIcon(ad, cube, communityData);
            const category = categoryData?.label || getCategoryLabel(ad, cube) || 'Promo';

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

    // Handle ad_category widget
    if (source_type === 'ad_category') {
      return <AdCategoryWidget widget={widget} />;
    }

    // Handle category_box widget
    if (source_type === 'category_box' || content_type === 'category_box') {
      return <CategoryBoxWidget widget={widget} />;
    }

    // Handle shuffle_cube widget
    if (source_type === 'shuffle_cube') {
      return <ShuffleCubeWidget widget={widget} />;
    }

    // 🟢 Kotak Kategori Biasa dari dynamic_content_cubes (versi lama)
    if (content_type === 'category' && dynamic_content_cubes?.length) {
      return (
        <div className="mb-6">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white">{name}</h2>
            {widget.description && (
              <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dynamic_content_cubes.map((catData, index) => {
              const cube = catData?.cube;
              if (!cube) return null;

              return (
                <div
                  key={cube.id || index}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-all duration-300"
                  style={{ minWidth: 90 }}
                  onClick={() => {
                    router.push(
                      `/app/komunitas/promo?categoryId=${cube.id}&communityId=${communityId}`
                    );
                  }}
                >
                  <div className="relative w-[90px] aspect-square rounded-[12px] overflow-hidden border border-white/30 bg-white/20 backdrop-blur-md shadow-lg">
                    <Image
                      src={buildImageUrl(cube.image)}
                      alt={cube.category}
                      fill
                      className="object-cover brightness-90"
                    />
                    <div className="absolute bottom-0 left-0 w-full text-center bg-white/40 backdrop-blur-md py-1.5 px-1">
                      <p className="text-[11px] text-slate-900 font-medium line-clamp-1">{cube.category}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Handle nearby widget type
    if (widget.content_type === 'nearby') {
      return (
        <NearbyWidget
          widget={widget}
          communityId={communityId}
          buildImageUrl={buildImageUrl}
          getIsInformation={getIsInformation}
          getIsAdvertising={getIsAdvertising}
        />
      );
    }



    // Handle recommendation widget type
    if (widget.content_type === 'recommendation') {
      return (
        <RecommendationWidget
          widget={widget}
          communityId={communityId}
          buildImageUrl={buildImageUrl}
          getIsInformation={getIsInformation}
          getIsAdvertising={getIsAdvertising}
        />
      );
    }

    if (source_type !== 'cube' || !dynamic_content_cubes?.length) return null;

    return (
      <div className="mb-6">
        {/* Header Widget */}
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">{name}</h2>
          {widget.description && (
            <p className="text-sm text-white/80 mt-[1px]">
              {widget.description}
            </p>
          )}
        </div>

        {/* Scrollable horizontal container */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
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
              imageUrl = cube.picture_source || cube.image || (ad ? (ad.image_1 || ad.image_2 || ad.image_3 || ad.picture_source) : '/default-avatar.png');
              title = cube.label || cube.name || ad?.title || 'Informasi';
              merchant = cube.merchant || communityData?.name || ad?.merchant || 'Informasi';
              address = cube.address || ad?.cube?.address || '';
              categoryData = getCategoryWithIcon(ad, cube, communityData);
              description = cube.description || ad?.description || '';
            } else {
              // Untuk promo/iklan, prioritaskan data dari ad
              imageUrl = ad ? (ad.image_1 || ad.image_2 || ad.image_3 || ad.picture_source) : (cube.image || '/default-avatar.png');
              title = ad?.title || cube.label || 'Promo';
              merchant = ad?.merchant || communityData?.name || 'Merchant';
              address = ad?.cube?.address || cube.address || '';
              categoryData = getCategoryWithIcon(ad, cube, communityData);
              description = ad?.description || cube.description || '';
            }

            // ===== XL-ADS
            if (size === 'XL-Ads') {
              return (
                <div
                  key={cube?.id || index}
                  className="rounded-[16px] overflow-hidden border border-white/20 shadow-xl flex-shrink-0 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md"
                  style={{ minWidth: 320, maxWidth: 350, cursor: 'pointer' }}
                  onClick={() => {
                    if (isInformationCube) {
                      const code = cube.code || ad?.cube?.code || ad?.code;
                      if (code) {
                        const targetUrl = communityId
                          ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
                          : `/app/kubus-informasi/kubus-infor?code=${code}`;
                        router.push(targetUrl);
                      }
                      return;
                    }
                    if (ad?.id) {
                      if (getIsAdvertising(ad, cube)) {
                        const targetUrl = communityId
                          ? `/app/iklan/${ad.id}?communityId=${communityId}`
                          : `/app/iklan/${ad.id}`;
                        router.push(targetUrl);
                      } else {
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
                      <Image src={buildImageUrl(imageUrl)} alt={title} fill className="object-cover" />
                    </div>
                    <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] font-semibold px-2 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-1">
                      <span>{categoryData.icon}</span>
                      <span>{categoryData.label}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3 bg-white/20 backdrop-blur-md border-t border-white/20">
                    <h3 className="text-base font-bold text-white line-clamp-2 mb-1 leading-tight drop-shadow-sm">{title}</h3>
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

            // ===== XL 
            if (size === 'XL') {
              return (
                <div
                  key={cube.id || index}
                  className="rounded-[16px] overflow-hidden border border-white/20 shadow-xl flex-shrink-0 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md"
                  style={{ minWidth: 320, maxWidth: 350, cursor: 'pointer' }}
                  onClick={() => {
                    if (isInformationCube) {
                      const code = cube.code || ad?.cube?.code || ad?.code;
                      if (code) {
                        const targetUrl = communityId
                          ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
                          : `/app/kubus-informasi/kubus-infor?code=${code}`;
                        router.push(targetUrl);
                      }
                      return;
                    }
                    if (ad?.id) {
                      if (getIsAdvertising(ad, cube)) {
                        const targetUrl = communityId
                          ? `/app/iklan/${ad.id}?communityId=${communityId}`
                          : `/app/iklan/${ad.id}`;
                        router.push(targetUrl);
                      } else {
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
                      <Image src={buildImageUrl(imageUrl)} alt={title} fill className="object-cover" />
                    </div>
                    <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] font-semibold px-2 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-1">
                      <span>{categoryData.icon}</span>
                      <span>{categoryData.label}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3 bg-white/20 backdrop-blur-md border-t border-white/20">
                    <h3 className="text-base font-bold text-white line-clamp-2 mb-1 leading-tight drop-shadow-sm">{title}</h3>
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

            // ===== L 
            if (size === 'L') {
              return (
                <div
                  key={cube.id || index}
                  className="flex rounded-[16px] overflow-hidden border border-white/20 shadow-xl flex-shrink-0 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-md"
                  style={{ minWidth: 320, maxWidth: 350, cursor: 'pointer' }}
                  onClick={() => {
                    if (isInformationCube) {
                      const code = cube.code || ad?.cube?.code || ad?.code;
                      if (code) {
                        const targetUrl = communityId
                          ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
                          : `/app/kubus-informasi/kubus-infor?code=${code}`;
                        router.push(targetUrl);
                      }
                      return;
                    }
                    if (ad?.id) {
                      if (getIsAdvertising(ad, cube)) {
                        const targetUrl = communityId
                          ? `/app/iklan/${ad.id}?communityId=${communityId}`
                          : `/app/iklan/${ad.id}`;
                        router.push(targetUrl);
                      } else {
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
                    <Image src={buildImageUrl(imageUrl)} alt={title} fill className="object-cover" />
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

            // ===== S / M 
            if (size === 'S' || size === 'M') {
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
                      const code = cube.code || ad?.cube?.code || ad?.code;
                      if (code) {
                        const targetUrl = communityId
                          ? `/app/kubus-informasi/kubus-infor?code=${code}&communityId=${communityId}`
                          : `/app/kubus-informasi/kubus-infor?code=${code}`;
                        router.push(targetUrl);
                      }
                      return;
                    }
                    if (ad?.id) {
                      if (getIsAdvertising(ad, cube)) {
                        const targetUrl = communityId
                          ? `/app/iklan/${ad.id}?communityId=${communityId}`
                          : `/app/iklan/${ad.id}`;
                        router.push(targetUrl);
                      } else {
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
                        src={buildImageUrl(imageUrl)}
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
            }
            // fallback (shouldn't happen)
            return null;
          })}
        </div>
      </div >
    );
  };

  const PromoCard = ({ promo }) => (
    <div
      className="bg-white/20 backdrop-blur-md rounded-[16px] shadow-lg overflow-hidden mb-4 hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/30"
      onClick={() => handlePromoClick(promo)}
      style={{ minWidth: 220 }} // buat card bisa jadi item horizontal
    >
      <div className="flex p-4 items-center">
        <div className="w-28 h-28 rounded-[12px] overflow-hidden flex-shrink-0 bg-white/10">
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
          <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 mb-1 drop-shadow-sm">
            {promo.title}
          </h3>
          <p className="text-sm text-white/90 line-clamp-1 drop-shadow-sm">{promo.merchant}</p>
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
          {(widgetData.length > 0 || adCategoryWidget || categoryBoxWidget) && (
            <>
              {(() => {
                // Create combined items with widgets and specific category widgets at correct level
                const items = [];

                // Add all widgets
                widgetData.forEach(widget => {
                  items.push({
                    type: 'widget',
                    level: widget.level || 0,
                    data: widget
                  });
                });

                // Add CategoryBoxWidget if available
                if (categoryBoxWidget && adCategories.length > 0) {
                  items.push({
                    type: 'category_box_widget',
                    level: categoryBoxWidget.level || 0,
                    data: categoryBoxWidget
                  });
                }

                // Add AdCategoryWidget if available (can coexist with CategoryBoxWidget)
                if (adCategoryWidget && adCategories.length > 0) {
                  items.push({
                    type: 'ad_category_widget',
                    level: adCategoryWidget.level || 0,
                    data: adCategoryWidget
                  });
                }

                // Sort by level
                items.sort((a, b) => a.level - b.level);

                // Render items
                return items.map((item) => {
                  if (item.type === 'widget') {
                    return <WidgetRenderer key={item.data.id} widget={item.data} />;
                  } else if (item.type === 'category_box_widget') {
                    return <CategoryBoxWidget key="category_box_widget" widget={item.data} />;
                  } else if (item.type === 'ad_category_widget') {
                    return <AdCategoryWidget key="ad_category_widget" widget={item.data} />;
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
              <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
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
