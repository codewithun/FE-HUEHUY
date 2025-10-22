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
          Authorization: `Bearer ${token}`,
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
        updated_at: p.updated_at ?? ad?.updated_at,
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
        });
      } else {
        setCommunityData({
          id: communityId,
          name: 'dbotanica Bandung',
          location: 'Bandung',
        });
      }
    } catch (error) {
      setCommunityData({
        id: communityId,
        name: 'dbotanica Bandung',
        location: 'Bandung',
      });
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
      // tambahkan paginate=all biar backend ngasih semua data
      const widgetRes = await fetch(
        `${apiUrl}/admin/dynamic-content?type=hunting&community_id=${communityId}&paginate=all`,
        { headers: getAuthHeaders() }
      );

      if (widgetRes.ok) {
        const widgetJson = await widgetRes.json();

        // fallback kalau backend ngirim data langsung tanpa wrapper .data
        let widgets = Array.isArray(widgetJson?.data)
          ? widgetJson.data
          : Array.isArray(widgetJson)
            ? widgetJson
            : [];

        // filter hanya widget hunting aktif
        widgets = widgets
          .filter((w) => w.is_active && w.type === 'hunting')
          .sort((a, b) => (a.level || 0) - (b.level || 0));

        // 🔹 Cari widget ad_category: ambil kategorinya dan hapus widget agar tidak dirender dua kali
        const adCategoryWidget = widgets.find((w) => w.source_type === 'ad_category');
        if (adCategoryWidget) {
          try {
            const catRes = await fetch(
              `${apiUrl}/admin/options/ad-category?community_id=${communityId}`,
              { headers: getAuthHeaders() }
            );
            const catResult = await catRes.json();
            if (catResult?.message === 'success' && Array.isArray(catResult.data)) {
              setAdCategories(catResult.data);
              setAdCategoryLevel(adCategoryWidget.level ?? null);
            } else if (Array.isArray(catResult)) {
              setAdCategories(catResult);
              setAdCategoryLevel(adCategoryWidget.level ?? null);
            } else {
              setAdCategories([]);
              setAdCategoryLevel(null);
            }
          } catch (e) {
            console.error('Gagal ambil ad_category saat fetch widget:', e);
            setAdCategories([]);
            setAdCategoryLevel(null);
          }

          // remove the ad_category widget so it won't render via WidgetRenderer
          widgets = widgets.filter((w) => w.id !== adCategoryWidget.id);
        } else {
          setAdCategories([]);
          setAdCategoryLevel(null);
        }

        setWidgetData(widgets);
      } else {
        console.error('Failed to fetch widgets:', widgetRes.status);
      }
    } catch (error) {
      console.error('Error fetching widget data:', error);
      setAdCategories([]);
      setAdCategoryLevel(null);
    }
  };



  const handlePromoClick = (promoId) => {
    router.push(
      `/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=${communityId}`
    );
  };

  // ======== UI TOKENS (BIAR KONSISTEN) ========
  const COLORS = {
    olive: '#5a6e1d',
    oliveSoft: 'rgba(90,110,29,0.1)',
    oliveBorder: '#cdd0b3',
    textDark: '#2B3A55',
  };

  // ======== WIDGET RENDERER (S, M, L, XL, XL-Ads) ========
  const WidgetRenderer = ({ widget }) => {
    const { source_type, size, dynamic_content_cubes, name, content_type } = widget;

    // jika widget adalah ad_category kita hide UI di sini (data sudah diambil di parent)
    if (source_type === 'ad_category') return null;

    // 🟢 Kotak Kategori Biasa dari dynamic_content_cubes (versi lama)
    if (content_type === 'category' && dynamic_content_cubes?.length) {
      return (
        <div className="mb-6">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-slate-900">{name}</h2>
            {widget.description && (
              <p className="text-sm text-slate-600 mt-[1px]">{widget.description}</p>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {dynamic_content_cubes.map((catData, index) => {
              const cube = catData?.cube;
              if (!cube) return null;

              return (
                <div
                  key={cube.id || index}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-all"
                  style={{ minWidth: 90 }}
                  onClick={() => {
                    router.push(
                      `/app/komunitas/promo?categoryId=${cube.id}&communityId=${communityId}`
                    );
                  }}
                >
                  <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border border-[#d8d8d8] bg-white shadow-sm mb-2">
                    <Image
                      src={buildImageUrl(cube.image)}
                      alt={cube.category}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-[12px] text-slate-700 font-medium text-center line-clamp-2">
                    {cube.category}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (source_type !== 'cube' || !dynamic_content_cubes?.length) return null;

    return (
      <div className="mb-6">
        {/* Header Widget */}
        <div className="mb-2">
          <h2 className="text-lg font-bold text-slate-900">{name}</h2>
          {widget.description && (
            <p className="text-sm text-slate-600 mt-[1px]">
              {widget.description}
            </p>
          )}
        </div>

        {/* Scrollable horizontal container */}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {dynamic_content_cubes.map((cubeData, index) => {
            const cube = cubeData?.cube;
            if (!cube) return null;

            const ad = cube?.ads?.[0];
            const imageUrl = buildImageUrl(
              ad?.image_1 ||
              ad?.image ||
              ad?.picture_source ||
              cube?.image ||
              FALLBACK_IMAGE
            );
            const title = ad?.title || cube?.label || 'Promo';
            const merchant = ad?.merchant || communityData?.name || 'Merchant';
            const description = ad?.description || '';
            const category = cube?.category || 'Informasi';

            // ===== XL-ADS
            if (size === 'XL-Ads') {
              return (
                <div
                  key={cube?.id || index}
                  className="relative rounded-[18px] overflow-hidden border shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                  style={{
                    minWidth: 320,
                    maxWidth: 360,
                    borderColor: '#d8d8d8',
                    background: '#fffaf0',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (ad?.id)
                      router.push(
                        `/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`
                      );
                  }}
                >
                  {/* Gambar */}
                  <div className="relative w-full h-[290px] bg-white flex items-center justify-center">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-contain p-2"
                    />
                    <div className="absolute top-3 left-3 bg-white/70 text-[#5a6e1d] text-[11px] font-semibold px-3 py-[3px] rounded-full shadow-sm">
                      {merchant}
                    </div>
                  </div>

                  {/* Overlay bawah warna hijau */}
                  <div className="absolute bottom-0 left-0 right-0 backdrop-blur-sm p-4"
                    style={{ background: 'rgba(90,110,29,0.9)', borderTop: `1px solid ${COLORS.oliveBorder}` }}>
                    <h3 className="text-[15px] font-bold text-white leading-snug mb-2 line-clamp-1">
                      {title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="bg-white/30 text-white text-[11px] font-semibold px-3 py-[3px] rounded-md border border-white/40">
                        {category}
                      </span>
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
                  className="rounded-[16px] overflow-hidden border border-[#d8d8d8] bg-[#fffaf0] shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                  style={{
                    minWidth: 320,
                    maxWidth: 360,
                    cursor: 'pointer'
                  }}
                  onClick={() =>
                    router.push(
                      `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                    )
                  }
                >
                  {/* Gambar di atas */}
                  <div className="relative w-full h-[180px] bg-white flex items-center justify-center">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-contain p-2"
                    />
                    {/* Merchant Badge */}
                    <div className="absolute top-3 left-3 bg-white/80 text-[#5a6e1d] text-[11px] font-semibold px-3 py-[3px] rounded-full shadow-sm">
                      {merchant}
                    </div>
                  </div>

                  {/* Konten bawah */}
                  <div className="p-4 bg-[#5a6e1d]/5 border-t border-[#cdd0b3]">
                    <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1 line-clamp-2">
                      {title}
                    </h3>
                    <p className="text-[13px] text-slate-700 line-clamp-2 mb-3">
                      {description || 'Temukan berbagai keseruan menarik di komunitas ini!'}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="bg-[#e0e4c9] text-[#3f4820] text-[11px] font-semibold px-3 py-[3px] rounded-md">
                        {cube.category || 'Informasi'}
                      </span>
                      <FontAwesomeIcon
                        icon={faGift}
                        className="text-[#3f4820] text-[14px] opacity-80"
                      />
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
                  className="flex items-center rounded-[14px] overflow-hidden border border-[#d8d8d8] bg-[#5a6e1d]/10 shadow-md flex-shrink-0 hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
                  style={{
                    minWidth: 280,
                    maxWidth: 320,
                    height: 130,
                    cursor: 'pointer'
                  }}
                  onClick={() =>
                    router.push(
                      `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                    )
                  }
                >
                  {/* Gambar kiri */}
                  <div className="relative w-[40%] h-full bg-white flex items-center justify-center overflow-hidden">
                    <div className="w-[90%] h-[90%] relative">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-contain rounded-[10px]"
                      />
                    </div>
                  </div>

                  {/* Konten kanan */}
                  <div className="flex-1 h-full p-3 flex flex-col justify-between bg-[#5a6e1d]/5 border-l border-[#cdd0b3]">
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug mb-1">
                        {title}
                      </h3>
                      <p className="text-[13px] text-slate-700 line-clamp-2">
                        {description || 'Welcome to Huehuy!'}
                      </p>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="bg-[#e0e4c9] text-[#3f4820] text-[11px] font-semibold px-3 py-[3px] rounded-md">
                        {cube.category || 'Advertising'}
                      </span>
                      <FontAwesomeIcon
                        icon={faGift}
                        className="text-[#3f4820] text-[13px] opacity-80"
                      />
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
                  className="flex flex-col rounded-[12px] overflow-hidden border border-[#d8d8d8] bg-[#5a6e1d]/10 shadow-sm flex-shrink-0 hover:scale-[1.02] transition-all duration-300"
                  style={{
                    minWidth: isM ? 180 : 140,
                    maxWidth: isM ? 200 : 160,
                    cursor: 'pointer'
                  }}
                  onClick={() =>
                    router.push(
                      `/app/komunitas/promo/detail_promo?promoId=${ad?.id}&communityId=${communityData?.id}`
                    )
                  }
                >
                  {/* Gambar */}
                  <div
                    className="relative w-full bg-white flex items-center justify-center overflow-hidden"
                    style={{ height: isM ? 150 : 120 }}
                  >
                    <div className="w-[90%] h-[90%] relative">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-contain rounded-[8px]"
                      />
                    </div>
                  </div>

                  {/* Konten bawah */}
                  <div className="p-2 bg-[#5a6e1d]/5 border-t border-[#cdd0b3]">
                    <h3
                      className={`${isM ? 'text-[14px]' : 'text-[13px]'
                        } font-bold text-slate-900 line-clamp-2 mb-0.5`}
                    >
                      {title}
                    </h3>
                    <p
                      className={`${isM ? 'text-[12px]' : 'text-[11px]'
                        } text-slate-700 line-clamp-1`}
                    >
                      {description || 'Welcome to Huehuy!'}
                    </p>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="bg-[#e0e4c9] text-[#3f4820] text-[10px] font-semibold px-2 py-[2px] rounded-md">
                        {cube.category || 'Advertising'}
                      </span>
                      <FontAwesomeIcon
                        icon={faGift}
                        className="text-[#3f4820] text-[11px] opacity-80"
                      />
                    </div>
                  </div>
                </div>
              );
            }
            // fallback (shouldn't happen)
            return null;
          })}
        </div>
      </div>
    );
  };

  const PromoCard = ({ promo }) => (
    <div
      className="bg-white rounded-[16px] shadow-sm overflow-hidden mb-4 hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-50"
      onClick={() => handlePromoClick(promo.id)}
      style={{ minWidth: 220 }} // buat card bisa jadi item horizontal
    >
      <div className="flex p-4 items-center">
        <div className="w-28 h-28 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100"> 
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
          <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 mb-1">
            {promo.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-1">{promo.merchant}</p>
        </div>
      </div>
    </div>
  );

  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen flex items-center justify-center px-4 py-4">
        <div className="text-center bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data komunitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen">
      {/* Admin-style header */}
      <div className="bg-slate-50 p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Promo Komunitas</h1>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex items-center">
          <FontAwesomeIcon icon={faSearch} className="text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Cari promo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-slate-700 placeholder-slate-400 bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Admin-style content */}
      <div className="bg-slate-50 px-6 pb-24">
        <div className="lg:mx-auto lg:max-w-md">
          {/* Render Widgets dengan level-aware ordering */}
          {(widgetData.length > 0 || adCategories.length > 0) && (
            <>
              {(() => {
                // Create combined items with widgets and categories at correct level
                const items = [];
                
                // Add all widgets
                widgetData.forEach(widget => {
                  items.push({
                    type: 'widget',
                    level: widget.level || 0,
                    data: widget
                  });
                });
                
                // Add category block if available
                if (adCategories.length > 0 && adCategoryLevel !== null) {
                  items.push({
                    type: 'categories',
                    level: adCategoryLevel,
                    data: adCategories
                  });
                }
                
                // Sort by level
                items.sort((a, b) => a.level - b.level);
                
                // Render items
                return items.map((item) => {
                  if (item.type === 'widget') {
                    return <WidgetRenderer key={item.data.id} widget={item.data} />;
                  } else if (item.type === 'categories') {
                    return (
                      <div key="categories" className="mb-6">
                        <div className="mb-2">
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                          {item.data.map((cat) => {
                            const imgSrc = cat.image || buildImageUrl(cat.picture_source) || '/default-avatar.png';
                            const label = cat.label || cat.name || 'Kategori';
                            const id = cat.id || cat.value;

                            return (
                              <div
                                key={id}
                                className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-all"
                                style={{ minWidth: 90 }}
                                onClick={() =>
                                  router.push(`/app/komunitas/promo?categoryId=${id}&communityId=${communityId}`)
                                }
                              >
                                <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border border-[#d8d8d8] bg-white shadow-sm mb-2">
                                  <Image
                                    src={imgSrc}
                                    alt={label}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <p className="text-[12px] text-slate-700 font-medium text-center line-clamp-2">
                                  {label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
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
                <h2 className="text-lg font-bold text-slate-900">Promo Terbaru</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar">
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
