/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState, useEffect } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { useGet } from '../../helpers';
import { DateFormatComponent } from '../../components/base.components';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export default function NotificationPage() {
  // kalau mau langsung munculin voucher/promo di tab Merchant:
  // const [type, setType] = useState('merchant');
  const [type, setType] = useState('merchant'); // 'hunter' | 'merchant' | 'all'

  // path API — backend route: /api/notification (singular)
  const path = useMemo(
    () => `notification${type ? `?type=${encodeURIComponent(type)}` : ''}`,
    [type]
  );

  // Guard supaya gak “number is not iterable” pas SSR/edge case
  const res = useGet({ path });
  const loading = Array.isArray(res) ? Boolean(res[0]) : false;
  const httpCode = Array.isArray(res) ? res[1] : null;
  const payload = Array.isArray(res) ? res[2] : null;

  // Normalisasi data agar aman
  const items = Array.isArray(payload?.data) ? payload.data : [];

  useEffect(() => {
    if (!DEBUG) return;
    // Debug ringan saat dev saja
    /* eslint-disable no-console */
    console.log('=== NOTIFICATION DEBUG ===');
    console.log('Type:', type);
    console.log('API Path:', path);
    console.log('useGet raw:', res);
    console.log('Loading:', loading, 'HTTP code:', httpCode);
    console.log('payload:', payload);
    console.log('items:', items);
    console.log('==========================');
    /* eslint-enable no-console */
  }, [type, path, res, loading, httpCode, payload]);

  const cardMeta = (n) => {
    if (!n || typeof n !== 'object') {
      return { img: null, title: 'Notifikasi', isVoucher: false, actionUrl: null };
    }

    // Ambil image prioritas dari payload datar, fallback ke relasi legacy
    const img =
      n.image_url ||
      n?.grab?.ad?.picture_source ||
      n?.ad?.picture_source ||
      n?.ad?.image_url ||
      n?.cube?.logo ||
      null;

    // Judul prioritas
    const title =
      n.title ||
      n?.grab?.ad?.title ||
      n?.ad?.title ||
      n?.cube?.name ||
      'Notifikasi';

    // Deteksi voucher untuk CTA
    const isVoucher = n.type === 'voucher' || n.target_type === 'voucher';

    // Pakai action_url dari backend kalau ada; fallback ke pattern default
    let actionUrl = n.action_url || (isVoucher && n.target_id ? `/vouchers/${n.target_id}` : null);

    // Prefix /app untuk konsistensi v2.huehuy.com/app/...
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
          <div className="-mt-16 grid grid-cols-3 gap-3">
            <button
              type="button"
              aria-pressed={type === 'hunter'}
              className={`text-center py-3 font-semibold rounded-t-xl ${
                type === 'hunter' ? 'bg-background text-slate-900' : 'text-gray-300'
              }`}
              onClick={() => setType('hunter')}
            >
              Hunter
            </button>
            <button
              type="button"
              aria-pressed={type === 'merchant'}
              className={`text-center py-3 font-semibold rounded-t-xl ${
                type === 'merchant' ? 'bg-background text-slate-900' : 'text-gray-300'
              }`}
              onClick={() => setType('merchant')}
            >
              Merchant
            </button>
            <button
              type="button"
              aria-pressed={type === 'all'}
              className={`text-center py-3 font-semibold rounded-t-xl ${
                type === 'all' ? 'bg-background text-slate-900' : 'text-gray-300'
              }`}
              onClick={() => setType('all')}
            >
              Semua
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
              ) : httpCode && Number(httpCode) >= 400 ? (
                <div className="py-4 text-red-600 text-center text-sm">
                  Gagal memuat notifikasi (kode {httpCode}). Coba muat ulang.
                </div>
              ) : items.length > 0 ? (
                items.map((item, idx) => {
                  const { img, title, isVoucher, actionUrl } = cardMeta(item);
                  return (
                    <div
                      className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] bg-white"
                      key={item?.id ?? `notif-${idx}`}
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
