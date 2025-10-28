/* eslint-disable no-console */
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import {
  ButtonComponent,
  InputComponent,
} from '../../components/base.components';
import { get, token_cookie_name, useForm } from '../../helpers';
import { Encrypt } from '../../helpers/encryption.helpers';

export default function Login() {
  const router = useRouter();
  const [loadingScreen, setLoadingScreen] = useState(true);

  const onSuccess = (data) => {
    console.log('=== ADMIN LOGIN SUCCESS RESPONSE ===');
    console.log('Full data:', data);
    console.log('Status Code:', data?.status);

    const token = data?.data?.token;

    if (token) {
      console.log('Admin token found, saving...');
      Cookies.set(token_cookie_name, Encrypt(token), {
        expires: 365,
        secure: process.env.NODE_ENV === 'production',
      });

      const role = data?.data?.role || data?.role;
      const user = data?.data?.user || data?.user;
      const isAdmin =
        role?.id === 1 ||
        role?.name === 'admin' ||
        role === 'admin' ||
        user?.role === 'admin' ||
        user?.role_id === 1;

      if (isAdmin) {
        console.log('Admin access confirmed, redirecting...');
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 200);
      } else {
        console.error('User bukan admin:', { role, user });
        alert('Anda tidak memiliki akses admin');
      }
    } else {
      console.error('No token found in admin login response:', data);
    }
  };

  // gunakan useForm seperti biasa
  const [{ formControl, submit, loading, values, setValues, errors }] = useForm(
    {
      path: 'auth/login',
    },
    false,
    onSuccess
  );

  // tambahkan handler baru untuk manggil csrf sebelum submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // WAJIB: ambil csrf-cookie dari Laravel
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
        withCredentials: true,
      });

      // lanjut submit form ke backend
      await submit(e);
    } catch (err) {
      console.error('Login error:', err);
      alert('Gagal login. Pastikan backend berjalan dan CORS diizinkan.');
    }
  };

  // set default scope untuk admin
  useEffect(() => {
    if (!values.find((v) => v.name === 'scope')) {
      setValues([
        ...values.filter((v) => v.name !== 'scope'),
        { name: 'scope', value: 'admin' },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Cookies.get(token_cookie_name)) {
      router.push('/corporate/dashboard');
    } else {
      setLoadingScreen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingScreen) return '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-10">
      <div className="w-full max-w-md bg-white z-10 rounded-3xl border-t-8 border-primary shadow-lg p-0 md:p-0">
        <div className="flex flex-col items-center relative z-10 mt-10">
          <div className="w-32 aspect-square">
            <Image src={'/logo.png'} width={500} height={500} alt="" />
          </div>

          <h1 className="text-3xl font-extrabold text-primary mt-6 tracking-wide mb-2">
            Masuk Panel Admin
          </h1>
          <p className="text-slate-500 text-base mb-2">
            Panel khusus hanya untuk admin huehuy
          </p>
        </div>

        <form
          className="px-8 pt-10 pb-12 flex flex-col gap-7"
          onSubmit={handleSubmit} // <== pakai handler baru ini
        >
          <div>
            <InputComponent
              name="email"
              label="Email"
              type="email"
              size="lg"
              placeholder="Example: jokogunawan@gmail.com..."
              autoComplete="email"
              validations={{ required: true, email: true }}
              onChange={(e) => {
                setValues([
                  ...values.filter((i) => i.name !== 'email' && i.name !== 'scope'),
                  { name: 'email', value: e },
                  { name: 'scope', value: 'admin' },
                ]);
              }}
              value={
                values.find((i) => i.name === 'email')?.value || ''
              }
              error={errors.find((i) => i.name === 'email')?.error}
            />
            {errors && (
              <span className="text-sm text-danger font-semibold mt-1 block">
                {errors.find((i) => i.name === 'email')?.error}
              </span>
            )}
          </div>

          <InputComponent
            type="password"
            name="password"
            label="Kata Sandi"
            size="lg"
            placeholder="Masukkan kata sandi kamu..."
            autoComplete="current-password"
            {...formControl('password')}
          />

          <div className="px-0 md:px-10 mt-4">
            <ButtonComponent
              type="submit"
              label="Login"
              block
              size="xl"
              loading={loading}
              icon={faDoorOpen}
            />
          </div>
        </form>
      </div>
    </div>
  );
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
