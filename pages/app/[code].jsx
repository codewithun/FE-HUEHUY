/* eslint-disable @next/next/no-img-element */
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import {
  faArrowLeftLong,
  faArrowRight,
  faCheckCircle,
  faChevronRight,
  faComments,
  faEye,
  faRoute,
  faShareSquare,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  ButtonComponent,
  DateFormatComponent,
  IconButtonComponent,
  ModalConfirmComponent,
} from '../../components/base.components';
import { TextareaComponent } from '../../components/base.components/input/Textarea.component';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import { get, post, useGet } from '../../helpers';

export function Cube({ cubeData }) {
  const router = useRouter();
  const { code } = router.query;
  const [modalGrab, setModalGrab] = useState(false);
  const [successGrab, setSuccessGrab] = useState(false);
  const [failedGrab, setFailedGrab] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalReport, setModalReport] = useState(false);
  const [expandContent, setExpandContent] = useState(false);
  const [showHuehuyAds, setShowHuehuyAds] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: code && `get-cube-by-code/${code}`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingHuehuyAd, codeHuehuyAd, dataHuehuyAd] = useGet({
    path: `cube-huehuy-ads`,
  });

  useEffect(() => {
    if (dataHuehuyAd?.data) {
      setShowHuehuyAds(true);
    }
  }, [dataHuehuyAd]);

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
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
          <div className="flex justify-between items-center gap-2 p-2 sticky top-0 z-30 bg-white bg-opacity-40 backdrop-blur-sm border-b ">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={() => router.back()}
              />
              <IconButtonComponent
                className="absolute top-[20%] right-4"
                label="Bagikan"
                icon={faShareSquare}
                variant="simple"
                rounded="true"
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({
                      title: `Cuma Ada Di HUEHUY! ${
                        data?.data?.ads?.at(0)?.title
                      }`,
                      text: `Lokasi Promo: ${data?.data?.address}`,
                      url: window.location.href,
                    });
                  }
                }}
              />
              <IconButtonComponent
                className="absolute top-[20%] right-14"
                icon={faTriangleExclamation}
                variant="simple"
                rounded="true"
                onClick={async () => {
                  setModalReport(true);
                }}
              />
            </div>
            {data?.data?.is_information ? (
              <div className="font-semibold w-full text-lg">
                Kubus Informasi
              </div>
            ) : (
              <div className="font-semibold w-full text-lg">Kubus #{code}</div>
            )}
          </div>

          <Swiper
            spaceBetween={10}
            centeredSlides={true}
            loop={false}
            modules={[Navigation]}
            className="w-full"
            autoplay={false}
            onActiveIndexChange={(e) => setActiveIndex(e?.activeIndex)}
          >
            {data?.data?.ads?.map((item, key) => {
              return (
                <SwiperSlide key={key} className="overflow-hidden">
                  <div className="w-full min-h-[400px] overflow-hidden bg-slate-200">
                    {item?.picture_source && activeIndex == key && (
                      <img
                        src={item?.picture_source}
                        height={700}
                        width={700}
                        alt=""
                      />
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          <div className="bg-background w-full rounded-t-[15px] -mt-6 relative z-20 bg-gradient-to-br from-white">
            <div className="py-6 pb-32">
              <h4 className="font-semibold text-xl px-4">
                {data?.data?.ads?.at(activeIndex)?.title}
              </h4>
              <div className="text-xs py-2 px-4 text-slate-400">
                <FontAwesomeIcon icon={faEye} className="text-sm" />{' '}
                {data?.data?.ads?.at(activeIndex)?.viewer} Dilihat
              </div>
              <p
                className={`text-justify mt-4 ${
                  !expandContent && 'max-h-[150px] overflow-hidden'
                }  overflow-hidden whitespace-pre-wrap text-ellipsis px-4`}
              >
                {data?.data?.ads?.at(activeIndex)?.description}
              </p>
              <div
                className={`cursor-pointer text-primary font-semibold text-sm pt-2 px-4 pb-4 underline`}
                onClick={() => setExpandContent(!expandContent)}
              >
                {!expandContent ? 'Selengkapnya' : 'Lebih sedikit'}
              </div>

              {!data?.data?.is_information && (
                <>
                  <div className="h-2 w-full bg-slate-200 my-4"></div>
                  <p className="text-sm font-medium text-slate-500 mb-1 px-4">
                    Informasi Kubus
                  </p>
                  <div className="grid grid-cols-4 px-4">
                    <p>Kode </p>
                    <p className="col-span-3">: #{code}</p>
                    <p>Tipe</p>
                    <p className="col-span-3">
                      : {data?.data?.cube_type?.name} (
                      {data?.data?.cube_type?.code})
                    </p>
                    <p>Periode</p>
                    <p className="col-span-3">
                      :{' '}
                      <b>
                        {data?.data?.ads?.at(0)?.start_validate && (
                          <DateFormatComponent
                            date={data?.data?.ads?.at(0)?.start_validate}
                          />
                        )}{' '}
                      </b>
                      <span className="text-sm">
                        {data?.data?.ads?.at(0)?.start_validate &&
                        data?.data?.ads?.at(0)?.finish_validate
                          ? 's/d'
                          : '-'}
                      </span>
                      <b>
                        {data?.data?.ads?.at(0)?.finish_validate && (
                          <DateFormatComponent
                            date={data?.data?.ads?.at(0)?.finish_validate}
                          />
                        )}
                      </b>
                    </p>
                    <p>Dunia Promo</p>
                    <p className="col-span-3">
                      : {data?.data?.world?.name || 'General'}
                    </p>
                  </div>

                  <div className="h-2 w-full bg-slate-200 my-4"></div>

                  {data?.data?.ads?.at(activeIndex)?.level_umkm && (
                    <>
                      <p className="text-sm font-medium text-slate-500 mb-1 px-4">
                        Performa UMKM
                      </p>
                      <div className="flex flex-col gap-3 px-4 mt-3">
                        <div className="font-semibold mb-1 px-4 text-center bg-green-200 py-2 text-green-600 rounded-full">
                          UMKM Level{' '}
                          {data?.data?.ads?.at(activeIndex)?.level_umkm}
                        </div>

                        <div className="flex justify-between font-medium">
                          <p>Kapasitas Produksi / Hari</p>
                          <p className="font-semibold text-primary">
                            {
                              data?.data?.ads?.at(activeIndex)
                                ?.max_production_per_day
                            }{' '}
                            Pcs
                          </p>
                        </div>
                        <div className="flex justify-between font-medium">
                          <p>Rata-rata Penjualan / Hari</p>
                          <p className="font-semibold text-primary">
                            {data?.data?.ads?.at(activeIndex)?.sell_per_day} Pcs
                          </p>
                        </div>
                        <div className="flex justify-between font-medium">
                          <p>Tipe Penjualan</p>
                          <p className="font-semibold text-primary">Langsung</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-200 my-4"></div>
                    </>
                  )}

                  {data?.data?.tags?.at(0)?.link && (
                    <div className="flex justify-between items-center gap-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500 mt-4 mb-1">
                          Link Toko Online
                        </p>
                        <p className="col-span-3">
                          {data?.data?.tags?.at(0)?.link}
                        </p>
                      </div>
                      <a
                        href={data?.data?.tags?.at(0)?.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center"
                      >
                        <IconButtonComponent
                          icon={faArrowRight}
                          size="xl"
                          variant="simple"
                          className="mt-3"
                        />
                        <div className="text-sm -mt-2">Buka</div>
                      </a>
                    </div>
                  )}

                  {data?.data?.tags?.at(0)?.address && (
                    <div className="flex justify-between items-center gap-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500 mt-4 mb-1">
                          Get Direction (Lokasi Validasi)
                        </p>
                        <p className="col-span-3">
                          {data?.data?.tags?.at(0)?.address}
                        </p>
                      </div>
                      <a
                        href={`http://www.google.com/maps/place/${
                          data?.data?.tags?.at(0)?.map_lat
                        },${data?.data?.tags?.at(0)?.map_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center"
                      >
                        <IconButtonComponent
                          icon={faRoute}
                          size="xl"
                          variant="simple"
                          className="mt-3"
                        />
                        <div className="text-sm -mt-2">Rute</div>
                      </a>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mt-5 mb-1">
                        Lokasi Billboard Virtual
                      </p>
                      <p className="col-span-3">{data?.data?.address}</p>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-200 my-4"></div>

                  <p className="text-sm font-medium text-slate-500 mt-5 mb-1 px-4">
                    Informasi Pemilik Kubus
                  </p>
                  <div className="grid grid-cols-4 px-4">
                    <p>Nama </p>
                    <p className="col-span-3">
                      : {data?.data?.user?.name || data?.data?.corporate?.name}
                    </p>
                    <p>No Hp/WA</p>
                    <p className="col-span-3">: {data?.data?.user?.phone}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {!data?.data?.is_information && (
          <>
            {!data?.data?.is_my_cube ? (
              <div
                className={`fixed bottom-0 left-0 w-screen pt-3 pb-2 px-6 bg-slate-100 rounded-t-[25px] z-20`}
              >
                <div className="lg:max-w-md mx-auto flex gap-4">
                  <ButtonComponent
                    icon={faComments}
                    label="Pesan"
                    variant="light"
                    block
                    rounded
                    onClick={async () => {
                      setChatLoading(true);
                      const execute = await post({
                        path: `chat-rooms`,
                        body: {
                          user_merchant_id: data?.data?.user_id,
                          chat: { cube_id: data?.data?.id },
                        },
                      });

                      if (execute.status == 201) {
                        router.push(`/app/pesan/${execute?.data?.data?.id}`);
                      } else {
                        setChatLoading(false);
                      }
                    }}
                    disabled={
                      data?.data?.ads?.at(activeIndex)?.status != 'active' ||
                      !data?.data?.user_id
                    }
                    loading={chatLoading}
                  />
                  <ButtonComponent
                    icon={faArrowRight}
                    label="Rebut Promo"
                    block
                    rounded
                    onClick={() => setModalGrab(true)}
                    disabled={
                      data?.data?.ads?.at(activeIndex)?.status != 'active' ||
                      !data?.data?.user_id
                    }
                  />
                </div>
              </div>
            ) : (
              <div
                className={`fixed bottom-0 left-0 w-screen pt-3 pb-2 px-6 bg-slate-100 rounded-t-[25px] z-20 grid grid-cols-2 gap-4 items-end`}
              >
                <div>
                  <p className="text-sm mb-2">
                    Status:{' '}
                    {data?.data?.status == 'active' ? (
                      <span className="text-primary">Aktif</span>
                    ) : (
                      <span className="text-warning">Tidak Aktif</span>
                    )}
                  </p>
                  <Link href={'/app/hubungi-kami'}>
                    <ButtonComponent
                      label="Aktifasi Kubus"
                      size="lg"
                      block
                      disabled={data?.data?.status == 'active'}
                    />
                  </Link>
                </div>
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
          </>
        )}

        {showHuehuyAds && (
          <>
            <div className="absolute top-0 left-0 w-full h-full bg-background z-30 bg-opacity-95">
              <div className="p-3 flex justify-between">
                <p>Iklan Huehuy</p>
                <p
                  className="font-medium text-primary underline"
                  onClick={() => setShowHuehuyAds(false)}
                >
                  Lewati <FontAwesomeIcon icon={faChevronRight} />
                </p>
              </div>
              <div className="w-full min-h-[400px] overflow-hidden ">
                {dataHuehuyAd?.data?.picture_source && (
                  <img
                    src={dataHuehuyAd?.data?.picture_source}
                    height={700}
                    width={700}
                    alt=""
                  />
                )}

                <div className="mt-5">
                  <h4 className="font-semibold text-xl px-4">
                    {dataHuehuyAd?.data?.title}
                  </h4>
                  <p
                    className={`text-justify mt-4 overflow-hidden whitespace-pre-wrap text-ellipsis px-4`}
                  >
                    {dataHuehuyAd?.data?.description}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ModalConfirmComponent
        show={modalGrab}
        onClose={() => setModalGrab(false)}
        title="Yakin Merebut Promo Ini?"
        onSubmit={async () => {
          const execute = await post({
            path: `grabs`,
            body: {
              ad_id: data?.data?.ads?.at(activeIndex)?.id,
            },
          });

          if (execute.status == 201) {
            setModalGrab(false);
            setSuccessGrab(true);
          } else {
            setModalGrab(false);
            setFailedGrab(true);
          }
        }}
      />

      <ModalConfirmComponent
        show={successGrab}
        onClose={() => setSuccessGrab(false)}
        paint="primary"
        icon={faCheckCircle}
        title="Berhasil Merebut Promo"
        submitButton={{
          label: 'Buka Saku Promo',
        }}
        onSubmit={async () => {
          router.push('/app/saku');
        }}
      />

      <ModalConfirmComponent
        show={failedGrab}
        onClose={() => setFailedGrab(false)}
        paint="primary"
        icon={faCheckCircle}
        title="Kamu Sudah Merebut Promo"
        submitButton={{
          label: 'Buka Saku Promo',
        }}
        onSubmit={async () => {
          router.push('/app/saku');
        }}
      />

      <BottomSheetComponent
        show={modalReport}
        onClose={() => setModalReport(false)}
        title="Laporkan Iklan"
        height={250}
      >
        <div className="p-4">
          <TextareaComponent
            label="Masukkan Pesan Laporan"
            placeholder="Contoh: Iklan mengandung konten tidak wajar..."
          />

          <div className="px-4 mt-4">
            <ButtonComponent
              label="Kirim Laporan"
              block
              rounded
              onClick={() => setModalReport(false)}
            />
          </div>
        </div>
      </BottomSheetComponent>
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
