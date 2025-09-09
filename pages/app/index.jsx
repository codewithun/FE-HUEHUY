/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import {
  faChevronRight,
  faGlobe,
  faIcons,
  faLocationDot,
  faMagnifyingGlass,
  faMessage,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
    path: `dynamic-content?type=home`,
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
  const [configLoading, codeConfig, dataConfig, resetConfig] = useGet({
    path: 'admin/app-config/2',
  }, !apiReady);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingUser, codeUser, dataUser] = useGet({
    path: `account`,
  }, !apiReady); // PENTING: Delay request account sampai apiReady = true

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
                <div className="flex gap-3 items-center">
                  <Link href="/app/cari" className="flex-1">
                    <div className="w-full bg-white border border__primary px-6 py-4 rounded-[20px] flex justify-between items-center">
                      <p>Mulai mencari promo disini...</p>
                      <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="text__primary"
                      />
                    </div>
                  </Link>

                  {/* Button Pesan */}
                  <Link href="/app/pesan">
                    <div className="bg-white border border__primary p-4 rounded-[20px] flex justify-center items-center aspect-square">
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
                            <Link href={`/app/${item?.cube?.code}`} key={key}>
                              <div className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative bg-white bg-opacity-40 backdrop-blur-sm">
                                <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                                  <img
                                    src={item?.picture_source}
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
                              <Link href={`/app/${item?.cube?.code}`} key={key}>
                                <div className="relative snap-center w-[330px] shadow-sm bg-white bg-opacity-40 backdrop-blur-sm rounded-[14px] overflow-hidden p-3">
                                  <div className="aspect-[6/3] bg-slate-400 rounded-[14px] overflow-hidden brightness-90">
                                    <img
                                      src={item?.picture_source}
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
                              {category?.ads?.map((ad, ad_key) => {
                                return (
                                  <Link
                                    href={`/app/${ad?.cube?.code}`}
                                    key={ad_key}
                                  >
                                    <div className="relative">
                                      <div className="aspect-[4/3] bg-slate-400 rounded-[20px] overflow-hidden brightness-90">
                                        <img
                                          src={ad?.picture_source}
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
                    label: 'No Hp/WA',
                    validations: { min: 10 },
                  },
                },
              ]}
            />
            
            {/* TAMBAHAN: Button untuk skip form phone */}
            <div className="mt-4">
              <button 
                onClick={() => {
                  // Skip dengan mengupdate state atau redirect
                  localStorage.setItem('phone_form_skipped', 'true');
                  window.location.reload();
                }}
                className="w-full py-3 px-4 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Lewati untuk sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (!loadingUser && !userProfile) {
    // PERBAIKAN: Jika tidak ada user profile, redirect ke login
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-background min-h-screen w-full relative z-20 bg-gradient-to-br from-cyan-50 p-4 text-center">
            <h1 className="text-lg mb-4">Sesi login telah berakhir</h1>
            <p className="text-sm text-slate-600 mb-4">Silakan login kembali</p>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Login Kembali
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    // Loading state
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 pb-28">
          <div className="bg-background min-h-screen w-full relative z-20 bg-gradient-to-br from-cyan-50 p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-600">Memuat profil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
