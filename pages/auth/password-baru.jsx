import Image from 'next/image';
import {
  ButtonComponent,
  InputComponent,
} from '../../components/base.components';
import { useRouter } from 'next/router';
import { useForm } from '../../helpers';
import { useEffect } from 'react';

export default function PasswordBaru() {
  const router = useRouter();

  const { e, t } = router.query;

  const [{ formControl, submit, loading, setDefaultValues }] = useForm(
    {
      path: 'account/forgot-password/new-password',
    },
    false,
    () => router.push('/')
  );

  useEffect(() => {
    setDefaultValues({
      email: e,
      token: t,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e, t]);

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
              Buat Kata Sandi
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Buat kata sandi baru untuk akunmu...
            </p>
          </div>
          <div className="px-6 py-8 flex flex-col gap-6">
            <form className="pt-10 pb-6 flex flex-col gap-6" onSubmit={submit}>
              <InputComponent
                name="email"
                label="Email"
                size="lg"
                placeholder="Example: jokogunawan@gmail.com..."
                {...formControl('email')}
                disabled
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
                name="password_confirmation"
                label="Konfirmasi Kata Sandi"
                size="lg"
                placeholder="Masukkan lagi kata sandi kamu..."
                {...formControl('password_confirmation')}
              />

              <div className="px-10 mt-4">
                <ButtonComponent
                  type="submit"
                  label="Simpan"
                  block
                  size="xl"
                  loading={loading}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
