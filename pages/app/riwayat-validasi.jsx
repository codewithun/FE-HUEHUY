/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import React from 'react';
import {
  DateFormatComponent,
  IconButtonComponent,
} from '../../components/base.components';
import { useGet } from '../../helpers';

export default function RiwayatValidasi() {
  const router = useRouter();
  const { id } = router.query;
  const ready = router.isReady;

  // API URL untuk base URL gambar
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const baseUrl = apiUrl.replace(/\/api$/, ''); // remove trailing /api for images

  // Fungsi untuk normalisasi URL gambar promo
  const normalizePromoImage = (imagePath) => {
    if (!imagePath) return '/placeholder.png';
    
    // Jika sudah absolute URL, return as is
    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }
    
    // Jika path dimulai dengan 'promos/', tambahkan baseUrl dan storage
    if (imagePath.startsWith('promos/')) {
      return `${baseUrl}/storage/${imagePath}`;
    }
    
    // Jika path dimulai dengan 'storage/', tambahkan baseUrl
    if (imagePath.startsWith('storage/')) {
      return `${baseUrl}/${imagePath}`;
    }
    
    // Jika path lain, tambahkan baseUrl dan storage
    return `${baseUrl}/storage/${imagePath}`;
  };

  // Jika ada ID, ambil history promo tertentu
  // Jika tidak ada ID, ambil history user yang login
  const [loading, status, res] = useGet({
    path: id ? `promos/${id}/history` : 'user/promo-validations',
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

          {/* tunggu router ready dulu */}
          {!ready ? (
            <div className="p-4 text-center">Memuat...</div>
          ) : loading ? (
            <div className="p-4 text-center">Memuat...</div>
          ) : items.length ? (
            items.map((v) => (
              <div
                key={v.id}
                className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative cursor-pointer m-3"
              >
                <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                  <img
                    src={normalizePromoImage(v.promo?.image ?? v.promo?.picture_source)}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      // Fallback ke placeholder jika gambar gagal dimuat
                      e.target.src = '/placeholder.png';
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

                {/* Hapus bagian cube yang tidak diperlukan */}
                {/* 
                {v.promo?.cube && (
                  <div className="absolute top-5 left-0 bg-slate-300 bg-opacity-60 py-1 pl-2 pr-3 rounded-r-full flex gap-2 items-center">
                    <CubeComponent
                      size={8}
                      color={v.promo.cube.cube_type?.color}
                    />
                    <p className="text-xs">{v.promo.cube.cube_type?.code}</p>
                  </div>
                )}
                */}
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
