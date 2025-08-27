import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import Cookies from 'js-cookie';
import { ButtonComponent, InputComponent } from '../components/base.components';
import { get, post, token_cookie_name, useForm } from '../helpers';
import { Encrypt } from '../helpers/encryption.helpers';
import { getAuth, signInWithPopup } from 'firebase/auth';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { googleProvider } from '../helpers/firebase';
import { useRouter } from 'next/router';
import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
  const router = useRouter();
  const [btnGoogleLoading, setBtnGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Perbaiki onSuccess function
  const onSuccess = (data) => {
    // Laravel API biasanya mengembalikan { data: { token: "...", user: {...} } }
    // Coba berbagai kemungkinan path token
    const token = data?.data?.token || data?.token || data?.data?.data?.token;

    if (token) {
      Cookies.set(
        token_cookie_name,
        Encrypt(token),
        { expires: 365, secure: true }
      );
      window.location.href = '/app';
    } else {
      // No token found in response
    }
  };

  const [{ formControl, submit, submitLoading, setDefaultValues }] = useForm(
    {
      path: 'auth/login',
    },
    false,
    onSuccess
  );

  useEffect(() => {
    setDefaultValues({
      scope: 'user',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Perbaiki loginFirebase function juga
  const loginFirebase = async (
    idToken,
    remember,
    url_path = 'auth/login-firebase'
  ) => {
    try {
      const formData = new FormData();
      formData.append('idToken', idToken);

      const response = await post({
        path: url_path,
        body: formData,
        contentType: 'multipart/form-data'
      });

      // DEBUG: Log response structure

      if (response?.status === 200 || response?.status === 201) {
        // Sama seperti onSuccess, coba berbagai path token
        const token = response?.data?.token || response?.token || response?.data?.data?.token;

        if (token) {
          Cookies.set(
            token_cookie_name,
            Encrypt(token),
            { expires: 365, secure: true }
          );
        } else {
          // No token found in Firebase login response
        }
      }

      return response;
    } catch (error) {
      // Firebase login error
      return null;
    }
  };

  const submitLoginFirebase = async (provider) => {
    setBtnGoogleLoading(true);
    const auth = getAuth();

    try {
      const result = await signInWithPopup(auth, provider);

      const response = await loginFirebase(result.user.accessToken, true);

      if (response?.status === 200) {
        window.location.href = '/app';
      } else if (response?.status === 202) {
        // Handle specific case for status 202
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
              size="lg"
              placeholder="Example: jokogunawan@gmail.com..."
              {...formControl('email')}
            />
            <InputComponent
              type="password"
              name="password"
              label="Kata Sandi"
              size="lg"
              placeholder="Masukkan kata sandi kamu..."
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
              <Link href="/buat-akun">
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
