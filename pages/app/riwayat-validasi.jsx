/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import React from 'react';
import {
  DateFormatComponent,
  IconButtonComponent,
} from '../../components/base.components';
import { useUserContext } from '../../context/user.context';
import { useGet } from '../../helpers';

export default function RiwayatValidasi() {
  const router = useRouter();
  const { id, type } = router.query;
  const ready = router.isReady;
  const { profile } = useUserContext?.() || {};
  const isTenant = profile?.role_id === 6; // 6 = Manager Tenant

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

  // Fungsi untuk normalisasi URL gambar voucher
  const normalizeVoucherImage = (imagePath) => {
    if (!imagePath) return '/placeholder.png';

    // Jika sudah absolute URL, return as is
    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    // Jika path dimulai dengan 'vouchers/', tambahkan baseUrl dan storage
    if (imagePath.startsWith('vouchers/')) {
      return `${baseUrl}/storage/${imagePath}`;
    }

    // Jika path dimulai dengan 'storage/', tambahkan baseUrl
    if (imagePath.startsWith('storage/')) {
      return `${baseUrl}/${imagePath}`;
    }

    // Jika path lain, tambahkan baseUrl dan storage
    return `${baseUrl}/storage/${imagePath}`;
  };

  // Jika ada ID dan type, ambil history item tertentu
  // Jika tidak ada ID, ambil semua history user yang login (promo dan voucher)
  const [promoLoading, promoStatus, promoRes] = useGet({
    path: (ready && id && type === 'promo') ? `promos/${id}/history` : (ready ? 'user/promo-validations' : null), params: undefined,
  });

  const [voucherLoading, voucherStatus, voucherRes] = useGet({
    path: (ready && id && type === 'voucher')
      ? `vouchers/${id}/history`
      : (ready ? 'user/voucher-validations' : null),
    params: undefined,
  });

  const extractList = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;                // array langsung
    if (Array.isArray(res?.data)) return res.data;     // { data: [...] }
    if (Array.isArray(res?.data?.data)) return res.data.data; // { data: { data: [...] } }
    return [];
  };

  // Combine and sort items by date
  const promoItems = extractList(promoRes).map(item => ({ ...item, itemType: 'promo' }));
  const voucherItems = extractList(voucherRes).map(item => ({ ...item, itemType: 'voucher' }));

  // If viewing specific item, show only that type
  const allItems = id && type
    ? (type === 'promo' ? promoItems : voucherItems)
    : [...promoItems, ...voucherItems].sort((a, b) =>
      new Date(b.validated_at || b.created_at) - new Date(a.validated_at || a.created_at)
    );

  const loading = promoLoading || voucherLoading;

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20">
          <div className="flex items-center gap-2 p-2 sticky top-0 bg-white border-b z-50">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={() => router.back()}
              />
            </div>
            <div className="font-semibold w-full text-lg">
              Riwayat Validasi
            </div>
          </div>

          {/* tunggu router ready dulu */}
          {!ready ? (
            <div className="p-4 text-center">Memuat...</div>
          ) : loading ? (
            <div className="p-4 text-center">Memuat...</div>
          ) : allItems.length ? (
            allItems.map((v) => (
              <div
                key={`${v.itemType}-${v.id}`}
                className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] relative cursor-pointer m-3"
              >
                <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-400 flex justify-center items-center">
                  <img
                    src={v.itemType === 'voucher' ? normalizeVoucherImage(v.voucher?.image ?? v.voucher?.picture_source) : normalizePromoImage(v.promo?.image ?? v.promo?.picture_source)}
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
                  {(() => {
                    const isSameValidator = String(v?.user?.id ?? '') === String(profile?.id ?? '');
                    return (
                      <>
                        <p className="font-semibold">
                          {v.itemType === 'voucher'
                            ? (v.voucher?.title ?? v.voucher?.name ?? 'Voucher')
                            : (v.promo?.title ?? 'Promo')}
                        </p>
                        <p className="text-slate-600 text-sm mb-1">
                          {isTenant
                            ? <>Promo milik: {v.owner?.name ?? v.owner_name ?? '-'}</>
                            : <>Divalidasi oleh: {v.user?.name ?? 'Guest'}</>}
                        </p>
                      </>
                    );
                  })()}
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
                  <div className={`badge ${v.itemType === 'voucher' ? 'badge-voucher' : 'badge-promo'}`}>
                    {v.itemType === 'voucher' ? 'Voucher' : 'Promo'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center mt-6 font-medium text-slate-500">
              Belum ada riwayat validasi.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
