/* eslint-disable @next/next/no-img-element */
import {
  faChevronRight,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/router';
import QRCode from 'qrcode.react';
import { useState } from 'react';
import { ButtonComponent } from '../../components/base.components';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import { token_cookie_name, useGet } from '../../helpers';

export default function Akun() {
  const router = useRouter();
  const [modalConfirm, setModalConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false); // state popup QR

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: `account`,
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

        <div className="px-4 pb-28">
          <p className="text-sm font-semibold mt-6">Inventory</p>
          <div className="flex flex-col gap-3 mt-2">
            <Link href="/app/kubusku">
              <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                <p className="font-medium">Kubusku</p>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </Link>
            
            {/* Menu Scan QR untuk Manager Tenant */}
            {data?.data?.profile?.role_id === 6 && (
              <Link href="/app/scan-validasi">
                <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                  <p className="font-medium">Scan QR Validasi</p>
                  <FontAwesomeIcon icon={faChevronRight} />
                </div>
              </Link>
            )}
            
            <Link href="/app/riwayat-validasi">
              <div className="flex justify-between items-center bg-white rounded-xl shadow-neuro-in px-5 py-4 hover:scale-[1.01] transition cursor-pointer">
                <p className="font-medium">Riwayat Validasi</p>
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

          {/* Logout Button */}
          <div
            className="bg-red-50 text-red-700 rounded-xl mt-8 p-4 flex gap-4 items-center shadow-neuro-in cursor-pointer hover:scale-[1.01] transition"
            onClick={() => {
              setModalConfirm(true);
            }}
          >
            <FontAwesomeIcon icon={faPowerOff} />
            <p className="font-medium">Keluar</p>
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