import axios from 'axios';
import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ButtonComponent, InputComponent } from '../../components/base.components';
import { clearOtpMarker, getPromoId, isOtpRecentlySent, isValidPromoId, markOtpSent, savePromoId, token_cookie_name, useForm } from '../../helpers';
import { Decrypt, Encrypt } from '../../helpers/encryption.helpers';

export default function VerifyOTP() {
  const router = useRouter();
  const [promoId, setPromoId] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    // Ambil promoId dari URL query parameter atau sessionStorage
    let currentPromoId = router.query.promoId;
    
    if (!currentPromoId) {
      currentPromoId = getPromoId();
    }
    
    if (currentPromoId && isValidPromoId(currentPromoId)) {
      setPromoId(currentPromoId);
      // Pastikan tersimpan di sessionStorage
      savePromoId(currentPromoId);
    }

    // Ambil info user dari temporary token
    const tempToken = Cookies.get('temp_user_token');
    if (tempToken) {
      try {
        const decryptedData = Decrypt(tempToken);
        // Asumsikan token berisi info user atau phone number
        setUserPhone(decryptedData.phone || '08****');
      } catch (error) {
        console.error('Error decrypting temp token:', error);
      }
    }

    // Cek apakah OTP sudah dikirim dalam sesi ini menggunakan helper
    const { isSent, remainingTime } = isOtpRecentlySent();
    
    if (isSent && remainingTime > 0) {
      setCountdown(remainingTime);
      setCanResend(false);
    } else {
      setCanResend(true);
      setCountdown(0);
    }

    // Start countdown jika diperlukan
    if (countdown > 0) {
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
  }, [router.query]);

  const onSuccess = (data) => {
    // Hapus temporary token dan session data menggunakan helper
    Cookies.remove('temp_user_token');
    clearOtpMarker();
    
    // Simpan token user yang sudah terverifikasi
    Cookies.set(
      token_cookie_name,
      Encrypt(data.user_token),
      { expires: 365 },
      { secure: true }
    );

    // Redirect ke halaman detail promo dengan communityId
    if (promoId && isValidPromoId(promoId)) {
      window.location.href = `/app/komunitas/promo/detail_promo?promoId=${promoId}&communityId=promo-entry`;
    } else {
      window.location.href = '/app';
    }
  };

  const [{ formControl, submit, loading }] = useForm(
    {
      path: 'auth/verify-otp',
    },
    false,
    onSuccess
  );

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    
    try {
      const tempToken = Cookies.get('temp_user_token');
      if (!tempToken) {
        throw new Error('Session expired');
      }

      const formData = new FormData();
      formData.append('temp_token', tempToken);
      if (promoId) {
        formData.append('promo_id', promoId);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`,
        formData
      );

      if (response.status === 200) {
        // Tandai OTP sudah dikirim menggunakan helper
        markOtpSent();
        
        // Reset countdown
        setCountdown(60);
        setCanResend(false);
        
        // Restart countdown timer
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

        alert('Kode OTP baru telah dikirim ke WhatsApp Anda!');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      alert('Gagal mengirim ulang OTP. Silakan coba lagi.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const tempToken = Cookies.get('temp_user_token');
      if (!tempToken) {
        alert('Session expired. Silakan daftar ulang.');
        router.push('/promo-entry/register');
        return;
      }

      // Tambahkan temp token dan promo code ke form data
      const formData = new FormData(e.target);
      formData.append('temp_token', tempToken);
      if (promoCode) {
        formData.append('promo_code', promoCode);
      }
      
      await submit(e);
    } catch (error) {
      console.error('OTP verification error:', error);
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
              Verifikasi OTP
            </h1>
          </div>

          {promoCode && (
            <div className="px-8 py-4 mx-8 mt-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-semibold text-center">
                Kode Promo: {promoCode.toUpperCase()}
              </p>
            </div>
          )}

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
            onSubmit={handleSubmit}
          >
            <InputComponent
              name="otp_code"
              label="Kode OTP"
              size="lg"
              placeholder="Masukkan 6 digit kode OTP"
              {...formControl('otp_code')}
              validations={{
                required: true,
                pattern: /^[0-9]{6}$/,
                max: 6,
              }}
              tip="Kode OTP terdiri dari 6 digit angka"
            />            <div className="px-6 mt-4">
              <ButtonComponent
                type="submit"
                label="Verifikasi & Lanjutkan"
                block
                size="xl"
                loading={loading}
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

          <div className="mt-8 px-8">
            <div className="text-center text-sm text-slate-500">
              Belum menerima kode?{' '}
              <Link href="/app/hubungi-kami">
                <span className="text-primary font-semibold underline">
                  Hubungi Admin
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-4 px-8">
            <div className="text-center">
              <Link href="/promo-entry/register">
                <span className="text-sm text-slate-500 underline">
                  Kembali ke Pendaftaran
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
