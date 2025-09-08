import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ButtonComponent, InputComponent } from '../components/base.components';
import { token_cookie_name, useForm } from '../helpers';
import { Encrypt } from '../helpers/encryption.helpers';

// tambahan import
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import axios from 'axios';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function BuatAkun() {
  const router = useRouter();
  const [btnGoogleLoading, setBtnGoogleLoading] = useState(false);

  // buat provider firebase (jika pakai firebase)
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    // Cek status user, misal dari localStorage atau cookie
    const sudahRegister = localStorage.getItem('sudahRegister');
    if (sudahRegister) {
      router.replace('/dashboard'); // redirect jika sudah pernah scan/register
    }
    // else tampilkan form register
  }, [router]);

  const onSuccess = (data) => {
    // PERBAIKAN: Pastikan token disimpan dengan benar dari response registrasi
    const token = data?.data?.token || data?.token || data?.user_token;
    if (token) {
      Cookies.set(
        token_cookie_name,
        Encrypt(token),
        { expires: 365, secure: true }
      );
    }

    // Get user info dari response
    const user = data?.data?.user || data?.user || data?.data?.data?.user;
    const userEmail = user?.email || '';

    // preserve next param so after verification user returns to original target
    const rawNext = router?.query?.next;
    const next = rawNext ? String(rawNext) : null;
    
    // SELALU ke verifikasi dulu dengan email parameter, baru setelah verifikasi redirect ke target
    if (next) {
      // Pass next parameter DAN email ke halaman verifikasi
      const target = `/verifikasi?email=${encodeURIComponent(userEmail)}&next=${encodeURIComponent(next)}`;
      window.location.href = target;
    } else {
      // Default flow ke verifikasi dengan email
      const target = `/verifikasi?email=${encodeURIComponent(userEmail)}`;
      window.location.href = target;
    }
  };
  
  const [{ formControl, submit, loading }] = useForm(
    {
      path: 'auth/register',
    },
    false,
    onSuccess
  );

  const loginFirebase = async (
    idToken,
    remember,
    url_path = '/auth/login-firebase'
  ) => {
    try {
      const formData = new FormData();
      formData.append('idToken', idToken);

      // confirm backend
      return axios
        .post(`${process.env.NEXT_PUBLIC_API_URL + url_path}`, formData)
        .then((res) => {
          Cookies.set(token_cookie_name, Encrypt(res.data.token), {
            secure: true,
          });

          return res;
        });
    } catch (error) {
      return error;
    }
  };

  const submitLoginFirebase = async (provider) => {
    setBtnGoogleLoading(true);
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then((result) => {
        loginFirebase(result.user.accessToken, true).then((response) => {
          if (response.status == 200) {
            const rawNext = router?.query?.next;
            const next = rawNext ? decodeURIComponent(String(rawNext)) : null;
            
            // Untuk Google login, cek apakah user sudah terverifikasi
            // Jika sudah terverifikasi, langsung ke target
            // Jika belum, ke verifikasi dulu
            if (next) {
              // Asumsikan Google login sudah terverifikasi, langsung ke target
              window.location.href = next;
            } else {
              window.location.href = '/app';
            }
          } else if (response.status == 202) {
            // Status 202 biasanya berarti butuh verifikasi
            const rawNext = router?.query?.next;
            const next = rawNext ? String(rawNext) : null;
            
            if (next) {
              const target = `/verifikasi?next=${encodeURIComponent(next)}`;
              window.location.href = target;
            } else {
              window.location.href = '/verifikasi';
            }
            setBtnGoogleLoading(false);
          }
        });
      })
      .catch(() => {
        setBtnGoogleLoading(false);
      });
  };

  // setelah registrasi/login sukses: (REMOVED - tidak terpakai)

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
              Buat Akun
            </h1>
          </div>

          <p className="text-sm text-slate-500 font-medium text-center mb-4 mt-2">
            Daftar sekali klik dengan{' '}
          </p>

          <div className="px-12 pb-4">
            <ButtonComponent
              icon={faGoogle}
              label={'Akun Google'}
              paint="danger"
              block
              rounded
              size="lg"
              loading={btnGoogleLoading}
              onClick={() => submitLoginFirebase(googleProvider)}
            />
          </div>

          <div className="flex justify-center items-center gap-4 my-4">
            <div className="w-1/4 h-0.5 bg-gray-500"></div>
            <p className="font-medium">Atau</p>
            <div className="w-1/4 h-0.5 bg-gray-500"></div>
          </div>

          <p className="text-sm text-slate-500 mt-2 text-center font-medium">
            Buat akun dulu yuk biar bisa masuk huehuy...
          </p>

          <form
            className="px-8 pt-8 pb-6 flex flex-col gap-6"
            onSubmit={submit}
          >
            <InputComponent
              name="name"
              label="Nama Lengkap"
              size="lg"
              placeholder="Example: Joko Gunawan"
              {...formControl('name')}
              validations={{
                required: true,
              }}
            />
            <InputComponent
              name="email"
              label="Email"
              size="lg"
              placeholder="Example: jokogunawan@gmail.com..."
              {...formControl('email')}
              validations={{
                required: true,
                email: true,
              }}
            />
            <InputComponent
              name="phone"
              label="No HP/WA"
              size="lg"
              placeholder="Example: 08000000000..."
              {...formControl('phone')}
              validations={{
                required: true,
              }}
            />
            <InputComponent
              type="password"
              name="password"
              label="Kata Sandi"
              size="lg"
              placeholder="Masukkan kata sandi kamu..."
              {...formControl('password')}
              validations={{
                min: 8,
                max: 20,
              }}
            />
            <InputComponent
              type="password"
              name="confirm password"
              label="Konfirmasi Kata Sandi"
              size="lg"
              placeholder="Masukkan lagi kata sandi kamu..."
              {...formControl('password_confirmation')}
            />

            <div className="px-6 mt-4">
              <ButtonComponent
                type="submit"
                label="Buat Akun"
                block
                size="xl"
                loading={loading}
              />
            </div>
            <div className="text-center mt-2">
              Sudah memiliki akun?{' '}
              <Link href="/">
                <span href="" className="text-primary font-semibold underline">
                  Login Saja
                </span>
              </Link>
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
    </>
  );
}
