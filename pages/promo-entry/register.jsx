import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ButtonComponent, InputComponent } from '../../components/base.components';
import { getPromoId, isValidPromoId, savePromoId, useForm } from '../../helpers';
import { Encrypt } from '../../helpers/encryption.helpers';

export default function PromoRegister() {
  const router = useRouter();
  const [promoId, setPromoId] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

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
  }, [router.query]);

  const onSuccess = (data) => {
    // Simpan token sementara untuk verifikasi OTP
    Cookies.set(
      'temp_user_token',
      Encrypt(data.temp_token || data.user_token),
      { expires: 1 }, // 1 hari
      { secure: true }
    );

    // Redirect ke halaman verifikasi OTP dengan promoId
    const redirectUrl = promoId 
      ? `/promo-entry/verify-otp?promoId=${promoId}` 
      : '/promo-entry/verify-otp';
    
    window.location.href = redirectUrl;
  };

  const [{ formControl, submit, loading }] = useForm(
    {
      path: 'auth/promo-register', // Endpoint khusus untuk registrasi promo
    },
    false,
    onSuccess
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    
    try {
      // Tambahkan promoId ke form data jika ada
      const formData = new FormData(e.target);
      if (promoId) {
        formData.append('promo_id', promoId);
      }
      
      await submit(e);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setBtnLoading(false);
    }
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
              Ambil Promo Sekarang!
            </h1>
          </div>

          {promoId && (
            <div className="px-8 py-4 mx-8 mt-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-semibold text-center">
                Promo ID: {promoId}
              </p>
            </div>
          )}

          <p className="text-sm text-slate-500 mt-4 px-8 text-center font-medium">
            Daftar dulu yuk biar bisa ambil promo menarik! Cuma butuh nama dan nomor WA aja kok 😊
          </p>

          <form
            className="px-8 pt-8 pb-6 flex flex-col gap-6"
            onSubmit={handleSubmit}
          >
            <InputComponent
              name="name"
              label="Nama Lengkap"
              size="lg"
              placeholder="Contoh: Joko Gunawan"
              {...formControl('name')}
              validations={{
                required: true,
              }}
            />
            
            <InputComponent
              name="phone"
              label="Nomor WhatsApp"
              size="lg"
              placeholder="Contoh: 08123456789"
              {...formControl('phone')}
              validations={{
                required: true,
                pattern: /^08[0-9]{8,11}$/,
              }}
              tip="Pastikan nomor WA aktif untuk menerima kode OTP"
            />

            <div className="px-6 mt-4">
              <ButtonComponent
                type="submit"
                label="Daftar & Ambil Promo"
                block
                size="xl"
                loading={loading || btnLoading}
              />
            </div>
            
            <div className="text-center mt-2 text-xs text-slate-400">
              Dengan mendaftar, kamu akan menerima kode OTP via WhatsApp untuk verifikasi akun
            </div>
          </form>

          <div className="mt-6 px-8">
            <div className="text-center text-sm text-slate-500">
              Sudah punya akun?{' '}
              <Link href={promoId ? `/app/scanner/scan-qr?promoId=${promoId}` : '/app'}>
                <span className="text-primary font-semibold underline">
                  Login di sini
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-8 px-4 py-4">
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
