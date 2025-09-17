import {
  faArrowLeftLong,
  faCheckCircle,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  ButtonComponent,
  IconButtonComponent,
  InputComponent,
  ModalConfirmComponent,
} from '../../components/base.components';
import QrScannerComponent from '../../components/construct.components/QrScannerComponent';
import { useUserContext } from '../../context/user.context';
import { token_cookie_name } from '../../helpers';
import { Decrypt } from '../../helpers/encryption.helpers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Validasi() {
  const router = useRouter();
  const { profile, loading, fetchProfile } = useUserContext();
  
  const [code, setCode] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalFailed, setModalFailed] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lastItemId, setLastItemId] = useState(null);
  const [lastItemType, setLastItemType] = useState(null);

  useEffect(() => {
    const token = Cookies.get(token_cookie_name);
    
    if (token && !profile && !loading) {
      fetchProfile();
    }
  }, [profile, loading, fetchProfile]);

  // Clear kode saat halaman dimuat untuk memastikan input kosong
  useEffect(() => {
    setCode('');
  }, []);

  // Clear kode saat router ready untuk mencegah auto-fill dari sumber manapun
  useEffect(() => {
    if (router.isReady) {
      setCode('');
    }
  }, [router.isReady]);

  const isManagerTenant = profile?.role_id === 6;

  const handleScanResult = async (result) => {
    if (!result || submitLoading) return;
    setCode(result);
    await submitValidate(result);
  };

  const submitValidate = async (parsingCode = null) => {
    setSubmitLoading(true);
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : null;

      if (!token) {
        setModalFailed(true);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const codeToValidate = parsingCode || code;

      let res = await fetch(`${apiUrl}/promos/validate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: codeToValidate,
        }),
      });

      let result = await res.json().catch(() => null);
      let itemType = 'promo';

      if (!res.ok) {
        res = await fetch(`${apiUrl}/vouchers/validate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: codeToValidate,
          }),
        });

        result = await res.json().catch(() => null);
        itemType = 'voucher';
      }

      if (res.status === 401) {
        setModalFailed(true);
      } else if (res.ok) {
        const itemId = result?.data?.promo?.id || result?.data?.voucher?.id;
        setLastItemId(itemId);
        setLastItemType(itemType);
        setModalSuccess(true);
      } else {
        setModalFailed(true);
      }
    } catch (err) {
      setModalFailed(true);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
          <div className="flex justify-between items-center gap-2 p-2 sticky top-0 z-30 bg-white bg-opacity-40 backdrop-blur-sm border-b">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={() => router.back()}
              />
            </div>
            <div className="font-semibold w-full text-lg">
              Validasi
            </div>
            <Link href="/app/riwayat-validasi">
              <ButtonComponent
                variant="simple"
                label="Riwayat"
                size="md"
                icon={faHistory}
              />
            </Link>
          </div>

          <div className="bg-background bg-gradient-to-br -mt-4 rounded-t-[15px] pt-2 from-cyan-50 relative z-50 px-4">
            <div className="flex justify-center items-center gap-4 my-6">
              <div className="w-1/5 h-0.5 bg-gray-300"></div>
              <p className="text-slate-400 font-medium text-center">
                Masukkan Kode
              </p>
              <div className="w-1/5 h-0.5 bg-gray-300"></div>
            </div>

            <div className="">
              {isManagerTenant && (
                <div className="mb-6">
                  <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                    <QrScannerComponent onScan={handleScanResult} />
                  </div>
                </div>
              )}
              <InputComponent
                placeholder="Masukkan kode disini..."
                value={code}
                onChange={(e) => setCode(e)}
                size="lg"
              />

              <div className="mt-6 px-8 flex flex-col gap-3">
                <ButtonComponent
                  label="Validasi"
                  block
                  size="lg"
                  onClick={() => submitValidate()}
                  loading={submitLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalConfirmComponent
        show={modalSuccess}
        onClose={() => setModalSuccess(false)}
        paint="primary"
        icon={faCheckCircle}
        title={`Selamat, ${lastItemType === 'promo' ? 'Promo' : 'Voucher'} Berhasil di validasi`}
        onSubmit={async () => {
          setModalSuccess(false);
          if (lastItemId) {
            router.push(`/app/riwayat-validasi?id=${lastItemId}&type=${lastItemType}`);
          } else {
            router.push('/app/riwayat-validasi');
          }
        }}
      />

      <ModalConfirmComponent
        show={modalFailed}
        onClose={() => setModalFailed(false)}
        paint="danger"
        icon={faCheckCircle}
        title={`Kode Tidak Valid / Sudah Digunakan`}
        onSubmit={async () => {
          setModalFailed(false);
        }}
      />
    </>
  );
}
