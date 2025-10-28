/* eslint-disable no-console */
import {
    faArrowLeft,
    faChevronDown,
    faChevronUp,
    faClock,
    faInfoCircle,
    faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { ImageCarousel } from '../../../components/base.components';
import { get } from '../../../helpers/api.helpers';
import { token_cookie_name } from '../../../helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';

export default function KubusInformasiPage() {
  const router = useRouter();
  const { code, cubeCode, cube_code, communityId } = router.query;

  const [cube, setCube] = useState(null);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    schedule: false,
    description: false,
    location: false
  });

  // Function to get community gradient style
  const getCommunityGradient = (bgColor1, bgColor2) => {
    if (bgColor1 && bgColor2) {
      return {
        background: `linear-gradient(135deg, ${bgColor1} 0%, ${bgColor2} 100%)`
      };
    } else if (bgColor1) {
      return {
        backgroundColor: bgColor1
      };
    } else if (bgColor2) {
      return {
        backgroundColor: bgColor2
      };
    }
    return null;
  };

  // Build URL gambar seperti di iklan
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
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

  // Kumpulin image array untuk kubus informasi
  const buildImagesArray = useCallback(
    (cubeData) => {
      if (!cubeData) return ['/default-avatar.png'];

      const imgs = [];

      // Prioritas 1: Gambar dari cube (untuk kubus informasi)
      if (cubeData.picture_source) {
        imgs.push(buildImageUrl(cubeData.picture_source));
      }
      if (cubeData.image) {
        imgs.push(buildImageUrl(cubeData.image));
      }

      // Prioritas 2: Gambar dari ads yang aktif
      const ads = Array.isArray(cubeData?.ads) ? cubeData.ads : [];
      const activeAds = ads.filter(a => String(a?.status).toLowerCase() === 'active');
      
      activeAds.forEach(ad => {
        // Untuk kubus informasi, prioritaskan picture_source dari ad
        const imageFields = [ad.picture_source, ad.image_1, ad.image_2, ad.image_3, ad.image];
        imageFields.forEach((raw) => {
          if (raw && raw.trim()) {
            const imageUrl = buildImageUrl(raw);
            // Hindari duplikasi gambar
            if (!imgs.includes(imageUrl)) {
              imgs.push(imageUrl);
            }
          }
        });
      });

      // Fallback jika tidak ada gambar
      if (imgs.length === 0) {
        imgs.push('/default-avatar.png');
      }

      // Hapus duplikasi dan batasi maksimal 5 gambar
      return [...new Set(imgs)].slice(0, 5);
    },
    [buildImageUrl]
  );

  // Map index day → nama hari Indonesia
  const DAY_MAP = useMemo(() => ([
    'minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'
  ]), []);

  const fmtDayLabel = useCallback((d) => {
    const low = String(d || '').toLowerCase();
    const mapping = {
      senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu',
      kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu',
    };
    return mapping[low] || d;
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const buildTodayHours = useCallback((openingHours) => {
    // Untuk kubus informasi, selalu tersedia
    return { 
      day: 'Informasi', 
      time: 'Selalu Tersedia', 
      details: 'Tersedia',
      fullSchedule: openingHours || []
    };
  }, []);

  const buildFullSchedule = useCallback((openingHours) => {
    if (!Array.isArray(openingHours) || openingHours.length === 0) {
      return [
        { day: 'Senin - Minggu', time: 'Selalu Tersedia', status: 'Tersedia' }
      ];
    }

    return openingHours.map(h => {
      const dayLabel = fmtDayLabel(h.day);
      let time = 'Selalu Tersedia';
      let status = 'Tersedia';

      if (h.is_closed) {
        time = '-';
        status = 'Tutup';
      } else if (h.is_24hour) {
        time = '24 Jam';
        status = 'Tersedia';
      } else if (h.open && h.close) {
        time = `${h.open} - ${h.close}`;
        status = 'Tersedia';
      }

      return { day: dayLabel, time, status };
    });
  }, [fmtDayLabel]);

  const buildDescription = useCallback((cubeData) => {
    if (!cubeData) return 'Tidak ada deskripsi.';

    // Prioritas 1: Deskripsi dari cube (untuk kubus informasi)
    if (cubeData.description && String(cubeData.description).trim()) {
      return String(cubeData.description).trim();
    }

    // Prioritas 2: Detail dari cube
    if (cubeData.detail && String(cubeData.detail).trim()) {
      return String(cubeData.detail).trim();
    }

    // Prioritas 3: Deskripsi dari iklan aktif
    const ads = Array.isArray(cubeData?.ads) ? cubeData.ads : [];
    const activeAd = ads.find(a => String(a?.status).toLowerCase() === 'active') || ads[0];

    if (activeAd) {
      const adDesc = activeAd?.description || activeAd?.detail;
      if (adDesc && String(adDesc).trim()) {
        return String(adDesc).trim();
      }
    }

    // Prioritas 4: Label atau nama cube
    if (cubeData.label && String(cubeData.label).trim()) {
      return `Informasi tentang ${String(cubeData.label).trim()}`;
    }

    // Fallback minimal
    return 'Tidak ada deskripsi tersedia.';
  }, []);

  // Fetch community data
  const fetchCommunityData = useCallback(async () => {
    if (!communityId) return;
    
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      
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
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    }
  }, [communityId]);







  const fetchCubeInfo = useCallback(async () => {
    if (!router.isReady) return;
    const effectiveCode = code || cubeCode || cube_code;
    if (!effectiveCode) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const resp = await get({ path: `get-cube-by-code-general/${effectiveCode}` });
      const data = resp?.data?.data || resp?.data;
      setCube(data || null);
    } catch (err) {
      console.error('Gagal ambil kubus informasi:', err);
      setCube(null);
    } finally {
      setLoading(false);
    }
  }, [router.isReady, code, cubeCode, cube_code]);

  useEffect(() => {
    fetchCubeInfo();
  }, [fetchCubeInfo]);

  useEffect(() => {
    if (router.isReady && communityId) {
      fetchCommunityData();
    }
  }, [router.isReady, communityId, fetchCommunityData]);

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

  const images = useMemo(() => buildImagesArray(cube), [cube, buildImagesArray]);
  const todayHours = buildTodayHours(cube?.opening_hours);
  const fullSchedule = buildFullSchedule(cube?.opening_hours);
  const description = buildDescription(cube);

  // Get community background style
  const communityBgStyle = getCommunityGradient(
    communityData?.bg_color_1,
    communityData?.bg_color_2
  );

  // Determine header background - use community colors if available, otherwise use primary
  const headerBgStyle = communityBgStyle;

  if (loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">
            Memuat detail kubus informasi...
          </p>
        </div>
      </div>
    );
  }

  if (!cube) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <p className="text-slate-600">
            Data kubus informasi tidak ditemukan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-container lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen lg:min-h-0 lg:my-4 lg:rounded-2xl lg:shadow-xl lg:border lg:border-slate-200 lg:overflow-hidden">
      {/* Header */}
      <div className={`w-full h-[60px] px-4 relative overflow-hidden lg:rounded-t-2xl ${!headerBgStyle ? 'bg-primary' : ''}`} style={headerBgStyle || {}}>
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
              {communityData ? `${communityData.name} - Kubus Informasi` : 'Kubus Informasi'}
            </h1>
            {communityData && (
              <p className="text-white text-xs opacity-80 mt-0.5">
                Informasi dari komunitas
              </p>
            )}
          </div>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white min-h-screen w-full px-4 lg:px-6 pt-4 lg:pt-6 pb-24 lg:pb-6">
        <div className="lg:mx-auto lg:max-w-md">
          {/* Hero Image Carousel */}
          <div className="mb-4">
            <ImageCarousel
              images={images}
              title={cube?.name || 'Kubus Informasi'}
              className="w-full"
            />
          </div>

          {/* Status Card - Selalu Tersedia */}
          <div className="mb-4">
            <div className={`rounded-[20px] p-4 shadow-lg ${!headerBgStyle ? 'bg-primary' : ''}`} style={headerBgStyle || {}}>
              <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={faInfoCircle}
                      className="mr-2 text-white text-sm"
                    />
                    <span className="text-sm font-semibold text-white">
                      Selalu Tersedia
                    </span>
                  </div>
                  <span className="text-xs text-white opacity-70">
                    📋 Informasi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-4 text-left">
                {cube?.name || 'Kubus Informasi'}
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm text-left mb-4">
                Hanya berupa informasi bukan promo atau voucher
              </p>
              {communityData && (
                <div className="bg-slate-50 rounded-lg p-3 mb-2">
                  <p className="text-slate-700 text-sm">
                    <span className="font-medium">Dari komunitas:</span> {communityData.name}
                  </p>
                  {communityData.description && (
                    <p className="text-slate-600 text-xs mt-1">
                      {communityData.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Jadwal Ketersediaan */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] shadow-lg border border-slate-100 overflow-hidden">
              <button 
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                onClick={() => toggleSection('schedule')}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faClock} className="mr-3 text-slate-600 text-sm" />
                  <span className="font-semibold text-slate-900 text-sm">Jadwal Ketersediaan</span>
                </div>
                <FontAwesomeIcon 
                  icon={expandedSections.schedule ? faChevronUp : faChevronDown} 
                  className="text-slate-400 text-sm"
                />
              </button>
              {expandedSections.schedule && (
                <div className="border-t border-slate-100 p-4">
                  {fullSchedule.map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
                      <span className="font-medium text-slate-900 text-xs flex-1">{schedule.day}</span>
                      <span className="text-slate-600 text-xs flex-1 text-center">{schedule.time}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-[80px] text-center ${
                        schedule.status.toLowerCase() === 'tersedia' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail Informasi */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] shadow-lg border border-slate-100 overflow-hidden">
              <button 
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                onClick={() => toggleSection('description')}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-3 text-slate-600 text-sm" />
                  <span className="font-semibold text-slate-900 text-sm">Detail Informasi</span>
                </div>
                <FontAwesomeIcon 
                  icon={expandedSections.description ? faChevronUp : faChevronDown} 
                  className="text-slate-400 text-sm"
                />
              </button>
              {expandedSections.description && (
                <div className="border-t border-slate-100 p-4">
                  <div className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                    {description || 'Tidak ada deskripsi tersedia.'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lokasi (jika ada data lokasi) */}
          {cube?.location && (
            <div className="mb-20 lg:mb-8">
              <div className="bg-white rounded-[20px] shadow-lg border border-slate-100 overflow-hidden">
                <button 
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  onClick={() => toggleSection('location')}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-slate-600 text-sm" />
                    <span className="font-semibold text-slate-900 text-sm">Lokasi</span>
                  </div>
                  <FontAwesomeIcon 
                    icon={expandedSections.location ? faChevronUp : faChevronDown} 
                    className="text-slate-400 text-sm"
                  />
                </button>
                {expandedSections.location && (
                  <div className="border-t border-slate-100 p-4">
                    <div className="text-slate-600 leading-relaxed text-sm">
                      {cube.location}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}