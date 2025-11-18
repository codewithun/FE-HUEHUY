/* eslint-disable no-console */
import { faSearch, faLocationDot, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../helpers';
import { distanceConvert } from '../../../helpers/distanceConvert.helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';
import CommunityBottomBar from './dashboard/CommunityBottomBar';
import KomunitasCard from '../../../components/construct.components/card/Komunitas.card';
import PromoCardIcons from '../../../components/base.components/card-icons/PromoCardIcons';

const CommunityPromoPage = () => {
  const router = useRouter();
  const { communityId } = router.query;
  const [communityData, setCommunityData] = useState(null);
  const [promoData, setPromoData] = useState([]);
  const [widgetData, setWidgetData] = useState([]); // widgets "hunting"
  const [adCategories, setAdCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authHeaders, setAuthHeaders] = useState({});

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
      return fullUrl;
    }

    // For other paths, ensure leading slash
    return path.startsWith('/') ? path : `/${path}`;
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

  // Build consistent link to appropriate detail page (sama seperti di home.jsx)
  const buildPromoLink = (ad, cube = null, communityId = null) => {
    const id = ad?.id || ad?.ad_id;
    const normBool = (v) => {
      if (v === true || v === 1) return true;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (['1', 'true', 'y', 'yes', 'ya', 'iya', 'on'].includes(s)) return true;
        if (['0', 'false', 'n', 'no', 'off', ''].includes(s)) return false;
      }
      return !!v;
    };

    const actualCube = cube || ad?.cube;
    const contentType = String(actualCube?.content_type || ad?.content_type || '').toLowerCase();
    const typeStr = String(ad?.type || actualCube?.type || '').toLowerCase();
    const isInformation =
      normBool(actualCube?.is_information) ||
      normBool(ad?.is_information) ||
      contentType === 'information' ||
      contentType === 'kubus-informasi' ||
      typeStr === 'information' ||
      typeStr === 'informasi';

    // Arahkan khusus ke Kubus Informasi bila bertipe informasi
    if (isInformation) {
      const code = actualCube?.code || ad?.code;
      const params = new URLSearchParams();
      if (code) params.append('code', code);
      if (communityId) params.append('communityId', communityId);
      return code ? `/app/kubus-informasi/kubus-infor?${params.toString()}` : '#';
    }

    // Arahkan ke iklan jika advertising
    if (id) {
      const cat = String(ad?.ad_category?.name || '').toLowerCase();
      if (
        typeStr === 'iklan' ||
        cat === 'advertising' ||
        ad?.is_advertising === true ||
        ad?.advertising === true
      ) {
        return `/app/iklan/${id}${communityId ? `?communityId=${communityId}` : ''}`;
      }
      // Default: promo
      return `/app/komunitas/promo/${id}${communityId ? `?communityId=${communityId}` : ''}`;
    }

    // Fallback: bila tidak ada id tapi ada code kubus, pakai Kubus Informasi
    const cubeCode = actualCube?.code;
    if (cubeCode) {
      const params = new URLSearchParams();
      params.append('code', cubeCode);
      if (communityId) params.append('communityId', communityId);
      return `/app/kubus-informasi/kubus-infor?${params.toString()}`;
    }
    return '#';
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

      // --- Fetch promo data with fallback pattern like home.jsx
      const adminPromo = await tryJson(
        `${apiUrl}/communities/${communityId}/promos`,
        { headers: authHeaders }
      );

      // public fallback (only if adminPromo not provided)
      const publicPromo = adminPromo?.length ? null : await tryJson(
        `${base}/communities/${communityId}/promos`,
        { headers: { 'Content-Type': 'application/json' }, credentials: 'include', mode: 'cors' }
      );

      // alias fallback (if neither admin nor public returned)
      const aliasPromo = (adminPromo?.length || publicPromo?.length) ? null : await tryJson(
        `${apiUrl}/communities/${communityId}/promos`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const mergedPromo = [
        ...(adminPromo || []),
        ...(publicPromo || []),
        ...(aliasPromo || []),
      ].filter(Boolean);

      if (!mergedPromo.length) {
        console.warn('Promo data kosong: kemungkinan CORS/route tidak tersedia di local.');
        setPromoData([]);
        return;
      }

      // dedupe by id
      const mapById = new Map();
      mergedPromo.forEach(p => { if (p?.id != null) mapById.set(p.id, p); });
      const dedupedPromo = [...mapById.values()].sort((a, b) => {
        const ta = new Date(a.updated_at || a.created_at || 0).getTime() || 0;
        const tb = new Date(b.updated_at || b.created_at || 0).getTime() || 0;
        if (tb !== ta) return tb - ta;
        const ia = Number(a.id), ib = Number(b.id);
        if (!Number.isNaN(ia) && !Number.isNaN(ib)) return ib - ia;
        return 0;
      });

      setPromoData(normalizePromos(dedupedPromo));
    } catch (error) {
      console.error('Error fetching promo data:', error);
      setPromoData([]);
    }
  };

  // fetch widget data - SAMA PERSIS SEPERTI HOME.JSX
  const fetchWidgetData = async () => {
    try {
      const authHeaders = getAuthHeaders();
      const apiBase = apiUrl.replace(/\/api\/?$/, '');

      // Store headers for use in AdCategoryWidget
      setAuthHeaders(authHeaders);

      const res = await fetch(`${apiBase}/api/admin/dynamic-content?type=hunting&community_id=${communityId}`, {
        headers: authHeaders
      });

      if (!res.ok) {
        console.warn('Failed to fetch dynamic content');
        setWidgetData([]);
        setAdCategories([]);
        return;
      }

      const json = await res.json();
      let allWidgets = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);

      console.log('🔥 ALL Fetched widgets:', allWidgets.length);
      console.log('🔥 ALL Widget types:', allWidgets.map(w => ({ id: w.id, name: w.name, type: w.type, source_type: w.source_type })));

      // ✅ Filter di frontend: hanya ambil type promo/hunting/iklan/advertising
      let widgets = allWidgets.filter(w => {
        const type = String(w.type || '').toLowerCase();
        return (
          type === 'promo' ||
          type === 'hunting' ||
          type === 'iklan' ||
          type === 'advertising'
        );
      });

      console.log('🔥 Filtered widgets for promo page:', widgets.length);
      console.log('🔥 Filtered widget data:', JSON.stringify(widgets, null, 2));

      // Filter only active widgets and sort by level
      widgets = widgets
        .filter(w => w?.is_active)
        .sort((a, b) => (a.level || 0) - (b.level || 0));

      // Identify category_box and ad_category widgets
      const categoryBoxWidgets = widgets.filter(w =>
        w.source_type === 'category_box' ||
        w.content_type === 'category_box' ||
        w.source_type === 'ad_category' ||
        w.content_type === 'ad_category' ||
        w.content_type === 'category'
      );

      if (categoryBoxWidgets.length > 0) {
        // Fetch ad categories for category box / ad_category widgets
        const adCatRes = await fetch(`${apiBase}/api/admin/options/ad-category?community_id=${communityId}&full=1`, {
          headers: authHeaders,
        });
        if (adCatRes.ok) {
          const adCatJson = await adCatRes.json();
          const adCats = Array.isArray(adCatJson?.data) ? adCatJson.data : Array.isArray(adCatJson) ? adCatJson : [];
          setAdCategories(adCats);
        }
      }

      setWidgetData(widgets);
    } catch (e) {
      console.error('Error fetching widget data:', e);
      setWidgetData([]);
      setAdCategories([]);
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

  const NearbyWidget = ({ widget, communityId, getIsInformation, getIsAdvertising }) => {
    const [items, setItems] = useState([]);
    const [loadingNearby, setLoadingNearby] = useState(true);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const base = baseUrl;
          const headers = { 'Content-Type': 'application/json' };

          let lat = null, lng = null;
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            await new Promise((resolve) => navigator.geolocation.getCurrentPosition(
              (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
              () => resolve(),
              { enableHighAccuracy: true, timeout: 5000 }
            ));
          }
          if (lat == null || lng == null) { setItems([]); setLoadingNearby(false); return; }

          const res = await fetch(`${base}/api/ads/promo-nearest/${lat}/${lng}`, { headers });
          const json = await res.json();
          if (!mounted) return;

          const list = Array.isArray(json?.data) ? json.data : [];
          // Filter hanya yang bertipe 'promo' saja (tidak tampilkan iklan, voucher, informasi)
          const normalized = list
            .map((row) => {
              const ad = row?.ad || row?.ads?.[0] || row;
              const cube = row?.cube || ad?.cube || row?.ad?.cube || {};
              return { ad, cube };
            })
            .filter(({ ad, cube }) => {
              // Gunakan getNormalizedType untuk cek tipe
              const type = getNormalizedType(ad, cube);
              return type === 'promo'; // Hanya tampilkan yang bertipe 'promo'
            });

          setItems(normalized);
        } finally { if (mounted) setLoadingNearby(false); }
      })();
      return () => { mounted = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loadingNearby) return <div className="text-white/80 text-sm mb-4">Memuat {widget.name || 'terdekat'}…</div>;
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
          {items.map((itemData, key) => {
            const ad = itemData?.ad;
            const cube = itemData?.cube;

            if (!ad && !cube) return null;

            const imageUrl = ad?.image_1 || ad?.image_2 || ad?.image_3 || ad?.picture_source || cube?.image || cube?.picture_source || '/default-avatar.png';
            const title = ad?.title || cube?.label || cube?.name || 'Promo';
            const address = ad?.cube?.address || cube?.address || '';
            const distanceRaw = ad?.distance ?? cube?.distance ?? null;
            const worldName = ad?.cube?.world?.name || cube?.world?.name || 'General';

            const handleClick = () => {
              const isInfo = getIsInformation(cube) || getIsInformation(ad);
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
              <Link href="#" key={key} onClick={(e) => { e.preventDefault(); handleClick(); }}>
                <div className="grid grid-cols-4 gap-3 p-3 rounded-[15px] bg-white/40 backdrop-blur-sm border border-white/30 hover:scale-[1.01] transition-transform">
                  <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-300">
                    <Image src={buildImageUrl(imageUrl)} alt={title} width={700} height={700} className="w-full h-full object-cover" />
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
  };

  // ======== CATEGORY BOX WIDGET COMPONENT (Kotak Kategori) ========
  const CategoryBoxWidget = ({ widget }) => {
    // Early return jika tidak ada kategori
    if (!adCategories || adCategories.length === 0) {
      return null;
    }

    return (
      <div className="mb-6">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">{widget.name || 'Kotak Kategori'}</h2>
          {widget.description && (
            <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {adCategories.map((category) => {
            // Sama seperti di home.jsx - gunakan prioritas field yang sama
            const imgSrc = category.image || category.picture_source || '/default-avatar.png';
            const label = category.label || category.name || 'Kategori';
            const id = category.id || category.value;

            return (
              <div
                key={id}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-all duration-300"
                style={{ minWidth: 90 }}
                onClick={() =>
                  router.push(`/app/komunitas/page-category?categoryId=${id}&communityId=${communityId}`)
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
  };

  // ======== AD CATEGORY WIDGET (Promo/Iklan dengan Selector Kategori) ========
  const AdCategoryWidget = ({ widget, communityId }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchByCategory = async () => {
        if (!widget?.ad_category_id) return;
        try {
          setLoading(true);
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const apiBase = baseUrl.replace(/\/api\/?$/, '');

          // Query params: ad_category + community_id
          const communityParam = communityId ? `&community_id=${communityId}` : '';
          const url = `${apiBase}/api/cubes-by-category?ad_category_id=${widget.ad_category_id}${communityParam}`;

          console.log('🎯 AdCategoryWidget fetching data:', {
            widget_name: widget.name,
            ad_category_id: widget.ad_category_id,
            communityId: communityId,
            url: url
          });

          // Header dengan auth jika ada
          const headers = authHeaders || { 'Content-Type': 'application/json' };

          let res = await fetch(url, { headers });

          // Fallback ke endpoint publik jika unauthorized/forbidden
          if (res.status === 401 || res.status === 403) {
            const publicUrl = `${apiBase}/api/cubes-by-category-public?ad_category_id=${widget.ad_category_id}${communityParam}`;
            console.log('⚠️ Auth failed, trying public endpoint:', publicUrl);
            res = await fetch(publicUrl, { headers: { 'Content-Type': 'application/json' } });
          }

          if (!res.ok) {
            console.error('❌ Failed to fetch category data:', res.status);
            setItems([]);
            return;
          }

          const json = await res.json();
          const data = Array.isArray(json?.data) ? json.data : [];
          console.log('✅ AdCategoryWidget data received:', {
            widget_name: widget.name,
            total_items: data.length,
            items: data
          });
          setItems(data);
        } catch (e) {
          console.error('Error fetching category data:', e);
          setItems([]);
        } finally {
          setLoading(false);
        }
      };
      fetchByCategory();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [widget?.ad_category_id]);

    if (loading) {
      return (
        <div className="mb-6">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white">{widget.name || 'Kategori Iklan'}</h2>
            {widget.description && (
              <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[180px] h-[232px] bg-white/10 rounded-[12px] animate-pulse" />
            ))}
          </div>
        </div>
      );
    }

    if (!items.length) return null;

    return (
      <div className="mb-6">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">{widget.name || 'Kategori Iklan'}</h2>
          {widget.description && (
            <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((item, index) => {
            const ad = item?.ad || item;
            const cube = item?.cube || ad?.cube;
            if (!ad && !cube) return null;

            const handleClick = () => {
              const link = buildPromoLink(ad, cube, communityId);
              router.push(link);
            };

            const size = widget.size || 'M';
            return (
              <KomunitasCard
                item={item}
                size={size}
                onClick={handleClick}
                key={ad?.id || cube?.id || index}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const RecommendationWidget = ({ widget, communityId }) => {
    const [items, setItems] = useState([]);
    const [loadingRec, setLoadingRec] = useState(true);

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
            // Coba berbagai kemungkinan struktur data
            let ad = null;
            let cube = null;

            // Kemungkinan 1: row.ad exists
            if (row?.ad) {
              ad = row.ad;
              cube = row.cube || ad.cube || {};
            }
            // Kemungkinan 2: row.ads[0] exists
            else if (Array.isArray(row?.ads) && row.ads.length > 0) {
              ad = row.ads[0];
              cube = row.cube || ad.cube || {};
            }
            // Kemungkinan 3: row IS the ad itself
            else if (row?.title || row?.image_1 || row?.id) {
              ad = row;
              cube = row.cube || {};
            }
            // Kemungkinan 4: row IS the cube with ads
            else if (row?.label || row?.code) {
              cube = row;
              ad = Array.isArray(row.ads) && row.ads[0] ? row.ads[0] : null;
            }

            return { ad, cube };
          });

          if (mounted) setItems(normalized);
        } catch {
          if (mounted) setItems([]);
        } finally {
          if (mounted) setLoadingRec(false);
        }
      })();
      return () => { mounted = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loadingRec) return <div className="text-white/80 text-sm mb-4">Memuat {widget.name || 'rekomendasi'}…</div>;
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
            {items.map((itemData, index) => {
              const ad = itemData?.ad;
              const cube = itemData?.cube;

              if (!ad && !cube) return null;

              return (
                <KomunitasCard
                  key={index}
                  item={{ ad, cube }}
                  size="XL"
                  onClick={() => router.push(buildPromoLink(ad, cube, communityId))}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ======== SHUFFLE CUBE WIDGET (Promo Acak) ========
  const ShuffleCubeWidget = ({ widget }) => {
    const { name } = widget;
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <h2 className="text-lg font-bold text-white">{name}</h2>
          {widget.description && (
            <p className="text-sm text-white/80 mt-[1px]">{widget.description}</p>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {shuffleData.map((item, index) => (
            <KomunitasCard
              key={item?.id || item?.cube?.id || index}
              item={item}
              size={widget.size || 'M'}
              onClick={() => {
                const ad = item;
                if (ad?.id) {
                  router.push(`/app/iklan/${ad.id}?communityId=${communityId}`);
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  // ======== WIDGET RENDERER (S, M, L, XL, XL-Ads) ========
  const WidgetRenderer = ({ widget, communityId }) => {
    const { source_type, size, dynamic_content_cubes, name, content_type } = widget;

    // Handle category_box widget (Kotak Kategori dengan gambar)
    if (source_type === 'category_box' || content_type === 'category_box') {
      return <CategoryBoxWidget widget={widget} />;
    }

    // Handle ad_category widget (Promo/Iklan dengan Selector Kategori + Konten Dinamis)
    if (source_type === 'ad_category' || content_type === 'ad_category') {
      return <AdCategoryWidget widget={widget} communityId={communityId} />;
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
        />
      );
    }

    if (source_type !== 'cube' || !dynamic_content_cubes?.length) return null;

    console.log('🎨 Rendering cube widget (iklan pilihan):', {
      name: name,
      source_type: source_type,
      content_type: content_type,
      size: size,
      total_cubes: dynamic_content_cubes.length,
      cubes: dynamic_content_cubes
    });

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
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {dynamic_content_cubes.map((cubeData, index) => {
            const cube = cubeData?.cube;

            console.log(`  📦 Cube ${index + 1} RAW DATA:`, {
              cubeData: cubeData,
              cube: cube,
              cube_keys: cube ? Object.keys(cube) : []
            });

            if (!cube) {
              console.warn(`  ⚠️ Cube ${index + 1}: cube is null/undefined`);
              return null;
            }

            // Ambil 1 ad yang menempel ke cube (kalau ada)
            const ad = cube.ads?.[0] || null;

            console.log(`  📦 Cube ${index + 1} PROCESSED:`, {
              cube_id: cube.id,
              cube_label: cube.label,
              cube_name: cube.name,
              cube_title: cube.title,
              cube_picture_source: cube.picture_source,
              cube_address: cube.address,
              cube_code: cube.code,
              cube_type_id: cube.cube_type_id,
              has_ads_array: Array.isArray(cube.ads),
              ads_length: cube.ads?.length || 0,
              has_ad: !!ad,
              ad_id: ad?.id,
              ad_title: ad?.title,
              ad_image: ad?.image_1 || ad?.image_2 || ad?.image_3,
              full_cube_data: cube
            });

            // 🆕 Skip cube yang tidak punya ads DAN tidak punya gambar
            const hasImage = !!(cube.picture_source || cube.image || cube.image_1);
            if (!ad && !hasImage) {
              console.warn(`  ⚠️ Skipping cube ${cube.id}: no ads and no image`);
              return null;
            }

            // XL-Ads / XL / L / S / M - Gunakan KomunitasCard untuk konsistensi dengan promo acak
            const handleClick = () => {
              const link = buildPromoLink(ad, cube, communityId);
              console.log(`  🔗 Click link for cube ${cube.id}:`, link);
              router.push(link);
            };

            return (
              <KomunitasCard
                key={cube.id || index}
                item={{ ad, cube }}
                size={size}
                onClick={handleClick}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const PromoCard = ({ promo }) => (
    <div
      className="bg-white/20 backdrop-blur-md rounded-[16px] shadow-lg overflow-hidden mb-4 hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/30"
      onClick={() => handlePromoClick(promo)}
      style={{ minWidth: 220 }}
    >
      <div className="flex p-4 items-center">
        <div className="w-28 h-28 rounded-[12px] overflow-hidden flex-shrink-0 bg-white/10">
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-0 pointer-events-none" />
      <div className="px-6 pb-24 relative z-10">
        <div className="pt-6" />
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
          {widgetData.length > 0 && (
            <div className="mb-6">
              {(() => {
                console.log('🔧 Rendering widgets:', widgetData.map(w => ({
                  id: w.id,
                  name: w.name,
                  source_type: w.source_type,
                  content_type: w.content_type,
                  level: w.level
                })));
                return null;
              })()}
              {widgetData
                .sort((a, b) => (a.level || 0) - (b.level || 0))
                .map((widget) => (
                  <WidgetRenderer key={widget.id} widget={widget} communityId={communityId} />
                ))}
            </div>
          )}

          {promoData.length > 0 && (
            <div className="mb-6">
              <div className="mb-2">
                <h2 className="text-lg font-bold text-white">Promo Terbaru</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
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
