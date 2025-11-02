import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import Link from 'next/link';

import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { getAuth, signInWithPopup } from 'firebase/auth';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { ButtonComponent, InputComponent } from '../components/base.components';
import { get, post, token_cookie_name, useForm } from '../helpers';
import { Encrypt } from '../helpers/encryption.helpers';
import { googleProvider } from '../helpers/firebase';

const isSafeInternal = (url) => {
  if (typeof window === 'undefined') return false;
  try { return new URL(url, window.location.origin).origin === window.location.origin; }
  catch { return false; }
};
const takeNext = (router) => {
  const q = router?.query?.next ? String(router.query.next) : null;
  const s = typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null;
  return q || s || null;
};
const consumeNext = (router) => {
  const raw = takeNext(router);
  if (!raw) return null;
  if (typeof window !== 'undefined') localStorage.removeItem('postAuthRedirect');
  let url = String(raw);
  try { url = decodeURIComponent(url); } catch { }
  try { url = decodeURIComponent(url); } catch { }
  return isSafeInternal(url) ? url : null;
};

export default function Login() {
  const router = useRouter();
  const [btnGoogleLoading, setBtnGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Perbaiki onSuccess function
  const onSuccess = (res) => {
    // eslint-disable-next-line no-console
    console.log('=== LOGIN SUCCESS RESPONSE ===', res);

    // bedakan http code vs business status
    const httpCode = res?.status ?? res?.code ?? 200;
    const bizStatus = typeof res?.data?.status === 'string'
      ? res.data.status
      : (typeof res?.status === 'string' ? res.status : undefined);

    const reason = typeof res?.data?.reason === 'string'
      ? res.data.reason
      : (typeof res?.reason === 'string' ? res.reason : undefined);

    // ambil redirect_url & email dari body lebih dulu
    const rurl = res?.data?.redirect_url || res?.redirect_url || null;
    const email = res?.data?.email || res?.email || '';

    // anggap unverified jika: http 202 ATAU business status/reason 'unverified' ATAU ada redirect_url
    const needVerify =
      httpCode === 202 ||
      bizStatus === 'unverified' ||
      reason === 'unverified' ||
      !!rurl ||
      res?.data?.need_verification === true ||
      res?.need_verification === true;

    if (needVerify) {
      // Prioritaskan ?redirect jika ada (diset saat scan QR komunitas)
      const redirectParam = router?.query?.redirect
        ? String(router.query.redirect)
        : null;
      const safeRedirect = redirectParam && isSafeInternal(redirectParam)
        ? redirectParam
        : null;

      const next = safeRedirect || consumeNext(router); // ambil dari ?redirect -> ?next -> localStorage
      const base = rurl || `/verifikasi?email=${encodeURIComponent(email)}`;
      const target = next ? `${base}&next=${encodeURIComponent(next)}` : base;
      window.location.href = target;
      return;
    }

    // sudah verified → simpan token
    const token = res?.data?.token || res?.token;
    if (token) {
      // Gunakan secure cookie hanya di production agar tersimpan saat dev (http)
      const cookieOpts = { expires: 365, secure: process.env.NODE_ENV === 'production' };
      Cookies.set(token_cookie_name, Encrypt(token), cookieOpts);
      // Ambil URL redirect dari query, fallback ke helper consumeNext
      const redirectParam = router?.query?.redirect ? String(router.query.redirect) : null;
      const safeRedirect = redirectParam && isSafeInternal(redirectParam) ? redirectParam : null;
      const redirect = safeRedirect || consumeNext(router);
      setTimeout(() => {
        if (redirect) {
          window.location.href = decodeURIComponent(redirect);
        } else {
          window.location.href = '/app';
        }
      }, 100);
      return;
    }

    // eslint-disable-next-line no-console
    console.error('No token and no unverified signal in response:', res);
  };

  const [{ formControl, submit, submitLoading, setDefaultValues }] = useForm(
    {
      path: 'auth/login',
    },
    false,
    onSuccess
  );

  useEffect(() => {
    // REKOMENDASI: Untuk user biasa, JANGAN kirim scope atau kirim scope "user"
    // Kita coba tanpa scope dulu sesuai saran
    setDefaultValues({
      // scope: 'user', // COMMENT OUT: test tanpa scope dulu
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan redirect ke localStorage agar tetap terbawa saat user pindah ke Buat Akun tanpa query
  useEffect(() => {
    if (!router?.isReady) return;
    const redirectParam = router?.query?.redirect ? String(router.query.redirect) : null;
    if (redirectParam && isSafeInternal(redirectParam)) {
      try { localStorage.setItem('postAuthRedirect', redirectParam); } catch { }
    }
  }, [router?.isReady, router?.query?.redirect]);

  // Perbaiki loginFirebase function juga
  const loginFirebase = async (
    idToken,
    remember,
    url_path = 'auth/login-firebase'
  ) => {
    try {
      // Send JSON body with correct header; helpers.post sets Content-Type automatically
      const response = await post({
        path: url_path,
        body: { idToken },
      });

      if (response?.status === 200) {
        const token = response?.data?.token || response?.token;
        if (token) {
          const cookieOpts = { expires: 365, secure: process.env.NODE_ENV === 'production' };
          Cookies.set(token_cookie_name, Encrypt(token), cookieOpts);
        }
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('login-firebase failed:', error);
      return null;
    }
  };

  const submitLoginFirebase = async (provider) => {
    setBtnGoogleLoading(true);
    const auth = getAuth();

    try {
      const result = await signInWithPopup(auth, provider);
      // Use Firebase ID token, not OAuth accessToken
      const idToken = await result.user.getIdToken();
      const response = await loginFirebase(idToken, true);

      if (response?.status === 200) {
        // Utamakan ?redirect (kasus scan QR komunitas), lalu ?next/localStorage
        const redirectParam = router?.query?.redirect ? String(router.query.redirect) : null;
        const safeRedirect = redirectParam && isSafeInternal(redirectParam) ? redirectParam : null;
        const nextUrl = safeRedirect || consumeNext(router);
        setTimeout(() => {
          window.location.href = nextUrl || '/app';
        }, 100);
      } else if (response?.status === 202) {
        const user = response?.data?.user || response?.user;
        const redirectParam = router?.query?.redirect ? String(router.query.redirect) : null;
        const safeRedirect = redirectParam && isSafeInternal(redirectParam) ? redirectParam : null;
        const next = safeRedirect || consumeNext(router);
        const base = `/verifikasi?email=${encodeURIComponent(user?.email || '')}`;
        setTimeout(() => {
          window.location.href = next ? `${base}&next=${encodeURIComponent(next)}` : base;
        }, 100);
        setBtnGoogleLoading(false);
      } else {
        // Handle other error cases
        setBtnGoogleLoading(false);
      }
    } catch (error) {
      setBtnGoogleLoading(false);
      // Firebase authentication failed
    }
  };

  useEffect(() => {
    const existingToken = Cookies.get(token_cookie_name);

    if (existingToken) {
      router.push('/app');
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading) {
    return (
      <div className="lg:mx-auto relative lg:max-w-md">
        {/* <div className="absolute top-[325px] w-[86%] left-[7%] min-h-[300px] bg-primary z-10 rounded-t-[30px]"></div> */}
        <div className="absolute top-0 left-0 w-full opacity-20">
          <Image src="/bg-cubes.png" height={1000} width={700} alt="" />
        </div>
        <div className="w-full min-h-screen bg-white z-10 flex flex-col justify-center">
          <div className="flex flex-col items-center relative z-10">
            <div className="w-32 aspect-square">
              <Image src={'/logo.png'} width={500} height={500} alt="" />
            </div>

            <h1 className="text-3xl font-bold text-primary mt-6">
              Selamat Datang
            </h1>
            <p className="mt-1 text-slate-500">
              Silahkan masuk dengan akun kamu
            </p>
          </div>

          <div className="px-12 my-8 relative z-40">
            <ButtonComponent
              icon={faGoogle}
              label={'Masuk Dengan Google'}
              paint="danger"
              block
              rounded
              size="lg"
              loading={btnGoogleLoading}
              onClick={() => submitLoginFirebase(googleProvider)}
            />
          </div>

          <div className=" flex justify-center items-center gap-4 my-4 relative z-40">
            <div className="w-1/4 h-0.5 bg-gray-400"></div>
            <p className="text-gray-400 font-medium">Atau</p>
            <div className="w-1/4 h-0.5 bg-gray-400"></div>
          </div>

          <form className="px-8 pt-4 flex flex-col gap-6" onSubmit={submit}>
            <InputComponent
              name="email"
              label="Email"
              type="email"
              size="lg"
              placeholder="Example: jokogunawan@gmail.com..."
              autoComplete="email"
              {...formControl('email')}
            />
            <InputComponent
              type="password"
              name="password"
              label="Kata Sandi"
              size="lg"
              placeholder="Masukkan kata sandi kamu..."
              autoComplete="current-password"
              {...formControl('password')}
            />

            <div className="flex justify-end z-40">
              <Link href="auth/lupa-password">
                <span className="text-primary font-medium underline">
                  Lupa Kata Sandi?
                </span>
              </Link>
            </div>

            <div className="px-6 mt-4">
              <ButtonComponent
                type="submit"
                label="Masuk Sekarang"
                block
                size="lg"
                loading={submitLoading}
                icon={faArrowRightLong}
              />
            </div>
            <div className="text-center mt-2 relative z-40">
              Belum memiliki akun?{' '}
              <Link
                href={{
                  pathname: '/buat-akun',
                  query: router?.query?.redirect
                    ? { redirect: String(router.query.redirect) }
                    : (router?.query?.next ? { next: String(router.query.next) } : {})
                }}
              >
                <span className="text-primary font-semibold underline">
                  Buat Akun
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
    );
  } else {
    return '';
  }
}

export async function getStaticProps() {
  const response = await get({ path: 'theme' });

  return {
    props: {
      data: response?.data?.data || null,
    },
    revalidate: 30,
  };
}
