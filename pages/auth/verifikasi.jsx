import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useForm } from '../../helpers';
import InputOtpComponent from '../../components/base.components/input/InputOtpComponent';
import {
  ButtonComponent,
  ModalConfirmComponent,
} from '../../components/base.components';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';

export default function Verification() {
  const router = useRouter();
  // const [sendMailLoading, setSendMailLoading] = useState(false);
  const [waitingMail, setWaitingMail] = useState(60);
  const [modalSendMailSuccess, setModalSendMailSuccess] = useState(false);

  const onSuccess = () => {
    if (values?.find(({ name }) => name == 'token')?.value.length == 5) {
      router.push(
        `/auth/password-baru?t=${
          values?.find(({ name }) => name == 'token')?.value
        }&e=${router?.query?.e}`
      );
    }
  };

  const reSendSuccess = () => {
    setWaitingMail(60);
    setModalSendMailSuccess(true);
  };
  const [{ submit, loading, values, setValues, errors }] = useForm(
    {
      path: 'account/forgot-password/token-verify',
    },
    false,
    onSuccess
  );

  const [{ submit: reSendEmail, loading: resendLoading, setDefaultValues }] =
    useForm(
      {
        path: 'account/forgot-password/send-email',
      },
      false,
      reSendSuccess
    );

  useEffect(() => {
    let myInterval = setInterval(() => {
      if (waitingMail > 0) {
        setWaitingMail(waitingMail - 1);
      } else {
        setDefaultValues({ email: router?.query?.e });
      }
    }, 1000);
    return () => {
      clearInterval(myInterval);
    };
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
            <p className="mt-1 text-slate-500">
              Silahkan masukkan kode verifikasi email kamu...
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
              Belum mendapat email?
              <ButtonComponent
                label={
                  waitingMail ? `Kirim Ulang (${waitingMail})` : 'Kirim Ulang'
                }
                variant="light"
                size={'sm'}
                disabled={waitingMail}
                loading={resendLoading}
                onClick={() => reSendEmail()}
              />
            </div>
          </form>
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
