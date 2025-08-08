/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { IconButtonComponent } from '../../components/base.components';
import { useGet } from '../../helpers';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import { QRCodeSVG } from 'qrcode.react';
import {
  faArrowRight,
  faChevronRight,
  faRoute,
} from '@fortawesome/free-solid-svg-icons';
import CubeComponent from '../../components/construct.components/CubeComponent';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';

export default function Save() {
  const [modalValidation, setModalValidation] = useState(false);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState({ data: [] });

  useEffect(() => {
    // Ambil voucher dari localStorage (demo)
    const vouchers = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
    setData({ data: vouchers });
  }, []);

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary w-full px-4 pt-4 pb-14">
          <h2 className="text-white font-semibold">Saku Promo Kamu</h2>
          <p className="text-slate-300 text-sm mt-1">
            Kumpulan promo yang kamu rebut...
          </p>
        </div>

        <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-8 relative z-20 pb-28">
          <div className="px-4">
            <div className="flex flex-col gap-3">
              {data?.data?.length ? (
                data?.data?.map((item, key) => (
                  <div
                    className={`grid grid-cols-4 gap-3 p-3 shadow-neuro rounded-[15px] relative cursor-pointer bg-white`}
                    key={key}
                    onClick={() => {
                      setModalValidation(true);
                      setSelected(item);
                    }}
                  >
                    <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-100 flex justify-center items-center">
                      <img
                        src={item?.ad?.picture_source}
                        height={700}
                        width={700}
                        alt=""
                      />
                    </div>
                    <div className="col-span-3">
                      <p className="font-semibold">{item?.ad?.title}</p>
                      <p className="text-slate-600 text-xs mb-2">
                        {item?.ad?.cube?.address}
                      </p>
                      {item?.voucher_item ? (
                        <span className="font-medium text-success bg-green-50 px-2 py-1 rounded">
                          Voucher
                        </span>
                      ) : (
                        <span className="font-medium text-warning bg-yellow-50 px-2 py-1 rounded">
                          Promo
                        </span>
                      )}
                      {/* Status & Expired */}
                      {item?.validation_at ? (
                        <span className="font-medium text-success block mt-1">
                          Sudah divalidasi
                        </span>
                      ) : item?.ad?.status != 'active' ? (
                        <span className="font-medium text-danger block mt-1">
                          Promo Ditutup
                        </span>
                      ) : (
                        <span className="font-medium text-warning block mt-1">
                          Belum divalidasi
                        </span>
                      )}
                      {item?.expired_at && (
                        <p className="text-danger text-xs mb-2">
                          Batas waktu:{' '}
                          {ExpiredHour > 1
                            ? ExpiredHour.toString()?.split('.')[0] +
                              ' Jam Lagi'
                            : ExpiredMinutes.toString()?.split('.')[0] +
                              ' Menit Lagi'}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center mt-6 font-medium text-slate-500">
                  Upss.. belum ada promo atau voucher yang kamu rebut!
                </div>
              )}
            </div>
          </div>
        </div>

        <BottomBarComponent active={'save'} />
      </div>

      <BottomSheetComponent
        title={'Validasi Promo'}
        show={modalValidation}
        onClose={() => {
          setModalValidation(false);
          setSelected(null);
        }}
        height={550}
      >
        <div className="p-4">
          <div className="flex justify-between mt-3">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Promo</p>
              <h4 className="font-semibold text-xl">{selected?.ad?.title}</h4>
            </div>

            <Link href={`/app/${selected?.ad?.cube?.code}`}>
              <div className="text-sm text-primary">
                Buka Detail Iklan <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </Link>
          </div>

          {selected?.ad?.cube?.tags?.at(0)?.address && (
            <div className="flex justify-between items-center gap-3 mt-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mt-3 mb-1">
                  Get Direction (Lokasi Validasi)
                </p>
                <p className="col-span-3">
                  {selected?.ad?.cube?.tags?.at(0)?.address}
                </p>
              </div>
              <a
                href={`http://www.google.com/maps/place/${
                  selected?.ad?.cube?.tags?.at(0)?.map_lat
                },${selected?.ad?.cube?.tags?.at(0)?.map_lng}`}
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

          {selected?.ad?.cube?.tags?.at(0)?.link && (
            <div className="flex justify-between items-center gap-3 mt-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mt-3 mb-1">
                  Link Toko Online
                </p>
                <p className="col-span-3">
                  {selected?.ad?.cube?.tags?.at(0)?.link}
                </p>
              </div>
              <a
                href={selected?.ad?.cube?.tags?.at(0)?.link}
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

          <p className="text-sm font-medium text-slate-500 mt-5 mb-1">
            Informasi Pemilik Kubus
          </p>
          <div className="grid grid-cols-4">
            <p>Nama </p>
            <p className="col-span-3">
              :{' '}
              {selected?.ad?.cube?.user?.name ||
                selected?.ad?.cube?.corporate?.name}
            </p>
            <p>No Hp/WA</p>
            <p className="col-span-3">
              :{' '}
              {selected?.ad?.cube?.user?.phone ||
                selected?.ad?.cube?.corporate?.phone}
            </p>
          </div>
        </div>

        {selected?.validation_at ? (
          <div className="py-8 border border-primary rounded-[15px]">
            <div className="font-medium text-success text-center text-lg">
              Promo Sudah Divalidasi
            </div>
          </div>
        ) : selected?.ad?.status != 'active' ? (
          <div className="py-8 border border-danger rounded-[15px]">
            <div className="font-medium text-danger text-center text-lg">
              Promo Ditutup
            </div>
          </div>
        ) : selected?.voucher_item?.code ? (
          <div className="mt-6 py-8 rounded-[20px] bg-white px-6">
            <div>Voucher Promo</div>
            <h4 className="text-xl font-semibold">
              Kode Voucher: {selected?.voucher_item?.code}
            </h4>
            {/* Tambahkan QR untuk validasi tenant */}
            <div className="flex flex-col items-center mt-4">
              <QRCodeSVG
                value={selected?.voucher_item?.code}
                size={160}
                bgColor="#f8fafc"
                fgColor="#0f172a"
                level="H"
                includeMargin={true}
                className="rounded-lg"
              />
              <button
                className="mt-4 px-4 py-2 rounded-full bg-primary text-white font-semibold shadow-neuro hover:bg-primary/80 transition"
                onClick={() => {
                  // Aksi validasi QR oleh tenant, misal open scanner/modal
                  alert('QR siap divalidasi oleh tenant!');
                }}
              >
                Validasi QR ke Tenant
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 py-8 rounded-t-[20px] bg-white p-4">
            <div className="flex justify-center">
              <QRCodeSVG
                value={selected?.code}
                width={'40vw'}
                height={'40vw'}
              />
            </div>
            <strong className="block mt-2 text-xl text-center text-slate-500">
              {selected?.code}
            </strong>
            {/* Tombol validasi QR */}
            <button
              className="mt-4 px-4 py-2 rounded-full bg-primary text-white font-semibold shadow-neuro hover:bg-primary/80 transition"
              onClick={() => {
                // Aksi validasi QR oleh tenant
                alert('QR siap divalidasi oleh tenant!');
              }}
            >
              Validasi QR ke Tenant
            </button>
          </div>
        )}
      </BottomSheetComponent>
    </>
  );
}
