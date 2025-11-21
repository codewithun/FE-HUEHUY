import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import {
  ButtonComponent,
  InputComponent,
} from '../../components/base.components';
import { Encrypt } from '../../helpers/encryption.helpers';
import { get, token_cookie_name, useForm } from '../../helpers';
import { corporate_token_cookie_name } from '../../helpers/api.helpers';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [loadingScreen, setLoadingScreen] = useState(true);

  const onSuccess = async (data) => {
    // GUNAKAN COOKIE KHUSUS CORPORATE
    Cookies.set(
      corporate_token_cookie_name,
      Encrypt(data.data?.token),
      { expires: 365, secure: process.env.NODE_ENV === 'production' }
    );
    // Safari fallback: simpan juga ke localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(corporate_token_cookie_name, Encrypt(data.data?.token));
      }
    } catch { }
    // Prefer scope-based redirect from login response
    if (data?.data?.scope === 'corporate') {
      router.push('/corporate/dashboard');
      return;
    }
    // Fallback: verify account and check corporate membership
    try {
      const res = await get({ path: 'auth/account' });
      const acct = res?.data?.data;
      const isCorporateMember = !!acct?.corporate_user;
      const corporateRoleId =
        acct?.corporate_user?.role_id ?? acct?.corporate_user?.role?.id;
      const allow =
        (isCorporateMember && [3, 4, 5].includes(Number(corporateRoleId))) ||
        acct?.corporate_user?.role?.is_corporate === 1;
      if (allow) {
        router.push('/corporate/dashboard');
      }
    } catch (e) {
      // ignore and stay on page
    }
  };

  const [{ formControl, submit, loading, values, setValues, errors }] = useForm(
    {
      path: 'auth/login',
    },
    false,
    onSuccess
  );

  useEffect(() => {
    // Ensure scope is always set for this form
    setValues((vs) => [
      ...vs.filter((i) => i.name !== 'scope'),
      { name: 'scope', value: 'corporate' },
    ]);

    // Avoid blind redirect; verify corporate membership first
    const token = Cookies.get(token_cookie_name);
    if (!token) {
      setLoadingScreen(false);
      return;
    }
    (async () => {
      try {
        const res = await get({ path: 'auth/account' });
        const acct = res?.data?.data;
        const isCorporateMember = !!acct?.corporate_user;
        const corporateRoleId =
          acct?.corporate_user?.role_id ?? acct?.corporate_user?.role?.id;
        const allow =
          (isCorporateMember && [3, 4, 5].includes(Number(corporateRoleId))) ||
          acct?.corporate_user?.role?.is_corporate === 1;
        if (allow) {
          router.replace('/corporate/dashboard');
        } else {
          setLoadingScreen(false);
        }
      } catch (err) {
        setLoadingScreen(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loadingScreen) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md pt-12">
        {/* <div className="absolute top-[325px] w-[86%] left-[7%] min-h-[300px] bg-primary z-10 rounded-t-[30px]"></div> */}
        <div className="w-full bg-white z-10 rounded-[30px] border-t-8 border-primary">
          <div className="flex flex-col items-center relative z-10 mt-10">
            <div className="w-32 aspect-square">
              <Image src={'/logo.png'} width={500} height={500} alt="" />
            </div>

            <h1 className="text-3xl font-bold text-primary mt-6">
              Masuk Sebagai Mitra
            </h1>
            <p>Panel khusus hanya untuk mitra huehuy</p>
          </div>
          <form
            className="px-6 pt-10 pb-12 flex flex-col gap-6"
            onSubmit={submit}
          >
            <div>
              <InputComponent
                name="email"
                label="Email"
                size="lg"
                placeholder="Example: jokogunawan@gmail.com..."
                validations={{ required: true, email: true }}
                onChange={(e) => {
                  setValues([
                    ...values.filter(
                      (i) => i.name != 'email' && i.name != 'scope'
                    ),
                    { name: 'email', value: e },
                    { name: 'scope', value: 'corporate' },
                  ]);
                }}
                value={
                  values.find((i) => i.name == 'email')?.value
                    ? values.find((i) => i.name == 'email')?.value
                    : ''
                }
                errors={errors.filter((i) => i.name == 'email')?.error}
              />
              {errors && (
                <span className="text-sm text-danger">
                  {errors?.find((i) => i.name == 'email')?.error}
                </span>
              )}
            </div>
            <InputComponent
              type="password"
              name="password"
              label="Kata Sandi"
              size="lg"
              placeholder="Masukkan kata sandi kamu..."
              {...formControl('password')}
            />

            {/* <div className="flex justify-end">
            <Link href="/auth/lupa-password">
              <span className="text-primary font-medium">Lupa password?</span>
            </Link>
          </div> */}

            <div className="px-10 mt-4">
              <ButtonComponent
                type="submit"
                label="Login"
                block
                size="xl"
                loading={loading}
                icon={faDoorOpen}
              />
            </div>
            {/* <div className="text-center mt-2">
            Belum memiliki akun?{' '}
            <Link href="/auth/buat-akun">
              <span className="text-primary">Buat Akun</span>
            </Link>
          </div> */}
          </form>
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
