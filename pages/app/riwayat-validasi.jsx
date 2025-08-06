/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {
  DateFormatComponent,
  IconButtonComponent,
} from '../../components/base.components';
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import { useGet } from '../../helpers';
import { useRouter } from 'next/router';
import Image from 'next/image';
import CubeComponent from '../../components/construct.components/CubeComponent';

export default function RiwayatValidasi() {
  const router = useRouter();

  const [loading, code, data] = useGet({
    path: `grabs/validated-history`,
  });

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
            <div className="font-semibold w-full text-lg">Riwayat Validasi</div>
          </div>

          {data?.data?.length ? (
            data?.data?.map((item, key) => {
              return (
                <div
                  className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative cursor-pointer"
                  key={key}
                >
                  <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                    <img
                      src={item?.ad?.picture_source}
                      height={700}
                      width={700}
                      alt=""
                    />
                  </div>
                  <div className="col-span-3">
                    <p className="font-semibold">{item?.ad?.title}</p>
                    <p className="text-slate-600 text-sm mb-1">
                      Direbut oleh: {item?.user?.name}
                    </p>
                    <p className="text-slate-600 text-xs mb-1">
                      Direbut pada:{' '}
                      <DateFormatComponent
                        date={item?.created_at}
                        format="YYYY MMM DD HH:mm:ss"
                      />
                    </p>
                    <p className="text-slate-600 text-xs mb-1">
                      Divalidasi pada:{' '}
                      <DateFormatComponent
                        date={item?.validation_at}
                        format="YYYY MMM DD HH:mm:ss"
                      />
                    </p>
                  </div>
                  <div className="absolute top-5 left-0 bg-slate-300 bg-opacity-60 backdrop:blur-md min-h-[20px] py-1 pl-2 pr-3 rounded-r-full flex gap-2 items-center">
                    <CubeComponent
                      size={8}
                      color={`${item?.ad?.cube?.cube_type?.color}`}
                    />
                    <p className="text-xs">{item?.ad?.cube?.cube_type?.code}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center mt-6 font-medium text-slate-500">
              Belum ada promo yang divalidasi...
            </div>
          )}
        </div>
      </div>
    </>
  );
}
