/* eslint-disable no-console */
import {
    faArrowLeft,
    faExclamationTriangle,
    faMapMarkerAlt,
    faPhone,
    faShare,
    faWifi,
    faWifiSlash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageCarousel } from '../../../components/base.components';
import { get } from '../../../helpers/api.helpers';

// Halaman detail Iklan (tanpa klaim promo, tanpa jam berlaku, tanpa jarak)
export default function AdDetailUnified() {
  const router = useRouter();
  const { adId } = router.query;

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

  // Simpan data iklan
  const [adData, setAdData] = useState(null);
  const [loading, setLoading] = useState(true);

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

        // Transform data untuk iklan (bukan promo/voucher)
        const adData = {
          id: adRaw?.id || null,
          title: adRaw?.title || cube?.name || 'Iklan Tidak Tersedia',
          description: adRaw?.description || cube?.description || '',
          merchant: cube?.name || '',
          images: imagesArr,
          image: imagesArr[0] || '/default-avatar.png',
          location: loc.address,
          lat: loc.lat,
          lng: loc.lng,
          coordinates: loc.coordinates,
          channel: adRaw?.channel || 'offline',
          status: adRaw?.status || 'active',
          seller: {
            name: cube?.user?.name || cube?.corporate?.name || '',
            phone: cube?.user?.phone || cube?.corporate?.phone || '',
          },
          expires_at: adRaw?.expires_at || null,
          end_date: adRaw?.end_date || null,
        };

        setAdData(adData);
      } else {
        console.error('Failed to fetch iklan details');
        setAdData(null);
      }
    } catch (error) {
      console.error('Error fetching iklan details:', error);
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
      () => {},
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

  const handleShareComplete = (platform) => {
    if (!adData) return;
    const adUrl =
      typeof window !== 'undefined'
        ? window.location.href
        : '';
    const shareText = `Lihat iklan: ${adData.title} dari ${adData.merchant || adData.seller?.name || 'Merchant'}`;

    switch (platform) {
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(
            shareText + ' ' + adUrl
          )}`,
          '_blank'
        );
        break;
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
            <div className="bg-primary rounded-[20px] p-4 shadow-lg">
              <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={
                        adData.channel === 'online'
                          ? faWifi
                          : faWifiSlash
                      }
                      className="mr-2 text-white text-sm"
                    />
                    <span className="text-sm font-semibold text-white">
                      {adData.channel === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <span className="text-xs text-white opacity-70">
                    Tipe Iklan: {adData.channel === 'online' ? '🌐 Online' : '📍 Offline'}
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

          {/* Lokasi */}
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
                className="w-full bg-primary text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors text-sm font-semibold flex items-center justify-center"
              >
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  className="mr-2 text-sm"
                />
                Rute
              </button>
            </div>
          </div>

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
                  {adData.seller?.phone || '-'}
                </p>
                <button
                  className="w-full bg-primary text-white p-3 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center"
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
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShareComplete('whatsapp')}
                className="flex items-center justify-center p-4 border border-slate-200 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <span className="text-sm text-slate-700">
                  💬 WhatsApp
                </span>
              </button>
              <button
                onClick={() => handleShareComplete('telegram')}
                className="flex items-center justify-center p-4 border border-slate-200 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <span className="text-sm text-slate-700">
                  ✈️ Telegram
                </span>
              </button>
              <button
                onClick={() => handleShareComplete('facebook')}
                className="flex items-center justify-center p-4 border border-slate-200 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <span className="text-sm text-slate-700">
                  📘 Facebook
                </span>
              </button>
              <button
                onClick={() => handleShareComplete('twitter')}
                className="flex items-center justify-center p-4 border border-slate-200 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <span className="text-sm text-slate-700">
                  🐦 Twitter
                </span>
              </button>
              <button
                id="copy-btn"
                onClick={() => handleShareComplete('copy')}
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
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {[
                'Konten tidak pantas',
                'Spam atau penipuan',
                'Informasi palsu',
                'Melanggar hak cipta',
                'Lainnya',
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => submitReport(reason)}
                  className="w-full text-left p-3 border border-slate-200 rounded-[12px] hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <span className="text-sm text-slate-700">
                    {reason}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-4 p-6">
            <div className="text-center">
              <div className="text-2xl mb-3">ℹ️</div>
              <p className="text-slate-700 mb-4">
                {infoMessage}
              </p>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full bg-primary text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}