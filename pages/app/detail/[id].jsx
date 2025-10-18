/* eslint-disable no-console */
/* pages/app/detail/[id].jsx - Unified detail page for all content types */
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faShare,
  faExclamationTriangle,
  faMapMarkerAlt,
  faWifi,
  faWifiSlash,
  faPhone,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useGet, post } from '../../../helpers';
import { ImageCarousel } from '../../../components/base.components';

export default function UnifiedDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [contentData, setContentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClaimedLoading, setIsClaimedLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetailExpanded, setShowDetailExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAlreadyClaimed, setIsAlreadyClaimed] = useState(false);

  // Build image URL helper
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
      return `${baseUrl}/${path}`.replace(/([^:]\/)\/+/g, '$1');
    }
    return `${baseUrl}/${path}`.replace(/([^:]\/)\/+/g, '$1');
  }, [baseUrl]);

  // Fetch content details
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCube, codeCube, dataCube] = useGet({
    path: id ? `get-cube-by-code/${id}` : '',
  }, !id);

  // Process content data
  useEffect(() => {
    if (dataCube?.data && !loadingCube) {
      const cube = dataCube.data;
      const ad = cube.ads?.[0] || {};
      
      // Build images array
      const images = [];
      if (ad.picture_source) {
        images.push(buildImageUrl(ad.picture_source));
      }
      if (ad.image_1) images.push(buildImageUrl(ad.image_1));
      if (ad.image_2) images.push(buildImageUrl(ad.image_2));
      if (ad.image_3) images.push(buildImageUrl(ad.image_3));

      // Determine content type and category
      const isInformation = cube.is_information || ad.is_information;
      let contentType = 'Promo';
      let showClaimButton = true;

      if (isInformation) {
        contentType = 'Informasi';
        showClaimButton = false;
      } else if (ad.type === 'iklan' || ad.ad_category?.name?.toLowerCase() === 'advertising') {
        contentType = 'Iklan';
        showClaimButton = false;
      } else if (ad.type === 'voucher') {
        contentType = 'Voucher';
        showClaimButton = false;
      }

      // Check if expired or not started
      const now = new Date();
      let isExpired = false;
      let isNotStarted = false;

      if (ad.finish_validate) {
        const endDate = new Date(ad.finish_validate);
        isExpired = endDate.getTime() < now.getTime();
      }

      if (ad.start_validate) {
        const startDate = new Date(ad.start_validate);
        isNotStarted = startDate.getTime() > now.getTime();
      }

      const processedData = {
        id: cube.id,
        adId: ad.id,
        title: ad.title || 'Untitled',
        description: ad.description || '',
        detail: ad.detail || '',
        images: images.length > 0 ? images : ['/default-image.png'],
        location: cube.address || 'Lokasi tidak tersedia',
        coordinates: cube.tags?.[0] ? `${cube.tags[0].map_lat}, ${cube.tags[0].map_lng}` : '',
        distance: '- km',
        contentType,
        showClaimButton,
        isExpired,
        isNotStarted,
        schedule: {
          day: 'Setiap Hari',
          details: ad.finish_validate ? `Berlaku hingga ${new Date(ad.finish_validate).toLocaleDateString('id-ID')}` : 'Berlaku',
          time: '24 Jam',
          timeDetails: 'Jam Berlaku',
        },
        status: {
          type: 'Online',
          description: 'Tersedia Online',
        },
        seller: {
          name: cube.user?.name || cube.corporate?.name || 'Tidak diketahui',
          phone: cube.user?.phone || 'Tidak tersedia',
        },
        mapLat: cube.tags?.[0]?.map_lat,
        mapLng: cube.tags?.[0]?.map_lng,
      };

      setContentData(processedData);
      setLoading(false);
    }
  }, [dataCube, loadingCube, buildImageUrl]);

  // Back handler
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/app');
    }
  };

  // Open route in Google Maps
  const openRoute = useCallback(() => {
    if (contentData?.mapLat && contentData?.mapLng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${contentData.mapLat},${contentData.mapLng}`;
      window.open(url, '_blank');
    }
  }, [contentData]);

  // Share handlers
  const handleShare = () => setShowShareModal(true);
  const handleReport = () => setShowReportModal(true);

  const handleShareComplete = (platform) => {
    const url = window.location.href;
    const text = `Check out this ${contentData?.contentType}: ${contentData?.title}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link berhasil disalin!');
        break;
    }
    setShowShareModal(false);
  };

  const submitReport = (reason) => {
    console.log('Reporting content:', contentData?.id, 'Reason:', reason);
    // Add API call to submit report here
    alert('Laporan berhasil dikirim!');
    setShowReportModal(false);
  };

  // Claim promo (only for actual promos)
  const handleClaimPromo = async () => {
    if (!contentData?.showClaimButton) return;
    
    setIsClaimedLoading(true);
    
    try {
      const response = await post({
        path: 'grabs',
        body: {
          ad_id: contentData.adId,
        },
      });

      if (response.status === 201) {
        setShowSuccessModal(true);
        setIsAlreadyClaimed(true);
      } else {
        setErrorMessage('Gagal merebut promo. Silakan coba lagi.');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
      setShowErrorModal(true);
    } finally {
      setIsClaimedLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/app/saku');
  };

  if (loading) {
    return (
      <div className="desktop-container lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen lg:min-h-0 lg:my-4 lg:rounded-2xl lg:shadow-xl lg:border lg:border-slate-200 lg:overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contentData) {
    return (
      <div className="desktop-container lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen lg:min-h-0 lg:my-4 lg:rounded-2xl lg:shadow-xl lg:border lg:border-slate-200 lg:overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Konten Tidak Ditemukan</h2>
            <p className="text-slate-600 mb-4">Konten yang Anda cari tidak dapat ditemukan.</p>
            <button
              onClick={handleBack}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all"
            >
              Kembali
            </button>
          </div>
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
            <h1 className="text-white font-bold text-sm">{contentData.contentType}</h1>
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
          {/* Images */}
          <div className="mb-4">
            <ImageCarousel
              images={contentData.images}
              title={contentData.title}
              className="w-full"
            />
          </div>

          {/* Info Cards */}
          <div className="mb-4">
            <div className="bg-primary rounded-[20px] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white mr-2 text-sm" />
                  <span className="text-sm font-semibold text-white">{contentData.distance}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white opacity-80">Jarak:</span>
                  <div className="text-xs text-white opacity-70">{contentData.coordinates || '-'}</div>
                </div>
              </div>

              <div className="mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">{contentData.schedule.day}</span>
                    <div className="text-xs text-white opacity-80">{contentData.schedule.details}</div>
                  </div>
                  <div className="text-right">
                    <div className="bg-yellow-400 text-slate-800 px-3 py-1 rounded-[8px] text-sm font-semibold">
                      {contentData.schedule.time}
                    </div>
                    <div className="text-xs text-white opacity-70 mt-1">{contentData.schedule.timeDetails}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={contentData.status.type === 'Online' ? faWifi : faWifiSlash}
                      className="mr-2 text-white text-sm"
                    />
                    <span className="text-sm font-semibold text-white">{contentData.status.type}</span>
                  </div>
                  <span className="text-xs text-white opacity-70">{contentData.status.description}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-4 text-left">{contentData.title}</h2>
              <p className="text-slate-600 leading-relaxed text-sm text-left mb-4">{contentData.description}</p>

              <div className="text-left">
                <button 
                  onClick={() => setShowDetailExpanded(!showDetailExpanded)}
                  className="bg-primary text-white px-6 py-2 rounded-[12px] text-sm font-semibold hover:bg-opacity-90 transition-all flex items-center"
                >
                  {showDetailExpanded ? 'Tutup Detail' : 'Selengkapnya'}
                  <span className={`ml-2 transition-transform duration-300 ${showDetailExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
              </div>
              
              {/* Expanded Detail */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showDetailExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
              }`}>
                <div className="border-t border-slate-200 pt-4">
                  {contentData?.detail && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-slate-900 mb-2 text-sm">Detail Lengkap:</h5>
                      <div className="bg-slate-50 p-3 rounded-[12px]">
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                          {contentData.detail}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Lokasi {contentData.contentType}</h4>
              <p className="text-slate-600 text-xs leading-relaxed mb-3">{contentData.location}</p>
              <button onClick={openRoute} className="w-full bg-primary text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors text-sm font-semibold flex items-center justify-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm" />
                Rute
              </button>
            </div>
          </div>

          {/* Seller Info */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Pemilik {contentData.contentType}</h4>
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 text-xs">Nama: {contentData.seller?.name}</p>
                <p className="text-xs text-slate-500">No Hp/WA: {contentData.seller?.phone || '-'}</p>
                <button
                  className="w-full bg-primary text-white p-3 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center"
                  onClick={() => {
                    if (contentData.seller?.phone) {
                      window.open(`https://wa.me/${contentData.seller.phone}`, '_blank');
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

      {/* Claim Button - Only show for actual promos */}
      {contentData.showClaimButton && (
        <div className="fixed bottom-0 left-0 right-0 lg:static lg:mt-6 lg:mb-4 bg-white border-t border-slate-200 lg:border-t-0 p-4 lg:p-6 z-30">
          <div className="lg:max-w-sm lg:mx-auto">
            <button
              onClick={handleClaimPromo}
              disabled={contentData.isExpired || contentData.isNotStarted || isClaimedLoading || isAlreadyClaimed}
              className={`claim-button w-full py-4 lg:py-3.5 rounded-[15px] lg:rounded-xl font-bold text-lg lg:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                contentData.isExpired || contentData.isNotStarted
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : isAlreadyClaimed
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : isClaimedLoading
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-green-700 text-white hover:bg-green-800 lg:hover:bg-green-600 focus:ring-4 focus:ring-green-300 lg:focus:ring-green-200'
              }`}
            >
              {contentData.isExpired ? (
                'Promo sudah kadaluwarsa'
              ) : contentData.isNotStarted ? (
                'Promo belum dimulai'
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
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Selamat!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Promo <span className="font-semibold text-primary">{contentData?.title}</span> berhasil direbut dan masuk ke Saku
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
              <h3 className="text-lg font-bold text-slate-900">Bagikan {contentData.contentType}</h3>
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
              <h3 className="text-lg font-bold text-slate-900">Laporkan {contentData.contentType}</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-500 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => submitReport('Konten tidak sesuai')}
                className="w-full bg-red-100 text-red-700 py-3 rounded-[12px] font-semibold hover:bg-red-200 transition-all"
              >
                Konten tidak sesuai
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