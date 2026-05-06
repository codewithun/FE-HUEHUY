/* eslint-disable no-console */
import { faSearch, faLocationDot, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../helpers';
import { distanceConvert } from '../../../helpers/distanceConvert.helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';
import CommunityBottomBar from './dashboard/CommunityBottomBar';
import KomunitasCard from '../../../components/construct.components/card/Komunitas.card';

const CommunityPromoPage = () => {
  const router = useRouter();
  const { communityId } = router.query;

  const [communityData, setCommunityData] = useState(null);
  const [promoData, setPromoData] = useState([]);
  const [widgetData, setWidgetData] = useState([]);
  const [adCategories, setAdCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authHeaders, setAuthHeaders] = useState({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const baseUrl = (apiUrl || '')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

  const isAbsoluteUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
  const FALLBACK_IMAGE = '/default-avatar.png';

  const buildImageUrl = (raw) => {
    if (typeof raw !== 'string') return FALLBACK_IMAGE;

    let url = raw.trim();
    if (!url) return FALLBACK_IMAGE;

    if (/^\/?default-avatar\.png$/i.test(url)) return FALLBACK_IMAGE;

    if (/^\/?api\/placeholder\//i.test(url) || /^placeholder\//i.test(url)) {
      return FALLBACK_IMAGE;
    }

    if (isAbsoluteUrl(url)) return url;

    let path = url.replace(/^\/+/, '');
    path = path.replace(/^api\/storage\//i, 'storage/');

    if (/^(ads|promos|uploads|images|files|banners|communities)\//i.test(path)) {
      path = `storage/${path}`;
    }

    const finalUrl = `${baseUrl}/${path}`.replace(/([^:]\/)\/+?/g, '$1');

    return /^https?:\/\//i.test(finalUrl) ? finalUrl : FALLBACK_IMAGE;
  };

  const normalizeImageSrc = (raw) => {
    if (!raw || typeof raw !== 'string') return FALLBACK_IMAGE;

    const s = raw.trim();
    if (!s) return FALLBACK_IMAGE;

    if (/^https?:\/\//i.test(s)) return s;
    if (/^data:/i.test(s)) return s;

    const apiBase = apiUrl.replace(/\/api\/?$/, '');

    let path = s.replace(/^\/+/, '').replace(/^api\/storage\//i, 'storage/');

    if (/^(ads|promos|uploads|images|files|banners|communities)\//i.test(path)) {
      path = `storage/${path}`;
    }

    if (!path.startsWith('storage/') && !path.startsWith('/')) {
      path = `/${path}`;
    }

    if (path.startsWith('storage/')) {
      return `${apiBase}/${path}`.replace(/([^:]\/)\/+?/g, '$1');
    }

    return path.startsWith('/') ? path : `/${path}`;
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
        : {
            'Content-Type': 'application/json',
          };
    } catch {
      return {
        'Content-Type': 'application/json',
      };
    }
  };

  const normalizeBoolLike = (val) => {
    if (val === true || val === 1) return true;

    if (typeof val === 'number') return val === 1;

    if (Array.isArray(val)) {
      return val.length > 0 && (val.includes(1) || val.includes('1') || val.includes(true));
    }

    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();

      if (['1', 'true', 'y', 'yes', 'ya', 'iya', 'on'].includes(s)) return true;
      if (['0', 'false', 'n', 'no', 'off', ''].includes(s)) return false;

      try {
        return normalizeBoolLike(JSON.parse(val));
      } catch {
        return false;
      }
    }

    return !!val;
  };

  const getNormalizedType = (ad, cube = null) => {
    const t1 = String(ad?.type || '').toLowerCase();
    const t2 = String(cube?.type || ad?.cube?.type || '').toLowerCase();
    const ct = String(cube?.content_type || ad?.content_type || '').toLowerCase();

    if (
      normalizeBoolLike(ad?.is_information) ||
      normalizeBoolLike(ad?.cube?.is_information) ||
      normalizeBoolLike(cube?.is_information)
    ) {
      return 'information';
    }

    if (
      t1 === 'information' ||
      t2 === 'information' ||
      ['kubus-informasi', 'information', 'informasi'].includes(ct)
    ) {
      return 'information';
    }

    if (
      t1 === 'voucher' ||
      normalizeBoolLike(ad?.is_voucher) ||
      normalizeBoolLike(ad?.voucher)
    ) {
      return 'voucher';
    }

    if (
      t1 === 'iklan' ||
      t2 === 'iklan' ||
      normalizeBoolLike(ad?.is_advertising) ||
      normalizeBoolLike(ad?.advertising)
    ) {
      return 'iklan';
    }

    return 'promo';
  };

  const buildPromoLink = (ad, cube = null, currentCommunityId = null) => {
    const id = ad?.id ?? null;

    const actualCube = cube || ad?.cube;
    const contentType = String(actualCube?.content_type || ad?.content_type || '').toLowerCase();
    const typeStr = String(ad?.type || actualCube?.type || '').toLowerCase();

    const isInformation =
      normalizeBoolLike(actualCube?.is_information) ||
      normalizeBoolLike(ad?.is_information) ||
      contentType === 'information' ||
      contentType === 'kubus-informasi' ||
      typeStr === 'information' ||
      typeStr === 'informasi';

    if (isInformation) {
      const code = actualCube?.code || ad?.code;
      const params = new URLSearchParams();

      if (code) params.append('code', code);
      if (currentCommunityId) params.append('communityId', currentCommunityId);

      return code
        ? `/app/kubus-informasi/kubus-infor?${params.toString()}`
        : '#';
    }

    if (id) {
      const cat = String(ad?.ad_category?.name || '').toLowerCase();

      if (
        typeStr === 'iklan' ||
        cat === 'advertising' ||
        ad?.is_advertising === true ||
        ad?.advertising === true
      ) {
        return `/app/iklan/${id}${currentCommunityId ? `?communityId=${currentCommunityId}` : ''}`;
      }

      return `/app/komunitas/promo/${id}${currentCommunityId ? `?communityId=${currentCommunityId}` : ''}`;
    }

    const cubeCode = actualCube?.code;

    if (cubeCode) {
      const params = new URLSearchParams();
      params.append('code', cubeCode);

      if (currentCommunityId) {
        params.append('communityId', currentCommunityId);
      }

      return `/app/kubus-informasi/kubus-infor?${params.toString()}`;
    }

    return '#';
  };

  const normalizePromos = (arr = []) => {
    const promos = [];

    (Array.isArray(arr) ? arr : []).forEach((p, index) => {
      if (Array.isArray(p.ads) && p.ads.length > 0) {
        p.ads.forEach((ad) => {
          if (!ad?.id) return;

          const raw =
            ad?.image_1 ||
            ad?.image ||
            ad?.picture_source ||
            p.image_url ||
            p.image ||
            p.image_path ||
            FALLBACK_IMAGE;

          promos.push({
            id: ad.id,
            cube_id: p.id,
            title: ad?.title ?? p.title ?? p.name ?? 'Promo',
            merchant: ad?.merchant ?? p.community?.name ?? 'Merchant',
            distance: p.distance ?? '0 KM',
            location: p.location ?? p.community?.location ?? 'Location',
            image: buildImageUrl(raw),
            created_at: ad?.created_at ?? p.created_at,
            updated_at: ad?.updated_at ?? p.updated_at,
            type: ad?.type,
            ad_category: ad?.ad_category,
            is_advertising: ad?.is_advertising,
            advertising: ad?.advertising,
            code: ad?.code ?? p.code,
            is_information: ad?.is_information ?? p.is_information,
            content_type: ad?.content_type ?? p.content_type,
            is_voucher: ad?.is_voucher ?? p.is_voucher,
            rawCube: p,
            cube: ad?.cube || p || null,
            ad,
          });
        });
      } else {
        const raw = p.image_url || p.image || p.image_path || FALLBACK_IMAGE;

        promos.push({
          id: p.id ?? `promo-${index}`,
          title: p.title ?? p.name ?? 'Promo',
          merchant: p.community?.name ?? 'Merchant',
          distance: p.distance ?? '0 KM',
          location: p.location ?? 'Location',
          image: buildImageUrl(raw),
          created_at: p.created_at,
          updated_at: p.updated_at,
          type: p.type,
          ad_category: p.ad_category,
          is_advertising: p.is_advertising,
          advertising: p.advertising,
          code: p.code,
          is_information: p.is_information,
          content_type: p.content_type,
          is_voucher: p.is_voucher,
          rawCube: p,
          cube: p,
          ad: null,
        });
      }
    });

    promos.sort((a, b) => {
      const ta = new Date(a.updated_at || a.created_at || 0).getTime() || 0;
      const tb = new Date(b.updated_at || b.created_at || 0).getTime() || 0;
      return tb - ta;
    });

    return promos;
  };

  const handlePromoClick = (promo) => {
    if (!promo?.id) return;

    const ad = promo?.ad || promo;
    const cube = promo?.rawCube || promo?.cube;

    const link = buildPromoLink(ad, cube, communityId);
    router.push(link);
  };

  useEffect(() => {
    if (communityId) {
      fetchCommunityData();
      fetchPromoData();
      fetchWidgetData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const fetchCommunityData = async () => {
    try {
      const res = await fetch(`${apiUrl}/communities/${communityId}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setCommunityData(null);
        return;
      }

      const json = await res.json();
      const community = json.data || json;

      setCommunityData({
        id: community.id,
        name: community.name || 'Komunitas',
        location: community.location || 'Location',
        bg_color_1: community.bg_color_1 ?? null,
        bg_color_2: community.bg_color_2 ?? null,
      });
    } catch (error) {
      console.error(error);
      setCommunityData(null);
    }
  };

  const fetchPromoData = async () => {
    try {
      const headers = getAuthHeaders();
      const base = apiUrl.replace(/\/api\/?$/, '');

      const tryJson = async (url, init) => {
        try {
          const r = await fetch(url, init);
          if (!r.ok) return null;

          const j = await r.json();
          return Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
        } catch {
          return null;
        }
      };

      const adminPromo = await tryJson(
        `${apiUrl}/communities/${communityId}/promos`,
        {
          headers,
        }
      );

      const publicPromo = adminPromo?.length
        ? null
        : await tryJson(`${base}/communities/${communityId}/promos`, {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            mode: 'cors',
          });

      const aliasPromo = adminPromo?.length || publicPromo?.length
        ? null
        : await tryJson(`${apiUrl}/communities/${communityId}/promos`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

      const mergedPromo = [
        ...(adminPromo || []),
        ...(publicPromo || []),
        ...(aliasPromo || []),
      ].filter(Boolean);

      if (!mergedPromo.length) {
        setPromoData([]);
        return;
      }

      const mapById = new Map();

      mergedPromo.forEach((p) => {
        if (p?.id != null) {
          mapById.set(p.id, p);
        }
      });

      const dedupedPromo = [...mapById.values()].sort((a, b) => {
        const ta = new Date(a.updated_at || a.created_at || 0).getTime() || 0;
        const tb = new Date(b.updated_at || b.created_at || 0).getTime() || 0;

        if (tb !== ta) return tb - ta;

        const ia = Number(a.id);
        const ib = Number(b.id);

        if (!Number.isNaN(ia) && !Number.isNaN(ib)) {
          return ib - ia;
        }

        return 0;
      });

      setPromoData(normalizePromos(dedupedPromo));
    } catch (error) {
      console.error('Error fetching promo data:', error);
      setPromoData([]);
    }
  };

  const fetchWidgetData = async () => {
    try {
      const headers = getAuthHeaders();
      const apiBase = apiUrl.replace(/\/api\/?$/, '');

      setAuthHeaders(headers);

      const res = await fetch(
        `${apiBase}/api/admin/dynamic-content?type=hunting&community_id=${communityId}`,
        {
          headers,
        }
      );

      if (!res.ok) {
        setWidgetData([]);
        setAdCategories([]);
        return;
      }

      const json = await res.json();

      let widgets = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];

      widgets = widgets
        .filter((w) => {
          const type = String(w.type || '').toLowerCase();

          return (
            type === 'promo' ||
            type === 'hunting' ||
            type === 'iklan' ||
            type === 'advertising'
          );
        })
        .filter((w) => w?.is_active)
        .sort((a, b) => (a.level || 0) - (b.level || 0));

      const categoryBoxWidgets = widgets.filter(
        (w) =>
          w.source_type === 'category_box' ||
          w.content_type === 'category_box' ||
          w.source_type === 'ad_category' ||
          w.content_type === 'ad_category' ||
          w.content_type === 'category'
      );

      if (categoryBoxWidgets.length > 0) {
        const adCatRes = await fetch(
          `${apiBase}/api/admin/options/ad-category?community_id=${communityId}&full=1`,
          {
            headers,
          }
        );

        if (adCatRes.ok) {
          const adCatJson = await adCatRes.json();

          const adCats = Array.isArray(adCatJson?.data)
            ? adCatJson.data
            : Array.isArray(adCatJson)
              ? adCatJson
              : [];

          setAdCategories(adCats);
        }
      }

      setWidgetData(widgets);
    } catch (error) {
      console.error(error);
      setWidgetData([]);
      setAdCategories([]);
    }
  };

  const getCommunityGradient = (bgColor1, bgColor2) => {
    if (bgColor1 && bgColor2) {
      return {
        backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`,
      };
    }

    if (bgColor1) {
      return {
        backgroundImage: `linear-gradient(135deg, ${bgColor1}, ${bgColor1}dd)`,
      };
    }

    return {
      backgroundImage: 'linear-gradient(135deg, #16a34a, #059669)',
    };
  };

  const WidgetRenderer = ({ widget, communityId: currentCommunityId }) => {
    const { dynamic_content_cubes, name, size } = widget;

    if (!dynamic_content_cubes?.length) return null;

    return (
      <div className="mb-6">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">{name}</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {dynamic_content_cubes.map((cubeData, index) => {
            const cube = cubeData?.cube;
            const ad = cubeData?.ad || cube?.ads?.find(Boolean) || null;

            if (!cube) return null;

            const hasImage = !!(cube.picture_source || cube.image || cube.image_1);

            if (!ad && !hasImage) return null;

            const handleClick = () => {
              const link = buildPromoLink(ad, cube, currentCommunityId);
              router.push(link);
            };

            return (
              <KomunitasCard
                key={`promo-${ad?.id || cube?.id || index}`}
                item={{ ad, cube }}
                size={size || 'M'}
                onClick={handleClick}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const PromoCard = ({ promo }) => (
    <div
      className="bg-white/20 backdrop-blur-md rounded-[16px] shadow-lg overflow-hidden mb-4 hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/30"
      onClick={() => handlePromoClick(promo)}
      style={{ minWidth: 220 }}
    >
      <div className="flex p-4 items-center">
        <div className="w-28 h-28 rounded-[12px] overflow-hidden flex-shrink-0 bg-white/10">
          <Image
            unoptimized
            key={promo.image}
            src={promo.image || FALLBACK_IMAGE}
            alt={promo.title}
            width={112}
            height={112}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 ml-4 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 mb-1 drop-shadow-sm">
            {promo.title}
          </h3>

          <p className="text-sm text-white/90 line-clamp-1 drop-shadow-sm">
            {promo.merchant}
          </p>
        </div>
      </div>
    </div>
  );

  const filteredPromoData = promoData.filter((promo) => {
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();

    return (
      String(promo?.title || '').toLowerCase().includes(q) ||
      String(promo?.merchant || '').toLowerCase().includes(q)
    );
  });

  const communityBgStyle = getCommunityGradient(
    communityData?.bg_color_1,
    communityData?.bg_color_2
  );

  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-background min-h-screen w-full relative z-20 bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-primary rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative lg:mx-auto lg:max-w-md min-h-screen"
      style={typeof communityBgStyle === 'object' ? communityBgStyle : {}}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-0 pointer-events-none" />

      <div className="px-6 pb-24 relative z-10">
        <div className="pt-6" />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white drop-shadow-sm mb-3">
            Promo Komunitas
          </h1>

          <div className="bg-white/20 backdrop-blur-md p-3 rounded-lg shadow-sm border border-white/30 flex items-center">
            <FontAwesomeIcon icon={faSearch} className="text-white/80 mr-3" />

            <input
              type="text"
              placeholder="Cari promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-white placeholder-white/70 bg-transparent outline-none"
            />
          </div>
        </div>

        <div className="lg:mx-auto lg:max-w-md">
          {widgetData.length > 0 && (
            <div className="mb-6">
              {widgetData
                .sort((a, b) => (a.level || 0) - (b.level || 0))
                .map((widget) => (
                  <WidgetRenderer
                    key={widget.id}
                    widget={widget}
                    communityId={communityId}
                  />
                ))}
            </div>
          )}

          {filteredPromoData.length > 0 && (
            <div className="mb-6">
              <div className="mb-2">
                <h2 className="text-lg font-bold text-white">Promo Terbaru</h2>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                {filteredPromoData.map((promo) => (
                  <div
                    key={promo.id}
                    className="flex-shrink-0"
                  >
                    <PromoCard promo={promo} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CommunityBottomBar
        active="promo"
        communityId={communityId}
      />
    </div>
  );
};

export default CommunityPromoPage;