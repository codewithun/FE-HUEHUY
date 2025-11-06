import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ButtonComponent, InputComponent } from '../components/base.components';
import { token_cookie_name, useForm } from '../helpers';
import { Encrypt } from '../helpers/encryption.helpers';

const isSafeInternal = (url) => {
  try { return new URL(url, window.location.origin).origin === window.location.origin; }
  catch { return false; }
};
const saveNext = (router) => {
  const rawNext = router?.query?.next;
  const guess = typeof window !== 'undefined' ? window.location.href : null;
  const target = (typeof rawNext === 'string' && rawNext) ? rawNext : guess;
  if (target) localStorage.setItem('postAuthRedirect', target);
};
const consumeNext = () => {
  const stored = localStorage.getItem('postAuthRedirect');
  if (stored && isSafeInternal(stored)) {
    localStorage.removeItem('postAuthRedirect');
    return stored;
  }
  return null;
};

export default function QrEntry() {
  const router = useRouter();
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [userEmail, setUserEmail] = useState('');
  const [didSubmitRegister, setDidSubmitRegister] = useState(false);

  // Simpan tujuan awal saat masuk flow QR
  useEffect(() => {
    if (!router.isReady) return;
    saveNext(router);
  }, [router.isReady, router]);

  const onRegisterSuccess = (data) => {
    if (!didSubmitRegister) return; // guard: jangan auto lompat
    setDidSubmitRegister(false);
    if (data?.data?.user?.email) {
      setUserEmail(data.data.user.email);
      setStep('verify');
    }
  };

  const onVerifySuccess = (data) => {
    const redirectUrl = data?.data?.redirect_url;

    // Ambil token dari response (jika ada) dan simpan ke cookie
    const token = data?.data?.token || data?.data?.user_token || null;
    if (typeof token === 'string' && token) {
      try {
        const cookieOpts = { expires: 365, secure: process.env.NODE_ENV === 'production' };
        Cookies.set(token_cookie_name, Encrypt(token), cookieOpts);
        // Simpan juga ke localStorage sebagai fallback
        try { localStorage.setItem('auth_token', token); } catch {}
      } catch (e) {
        // ignore cookie write errors
      }
    }
    const qNext = typeof router.query.next === 'string' ? router.query.next : null;
    const storedNext = consumeNext();
    const target =
      (redirectUrl && isSafeInternal(redirectUrl) && redirectUrl) ||
      (qNext && isSafeInternal(qNext) && qNext) ||
      storedNext ||
      '/app';
    window.location.href = target;
  };

  const [{ formControl: registerFormControl, submit: registerSubmit, loading: registerLoading }] = useForm(
    {
      path: 'qr-entry/register',
      data: {
        qr_data: router.query.qr_data || null,
        next: typeof router.query.next === 'string' ? router.query.next : null
      }
    },
    false,
    onRegisterSuccess
  );

  const [{ formControl: verifyFormControl, submit: verifySubmit, loading: verifyLoading }] = useForm(
    {
      path: 'qr-entry/verify',
      data: {
        email: userEmail,
        qr_data: router.query.qr_data || null,
        next: typeof router.query.next === 'string' ? router.query.next : null
      }
    },
    false,
    onVerifySuccess
  );

  if (step === 'register') {
    return (
      <div className="container mx-auto max-w-md p-4">
        <h1 className="text-2xl font-bold mb-4">QR Entry Registration</h1>
        <form
          onSubmit={(e) => {
            setDidSubmitRegister(true);
            registerSubmit(e);
          }}
          className="space-y-4"
        >
          <InputComponent
            name="name"
            label="Nama Lengkap"
            {...registerFormControl('name')}
            validations={{ required: true }}
          />
          <InputComponent
            name="email"
            label="Email"
            type="email"
            {...registerFormControl('email')}
            validations={{ required: true, email: true }}
          />
          <InputComponent
            name="phone"
            label="No HP/WA"
            {...registerFormControl('phone')}
            validations={{ required: true }}
          />
          <InputComponent
            name="password"
            label="Password"
            type="password"
            {...registerFormControl('password')}
            validations={{ required: true, min: 8 }}
          />
          <InputComponent
            name="password_confirmation"
            label="Konfirmasi Password"
            type="password"
            {...registerFormControl('password_confirmation')}
            validations={{ required: true }}
          />
          <ButtonComponent
            type="submit"
            label="Daftar"
            block
            loading={registerLoading}
          />
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold mb-4">Verifikasi Email</h1>
      <p className="mb-4">Kode verifikasi telah dikirim ke {userEmail}</p>
      <form onSubmit={verifySubmit} className="space-y-4">
        <InputComponent
          name="code"
          label="Kode Verifikasi"
          placeholder="Masukkan 6 digit kode"
          {...verifyFormControl('code')}
          validations={{ required: true, min: 6, max: 6 }}
        />
        <ButtonComponent
          type="submit"
          label="Verifikasi"
          block
          loading={verifyLoading}
        />
      </form>
    </div>
  );
}