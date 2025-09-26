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

  const ctxTenant = React.useMemo(() => {
    const fromQuery =
      String(router.query?.ctx || '').toLowerCase() === 'tenant';
    let fromLS = false;
    if (typeof window !== 'undefined') {
      try { fromLS = localStorage.getItem('tenant_view') === '1'; } catch { }
    }
    return fromQuery || fromLS;
  }, [router.query?.ctx]);

  // --- paksa mode tenant berdasarkan URL/route, lebih stabil dari window ---
  const forceTenantView =
    /(^|\/)(tenant|merchant)(\/|$)/i.test(router.pathname || '') ||
    /(^|\/)(tenant|merchant)(\/|$)/i.test(router.asPath || '') ||
    (typeof window !== 'undefined' && /^tenant\./i.test(window.location.host || ''));

  const { profile } = useUserContext() || {};
  // ===== DEBUG SWITCH =====
  const DEBUG = true;
  // eslint-disable-next-line no-console
  const dlog = (...args) => { if (DEBUG) console.log(...args); };
  const dgrp = (label, fn) => {
    if (!DEBUG) return fn?.();
    // eslint-disable-next-line no-console
    console.groupCollapsed(label);
    // eslint-disable-next-line no-console
    try { fn?.(); } finally { console.groupEnd(); }
  };
  const _norm = (v) =>
    String(v ?? '')
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

  const tenantHints = [
    _norm(profile?.role_id),
    _norm(profile?.role),
    _norm(profile?.role_name),
    _norm(profile?.role_slug),
    _norm(profile?.user_role),
    _norm(profile?.tenant_id),
    _norm(profile?.merchant_id),
    _norm(profile?.managed_tenant_id),
    _norm(profile?.managed_merchant_id),
    ...(Array.isArray(profile?.roles)
      ? profile.roles.map((r) => _norm(r?.slug ?? r?.name ?? r?.id ?? r))
      : []),
    ...(Array.isArray(profile?.permissions)
      ? profile.permissions.map((p) => _norm(p))
      : []),
  ];

  // --- URL + Host (buat fallback deteksi tenant lewat alamat) ---
  const path = typeof window !== 'undefined' ? String(window.location?.pathname || '') : '';
  const host = typeof window !== 'undefined' ? String(window.location?.host || '') : '';

  const isTenantByRole =
    String(profile?.role_id ?? '') === '6' ||
    tenantHints.some((t) => /(tenant|manager_tenant|managertenant|merchant)/i.test(String(t)));

  const isTenantByUrl =
    /(tenant|merchant|manager-tenant|tenant-manager)/i.test(path) ||  // cocokkan segmen path
    /^tenant\./i.test(host);

  // Simpan flag tenant_view agar bertahan setelah reload
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (forceTenantView || isTenantByUrl) {
      try { localStorage.setItem('tenant_view', '1'); } catch { }
    }
  }, [forceTenantView, isTenantByUrl]);

  const isTenantContext =
    String(profile?.role_id ?? '') === '6' ||
    tenantHints.some((t) => /(tenant|manager_tenant|managertenant|merchant)/i.test(String(t))) ||
    /(tenant|merchant|manager-tenant|tenant-manager)/i.test(path) ||
    /^tenant\./i.test(host) ||
    ctxTenant; // ← pakai state di sini

  // Sinyal gabungan: kita kemungkinan besar lagi di konteks tenant
  const isProbablyTenant =
    isTenantContext || forceTenantView || ctxTenant || isTenantByUrl || isTenantByRole;

  // LOG sesudah nilai boolean-nya jadi
  dgrp('[RiwayatValidasi] context', () => {
    dlog('router.query =>', { id, type, ready });
    dlog('profile =>', profile);
    dlog('tenantHints =>', tenantHints);
    dlog('isTenantContext =>', isTenantContext);
  });

  // API URL untuk base URL gambar
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
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
    path:
      ready && id && type === 'promo'
        ? `promos/${id}/history`
        : ready
          ? 'user/promo-validations'
          : null,
    params: undefined,
  });

  const [voucherLoading, voucherStatus, voucherRes] = useGet({
    path:
      ready && id && type === 'voucher'
        ? `vouchers/${id}/history`
        : ready
          ? 'user/voucher-validations'
          : null,
    params: undefined,
  });

  dgrp('[RiwayatValidasi] fetch status', () => {
    dlog('promoLoading, promoStatus =>', promoLoading, promoStatus);
    dlog('voucherLoading, voucherStatus =>', voucherLoading, voucherStatus);
    dlog('promoRes (raw) =>', promoRes);
    dlog('voucherRes (raw) =>', voucherRes);
  });

  const extractList = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res; // array langsung
    if (Array.isArray(res?.data)) return res.data; // { data: [...] }
    if (Array.isArray(res?.data?.data)) return res.data.data; // { data: { data: [...] } }
    return [];
  };

  // Combine and sort items by date
  const promoItems = extractList(promoRes).map((item) => ({
    ...item,
    itemType: 'promo',
  }));
  const voucherItems = extractList(voucherRes).map((item) => ({
    ...item,
    itemType: 'voucher',
  }));

  // LOG sesudah dua-duanya siap
  dgrp('[RiwayatValidasi] items', () => {
    dlog('promoItems.length =>', promoItems.length, promoItems);
    dlog('voucherItems.length =>', voucherItems.length, voucherItems);
  });

  // If viewing specific item, show only that type
  const allItems =
    id && type
      ? type === 'promo'
        ? promoItems
        : voucherItems
      : [...promoItems, ...voucherItems].sort(
        (a, b) =>
          new Date(b.validated_at || b.created_at) -
          new Date(a.validated_at || a.created_at)
      );

  const loading = promoLoading || voucherLoading;

  // Ready checks supaya view nggak salah default
  const profileReady = !!(
    profile &&
    (profile.id || profile.user_id || profile?.user?.id || profile?.data?.id)
  );

  const safeTenantSignal = isTenantByUrl || forceTenantView || ctxTenant;

  // Kalau router belum siap ATAU profil belum siap & tak ada sinyal tenant → tampilkan loading dulu
  if (!ready || (!profileReady && !safeTenantSignal)) {
    return (
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
            <div className="font-semibold w-full text-lg">Riwayat Validasi</div>
          </div>
          <div className="p-4 text-center">Memuat...</div>
        </div>
      </div>
    );
  }

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
            <div className="font-semibold w-full text-lg">Riwayat Validasi</div>
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
                    src={
                      v.itemType === 'voucher'
                        ? normalizeVoucherImage(
                          v.voucher?.image ?? v.voucher?.picture_source
                        )
                        : normalizePromoImage(
                          v.promo?.image ?? v.promo?.picture_source
                        )
                    }
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
                    // Ambil ID login (kalau ada)
                    const currentUserId = String(
                      profile?.id
                      ?? profile?.user_id
                      ?? profile?.user?.id
                      ?? profile?.data?.id
                      ?? profile?.payload?.id
                      ?? profile?.account?.id
                      ?? ''
                    );

                    // dari BE:
                    // v.user  = validator (TENANT/merchant)
                    // v.owner = end-user pemilik item
                    const validatorId = String(v?.user?.id ?? '');
                    const ownerId = String(v?.owner?.id ?? '');

                    // Penentuan mode final (sederhana & deterministik):
                    // 1) Kalau kita di halaman tenant -> paksa 'tenant'
                    // 2) Atau kalau ID kita = validator -> 'tenant'
                    // 3) Atau kalau ID kita = owner -> 'owner'
                    // 4) Fallback: anggap user biasa -> 'owner'
                    let view = 'owner';
                    // Prioritas: konteks tenant → paksa 'tenant'
                    if (isProbablyTenant) {
                      view = 'tenant';
                    } else if (currentUserId && validatorId && String(currentUserId) === String(validatorId)) {
                      view = 'tenant';
                    } else if (currentUserId && ownerId && String(currentUserId) === String(ownerId)) {
                      view = 'owner';
                    }
                    dlog('[RiwayatValidasi] row =>', { forceTenantView, ctxTenant, isTenantContext, currentUserId, validatorId, ownerId, view, v });

                    return (
                      <>
                        <p className="font-semibold">
                          {v.itemType === 'voucher'
                            ? v.voucher?.title ?? v.voucher?.name ?? 'Voucher'
                            : v.promo?.title ?? 'Promo'}
                        </p>

                        <p className="text-slate-600 text-sm mb-1">
                          {view === 'tenant' ? (
                            <>Promo milik: {v.owner?.name ?? '-'}</>
                          ) : (
                            <>Divalidasi oleh: {v.user?.name ?? '—'}</>
                          )}
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
                  <div
                    className={`badge ${v.itemType === 'voucher' ? 'badge-voucher' : 'badge-promo'
                      }`}
                  >
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
