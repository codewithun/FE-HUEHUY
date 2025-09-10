/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState, useEffect } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { useGet } from '../../helpers';
import { DateFormatComponent } from '../../components/base.components';

export default function NotificationPage() {
  // GANTI DEFAULT KE MERCHANT untuk test voucher yang sudah ada
  const [type, setType] = useState('merchant'); // <- ubah dari 'hunter' ke 'merchant'

  const path = useMemo(
    () => `notification${type ? `?type=${encodeURIComponent(type)}` : ''}`,
    [type]
  );

  const _res = useGet({ path });
  const loading = Array.isArray(_res) ? _res[0] : false;
  const code = Array.isArray(_res) ? _res[1] : null;
  const data = Array.isArray(_res) ? _res[2] : null;

  // TAMBAHKAN DEBUG LOGGING
  useEffect(() => {
    console.log('=== NOTIFICATION DEBUG ===');
    console.log('Type selected:', type);
    console.log('API Path:', path);
    console.log('Raw useGet response:', _res);
    console.log('Loading:', loading);
    console.log('HTTP Code:', code);
    console.log('Response Data:', data);
    console.log('Items from data.data:', data?.data);
    console.log('Is items array?', Array.isArray(data?.data));
    console.log('Items length:', data?.data?.length);
    console.log('========================');
  }, [type, path, _res, loading, code, data]);

  const items = Array.isArray(data?.data) ? data.data : [];

  const cardMeta = (n) => {
    if (!n || typeof n !== 'object') {
      return { img: null, title: 'Notifikasi', isVoucher: false, actionUrl: null };
    }

    // Ambil image yang paling relevan terlebih dahulu dari schema notifikasi voucher/promo
    const img =
      n.image_url ||
      n?.grab?.ad?.picture_source ||
      n?.ad?.picture_source ||
      n?.ad?.image_url ||
      n?.cube?.logo ||
      null;

    // Judul prioritas dari notifikasi
    const title =
      n.title ||
      n?.grab?.ad?.title ||
      n?.ad?.title ||
      n?.cube?.name ||
      'Notifikasi';

    // Deteksi voucher untuk CTA
    const isVoucher = n.type === 'voucher' || n.target_type === 'voucher';

    // Gunakan action_url dari API jika ada; kalau tidak, pakai pola default
    let actionUrl = n.action_url || (isVoucher && n.target_id ? `/vouchers/${n.target_id}` : null);

    // Tambahkan prefix /app kalau belum ada (menyesuaikan v2.huehuy.com/app/…)
    if (actionUrl && !actionUrl.startsWith('/app')) {
      actionUrl = `/app${actionUrl}`;
    }

    return { img, title, isVoucher, actionUrl };
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        {/* Header */}
        <div className="bg-primary w-full px-4 pt-4 pb-16">
          <h2 className="text-white font-semibold text-lg">Notifikasi</h2>
          <p className="text-slate-300 text-sm mt-1">
            Lihat pembaruan dan aktivitas kamu di sini...
          </p>
        </div>

        {/* Body */}
        <div className="bg-background min-h-screen w-full relative z-20 pb-28 pt-4">
          {/* Tabs */}
          <div className="-mt-16 grid grid-cols-2 gap-3">
            <button
              className={`text-center py-3 font-semibold rounded-t-xl ${
                type === 'hunter' ? 'bg-background text-slate-900' : 'text-gray-300'
              }`}
              onClick={() => setType('hunter')}
              type="button"
            >
              Hunter
            </button>
            <button
              className={`text-center py-3 font-semibold rounded-t-xl ${
                type === 'merchant' ? 'bg-background text-slate-900' : 'text-gray-300'
              }`}
              onClick={() => setType('merchant')}
              type="button"
            >
              Merchant
            </button>
          </div>

          {/* List */}
          <div className="px-4 mt-6">
            <div className="flex flex-col gap-3">
              {loading ? (
                // Skeleton
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="grid grid-cols-4 gap-3 p-3 rounded-[15px] bg-white shadow-sm">
                      <div className="w-full aspect-square rounded-lg bg-slate-200 animate-pulse" />
                      <div className="col-span-3 space-y-2">
                        <div className="h-4 bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 bg-slate-100 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              ) : code && Number(code) >= 400 ? (
                <div className="py-4 text-red-600 text-center text-sm">
                  Gagal memuat notifikasi (kode {code}). Coba muat ulang.
                </div>
              ) : items.length > 0 ? (
                items.map((item, idx) => {
                  const { img, title, isVoucher, actionUrl } = cardMeta(item);
                  return (
                    <div
                      className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] bg-white"
                      key={`${item?.id ?? idx}`}
                    >
                      <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-100 flex justify-center items-center">
                        {img ? (
                          <img
                            src={img}
                            height={700}
                            width={700}
                            alt={title}
                            onError={(e) => {
                              e.currentTarget.src = '/icons/icon-192x192.png';
                            }}
                          />
                        ) : (
                          <span className="text-slate-400 text-xs">No Image</span>
                        )}
                      </div>
                      <div className="col-span-3">
                        <p className="font-semibold line-clamp-2">{title}</p>
                        <p className="text-sm text-slate-600 my-1">{item?.message || '-'}</p>
                        <p className="text-slate-600 text-xs">
                          <DateFormatComponent date={item?.created_at} />
                        </p>

                        {isVoucher && actionUrl && (
                          <a href={actionUrl} className="inline-block mt-2 text-sm font-semibold underline">
                            Klaim voucher →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-slate-500 text-center">Belum ada notifikasi...</div>
              )}
            </div>
          </div>
        </div>

        <BottomBarComponent active="notification" />
      </div>
    </>
  );
}
