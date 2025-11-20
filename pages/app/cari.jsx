/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import {
  faGlobe,
  faLocationDot,
  faMagnifyingGlass,
  faSort,
} from '@fortawesome/free-solid-svg-icons';
import {
  InputComponent,
  SelectComponent,
} from '../../components/base.components';
import { useGet, useLazySearch } from '../../helpers';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { distanceConvert } from '../../helpers/distanceConvert.helpers';

export default function Cari() {
  const [keywordSearch, setKeywordSearch] = useState('');
  const [search] = useLazySearch(keywordSearch);
  const [map, setMap] = useState(null);
  const [sort, setSort] = useState('created_at');
  const router = useRouter();
  const { cari, berdasarkan } = router.query;

  // === Helpers gambar (samakan dengan Home) ===
  const toAbs = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url; // sudah absolut
    return `http://localhost:8000/${url.replace(/^\/+/, '')}`; // storage/... -> absolut
  };
  const getAdImage = (ad) => {
    const candidates = [
      ad?.image_1,
      ad?.image_2,
      ad?.image_3,
      ad?.picture_source,
      ad?.picture_url,
      ad?.thumbnail,
      ad?.image_url,
      ad?.images?.[0]?.url,
      ad?.pictures?.[0]?.source,
      ad?.cube?.ads?.[0]?.picture_source,
    ];
    const raw = candidates.find(Boolean);
    return toAbs(raw);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMap({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingAds, codeAds, dataAds] = useGet({
    path:
      map && (search || sort == 'distance')
        ? `ads/${map?.lat}/${map?.lng}`
        : null,
    params: {
      search: search,
      sortBy: sort,
      sortDirection: sort == 'created_at' ? 'DESC' : 'ASC',
    },
  });

  useEffect(() => {
    setKeywordSearch(cari);
  }, [cari]);

  useEffect(() => {
    setSort(berdasarkan == 'Terdekat' ? 'distance' : 'created_at');
  }, [berdasarkan]);

  const normalizeBoolLike = (val) => {
    if (val === true || val === 1) return true;
    if (typeof val === 'number') return val === 1;
    if (Array.isArray(val)) {
      return (
        val.length > 0 &&
        (val.includes(1) || val.includes('1') || val.includes(true))
      );
    }
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      if (['1', 'true', 'y', 'yes', 'ya', 'iya', 'on'].includes(s)) return true;
      if (['0', 'false', 'n', 'no', 'off', ''].includes(s)) return false;
      try {
        const j = JSON.parse(val);
        return normalizeBoolLike(j);
      } catch { }
    }
    return !!val;
  };

  const getIsInformation = (ad) => {
    const cubeInfo = normalizeBoolLike(ad?.cube?.is_information);
    const adInfo = normalizeBoolLike(ad?.is_information);
    const contentType = String(ad?.cube?.content_type || ad?.content_type)
      .toLowerCase();
    const contentTypeInfo = contentType === 'kubus-informasi';
    const typeStr = String(ad?.type || ad?.cube?.type || '').toLowerCase();
    const looksInfoType = ['information', 'informasi'].includes(typeStr);
    return cubeInfo || adInfo || contentTypeInfo || looksInfoType;
  };

  const isPromoOnly = (ad) => {
    // 1) Exclude informasi
    if (getIsInformation(ad)) return false;

    // 2) Exclude voucher
    const typeStr = String(ad?.type || '').toLowerCase();
    if (typeStr === 'voucher') return false;

    // 3) Exclude iklan advertising
    const rawCat = (ad?.ad_category?.name || '').toLowerCase();
    if (rawCat === 'advertising') return false;

    // 4) Exclude promo online
    const isOnline = normalizeBoolLike(ad?.is_online) || ad?.is_online === 'online' || ad?.type === 'online' || ad?.location_type === 'online' || ad?.promo_type === 'online' || ad?.category === 'online' ||
      normalizeBoolLike(ad?.cube?.is_online) || ad?.cube?.is_online === 'online' || ad?.cube?.type === 'online' || ad?.cube?.location_type === 'online' || ad?.cube?.promo_type === 'online' || ad?.cube?.category === 'online';
    const isOffline = !isOnline;
    if (!isOffline) return false;

    return true;
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary w-full h-16"></div>

        <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20 pb-20">
          <div className="relative -top-7 px-2">
            <div className="bg-white w-full rounded-xl">
              <InputComponent
                placeholder="mau cari promo apa?..."
                rightIcon={faMagnifyingGlass}
                size="lg"
                onChange={(e) => setKeywordSearch(e)}
                value={keywordSearch}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <SelectComponent
                  placeholder="Urutkan..."
                  options={[
                    {
                      label: 'Terbaru',
                      value: 'created_at',
                    },
                    {
                      label: 'Terdekat',
                      value: 'distance',
                    },
                  ]}
                  value={sort}
                  onChange={(e) => setSort(e)}
                  size="sm"
                  leftIcon={faSort}
                />
              </div>
            </div>
          </div>

          <div className="px-4 -mt-2">
            {!loadingAds && (search || sort == 'distance') && (
              <div className="flex justify-between items-center gap-2">
                <div>
                  <p className="font-semibold">Hasil Pencarian</p>
                  <p className="text-xs text-slate-500">
                    Hasil relevan dengan pencarianmu...
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-4">
              {!loadingAds && (search || sort == 'distance') ? (
                dataAds?.data
                  ?.filter(isPromoOnly)
                  ?.map((item, key) => {
                    // Untuk konsistensi, gunakan routing promo langsung
                    const promoUrl = `/app/komunitas/promo/${item?.id}?source=search`;
                    const thumb = getAdImage(item);

                    return (
                      <Link href={promoUrl} key={key}>
                        <div className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative bg-white bg-opacity-40 backdrop-blur-sm">
                          <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-200 flex justify-center items-center">
                            {thumb ? (
                              <img
                                src={thumb}
                                height={700}
                                width={700}
                                alt={item?.title || "Promo"}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center text-slate-400 text-xs"
                              style={{ display: thumb ? 'none' : 'flex' }}
                            >
                              No Image
                            </div>
                          </div>
                          <div className="col-span-3">
                            <p className="font-semibold limit__line__1">
                              {item?.title}
                            </p>
                            <p className="text-slate-600 text-xs my-1 limit__line__2">
                              {item?.cube?.address}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <p className="text-xs text-slate-600 limit__line__1">
                                <FontAwesomeIcon icon={faLocationDot} />.{' '}
                                {distanceConvert(item?.distance)}
                              </p>
                              <p className="text-xs"> | </p>
                              <p className="text-xs text-slate-600 limit__line__1">
                                <FontAwesomeIcon icon={faGlobe} />.{' '}
                                {item?.cube?.world?.name || 'General'}
                              </p>
                              {item?.cube?.world_affiliate_id && (
                                <>
                                  <p className="text-xs"> | </p>
                                  <p className="text-xs text-slate-600 font-semibold limit__line__1 p-1">
                                    Affiliate
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          {/* <div className="absolute top-5 left-0 bg-white bg-opacity-50 backdrop-blur-md min-h-[20px] py-1 pl-2 pr-3 rounded-r-full flex gap-2 items-center">
                          <CubeComponent
                            size={9}
                            color={`${item?.cube?.cube_type?.color}`}
                          />
                          <p className="text-xs">
                            {item?.cube?.cube_type?.code}
                          </p>
                        </div> */}
                        </div>
                      </Link>
                    );
                  })
              ) : (
                <>
                  <div className="text-center">Isi kolom pencarian dulu...</div>
                </>
              )}
            </div>
          </div>
        </div>

        <BottomBarComponent active={'home'} />
      </div>
    </>
  );
}
