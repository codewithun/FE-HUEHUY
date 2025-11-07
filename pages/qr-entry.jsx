/* eslint-disable no-console */
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ButtonComponent, InputComponent } from '../components/base.components';
import { token_cookie_name, useForm } from '../helpers';
import { Encrypt } from '../helpers/encryption.helpers';

const isSafeInternal = (url) => {
  try { 
    return new URL(url, window.location.origin).origin === window.location.origin; 
  } catch { 
    return false; 
  }
};

export default function QrEntry() {
  const router = useRouter();
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [userEmail, setUserEmail] = useState('');
  const [didSubmitRegister, setDidSubmitRegister] = useState(false);

  const onRegisterSuccess = (data) => {
    if (!didSubmitRegister) return;
    setDidSubmitRegister(false);
    
    if (data?.data?.user?.email) {
      setUserEmail(data.data.user.email);
      
      // ✅ SIMPAN TOKEN LANGSUNG SETELAH REGISTER
      const token = data?.data?.user_token;
      if (token) {
        try {
          const cookieOpts = { expires: 365, secure: process.env.NODE_ENV === 'production' };
          Cookies.set(token_cookie_name, Encrypt(token), cookieOpts);
          localStorage.setItem('auth_token', token);
        } catch (e) {
          console.error('Failed to save token:', e);
        }
      }
      
      setStep('verify');
    }
  };

  const onVerifySuccess = (data) => {
    // ✅ SIMPAN TOKEN SETELAH VERIFIKASI
    const token = data?.data?.token || data?.data?.user_token;
    if (token) {
      try {
        const cookieOpts = { expires: 365, secure: process.env.NODE_ENV === 'production' };
        Cookies.set(token_cookie_name, Encrypt(token), cookieOpts);
        localStorage.setItem('auth_token', token);
      } catch (e) {
        console.error('Failed to save token:', e);
      }
    }

    // ✅ REDIRECT KE URL YANG AMAN
    const redirectUrl = data?.data?.redirect_url;
    const target = (redirectUrl && isSafeInternal(redirectUrl)) ? redirectUrl : '/app';
    
    console.log('🔐 QR Entry Success - Redirecting to:', target);
    window.location.href = target;
  };

  const [{ formControl: registerFormControl, submit: registerSubmit, loading: registerLoading }] = useForm(
    {
      path: 'qr-entry/register',
      data: {
        qr_data: router.query.qr_data || null,
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