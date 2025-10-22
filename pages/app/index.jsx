/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import {
  faBell,
  faChevronRight,
  faGlobe,
  faLocationDot,
  faMagnifyingGlass,
  faMessage,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Autoplay, Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  ButtonComponent,
  FormSupervisionComponent,
} from '../../components/base.components';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import FloatingOriginButton from '../../components/construct.components/FloatingOriginButton';
import MenuAdPage from '../../components/construct.components/partial-page/MenuAd.page';
import MenuCubePage from '../../components/construct.components/partial-page/MenuCube.page';
import { useGet } from '../../helpers';
import { distanceConvert } from '../../helpers/distanceConvert.helpers';

export default function Index() {
  const [map, setMap] = useState(null);
  const [apiReady, setApiReady] = useState(false);

  // Build consistent link to unified Promo Detail page
  // Prefer ad.id; fallback to cube detail when id is missing
  const buildPromoLink = (ad) => {
    const id = ad?.id || ad?.ad_id;
    if (id) return `/app/komunitas/promo/${id}?source=home`;
    const cubeCode = ad?.cube?.code;
    return cubeCode ? `/app/detail/${cubeCode}` : '#';
  };

  const getAdImage = (ad) =>
    ad?.image_1 || ad?.image_2 || ad?.image_3 || ad?.picture_source || '';

  // Delay API calls sedikit untuk memastikan token ready setelah redirect
  useEffect(() => {
    const timer = setTimeout(() => {
      // DEBUG: Simple token check
      // eslint-disable-next-line no-console
      console.log('=== APP PAGE LOADED ===');
      // eslint-disable-next-line no-console
      console.log('Will start API calls in 200ms...');

      setApiReady(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // ----- HELPERS: baca flag informasi dari BE apapun bentuknya -----
  const normalizeBoolLike = (val) => {
    if (val === true || val === 1) return true;
    if (typeof val === 'number') return val === 1;
    if (Array.isArray(val)) {
      // checkbox style: [1] atau ['1'] = true, [] = false
      return val.length > 0 && (val.includes(1) || val.includes('1') || val.includes(true));
    }
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      // string langsung
      if (['1', 'true', 'y', 'yes', 'ya', 'iya', 'on'].includes(s)) return true;
      if (['0', 'false', 'n', 'no', 'off', ''].includes(s)) return false;
      // string JSON: "[1]" atau "true"
      try {
        const j = JSON.parse(val);
        return normalizeBoolLike(j);
      } catch { }
    }
    return !!val;
  };

  const getIsInformation = (ad) => {
    // 1) bendera di cube/ad
    const cubeInfo = normalizeBoolLike(ad?.cube?.is_information);
    const adInfo = normalizeBoolLike(ad?.is_information);

    // 2) content_type dari cube (kalau ada)
    const contentType = String(ad?.cube?.content_type || ad?.content_type || '').toLowerCase();
    const contentTypeInfo = contentType === 'kubus-informasi';

    // 3) tipe/kategori sebagai fallback terakhir
    const typeStr = String(ad?.type || ad?.cube?.type || '').toLowerCase();
    const looksInfoType = ['information', 'informasi'].includes(typeStr);

    // 4) kategori (kalau BE nyebut Advertising, tetap bukan informasi)
    return cubeInfo || adInfo || contentTypeInfo || looksInfoType;
  };

  const getCategoryLabel = (ad) => {
    // 1) Utamakan flag Informasi
    if (getIsInformation(ad)) return 'Informasi';

    // 2) Mapping berdasarkan type dari BE
    const typeStr = String(ad?.type || '').toLowerCase();
    if (typeStr === 'iklan') return 'Advertising';
    if (typeStr === 'voucher') return 'Voucher';

    // 3) Fallback ke kategori dari BE
    const rawCat = (ad?.ad_category?.name || '').trim();
    if (!rawCat) return 'Promo';

    // kalau kategori BE memang “Advertising”, tampilkan apa adanya
    if (rawCat.toLowerCase() === 'advertising') return 'Advertising';

    return rawCat; // pakai nama kategori asli
  };

  const AdCardBySize = ({ ad, size = 'M' }) => {
    const img = getAdImage(ad);
    const title = ad?.title || 'Promo';

    // Gunakan helper yang sudah kamu buat di atas file
    const isInformation = getIsInformation(ad);

    const category = getCategoryLabel(ad);

    const address = ad?.cube?.address;
    if (size === 'XL-Ads') {
      return (
        <div className="relative rounded-[18px] overflow-hidden border shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
          style={{ minWidth: 320, maxWidth: 360, borderColor: '#d8d8d8', background: '#fffaf0' }}>
          <div className="relative w-full h-[290px] bg-white flex items-center justify-center">
            <img src={img} alt={title} className="object-contain w-full h-full p-2" />
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
        <div className="rounded-[16px] overflow-hidden border border-[#d8d8d8] bg-[#fffaf0] shadow-md flex-shrink-0 hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
          style={{ minWidth: 320, maxWidth: 360 }}>
          <div className="relative w-full h-[180px] bg-white flex items-center justify-center">
            <img src={img} alt={title} className="object-contain w-full h-full p-2" />
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
        <div className="flex items-center rounded-[14px] overflow-hidden border border-[#d8d8d8] bg-[#5a6e1d]/10 shadow-md flex-shrink-0 hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
          style={{ minWidth: 280, maxWidth: 320, height: 130 }}>
          <div className="relative w-[40%] h-full bg-white flex items-center justify-center overflow-hidden">
            <img src={img} alt={title} className="object-contain w-[90%] h-[90%] rounded-[10px]" />
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
      <div className="flex flex-col rounded-[12px] overflow-hidden border border-[#d8d8d8] bg-[#5a6e1d]/10 shadow-sm flex-shrink-0 hover:scale-[1.02] transition-all duration-300"
        style={{ minWidth: isM ? 180 : 140, maxWidth: isM ? 200 : 160 }}>
        <div className="relative w-full bg-white flex items-center justify-center overflow-hidden" style={{ height: isM ? 150 : 120 }}>
          <img src={img} alt={title} className="object-contain w-[90%] h-[90%] rounded-[8px]" />
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
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingBanner, codeBanner, dataBanner] = useGet({
    path: 'banner',
  }, !apiReady); // Sleep jika apiReady = false

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMap({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setMap({
            lat: -6.905977,
            lng: 107.613144,
          });
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingMenu, codeMenu, dataMenu] = useGet({
    path: `admin/dynamic-content?type=home`,
  }, !apiReady);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingNear, codeNear, dataNear] = useGet({
    path: map ? `ads/promo-nearest/${map?.lat}/${map?.lng}` : '',
  }, !apiReady || !map);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingRecommendation, codeRecommendation, dataRecommendation] =
    useGet({
      path: `ads/promo-recommendation`,
    }, !apiReady);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCategories, codeCategories, dataCategories] = useGet({
    path: `ads-category`,
  }, !apiReady);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [
    loadingPrimaryCategories,
    codePrimaryCategories,
    dataPrimaryCategories,
  ] = useGet({
    path: `primary-category`,
  }, !apiReady);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingUser, codeUser, dataUser] = useGet({
    path: `account`,
  }, !apiReady); // PENTING: Delay request account sampai apiReady = true

  // Tambahkan useGet untuk notifikasi
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingNotif, codeNotif, dataNotif] = useGet({
    path: `notification`,
  }, !apiReady);

  // Hitung jumlah notifikasi yang belum dibaca
  const unreadNotificationCount = useMemo(() => {
    if (!dataNotif?.data || !Array.isArray(dataNotif.data)) return 0;
    return dataNotif.data.filter(item => !item.read_at).length;
  }, [dataNotif]);

  // DEBUG: Log user data untuk debugging
  useEffect(() => {
    if (dataUser && !loadingUser) {
      // eslint-disable-next-line no-console
      console.log('=== USER DATA DEBUG ===');
      // eslint-disable-next-line no-console
      console.log('Full dataUser:', dataUser);
      // eslint-disable-next-line no-console
      console.log('Profile:', dataUser?.data?.profile);
      // eslint-disable-next-line no-console
      console.log('Phone:', dataUser?.data?.profile?.phone);
      // eslint-disable-next-line no-console
      console.log('User ID:', dataUser?.data?.profile?.id);
    }
  }, [dataUser, loadingUser]);

  // PERBAIKAN: Cek jika user ada dan verified, allow akses meski phone kosong
  // Atau buat phone optional/bisa dilewati untuk user yang sudah verified
  // Backend returns profile in data.profile structure
  const userProfile = dataUser?.data?.profile;
  const hasPhone = userProfile?.phone && userProfile.phone.trim() !== '';
  const isVerified = userProfile?.verified_at;
  const hasUserId = userProfile?.id;
  const phoneFormSkipped = typeof window !== 'undefined' && localStorage.getItem('phone_form_skipped') === 'true';

  // Check verification status from backend response
  const verificationStatus = dataUser?.data?.verification_status;
  const isEmailVerified = verificationStatus?.is_verified || isVerified;

  // Allow access if user has ID and is verified OR phone form was skipped
  if (userProfile && hasUserId && (hasPhone || phoneFormSkipped || isEmailVerified)) {
    return (
      <>
        <div className="lg:mx-auto lg:relative lg:max-w-md">
          <div className="container mx-auto relative z-10 pb-28">
            <div className="relative">
              {dataBanner?.data && (
                <Swiper
                  spaceBetween={20}
                  centeredSlides={true}
                  loop={true}
                  modules={[Autoplay, Navigation]}
                  slidesPerView={'auto'}
                  autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                  }}
                  className="w-full"
                >
                  {dataBanner?.data?.map((item, key) => {
                    return (
                      <SwiperSlide key={key} className="overflow-hidden">
                        <div className="w-full aspect-[16/8] overflow-hidden bg-primary">
                          <img
                            src={item.picture_source}
                            width={1500}
                            height={520}
                            alt=""
                            className="h-full object-cover"
                          />
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              )}
            </div>

            <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
              <div className="relative -top-5 px-4">
                {/* Gabungkan search, notifikasi, dan pesan dalam satu container */}
                <div className="bg-white border border__primary rounded-[20px] flex items-center overflow-hidden">
                  {/* Search Section */}
                  <Link href="/app/cari" className="flex-1">
                    <div className="px-6 py-4 flex justify-between items-center">
                      <p className="text-gray-500">Mulai mencari promo ...</p>
                      <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="text__primary"
                      />
                    </div>
                  </Link>

                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-200"></div>

                  {/* Button Notifikasi */}
                  <Link href="/app/notifikasi">
                    <div className="px-4 py-4 flex justify-center items-center relative">
                      <FontAwesomeIcon
                        icon={faBell}
                        className="text__primary text-lg"
                      />
                      {/* Badge notifikasi dinamis */}
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-200"></div>

                  {/* Button Pesan */}
                  <Link href="/app/pesan">
                    <div className="px-4 py-4 flex justify-center items-center">
                      <FontAwesomeIcon
                        icon={faMessage}
                        className="text__primary text-lg"
                      />
                    </div>
                  </Link>
                </div>
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
                          <div className="w-full aspect-square bg-primary rounded-[12px] relative overflow-hidden flex justify-center items-center group hover:bg-primary-dark transition-colors duration-200">
                            {/* Icon Grid Custom dengan hover effect */}
                            <div className="grid grid-cols-2 gap-2 group-hover:scale-110 transition-transform duration-200">
                              <div className="w-3 h-3 bg-white rounded-md opacity-80"></div>
                              <div className="w-3 h-3 bg-white rounded-md opacity-60"></div>
                              <div className="w-3 h-3 bg-white rounded-md opacity-60"></div>
                              <div className="w-3 h-3 bg-white rounded-md opacity-40 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-primary text-xs font-bold">+</div>
                                </div>
                              </div>
                            </div>

                            {/* Alternatif: Icon dengan border */}
                            {/* <div className="w-8 h-8 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                              <FontAwesomeIcon
                                icon={faPlus}
                                className="text-lg text-white"
                              />
                            </div> */}

                            <div className="absolute bottom-0 left-0 w-full text-center bg-white bg-opacity-40 backdrop-blur-md py-2 text-xs font-medium">
                              Lainnya
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  );
                } else if (menu.content_type == 'nearby' && menu.is_active) {
                  return (
                    <div className="px-4 mt-8" key={key}>
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
                        {dataNear?.data?.map((item, key) => {
                          return (
                            <Link href={buildPromoLink(item)} key={key}>
                              <div className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative bg-white bg-opacity-40 backdrop-blur-sm">
                                <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                                  <img
                                    src={getAdImage(item)}
                                    height={700}
                                    width={700}
                                    alt=""
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
                      <div className="px-4 mt-8">
                        <div className="flex justify-between items-center gap-2">
                          <div>
                            <p className="font-semibold">{menu.name}</p>
                            <p className="text-xs text-slate-500">
                              {menu.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="w-full px-4 pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2">
                        <div className="flex flex-nowrap gap-4 w-max">
                          {dataRecommendation?.data?.map((item, key) => {
                            return (
                              <Link href={buildPromoLink(item)} key={key}>
                                <div className="relative snap-center w-[330px] shadow-sm bg-white bg-opacity-40 backdrop-blur-sm rounded-[14px] overflow-hidden p-3">
                                  <div className="aspect-[6/3] bg-slate-400 rounded-[14px] overflow-hidden brightness-90">
                                    <img
                                      src={getAdImage(item)}
                                      height={1200}
                                      width={600}
                                      alt=""
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
                                            {item?.total_remaining ||
                                              item?.max_grab}
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
                } else if (
                  menu.content_type == 'ad_category' &&
                  menu.is_active
                ) {
                  return (
                    <>
                      {dataCategories?.data?.map((category, key) => {
                        return (
                          <div className="px-4 mt-8" key={key}>
                            <div className="flex justify-between items-center gap-4">
                              <div className="w-full max-w-[75%]">
                                <p className="font-semibold">
                                  {category?.name}
                                </p>
                                {category?.child_categories?.at(0) && (
                                  <div className="w-full pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2">
                                    <div className="flex flex-nowrap gap-2 w-max">
                                      <ButtonComponent
                                        size="xs"
                                        label="Semua"
                                      />
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
                              <Link href={`/app/cari?cari=${category?.name}`}>
                                <div className="text-sm text-primary font-semibold">
                                  Lainnya
                                  <FontAwesomeIcon
                                    icon={faChevronRight}
                                    className="ml-2"
                                  />
                                </div>
                              </Link>
                            </div>

                            <div className="flex flex-col gap-4 mt-4">
                              {category?.ads?.filter(ad => ad?.id || ad?.cube?.code).map((ad, ad_key) => {
                                return (
                                  <Link href={buildPromoLink(ad)} key={ad_key}>
                                    <div className="relative">
                                      <div className="aspect-[4/3] bg-slate-400 rounded-[20px] overflow-hidden brightness-90">
                                        <img
                                          src={getAdImage(ad)}
                                          height={1200}
                                          width={600}
                                          alt=""
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
                } else if (menu.content_type === 'promo' && menu.is_active) {
                  // Widget Promo/Iklan (home): dukung sumber 'cube' & 'shuffle_cube' (ambil ads dari cube)
                  const adsFromCubes = (menu?.dynamic_content_cubes || [])
                    .flatMap((dcc) => {
                      const infoFlag = dcc?.cube?.is_information;
                      const ctFlag = dcc?.cube?.content_type;
                      const cubeCode = dcc?.cube?.code;
                      return (dcc?.cube?.ads || []).map((ad) => ({
                        ...ad,
                        // wariskan flag dari cube jika ad belum punya
                        is_information: ad?.is_information ?? infoFlag,
                        cube: {
                          ...(ad?.cube || {}),
                          code: ad?.cube?.code || cubeCode, // pastikan code tersedia
                          is_information: ad?.cube?.is_information ?? infoFlag,
                          content_type: ad?.cube?.content_type ?? ctFlag,
                        },
                      }));
                    })
                    .filter(Boolean);

                  // Fallback: jika source_type 'ad_category', ambil dari dataCategories
                  const adsFromAdCategory =
                    menu?.source_type === 'ad_category'
                      ? ((dataCategories?.data || []).find((c) => c?.id === menu?.ad_category_id)?.ads || [])
                      : [];

                  // Pakai hasil dari cubes dulu; kalau kosong pakai dari kategori
                  const ads = adsFromCubes.length ? adsFromCubes : adsFromAdCategory;
                  if (!ads?.length) return null;

                  return (
                    <div className="px-4 mt-8" key={key}>
                      <div className="flex justify-between items-center gap-2">
                        <div>
                          <p className="font-semibold">{menu?.name || 'Promo Spesial'}</p>
                          {menu?.description && (
                            <p className="text-xs text-slate-500">{menu.description}</p>
                          )}
                        </div>
                        <Link href={`/app/cari?berdasarkan=Promo`}>
                          <div className="text-sm text-primary font-semibold">
                            Lainnya
                            <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                          </div>
                        </Link>
                      </div>

                      <div className="w-full pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-3">
                        <div className="flex flex-nowrap gap-4 w-max">
                          {ads.map((ad, i) => (
                            <Link href={buildPromoLink(ad)} key={i}>
                              <AdCardBySize ad={ad} size={menu?.size || 'M'} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
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

            <BottomBarComponent active={'home'} />
          </div>
        </div>
        {/* Tambahkan FloatingOriginButton di luar container agar floating */}
        <FloatingOriginButton
          origin="Komunitas"
          icon={<FontAwesomeIcon icon={faUsers} className="text-xl" />}
        />
      </>
    );
  } else if (!loadingUser && userProfile && !hasPhone && !phoneFormSkipped && codeUser === 200) {
    // TAMPILKAN form phone hanya jika:
    // 1. User data berhasil dimuat (codeUser === 200)
    // 2. User ada tapi belum ada phone
    // 3. Belum pernah di-skip
    // 4. Bukan loading state
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-background min-h-screen w-full relative z-20 bg-gradient-to-br from-cyan-50 p-4">
            <h1 className="text-lg mb-4">
              Lengkapi profil Anda
            </h1>
            <p className="text-sm text-slate-600 mb-4">
              Nomor HP/WA diperlukan untuk notifikasi dan komunikasi. Anda bisa mengisi sekarang atau nanti.
            </p>

            <FormSupervisionComponent
              submitControl={{
                path: 'auth/edit-profile',
              }}
              defaultValue={{
                phone: userProfile?.phone || '',
              }}
              onSuccess={() => {
                window.location.reload();
              }}
              forms={[
                {
                  construction: {
                    name: 'phone',
                    label: 'Nomor HP/WA',
                    placeholder: 'Masukkan nomor HP/WA',
                    validations: {
                      required: true,
                    },
                  },
                },
              ]}
            />

            <div className="mt-4 flex gap-2">
              <ButtonComponent
                type="button"
                variant="outline"
                label="Lewati"
                onClick={() => {
                  localStorage.setItem('phone_form_skipped', 'true');
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state atau belum ada data user
  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      <div className="container mx-auto relative z-10 pb-28">
        <div className="bg-background min-h-screen w-full relative z-20 bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-primary rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
