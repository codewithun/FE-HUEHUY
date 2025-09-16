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
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { token_cookie_name } from '../../../../helpers';
import { get, post } from '../../../../helpers/api.helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

// Helper aman JSON.parse
const safeParse = (text, fallback) => {
  try {
    if (typeof text !== 'string') return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

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
    const qsPromo  = getFromSearch('promoId');    // dukung ?promoId=1
    const qsId     = getFromSearch('id');         // dukung ?id=1

    const candidate =
      qsFilter ||
      qsPromo  ||
      qsId     ||
      router.query.filter ||
      router.query.id     ||
      null;

    // Pastikan tidak mengembalikan 'detail_promo' lagi
    if (!candidate || String(candidate).toLowerCase() === 'detail_promo') return null;
    return String(candidate);
  }, [promoId, router.query.filter, router.query.id, getFromSearch]);

  const effectivePromoId = resolveLegacyPromoId();

  const [promoData, setPromoData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isClaimedLoading, setIsClaimedLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAlreadyClaimed, setIsAlreadyClaimed] = useState(false);

  // ==== Hook gambar harus di atas (hindari React error #310) ====
  const [imgSrc, setImgSrc] = useState(promoData?.image || '/default-avatar.png');
  useEffect(() => {
    setImgSrc(promoData?.image || '/default-avatar.png');
  }, [promoData?.image]);

  // Clean up on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setHasTriedAuth(false);
    };
  }, []);

  // ====== Mock legacy (fallback jika tanpa communityId) ======
  const getLegacyPromoData = (id) => {
    const allPromos = {
      1: {
        id: 1,
        title: "McDonald's - Burger Combo Flash Sale",
        subtitle: 'Paket burger kombo dengan kentang dan minuman',
        image: '/images/promo/burger-combo-flash.jpg',
        merchant: {
          name: "McDonald's Bandung",
          logo: '/images/merchants/mcdonalds-logo.png',
          rating: 4.5,
          address: 'Jl. Merdeka No. 123, Bandung',
          phone: '+62 22 1234567',
        },
        discount: '30%',
        originalPrice: 45000,
        discountedPrice: 31500,
        category: 'Fast Food',
        description:
          'Nikmati burger combo spesial dengan diskon hingga 30%! Paket lengkap berisi burger beef, kentang goreng crispy, dan minuman soda pilihan.',
        terms: ['Berlaku hingga 31 Agustus 2025'],
        validUntil: '31 Agustus 2025',
        location: 'dbotanica Bandung',
        tags: ['Burger', 'Fast Food', 'Family', 'Combo'],
        gallery: [
          '/images/promo/burger-combo-flash.jpg',
          '/images/promo/chicken-package.jpg',
          '/images/promo/pizza-medium-deal.jpg',
        ],
      },
      2: {
        id: 2,
        title: 'Chicken Star - Paket Ayam Special',
        subtitle: 'Ayam crispy dengan nasi dan saus pilihan',
        image: '/images/promo/chicken-package.jpg',
        merchant: {
          name: 'Chicken Star',
          logo: '/images/merchants/chicken-star-logo.png',
          rating: 4.3,
          address: 'Jl. Sudirman No. 45, Bandung',
          phone: '+62 22 7654321',
        },
        discount: '25%',
        originalPrice: 35000,
        discountedPrice: 26250,
        category: 'Chicken',
        description:
          'Ayam crispy special dengan bumbu rahasia. Disajikan dengan nasi hangat dan saus pilihan.',
        terms: ['Berlaku hingga stok habis'],
        validUntil: '30 September 2025',
        location: 'dbotanica Bandung',
        tags: ['Chicken', 'Crispy', 'Rice', 'Spicy'],
        gallery: [
          '/images/promo/chicken-package.jpg',
          '/images/promo/beef-sausage-chicken.jpg',
          '/images/promo/burger-combo-flash.jpg',
        ],
      },
      3: {
        id: 3,
        title: 'Pizza Hut - Medium Pizza Deal',
        subtitle: 'Pizza medium dengan topping pilihan dan minuman',
        image: '/images/promo/pizza-medium-deal.jpg',
        merchant: {
          name: 'Pizza Hut',
          logo: '/images/merchants/pizza-hut-logo.png',
          rating: 4.4,
          address: 'Jl. Asia Afrika No. 67, Bandung',
          phone: '+62 22 3456789',
        },
        discount: '35%',
        originalPrice: 85000,
        discountedPrice: 55250,
        category: 'Pizza',
        description:
          'Pizza medium dengan berbagai pilihan topping favorit. Termasuk minuman.',
        terms: ['Dine-in saja'],
        validUntil: '15 September 2025',
        location: 'dbotanica Bandung',
        tags: ['Pizza', 'Italian', 'Sharing', 'Drinks'],
        gallery: [
          '/images/promo/pizza-medium-deal.jpg',
          '/images/promo/burger-combo-flash.jpg',
          '/images/promo/brown-sugar-coffee.jpg',
        ],
      },
      4: {
        id: 4,
        title: 'Bubble Tea House - Minuman Segar',
        subtitle: 'Bubble tea dengan berbagai rasa',
        image: '/images/promo/bubble-tea-discount.jpg',
        merchant: {
          name: 'Bubble Tea House',
          logo: '/images/merchants/bubble-tea-house-logo.png',
          rating: 4.6,
          address: 'Jl. Braga No. 89, Bandung',
          phone: '+62 22 9876543',
        },
        discount: '15%',
        originalPrice: 25000,
        discountedPrice: 21250,
        category: 'Beverages',
        description:
          'Bubble tea premium berbagai rasa: original, taro, matcha, brown sugar.',
        terms: ['Semua varian'],
        validUntil: '20 September 2025',
        location: 'dbotanica Bandung',
        tags: ['Bubble Tea', 'Drinks', 'Sweet', 'Refreshing'],
        gallery: [
          '/images/promo/bubble-tea-discount.jpg',
          '/images/promo/brown-sugar-coffee.jpg',
          '/images/promo/chicken-package.jpg',
        ],
      },
    };
    return allPromos[parseInt(id)] || allPromos[1];
  };

  const normalizeToDetailShape = (src) => {
    if (!src) return null;
    return {
      id: src.id,
      title: src.title,
      merchant: src.merchant?.name || 'Merchant',
      image: src.image,
      distance: src.distance || '3 KM',
      location: src.merchant?.address || src.location || '',
      coordinates: src.coordinates || '',
      originalPrice: src.originalPrice ?? null,
      discountPrice: src.discountedPrice ?? null,
      discount: src.discount ?? null,
      schedule: {
        day: 'Everyday',
        details: src.validUntil ? `Berlaku hingga ${src.validUntil}` : 'Berlaku',
        time: '10:00 - 22:00',
        timeDetails: 'Jam Berlaku Promo',
      },
      status: {
        type: 'Offline',
        description: 'Tipe Promo: 🌐 Online / 📍 Offline',
      },
      description: src.description || '',
      seller: {
        name: src.merchant?.name || 'Admin',
        phone: src.merchant?.phone || '',
      },
      terms: 'TERM & CONDITIONS APPLY',
    };
  };

  // Fallback legacy jika tidak ada communityId
  useEffect(() => {
    if (!effectivePromoId) return;
    if (typeof communityId !== 'undefined' && communityId !== null) return;
    const legacy = getLegacyPromoData(effectivePromoId);
    setPromoData(normalizeToDetailShape(legacy));
    setLoading(false);
  }, [effectivePromoId, communityId]);

  // --- Fetch detail (stabil, anti double-run) ---
  const hasFetched = useRef(false);

  // izinkan fetch ulang kalau ID komunitas/Promo berubah
  useEffect(() => {
    hasFetched.current = false;
  }, [effectivePromoId, communityId]);

  const fetchPromoDetails = useCallback(async () => {
    if (!router.isReady || !effectivePromoId || !communityId) return null;
    if (String(effectivePromoId).toLowerCase() === 'detail_promo') return null; // hard guard
    if (hasFetched.current) return null;
    hasFetched.current = true;

    try {
      setLoading(true);
      let response = await get({
        path: `communities/${communityId}/promos/${effectivePromoId}`,
      });

      if (!(response?.status === 200 && response?.data?.data)) {
        response = await get({ path: `promos/${effectivePromoId}/public` });
      }

      if (response?.status === 200 && response?.data?.data) {
        const data = response.data.data;
        const transformedData = {
          id: data.id,
          title: data.title,
          merchant: data.owner_name || 'Merchant',
          image: data.image_url || data.image || '/default-avatar.png',
          distance: data.promo_distance ? `${data.promo_distance} KM` : '3 KM',
          location: data.location || '',
          coordinates: '',
          originalPrice: data.original_price ?? null,
          discountPrice: data.discount_price ?? null,
          discount: data.discount_percentage ? `${data.discount_percentage}%` : null,
          schedule: {
            day: data.always_available ? 'Setiap Hari' : 'Weekday',
            details: data.end_date ? `Berlaku hingga ${new Date(data.end_date).toLocaleDateString()}` : 'Berlaku',
            time: '10:00 - 22:00',
            timeDetails: 'Jam Berlaku Promo',
          },
          status: {
            type: data.promo_type === 'online' ? 'Online' : 'Offline',
            description: `Tipe Promo: ${data.promo_type === 'online' ? '🌐 Online' : '📍 Offline'}`,
          },
          description: data.description || '',
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
  }, [router.isReady, effectivePromoId, communityId]);

  // Panggil fetch ketika bukan QR autoRegister
  useEffect(() => {
    if (!router.isReady) return;
    if (!effectivePromoId || !communityId) return;
    if (autoRegister) return;
    fetchPromoDetails();
    // penting: JANGAN masukkan fetchPromoDetails ke deps agar tidak berubah referensi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, effectivePromoId, communityId, autoRegister]);

  // --- Auto register setelah QR ---
  const handleAutoRegister = useCallback(
    async (token) => {
      try {
        // Reset hasTriedAuth setelah mendapat token valid
        setHasTriedAuth(false);
        
        const pd = await fetchPromoDetails();
        if (!pd) return;

        // Cek duplikat lokal
        const existingVouchers = safeParse(localStorage.getItem('huehuy_vouchers'), []);
        const alreadyClaimed = existingVouchers.some(
          (v) => String(v.ad?.id) === String(pd.id) || String(v.id) === String(pd.id)
        );

        if (!alreadyClaimed) {
          try {
            const response = await post({
              path: `admin/promos/${pd.id}/items`,
              headers: { Authorization: `Bearer ${token}` },
              body: { promo_id: pd.id, source: 'qr_scan' },
            });

            if (response?.status === 200) {
              const claimedVouchers = safeParse(localStorage.getItem('huehuy_vouchers'), []);
              const newPromoItem = {
                id: response.data.data.id,
                promo_id: pd.id,
                code: response.data.data.code,
                claimed_at: new Date().toISOString(),
                expired_at: pd.expires_at,
                ad: {
                  id: pd.id,
                  title: pd.title,
                  picture_source: pd.image,
                  status: 'active',
                  cube: {
                    code: `community-${communityId}`,
                    user: { name: pd.seller?.name || 'Admin', phone: pd.seller?.phone || '' },
                    corporate: null,
                    tags: [{ address: pd.location, link: null, map_lat: null, map_lng: null }],
                  },
                },
              };
              claimedVouchers.push(newPromoItem);
              localStorage.setItem('huehuy_vouchers', JSON.stringify(claimedVouchers));
              setIsAlreadyClaimed(true);
              setShowSuccessModal(true);
            } else {
              const msg = (response?.data?.message || response?.message || '').toLowerCase();
              if (msg.includes('habis') || msg.includes('stok') || msg.includes('stock')) {
                setErrorMessage('Maaf, stok promo sudah habis direbut.');
                setShowErrorModal(true);
              } else if (msg.includes('sudah') || msg.includes('already') || msg.includes('claimed')) {
                setIsAlreadyClaimed(true);
                setErrorMessage('Promo ini sudah pernah direbut pada akun lain.');
                setShowErrorModal(true);
              }
            }
          } catch (error) {
            console.warn('Auto claim failed:', error);
          }
        }
      } catch (error) {
        console.warn('Auto register failed:', error);
      }
    },
    [fetchPromoDetails, communityId]
  );

  // --- Cek status verifikasi user ---
  const checkUserVerificationStatus = useCallback(
    async (token) => {
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
        const next =
          typeof window !== 'undefined'
            ? window.location.href
            : `/app/komunitas/promo/${promoId}?communityId=${communityId}`;
        // Add delay to prevent immediate redirect loops
        setTimeout(() => {
          window.location.href = `/buat-akun?next=${encodeURIComponent(next)}`;
        }, 100);
      }
    },
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

  // State untuk mencegah multiple redirects
  const [hasTriedAuth, setHasTriedAuth] = useState(false);
  
  // Extract autoRegister state using useMemo to prevent unnecessary re-renders
  const autoRegister = useMemo(() => {
    return router.query.autoRegister || router.query.source;
  }, [router.query.autoRegister, router.query.source]);

  // --- QR entry flow ---
  useEffect(() => {
    if (!router.isReady) return;
    if (hasTriedAuth) return; // Prevent multiple auth attempts
    if (!autoRegister) return;

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
  }, [router.isReady, autoRegister, promoId, communityId, checkUserVerificationStatus, hasTriedAuth]);

  // --- Back handler ---
  const handleBack = () => {
    const { from } = router.query;

    if (autoRegister) {
      router.push('/app');
    } else if (from === 'saku') {
      router.push('/app/saku');
    } else if (communityId === 'promo-entry') {
      router.push('/app');
    } else if (communityId) {
      router.push(`/app/komunitas/dashboard/${communityId}`);
    } else {
      router.push('/app');
    }
  };

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

  const submitReport = (reason) => {
    const reports = safeParse(localStorage.getItem('promoReports'), []);
    reports.push({
      promoId: promoData.id,
      reason,
      reportedAt: new Date().toISOString(),
      status: 'pending',
    });
    localStorage.setItem('promoReports', JSON.stringify(reports));
    setShowReportModal(false);
    setTimeout(() => {
      setErrorMessage('Laporan Anda telah dikirim. Terima kasih atas perhatiannya!');
      setShowErrorModal(true);
    }, 300);
  };

  // --- Claim promo manual ---
  const handleClaimPromo = async () => {
    if (!promoData || isClaimedLoading || isAlreadyClaimed) return;

    setIsClaimedLoading(true);
    try {
      const existingVouchers = safeParse(localStorage.getItem('huehuy_vouchers'), []);
      const isDuplicate = existingVouchers.some(
        (v) => String(v.ad?.id) === String(promoData.id) || String(v.id) === String(promoData.id)
      );

      if (isDuplicate) {
        setErrorMessage('Promo ini sudah pernah Anda rebut sebelumnya!');
        setShowErrorModal(true);
        return;
      }

      const encryptedToken = Cookies.get(token_cookie_name || 'huehuy_token');
      const token = encryptedToken ? (() => { try { return Decrypt(encryptedToken); } catch { return ''; } })() : '';

      const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const apiUrl = rawApi.replace(/\/+$/, '');
      if (!apiUrl) {
        console.warn('NEXT_PUBLIC_API_URL tidak ter-set.');
      }

      const endpoints = apiUrl
        ? [
            `${apiUrl}/promos/${promoData.id}/items`,
            `${apiUrl}/promo-items`,
            `${apiUrl}/admin/promos/${promoData.id}/items`,
            `${apiUrl}/admin/promo-items`,
          ]
        : [];

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        promo_id: promoData.id,
        status: 'reserved',
        expires_at: promoData.expires_at || null,
      };

      let savedItem = null;
      let lastError = '';

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
          const txt = await res.text().catch(() => '');
          let json = {};
          try {
            json = txt ? JSON.parse(txt) : {};
          } catch {
            json = { raw: txt };
          }

          if (res.ok) {
            savedItem = json?.data ?? json;
            break;
          }

          if (res.status === 401) {
            lastError = 'Sesi berakhir. Silakan login ulang.';
            break;
          }
          if (res.status === 422 && json?.errors) {
            lastError = Object.values(json.errors).flat().join(', ');
            break;
          }
          lastError = json?.message || json?.error || `HTTP ${res.status}`;
        } catch (e) {
          lastError = e?.message || 'Network error';
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
        // fallback: lanjut simpan lokal walau server gagal (opsional)
      }

      const enriched = {
        ...savedItem,
        code: savedItem?.code || savedItem?.voucher_item?.code,
        claimed_at: new Date().toISOString(),
        validation_at: null,
        voucher_item: savedItem?.voucher_item || null,
        ad: {
          id: promoData.id,
          title: promoData.title,
          picture_source: promoData.image,
          status: 'active',
          cube: {
            code: `community-${communityId || 'unknown'}`,
            user: {
              name: promoData.seller?.name || 'Admin',
              phone: promoData.seller?.phone || '',
            },
            corporate: null,
            tags: [
              {
                address: promoData.location,
                link: null,
                map_lat: null,
                map_lng: null,
              },
            ],
          },
        },
      };

      existingVouchers.push(enriched);
      localStorage.setItem('huehuy_vouchers', JSON.stringify(existingVouchers));
      setShowSuccessModal(true);
    } catch (e) {
      setErrorMessage(e?.message || 'Gagal merebut promo. Silakan coba lagi.');
      setShowErrorModal(true);
    } finally {
      setIsClaimedLoading(false);
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
      <div className="bg-primary w-full h-[60px] px-4 relative overflow-hidden lg:rounded-t-2xl">
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
          {/* Hero */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] shadow-lg overflow-hidden border border-slate-100">
              <div className="relative h-80 bg-slate-50 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src={imgSrc}
                    alt={promoData.title}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg=="
                    onError={() => setImgSrc('/default-avatar.png')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="mb-4">
            <div className="bg-primary rounded-[20px] p-4 shadow-lg">
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

              {/* Harga ringkas */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-[12px] mb-3">
                <div className="text-sm text-slate-600">Harga Promo</div>
                <div className="text-right">
                  {promoData.discountPrice != null && (
                    <div className="text-lg font-bold text-primary">Rp {Number(promoData.discountPrice).toLocaleString()}</div>
                  )}
                  {promoData.originalPrice != null && (
                    <div className="text-xs text-slate-500 line-through">
                      Rp {Number(promoData.originalPrice).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-left">
                <button className="bg-primary text-white px-6 py-2 rounded-[12px] text-sm font-semibold hover:bg-opacity-90 transition-all">
                  Selengkapnya
                </button>
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Lokasi Promo / Iklan</h4>
              <p className="text-slate-600 text-xs leading-relaxed mb-3">{promoData.location}</p>
              <button className="w-full bg-primary text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors text-sm font-semibold flex items-center justify-center">
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
                <p className="text-xs text-slate-500">No Hp/WA: {promoData.seller?.phone}</p>
                <button className="w-full bg-primary text-white p-3 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center">
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
            disabled={isClaimedLoading || isAlreadyClaimed}
            className={`claim-button w-full py-4 lg:py-3.5 rounded-[15px] lg:rounded-xl font-bold text-lg lg:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
              isAlreadyClaimed
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : isClaimedLoading
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-green-700 text-white hover:bg-green-800 lg:hover:bg-green-600 focus:ring-4 focus:ring-green-300 lg:focus:ring-green-200'
            }`}
          >
            {isAlreadyClaimed ? (
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Selamat!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Promo <span className="font-semibold text-primary">{promoData?.title}</span> berhasil direbut dan masuk ke Saku
              Promo Anda!
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-primary text-white py-3 rounded-[12px] font-semibold hover:bg-opacity-90 transition-all"
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
                className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-green-50 hover:border-green-300 transition-all"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
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
