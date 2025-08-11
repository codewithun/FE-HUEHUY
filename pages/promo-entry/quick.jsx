import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ButtonComponent, InputComponent } from '../../components/base.components';
import { token_cookie_name, useForm } from '../../helpers';
import { Encrypt } from '../../helpers/encryption.helpers';

export default function QuickPromoEntry() {
  const router = useRouter();
  const [promoCode, setPromoCode] = useState('');
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [userPhone, setUserPhone] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    // Ambil kode promo dari URL query parameter
    if (router.query.code) {
      setPromoCode(router.query.code);
    }

    // Cek apakah user sudah login
    const userToken = Cookies.get(token_cookie_name);
    if (userToken && router.query.code) {
      // Jika sudah login, langsung redirect ke halaman promo
      window.location.href = `/promo/${router.query.code}`;
    }
  }, [router.query]);

  // Countdown timer untuk OTP
  useEffect(() => {
    if (step === 'verify' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const onRegisterSuccess = (data) => {
    // Simpan temporary token
    Cookies.set(
      'temp_user_token',
      Encrypt(data.temp_token || data.user_token),
      { expires: 1 },
      { secure: true }
    );

    // Simpan nomor phone untuk ditampilkan
    if (data.phone) {
      setUserPhone(data.phone);
    }

    // Pindah ke step verifikasi
    setStep('verify');
    setCountdown(60);
    setCanResend(false);
  };

  const onVerifySuccess = (data) => {
    // Hapus temporary token
    Cookies.remove('temp_user_token');
    
    // Simpan token user yang sudah terverifikasi
    Cookies.set(
      token_cookie_name,
      Encrypt(data.user_token),
      { expires: 365 },
      { secure: true }
    );

    // Redirect ke halaman promo
    const redirectUrl = promoCode 
      ? `/promo/${promoCode}` 
      : '/app';
    
    window.location.href = redirectUrl;
  };

  const [{ formControl: registerFormControl, submit: submitRegister, loading: registerLoading }] = useForm(
    {
      path: 'auth/promo-register',
    },
    false,
    onRegisterSuccess
  );

  const [{ formControl: verifyFormControl, submit: submitVerify, loading: verifyLoading }] = useForm(
    {
      path: 'auth/verify-otp',
    },
    false,
    onVerifySuccess
  );

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.target);
      if (promoCode) {
        formData.append('promo_code', promoCode);
      }
      
      await submitRegister(e);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    
    try {
      const tempToken = Cookies.get('temp_user_token');
      if (!tempToken) {
        alert('Session expired. Silakan daftar ulang.');
        setStep('register');
        return;
      }

      const formData = new FormData(e.target);
      formData.append('temp_token', tempToken);
      if (promoCode) {
        formData.append('promo_code', promoCode);
      }
      
      await submitVerify(e);
    } catch (error) {
      console.error('OTP verification error:', error);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    
    try {
      const tempToken = Cookies.get('temp_user_token');
      if (!tempToken) {
        throw new Error('Session expired');
      }

      const formData = new FormData();
      formData.append('temp_token', tempToken);
      if (promoCode) {
        formData.append('promo_code', promoCode);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (response.ok) {
        setCountdown(60);
        setCanResend(false);
        alert('Kode OTP baru telah dikirim ke WhatsApp Anda!');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      alert('Gagal mengirim ulang OTP. Silakan coba lagi.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

            <h1 className="text-3xl font-semibold text-secondary mt-6">
              {step === 'register' ? 'Ambil Promo Sekarang!' : 'Verifikasi OTP'}
            </h1>
          </div>

          {promoCode && (
            <div className="px-8 py-4 mx-8 mt-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-semibold text-center">
                Kode Promo: {promoCode.toUpperCase()}
              </p>
            </div>
          )}

          {step === 'register' ? (
            // STEP 1: REGISTRASI
            <>
              <p className="text-sm text-slate-500 mt-4 px-8 text-center font-medium">
                Daftar dulu yuk biar bisa ambil promo menarik! Cuma butuh nama dan nomor WA aja kok 😊
              </p>

              <form
                className="px-8 pt-8 pb-6 flex flex-col gap-6"
                onSubmit={handleRegisterSubmit}
              >
                <InputComponent
                  name="name"
                  label="Nama Lengkap"
                  size="lg"
                  placeholder="Contoh: Joko Gunawan"
                  {...registerFormControl('name')}
                  validations={{
                    required: true,
                  }}
                />
                
                <InputComponent
                  name="phone"
                  label="Nomor WhatsApp"
                  size="lg"
                  placeholder="Contoh: 08123456789"
                  {...registerFormControl('phone')}
                  validations={{
                    required: true,
                    pattern: /^08[0-9]{8,11}$/,
                  }}
                  tip="Pastikan nomor WA aktif untuk menerima kode OTP"
                />

                <div className="px-6 mt-4">
                  <ButtonComponent
                    type="submit"
                    label="Daftar & Kirim OTP"
                    block
                    size="xl"
                    loading={registerLoading}
                  />
                </div>
                
                <div className="text-center mt-2 text-xs text-slate-400">
                  Kode OTP akan dikirim via WhatsApp untuk verifikasi
                </div>
              </form>
            </>
          ) : (
            // STEP 2: VERIFIKASI OTP
            <>
              <div className="px-8 py-4 mx-8 mt-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-green-700 font-medium">
                    Kode OTP telah dikirim ke WhatsApp {userPhone}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-4 px-8 text-center font-medium">
                Masukkan 6 digit kode OTP yang dikirim ke WhatsApp kamu
              </p>

              <form
                className="px-8 pt-8 pb-6 flex flex-col gap-6"
                onSubmit={handleVerifySubmit}
              >
                <InputComponent
                  name="otp_code"
                  label="Kode OTP"
                  size="lg"
                  placeholder="Masukkan 6 digit kode OTP"
                  autoFocus
                  {...verifyFormControl('otp_code')}
                  validations={{
                    required: true,
                    pattern: /^[0-9]{6}$/,
                    max: 6,
                  }}
                  tip="Kode OTP terdiri dari 6 digit angka"
                />

                <div className="px-6 mt-4">
                  <ButtonComponent
                    type="submit"
                    label="Verifikasi & Ambil Promo"
                    block
                    size="xl"
                    loading={verifyLoading}
                  />
                </div>
              </form>

              <div className="px-8">
                <div className="text-center">
                  {!canResend ? (
                    <p className="text-sm text-slate-500">
                      Kirim ulang OTP dalam {formatTime(countdown)}
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                      className="text-sm text-primary font-semibold underline hover:no-underline disabled:opacity-50"
                    >
                      {resendLoading ? 'Mengirim...' : 'Kirim Ulang Kode OTP'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 px-8">
                <div className="text-center">
                  <button
                    onClick={() => setStep('register')}
                    className="text-sm text-slate-500 underline"
                  >
                    Kembali ke Pendaftaran
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 px-8">
            <div className="text-center text-sm text-slate-500">
              Sudah punya akun?{' '}
              <Link href={promoCode ? `/app/scanner/scan-qr?code=${promoCode}` : '/app'}>
                <span className="text-primary font-semibold underline">
                  Login di sini
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-4 px-4 py-4">
            <Link href="/app/hubungi-kami">
              <div className="text-center text-primary font-semibold underline text-sm">
                Butuh Bantuan?
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
