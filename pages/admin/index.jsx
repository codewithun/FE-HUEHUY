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
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [loadingScreen, setLoadingScreen] = useState(true);

  const onSuccess = (data) => {
    Cookies.set(
      token_cookie_name,
      Encrypt(data.data?.token),
      { expires: 365 },
      { secure: true }
    );

    if (data?.data?.role?.id == 1) {
      window.location.href = 'admin/dashboard/';
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
    if (Cookies.get(token_cookie_name)) {
      router.push('/corporate/dashboard');
    } else {
      setLoadingScreen(false);
    }
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
              Masuk Panel Admin
            </h1>
            <p>Panel khusus hanya untuk admin huehuy</p>
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
                    { name: 'scope', value: 'admin' },
                  ]);
                }}
                value={
                  values.find((i) => i.name == 'email')?.value
                    ? values.find((i) => i.name == 'email')?.value
                    : ''
                }
                error={errors.filter((i) => i.name == 'email')?.error}
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
