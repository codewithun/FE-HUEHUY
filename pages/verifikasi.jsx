import { faCheck } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie'; // TAMBAH INI
import {
  ButtonComponent,
  ModalConfirmComponent,
} from '../components/base.components';
import InputOtpComponent from '../components/base.components/input/InputOtpComponent';
import { post, useForm, useGet, token_cookie_name } from '../helpers'; // TAMBAH token_cookie_name
import { Encrypt } from '../helpers/encryption.helpers'; // TAMBAH INI

export default function Verification() {
  const router = useRouter();
  const [sendMailLoading, setSendMailLoading] = useState(false);
  const [waitingMail, setWaitingMail] = useState(60);
  const [modalSendMailSuccess, setModalSendMailSuccess] = useState(false);

  // DEBUG: Log query parameters saat halaman dimuat
  useEffect(() => {
    if (router.isReady) {
      // eslint-disable-next-line no-console
      console.log('Verification page loaded with query:', router.query);
      // eslint-disable-next-line no-console
      console.log('Email from query:', router.query.email);
      // eslint-disable-next-line no-console
      console.log('Next from query:', router.query.next);
    }
  }, [router.isReady, router.query]);

  // after successful verification, redirect to original target if provided
  const onSuccess = (response) => {
    try {
      // Backend returns token in response.data.token
      if (response?.data?.token) {
        Cookies.set(
          token_cookie_name,
          Encrypt(response.data.token),
          { expires: 365, secure: true }
        );
      }

      // Backend includes redirect_url in response.data.redirect_url
      const redirectUrl = response?.data?.redirect_url;
      
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);
        return;
      }

      // Fallback logic
      const qrData = response?.data?.qr_data || router.query.qr_data;
      const next = router.query.next;

      if (next) {
        const targetUrl = decodeURIComponent(String(next));
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 500);
        return;
      }

      setTimeout(() => {
        window.location.href = '/app';
      }, 200);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error in onSuccess:', e);
      // Fallback redirect
      setTimeout(() => {
        window.location.href = '/app';
      }, 200);
    }
  };

  // Use mailVerify endpoint (not mailVerifySimple)
  const [{ submit, loading, values, setValues, errors }] = useForm(
    {
      path: 'auth/verify-mail', // Changed from 'auth/verify-mail-simple'
      data: {
        email: router.query.email || '',
        token: '',
        qr_data: router.query.qr_data || null
      }
    },
    false,
    onSuccess,
  );


  // Fix resend mail function
  const resendMail = async (e) => {
    e.preventDefault();
    setSendMailLoading(true);

    try {
      const email = router.query.email || dataAccount?.data?.profile?.email;

      if (email) {
        const response = await post({
          path: 'auth/resend-mail',
          body: { email: email },
          contentType: 'application/json'
        });

        if (response?.status === 200) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                value={values?.find(({ name }) => name == 'token')?.value || ''} // ← PERBAIKAN: Tambahkan || ''
                onChange={(e) => {
                  setValues([
                    ...values.filter(({ name }) => name != 'token'),
                    { name: 'token', value: e },
                  ]);
                }}
                error={errors?.find(({ name }) => name == 'token')?.error}
                max={6}
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
