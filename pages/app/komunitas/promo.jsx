/* eslint-disable no-console */
import { faGift, faSearch, faTag } from '@fortawesome/free-solid-svg-icons';
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
  const [widgetData, setWidgetData] = useState([]); // Tambah state untuk widget
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
          Authorization: `Bearer ${token}`
        }
        : { 'Content-Type': 'application/json' };
    } catch (e) {
      return { 'Content-Type': 'application/json' };
    }
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
        updated_at: p.updated_at ?? ad?.updated_at
      };
    });

    promos.sort((a, b) => {
      const ta = new Date(a.updated_at || a.created_at || 0).getTime() || 0;
      const tb = new Date(b.updated_at || b.created_at || 0).getTime() || 0;
      if (tb !== ta) return tb - ta;
      const ia = Number(a.id), ib = Number(b.id);
      if (!Number.isNaN(ia) && !Number.isNaN(ib)) return ib - ia;
      return 0;
    });

    return promos;
  };

  useEffect(() => {
    if (communityId) {
      fetchCommunityData();
      fetchPromoData();
      fetchWidgetData(); // Tambah fetch widget
    }
  }, [communityId]);

  const fetchCommunityData = async () => {
    try {
      const res = await fetch(`${apiUrl}/communities/${communityId}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const json = await res.json();
        const community = json.data || json;
        setCommunityData({
          id: community.id,
          name: community.name || 'Komunitas',
          location: community.location || 'Location'
        });
      } else {
        setCommunityData({
          id: communityId,
          name: 'dbotanica Bandung',
          location: 'Bandung'
        });
      }
    } catch (error) {
      setCommunityData({
        id: communityId,
        name: 'dbotanica Bandung',
        location: 'Bandung'
      });
    }
  };

  const fetchPromoData = async () => {
    setLoading(true);
    try {
      const promoRes = await fetch(`${apiUrl}/communities/${communityId}/promos`, {
        headers: getAuthHeaders()
      });

      if (promoRes.ok) {
        const promoJson = await promoRes.json();
        const promoData = Array.isArray(promoJson?.data) ? promoJson.data : Array.isArray(promoJson) ? promoJson : [];
        setPromoData(normalizePromos(promoData));
      }
    } catch (error) {
      console.error('Error fetching promo data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tambah fungsi untuk fetch widget data
  const fetchWidgetData = async () => {
    try {
      console.log('🔍 Fetching widgets for community:', communityId);

      // Fetch widgets untuk tipe 'hunting' dan community_id yang sesuai
      const widgetRes = await fetch(`${apiUrl}/admin/dynamic-content?type=hunting&community_id=${communityId}`, {
        headers: getAuthHeaders()
      });

      if (widgetRes.ok) {
        const widgetJson = await widgetRes.json();
        const widgets = Array.isArray(widgetJson?.data) ? widgetJson.data : [];

        console.log('🎛️ Raw widgets received:', widgets);

        // Filter hanya widget yang aktif dan content_type = 'promo'
        const activePromoWidgets = widgets.filter(widget =>
          widget.is_active &&
          widget.content_type === 'promo'
        );

        console.log('🎛️ Active promo widgets:', activePromoWidgets);

        // Sort berdasarkan level
        activePromoWidgets.sort((a, b) => (a.level || 0) - (b.level || 0));

        setWidgetData(activePromoWidgets);
      } else {
        console.error('Failed to fetch widgets:', widgetRes.status);
      }
    } catch (error) {
      console.error('Error fetching widget data:', error);
    }
  };

  const handlePromoClick = (promoId) => {
    router.push(`/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=${communityId}`);
  };

  // Komponen untuk render widget berdasarkan tipe dan ukuran
  const WidgetRenderer = ({ widget }) => {
    const { source_type, size, dynamic_content_cubes, name } = widget;

    console.log('🎨 Rendering widget:', { name, source_type, size, cubes: dynamic_content_cubes?.length });

    if (source_type === 'cube' && dynamic_content_cubes?.length > 0) {
      // Tentukan layout berdasarkan size
      const getLayoutConfig = (size) => {
        switch (size) {
          case 'S':
            return {
              gridCols: 'grid-cols-2',
              itemSize: 'w-14 h-14',
              textSize: 'text-sm',
              gap: 'gap-0.5' // lebih rapat lagi untuk S
            };
          case 'M':
            return {
              gridCols: 'grid-cols-2',
              itemSize: 'w-20 h-20',
              textSize: 'text-base',
              gap: 'gap-3'
            };
          case 'L':
            return {
              gridCols: 'grid-cols-1',
              itemSize: 'w-24 h-24',
              textSize: 'text-lg',
              gap: 'gap-4'
            };
          case 'XL':
            return {
              gridCols: 'grid-cols-1',
              itemSize: 'w-32 h-32',
              textSize: 'text-xl',
              gap: 'gap-4'
            };
          case 'XL-Ads':
            return {
              gridCols: 'grid-cols-1',
              itemSize: 'w-full h-40',
              textSize: 'text-xl',
              gap: 'gap-4'
            };
          default:
            return {
              gridCols: 'grid-cols-2',
              itemSize: 'w-20 h-20',
              textSize: 'text-base',
              gap: 'gap-3'
            };
        }
      };

      const layout = getLayoutConfig(size);
      console.log('📐 Layout config for size', size, ':', layout);

      // Ubah grid menjadi flex horizontal scrollable
      return (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
            <div className="bg-purple-50 p-2 rounded-lg">
              <FontAwesomeIcon icon={faGift} className="text-purple-500 text-sm" />
            </div>
          </div>
          {/* Scrollable horizontal container */}
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {dynamic_content_cubes.map((cubeData, index) => {
              const cube = cubeData.cube;
              if (!cube) return null;

              // Ambil data dari ads jika tersedia
              const ad = cube.ads?.[0];
              const imageUrl = buildImageUrl(
                ad?.image_1 ||
                ad?.image ||
                ad?.picture_source ||
                cube?.image ||
                FALLBACK_IMAGE
              );
              const title = ad?.title || cube.label || 'Promo';
              const merchant = ad?.merchant || communityData?.name || 'Merchant';

              // XL-Ads: Banner dua layer (horizontal card)
              if (size === 'XL-Ads') {
                return (
                  <div
                    key={cube.id || index}
                    className="relative rounded-[16px] overflow-hidden cursor-pointer flex-shrink-0"
                    style={{ minWidth: 320, maxWidth: 400 }}
                    onClick={() => {
                      if (ad?.id) {
                        router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                      }
                    }}
                  >
                    {/* Gambar utama */}
                    <div className="relative w-full h-64">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="/default-avatar.png"
                      />
                      {/* Overlay nama komunitas */}
                      <div className="absolute top-3 left-3 bg-black/40 text-white text-[12px] font-medium px-3 py-1 rounded-md backdrop-blur-sm">
                        {merchant}
                      </div>
                    </div>
                    {/* Kotak bawah konten */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-gray-900/40 p-4">
                      <h3 className="text-white font-semibold text-[15px] leading-snug mb-1 line-clamp-2">
                        {title}
                      </h3>
                      <button className="mt-1 inline-block bg-white/90 text-[12px] text-gray-800 font-medium px-3 py-1 rounded-md">
                        {widget.content_type === 'promo'
                          ? 'Promo'
                          : widget.content_type === 'recommendation'
                            ? 'Lihat Rekomendasi'
                            : widget.content_type === 'category'
                              ? 'Lihat Kategori'
                              : widget.content_type === 'ad_category'
                                ? 'Lihat Iklan'
                                : widget.content_type === 'nearby'
                                  ? 'Lihat Terdekat'
                                  : 'Lihat Detail'}
                      </button>
                    </div>
                  </div>
                );
              }

              // XL
              if (size === 'XL') {
                return (
                  <div
                    key={cube.id || index}
                    className="relative rounded-[16px] border-2 border-blue-200 bg-[#5C8DBB]/10 overflow-hidden p-3 flex-shrink-0"
                    style={{ minWidth: 260, maxWidth: 320, minHeight: 220 }}
                    onClick={() => {
                      if (ad?.id) {
                        router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                      }
                    }}
                  >
                    {/* Gambar utama */}
                    <div className="relative w-full h-36 rounded-[12px] overflow-hidden mb-3">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="/default-avatar.png"
                      />
                      {/* Overlay nama komunitas */}
                      <div className="absolute top-2 left-2 bg-white/70 text-[#5C8DBB] text-[12px] font-medium px-2 py-0.5 rounded-md border border-[#5C8DBB]">
                        {merchant}
                      </div>
                    </div>
                    {/* Konten bawah */}
                    <div>
                      <h3 className="text-[#2B3A55] font-semibold text-[15px] leading-snug mb-1 line-clamp-2">
                        {title}
                      </h3>
                      <p className="text-gray-600 text-[13px] mb-2 line-clamp-2">
                        {ad?.description || ''}
                      </p>
                      <button
                        className="inline-block bg-white border border-[#5C8DBB] text-[#5C8DBB] text-[12px] font-medium px-3 py-1 rounded-md hover:bg-[#5C8DBB] hover:text-white transition"
                        onClick={e => {
                          e.stopPropagation();
                          if (ad?.id) {
                            router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                          }
                        }}
                      >
                        {widget.content_type === 'promo'
                          ? 'Promo'
                          : widget.content_type === 'recommendation'
                            ? 'Lihat Rekomendasi'
                            : widget.content_type === 'category'
                              ? 'Lihat Kategori'
                              : widget.content_type === 'ad_category'
                                ? 'Lihat Iklan'
                                : widget.content_type === 'nearby'
                                  ? 'Lihat Terdekat'
                                  : 'Lihat Detail'}
                      </button>
                    </div>
                  </div>
                );
              }

              // L
              if (size === 'L') {
                return (
                  <div
                    key={cube.id || index}
                    className="flex items-center rounded-[16px] border-2 border-blue-200 bg-[#5C8DBB]/10 overflow-hidden px-4 py-3 min-h-[110px] flex-shrink-0"
                    style={{ minWidth: 220, maxWidth: 260, cursor: 'pointer' }}
                    onClick={() => {
                      if (ad?.id) {
                        router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                      }
                    }}
                  >
                    {/* Gambar di kiri */}
                    <div className="relative w-24 h-24 rounded-[12px] overflow-hidden flex-shrink-0 mr-4">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="/default-avatar.png"
                      />
                      {/* Overlay nama komunitas */}
                      <div className="absolute top-2 left-2 bg-white/70 text-[#5C8DBB] text-[11px] font-medium px-2 py-0.5 rounded-md border border-[#5C8DBB]">
                        {merchant}
                      </div>
                    </div>
                    {/* Konten di kanan */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-[#2B3A55] font-semibold text-[15px] leading-snug mb-1 line-clamp-2">
                        {title}
                      </h3>
                      <p className="text-gray-600 text-[13px] mb-2 line-clamp-2">
                        {ad?.description || ''}
                      </p>
                      <button
                        className="inline-block bg-white border border-[#5C8DBB] text-[#5C8DBB] text-[12px] font-medium px-3 py-1 rounded-md hover:bg-[#5C8DBB] hover:text-white transition w-fit"
                        onClick={e => {
                          e.stopPropagation();
                          if (ad?.id) {
                            router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                          }
                        }}
                      >
                        {widget.content_type === 'promo'
                          ? 'Promo'
                          : widget.content_type === 'recommendation'
                            ? 'Lihat Rekomendasi'
                            : widget.content_type === 'category'
                              ? 'Lihat Kategori'
                              : widget.content_type === 'ad_category'
                                ? 'Lihat Iklan'
                                : widget.content_type === 'nearby'
                                  ? 'Lihat Terdekat'
                                  : 'Lihat Detail'}
                      </button>
                    </div>
                  </div>
                );
              }

              // S/M
              if (size === 'S' || size === 'M') {
                const isM = size === 'M';
                return (
                  <div
                    key={cube.id || index}
                    className="flex flex-col items-stretch w-full rounded-[10px] border border-blue-200 bg-[#5C8DBB]/10 overflow-hidden p-0.5 flex-shrink-0"
                    style={{
                      minWidth: isM ? 140 : 100,
                      maxWidth: isM ? 180 : 120,
                      minHeight: isM ? 160 : 120,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (ad?.id) {
                        router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                      }
                    }}
                  >
                    {/* Gambar di atas */}
                    <div
                      className="relative w-full rounded-[8px] overflow-hidden mb-1"
                      style={{
                        height: isM ? 90 : 60 // S lebih kecil
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="/default-avatar.png"
                      />
                      {/* Overlay nama komunitas */}
                      <div className={`absolute top-1 left-1 bg-white/70 text-[#5C8DBB] ${isM ? 'text-[11px]' : 'text-[9px]'} font-medium px-2 py-0.5 rounded border border-[#5C8DBB]`}>
                        {merchant}
                      </div>
                    </div>
                    {/* Konten bawah */}
                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className={`text-[#2B3A55] font-semibold ${isM ? 'text-[15px]' : 'text-[11px]'} leading-snug mb-1 line-clamp-2`}>
                        {title}
                      </h3>
                      <button
                        className={`inline-block bg-white border border-[#5C8DBB] text-[#5C8DBB] ${isM ? 'text-[12px] px-3 py-1' : 'text-[10px] px-2 py-0.5'} font-medium rounded-md hover:bg-[#5C8DBB] hover:text-white transition w-fit`}
                        onClick={e => {
                          e.stopPropagation();
                          if (ad?.id) {
                            router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                          }
                        }}
                      >
                        {widget.content_type === 'promo'
                          ? 'Promo'
                          : widget.content_type === 'recommendation'
                            ? 'Lihat Rekomendasi'
                            : widget.content_type === 'category'
                              ? 'Lihat Kategori'
                              : widget.content_type === 'ad_category'
                                ? 'Lihat Iklan'
                                : widget.content_type === 'nearby'
                                  ? 'Lihat Terdekat'
                                  : 'Lihat Detail'}
                      </button>
                    </div>
                  </div>
                );
              }

              // Tambahan untuk size 'S'
              return (
                <div
                  key={cube.id || index}
                  className="bg-white rounded-[16px] shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-50 flex-shrink-0"
                  style={{ minWidth: 140, maxWidth: 180 }}
                  onClick={() => {
                    if (ad?.id) {
                      router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                    }
                  }}
                >
                  <div className={`flex p-4 ${size === 'XL' ? 'flex-col' : 'flex-row'}`}>
                    <div className={`rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100 ${layout.itemSize}`}>
                      <Image
                        src={imageUrl}
                        alt={title}
                        width={size === 'XL' ? 128 : size === 'L' ? 96 : size === 'M' ? 80 : 64}
                        height={size === 'XL' ? 128 : size === 'L' ? 96 : size === 'M' ? 80 : 64}
                        className="w-full h-full object-cover"
                        placeholder="blur"
                        blurDataURL="/default-avatar.png"
                      />
                    </div>
                    <div className={`flex-1 min-w-0 flex flex-col justify-center ${size === 'XL' ? 'mt-3' : 'ml-3'}`}>
                      <h3 className={`font-semibold text-gray-900 leading-tight line-clamp-2 mb-1 ${layout.textSize}`}>
                        {title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {merchant}
                      </p>
                      {size === 'XL' && ad?.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                          {ad.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  const PromoCard = ({ promo }) => (
    <div
      className="bg-white rounded-[16px] shadow-sm overflow-hidden mb-4 hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-50"
      onClick={() => handlePromoClick(promo.id)}
    >
      <div className="flex p-5">
        <div className="w-20 h-20 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100">
          <Image
            src={promo.image}
            alt={promo.title}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            placeholder="blur"
            blurDataURL="/default-avatar.png"
          />
        </div>
        <div className="flex-1 ml-4 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 mb-1">
            {promo.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-1">
            {promo.merchant}
          </p>
        </div>
      </div>
    </div>
  );

  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen flex items-center justify-center px-4 py-4">
        <div className="text-center bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-sm p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data komunitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
      {/* Header */}
      <div className="bg-primary w-full h-[100px] rounded-b-[30px] shadow-sm px-6 mb-4 relative">
        <div className="flex items-center justify-center h-full">
          <div className="w-full bg-white px-4 py-3 rounded-[20px] flex items-center shadow-sm">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Cari promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        <div className="lg:mx-auto lg:max-w-md">

          {/* Render Widgets - Tampilkan sebelum promo reguler */}
          {widgetData.map((widget) => (
            <WidgetRenderer key={widget.id} widget={widget} />
          ))}

          {/* Promo Reguler Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Promo Terkini</h2>
              <div className="bg-blue-50 p-2 rounded-lg">
                <FontAwesomeIcon icon={faTag} className="text-blue-500 text-sm" />
              </div>
            </div>

            {promoData.length > 0 ? (
              promoData
                .filter(promo =>
                  searchQuery === '' ||
                  promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  promo.merchant.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((promo) => (
                  <PromoCard key={promo.id} promo={promo} />
                ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-[12px]">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faGift} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Belum ada promo tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CommunityBottomBar active="promo" communityId={communityId} />
    </div>
  );
};

export default CommunityPromoPage;