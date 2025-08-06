import React, { useState } from 'react';
import {
  ButtonComponent,
  IconButtonComponent,
  InputComponent,
  ModalConfirmComponent,
} from '../../components/base.components';
import {
  faArrowLeftLong,
  faCheckCircle,
  faHistory,
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import QrScannerComponent from '../../components/construct.components/QrScannerComponent';
import { post } from '../../helpers';
import Link from 'next/link';

export default function Validasi() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [modalSuccess, setModalSuccess] = useState();
  const [modalFailed, setModalFailed] = useState();
  const [loading, setLoading] = useState(false);

  const submitValidate = async (parsingCode = null) => {
    setLoading(true);
    const execute = await post({
      path: 'grabs/validate',
      body: {
        code: parsingCode || code,
      },
    });

    if (execute.status == 200) {
      setModalSuccess(true);
      setLoading(false);
    } else {
      setModalFailed(true);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
          <div className="flex justify-between items-center gap-2 p-2 sticky top-0 z-30 bg-white bg-opacity-40 backdrop-blur-sm border-b ">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={() => router.back()}
              />
            </div>
            <div className="font-semibold w-full text-lg">Validasi</div>
            <Link href={'/app/riwayat-validasi'}>
              <ButtonComponent
                variant="simple"
                label="Riwayat"
                size="md"
                icon={faHistory}
              />
            </Link>
          </div>

          <QrScannerComponent
            onScan={(e) => {
              if (!modalSuccess && !modalFailed && !loading) {
                setLoading(true);
                submitValidate(e);
              }
            }}
          />

          <div className="bg-background bg-gradient-to-br -mt-4 rounded-t-[15px] pt-2 from-cyan-50 relative z-50 px-4">
            <div className="flex justify-center items-center gap-4 my-6">
              <div className="w-1/5 h-0.5 bg-gray-300"></div>
              <p className="text-slate-400 font-medium text-center">
                Atau Masukkan Kode
              </p>
              <div className="w-1/5 h-0.5 bg-gray-300"></div>
            </div>

            <div className="">
              <InputComponent
                placeholder="Masukkan kode promo disini..."
                value={code}
                onChange={(e) => setCode(e)}
                size="lg"
              />

              <div className="mt-6 px-8">
                <ButtonComponent
                  label="Validasi"
                  block
                  size="lg"
                  onClick={() => submitValidate()}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalConfirmComponent
        show={modalSuccess}
        onClose={() => setModalSuccess(false)}
        paint="primary"
        icon={faCheckCircle}
        title="Selamat, Berhasil di validasi"
        onSubmit={async () => {
          setModalSuccess(false);
          router.push('/app/riwayat-validasi');
        }}
      />

      <ModalConfirmComponent
        show={modalFailed}
        onClose={() => setModalFailed(false)}
        paint="danger"
        icon={faCheckCircle}
        title="Kode Tidak Valid / Sudah Digunakan"
        onSubmit={async () => {
          setModalFailed(false);
        }}
      />
    </>
  );
}
