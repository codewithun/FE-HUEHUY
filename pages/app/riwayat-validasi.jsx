/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useRouter } from 'next/router';
import {
  DateFormatComponent,
  IconButtonComponent,
} from '../../components/base.components';
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import CubeComponent from '../../components/construct.components/CubeComponent';
import { useGet } from '../../helpers';

export default function RiwayatValidasi() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, status, res] = useGet({
    path: id ? `promos/${id}/history` : null,
  });

  const items = res?.data ?? [];

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20">
          <div className="flex items-center gap-2 p-2 sticky top-0 bg-white border-b">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={() => router.back()}
              />
            </div>
            <div className="font-semibold w-full text-lg">
              Riwayat Validasi Promo
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-center">Memuat...</div>
          ) : items.length ? (
            items.map((v) => (
              <div
                key={v.id}
                className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative cursor-pointer m-3"
              >
                <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                  <img
                    src={
                      v.promo?.image ??
                      v.promo?.picture_source ??
                      '/placeholder.png'
                    }
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                <div className="col-span-3">
                  <p className="font-semibold">{v.promo?.title ?? 'Promo'}</p>
                  <p className="text-slate-600 text-sm mb-1">
                    Divalidasi oleh: {v.user?.name ?? 'Guest'}
                  </p>
                  <p className="text-slate-600 text-xs mb-1">
                    Kode: <span className="font-medium">{v.code}</span>
                  </p>
                  <p className="text-slate-600 text-xs mb-1">
                    Divalidasi pada:{' '}
                    <DateFormatComponent
                      date={v.validated_at ?? v.created_at}
                      format="YYYY MMM DD HH:mm:ss"
                    />
                  </p>
                  {v.notes ? (
                    <p className="text-slate-600 text-xs">
                      Catatan: {v.notes}
                    </p>
                  ) : null}
                </div>

                {v.promo?.cube && (
                  <div className="absolute top-5 left-0 bg-slate-300 bg-opacity-60 py-1 pl-2 pr-3 rounded-r-full flex gap-2 items-center">
                    <CubeComponent
                      size={8}
                      color={v.promo.cube.cube_type?.color}
                    />
                    <p className="text-xs">{v.promo.cube.cube_type?.code}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center mt-6 font-medium text-slate-500">
              Belum ada riwayat validasi untuk promo ini.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
