/* eslint-disable no-console */
/* pages/.../[promoId].jsx */
import {
  faArrowLeft,
  faCheckCircle,
  faExclamationTriangle,
  faMapMarkerAlt,
  faPhone,
  faShare,
  faWifi,
  faWifiSlash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageCarousel } from '../../../../components/base.components';
import { token_cookie_name } from '../../../../helpers';
import { get } from '../../../../helpers/api.helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

export default function PromoDetailUnified() {
  const router = useRouter();
  const { promoId, communityId } = router.query;

  // --- Resolve ID promo dari QR lama ---
  // helper aman ambil query string dari URL sebenarnya
  const getFromSearch = useCallback((key) => {
    if (typeof window === 'undefined') return null;
    try {
      const url = new URL(router.asPath, window.location.origin);
      const v = url.searchParams.get(key);
      return v && String(v).trim() !== '' ? v : null;
    } catch {
      return null;
    }
  }, [router.asPath]);

  const resolveLegacyPromoId = useCallback(() => {
    // Kalau route param normal (bukan 'detail_promo'), pakai itu
    if (promoId && promoId !== 'detail_promo') return String(promoId);

    // Legacy URL: /promo/detail_promo?... → ambil dari query string asli
    const qsFilter = getFromSearch('filter');     // dukung versi lama ?filter=123
    const qsPromo = getFromSearch('promoId');    // dukung ?promoId=1
    const qsId = getFromSearch('id');         // dukung ?id=1

    const candidate =
      qsFilter ||
      qsPromo ||
      qsId ||
      router.query.filter ||
      router.query.id ||
      null;

    // Pastikan tidak mengembalikan 'detail_promo' lagi
    if (!candidate || String(candidate).toLowerCase() === 'detail_promo') return null;
    return String(candidate);
  }, [promoId, router.query.filter, router.query.id, getFromSearch]);

  const effectivePromoId = resolveLegacyPromoId();

  // Extract autoRegister state using useMemo to prevent unnecessary re-renders
  const autoRegister = useMemo(() => {
    return router.query.autoRegister || router.query.source;
  }, [router.query.autoRegister, router.query.source]);

  const [promoData, setPromoData] = useState(null);
  const [communityData, setCommunityData] = useState(null);

  console.log('🔥 promoData time fields', {
    start_date: promoData?.start_date,
    end_date: promoData?.end_date,
    expires_at: promoData?.expires_at,
    jam_mulai: promoData?.jam_mulai,
    jam_berakhir: promoData?.jam_berakhir
  });

  // ✅ Satu sumber kebenaran: status waktu & stok (Asia/Jakarta)
  const timeFlags = useMemo(() => {
    if (!promoData) {
      return {
        expiredByDate: false,
        withinDailyTime: true,
        startAt: null,
        endAt: null,
      };
    }

    // ambil dari BE
    let startDateOnly = promoData.start_date || promoData.created_at || null;
    let endDateOnly = promoData.end_date || promoData.expires_at || promoData.finish_validate || null;

    // potong jadi "YYYY-MM-DD" kalau ada waktu di belakang
    if (typeof startDateOnly === 'string' && startDateOnly.includes('T')) {
      startDateOnly = startDateOnly.split('T')[0];
    }
    if (typeof endDateOnly === 'string' && endDateOnly.includes('T')) {
      endDateOnly = endDateOnly.split('T')[0];
    }

    const norm = (t) => {
      if (!t) return '00:00:00';
      const s = String(t).trim();
      if (/^\d{1,2}:\d{2}$/.test(s)) return s + ':00';
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return s;
      return '00:00:00';
    };
    const startTime = norm(promoData.jam_mulai || '00:00:00');
    const endTime = norm(promoData.jam_berakhir || '23:59:59');

    const now = new Date();
    const startAt = startDateOnly ? new Date(`${startDateOnly}T${startTime}`) : null;
    const endAt = endDateOnly ? new Date(`${endDateOnly}T${endTime}`) : null;

    const beforeStart = startAt && now < startAt;
    const afterEnd = endAt && now > endAt;
    const expiredByDate = !!afterEnd;

    let withinDailyTime = true;
    if (!expiredByDate && !beforeStart) {
      const todayStr = now.toISOString().split('T')[0];
      const todayStart = new Date(`${todayStr}T${startTime}`);
      const todayEnd = new Date(`${todayStr}T${endTime}`);
      withinDailyTime = now >= todayStart && now <= todayEnd;
    }

    console.log('🕒 FE time flags', {
      now: now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      startAt,
      endAt,
      startTime,
      endTime,
      expiredByDate,
      withinDailyTime,
    });

    return { expiredByDate, withinDailyTime, startAt, endAt };
  }, [promoData]);

  // Derivatif status “belum mulai” (ganti isNotStarted lama supaya konsisten TZ)
  const isNotStarted = useMemo(() => {
    if (!promoData?.start_date) return false;
    const startAt = new Date(`${promoData.start_date}T${promoData.jam_mulai || '00:00:00'}`);
    return new Date() < startAt;
  }, [promoData]);

  const isStartTomorrow = useMemo(() => {
    if (!promoData?.start_date) return false;
    const startDate = new Date(promoData.start_date);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return (
      startDate.getFullYear() === tomorrow.getFullYear() &&
      startDate.getMonth() === tomorrow.getMonth() &&
      startDate.getDate() === tomorrow.getDate()
    );
  }, [promoData]);

  // (opsional) stok: pakai remaining_stock kalau ada, fallback ke total_remaining
  const remaining = useMemo(() => {
    const r = promoData?.remaining_stock ?? promoData?.total_remaining;
    return Number.isFinite(Number(r)) ? Number(r) : null;
  }, [promoData]);

  const outOfStock = remaining !== null ? remaining <= 0 : false;

  // ✅ Single source of truth untuk UI & tombol
  const canClaim = !timeFlags.expiredByDate && timeFlags.withinDailyTime && !outOfStock;

  const [loading, setLoading] = useState(true);

  const [isClaimedLoading, setIsClaimedLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetailExpanded, setShowDetailExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAlreadyClaimed, setIsAlreadyClaimed] = useState(false);

  // State untuk mencegah multiple redirects dan rate limiting
  const [hasTriedAuth, setHasTriedAuth] = useState(false);
  const isCheckingRef = useRef(false);
  const verificationDoneRef = useRef(false);

  // Tambah helper URL gambar + baseUrl
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const baseUrl = (apiUrl || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');

  const buildImageUrl = useCallback((raw) => {
    const isAbs = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
    const fallback = '/default-avatar.png';
    if (typeof raw !== 'string') return fallback;
    let url = raw.trim();
    if (!url) return fallback;
    if (/^\/?default-avatar\.png$/i.test(url)) return fallback;
    if (isAbs(url)) return url;
    let path = url.replace(/^\/+/, '');
    path = path.replace(/^api\/storage\//i, 'storage/');
    if (/^(ads|promos|uploads|images|files|banners)\//i.test(path)) {
      path = `storage/${path}`;
    }
    return `${baseUrl}/${path}`.replace(/([^:]\/)\/+/g, '$1');
  }, [baseUrl]);

  // ==== Hook gambar - mendukung multiple images ====
  const promoImages = useMemo(() => {
    if (!promoData) return ['/default-avatar.png'];

    // Helper untuk memproses URL gambar
    const processImageUrl = (url) => {
      if (!url) return null;
      return buildImageUrl(url);
    };

    const images = [];

    // Priority order: gallery -> images (yang sudah dikumpulkan di fetchPromoDetails) -> image_1/image_2/image_3 -> picture_source -> image
    if (promoData.gallery && Array.isArray(promoData.gallery) && promoData.gallery.length > 0) {
      return promoData.gallery.map(processImageUrl).filter(Boolean);
    }

    // Prioritas utama: gunakan images yang sudah dikumpulkan dari fetchPromoDetails
    if (promoData.images && Array.isArray(promoData.images) && promoData.images.length > 0) {
      const processedImages = promoData.images.map(processImageUrl).filter(Boolean);
      if (processedImages.length > 0) {
        console.log('🖼️ Using images from promoData.images:', processedImages);
        return processedImages;
      }
    }

    // Fallback: ambil langsung dari database fields jika images array kosong/tidak ada
    if (promoData.image_1) {
      const img1 = processImageUrl(promoData.image_1);
      if (img1) images.push(img1);
    }
    if (promoData.image_2) {
      const img2 = processImageUrl(promoData.image_2);
      if (img2) images.push(img2);
    }
    if (promoData.image_3) {
      const img3 = processImageUrl(promoData.image_3);
      if (img3) images.push(img3);
    }

    // Jika ada images dari image_1/2/3, return itu
    if (images.length > 0) {
      console.log('🖼️ Using fallback images from individual fields:', images);
      return images;
    }

    // Fallback ke picture_source
    if (promoData.picture_source) {
      const pic = processImageUrl(promoData.picture_source);
      if (pic) {
        console.log('🖼️ Using picture_source:', [pic]);
        return [pic];
      }
    }

    // Fallback ke single image
    if (promoData.image) {
      const img = processImageUrl(promoData.image);
      if (img) {
        console.log('🖼️ Using single image:', [img]);
        return [img];
      }
    }

    console.log('🖼️ Using default image');
    return ['/default-avatar.png'];
  }, [promoData, buildImageUrl]);

  // Debug log untuk memastikan images terdeteksi dengan benar
  useEffect(() => {
    if (promoImages && promoImages.length > 0) {
      console.log('🎠 Carousel akan menampilkan images:', {
        count: promoImages.length,
        images: promoImages,
        promoData: {
          id: promoData?.id,
          title: promoData?.title,
          images: promoData?.images,
          image_1: promoData?.image_1,
          image_2: promoData?.image_2,
          image_3: promoData?.image_3
        }
      });
    }
  }, [promoImages, promoData]);

  // Clean up on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setHasTriedAuth(false);
      // Clear any running flags to prevent memory leaks
      if (checkUserVerificationStatus.isRunning) {
        checkUserVerificationStatus.isRunning = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // checkUserVerificationStatus excluded to prevent re-renders

  // Fetch community data berdasarkan communityId
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!communityId || communityId === 'promo-entry') return;

      try {
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

          setCommunityData({
            id: community.id,
            name: community.name,
            description: community.description ?? null,
            bg_color_1: community.bg_color_1 ?? null,
            bg_color_2: community.bg_color_2 ?? null,
          });
        } else {
          setCommunityData(null);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
        setCommunityData(null);
      }
    };

    fetchCommunityData();
  }, [communityId]);

  // Cek status claimed dari API saat promo data berubah
  useEffect(() => {
    if (!promoData?.id) return;

    const checkClaimedStatus = async () => {
      try {
        const encryptedToken = Cookies.get(token_cookie_name || 'huehuy_token');
        const currentUserToken = encryptedToken ? Decrypt(encryptedToken) : '';

        if (!currentUserToken) {
          setIsAlreadyClaimed(false);
          return;
        }

        // Check API untuk status claimed
        const headers = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${currentUserToken}`,
        };

        const apiUrls = [
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/promo-items`,
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/vouchers/voucher-items`
        ];

        let alreadyClaimed = false;

        for (const url of apiUrls) {
          try {
            const response = await fetch(url, { headers });
            if (response.ok) {
              const data = await response.json();
              const items = Array.isArray(data) ? data : (data?.data || []);

              const apiClaimed = items.some(item => {
                const itemPromoId = item.promo?.id || item.ad?.id || item.promo_id;
                const sameId = String(itemPromoId) === String(promoData.id);

                const itemCode = item.promo?.code || item.code || null;
                const sameCode = promoData?.code && itemCode && String(itemCode) === String(promoData.code);

                return sameId || sameCode;
              });

              if (apiClaimed) {
                alreadyClaimed = true;
                break;
              }
            }
          } catch (err) {
            console.warn('Error checking API for claimed status:', err);
          }
        }

        setIsAlreadyClaimed(alreadyClaimed);
      } catch (error) {
        console.error('Error checking claimed status:', error);
        setIsAlreadyClaimed(false);
      }
    };

    checkClaimedStatus();
  }, [promoData?.id]);

  // Fallback legacy jika tidak ada communityId - REMOVED DUMMY DATA
  useEffect(() => {
    if (!effectivePromoId) return;
    // Real API fetching only - no dummy data fallback
  }, [effectivePromoId, communityId]);

  // --- Fetch detail (stabil, anti double-run) ---
  const hasFetched = useRef(false);

  // simpan posisi user untuk origin rute
  const userPosRef = useRef(null);

  // izinkan fetch ulang kalau ID komunitas/Promo berubah
  useEffect(() => {
    hasFetched.current = false;
  }, [effectivePromoId, communityId]);

  // +++ Helper jarak + koordinat +++
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const fmtKm = (km) => {
    if (km == null || Number.isNaN(km)) return '3 KM';
    if (km < 1) return `${(km * 1000).toFixed(0)} M`;
    return `${km.toFixed(km < 10 ? 1 : 0)} KM`;
  };
  const fmtCoord = (lat, lng) =>
    lat != null && lng != null ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : '';

  // Pilih tag yang punya koordinat; fallback ke cube.map_lat/lng
  const getCubeLocationInfo = useCallback((cube) => {
    const tags = Array.isArray(cube?.tags) ? cube.tags : [];
    const primaryTag =
      tags.find((t) => t?.map_lat != null && t?.map_lng != null) ||
      tags[0] ||
      null;

    const lat = primaryTag?.map_lat ?? cube?.map_lat ?? null;
    const lng = primaryTag?.map_lng ?? cube?.map_lng ?? null;
    const address = primaryTag?.address || cube?.address || '';

    return {
      address,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      coordinates: lat != null && lng != null ? fmtCoord(lat, lng) : '',
    };
  }, []);

  // === MISSING HELPERS: day label, time range, tanggal Indonesia ===
  const DAY_ID = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu',
  };
  const MONTH_ID = useMemo(() => ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'], []);

  const pad2 = (n) => String(n).padStart(2, '0');
  const toHM = (val) => {
    if (!val) return '';
    const s = String(val).trim();
    // Accept "H:mm", "HH:mm", "HH:mm:ss"
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return '';
    const hh = pad2(Math.min(23, parseInt(m[1], 10)));
    const mm = pad2(Math.min(59, parseInt(m[2], 10)));
    return `${hh}:${mm}`;
  };

  const fmtDateID = useCallback((raw) => {
    if (!raw) return '';
    let d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      // try dd-mm-yyyy
      const m = String(raw).match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
      if (m) d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    }
    if (Number.isNaN(d.getTime())) return String(raw);
    return `${d.getDate()} ${MONTH_ID[d.getMonth()]} ${d.getFullYear()}`;
  }, [MONTH_ID]);

  const labelDayType = useCallback((ad) => {
    const t = (ad?.day_type || '').toLowerCase();
    if (t === 'weekend') return 'Sabtu - Minggu';
    if (t === 'weekday') return 'Senin - Jumat';
    // custom days could be object or array
    const cd = ad?.custom_days;
    const list = [];
    if (Array.isArray(cd)) {
      cd.forEach((k) => {
        const key = String(k || '').toLowerCase();
        if (DAY_ID[key]) list.push(DAY_ID[key]);
      });
    } else if (cd && typeof cd === 'object') {
      Object.keys(cd).forEach((k) => {
        const v = cd[k];
        if (v && DAY_ID[k.toLowerCase()]) list.push(DAY_ID[k.toLowerCase()]);
      });
    }
    if (list.length === 7) return 'Setiap Hari';
    if (list.length > 0) return list.join(', ');
    return 'Sabtu - Minggu'; // default sama dengan tampilan sebelumnya
  }, []);

  const buildTimeRange = useCallback((ad) => {
    const start = toHM(ad?.jam_mulai);
    const end = toHM(ad?.jam_berakhir);
    if (start && end) return `${start} - ${end}`;
    if (start && !end) return `${start} - 23:59`;
    if (!start && end) return `Sampai ${end}`;
    const limit = toHM(ad?.validation_time_limit);
    if (limit) return `Sampai ${limit}`;
    return '00:00 - 23:59';
  }, []);

  const buildScheduleFromAd = useCallback((ad) => ({
    day: labelDayType(ad),
    details: ad?.finish_validate ? `Berlaku hingga ${fmtDateID(ad.finish_validate)}` : 'Berlaku',
    time: buildTimeRange(ad),
    timeDetails: 'Jam Berlaku Promo',
  }), [fmtDateID, buildTimeRange, labelDayType]);

  // Function untuk menentukan gradient berdasarkan bg_color dari community
  const getCommunityGradient = useCallback((bgColor1, bgColor2) => {
    // Jika ada bg_color_1 dan bg_color_2 dari community, gunakan itu
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
    // Fallback default jika tidak ada warna dari community
    return {
      backgroundImage: 'linear-gradient(135deg, #16a34a, #059669)',
    };
  }, []);

  // Function untuk mendapatkan warna utama community
  const getCommunityPrimaryColor = useCallback(() => {
    return communityData?.bg_color_1 || '#16a34a'; // fallback ke green-600
  }, [communityData?.bg_color_1]);

  // Ubah fetchPromoDetails: urutan cubes → ads → promos/public
  const fetchPromoDetails = useCallback(async () => {
    if (!router.isReady || !effectivePromoId) return null;
    if (String(effectivePromoId).toLowerCase() === 'detail_promo') return null;
    if (hasFetched.current) return null;
    hasFetched.current = true;

    try {
      setLoading(true);

      // 1) Coba dari CubeController (pakai cube id)\
      let response = await get({ path: `admin/cubes/${effectivePromoId}` });

      if (response?.status === 200 && (response?.data?.data || response?.data)) {
        const cube = response.data?.data || response.data;
        const ads = Array.isArray(cube?.ads) ? cube.ads : [];
        const ad = ads.find(a => a?.status === 'active') || ads[0] || null;

        // Collect all available images from ad
        const imageUrls = [];
        if (ad?.picture_source) imageUrls.push(ad.picture_source);
        if (ad?.image_1) imageUrls.push(ad.image_1);
        if (ad?.image_2) imageUrls.push(ad.image_2);
        if (ad?.image_3) imageUrls.push(ad.image_3);
        if (ad?.image) imageUrls.push(ad.image);

        // Fallback to cube image if no ad images
        if (imageUrls.length === 0 && cube?.picture_source) {
          imageUrls.push(cube.picture_source);
        }

        // Fallback to default if still no images
        if (imageUrls.length === 0) {
          imageUrls.push('/default-avatar.png');
        }

        console.log('🖼️ Collected images from cube/ads endpoint:', {
          imageCount: imageUrls.length,
          imageUrls,
          adData: {
            picture_source: ad?.picture_source,
            image_1: ad?.image_1,
            image_2: ad?.image_2,
            image_3: ad?.image_3,
            image: ad?.image
          }
        });

        const loc = getCubeLocationInfo(cube);

        const transformed = {
          id: ad?.id || cube?.id,
          title: ad?.title || cube?.label || 'Promo',
          merchant: ad?.merchant || cube?.user?.name || cube?.corporate?.name || 'Merchant',
          images: imageUrls,
          image: imageUrls[0], // Keep for backward compatibility
          code: data.code || null,
          distance: '3 KM',
          location: loc.address || (loc.coordinates ? loc.coordinates : ''),
          coordinates: loc.coordinates,
          lat: loc.lat,
          lng: loc.lng,
          originalPrice: ad?.original_price ?? null,
          discountPrice: ad?.discount_price ?? null,
          discount: ad?.discount_percentage ? `${ad.discount_percentage}%` : null,
          detail: ad?.description || '',
          description: ad?.description || '',
          start_date: ad?.start_validate || null,
          always_available: false,
          expires_at: ad?.finish_validate || null,
          end_date: ad?.finish_validate || null,
          jam_mulai: ad?.jam_mulai ?? null,      // ✅ tambahkan di sini
          jam_berakhir: ad?.jam_berakhir ?? null,
          schedule: buildScheduleFromAd(ad || {}),
          status: {
            type: ad?.promo_type === 'online' ? 'Online' : 'Offline',
            description: `Tipe Promo: ${ad?.promo_type === 'online' ? '🌐 Online' : '📍 Offline'}`,
          },
          seller: {
            name: cube?.user?.name || cube?.corporate?.name || 'Admin',
            phone: cube?.user?.phone || cube?.corporate?.phone || '',
          },
          terms: 'TERM & CONDITIONS APPLY',
        };

        setPromoData(transformed);
        return transformed;
      }

      // 2) Fallback: coba endpoint ads langsung jika ada
      response = await get({ path: `admin/ads/${effectivePromoId}` });
      if (response?.status === 200 && (response?.data?.data || response?.data)) {
        const ad = response.data?.data || response.data;
        // Collect all available images from ad
        const imageUrls = [];
        if (ad?.picture_source) imageUrls.push(ad.picture_source);
        if (ad?.image_1) imageUrls.push(ad.image_1);
        if (ad?.image_2) imageUrls.push(ad.image_2);
        if (ad?.image_3) imageUrls.push(ad.image_3);
        if (ad?.image) imageUrls.push(ad.image);

        // Fallback to default if no images
        if (imageUrls.length === 0) {
          imageUrls.push('/default-avatar.png');
        }

        console.log('🖼️ Collected images from ads endpoint:', {
          imageCount: imageUrls.length,
          imageUrls,
          adData: {
            picture_source: ad?.picture_source,
            image_1: ad?.image_1,
            image_2: ad?.image_2,
            image_3: ad?.image_3,
            image: ad?.image
          }
        });

        // >>> Perbaikan: manfaatkan relasi ad.cube terlebih dahulu
        let cubeInfo = {
          address: '',
          coordinates: '',
          lat: null,
          lng: null,
          sellerName: 'Admin',
          sellerPhone: '',
        };

        try {
          if (ad?.cube) {
            const loc = getCubeLocationInfo(ad.cube);
            cubeInfo = {
              address: loc.address,
              coordinates: loc.coordinates,
              lat: loc.lat,
              lng: loc.lng,
              sellerName:
                ad?.cube?.user?.name || ad?.cube?.corporate?.name || 'Admin',
              sellerPhone:
                ad?.cube?.user?.phone || ad?.cube?.corporate?.phone || '',
            };
          } else if (ad?.cube_id) {
            const cubeRes = await get({ path: `admin/cubes/${ad.cube_id}` });
            if (cubeRes?.status === 200 && (cubeRes?.data?.data || cubeRes?.data)) {
              const cube = cubeRes.data?.data || cubeRes.data;
              const loc = getCubeLocationInfo(cube);
              cubeInfo = {
                address: loc.address,
                coordinates: loc.coordinates,
                lat: loc.lat,
                lng: loc.lng,
                sellerName: cube?.user?.name || cube?.corporate?.name || 'Admin',
                sellerPhone: cube?.user?.phone || cube?.corporate?.phone || '',
              };
            }
          }
        } catch { }

        const transformed = {
          id: ad?.id,
          title: ad?.title || 'Promo',
          merchant: ad?.merchant || cubeInfo.sellerName || 'Merchant',
          images: imageUrls,
          image: imageUrls[0], // Keep for backward compatibility
          code: ad?.code || null,
          distance: '3 KM',
          location: cubeInfo.address || cubeInfo.coordinates || ad?.location || '',
          coordinates: cubeInfo.coordinates || '',
          lat: cubeInfo.lat,
          lng: cubeInfo.lng,
          originalPrice: ad?.original_price ?? null,
          discountPrice: ad?.discount_price ?? null,
          discount: ad?.discount_percentage ? `${ad.discount_percentage}%` : null,
          detail: ad?.description || '',
          description: ad?.description || '',
          start_date: ad?.start_validate || null,
          always_available: false,
          expires_at: ad?.finish_validate || null,
          end_date: ad?.finish_validate || null,
          jam_mulai: ad?.jam_mulai ?? null,      // ✅ tambahkan di sini
          jam_berakhir: ad?.jam_berakhir ?? null,
          schedule: buildScheduleFromAd(ad || {}),
          status: {
            type: ad?.promo_type === 'online' ? 'Online' : 'Offline',
            description: `Tipe Promo: ${ad?.promo_type === 'online' ? '🌐 Online' : '📍 Offline'}`,
          },
          seller: {
            name: cubeInfo.sellerName || ad?.owner_name || 'Admin',
            phone: cubeInfo.sellerPhone || ad?.owner_contact || '',
          },
          terms: 'TERM & CONDITIONS APPLY',
        };
        setPromoData(transformed);
        return transformed;
      }

      // 3) Legacy terakhir (publik)
      response = await get({ path: `promos/${effectivePromoId}/public` });
      if (response?.status === 200 && response?.data?.data) {
        const data = response.data.data;
        // Collect all available images
        const imageUrls = [];
        if (data.image_url) imageUrls.push(data.image_url);
        if (data.image) imageUrls.push(data.image);
        if (data.picture_source) imageUrls.push(data.picture_source);
        if (data.image_1) imageUrls.push(data.image_1);
        if (data.image_2) imageUrls.push(data.image_2);
        if (data.image_3) imageUrls.push(data.image_3);

        // Fallback to default if no images
        if (imageUrls.length === 0) {
          imageUrls.push('/default-avatar.png');
        }

        const transformedData = {
          id: data.id,
          title: data.title,
          merchant: data.owner_name || 'Merchant',
          images: imageUrls,
          image: imageUrls[0], // Keep for backward compatibility
          code: data.code || null,
          distance: data.promo_distance ? `${data.promo_distance} KM` : '3 KM',
          location: data.location || '',
          coordinates: '',
          originalPrice: data.original_price ?? null,
          discountPrice: data.discount_price ?? null,
          discount: data.discount_percentage ? `${data.discount_percentage}%` : null,
          detail: data.detail || '',
          description: data.description || '',
          start_date: data.start_date || data.start_at || data.starts_at || data.valid_from || null,
          always_available: Boolean(data.always_available),
          expires_at: data.end_date || data.expires_at || data.valid_until || null,
          end_date: data.end_date || null,
          schedule: {
            day: data.always_available ? 'Setiap Hari' : 'Weekday',
            details: data.end_date ? `Berlaku hingga ${fmtDateID(data.end_date)}` : 'Berlaku',
            time: '00:00 - 23:59',
            timeDetails: 'Jam Berlaku Promo',
          },
          status: {
            type: data.promo_type === 'online' ? 'Online' : 'Offline',
            description: `Tipe Promo: ${data.promo_type === 'online' ? '🌐 Online' : '📍 Offline'}`,
          },
          seller: { name: data.owner_name || 'Admin', phone: data.owner_contact || '' },
          terms: 'TERM & CONDITIONS APPLY',
        };
        setPromoData(transformedData);
        return transformedData;
      }

      return null;
    } catch (err) {
      console.error('Error fetching promo details:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [router.isReady, effectivePromoId, buildScheduleFromAd, fmtDateID, getCubeLocationInfo]);

  // Panggil fetch ketika BUKAN QR autoRegister (tanpa syarat communityId)
  useEffect(() => {
    if (!router.isReady) return;
    if (!effectivePromoId) return;
    if (autoRegister) return;
    fetchPromoDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, effectivePromoId, autoRegister]);

  // --- Auto register setelah QR ---
  const handleAutoRegister = useCallback(
    async (token) => {
      // Prevent multiple simultaneous calls
      if (handleAutoRegister.isRunning) {
        return;
      }

      handleAutoRegister.isRunning = true;

      try {
        // Reset hasTriedAuth setelah mendapat token valid
        setHasTriedAuth(false);

        const pd = await fetchPromoDetails();
        if (!pd) return;

        // Cek duplikat dari API server, bukan localStorage
        try {
          const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          };

          const apiUrls = [
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/promo-items`,
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/vouchers/voucher-items`
          ];

          let alreadyClaimed = false;

          for (const url of apiUrls) {
            try {
              const response = await fetch(url, { headers });
              if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data?.data || []);

                const apiClaimed = items.some(item => {
                  const itemPromoId = item.promo?.id || item.ad?.id || item.promo_id;
                  const sameId = String(itemPromoId) === String(promoData.id);

                  const itemCode = item.promo?.code || item.code || null;
                  const sameCode = promoData?.code && itemCode && String(itemCode) === String(promoData.code);

                  return sameId || sameCode;
                });

                if (apiClaimed) {
                  alreadyClaimed = true;
                  break;
                }
              }
            } catch (err) {
              // Silent error checking API
            }
          }

          if (alreadyClaimed) {
            setIsAlreadyClaimed(true);
          }

          // TIDAK melakukan auto claim - biarkan user klik tombol manual
        } catch (checkError) {
          // Silent error checking claimed status
        }
      } catch (error) {
        // Silent error for auto register
      } finally {
        handleAutoRegister.isRunning = false;
      }
    },
    [fetchPromoDetails] // Removed communityId as it's not used in the function
  );

  // --- Cek status verifikasi user ---
  const checkUserVerificationStatus = useCallback(
    async (token) => {
      // Prevent multiple concurrent calls
      if (isCheckingRef.current || verificationDoneRef.current) {
        console.log('checkUserVerificationStatus already running or done, skipping...');
        return;
      }

      isCheckingRef.current = true;

      try {
        console.log('Checking verification status with token:', token?.substring(0, 20) + '...');

        let response = await get({
          path: 'account',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (response?.status === 200) {
          handleAutoRegister(token);
          return;
        }

        if (response?.status === 401 || response?.status === 404) {
          response = await get({
            path: 'account-unverified',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          });

          if (response?.status === 200) {
            const userData = response?.data?.data?.profile || response?.data?.profile;
            const emailVerified = userData?.email_verified_at || userData?.verified_at;

            if (!emailVerified) {
              const next =
                typeof window !== 'undefined'
                  ? window.location.href
                  : `/app/komunitas/promo/${promoId}?communityId=${communityId}`;
              // Add delay to prevent immediate redirect loops
              setTimeout(() => {
                window.location.href = `/verifikasi?next=${encodeURIComponent(next)}`;
              }, 100);
              return;
            } else {
              handleAutoRegister(token);
              return;
            }
          }
        }

        if (response?.status === 401) {
          const next =
            typeof window !== 'undefined'
              ? window.location.href
              : `/app/komunitas/promo/${promoId}?communityId=${communityId}`;
          // Add delay to prevent immediate redirect loops
          setTimeout(() => {
            window.location.href = `/buat-akun?next=${encodeURIComponent(next)}`;
          }, 100);
          return;
        }

        handleAutoRegister(token);
      } catch (err) {
        console.error('Error checking verification status:', err);

        // Don't redirect on network errors to prevent session loss
        if (err?.message?.includes('Failed to fetch') || err?.code === 'NETWORK_ERROR') {
          console.warn('Network error, not redirecting to login');
          return;
        }

        const next =
          typeof window !== 'undefined'
            ? window.location.href
            : `/app/komunitas/promo/${promoId}?communityId=${communityId}`;
        // Add delay to prevent immediate redirect loops
        setTimeout(() => {
          window.location.href = `/buat-akun?next=${encodeURIComponent(next)}`;
        }, 100);
      } finally {
        isCheckingRef.current = false;
        verificationDoneRef.current = true;
      }
    },
    // Simplified dependencies to prevent circular references
    [promoId, communityId, handleAutoRegister]
  );

  // --- Retry fetch khusus alur QR (saat param sudah siap) ---
  useEffect(() => {
    if (!router.isReady) return;
    if (!autoRegister) return;

    if (effectivePromoId && communityId && !hasFetched.current) {
      // panggil fetch ketika semua param sudah lengkap
      fetchPromoDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, autoRegister, effectivePromoId, communityId]);

  // --- QR entry flow ---
  useEffect(() => {
    if (!router.isReady) return;
    if (hasTriedAuth) return; // Prevent multiple auth attempts
    if (!autoRegister) return;
    if (isCheckingRef.current || verificationDoneRef.current) return; // Prevent API spam

    let token = null;

    try {
      const encrypted = Cookies.get(token_cookie_name || 'huehuy_token');
      if (typeof encrypted === 'string' && encrypted) {
        token = Decrypt(encrypted);
      }
    } catch (e) {
      console.error('Failed to decrypt token:', e);
      Cookies.remove(token_cookie_name || 'huehuy_token');
    }

    if (typeof window !== 'undefined' && !token) {
      token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    }

    setHasTriedAuth(true); // Mark that we've tried auth

    if (!token) {
      const next =
        typeof window !== 'undefined'
          ? window.location.href
          : `/app/komunitas/promo/${promoId}?communityId=${communityId}`;
      if (typeof window !== 'undefined') {
        // Use setTimeout to prevent immediate redirect loops
        setTimeout(() => {
          window.location.href = `/buat-akun?next=${encodeURIComponent(next)}`;
        }, 100);
      }
      return;
    }

    checkUserVerificationStatus(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, autoRegister, promoId, communityId, hasTriedAuth]); // checkUserVerificationStatus excluded to prevent infinite loop

  // Back handler
  const handleBack = () => {
    try {
      const { from } = router.query;

      // Prevent potential session issues by not making additional API calls during navigation
      if (autoRegister) {
        // Jika dari QR scan, selalu ke home
        router.push('/app');
      } else if (from === 'saku') {
        router.push('/app/saku');
      } else if (communityId === 'promo-entry') {
        router.push('/app');
      } else if (communityId) {
        router.push(`/app/komunitas/dashboard/${communityId}`);
      } else {
        // Default ke home untuk menghindari session expired
        router.push('/app');
      }
    } catch (error) {
      console.error('Error in handleBack:', error);
      // Fallback to home if there's any error
      router.push('/app');
    }
  };

  // +++ Hitung jarak berdasar posisi user → lat/lng promo +++
  useEffect(() => {
    if (!promoData || promoData.lat == null || promoData.lng == null) return;

    const onOk = (pos) => {
      const { latitude, longitude } = pos.coords || {};
      if (latitude == null || longitude == null) return;

      // simpan origin untuk rute
      userPosRef.current = { lat: Number(latitude), lng: Number(longitude) };

      const km = haversineKm(Number(latitude), Number(longitude), Number(promoData.lat), Number(promoData.lng));
      setPromoData((prev) => (prev ? { ...prev, distance: fmtKm(km) } : prev));
    };

    const onErr = () => {
      // jika ditolak/timeout, biarkan default '3 KM'
    };

    if (typeof window !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(onOk, onErr, { enableHighAccuracy: true, timeout: 8000 });
    }
  }, [promoData]);

  // Buka rute Google Maps (gunakan location.href agar tidak diblokir popup)
  const openRoute = useCallback(() => {
    if (!promoData) return;

    let destination = '';
    if (promoData.lat != null && promoData.lng != null) {
      destination = `${promoData.lat},${promoData.lng}`;
    } else if (promoData.location) {
      destination = encodeURIComponent(promoData.location);
    } else if (promoData.coordinates) {
      destination = encodeURIComponent(promoData.coordinates);
    }
    if (!destination) return;

    const qs = new URLSearchParams();
    qs.set('destination', destination);
    if (userPosRef.current?.lat != null && userPosRef.current?.lng != null) {
      qs.set('origin', `${userPosRef.current.lat},${userPosRef.current.lng}`);
    }

    const url = `https://www.google.com/maps/dir/?api=1&${qs.toString()}`;
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }, [promoData]);

  // --- Share & Report ---
  const handleShare = () => setShowShareModal(true);
  const handleReport = () => setShowReportModal(true);

  const handleShareComplete = (platform) => {
    if (!promoData) return;
    const promoUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText =
      `Cek promo menarik ini: ${promoData.title} di ${promoData.merchant}!` +
      (promoData.discount ? ` Diskon ${promoData.discount}` : '');

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + promoUrl)}`, '_blank');
        break;
      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(promoUrl)}&text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(promoUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(promoUrl)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(promoUrl);
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
          copyBtn.textContent = '✓ Link disalin!';
          setTimeout(() => {
            copyBtn.textContent = '📋 Salin Link';
          }, 2000);
        }
        break;
    }
    setShowShareModal(false);
  };

  const submitReport = () => {
    // For now, just show success message - in production this should send to API
    setShowReportModal(false);
    setTimeout(() => {
      setErrorMessage('Laporan Anda telah dikirim. Terima kasih atas perhatiannya!');
      setShowErrorModal(true);
    }, 300);
  };

  // --- Claim promo manual ---
  const handleClaimPromo = async () => {
    if (!promoData || isClaimedLoading || isAlreadyClaimed) return;
    if (!canClaim || isNotStarted) {
      setErrorMessage(
        timeFlags.expiredByDate
          ? 'Promo sudah kadaluwarsa.'
          : isNotStarted
            ? (isStartTomorrow ? 'Promo mulai besok.' : 'Promo belum dimulai.')
            : 'Di luar jam berlaku.'
      );
      setShowErrorModal(true);
      return;
    }

    // Prevent multiple simultaneous calls
    if (handleClaimPromo.isRunning) {
      return;
    }

    handleClaimPromo.isRunning = true;
    setIsClaimedLoading(true);

    try {
      const encryptedToken = Cookies.get(token_cookie_name || 'huehuy_token');
      const token = encryptedToken ? (() => { try { return Decrypt(encryptedToken); } catch { return ''; } })() : '';

      if (!token) {
        setErrorMessage('Sesi login telah berakhir. Silakan login kembali.');
        setShowErrorModal(true);
        return;
      }

      // Single check for claimed status - reduce API calls
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Check only primary endpoint first
      try {
        const checkUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/admin/promo-items`;
        const response = await fetch(checkUrl, { headers });

        if (response.ok) {
          const data = await response.json();
          const items = Array.isArray(data) ? data : (data?.data || []);

          const apiClaimed = items.some(item => {
            const itemPromoId = item.promo?.id || item.ad?.id || item.promo_id;
            const sameId = String(itemPromoId) === String(promoData.id);

            const itemCode = item.promo?.code || item.code || null;
            const sameCode = promoData?.code && itemCode && String(itemCode) === String(promoData.code);

            return sameId || sameCode;
          });

          if (apiClaimed) {
            setErrorMessage('Promo ini sudah pernah Anda rebut sebelumnya!');
            setShowErrorModal(true);
            return;
          }
        }
      } catch (checkErr) {
        // Continue to claim if check fails
        console.warn('Error checking claimed status:', checkErr);
      }

      const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const apiUrl = rawApi.replace(/\/+$/, '');

      // Try primary endpoint first, then fallback
      const endpoints = [
        // 1) Promo-first (storeForPromo)
        `${apiUrl}/promos/${promoData.id}/items`,
        // 2) Direct claim (payload promo_id/promo_code)
        `${apiUrl}/admin/promo-items`,
        // 3) Fallback Ad (hanya bila perlu)
        `${apiUrl}/ads/${promoData.id}/claim`,
      ];

      const claimHeaders = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload = {
        promo_id: promoData.id,
        promo_code: promoData.code || null, // <-- penting!
        claim: true,
        expires_at: promoData.expires_at || null,
      };

      let savedItem = null;
      let lastError = '';

      for (let i = 0; i < endpoints.length; i++) {
        const url = endpoints[i];
        try {
          const isUnified = /\/ads\/\d+\/claim$/.test(url);
          const res = await fetch(url, {
            method: 'POST',
            headers: claimHeaders,
            body: isUnified ? undefined : JSON.stringify(payload),
          });
          const txt = await res.text().catch(() => '');
          let json = {};
          try { json = txt ? JSON.parse(txt) : {}; } catch { json = { raw: txt }; }

          if (res.ok) {
            savedItem = json?.data ?? json;
            break;
          }

          if (res.status === 401) { lastError = 'Sesi berakhir. Silakan login ulang.'; break; }
          if (res.status === 429) { lastError = 'Terlalu banyak percobaan. Silakan tunggu sebentar.'; break; }
          if (res.status === 422 && json?.errors) {
            lastError = Object.values(json.errors).flat().join(', ');
            break;
          }

          lastError = json?.message || json?.error || `HTTP ${res.status}`;
          if (i < endpoints.length - 1) await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          lastError = e?.message || 'Network error';
          if (i < endpoints.length - 1) await new Promise(r => setTimeout(r, 500));
        }
      }

      if (!savedItem) {
        const low = String(lastError || '').toLowerCase();
        if (low.includes('habis') || low.includes('stok') || low.includes('stock')) {
          setErrorMessage('Maaf, stok promo sudah habis.');
          setShowErrorModal(true);
          setIsAlreadyClaimed(false);
          return;
        }
        if (low.includes('sudah') || low.includes('already') || low.includes('claimed') || low.includes('duplicate')) {
          setIsAlreadyClaimed(true);
          setErrorMessage('Promo ini sudah pernah direbut (mungkin di akun lain).');
          setShowErrorModal(true);
          return;
        }
        if (low.includes('too many') || low.includes('attempts') || low.includes('rate limit')) {
          setErrorMessage('Terlalu banyak percobaan. Silakan tunggu sebentar dan coba lagi.');
          setShowErrorModal(true);
          return;
        }

        setErrorMessage(lastError || 'Gagal merebut promo. Silakan coba lagi.');
        setShowErrorModal(true);
        return;
      }

      // Promo successfully claimed via API
      setIsAlreadyClaimed(true);
      setShowSuccessModal(true);

    } catch (e) {
      console.error('Claim error:', e);
      setErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
      setShowErrorModal(true);
    } finally {
      setIsClaimedLoading(false);
      handleClaimPromo.isRunning = false;
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setTimeout(() => router.push('/app/saku'), 300);
  };

  // --- UI Loading / Not Found ---
  if (loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat detail promo...</p>
        </div>
      </div>
    );
  }

  if (!promoData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <p className="text-slate-600">Promo tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-container lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen lg:min-h-0 lg:my-4 lg:rounded-2xl lg:shadow-xl lg:border lg:border-slate-200 lg:overflow-hidden">
      {/* Header */}
      <div
        className="w-full h-[60px] px-4 relative overflow-hidden lg:rounded-t-2xl"
        style={getCommunityGradient(communityData?.bg_color_1, communityData?.bg_color_2)}
      >
        <div className="absolute inset-0">
          <div className="absolute top-1 right-3 w-6 h-6 bg-white rounded-full opacity-10"></div>
          <div className="absolute bottom-2 left-3 w-4 h-4 bg-white rounded-full opacity-10"></div>
          <div className="absolute top-2 left-1/3 w-3 h-3 bg-white rounded-full opacity-10"></div>
        </div>
        <div className="flex items-center justify-between h-full relative z-10">
          <button
            onClick={handleBack}
            className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-white text-sm" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-white font-bold text-sm">Iklan</h1>
          </div>
          <div className="flex space-x-1.5">
            <button
              onClick={handleShare}
              className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all"
            >
              <FontAwesomeIcon icon={faShare} className="text-white text-sm" />
            </button>
            <button
              onClick={handleReport}
              className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white min-h-screen w-full px-4 lg:px-6 pt-4 lg:pt-6 pb-28 lg:pb-4">
        <div className="lg:mx-auto lg:max-w-md">
          {/* Hero Image Carousel */}
          <div className="mb-4">
            <ImageCarousel
              images={promoImages}
              title={promoData?.title || 'Promo'}
              className="w-full"
            />
          </div>

          {/* Info cards */}
          <div className="mb-4">
            <div className="rounded-[20px] p-4 shadow-lg" style={getCommunityGradient(communityData?.bg_color_1, communityData?.bg_color_2)}>
              <div className="flex items-center justify-between mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white mr-2 text-sm" />
                  <span className="text-sm font-semibold text-white">{promoData.distance}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white opacity-80">Jarak Promo:</span>
                  <div className="text-xs text-white opacity-70">{promoData.coordinates || '-'}</div>
                </div>
              </div>

              <div className="mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">{promoData.schedule.day}</span>
                    <div className="text-xs text-white opacity-80">{promoData.schedule.details}</div>
                  </div>
                  <div className="text-right">
                    <div className="bg-yellow-400 text-slate-800 px-3 py-1 rounded-[8px] text-sm font-semibold">
                      {promoData.schedule.time}
                    </div>
                    <div className="text-xs text-white opacity-70 mt-1">{promoData.schedule.timeDetails}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={promoData.status.type === 'Online' ? faWifi : faWifiSlash}
                      className="mr-2 text-white text-sm"
                    />
                    <span className="text-sm font-semibold text-white">{promoData.status.type}</span>
                  </div>
                  <span className="text-xs text-white opacity-70">{promoData.status.description}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title + desc */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-4 text-left">{promoData.title}</h2>
              <p className="text-slate-600 leading-relaxed text-sm text-left mb-4">{promoData.description}</p>

              <div className="text-left">
                <button
                  onClick={() => setShowDetailExpanded(!showDetailExpanded)}
                  className="text-white px-6 py-2 rounded-[12px] text-sm font-semibold hover:opacity-90 transition-all flex items-center"
                  style={{ backgroundColor: getCommunityPrimaryColor() }}
                >
                  {showDetailExpanded ? 'Tutup Detail' : 'Selengkapnya'}
                  <span className={`ml-2 transition-transform duration-300 ${showDetailExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
              </div>

              {/* Expandable Detail Section */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showDetailExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                }`}>
                <div className="border-t border-slate-200 pt-4">
                  {promoData?.detail && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-slate-900 mb-2 text-sm">Detail Lengkap:</h5>
                      <div className="bg-slate-50 p-3 rounded-[12px]">
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                          {promoData.detail}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Lokasi Promo / Iklan</h4>
              <p className="text-slate-600 text-xs leading-relaxed mb-3">{promoData.location}</p>
              <button onClick={openRoute} className="w-full text-white py-2 px-6 rounded-[12px] hover:opacity-90 transition-colors text-sm font-semibold flex items-center justify-center" style={{ backgroundColor: getCommunityPrimaryColor() }}>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm" />
                Rute
              </button>
            </div>
          </div>

          {/* Kontak penjual */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Penjual / Pemilik Iklan</h4>
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 text-xs">Nama: {promoData.seller?.name}</p>
                <p className="text-xs text-slate-500">No Hp/WA: {promoData.seller?.phone || '-'}</p>
                <button
                  className="w-full text-white p-3 rounded-full hover:opacity-90 transition-colors flex items-center justify-center"
                  style={{ backgroundColor: getCommunityPrimaryColor() }}
                  onClick={() => {
                    if (promoData?.seller?.phone) {
                      const phone = String(promoData.seller.phone).replace(/\s+/g, '');
                      window.location.href = `tel:${phone}`;
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faPhone} className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:static lg:mt-6 lg:mb-4 bg-white border-t border-slate-200 lg:border-t-0 p-4 lg:p-6 z-30">
        <div className="lg:max-w-sm lg:mx-auto">
          <button
            onClick={handleClaimPromo}
            disabled={!canClaim || isNotStarted || isClaimedLoading || isAlreadyClaimed}
            className={`claim-button w-full py-4 lg:py-3.5 rounded-[15px] lg:rounded-xl font-bold text-lg lg:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${(timeFlags.expiredByDate || !timeFlags.withinDailyTime || isNotStarted)
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : isAlreadyClaimed
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : isClaimedLoading
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'text-white focus:ring-4 focus:ring-opacity-50'
              }`}
            style={
              !timeFlags.expiredByDate && timeFlags.withinDailyTime && !isNotStarted && !isClaimedLoading && !isAlreadyClaimed
                ? { backgroundColor: getCommunityPrimaryColor(), '--tw-ring-color': `${getCommunityPrimaryColor()}50` }
                : {}
            }
          >
            {timeFlags.expiredByDate ? (
              'Promo sudah kadaluwarsa'
            ) : !timeFlags.withinDailyTime ? (
              'Di luar jam berlaku'
            ) : isNotStarted ? (
              (isStartTomorrow ? 'Promo mulai besok' : 'Promo belum dimulai')
            ) : isAlreadyClaimed ? (
              <div className="flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Sudah Direbut
              </div>
            ) : isClaimedLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Merebut Promo...
              </div>
            ) : (
              'Rebut Promo Sekarang'
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${getCommunityPrimaryColor()}20` }}
            >
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-3xl"
                style={{ color: getCommunityPrimaryColor() }}
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Selamat!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Promo <span className="font-semibold" style={{ color: getCommunityPrimaryColor() }}>{promoData?.title}</span> berhasil direbut dan masuk ke Saku
              Promo Anda!
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSuccessModalClose}
                className="w-full text-white py-3 rounded-[12px] font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: getCommunityPrimaryColor() }}
              >
                Lihat Saku Promo
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-[12px] font-semibold hover:bg-slate-200 transition-all"
              >
                Tetap di Halaman Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Oops!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white py-3 rounded-[12px] font-semibold hover:bg-red-600 transition-all"
            >
              OK, Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:items-center">
          <div className="bg-white rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-md p-6 lg:m-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Bagikan Promo</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-500 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShareComplete('whatsapp')}
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] transition-all"
                style={{
                  ':hover': {
                    backgroundColor: `${getCommunityPrimaryColor()}10`,
                    borderColor: `${getCommunityPrimaryColor()}50`
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${getCommunityPrimaryColor()}10`;
                  e.currentTarget.style.borderColor = `${getCommunityPrimaryColor()}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: getCommunityPrimaryColor() }}
                >
                  <span className="text-white font-bold text-sm">WA</span>
                </div>
                <span className="text-xs text-slate-600">WhatsApp</span>
              </button>
              <button
                onClick={() => handleShareComplete('telegram')}
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-sm">TG</span>
                </div>
                <span className="text-xs text-slate-600">Telegram</span>
              </button>
              <button
                onClick={() => handleShareComplete('facebook')}
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-sm">FB</span>
                </div>
                <span className="text-xs text-slate-600">Facebook</span>
              </button>
              <button
                onClick={() => handleShareComplete('twitter')}
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-sky-50 hover:border-sky-300 transition-all"
              >
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-sm">TW</span>
                </div>
                <span className="text-xs text-slate-600">Twitter</span>
              </button>
              <button
                id="copy-btn"
                onClick={() => handleShareComplete('copy')}
                className="col-span-2 flex items-center justify-center p-4 border border-slate-200 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <span className="text-sm text-slate-700">📋 Salin Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:items-center">
          <div className="bg-white rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-md p-6 lg:m-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Laporkan Promo</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-500 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => submitReport('Iklan tidak sesuai')}
                className="w-full bg-red-100 text-red-700 py-3 rounded-[12px] font-semibold hover:bg-red-200 transition-all"
              >
                Iklan tidak sesuai
              </button>
              <button
                onClick={() => submitReport('Penipuan / scam')}
                className="w-full bg-yellow-100 text-yellow-700 py-3 rounded-[12px] font-semibold hover:bg-yellow-200 transition-all"
              >
                Penipuan / scam
              </button>
              <button
                onClick={() => submitReport('Konten tidak pantas')}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-[12px] font-semibold hover:bg-slate-200 transition-all"
              >
                Konten tidak pantas
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-[12px] font-semibold hover:bg-slate-100 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @media (min-width: 1024px) {
          .claim-button {
            max-width: 320px;
            margin: 0 auto;
          }
          .desktop-container {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        }
      `}</style>
    </div>
  );
}
