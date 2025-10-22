/* eslint-disable no-console */
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import CommunityBottomBar from './CommunityBottomBar';

// tambahkan helper normalisasi gambar
const normalizeImageSrc = (raw) => {
  if (!raw) return '/default-avatar.png';
  if (typeof raw !== 'string') return '/default-avatar.png';
  const s = raw.trim();
  if (!s) return '/default-avatar.png';
  // absolute URL -> return as is
  if (/^https?:\/\//i.test(s)) return s;
  // data URI -> return as is
  if (/^data:/i.test(s)) return s;
  // already starts with slash -> ok
  if (s.startsWith('/')) return s;
  // otherwise ensure leading slash
  return `/${s.replace(/^\/+/, '')}`;
};

// === [ADD] helpers biar label konsisten seperti di app/index.jsx ===
const getAdImage = (ad) =>
  ad?.image_1 || ad?.image_2 || ad?.image_3 || ad?.picture_source || '';

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

const getIsInformation = (ad) => {
  const cubeInfo = normalizeBoolLike(ad?.cube?.is_information);
  const adInfo = normalizeBoolLike(ad?.is_information);
  const contentType = String(ad?.cube?.content_type || ad?.content_type || '').toLowerCase();
  const contentTypeInfo = contentType === 'kubus-informasi';
  const typeStr = String(ad?.type || ad?.cube?.type || '').toLowerCase();
  const looksInfoType = ['information', 'informasi'].includes(typeStr);
  return cubeInfo || adInfo || contentTypeInfo || looksInfoType;
};

const getCategoryLabel = (ad) => {
  // 1) Kalau informasi -> "Informasi"
  if (getIsInformation(ad)) return 'Informasi';

  // 2) Mapping dari type
  const typeStr = String(ad?.type || '').toLowerCase();
  if (typeStr === 'iklan') return 'Advertising';
  if (typeStr === 'voucher') return 'Voucher';

  // 3) Fallback: nama kategori dari BE
  const rawCat = (ad?.ad_category?.name || '').trim();
  if (!rawCat) return 'Promo';
  if (rawCat.toLowerCase() === 'advertising') return 'Advertising';
  return rawCat;
};

export default function CommunityDashboard({ communityId }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [communityData, setCommunityData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tambah state untuk widget komunitas (type=information)
  const [widgetData, setWidgetData] = useState([]);
  // ad_category: data options dan level (posisi) widget dimana kategori harus muncul
  const [adCategories, setAdCategories] = useState([]);
  const [adCategoryLevel, setAdCategoryLevel] = useState(null);
  // Fetch widget komunitas (type=information)
  useEffect(() => {
    const fetchWidgetData = async () => {
      if (!communityId) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const apiBase = baseUrl.replace(/\/api\/?$/, '');
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : '';
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(`${apiBase}/api/admin/dynamic-content?type=information&community_id=${communityId}`, { headers });
        const json = await res.json();
        let widgets = Array.isArray(json?.data) ? json.data.filter((w) => w.is_active) : [];

        // 🔹 Cari widget ad_category: ambil kategorinya dan hapus widget agar tidak dirender dua kali
        const adCategoryWidget = widgets.find((w) => w.source_type === 'ad_category');
        if (adCategoryWidget) {
          try {
            const catRes = await fetch(`${apiBase}/api/admin/options/ad-category?community_id=${communityId}`, { headers });
            const catJson = await catRes.json();
            if (catJson?.message === 'success' && Array.isArray(catJson.data)) {
              setAdCategories(catJson.data);
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

        // 🔹 Urutkan widget berdasarkan level naik
        widgets = widgets.sort((a, b) => (a.level || 0) - (b.level || 0));
        setWidgetData(widgets);
      } catch (err) {
        console.error('Gagal ambil widget data:', err);
        setWidgetData([]);
        setAdCategories([]);
        setAdCategoryLevel(null);
      }
    };

    fetchWidgetData();
  }, [communityId]);

  // ======== UI TOKENS (BIAR KONSISTEN) ========
  const COLORS = {
    olive: '#5a6e1d',
    oliveSoft: 'rgba(90,110,29,0.1)',
    oliveBorder: '#cdd0b3',
    textDark: '#2B3A55',
  };

  // Komponen renderer widget sederhana (bisa diupgrade sesuai kebutuhan)
  function WidgetRenderer({ widget }) {
    const { source_type, size, dynamic_content_cubes, name, content_type, description } = widget;

    // ===== Kotak Kategori (mirip di promo.jsx) =====
    if (content_type === 'category' && Array.isArray(dynamic_content_cubes) && dynamic_content_cubes.length > 0) {
      return (
        <div className="mb-6">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-slate-900">{name}</h2>
            {description && <p className="text-sm text-slate-600 mt-[1px]">{description}</p>}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dynamic_content_cubes.map((catData, index) => {
              // support both shapes: { cube: {...} } or direct cube object
              const cube = catData?.cube || catData;
              if (!cube) return null;

              const imgSrc =
                cube.image ||
                cube.picture_source ||
                cube.image_1 ||
                catData?.image ||
                '/default-avatar.png';
              const label = cube.category || cube.label || cube.name || catData?.label || 'Kategori';
              const id = cube.id ?? cube.value ?? index;

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
                      src={normalizeImageSrc(imgSrc)}
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

    if (source_type === 'cube' && Array.isArray(dynamic_content_cubes) && dynamic_content_cubes.length > 0) {
      // layout logic handled inline per size case
      return (
        <div className="mb-6">
          {/* Header Widget */}
          <div className="mb-2">
            <h2 className="text-lg font-bold text-slate-900">{name}</h2>
            {widget.description && (
              <p className="text-sm text-slate-600 mt-[1px]">{widget.description}</p>
            )}
          </div>


          {/* Konten Scrollable */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dynamic_content_cubes.map((cubeData, index) => {
              const cube = cubeData?.cube;
              if (!cube) return null;

              // Ambil 1 ad yang menempel ke cube (kalau ada)
              const ad = cube.ads?.[0] || null;

              // Siapkan data untuk kartu:
              const imageUrl = ad ? getAdImage(ad) : (cube.image || '/default-avatar.png');
              const title = ad?.title || cube.label || 'Promo';
              const merchant = ad?.merchant || communityData?.name || 'Merchant';
              const address = ad?.cube?.address || cube.address || '';
              const category = ad ? getCategoryLabel(ad) : (cube.category || 'Promo');

              // --- lalu bagian layout (XL-Ads/XL/L/S/M) tinggal pakai `category` untuk badge ---
              if (size === 'XL-Ads') {
                return (
                  <div
                    key={cube?.id || index}
                    className="relative rounded-[18px] overflow-hidden border shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                    style={{ minWidth: 320, maxWidth: 360, borderColor: '#d8d8d8', background: '#fffaf0', cursor: 'pointer' }}
                    onClick={() => {
                      if (ad?.id) router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityId}`);
                    }}
                  >
                    <div className="relative w-full h-[290px] bg-white flex items-center justify-center">
                      <Image src={normalizeImageSrc(imageUrl)} alt={title} fill className="object-contain p-2" />
                      <div className="absolute top-3 left-3 bg-white/70 text-[#5a6e1d] text-[11px] font-semibold px-3 py-[3px] rounded-full shadow-sm">
                        {merchant}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 backdrop-blur-sm p-4"
                      style={{ background: 'rgba(90,110,29,0.9)', borderTop: '1px solid #cdd0b3' }}>
                      <h3 className="text-[15px] font-bold text-white leading-snug mb-2 line-clamp-1">{title}</h3>
                      <span className="bg-white/30 text-white text-[11px] font-semibold px-3 py-[3px] rounded-md border border-white/40">
                        {category}
                      </span>
                    </div>
                  </div>
                );
              }

              if (size === 'XL') {
                return (
                  <div
                    key={cube.id || index}
                    className="rounded-[16px] overflow-hidden border border-[#d8d8d8] bg-[#fffaf0] shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
                    style={{ minWidth: 320, maxWidth: 360, cursor: 'pointer' }}
                    onClick={() => ad?.id && router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityData?.id}`)}
                  >
                    <div className="relative w-full h-[180px] bg-white flex items-center justify-center">
                      <Image src={normalizeImageSrc(imageUrl)} alt={title} fill className="object-contain p-2" />
                      <div className="absolute top-3 left-3 bg-white/80 text-[#5a6e1d] text-[11px] font-semibold px-3 py-[3px] rounded-full shadow-sm">
                        {merchant}
                      </div>
                    </div>
                    <div className="p-4 bg-[#5a6e1d]/5 border-t border-[#cdd0b3]">
                      <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1 line-clamp-2">{title}</h3>
                      {address && <p className="text-[13px] text-slate-700 line-clamp-2 mb-3">{address}</p>}
                      <div className="flex items-center justify-between">
                        <span className="bg-[#e0e4c9] text-[#3f4820] text-[11px] font-semibold px-3 py-[3px] rounded-md">{category}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (size === 'L') {
                return (
                  <div
                    key={cube.id || index}
                    className="flex items-center rounded-[14px] overflow-hidden border border-[#d8d8d8] bg-[#5a6e1d]/10 shadow-md flex-shrink-0 hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
                    style={{ minWidth: 280, maxWidth: 320, height: 130, cursor: 'pointer' }}
                    onClick={() => ad?.id && router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityData?.id}`)}
                  >
                    <div className="relative w-[40%] h-full bg-white flex items-center justify-center overflow-hidden">
                      <div className="w-[90%] h-[90%] relative">
                        <Image src={normalizeImageSrc(imageUrl)} alt={title} fill className="object-contain rounded-[10px]" />
                      </div>
                    </div>
                    <div className="flex-1 h-full p-3 flex flex-col justify-between bg-[#5a6e1d]/5 border-l border-[#cdd0b3]">
                      <div>
                        <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug mb-1">{title}</h3>
                        {address && <p className="text-[13px] text-slate-700 line-clamp-2">{address}</p>}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="bg-[#e0e4c9] text-[#3f4820] text-[11px] font-semibold px-3 py-[3px] rounded-md">{category}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // S / M
              const isM = size === 'M';
              return (
                <div
                  key={cube.id || index}
                  className="flex flex-col rounded-[12px] overflow-hidden border border-[#d8d8d8] bg-[#5a6e1d]/10 shadow-sm flex-shrink-0 hover:scale-[1.02] transition-all duration-300"
                  style={{ minWidth: isM ? 180 : 140, maxWidth: isM ? 200 : 160, cursor: 'pointer' }}
                  onClick={() => ad?.id && router.push(`/app/komunitas/promo/detail_promo?promoId=${ad.id}&communityId=${communityData?.id}`)}
                >
                  <div className="relative w-full bg-white flex items-center justify-center overflow-hidden" style={{ height: isM ? 150 : 120 }}>
                    <div className="w-[90%] h-[90%] relative">
                      <Image src={normalizeImageSrc(imageUrl)} alt={title} fill className="object-contain rounded-[8px]" />
                    </div>
                  </div>
                  <div className="p-2 bg-[#5a6e1d]/5 border-t border-[#cdd0b3]">
                    <h3 className={`${isM ? 'text-[14px]' : 'text-[13px]'} font-bold text-slate-900 line-clamp-2 mb-0.5`}>{title}</h3>
                    {address && <p className={`${isM ? 'text-[12px]' : 'text-[11px]'} text-slate-700 line-clamp-1`}>{address}</p>}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="bg-[#e0e4c9] text-[#3f4820] text-[10px] font-semibold px-2 py-[2px] rounded-md">{category}</span>
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
  }



  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch community data from API
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!communityId) return;

      try {
        setLoading(true);
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

          // Use API response directly, no dummy/default values
          setCommunityData({
            id: community.id,
            name: community.name,
            description: community.description ?? null,
            members: community.members ?? 0,
            category: community.category ?? null,
            location: community.location ?? null,
            privacy: community.privacy ?? null,
            isVerified: community.isVerified ?? community.is_verified ?? null,
            avatar: community.logo ?? null,
            bg_color_1: community.bg_color_1 ?? null,
            bg_color_2: community.bg_color_2 ?? null,
          });
        } else {
          // No dummy fallback — set null so UI shows "not found" or handle accordingly
          setCommunityData(null);
        }
      } catch (error) {
        // On error, don't inject dummy data — set null
        setCommunityData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [communityId]);

  // Note: promo fetching removed from this screen to keep component focused.

  // Function untuk menentukan gradient berdasarkan bg_color dari backend (tanpa dummy fallback)
  const getCommunityGradient = (bgColor1, bgColor2) => {
    // Jika ada bg_color_1 dan bg_color_2 dari backend, gunakan itu
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
    // Fallback minimal jika BE tidak mengirim warna
    return {
      backgroundImage: 'linear-gradient(135deg, #16a34a, #059669)',
    };
  };

  // Admin-style loading state
  if (!isClient || loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-3 text-sm text-slate-600">
                  Loading komunitas...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin-style error state
  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Komunitas tidak ditemukan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get community background style
  const communityBgStyle = getCommunityGradient(
    communityData?.bg_color_1,
    communityData?.bg_color_2
  );

  // Admin-style dashboard layout
  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-slate-50 min-h-screen">
        <div className="container mx-auto relative z-10 pb-28">
          {/* Admin-style header with community colors */}
          <div 
            className="p-6 border-b border-slate-200"
            style={typeof communityBgStyle === 'object' ? communityBgStyle : {}}
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Dashboard Komunitas
              </h1>
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-white/20">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                {communityData.name}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {communityData.description}
              </p>
            </div>
          </div>

          {/* Admin-style content area */}
          <div className="bg-slate-50 min-h-screen w-full">
            <div className="px-6 pt-6">

              {/* Widget Komunitas Section (type=information) */}
              {(widgetData.length > 0 || adCategories.length > 0) && (
                <div className="mb-6">
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
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {item.data.map((cat) => {
                                const imgSrc = cat.image || cat.picture_source || '/default-avatar.png';
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
                                        src={normalizeImageSrc(imgSrc)}
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
                </div>
              )}

              {/* Upcoming Events removed - not used */}

            </div>
          </div>
        </div>

        <CommunityBottomBar
          active={'community'}
          communityId={communityData.id}
        />
      </div>
    </>
  );
}
