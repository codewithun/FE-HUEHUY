/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faCoins,
  faCubes,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { token_cookie_name, useGet } from '../../helpers';
import CubeComponent from '../../components/construct.components/CubeComponent';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import { ButtonComponent } from '../../components/base.components';
import QRCode from 'qrcode.react';

export default function Akun() {
  const router = useRouter();
  const [modalConfirm, setModalConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false); // state popup QR

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: `account`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingArticle, codeArticle, dataArticle] = useGet({
    path: `article`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCubeType, codeCubeType, dataCubeType] = useGet({
    path: `cube-type`,
  });

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
        {/* Profile section */}
        <div className="flex items-center justify-between bg-primary w-full h-[110px] rounded-b-[40px] shadow-neuro px-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-neuro-in flex items-center justify-center bg-white">
              <img
                src={
                  data?.data?.profile?.picture_source
                    ? data?.data?.profile?.picture_source
                    : '/avatar.jpg'
                }
                width={80}
                height={80}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-white text-lg font-semibold drop-shadow-neuro">
                {data?.data?.profile?.name}
              </p>
              <p className="text-white text-xs mt-1 drop-shadow-neuro">
                {data?.data?.profile?.code}
              </p>
            </div>
          </div>
          <button onClick={() => setShowQR(true)} aria-label="Show QR">
            <img
              src="/qr-code.png" // Simpan gambar di public/qr-code.png
              alt="Barcode Icon"
              width={28}
              height={28}
              style={{ display: 'block' }}
            />
          </button>
        </div>

        {/* Info Card */}
        <div className="px-4 pb-4">
          <div className="bg-white rounded-2xl p-6 grid grid-cols-2 gap-6 shadow-neuro">
            <div className="flex gap-4 items-center border-r border-slate-200 pr-4">
              <div className="w-14 h-14 flex justify-center items-center bg-gray-100 rounded-xl shadow-neuro-in">
                <FontAwesomeIcon
                  icon={faCoins}
                  className="text-2xl text-slate-400"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Huehuy Poin</p>
                <p className="font-semibold text-primary">
                  {data?.data?.profile?.point} Poin
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 flex justify-center items-center bg-gray-100 rounded-xl shadow-neuro-in">
                <FontAwesomeIcon
                  icon={faCubes}
                  className="text-2xl text-slate-400"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Kubus Kamu</p>
                <p className="font-semibold text-primary">
                  {data?.data?.profile?.cubes?.length} Kubus
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-8 pb-28">
          <p className="text-sm font-semibold mt-6">Inventory</p>
          <div className="flex flex-col gap-3 mt-2">
            <Link href="/app/kubusku">
              <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                <p className="font-medium">Kubusku</p>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </Link>
            <Link href="/app/validasi">
              <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                <p className="font-medium">Validasi</p>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </Link>
          </div>

          <p className="text-sm font-semibold mt-6">Akun & Bantuan</p>
          <div className="flex flex-col gap-3 mt-2">
            <Link href="/app/informasi-akun">
              <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                <p className="font-medium">Informasi Akun</p>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </Link>
            <Link href="/app/pusat-bantuan">
              <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                <p className="font-medium">Pusat Bantuan</p>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </Link>
            <Link href="/app/hubungi-kami">
              <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                <p className="font-medium">Hubungi Admin</p>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </Link>
            <Link href="/app/kebijakan-privasi">
              <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                <p className="font-medium">Kebijakan & Privasi</p>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </Link>
          </div>

          <p className="text-sm font-semibold mt-6">Informasi Kubus</p>
          <div className="w-full pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2">
            <div className="flex flex-nowrap gap-4 w-max">
              {dataCubeType?.data?.map((item, key) => (
                <div
                  className="w-[280px] grid grid-cols-5 gap-3 p-3 shadow-neuro rounded-2xl relative bg-white bg-opacity-60 backdrop-blur-sm"
                  key={key}
                >
                  <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-gray-100 shadow-neuro-in">
                    <CubeComponent size={18} color={item?.color} />
                  </div>
                  <div className="col-span-4">
                    <p className="font-semibold">
                      {item?.name} ({item?.code})
                    </p>
                    <p className="text-slate-600 text-xs">
                      {item?.description}⏎····················
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm font-semibold mt-4">Berita Huehuy</p>
          <div className="w-full pb-2 overflow-x-auto relative scroll__hidden snap-mandatory snap-x mt-2">
            <div className="flex flex-nowrap gap-4 w-max">
              {dataArticle?.data?.map((item, key) => (
                <Link href={`/app/berita/${item?.slug}`} key={key}>
                  <div className="w-[320px] bg-white bg-opacity-60 backdrop-blur-sm grid grid-cols-4 gap-3 p-3 shadow-neuro rounded-2xl relative hover:scale-[1.01] transition">
                    <div className="w-full aspect-square rounded-lg bg-slate-40 overflow-hidden shadow-neuro-in">
                      <img
                        src={item?.picture_source}
                        height={700}
                        width={700}
                        alt=""
                      />
                    </div>
                    <div className="col-span-3">
                      <p className="font-semibold limit__line__1">
                        {item?.title}
                      </p>
                      <p className="text-slate-600 text-xs mt-1 limit__line__2">
                        {item?.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* QR Popup */}
          {showQR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-2xl shadow-neuro-in p-6 flex flex-col items-center relative">
                <button
                  className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowQR(false)}
                  aria-label="Close QR"
                >
                  &times;
                </button>
                <p className="text-sm font-semibold mb-2">Barcode Akun Anda</p>
                <QRCode
                  value={data?.data?.profile?.code || 'huehuy-user'}
                  size={160}
                  bgColor="#f8fafc"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin={true}
                  className="rounded-lg"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {data?.data?.profile?.code}
                </p>
              </div>
            </div>
          )}

          <div
            className="bg-red-50 text-red-700 rounded-xl mt-4 p-4 flex gap-4 items-center border-b border-b-gray-200 shadow-neuro-in cursor-pointer hover:scale-[1.01] transition"
            onClick={() => {
              setModalConfirm(true);
            }}
          >
            <FontAwesomeIcon icon={faPowerOff} />
            <p className="font-medium">Keluar</p>
          </div>
        </div>
        <BottomBarComponent active={'user'} />
      </div>

      <BottomSheetComponent
        show={modalConfirm}
        onClose={() => setModalConfirm(false)}
        title={'Yakin mau keluar?'}
        height={130}
      >
        <div className="grid grid-cols-2 gap-4 p-4">
          <ButtonComponent
            label="Batal"
            variant="light"
            block
            rounded
            onClick={() => setModalConfirm(false)}
          />
          <ButtonComponent
            label="Ya"
            variant="simple"
            paint="danger"
            block
            rounded
            onClick={() => {
              Cookies.remove(token_cookie_name);
              router.push('/');
            }}
          />
        </div>
      </BottomSheetComponent>
    </>
  );
}
