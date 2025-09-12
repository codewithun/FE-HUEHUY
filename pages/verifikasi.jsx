import { faCheck } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import {
  ButtonComponent,
  ModalConfirmComponent,
} from '../components/base.components';
import InputOtpComponent from '../components/base.components/input/InputOtpComponent';
import { post, useForm, useGet, token_cookie_name } from '../helpers';
import { Encrypt } from '../helpers/encryption.helpers';

const isSafeInternal = (url) => {
  if (typeof window === 'undefined') return false;
  try { return new URL(url, window.location.origin).origin === window.location.origin; }
  catch { return false; }
};
const consumeNext = () => {
  const s = typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null;
  if (s && isSafeInternal(s)) {
    localStorage.removeItem('postAuthRedirect');
    return s;
  }
  return null;
};

export default function Verification() {
  const router = useRouter();
  const [sendMailLoading, setSendMailLoading] = useState(false);
  const [waitingMail, setWaitingMail] = useState(60);
  const [modalSendMailSuccess, setModalSendMailSuccess] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      // eslint-disable-next-line no-console
      console.log('Verification page query:', router.query);
    }
  }, [router.isReady, router.query]);

  const onSuccess = (response) => {
    try {
      // eslint-disable-next-line no-console
      console.log('Verification success response:', response);

      const maybeToken = response?.data?.token || response?.data?.data?.token;
      if (maybeToken) {
        Cookies.set(token_cookie_name, Encrypt(maybeToken), {
          expires: 365,
          secure: true,
        });
      }

      const redirectUrl = response?.data?.redirect_url || response?.data?.data?.redirect_url;
      const qNext = typeof router.query.next === 'string' ? router.query.next : null;
      const email = router.query.email;

      // 1) pakai next dari query terlebih dulu (prioritas utama)
      if (qNext) {
        let targetUrl = String(qNext);
        try { targetUrl = decodeURIComponent(targetUrl); } catch { }
        try { targetUrl = decodeURIComponent(targetUrl); } catch { }
        if (isSafeInternal(targetUrl)) {
          setTimeout(() => { window.location.href = targetUrl; }, 400);
          return;
        }
      }

      // 2) fallback ke yang kita simpan sebelumnya (postAuthRedirect)
      const storedNext = consumeNext();
      if (storedNext) {
        setTimeout(() => { window.location.href = storedNext; }, 400);
        return;
      }

      // 3) kalau BE kasih redirect_url, hormati (hanya internal)
      if (redirectUrl && isSafeInternal(redirectUrl)) {
        setTimeout(() => { window.location.href = redirectUrl; }, 500);
        return;
      }

      // 4) jika tidak ada token dari BE setelah verify, arahkan ke login agar sesi jelas
      if (!maybeToken) {
        const loginUrl = email ? `/?email=${encodeURIComponent(String(email))}&verified=1` : '/';
        setTimeout(() => { window.location.href = loginUrl; }, 300);
        return;
      }

      // 5) fallback terakhir ke /app
      setTimeout(() => { window.location.href = '/app'; }, 200);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Verification error:', error);
    }
  };

  const [{ submit, loading, values, setValues, errors }] = useForm(
    {
      path: 'email-verification/verify-code',
      data: {
        email: '',
        code: '',
        qr_data: router.query.qr_data || null,
      },
    },
    false,
    onSuccess
  );

  // Selalu fetch account-unverified agar punya fallback email
  const [loadingAccount, codeDataAccount, dataAccount] = useGet(
    { path: 'account-unverified' },
    false
  );

  // Gabungkan email dari query atau dari account-unverified ke payload
  const qEmail = useMemo(() => (typeof router.query.email === 'string' ? router.query.email : ''), [router.query.email]);
  const acctEmail = useMemo(() => (dataAccount?.data?.profile?.email ? String(dataAccount.data.profile.email) : ''), [dataAccount]);

  useEffect(() => {
    const merged = (qEmail || acctEmail || '').trim();
    if (!merged) return;
    setValues((prev) => {
      const others = prev.filter((v) => v.name !== 'email');
      return [...others, { name: 'email', value: merged }];
    });
  }, [qEmail, acctEmail, setValues]);

  // Timer aman untuk tombol Kirim Ulang
  useEffect(() => {
    if (!waitingMail) return;
    const t = setInterval(() => {
      setWaitingMail((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [waitingMail]);

  const resendMail = async (e) => {
    e.preventDefault();
    setSendMailLoading(true);
    try {
      const emailVal = qEmail || acctEmail;
      if (!emailVal) return;

      const response = await post({
        path: 'email-verification/resend-code',
        body: { email: emailVal },
        contentType: 'application/json',
      });

      // eslint-disable-next-line no-console
      console.log('Resend response:', response);
      if (response?.success || response?.status === 200) {
        setWaitingMail(60);
        setModalSendMailSuccess(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Resend email error:', error);
    } finally {
      setSendMailLoading(false);
    }
  };

  const codeValue = values?.find((v) => v.name === 'code')?.value || '';

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

            <h1 className="text-3xl font-bold text-primary mt-6">Verifikasi Email</h1>
            <p className="mt-1 text-slate-500 text-center w-[90%]">
              Silahkan masukkan kode verifikasi yang dikirim ke email {qEmail || acctEmail}
            </p>
            <p className="mt-1 text-slate-500 text-center w-[90%] font-semibold">
              Jika pesan verifikasi tidak masuk, silahkan cek folder spam!
            </p>
          </div>

          <form onSubmit={submit}>
            <div className="flex justify-center pt-8 pb-6">
              <InputOtpComponent
                value={codeValue}
                onChange={(e) => {
                  const clean = String(e || '').replace(/\D/g, '').slice(0, 6);
                  setValues((prev) => {
                    const others = prev.filter((v) => v.name !== 'code');
                    return [...others, { name: 'code', value: clean }];
                  });
                }}
                error={errors?.find(({ name }) => name === 'code')?.error}
                max={6}
              />
            </div>
            <div className="px-20 mt-4">
              <ButtonComponent type="submit" label="Verifikasi" block size="xl" loading={loading} />
            </div>
            <div className="text-center text-gray-500 mt-6 flex items-center gap-2 justify-center">
              Belum mendapat pesan verifikasi?
              <ButtonComponent
                label={waitingMail ? `Kirim Ulang (${waitingMail})` : 'Kirim Ulang'}
                variant="light"
                size={'sm'}
                disabled={!!waitingMail}
                loading={sendMailLoading}
                onClick={resendMail}
              />
            </div>
          </form>
          <div className="mt-10 px-4 py-4">
            <Link href="/app/hubungi-kami">
              <div className="text-center text-primary font-semibold underline">Hubungi Admin</div>
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