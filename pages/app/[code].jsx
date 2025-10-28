/* eslint-disable @next/next/no-img-element */
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ButtonComponent,
} from '../../components/base.components';
import ImageCarousel from '../../components/base.components/carousel/ImageCarousel.component';
import { get, post, useGet } from '../../helpers';

export function Cube({ cubeData }) {
  const router = useRouter();
  const { code } = router.query;
  const [activeIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetailExpanded, setShowDetailExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAlreadyClaimed, setIsAlreadyClaimed] = useState(false);
  const [isClaimedLoading, setIsClaimedLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: code && `get-cube-by-code/${code}`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingHuehuyAd, codeHuehuyAd, dataHuehuyAd] = useGet({
    path: `cube-huehuy-ads`,
  });

  // Helper functions untuk validasi waktu seperti di promoId.jsx
  const MONTH_ID = useMemo(() => ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'], []);

  const pad2 = (n) => String(n).padStart(2, '0');
  const toHM = useCallback((val) => {
    if (!val) return '';
    if (typeof val === 'string' && val.includes(':')) return val;
    const d = new Date(`1970-01-01T${val}Z`);
    return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  }, []);

  const fmtDateID = useCallback((raw) => {
    if (!raw) return '';
    const d = new Date(raw);
    const day = d.getDate();
    const month = MONTH_ID[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }, [MONTH_ID]);

  // Ambil data promo aktif
  const currentPromo = data?.data?.ads?.at(activeIndex);

  // Validasi waktu promo seperti di promoId.jsx
  const timeFlags = useMemo(() => {
    if (!currentPromo) {
      return {
        expiredByDate: false,
        withinDailyTime: true,
      };
    }

    const now = new Date();
    const jakartaOffset = 7 * 60 * 60 * 1000; // UTC+7 dalam ms
    const nowJakarta = new Date(now.getTime() + jakartaOffset);

    // Cek expired berdasarkan tanggal
    let expiredByDate = false;
    if (currentPromo.finish_validate) {
      const endDate = new Date(currentPromo.finish_validate);
      endDate.setHours(23, 59, 59, 999); // Set ke akhir hari
      expiredByDate = nowJakarta > endDate;
    }

    // Cek jam berlaku
    let withinDailyTime = true;
    if (currentPromo.jam_mulai && currentPromo.jam_berakhir) {
      const currentTime = `${pad2(nowJakarta.getHours())}:${pad2(nowJakarta.getMinutes())}`;
      const startTime = toHM(currentPromo.jam_mulai);
      const endTime = toHM(currentPromo.jam_berakhir);

      if (startTime && endTime) {
        withinDailyTime = currentTime >= startTime && currentTime <= endTime;
      }
    }

    return {
      expiredByDate,
      withinDailyTime,
    };
  }, [currentPromo, toHM]);

  // Status "belum mulai"
  const isNotStarted = useMemo(() => {
    if (!currentPromo?.start_validate) return false;
    const now = new Date();
    const jakartaOffset = 7 * 60 * 60 * 1000;
    const nowJakarta = new Date(now.getTime() + jakartaOffset);
    const startDate = new Date(currentPromo.start_validate);
    return nowJakarta < startDate;
  }, [currentPromo]);

  const isStartTomorrow = useMemo(() => {
    if (!currentPromo?.start_validate) return false;
    const now = new Date();
    const jakartaOffset = 7 * 60 * 60 * 1000;
    const nowJakarta = new Date(now.getTime() + jakartaOffset);
    const startDate = new Date(currentPromo.start_validate);
    const tomorrow = new Date(nowJakarta);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    return startDate >= tomorrow && startDate < dayAfterTomorrow;
  }, [currentPromo]);

  // Status dapat di-claim
  const canClaim = !timeFlags.expiredByDate && timeFlags.withinDailyTime && !isNotStarted;

  // Cek status claimed dari API
  useEffect(() => {
    if (currentPromo?.id) {
      const checkClaimedStatus = async () => {
        try {
          const response = await get({
            path: `grabs/check/${currentPromo.id}`,
          });
          if (response?.data?.is_claimed) {
            setIsAlreadyClaimed(true);
          }
        } catch (error) {
          // console.log('Error checking claimed status:', error);
        }
      };
      checkClaimedStatus();
    }
  }, [currentPromo?.id]);

  useEffect(() => {
    if (dataHuehuyAd?.data) {
      setShowHuehuyAds(true);
    }
  }, [dataHuehuyAd]);

  // Handler functions
  const handleBack = () => {
    router.back();
  };

  const handleShare = () => setShowShareModal(true);
  const handleReport = () => setShowReportModal(true);

  const handleShareComplete = (platform) => {
    const shareUrl = window.location.href;
    const shareText = `Cuma Ada Di HUEHUY! ${currentPromo?.title || 'Promo Menarik'}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        break;
    }
    setShowShareModal(false);
  };

  const submitReport = () => {
    // Implementasi pelaporan
    // console.log('Report:', reason);
    setShowReportModal(false);
  };

  const handleClaimPromo = async () => {
    if (!canClaim || isNotStarted || isClaimedLoading || isAlreadyClaimed) {
      return;
    }

    setIsClaimedLoading(true);

    try {
      const execute = await post({
        path: `grabs`,
        body: {
          ad_id: currentPromo?.id,
        },
      });

      if (execute.status == 201) {
        setShowSuccessModal(true);
        setIsAlreadyClaimed(true);
      } else {
        setErrorMessage(execute?.data?.message || 'Gagal merebut promo');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Terjadi kesalahan saat merebut promo');
      setShowErrorModal(true);
    } finally {
      setIsClaimedLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/app/saku');
  };

  return (
    <>
      <Head>
        <title>{cubeData?.data?.ads?.at(0)?.title || 'Promo HUEHUY'}</title>
        <meta
          property="og:title"
          content={cubeData?.data?.ads?.at(0)?.title || 'Cuma Ada Di Huehuy!'}
        />
        <meta
          property="og:description"
          content={
            cubeData?.data?.ads?.at(0)?.description ||
            'Temukan Promo Menarik Lainnya Hanya di HUEHUY'
          }
        />
        <meta
          property="og:image"
          content={
            cubeData?.data?.ads?.at(0)?.picture_source ||
            'https://app.huehuy.com/_next/image?url=%2Flogo.png&w=640&q=75'
          }
        />
        <meta property="og:url" content={`https://app.huehuy.com/${code}`} />
        <meta property="og:type" content="product" />
      </Head>
      <div className="lg:mx-auto relative lg:max-w-md">
        {/* Header seperti di promoId.jsx */}
        <div className="w-full h-[60px] px-4 relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
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
              <h1 className="text-white font-bold text-sm">
                {data?.data?.is_information ? 'Kubus Informasi' : 'Promo'}
              </h1>
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
        {/* Main content dengan design baru */}
        <div className="bg-white min-h-screen w-full px-4 lg:px-6 pt-4 lg:pt-6 pb-28 lg:pb-4">
          <div className="lg:mx-auto lg:max-w-md">
            {/* Image Carousel */}
            {data?.data?.ads && data?.data?.ads.length > 0 && (
              <div className="mb-4">
                <ImageCarousel
                  images={data?.data?.ads?.map(item => item?.picture_source).filter(Boolean)}
                  title={currentPromo?.title || 'Promo'}
                  className="w-full"
                />
              </div>
            )}

            {/* Info Cards seperti di promoId.jsx */}
            <div className="mb-4">
              <div className="rounded-[20px] p-4 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="flex items-center justify-between mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white mr-2 text-sm" />
                    <span className="text-sm font-semibold text-white">
                      {data?.data?.distance ? `${data?.data?.distance} km` : 'Lokasi'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white opacity-80">Kubus:</span>
                    <div className="text-xs text-white opacity-70">#{code}</div>
                  </div>
                </div>

                <div className="mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-white">
                        {currentPromo?.start_validate && currentPromo?.finish_validate ?
                          `${fmtDateID(currentPromo.start_validate)} - ${fmtDateID(currentPromo.finish_validate)}` :
                          'Periode Berlaku'
                        }
                      </span>
                      <div className="text-xs text-white opacity-80">
                        {data?.data?.world?.name || 'General'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-yellow-400 text-slate-800 px-3 py-1 rounded-[8px] text-sm font-semibold">
                        {currentPromo?.jam_mulai && currentPromo?.jam_berakhir ?
                          `${toHM(currentPromo.jam_mulai)} - ${toHM(currentPromo.jam_berakhir)}` :
                          'Jam Berlaku'
                        }
                      </div>
                      <div className="text-xs text-white opacity-70 mt-1">Jam Berlaku</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FontAwesomeIcon
                        icon={data?.data?.status === 'active' ? faWifi : faWifiSlash}
                        className="mr-2 text-white text-sm"
                      />
                      <span className="text-sm font-semibold text-white">
                        {data?.data?.status === 'active' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <span className="text-xs text-white opacity-70">
                      {data?.data?.status === 'active' ? 'Promo Aktif' : 'Promo Tidak Aktif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Detail Content */}
            <div className="mb-4">
              <div className="bg-white rounded-[20px] p-5 shadow-lg border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 leading-tight mb-4 text-left">
                  {currentPromo?.title}
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm text-left mb-4">
                  {currentPromo?.description}
                </p>

                <div className="text-left">
                  <button
                    onClick={() => setShowDetailExpanded(!showDetailExpanded)}
                    className="text-white px-6 py-2 rounded-[12px] text-sm font-semibold hover:opacity-90 transition-all flex items-center bg-blue-500"
                  >
                    {showDetailExpanded ? 'Tutup Detail' : 'Selengkapnya'}
                    <span className={`ml-2 transition-transform duration-300 ${showDetailExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                </div>

                {/* Expanded Detail */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showDetailExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                  }`}>
                  <div className="border-t border-slate-200 pt-4">
                    {!data?.data?.is_information && (
                      <>
                        <div className="mb-4">
                          <h5 className="font-semibold text-slate-900 mb-2 text-sm">Informasi Kubus:</h5>
                          <div className="bg-slate-50 p-3 rounded-[12px]">
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <p>Kode:</p>
                              <p className="col-span-3">#{code}</p>
                              <p>Tipe:</p>
                              <p className="col-span-3">
                                {data?.data?.cube_type?.name} ({data?.data?.cube_type?.code})
                              </p>
                              <p>Dunia:</p>
                              <p className="col-span-3">{data?.data?.world?.name || 'General'}</p>
                            </div>
                          </div>
                        </div>

                        {currentPromo?.level_umkm && (
                          <div className="mb-4">
                            <h5 className="font-semibold text-slate-900 mb-2 text-sm">Performa UMKM:</h5>
                            <div className="bg-slate-50 p-3 rounded-[12px]">
                              <div className="font-semibold mb-2 text-center bg-green-200 py-2 text-green-600 rounded-full">
                                UMKM Level {currentPromo.level_umkm}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Kapasitas Produksi/Hari:</span>
                                  <span className="font-semibold text-blue-600">
                                    {currentPromo.max_production_per_day} Pcs
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Rata-rata Penjualan/Hari:</span>
                                  <span className="font-semibold text-blue-600">
                                    {currentPromo.sell_per_day} Pcs
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lokasi dan Pemilik */}
            {!data?.data?.is_information && (
              <>
                {/* Lokasi */}
                <div className="mb-4">
                  <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-3 text-sm">Lokasi Promo</h4>
                    <p className="text-slate-600 text-xs leading-relaxed mb-3">
                      {data?.data?.tags?.at(0)?.address || data?.data?.address}
                    </p>
                    <button
                      onClick={() => {
                        const lat = data?.data?.tags?.at(0)?.map_lat || data?.data?.map_lat;
                        const lng = data?.data?.tags?.at(0)?.map_lng || data?.data?.map_lng;
                        if (lat && lng) {
                          window.open(`http://www.google.com/maps/place/${lat},${lng}`, '_blank');
                        }
                      }}
                      className="w-full text-white py-2 px-6 rounded-[12px] hover:opacity-90 transition-colors text-sm font-semibold flex items-center justify-center bg-blue-500"
                    >
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm" />
                      Rute
                    </button>
                  </div>
                </div>

                {/* Pemilik */}
                <div className="mb-4">
                  <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-3 text-sm">Pemilik Kubus</h4>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900 text-xs">
                        Nama: {data?.data?.user?.name || data?.data?.corporate?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        No Hp/WA: {data?.data?.user?.phone || '-'}
                      </p>
                      {data?.data?.user?.phone && (
                        <button
                          className="w-full text-white p-3 rounded-full hover:opacity-90 transition-colors flex items-center justify-center bg-blue-500"
                          onClick={() => {
                            window.open(`https://wa.me/${data?.data?.user?.phone}`, '_blank');
                          }}
                        >
                          <FontAwesomeIcon icon={faPhone} className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Button */}
        {!data?.data?.is_information && (
          <div className="fixed bottom-0 left-0 right-0 lg:static lg:mt-6 lg:mb-4 bg-white border-t border-slate-200 lg:border-t-0 p-4 lg:p-6 z-30">
            <div className="lg:max-w-sm lg:mx-auto">
              {!data?.data?.is_my_cube ? (
                <button
                  onClick={handleClaimPromo}
                  disabled={!canClaim || isNotStarted || isClaimedLoading || isAlreadyClaimed}
                  className={`w-full py-4 lg:py-3.5 rounded-[15px] lg:rounded-xl font-bold text-lg lg:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${(timeFlags.expiredByDate || !timeFlags.withinDailyTime || isNotStarted)
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isAlreadyClaimed
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : isClaimedLoading
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : 'bg-blue-500 text-white focus:ring-4 focus:ring-opacity-50'
                    }`}
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
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link href={'/app/hubungi-kami'}>
                    <ButtonComponent
                      label="Aktifasi Kubus"
                      size="lg"
                      block
                      disabled={data?.data?.status == 'active'}
                    />
                  </Link>
                  <Link href={'/app/kubusku/edit-kubus?code=' + code}>
                    <ButtonComponent
                      label="Edit Promo"
                      size="lg"
                      variant="outline"
                      block
                    />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100">
                <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Selamat!</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Promo <span className="font-semibold text-blue-500">{currentPromo?.title}</span> berhasil direbut dan masuk ke Saku
                Promo Anda!
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleSuccessModalClose}
                  className="w-full text-white py-3 rounded-[12px] font-semibold hover:opacity-90 transition-all bg-blue-500"
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
                  onClick={() => submitReport()}
                  className="w-full bg-red-100 text-red-700 py-3 rounded-[12px] font-semibold hover:bg-red-200 transition-all"
                >
                  Iklan tidak sesuai
                </button>
                <button
                  onClick={() => submitReport()}
                  className="w-full bg-yellow-100 text-yellow-700 py-3 rounded-[12px] font-semibold hover:bg-yellow-200 transition-all"
                >
                  Penipuan / scam
                </button>
                <button
                  onClick={() => submitReport()}
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
      </div>

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
          .desktop-container {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps(context) {
  const { code } = context.params;
  const res = await get({
    path: code && `get-cube-by-code-general/${code}`,
  });

  const cubeData = res?.data || [];

  return {
    props: { cubeData },
  };
}

export default Cube;