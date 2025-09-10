/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { useGet } from '../../helpers';
import { DateFormatComponent } from '../../components/base.components';

/**
 * @typedef {Object} NotifItem
 * @property {number} id
 * @property {string} [type]               // 'voucher' | 'promo' | 'merchant' | ...
 * @property {string} [message]
 * @property {string} [created_at]
 * @property {string} [title]
 * @property {string} [image_url]
 * @property {string} [target_type]        // 'voucher' | ...
 * @property {number} [target_id]
 * @property {string} [action_url]
 * @property {{ ad?: { title?: string; picture_source?: string } }} [grab]
 * @property {{ title?: string; picture_source?: string; image_url?: string }} [ad]
 * @property {{ name?: string; logo?: string }} [cube]
 */

export default function NotificationPage() {
  // Default tab bisa kamu ganti 'merchant' kalau mau langsung nampilin voucher/promo
  const [type, setType] = useState<'hunter' | 'merchant'>('hunter');

  // Refetch ketika tab berubah; route backend kamu: /api/notification (singular)
  const path = useMemo(
    () => `notification${type ? `?type=${encodeURIComponent(type)}` : ''}`,
    [type]
  );

  const [loading, code, data] = useGet({ path });

  const items = Array.isArray(data?.data) ? data.data : [];

  const cardMeta = (n) => {
    // 1) Pakai payload voucher/promo duluan
    const img =
      n?.image_url ||
      n?.grab?.ad?.picture_source ||
      n?.ad?.picture_source ||
      n?.ad?.image_url ||
      n?.cube?.logo ||
      null;

    const title =
      n?.title ||
      n?.grab?.ad?.title ||
      n?.ad?.title ||
      n?.cube?.name ||
      'Notifikasi';

    // 2) Deteksi voucher untuk CTA
    const isVoucher = n?.type === 'voucher' || n?.target_type === 'voucher';
    // Gunakan action_url dari API jika ada; kalau tidak, turunkan ke pola default
    let actionUrl = n?.action_url || (isVoucher && n?.target_id ? `/vouchers/${n.target_id}` : null);

    // Tambahkan prefix /app kalau perlu (menyesuaikan struktur v2.huehuy.com/app/…)
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
            >
              Hunter
            </button>
            <button
              className={`text-center py-3 font-semibold rounded-t-xl ${
                type === 'merchant' ? 'bg-background text-slate-900' : 'text-gray-300'
              }`}
              onClick={() => setType('merchant')}
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
              ) : code && code >= 400 ? (
                <div className="py-4 text-red-600 text-center text-sm">
                  Gagal memuat notifikasi (kode {code}). Coba muat ulang.
                </div>
              ) : items.length > 0 ? (
                items.map((item, idx) => {
                  const { img, title, isVoucher, actionUrl } = cardMeta(item);
                  return (
                    <div
                      className="grid grid-cols-4 gap-3 p-3 shadow-sm rounded-[15px] bg-white"
                      key={`${item.id || idx}`}
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
                          <a
                            href={actionUrl}
                            className="inline-block mt-2 text-sm font-semibold underline"
                          >
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
