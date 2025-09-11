import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ButtonComponent, InputComponent } from '../components/base.components';
import { token_cookie_name, useForm } from '../helpers';
import { Encrypt } from '../helpers/encryption.helpers';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import axios from 'axios';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function BuatAkun() {
  const router = useRouter();
  const [btnGoogleLoading, setBtnGoogleLoading] = useState(false);
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    const sudahRegister = localStorage.getItem('sudahRegister');
    if (sudahRegister) router.replace('/dashboard');
  }, [router]);

  const onSuccess = (data) => {
    try { Cookies.remove(token_cookie_name); } catch (e) { }

    const user = data?.data?.user;
    const userEmail = user?.email || '';
    const rawNext = router?.query?.next || (typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null);
    const target = rawNext
      ? `/verifikasi?email=${encodeURIComponent(userEmail)}&next=${encodeURIComponent(String(rawNext))}`
      : `/verifikasi?email=${encodeURIComponent(userEmail)}`;
    if (rawNext) localStorage.removeItem('postAuthRedirect');
    window.location.href = target;
  };

  const [{ formControl, submit, loading }] = useForm(
    { path: 'auth/register' },
    false,
    onSuccess
  );

  const loginFirebase = async (idToken, remember, url_path = '/auth/login-firebase') => {
    try {
      return axios.post(
        `${process.env.NEXT_PUBLIC_API_URL + url_path}`,
        { idToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return error;
    }
  };

  const submitLoginFirebase = async (provider) => {
    setBtnGoogleLoading(true);
    try {
      const auth = getAuth();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(/* forceRefresh */ true);
      const response = await loginFirebase(idToken, true);

      if (response.status === 200) {
        Cookies.set(token_cookie_name, Encrypt(response.data.token), { secure: true });
        const rawNext = router?.query?.next || (typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null);
        const next = rawNext ? decodeURIComponent(String(rawNext)) : null;
        if (rawNext) localStorage.removeItem('postAuthRedirect');
        window.location.href = next || '/app';
      } else if (response.status === 202) {
        const rawNext = router?.query?.next || (typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null);
        const next = rawNext ? String(rawNext) : null;
        if (rawNext) localStorage.removeItem('postAuthRedirect');
        window.location.href = next ? `/verifikasi?next=${encodeURIComponent(next)}` : '/verifikasi';
      }

    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setBtnGoogleLoading(false);
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
              type="text"
              size="lg"
              placeholder="Example: Joko Gunawan"
              autoComplete="name"
              {...formControl('name')}
              validations={{
                required: true,
              }}
            />
            <InputComponent
              name="email"
              label="Email"
              type="email"
              size="lg"
              placeholder="Example: jokogunawan@gmail.com..."
              autoComplete="email"
              {...formControl('email')}
              validations={{
                required: true,
                email: true,
              }}
            />
            <InputComponent
              name="phone"
              label="No HP/WA"
              type="tel"
              size="lg"
              placeholder="Example: 08000000000..."
              autoComplete="tel"
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
              autoComplete="new-password"
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
              autoComplete="new-password"
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
