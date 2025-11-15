/* eslint-disable no-console */
/*
 * ROUTING ISSUE: This file should be renamed to [adId].jsx to properly handle dynamic routing.
 * Current file: /pages/app/iklan/iklan.jsx -> Route: /app/iklan/iklan
 * Correct file: /pages/app/iklan/[adId].jsx -> Route: /app/iklan/{adId}
 * 
 * The component expects adId from router.query, which requires dynamic routing.
 */
import {
  faArrowLeft,
  faExclamationTriangle,
  faExternalLinkAlt,
  faMapMarkerAlt,
  faPhone,
  faShare,
  faWifi,
  faWifiSlash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageCarousel } from '../../../components/base.components';
import { token_cookie_name } from '../../../helpers';
import { get } from '../../../helpers/api.helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';

// Halaman detail Iklan (tanpa klaim promo, tanpa jam berlaku, tanpa jarak)
export default function AdDetailUnified({ initialAd = null, currentUrl = '' }) {
  const router = useRouter();
  const { adId, communityId } = router.query;

  // =========================================================
  // util kecil, sebagian diambil dari kode promo kamu
  // =========================================================

  const MONTH_ID = useMemo(
    () => [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ],
    []
  );

  const fmtDateID = useCallback(
    (raw) => {
      if (!raw) return '';
      let d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        const m = String(raw).match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
        if (m) {
          d = new Date(
            parseInt(m[3], 10),
            parseInt(m[2], 10) - 1,
            parseInt(m[1], 10)
          );
        }
      }
      if (Number.isNaN(d.getTime())) return String(raw);
      return `${d.getDate()} ${MONTH_ID[d.getMonth()]} ${d.getFullYear()}`;
    },
    [MONTH_ID]
  );

  // Build URL gambar seperti di promo code kamu
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const baseUrl = (apiUrl || '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

  const buildImageUrl = useCallback(
    (raw) => {
      const isAbs = (u) =>
        typeof u === 'string' && /^https?:\/\//i.test(u);
      const fallback = '/default-avatar.png';
      if (typeof raw !== 'string') return fallback;
      let url = raw.trim();
      if (!url) return fallback;
      if (/^\/?default-avatar\.png$/i.test(url)) return fallback;
      if (isAbs(url)) return url;
      let path = url.replace(/^\/+/, '');
      path = path.replace(/^api\/storage\//i, 'storage/');
      if (
        /^(ads|promos|uploads|images|files|banners)\//i.test(path)
      ) {
        path = `storage/${path}`;
      }
      return `${baseUrl}/${path}`.replace(
        /([^:]\/)\/+/g,
        '$1'
      );
    },
    [baseUrl]
  );

  // Simpan data iklan - gunakan initialAd dari SSR sebagai state awal
  const [adData, setAdData] = useState(initialAd);
  const [loading, setLoading] = useState(!initialAd); // Loading false jika sudah ada initialAd

  // State untuk community data (background colors)
  const [communityData, setCommunityData] = useState(null);

  // Simpan lokasi user buat tombol "Rute"
  const userPosRef = useRef(null);

  // Kumpulin image array seperti di promo
  const buildImagesArray = useCallback(
    (obj) => {
      if (!obj) return ['/default-avatar.png'];

      const imgs = [];

      if (Array.isArray(obj.images) && obj.images.length > 0) {
        obj.images.forEach((u) => {
          if (u) imgs.push(buildImageUrl(u));
        });
      }

      // fallback dari field legacy
      [
        obj.picture_source,
        obj.image_1,
        obj.image_2,
        obj.image_3,
        obj.image,
      ].forEach((raw) => {
        if (raw) imgs.push(buildImageUrl(raw));
      });

      if (imgs.length === 0) {
        imgs.push('/default-avatar.png');
      }

      return imgs;
    },
    [buildImageUrl]
  );

  // Function untuk mendapatkan gradient style berdasarkan community colors
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

  // =========================================================
  // Helper untuk ambil info lokasi dari cube
  // =========================================================
  const getCubeLocationInfo = useCallback((cube) => {
    if (!cube) return { address: '', coordinates: '', lat: null, lng: null };

    // lokasi utama ambil dari tag pertama yang punya koordinat, fallback cube
    const tags = Array.isArray(cube?.tags) ? cube.tags : [];
    const primaryTag = tags.find(
      (t) => t?.map_lat != null && t?.map_lng != null
    ) || tags[0];

    const lat = primaryTag?.map_lat ?? cube?.map_lat ?? null;
    const lng = primaryTag?.map_lng ?? cube?.map_lng ?? null;

    const coordinates = lat != null && lng != null
      ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
      : '';

    const address = primaryTag?.address || cube?.address || '';

    return {
      address,
      coordinates,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
    };
  }, []);

  // =========================================================
  // Ambil detail iklan dari public API
  // =========================================================
  const fetchIklanDetails = useCallback(async () => {
    if (!router.isReady) return;
    if (!adId) return;

    try {
      setLoading(true);

      // Ambil data iklan dari public endpoint
      const response = await get({ path: `ads/${adId}` });

      if (response?.status === 200 && (response?.data?.data || response?.data)) {
        const adRaw = response.data?.data || response.data;
        const cube = adRaw?.cube || null;

        // lokasi utama ambil dari cube dan tags
        const loc = getCubeLocationInfo(cube);

        // kumpulkan semua gambar dari ad dan cube
        const imagesArr = [];
        if (adRaw?.picture_source) imagesArr.push(buildImageUrl(adRaw.picture_source));
        if (adRaw?.image_1) imagesArr.push(buildImageUrl(adRaw.image_1));
        if (adRaw?.image_2) imagesArr.push(buildImageUrl(adRaw.image_2));
        if (adRaw?.image_3) imagesArr.push(buildImageUrl(adRaw.image_3));
        if (adRaw?.image) imagesArr.push(buildImageUrl(adRaw.image));
        if (imagesArr.length === 0 && cube?.picture_source) {
          imagesArr.push(buildImageUrl(cube.picture_source));
        }
        if (imagesArr.length === 0) {
          imagesArr.push('/default-avatar.png');
        }

        const transformed = {
          id: adRaw?.id ?? cube?.id,
          title: adRaw?.title || 'Iklan',
          description: adRaw?.description || '',
          merchant: cube?.user?.name || cube?.corporate?.name || 'Pemilik Iklan',
          images: imagesArr,
          image: imagesArr[0],

          // lokasi buat ditunjukin di UI
          location: loc.address || loc.coordinates || cube?.address || '',
          lat: loc.lat ?? cube?.map_lat ?? null,
          lng: loc.lng ?? cube?.map_lng ?? null,
          coordinates: loc.coordinates,

          // status online/offline untuk kasih tau orang ini layanan offline apa online
          channel: adRaw?.promo_type === 'online' ? 'Online' : 'Offline',
          status: {
            type: adRaw?.promo_type === 'online' ? 'Online' : 'Offline',
            description: `Tipe Iklan: ${adRaw?.promo_type === 'online' ? '🌐 Online' : '📍 Offline'
              }`,
          },

          // kontak
          seller: {
            name: cube?.user?.name || cube?.corporate?.name || 'Pemilik',
            phone: cube?.user?.phone || cube?.corporate?.phone || '',
          },

          // tanggal berakhir (opsional)
          expires_at: adRaw?.finish_validate || adRaw?.end_date || adRaw?.expires_at || null,
          end_date: adRaw?.finish_validate || adRaw?.end_date || null,

          // promo type dan online store link
          promo_type: adRaw?.promo_type || 'offline',
          online_store_link: adRaw?.online_store_link ||
            cube?.link_information ||
            cube?.website ||
            cube?.online_link ||
            cube?.store_link,
        };
        setAdData(transformed); // masih pakai nama state adData
        return transformed;
      }

      setAdData(null);
    } catch (err) {
      console.error('Error fetching iklan details:', err);
      setAdData(null);
    } finally {
      setLoading(false);
    }
  }, [router.isReady, adId, getCubeLocationInfo, buildImageUrl]);

  // Fetch di mount
  useEffect(() => {
    if (!router.isReady) return;
    fetchIklanDetails();
  }, [router.isReady, fetchIklanDetails]);

  // Fetch community data berdasarkan communityId
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!communityId || !router.isReady) return;

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
  }, [communityId, router.isReady]);

  // geolocation ringan buat rute (optional)
  useEffect(() => {
    if (!adData) return;
    if (adData.lat == null || adData.lng == null) return;
    if (typeof window === 'undefined') return;
    if (!navigator?.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (
          latitude == null ||
          longitude == null
        )
          return;
        userPosRef.current = {
          lat: Number(latitude),
          lng: Number(longitude),
        };
      },
      () => { },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [adData]);

  // Back handler simple
  const handleBack = () => {
    try {
      const { from } = router.query;
      if (from === 'home') {
        router.push('/app');
      } else {
        router.back();
      }
    } catch {
      router.push('/app');
    }
  };

  // Rute Maps (tetep pake window.location.href biar aman popup blocker)
  const openRoute = useCallback(() => {
    if (!adData) return;

    let destination = '';
    if (adData.lat != null && adData.lng != null) {
      destination = `${adData.lat},${adData.lng}`;
    } else if (adData.location) {
      destination = encodeURIComponent(adData.location);
    } else if (adData.coordinates) {
      destination = encodeURIComponent(adData.coordinates);
    }
    if (!destination) return;

    const qs = new URLSearchParams();
    qs.set('destination', destination);
    if (
      userPosRef.current?.lat != null &&
      userPosRef.current?.lng != null
    ) {
      qs.set(
        'origin',
        `${userPosRef.current.lat},${userPosRef.current.lng}`
      );
    }

    const url = `https://www.google.com/maps/dir/?api=1&${qs.toString()}`;
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }, [adData]);

  // share / report modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const handleShare = () => setShowShareModal(true);
  const handleReport = () => setShowReportModal(true);

  const handleShareComplete = async (platform) => {
    if (!adData) return;

    // Gunakan URL production yang benar
    const adUrl = `https://app.huehuy.com/app/iklan/${adData.id}`;
    const shareText = `Lihat iklan: ${adData.title} dari ${adData.merchant || adData.seller?.name || 'Merchant'}`;
    const fullShareText = `${shareText}\n\n🔗 Lihat detail: ${adUrl}`;

    // KHUSUS WHATSAPP: Langsung buka WhatsApp tanpa dialog
    if (platform === 'whatsapp') {
      try {
        // Cek apakah di mobile (Android/iOS)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
          // Di mobile: Gunakan WhatsApp intent untuk langsung buka app
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(fullShareText)}`;
          window.location.href = whatsappUrl;

          // Fallback jika WhatsApp app tidak terinstall
          setTimeout(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank');
          }, 1000);
        } else {
          // Di desktop: Buka WhatsApp Web
          window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank');
        }

        setShowShareModal(false);
        return;
      } catch (error) {
        console.error('WhatsApp share failed:', error);
        // Fallback ke URL biasa
        window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank');
        setShowShareModal(false);
        return;
      }
    }

    // Fungsi untuk mendapatkan gambar sebagai blob dengan multiple fallback methods
    const getImageBlob = async () => {
      try {
        // Gunakan gambar pertama dari adData.images
        const images = buildImagesArray(adData);
        const imageUrl = images && images.length > 0 ? images[0] : null;
        if (!imageUrl || imageUrl === '/default-avatar.png') return null;

        // Skip jika gambar adalah data URL (sudah dalam format blob)
        if (imageUrl.startsWith('data:')) {
          const response = await fetch(imageUrl);
          return await response.blob();
        }

        // Method 1: Try fetch with mode: 'no-cors' first
        try {
          const response = await fetch(imageUrl, {
            mode: 'cors',
            cache: 'no-cache'
          });
          if (response.ok) {
            const blob = await response.blob();
            if (blob.size > 0) return blob;
          }
        } catch (fetchError) {
          console.log('Direct fetch failed, trying canvas method...', fetchError);
        }

        // Method 2: Use canvas as fallback for CORS issues
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;

              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);

              canvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/jpeg', 0.9);
            } catch (canvasError) {
              console.error('Canvas method failed:', canvasError);
              resolve(null);
            }
          };

          img.onerror = () => {
            console.error('Image load failed');
            resolve(null);
          };

          // Timeout after 5 seconds
          setTimeout(() => resolve(null), 5000);

          img.src = imageUrl;
        });
      } catch (error) {
        console.error('Error fetching image:', error);
        return null;
      }
    };

    // Untuk platform lain: Gunakan Web Share API
    if (navigator.share && platform !== 'copy') {
      try {
        const imageBlob = await getImageBlob();
        const shareData = {
          title: adData.title,
          text: fullShareText,
          url: adUrl,
        };

        // Tambahkan gambar jika berhasil di-fetch
        if (imageBlob && imageBlob.size > 0) {
          const file = new File([imageBlob], 'ad-image.jpg', { type: 'image/jpeg' });
          shareData.files = [file];
        }

        // Cek apakah browser bisa share dengan data ini
        if (navigator.canShare && !navigator.canShare(shareData)) {
          // Kalau tidak bisa share dengan gambar, coba tanpa gambar
          delete shareData.files;
        }

        await navigator.share(shareData);
        setShowShareModal(false);
        return;
      } catch (error) {
        // Jika Web Share API gagal atau dibatalkan, lanjut ke fallback
        console.log('Web Share API not available or cancelled, using fallback:', error);
      }
    }

    // Fallback ke share URL biasa (tanpa gambar)
    switch (platform) {
      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            adUrl
          )}&text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            adUrl
          )}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareText
          )}&url=${encodeURIComponent(adUrl)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(adUrl);
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
    // di versi iklan ini kita cuma tampilkan notifikasi info
    setShowReportModal(false);
    setInfoMessage(
      `Terima kasih. Laporan "${reason}" sudah dicatat.`
    );
    setShowInfoModal(true);
  };

  // =========================================================
  // RENDER
  // =========================================================

  if (loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">
            Memuat detail iklan...
          </p>
        </div>
      </div>
    );
  }

  if (!adData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <p className="text-slate-600">
            Iklan tidak ditemukan
          </p>
        </div>
      </div>
    );
  }

  // Prepare Open Graph data for social sharing (gunakan data dari SSR)
  const pageTitle = adData?.title || 'Iklan Menarik';
  const pageDescription = adData?.description || (adData ? `Lihat iklan: ${adData.title} dari ${adData.merchant || adData.seller?.name || 'Merchant'}` : 'Lihat iklan menarik di HueHuy!');
  const adImages = buildImagesArray(adData);
  const pageImage = adImages && adImages.length > 0 ? adImages[0] : '/default-avatar.png';

  // Gunakan currentUrl dari SSR (sudah absolute), fallback ke window.location jika tidak ada
  const pageUrl = currentUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // Pastikan image URL absolute (gunakan https://app.huehuy.com)
  const getAbsoluteImageUrl = (imgUrl) => {
    if (!imgUrl) return 'https://app.huehuy.com/default-avatar.png';
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
    if (imgUrl.startsWith('/')) {
      // Gunakan production URL, bukan localhost
      return `https://app.huehuy.com${imgUrl}`;
    }
    return imgUrl;
  };

  const absoluteImageUrl = getAbsoluteImageUrl(pageImage);

  return (
    <>
      {/* Meta Tags untuk Open Graph (WhatsApp Preview) */}
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={absoluteImageUrl} />
        <meta property="og:image:secure_url" content={absoluteImageUrl} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={pageTitle} />
        <meta property="og:site_name" content="HueHuy" />
        <meta property="og:locale" content="id_ID" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={absoluteImageUrl} />
        <meta name="twitter:image:alt" content={pageTitle} />
      </Head>

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
              <FontAwesomeIcon
                icon={faArrowLeft}
                className="text-white text-sm"
              />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-white font-bold text-sm">
                Iklan
              </h1>
            </div>
            <div className="flex space-x-1.5">
              <button
                onClick={handleShare}
                className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all"
              >
                <FontAwesomeIcon
                  icon={faShare}
                  className="text-white text-sm"
                />
              </button>
              <button
                onClick={handleReport}
                className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all"
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-white text-sm"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white min-h-screen w-full px-4 lg:px-6 pt-4 lg:pt-6 pb-24 lg:pb-6">
          <div className="lg:mx-auto lg:max-w-md">
            {/* Hero Image Carousel */}
            <div className="mb-4">
              <ImageCarousel
                images={adData.images}
                title={adData.title || 'Iklan'}
                className="w-full"
              />
            </div>

            {/* Info card status type (online/offline) SISA SATU KARTU AJA */}
            <div className="mb-4">
              <div
                className="rounded-[20px] p-4 shadow-lg"
                style={getCommunityGradient(communityData?.bg_color_1, communityData?.bg_color_2)}
              >
                <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FontAwesomeIcon
                        icon={
                          adData.status.type === 'Online'
                            ? faWifi
                            : faWifiSlash
                        }
                        className="mr-2 text-white text-sm"
                      />
                      <span className="text-sm font-semibold text-white">
                        {adData.status.type}
                      </span>
                    </div>
                    <span className="text-xs text-white opacity-70">
                      {adData.status.description}
                    </span>
                  </div>
                </div>

                {/* optional info masa berlaku */}
                {adData.end_date && (
                  <div className="mt-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                    <div className="text-left">
                      <div className="text-xs text-white opacity-80">
                        Berlaku hingga
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {fmtDateID(adData.end_date)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Title + desc */}
            <div className="mb-4">
              <div className="bg-white rounded-[20px] p-5 shadow-lg border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 leading-tight mb-4 text-left">
                  {adData.title}
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm text-left mb-4 whitespace-pre-line">
                  {adData.description}
                </p>
              </div>
            </div>

            {/* Lokasi - Only show for offline ads */}
            {adData?.promo_type !== 'online' && (
              <div className="mb-4">
                <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                    Lokasi Iklan
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed mb-3">
                    {adData.location || adData.coordinates || '-'}
                  </p>
                  <button
                    onClick={openRoute}
                    className="w-full text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors text-sm font-semibold flex items-center justify-center"
                    style={{ backgroundColor: getCommunityPrimaryColor() }}
                  >
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="mr-2 text-sm"
                    />
                    Rute
                  </button>
                </div>
              </div>
            )}

            {/* Tautan Toko Online - hanya saat Online dan link tersedia */}
            {adData?.promo_type === 'online' && adData?.online_store_link && (
              <div className="mb-4">
                <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                    Tautan Toko Online
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed mb-3">
                    {adData.online_store_link}
                  </p>
                  <button
                    onClick={() => {
                      const storeUrl = adData.online_store_link;
                      if (storeUrl) {
                        let url = storeUrl;
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                          url = 'https://' + url;
                        }
                        window.open(url, '_blank');
                      }
                    }}
                    className="w-full text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors text-sm font-semibold flex items-center justify-center"
                    style={{ backgroundColor: getCommunityPrimaryColor() }}
                  >
                    <FontAwesomeIcon
                      icon={faExternalLinkAlt}
                      className="mr-2 text-sm"
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Kontak pemilik */}
            <div className="mb-20 lg:mb-8">
              <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                  Pemilik Iklan
                </h4>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 text-xs">
                    Nama: {adData.seller?.name || '-'}
                  </p>
                  <p className="text-xs text-slate-500">
                    No Hp/WA:{' '}
                    {adData?.seller?.phone && (
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            const phone = String(adData.seller.phone).replace(/\s+/g, '');
                            let formattedPhone = phone.replace(/\D/g, '');
                            if (formattedPhone.startsWith('0')) {
                              formattedPhone = '62' + formattedPhone.substring(1);
                            } else if (!formattedPhone.startsWith('62')) {
                              formattedPhone = '62' + formattedPhone;
                            }
                            const message = encodeURIComponent(`Halo, saya tertarik dengan iklan "${adData.title || ''}". Bisa bantu info lebih lanjut?`);
                            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          className="w-full text-white p-3 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center"
                          style={{ backgroundColor: getCommunityPrimaryColor() }}
                        >
                          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="phone" className="svg-inline--fa fa-phone text-sm" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path fill="currentColor" d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </p>
                  <button
                    className="w-full text-white p-3 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center"
                    style={{ backgroundColor: getCommunityPrimaryColor() }}
                    onClick={() => {
                      if (adData?.seller?.phone) {
                        const phone = String(
                          adData.seller.phone
                        ).replace(/\s+/g, '');
                        window.location.href = `tel:${phone}`;
                      }
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="text-sm"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Modal (report feedback) */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-yellow-500 text-3xl"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Terima Kasih
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {infoMessage}
              </p>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full bg-primary text-white py-3 rounded-[12px] font-semibold hover:bg-opacity-90 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:items-center">
            <div className="bg-white rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-md p-6 lg:m-4 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Bagikan Iklan
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-slate-500 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    handleShareComplete('whatsapp')
                  }
                  className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-green-50 hover:border-green-300 transition-all"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">
                      WA
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    WhatsApp
                  </span>
                </button>
                <button
                  onClick={() =>
                    handleShareComplete('telegram')
                  }
                  className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">
                      TG
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    Telegram
                  </span>
                </button>
                <button
                  onClick={() =>
                    handleShareComplete('facebook')
                  }
                  className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">
                      FB
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    Facebook
                  </span>
                </button>
                <button
                  onClick={() =>
                    handleShareComplete('twitter')
                  }
                  className="flex flex-col items-center p-4 border border-slate-200 rounded-[12px] hover:bg-sky-50 hover:border-sky-300 transition-all"
                >
                  <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">
                      TW
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    Twitter
                  </span>
                </button>
                <button
                  id="copy-btn"
                  onClick={() =>
                    handleShareComplete('copy')
                  }
                  className="col-span-2 flex items-center justify-center p-4 border border-slate-200 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <span className="text-sm text-slate-700">
                    📋 Salin Link
                  </span>
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
                <h3 className="text-lg font-bold text-slate-900">
                  Laporkan Iklan
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-500 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() =>
                    submitReport('Iklan tidak sesuai')
                  }
                  className="w-full bg-red-100 text-red-700 py-3 rounded-[12px] font-semibold hover:bg-red-200 transition-all"
                >
                  Iklan tidak sesuai
                </button>
                <button
                  onClick={() =>
                    submitReport('Penipuan / scam')
                  }
                  className="w-full bg-yellow-100 text-yellow-700 py-3 rounded-[12px] font-semibold hover:bg-yellow-200 transition-all"
                >
                  Penipuan / scam
                </button>
                <button
                  onClick={() =>
                    submitReport('Konten tidak pantas')
                  }
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
          animation: bounce-in 0.6s
            cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @media (min-width: 1024px) {
          .desktop-container {
            box-shadow: 0 20px 25px -5px
                rgba(0, 0, 0, 0.1),
              0 10px 10px -5px
                rgba(0, 0, 0, 0.04);
          }
        }
      `}</style>
      </div>
    </>
  );
}

// Server-Side Rendering untuk Open Graph meta tags
export async function getServerSideProps(context) {
  const { req } = context;

  // Build absolute URL untuk halaman ini
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'app.huehuy.com';
  const currentUrl = `${protocol}://${host}${context.resolvedUrl}`;

  // Extract adId from query string since this is iklan.jsx (not dynamic route)
  const adId = context.query.adId || context.query.id;

  if (!adId) {
    return {
      props: {
        initialAd: null,
        currentUrl,
      },
    };
  }

  try {
    // Ambil data iklan dari API publik (tanpa auth)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.huehuy.com/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');

    // Hit endpoint publik untuk mendapatkan data iklan
    const response = await fetch(`${baseUrl}/api/ads/${adId}/public`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const json = await response.json();
      const adData = json.data || json;

      return {
        props: {
          initialAd: adData,
          currentUrl,
        },
      };
    } else {
      // Jika endpoint publik gagal, return null (halaman akan fetch client-side)
      console.warn(`Failed to fetch ad ${adId} for SSR:`, response.status);
      return {
        props: {
          initialAd: null,
          currentUrl,
        },
      };
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    // Jika terjadi error, return null (halaman akan fetch client-side)
    return {
      props: {
        initialAd: null,
        currentUrl,
      },
    };
  }
}
