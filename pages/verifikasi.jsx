import { faCheck } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  ButtonComponent,
  ModalConfirmComponent,
} from '../components/base.components';
import InputOtpComponent from '../components/base.components/input/InputOtpComponent';
import { post, useForm, useGet } from '../helpers';

export default function Verification() {
  const router = useRouter();
  const [sendMailLoading, setSendMailLoading] = useState(false);
  const [waitingMail, setWaitingMail] = useState(60);
  const [modalSendMailSuccess, setModalSendMailSuccess] = useState(false);

  // after successful verification, redirect to original target if provided
  const onSuccess = (response) => {

    try {
      // Check if there's QR data from registration
      const qrData = response?.data?.qr_data || router.query.qr_data;
      const next = router.query.next;

      if (qrData) {
        // QR scan flow - process QR data or redirect accordingly

        // Parse QR data if it's JSON string
        try {
          const parsedQrData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

          if (parsedQrData.type === 'promo' || parsedQrData.type === 'voucher') {
            // Redirect to promo/voucher validation page
            const targetUrl = `/app/validate/${parsedQrData.type}?id=${parsedQrData.promoId || parsedQrData.voucherId}&community=${parsedQrData.communityId}`;

            setTimeout(() => {
              window.location.href = targetUrl;
            }, 500); // Reduced delay
            return;
          }
        } catch (e) {
          // silent error handling
        }
      }

      if (next) {
        // Regular redirect flow
        const targetUrl = decodeURIComponent(String(next));

        setTimeout(() => {
          window.location.href = targetUrl;
        }, 500); // Reduced delay
        return;
      }
    } catch (e) {
      // silent error handling
    }

    // Default redirect ke app
    setTimeout(() => {
      window.location.href = '/app';
    }, 500); // Reduced delay
  };

  const [{ submit, loading, values, setValues, errors }] = useForm(
    {
      path: 'auth/verify-mail',
      // Add email to the form data for new verification system
      data: {
        email: router.query.email || ''
      }
    },
    false,
    onSuccess,
  );

  const resendMail = async (e) => {
    e.preventDefault();
    setSendMailLoading(true);

    try {
      const email = router.query.email || dataAccount?.data?.profile?.email;

      if (email) {
        // Gunakan endpoint yang benar sesuai backend
        const response = await post({ 
          path: 'auth/resend-mail',
          body: { email: email },
          contentType: 'application/json'
        });

        if (response?.status === 200 || response?.data?.success || response?.data?.message) {
          setWaitingMail(60);
          setModalSendMailSuccess(true);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Resend email error:', error);
    } finally {
      setSendMailLoading(false);
    }
  };

  useEffect(() => {
    let myInterval = setInterval(() => {
      if (waitingMail > 0) {
        setWaitingMail(waitingMail - 1);
      }
    }, 1000);
    return () => {
      clearInterval(myInterval);
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shouldSkipRequest = !router.query.email; // Skip jika tidak ada email di query
  const [loadingAccount, codeDataAccount, dataAccount] = useGet({
    path: `account-unverified`,
  }, shouldSkipRequest);

  return (
    <>
      <div className="lg:mx-auto relative lg:max-w-md">
        <div className="absolute top-0 left-0 w-full opacity-20">
          <Image src="/bg-cubes.png" height={1000} width={700} alt="" />
        </div>
        <div className="w-full min-h-screen bg-white z-10 flex flex-col justify-center">
          <div className="flex flex-col items-center relative z-10">
            <div className="w-32 aspect-square">
              <Image src={'/logo.png'} width={500} height={500} alt="" />
            </div>

            <h1 className="text-3xl font-bold text-primary mt-6">
              Verifikasi Email
            </h1>
            <p className="mt-1 text-slate-500 text-center w-[90%]">
              Silahkan masukkan kode verifikasi yang dikirim ke email{' '}
              {router.query.email || dataAccount?.data?.profile?.email}
            </p>
            <p className="mt-1 text-slate-500 text-center w-[90%] font-semibold">
              Jika pesan verifikasi tidak masuk, silahkan cek folder spam!
            </p>
          </div>

          <form onSubmit={submit}>
            <div className="flex justify-center pt-8 pb-6">
              <InputOtpComponent
                value={values?.find(({ name }) => name == 'token')?.value}
                onChange={(e) => {
                  setValues([
                    ...values.filter(({ name }) => name != 'token'),
                    { name: 'token', value: e },
                  ]);
                }}
                error={errors?.find(({ name }) => name == 'token')?.error}
                max={6} // Updated to support 6-digit codes
              />
            </div>
            <div className="px-20 mt-4">
              <ButtonComponent
                type="submit"
                label="Verifikasi"
                block
                size="xl"
                loading={loading}
              />
            </div>
            <div className="text-center text-gray-500 mt-6 flex items-center gap-2 justify-center">
              Belum mendapat pesan verifikasi?
              <ButtonComponent
                label={
                  waitingMail ? `Kirim Ulang (${waitingMail})` : 'Kirim Ulang'
                }
                variant="light"
                size={'sm'}
                disabled={waitingMail}
                loading={sendMailLoading}
                onClick={(e) => resendMail(e)}
              />
            </div>
          </form>
          <div className="mt-10 px-4 py-4">
            <Link href="/app/hubungi-kami">
              <div className="text-center text-primary font-semibold underline">
                Hubungi Admin
              </div>
            </Link>
          </div>
        </div>
      </div>

      <ModalConfirmComponent
        icon={faCheck}
        paint="primary"
        title="Email Verifikasi telah dikirim!"
        show={modalSendMailSuccess}
        onClose={() => setModalSendMailSuccess(false)}
        onSubmit={() => setModalSendMailSuccess(false)}
      />
    </>
  );
}
