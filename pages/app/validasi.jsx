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

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api$/, '');

export default function Validasi() {
  const router = useRouter();
  const { profile, loading, fetchProfile } = useUserContext();

  const [code, setCode] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalFailed, setModalFailed] = useState(false);
  const [modalFailedMessage, setModalFailedMessage] = useState('Kode Tidak Valid / Sudah Digunakan');
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
        setModalFailedMessage('Sesi login berakhir. Silakan login kembali.');
        setModalFailed(true);
        setSubmitLoading(false);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // First, try to validate the code directly without checking user items
      // This allows tenant to validate items that belong to users

      const codeToValidate = parsingCode || code;

      // Validasi kode tidak boleh kosong
      if (!codeToValidate || codeToValidate.trim() === '') {
        setModalFailedMessage('Kode validasi tidak boleh kosong.');
        setModalFailed(true);
        setSubmitLoading(false);
        return;
      }

      // eslint-disable-next-line no-console
      console.log('🔍 Validating code:', codeToValidate);

      // Try promo validation first - use endpoint that supports tenant validation
      let res = await fetch(`${apiUrl}/api/promos/validate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: codeToValidate.trim(), // Trim whitespace
          validator_role: isManagerTenant ? 'tenant' : 'user' // Indicate if this is tenant validation
        }),
      });

      let result = await res.json().catch(() => null);
      let itemType = 'promo';
      let promoError = null;

      // eslint-disable-next-line no-console
      console.log('📡 Promo validation response:', {
        status: res.status,
        ok: res.ok,
        result: result
      });

      // If promo validation fails, store the error and try voucher validation
      if (!res.ok) {
        promoError = {
          status: res.status,
          message: result?.message,
          result: result
        };

        // eslint-disable-next-line no-console
        console.log('🔍 Trying voucher validation...');

        res = await fetch(`${apiUrl}/api/vouchers/validate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: codeToValidate.trim(),
            validator_role: isManagerTenant ? 'tenant' : 'user' // Indicate if this is tenant validation
          }),
        });

        result = await res.json().catch(() => null);
        itemType = 'voucher';

        // eslint-disable-next-line no-console
        console.log('📡 Voucher validation response:', {
          status: res.status,
          ok: res.ok,
          result: result
        });
      }

      if (res.status === 401) {
        setModalFailedMessage('Sesi login berakhir. Silakan login kembali.');
        setModalFailed(true);
      } else if (res.ok) {
        const itemId = result?.data?.promo?.id || result?.data?.voucher?.id;
        setLastItemId(itemId);
        setLastItemType(itemType);
        setModalSuccess(true);

        // Clear kode setelah validasi berhasil
        setCode('');

        // eslint-disable-next-line no-console
        console.log('✅ Validation successful:', {
          itemType,
          itemId,
          code: codeToValidate
        });
      } else {
        // Handle specific error cases dengan pesan yang lebih informatif
        let errorMsg = 'Kode tidak valid atau tidak ditemukan';

        // Check if this is likely a validation of already used item
        const isAlreadyValidated = (status, message) => {
          return status === 400 ||
            status === 409 ||
            (message && (
              message.toLowerCase().includes('sudah') ||
              message.toLowerCase().includes('digunakan') ||
              message.toLowerCase().includes('divalidasi') ||
              message.toLowerCase().includes('already') ||
              message.toLowerCase().includes('used')
            ));
        };

        const isNotFound = (status, message) => {
          return status === 404 ||
            (message && (
              message.toLowerCase().includes('tidak ditemukan') ||
              message.toLowerCase().includes('not found') ||
              message.toLowerCase().includes('invalid')
            ));
        };

        // Prioritize "already validated" messages over "not found"
        if (promoError && isAlreadyValidated(promoError.status, promoError.message)) {
          errorMsg = `Promo dengan kode "${codeToValidate}" sudah pernah divalidasi sebelumnya.`;
        } else if (isAlreadyValidated(res.status, result?.message)) {
          errorMsg = `${itemType === 'promo' ? 'Promo' : 'Voucher'} dengan kode "${codeToValidate}" sudah pernah divalidasi sebelumnya.`;
        } else if (promoError && promoError.status === 404 && res.status === 404) {
          // Both promo and voucher returned 404 - code doesn't exist
          errorMsg = `Kode "${codeToValidate}" tidak ditemukan. Pastikan kode yang Anda masukkan sudah benar.`;
        } else if (isNotFound(res.status, result?.message)) {
          errorMsg = `${itemType === 'promo' ? 'Promo' : 'Voucher'} dengan kode "${codeToValidate}" tidak ditemukan.`;
        } else if (res.status === 422) {
          errorMsg = result?.message || `Kode "${codeToValidate}" tidak valid atau format salah.`;
        } else if (result?.message) {
          errorMsg = result.message;
        }

        setModalFailedMessage(errorMsg);
        setModalFailed(true);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Validation error:', err);
      setModalFailedMessage('Terjadi kesalahan saat validasi. Silakan coba lagi.');
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
          try { localStorage.setItem('tenant_view', '1'); } catch { }
          const base = '/app/riwayat-validasi';
          const q = lastItemId
            ? `?id=${encodeURIComponent(lastItemId)}&type=${encodeURIComponent(lastItemType)}&ctx=tenant`
            : `?ctx=tenant`;
          router.push(`${base}${q}`);
        }}
      />

      <ModalConfirmComponent
        show={modalFailed}
        onClose={() => setModalFailed(false)}
        paint="danger"
        icon={faCheckCircle}
        title={modalFailedMessage}
        onSubmit={async () => {
          setModalFailed(false);
        }}
      />
    </>
  );
}
