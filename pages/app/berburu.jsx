/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightArrowLeft,
  faChevronDown,
  faChevronRight,
  faChevronUp,
  faCrosshairs,
  faEarthAsia,
  faExpand,
  faGlobe,
  faIcons,
  faLocationDot,
  faLock,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { GoogleMap, InfoBox, useJsApiLoader } from '@react-google-maps/api';
import { useGet } from '../../helpers';
import {
  ButtonComponent,
  FloatingPageComponent,
} from '../../components/base.components';
import Link from 'next/link';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import CubeComponent from '../../components/construct.components/CubeComponent';
import { distanceConvert } from '../../helpers/distanceConvert.helpers';
import MenuCubePage from '../../components/construct.components/partial-page/MenuCube.page';
import MenuAdPage from '../../components/construct.components/partial-page/MenuAd.page';

// Helper functions
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
      const j = JSON.parse(val);
      return normalizeBoolLike(j);
    } catch { }
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

const buildPromoLink = (ad) => {
  const id = ad?.id || ad?.ad_id;
  const contentType = String(ad?.cube?.content_type || ad?.content_type || '').toLowerCase();
  const typeStr = String(ad?.type || ad?.cube?.type || '').toLowerCase();
  const isInformation =
    normalizeBoolLike(ad?.cube?.is_information) ||
    normalizeBoolLike(ad?.is_information) ||
    contentType === 'information' ||
    contentType === 'kubus-informasi' ||
    typeStr === 'information' ||
    typeStr === 'informasi';

  if (isInformation) {
    const code = ad?.cube?.code || ad?.code;
    return code ? `/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(code)}` : '#';
  }

  if (id) {
    const cat = String(ad?.ad_category?.name || '').toLowerCase();
    if (
      typeStr === 'iklan' ||
      cat === 'advertising' ||
      ad?.is_advertising === true ||
      ad?.advertising === true
    ) {
      return `/app/iklan/${id}?source=berburu`;
    }
    return `/app/komunitas/promo/${id}?source=berburu`;
  }

  const cubeCode = ad?.cube?.code;
  return cubeCode ? `/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(cubeCode)}` : '#';
};

const getNormalizedType = (ad) => {
  const t1 = String(ad?.type || '').toLowerCase();
  const t2 = String(ad?.cube?.type || '').toLowerCase();
  const ct = String(ad?.cube?.content_type || ad?.content_type || '').toLowerCase();

  if (normalizeBoolLike(ad?.is_information) || normalizeBoolLike(ad?.cube?.is_information)) return 'information';
  if (t1 === 'information' || t2 === 'information' || ct === 'kubus-informasi') return 'information';
  if (t1 === 'voucher' || normalizeBoolLike(ad?.is_voucher) || normalizeBoolLike(ad?.voucher)) return 'voucher';
  if (t1 === 'iklan' || t2 === 'iklan' || normalizeBoolLike(ad?.is_advertising) || normalizeBoolLike(ad?.advertising)) return 'iklan';
  return 'promo';
};

export default function Berburu() {
  // Helper functions from index.jsx

  const getAdImage = (ad) =>
    ad?.image_1 || ad?.image_2 || ad?.image_3 || ad?.picture_source || '';

  const getCategoryLabel = (ad) => {
    const t = getNormalizedType(ad);
    if (t === 'information') return 'Informasi';
    if (t === 'voucher') return 'Voucher';
    if (t === 'iklan') return 'Advertising';
    return 'Promo';
  };

  const isPromoOnly = (ad) => {
    if (getIsInformation(ad)) return false;
    const typeStr = String(ad?.type || '').toLowerCase();
    const cat = String(ad?.ad_category?.name || '').toLowerCase();
    if (
      typeStr === 'voucher' ||
      cat === 'voucher' ||
      ad?.is_voucher === true ||
      ad?.voucher === true
    ) return false;
    if (
      typeStr === 'iklan' ||
      cat === 'advertising' ||
      ad?.is_advertising === true ||
      ad?.advertising === true
    ) return false;
    return true;
  };

  const [expands, setExpands] = useState([]);
  const [map, setMap] = useState(null);
  const [mapZoom, setMapZoom] = useState(false);
  const [refreshMap, setRefreshMap] = useState(false);
  const [modalWorld, setModalWorld] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMap({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => { },
        { enableHighAccuracy: true }
      );
    }
  }, [refreshMap]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingMenu, codeMenu, dataMenu] = useGet({
    path: `dynamic-content?type=hunting${selectedWorld ? `&world_id=${selectedWorld?.id}` : ''
      }`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [
    loadingPrimaryCategories,
    codePrimaryCategories,
    dataPrimaryCategories,
  ] = useGet({
    path: `primary-category`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingAds, codeAds, dataAds] = useGet({
    path: map
      ? `ads/${map?.lat}/${map?.lng}${selectedWorld ? `?world_id=${selectedWorld?.id}` : ''
      }`
      : null,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingChildCategories, codeChildCategories, dataChildCategories] =
    useGet({
      path: `categories${selectedWorld ? `?world_id=${selectedWorld?.id}` : ''
        }`,
    });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingWorlds, codeWorlds, dataWorlds] = useGet({
    path: `worlds`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingNear, codeNear, dataNear] = useGet({
    path: map
      ? `ads/promo-nearest/${map?.lat}/${map?.lng}${selectedWorld ? `?world_id=${selectedWorld?.id}` : ''
      }`
      : '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCategories, codeCategories, dataCategories] = useGet({
    path: `ads-category`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingRecommendation, codeRecommendation, dataRecommendation] =
    useGet({
      path: `ads/promo-recommendation${selectedWorld ? `?world_id=${selectedWorld?.id}` : ''
        }`,
    });

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50">
        <div
          className={`bg-primary w-full h-[240px] p-4`}
          style={{
            backgroundColor: selectedWorld?.color || '',
          }}
        >
          <div
            className="flex items-center"
            onClick={() => {
              setModalWorld(true);
            }}
          >
            <div className="w-16 h-16 bg-slate-200  bg-opacity-50 rounded-full flex justify-center items-center">
              <FontAwesomeIcon
                icon={faEarthAsia}
                className="text-5xl text-white"
              />
            </div>
            <div className="w-11/12 -ml-4 py-2.5 bg-slate-200 text-white bg-opacity-40 rounded-r-full flex justify-between">
              <p></p>
              <p className="text-center text-lg font-semibold">
                {selectedWorld ? selectedWorld?.name : 'Dunia HUEHUY'}
              </p>
              <p className="text-center text-lg pr-4">
                <FontAwesomeIcon icon={faArrowRightArrowLeft} />
              </p>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-[15px] mt-4 max-h-[195px] relative w-full ">
            <div className="-mb-10">
              <MapWithAMarker
                googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyBLjp3NfOdkLbKJ85DFBg3CCQuIoKEzVZc&v=3.exp&libraries=geometry,drawing,places"
                loadingElement={<div style={{ height: `300px` }} />}
                containerElement={<div style={{ height: `300px` }} />}
                mapElement={<div style={{ height: `250px` }} />}
                position={map}
                dataAds={dataAds?.data}
              />
            </div>
            <div
              className="absolute top-0 left-0 w-full py-2.5 bg-white text-center font-semibold text-primary shadow-md"
              style={{
                color: selectedWorld?.color || '',
              }}
            >
              Peta Berburu Promo
            </div>

            <div
              className="absolute bottom-4 right-4 w-8 h-8 bg-white flex items-center justify-center rounded-lg"
              onClick={() => setMapZoom(true)}
            >
              <FontAwesomeIcon icon={faExpand} className="text-xl" />
            </div>
            <div
              className="absolute bottom-4 left-4 w-8 h-8 bg-white flex items-center justify-center rounded-lg"
              onClick={() => setRefreshMap(!refreshMap)}
            >
              <FontAwesomeIcon icon={faCrosshairs} className="text-xl" />
            </div>
          </div>
        </div>

        <div className="px-4 mt-20">
          <div className="relative mb-6">
            <Link href="/app/cari">
              <div className="w-full bg-white border border__primary px-6 py-4 rounded-[20px] flex justify-between items-center">
                <p>Mulai mencari promo disini...</p>
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text__primary"
                />
              </div>
            </Link>
          </div>
          {dataMenu?.data?.map((menu, key) => {
            if (menu.content_type == 'category' && menu.is_active) {
              return (
                <div className="px-4" key={key}>
                  <div className="grid grid-cols-4 gap-7">
                    {dataPrimaryCategories?.data?.map((category, key) => {
                      return (
                        <Link
                          href={`/app/cari?cari=${category?.name}`}
                          key={key}
                        >
                          <div className="w-full aspect-square bg-slate-400 rounded-[12px] relative overflow-hidden flex justify-center items-center">
                            <img
                              src={category?.picture_source}
                              height={1000}
                              width={1000}
                              alt=""
                              className="h-full aspect-square brightness-90"
                            />
                            <div className="absolute bottom-0 left-0 w-full text-center bg-white bg-opacity-40 backdrop-blur-md py-2 text-xs">
                              {category?.name}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    <Link href={`/app/category`}>
                      <div className="w-full aspect-square bg-primary rounded-[12px] relative overflow-hidden flex justify-center items-center">
                        {dataPrimaryCategories?.other_category_icon
                          ?.picture_source ? (
                          <img
                            src={
                              dataPrimaryCategories?.other_category_icon
                                ?.picture_source
                            }
                            height={1000}
                            width={1000}
                            alt=""
                            className="h-full aspect-square brightness-90"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faIcons}
                            className="text-5xl text-teal-100"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 w-full text-center bg-white bg-opacity-40 backdrop-blur-md py-2 text-xs">
                          Lainnya
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            } else if (menu.content_type == 'nearby' && menu.is_active) {
              return (
                <div className="mt-8" key={key}>
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <p className="font-semibold">{menu.name}</p>
                      <p className="text-xs text-slate-500">
                        {menu.description}
                      </p>
                    </div>
                    <Link href={`/app/cari?berdasarkan=Terdekat`}>
                      <div className="text-sm text-primary font-semibold">
                        Lainnya
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="ml-2"
                        />
                      </div>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    {dataNear?.data?.filter(item => isPromoOnly(item)).map((item, key) => {
                      const img = getAdImage(item);
                      return (
                        <Link href={buildPromoLink(item)} key={key}>
                          <div className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative bg-white bg-opacity-40 backdrop-blur-sm">
                            <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                              <img
                                src={img}
                                height={700}
                                width={700}
                                alt=""
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="col-span-3">
                              <p className="font-semibold">{item?.title}</p>
                              <p className="text-slate-600 text-xs my-1 limit__line__2">
                                {item?.cube?.address}
                              </p>
                              <div className="flex gap-2 mt-2 items-center">
                                <p className="text-xs text-slate-600 limit__line__1">
                                  <FontAwesomeIcon icon={faLocationDot} />.{' '}
                                  {distanceConvert(item?.distance)}
                                </p>
                                <p className="text-xs"> | </p>
                                <p className="text-xs text-slate-600 font-semibold limit__line__1 p-1">
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
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            } else if (
              menu.content_type == 'recommendation' &&
              menu.is_active
            ) {
              return (
                <>
                  <div className="mt-6" key={key}>
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <p className="font-semibold">{menu.name}</p>
                        <p className="text-xs text-slate-500">
                          {menu.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2 pb-20">
                    <div className="flex flex-nowrap gap-4 w-max">
                      {dataRecommendation?.data?.filter(item => isPromoOnly(item)).map((item, key) => {
                        const img = getAdImage(item);
                        return (
                          <Link href={buildPromoLink(item)} key={key}>
                            <div className="relative snap-center w-[330px] shadow-sm bg-white bg-opacity-40 backdrop-blur-sm rounded-[14px] overflow-hidden p-3">
                              <div className="aspect-[6/3] bg-slate-400 rounded-[14px] overflow-hidden brightness-90 flex items-center justify-center">
                                <img
                                  src={img}
                                  height={1200}
                                  width={600}
                                  alt=""
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div className="px-1">
                                <p className="font-semibold mt-2 limit__line__1">
                                  {item?.title}
                                </p>
                                <div className="flex justify-between items-start gap-4">
                                  <p className="text-slate-600 text-xs my-1 limit__line__2">
                                    {item?.cube?.address}
                                    {item?.cube?.is_information && (
                                      <p className="text-primary bg-green-200 text-sm whitespace-nowrap px-1 rounded-md mt-1">
                                        Informasi
                                      </p>
                                    )}
                                  </p>

                                  {(item?.total_remaining ||
                                    item?.max_grab) && (
                                      <p className="text-danger bg-red-200 text-sm whitespace-nowrap px-1 rounded-md mt-1">
                                        Sisa{' '}
                                        {item?.total_remaining || item?.max_grab}
                                      </p>
                                    )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            } else if (menu.content_type == 'ad_category' && menu.is_active) {
              return (
                <>
                  {dataCategories?.data?.map((category, key) => {
                    return (
                      <div className="mt-8" key={key}>
                        <div className="flex justify-between items-center gap-4">
                          <div className="w-full max-w-[75%]">
                            <p className="font-semibold">{category?.name}</p>
                            {category?.child_categories?.at(0) && (
                              <div className="w-full pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2">
                                <div className="flex flex-nowrap gap-2 w-max">
                                  <ButtonComponent size="xs" label="Semua" />
                                  {category?.child_categories?.map(
                                    (child, child_key) => {
                                      return (
                                        <Link
                                          href={`/app/cari?cari=${child?.name}`}
                                          key={child_key}
                                        >
                                          <ButtonComponent
                                            size="xs"
                                            label={child?.name}
                                            variant="simple"
                                          />
                                        </Link>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <Link href={`/app/category`}>
                            <div className="w-full aspect-square bg-primary rounded-[12px] relative overflow-hidden flex justify-center items-center">
                              <div className="absolute bottom-0 left-0 w-full text-center bg-white bg-opacity-40 backdrop-blur-md py-2 text-xs">
                                Lainnya
                              </div>
                            </div>
                          </Link>
                        </div>

                        <div className="flex flex-col gap-4 mt-4">
                          {category?.ads?.filter(ad => isPromoOnly(ad)).map((ad, ad_key) => {
                            const img = getAdImage(ad);
                            return (
                              <Link
                                href={buildPromoLink(ad)}
                                key={ad_key}
                              >
                                <div className="relative">
                                  <div className="aspect-[4/3] bg-slate-400 rounded-[20px] overflow-hidden brightness-90 flex items-center justify-center">
                                    <img
                                      src={img}
                                      height={1200}
                                      width={600}
                                      alt=""
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <div className="absolute bottom-4 w-full px-4">
                                    <div className="bg-white bg-opacity-50 backdrop-blur-md min-h-[60px] rounded-[15px]">
                                      <div className="px-6 p-4">
                                        <p className="font-semibold limit__line__1">
                                          {ad?.title}
                                        </p>
                                        <div className="flex justify-between gap-4 items-start">
                                          <p className="text-slate-600 text-sm font-medium my-1 limit__line__2">
                                            {ad?.cube?.address}
                                          </p>
                                          {(ad?.total_remaining ||
                                            ad?.max_grab) && (
                                              <p className="text-danger bg-red-100 bg-opacity-70 text-sm whitespace-nowrap px-1 rounded-md mt-1">
                                                Sisa{' '}
                                                {ad?.total_remaining ||
                                                  ad?.max_grab}
                                              </p>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            } else if (
              (menu.content_type == 'vertical' ||
                menu.content_type == 'horizontal') &&
              menu.is_active
            ) {
              if (
                menu.source_type == 'cube' ||
                menu.source_type == 'shuffle_cube'
              ) {
                return <MenuCubePage menu={menu} key={key} />;
              } else {
                return <MenuAdPage menu={menu} key={key} />;
              }
            }
          })}
        </div>

        <FloatingPageComponent
          show={mapZoom}
          title="Peta Berburu Promo"
          onClose={() => setMapZoom(false)}
        >
          <div className="mt-2 relative">
            <MapWithAMarker
              googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyBLjp3NfOdkLbKJ85DFBg3CCQuIoKEzVZc&v=3.exp&libraries=geometry,drawing,places"
              loadingElement={<div style={{ height: `800px` }} />}
              containerElement={<div style={{ height: `800px` }} />}
              mapElement={<div style={{ height: `800px` }} />}
              position={map}
              dataAds={dataAds?.data}
            />

            <div
              className="absolute top-4 right-4 w-12 h-12 bg-white flex items-center justify-center rounded-lg"
              onClick={() => setRefreshMap(!refreshMap)}
            >
              <FontAwesomeIcon icon={faCrosshairs} className="text-2xl" />
            </div>
          </div>
        </FloatingPageComponent>

        <BottomBarComponent active={'hunting'} />
      </div>

      <BottomSheetComponent
        show={modalWorld}
        onClose={() => {
          setModalWorld(false);
        }}
        title="Pilih Dunia"
        height={300}
      >
        <div className="px-3 flex flex-col gap-3">
          <div
            className="bg-white px-5 py-3 shadow-sm rounded-lg"
            onClick={() => {
              setSelectedWorld(null);
              setModalWorld(false);
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold">Dunia Huehuy</div>
                <div>Dunia umum huehuy</div>
              </div>
              <div>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </div>
          </div>
          {dataWorlds?.data?.map((item, key) => {
            return (
              <div
                className={`${item?.active || item?.type != 'lock'
                  ? 'bg-white'
                  : 'bg-slate-200 pointer-events-none'
                  } px-5 py-3 shadow-sm rounded-lg`}
                key={key}
                onClick={() => {
                  setSelectedWorld(item);
                  setModalWorld(false);
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-semibold">{item?.name}</div>
                    <div>Dunia khusus untuk anggota {`"${item?.name}"`}</div>
                  </div>
                  <div>
                    {item?.active || item?.type != 'lock' ? (
                      <FontAwesomeIcon icon={faChevronRight} />
                    ) : (
                      <FontAwesomeIcon icon={faLock} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </BottomSheetComponent>
    </>
  );
}

function MapWithAMarker({ position, dataAds }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyD74gvRdtA7NAo4j8ENoOsdy3QGXU6Oklc', // API key baru
    libraries: ['places'],
  });

  if (!isLoaded) return <div style={{ height: '250px' }}>Loading...</div>;

  return (
    <GoogleMap
      center={position ? position : { lat: -6.905977, lng: 107.613144 }}
      zoom={9}
      mapContainerStyle={{ height: '250px', width: '100%' }}
      options={{
        streetViewControl: false,
        fullscreenControl: false,
        disableDefaultUI: true,
        keyboardShortcuts: false,
      }}
    >
      {dataAds?.map((ad, key) => (
        <InfoBox
          position={{
            lat: ad?.cube?.map_lat,
            lng: ad?.cube?.map_lng,
          }}
          options={{ closeBoxURL: '', enableEventPropagation: true }}
          key={key}
        >
          <Link href={buildPromoLink(ad)}>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 bg-slate-200 p-1 border-white flex justify-center items-center">
                {ad?.cube?.picture_source ? (
                  <img src={ad?.cube?.picture_source} className="w-12" />
                ) : (
                  <CubeComponent
                    size={18}
                    color={`${ad?.cube?.cube_type?.color}`}
                  />
                )}
              </div>
            </div>
          </Link>
        </InfoBox>
      ))}
    </GoogleMap>
  );
}
