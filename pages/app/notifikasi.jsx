/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState, useEffect } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { useGet } from '../../helpers';
import { DateFormatComponent } from '../../components/base.components';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export default function NotificationPage() {
  const [type, setType] = useState('merchant'); // 'hunter' | 'merchant'

  // path API — backend route: /api/notification (singular)
  const path = useMemo(
    () => `notification${type ? `?type=${encodeURIComponent(type)}` : ''}`,
    [type]
  );

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
    const isPromo = n.type === 'promo' || n.target_type === 'promo';

    // Pakai action_url dari backend kalau ada; fallback ke pattern default
    let actionUrl = n.action_url || (isVoucher && n.target_id ? `/vouchers/${n.target_id}` : null);

    // Prefix /app untuk konsistensi v2.huehuy.com/app/...
    if (actionUrl && !actionUrl.startsWith('/app')) {
      actionUrl = `/app${actionUrl}`;
    }

    // Badge untuk tipe notifikasi
    let badge = null;
    if (isVoucher) badge = { text: 'Voucher', color: 'bg-purple-100 text-purple-700' };
    else if (isPromo) badge = { text: 'Promo', color: 'bg-orange-100 text-orange-700' };
    else if (n.type === 'grab') badge = { text: 'Grab', color: 'bg-green-100 text-green-700' };
    else if (n.type === 'ad') badge = { text: 'Iklan', color: 'bg-blue-100 text-blue-700' };

    return { img, title, isVoucher, isPromo, actionUrl, badge };
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        {/* Header dengan gradient yang lebih smooth */}
        <div className="bg-gradient-to-br from-primary to-primary-dark w-full px-4 pt-6 pb-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-2xl">Notifikasi</h1>
              <p className="text-white/80 text-sm mt-1">
                Lihat pembaruan dan aktivitas terbaru
              </p>
            </div>
            {/* Icon notifikasi */}
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-gray-50 min-h-screen w-full relative z-20 pb-28">
          {/* Tabs dengan design yang lebih modern */}
          <div className="-mt-12 mx-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-1 grid grid-cols-2 gap-1">
              <button
                type="button"
                className={`text-center py-4 font-semibold rounded-xl transition-all duration-200 ${
                  type === 'hunter'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setType('hunter')}
              >
                🎯 Hunter
              </button>
              <button
                type="button"
                className={`text-center py-4 font-semibold rounded-xl transition-all duration-200 ${
                  type === 'merchant'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setType('merchant')}
              >
                🏪 Merchant
              </button>
            </div>
          </div>

          {/* List dengan spacing yang lebih baik */}
          <div className="px-4">
            <div className="space-y-4">
              {loading ? (
                // Skeleton dengan design yang lebih halus
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-200 rounded-lg animate-pulse" />
                          <div className="h-3 bg-gray-100 rounded-lg animate-pulse" />
                          <div className="h-3 w-2/3 bg-gray-100 rounded-lg animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : httpCode && Number(httpCode) >= 400 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium">Gagal memuat notifikasi</p>
                  <p className="text-gray-500 text-sm mt-1">Kode error: {httpCode}</p>
                </div>
              ) : items.length > 0 ? (
                items.map((item, idx) => {
                  const { img, title, isVoucher, actionUrl, badge } = cardMeta(item);
                  const isUnread = !item.read_at;

                  return (
                    <div
                      className={`bg-white rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                        isUnread ? 'border-l-4 border-primary' : ''
                      }`}
                      key={item?.id ?? `notif-${idx}`}
                    >
                      <div className="flex gap-4">
                        {/* Image dengan ukuran yang lebih konsisten */}
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
                            {img ? (
                              <img
                                src={img}
                                className="w-full h-full object-cover"
                                alt={title}
                                onError={(e) => {
                                  e.currentTarget.src = '/icons/icon-192x192.png';
                                }}
                              />
                            ) : (
                              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {/* Indicator unread */}
                          {isUnread && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className={`font-semibold text-gray-900 line-clamp-2 ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                              {title}
                            </h3>
                            {badge && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-lg ${badge.color} flex-shrink-0`}>
                                {badge.text}
                              </span>
                            )}
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {item?.message || 'Tidak ada pesan'}
                          </p>

                          <div className="flex items-center justify-between">
                            <p className="text-gray-400 text-xs">
                              <DateFormatComponent date={item?.created_at} />
                            </p>

                            {isVoucher && actionUrl && (
                              <a
                                href={actionUrl}
                                className="inline-flex items-center text-primary font-medium text-sm hover:text-primary-dark transition-colors"
                              >
                                Klaim voucher
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-4z" />
                      <circle cx={12} cy={7} r={4} />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Belum ada notifikasi</h3>
                  <p className="text-gray-500 text-sm">
                    Notifikasi baru akan muncul di sini
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <BottomBarComponent active="notification" />
      </div>
    </>
  );
}
