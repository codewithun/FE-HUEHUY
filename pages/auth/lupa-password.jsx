import Image from 'next/image';
import React from 'react';
import {
  ButtonComponent,
  InputComponent,
} from '../../components/base.components';
import Link from 'next/link';
import { useForm } from '../../helpers';

export default function BuatAkun() {
  const onSuccess = () => {
    window.location.href =
      '/auth/verifikasi?e=' + values.find((val) => val.name == 'email')?.value;
  };

  const [{ formControl, submit, loading, values }] = useForm(
    {
      path: 'account/forgot-password/send-email',
    },
    false,
    onSuccess
  );

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

            <h1 className="text-3xl font-bold text-primary mt-6">
              Lupa Kata Sandi
            </h1>
            <p className="mt-1 text-slate-500">
              Masukkan email akun huehuy yang terdaftar!
            </p>
          </div>

          <form className="px-6 py-8 flex flex-col gap-6" onSubmit={submit}>
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

            <div className="px-10 mt-4">
              <ButtonComponent
                type="submit"
                label="Lanjutkan"
                block
                size="xl"
                loading={loading}
              />
            </div>
            <div className="text-center mt-2 z-30">
              Sudah memiliki akun?{' '}
              <Link href="/">
                <span href="" className="text-primary">
                  Login Saja
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
