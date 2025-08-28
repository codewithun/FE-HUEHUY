import {
  faArrowLeftLong,
  faCheckCircle,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import {
  ButtonComponent,
  IconButtonComponent,
  InputComponent,
  ModalConfirmComponent,
} from '../../components/base.components';
import { token_cookie_name } from '../../helpers';
import { Decrypt } from '../../helpers/encryption.helpers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Validasi() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [modalSuccess, setModalSuccess] = useState();
  const [modalFailed, setModalFailed] = useState();
  const [loading, setLoading] = useState(false);
  const [lastItemId, setLastItemId] = useState(null);
  const [lastItemType, setLastItemType] = useState(null);

  const submitValidate = async (parsingCode = null) => {
    setLoading(true);
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : null;

      if (!token) {
        // console.error('No token found');
        setModalFailed(true);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const codeToValidate = parsingCode || code;

      // Try promo validation first
      let res = await fetch(`${apiUrl}/promos/validate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: codeToValidate,
        }),
      });

      let result = await res.json().catch(() => null);
      let itemType = 'promo';

      // If promo validation fails, try voucher validation
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
        // console.error('Token expired or invalid');
        setModalFailed(true);
      } else if (res.ok) {
        // Get the ID from either promo or voucher data
        const itemId = result?.data?.promo?.id || result?.data?.voucher?.id;
        setLastItemId(itemId);
        setLastItemType(itemType);
        setModalSuccess(true);
      } else {
        // console.error('validate failed', res.status, result);
        setModalFailed(true);
      }
    } catch (err) {
      // console.error('validate exception:', err);
      setModalFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
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
            </div>
            <div className="font-semibold w-full text-lg">Validasi</div>
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
              <InputComponent
                placeholder="Masukkan kode disini..."
                value={code}
                onChange={(e) => setCode(e)}
                size="lg"
              />

              <div className="mt-6 px-8">
                <ButtonComponent
                  label="Validasi"
                  block
                  size="lg"
                  onClick={() => submitValidate()}
                  loading={loading}
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
          // kirim id ke halaman riwayat (hanya kalau ada)
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
