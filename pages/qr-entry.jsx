import { useRouter } from 'next/router';
import { useState } from 'react';
import { ButtonComponent, InputComponent } from '../components/base.components';
import { useForm } from '../helpers';

export default function QrEntry() {
  const router = useRouter();
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [userEmail, setUserEmail] = useState('');

  const onRegisterSuccess = (data) => {
    if (data?.data?.user?.email) {
      setUserEmail(data.data.user.email);
      setStep('verify');
    }
  };

  const onVerifySuccess = (data) => {
    const redirectUrl = data?.data?.redirect_url;
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.href = '/app';
    }
  };

  const [{ formControl: registerFormControl, submit: registerSubmit, loading: registerLoading }] = useForm(
    {
      path: 'qr-entry/register',
      data: {
        qr_data: router.query.qr_data || null
      }
    },
    false,
    onRegisterSuccess
  );

  const [{ formControl: verifyFormControl, submit: verifySubmit, loading: verifyLoading }] = useForm(
    {
      path: 'qr-entry/verify',
      data: {
        email: userEmail,
        qr_data: router.query.qr_data || null
      }
    },
    false,
    onVerifySuccess
  );

  if (step === 'register') {
    return (
      <div className="container mx-auto max-w-md p-4">
        <h1 className="text-2xl font-bold mb-4">QR Entry Registration</h1>
        <form onSubmit={registerSubmit} className="space-y-4">
          <InputComponent
            name="name"
            label="Nama Lengkap"
            {...registerFormControl('name')}
            validations={{ required: true }}
          />
          <InputComponent
            name="email"
            label="Email"
            type="email"
            {...registerFormControl('email')}
            validations={{ required: true, email: true }}
          />
          <InputComponent
            name="phone"
            label="No HP/WA"
            {...registerFormControl('phone')}
            validations={{ required: true }}
          />
          <InputComponent
            name="password"
            label="Password"
            type="password"
            {...registerFormControl('password')}
            validations={{ required: true, min: 8 }}
          />
          <InputComponent
            name="password_confirmation"
            label="Konfirmasi Password"
            type="password"
            {...registerFormControl('password_confirmation')}
            validations={{ required: true }}
          />
          <ButtonComponent
            type="submit"
            label="Daftar"
            block
            loading={registerLoading}
          />
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold mb-4">Verifikasi Email</h1>
      <p className="mb-4">Kode verifikasi telah dikirim ke {userEmail}</p>
      <form onSubmit={verifySubmit} className="space-y-4">
        <InputComponent
          name="code"
          label="Kode Verifikasi"
          placeholder="Masukkan 6 digit kode"
          {...verifyFormControl('code')}
          validations={{ required: true, min: 6, max: 6 }}
        />
        <ButtonComponent
          type="submit"
          label="Verifikasi"
          block
          loading={verifyLoading}
        />
      </form>
    </div>
  );
}