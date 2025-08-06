import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { post, useForm, useGet } from '../helpers';
import InputOtpComponent from '../components/base.components/input/InputOtpComponent';
import {
  ButtonComponent,
  ModalConfirmComponent,
} from '../components/base.components';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function Verification() {
  const [sendMailLoading, setSendMailLoading] = useState(false);
  const [waitingMail, setWaitingMail] = useState(60);
  const [modalSendMailSuccess, setModalSendMailSuccess] = useState(false);

  const onSuccess = () => {
    window.location.href = '/app';
  };

  const [{ submit, loading, values, setValues, errors }] = useForm(
    {
      path: 'auth/verify-mail',
    },
    false,
    onSuccess
  );

  const resendMail = async (e) => {
    e.preventDefault();
    setSendMailLoading(true);

    const formData = new FormData();

    const response = await post({ path: 'auth/resend-mail' }, formData);

    if (response?.status == 200) {
      setWaitingMail(60);
      setModalSendMailSuccess(true);
      setSendMailLoading(false);
    } else {
      setFormToken('');
      setSendMailLoading(false);
    }
  };

  useEffect(() => {
    let myInterval = setInterval(() => {
      if (waitingMail > 0) {
        setWaitingMail(waitingMail - 1);
      }
    }, 1000);
    return () => {
      clearInterval(myInterval);
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingAccount, codeDataAccount, dataAccount] = useGet({
    path: `account-unverified`,
  });

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
              Verifikasi Email
            </h1>
            <p className="mt-1 text-slate-500 text-center w-[90%]">
              Silahkan masukkan kode verifikasi yang dikirim ke email{' '}
              {dataAccount?.data?.profile?.email}
            </p>
            <p className="mt-1 text-slate-500 text-center w-[90%] font-semibold">
              Jika pesaan verifikasi tidak masuk, silahkan cek folder spam!
            </p>
          </div>

          <form onSubmit={submit}>
            <div className="flex justify-center pt-8 pb-6">
              <InputOtpComponent
                value={values?.find(({ name }) => name == 'token')?.value}
                onChange={(e) => {
                  setValues([
                    ...values.filter(({ name }) => name != 'token'),
                    { name: 'token', value: e },
                  ]);
                }}
                error={errors?.find(({ name }) => name == 'token')?.error}
                max={5}
              />
            </div>
            <div className="px-20 mt-4">
              <ButtonComponent
                type="submit"
                label="Verifikasi"
                block
                size="xl"
                loading={loading}
              />
            </div>
            <div className="text-center text-gray-500 mt-6 flex items-center gap-2 justify-center">
              Belum mendapat pesan verifikasi?
              <ButtonComponent
                label={
                  waitingMail ? `Kirim Ulang (${waitingMail})` : 'Kirim Ulang'
                }
                variant="light"
                size={'sm'}
                disabled={waitingMail}
                loading={sendMailLoading}
                onClick={(e) => resendMail(e)}
              />
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

      <ModalConfirmComponent
        icon={faCheck}
        paint="primary"
        title="Email Verifikasi telah dikirim!"
        show={modalSendMailSuccess}
        onClose={() => setModalSendMailSuccess(false)}
        onSubmit={() => setModalSendMailSuccess(false)}
      />
    </>
  );
}
