/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import {
  faArrowLeft,
  faArrowRight,
  faCheckCircle,
  faChevronRight,
  faClock,
  faExclamationTriangle,
  faGift,
  faRoute,
  faTag,
  faTimesCircle,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import moment from 'moment';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import { token_cookie_name } from '../../helpers';
import { Decrypt } from '../../helpers/encryption.helpers';

// Pastikan apiUrl selalu mengarah ke /api
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

export default function Save() {
  const router = useRouter();
  const [modalValidation, setModalValidation] = useState(false);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState({ data: [] });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Ambil data saku: HANYA untuk user saat ini
  const fetchData = useCallback(async () => {
    const controller = new AbortController();

    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Ambil data user-scoped (BUKAN admin/global)
      const [promoRes, voucherRes] = await Promise.allSettled([
        fetch(`${apiUrl}/admin/promo-items`, { headers, signal: controller.signal }),
        fetch(`${apiUrl}/vouchers/voucher-items`, { headers, signal: controller.signal }),
      ]);

      let allItems = [];

      // === PROMO ITEMS (untuk user) ===
      if (promoRes.status === 'fulfilled' && promoRes.value.ok) {
        const promoJson = await promoRes.value.json().catch(() => ({}));
        const rows = Array.isArray(promoJson) ? promoJson : (promoJson?.data || []);

        const mapped = rows.map((it) => {
          // fleksibel: backend bisa kirim {promo: {...}} atau {ad: {...}}
          const ad = it.promo || it.ad || {};
          const claimedAt   = it.created_at || it.claimed_at || it.validated_at || it.claimedAt || null;
          const expiredAt   = it.expires_at || it.expired_at || it.expiry || ad.valid_until || null;
          const validatedAt = it.used_at || it.redeemed_at || it.validation_at || null;

          const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
            .replace(/\/api\/?$/, '')
            .replace(/\/$/, '');

          return {
            id: it.id,
            type: 'promo',
            code: it.code || it.qr || it.token || null,
            claimed_at: claimedAt,
            expired_at: expiredAt,
            validation_at: validatedAt,
            voucher_item: null,
            voucher: null,
            ad: {
              id: ad.id,
              title: ad.title || ad.name || 'Promo',
              picture_source: ad.image ? `${base}/storage/${ad.image}` : (ad.picture_source || '/default-avatar.png'),
              status: ad.status || 'active',
              description: ad.description,
              cube: {
                community_id: ad.community_id || ad?.cube?.community_id || 1,
                user: { name: ad.owner_name || ad?.cube?.user?.name || 'Merchant', phone: ad.owner_contact || '' },
                corporate: ad?.cube?.corporate || null,
                tags: [{ address: ad.location || '', link: null, map_lat: null, map_lng: null }],
              },
            },
          };
        });

        allItems = allItems.concat(mapped);
      }

      // === VOUCHER ITEMS (untuk user) ===
      if (voucherRes.status === 'fulfilled' && voucherRes.value.ok) {
        const voucherJson = await voucherRes.value.json().catch(() => ({}));
        const rows = Array.isArray(voucherJson) ? voucherJson : (voucherJson?.data || []);

        const mapped = rows.map((it) => {
          const voucher = it.voucher || {};
          const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
            .replace(/\/api\/?$/, '')
            .replace(/\/$/, '');

          return {
            id: it.id,
            type: 'voucher',
            code: it.code,
            claimed_at: it.created_at,
            expired_at: voucher.valid_until || null,
            validation_at: it.used_at || null,
            voucher_item: { id: it.id, code: it.code, user_id: it.user_id, voucher_id: it.voucher_id, used_at: it.used_at },
            voucher,
            ad: {
              id: voucher.id,
              title: voucher.name || voucher.title || 'Voucher',
              picture_source: voucher.image ? `${base}/storage/${voucher.image}` : '/default-avatar.png',
              status: 'active',
              description: voucher.description,
              type: voucher.type,
              tenant_location: voucher.tenant_location,
              delivery: voucher.delivery,
              stock: voucher.stock,
              community: voucher.community,
              cube: voucher.community
                ? {
                    community_id: voucher.community.id,
                    code: `community-${voucher.community.id}`,
                    user: { name: voucher.community.name || 'Community', phone: '' },
                    corporate: null,
                    tags: [{ address: voucher.tenant_location || '', link: null, map_lat: null, map_lng: null }],
                  }
                : {},
            },
          };
        });

        allItems = allItems.concat(mapped);
      }

      // Urutkan terbaru dulu
      allItems.sort((a, b) => new Date(b.claimed_at || 0) - new Date(a.claimed_at || 0));
      setData({ data: allItems });
    } catch (err) {
      console.error('Error fetching saku data:', err);
      setData({ data: [] });
    }

    return () => controller.abort();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh saat focus & route change
  useEffect(() => {
    const handleFocus = () => setRefreshTrigger((p) => p + 1);
    const handleRouteChange = () => setRefreshTrigger((p) => p + 1);

    window.addEventListener('focus', handleFocus);
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // ====== Helpers ======
  const getTimeRemaining = (expiredAt) => {
    if (!expiredAt) return null;
    const now = moment();
    const expired = moment(expiredAt);
    const duration = moment.duration(expired.diff(now));
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) % 60;

    if (hours < 0 || minutes < 0) return 'Sudah kedaluwarsa';
    if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
    if (minutes > 0) return `${minutes} menit lagi`;
    return 'Sudah kedaluwarsa';
  };

  const isRecentlyClaimed = (claimedAt) => {
    if (!claimedAt) return false;
    const now = moment();
    const claimed = moment(claimedAt);
    return now.diff(claimed, 'hours') < 1;
  };

  const getStatusBadge = (item) => {
    // Voucher: lihat stock & expiry
    if (item?.type === 'voucher' || item?.voucher) {
      const voucher = item?.voucher || item?.ad;
      const isVoucherActive =
        (voucher?.stock === undefined || voucher?.stock > 0) &&
        (!voucher?.valid_until || new Date(voucher.valid_until) > new Date());

      if (item?.validation_at) {
        return (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faCheckCircle} className="text-success text-xs" />
            <span className="font-medium text-success bg-green-50 px-2 py-1 rounded-full text-xs">Sudah divalidasi</span>
          </div>
        );
      } else if (!isVoucherActive) {
        return (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faTimesCircle} className="text-danger text-xs" />
            <span className="font-medium text-danger bg-red-50 px-2 py-1 rounded-full text-xs">Voucher Tidak Tersedia</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning text-xs" />
          <span className="font-medium text-warning bg-yellow-50 px-2 py-1 rounded-full text-xs">Belum divalidasi</span>
        </div>
      );
    }

    // Promo
    const isActive =
      item?.ad?.status === 'active' ||
      item?.ad?.status === 'available' ||
      (!item?.ad?.status && item?.ad?.id);

    if (item?.validation_at) {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faCheckCircle} className="text-success text-xs" />
          <span className="font-medium text-success bg-green-50 px-2 py-1 rounded-full text-xs">Sudah divalidasi</span>
        </div>
      );
    } else if (!isActive) {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faTimesCircle} className="text-danger text-xs" />
          <span className="font-medium text-danger bg-red-50 px-2 py-1 rounded-full text-xs">Promo Ditutup</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning text-xs" />
        <span className="font-medium text-warning bg-yellow-50 px-2 py-1 rounded-full text-xs">Belum divalidasi</span>
      </div>
    );
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        {/* Header */}
        <div className="bg-primary w-full px-4 py-4 flex items-center">
          <button onClick={() => router.push('/app')} className="text-white hover:text-white/80 transition-colors mr-4">
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          </button>
          <h2 className="text-white font-semibold text-lg flex-1 text-center">Saku Promo</h2>
        </div>

        {/* Content */}
        <div className="bg-slate-50 min-h-screen w-full pb-32">
          <div className="px-4 pt-6">
            {/* Info Card */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faWallet} className="text-primary text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Koleksi Promo Anda</h3>
                  <p className="text-slate-500 text-sm">{data?.data?.length || 0} item tersimpan</p>
                </div>
              </div>
            </div>

            {data?.data?.length ? (
              <div className="space-y-4">
                {data?.data?.map((item, key) => (
                  <div
                    className={`bg-white rounded-2xl p-4 shadow-lg border hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                      isRecentlyClaimed(item.claimed_at)
                        ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-white'
                        : 'border-slate-100'
                    }`}
                    key={key}
                    onClick={() => {
                      setModalValidation(true);
                      setSelected(item);
                    }}
                  >
                    {/* Badge Baru Direbut */}
                    {isRecentlyClaimed(item.claimed_at) && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          ✨ Baru Direbut
                        </span>
                      </div>
                    )}

                    {/* Badge Sudah Digunakan */}
                    {item.validation_at && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          ✓ Sudah Digunakan
                        </span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      {/* Gambar */}
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex justify-center items-center group-hover:scale-105 transition-transform duration-300">
                        {(() => {
                          const isVoucher = item?.voucher_item || item?.type === 'voucher' || item?.voucher;
                          let imageSource = null;

                          if (isVoucher) {
                            const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
                              .replace(/\/api\/?$/, '')
                              .replace(/\/$/, '');
                            imageSource = item?.voucher?.image ? `${base}/storage/${item.voucher.image}` : item?.ad?.picture_source;
                          } else {
                            imageSource = item?.ad?.picture_source;
                          }

                          return imageSource ? (
                            <img
                              src={imageSource}
                              className="w-full h-full object-cover"
                              alt={item?.ad?.title || item?.voucher?.name || 'Promo/Voucher'}
                              onError={(e) => {
                                e.currentTarget.src = '/default-avatar.png';
                              }}
                            />
                          ) : (
                            <FontAwesomeIcon icon={faTag} className="text-slate-400 text-2xl" />
                          );
                        })()}
                      </div>

                      {/* Konten */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="font-semibold text-slate-800 text-base leading-tight">
                            {item?.ad?.title || item?.voucher?.name || item?.name || 'Promo/Voucher Tanpa Judul'}
                          </h3>
                        </div>

                        {/* Type Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          {item?.voucher_item || item?.type === 'voucher' || item?.voucher ? (
                            <span className="inline-flex items-center gap-1 font-medium text-success bg-emerald-50 px-3 py-1 rounded-full text-xs border border-emerald-200">
                              <FontAwesomeIcon icon={faGift} />
                              Voucher
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-warning bg-amber-50 px-3 py-1 rounded-full text-xs border border-amber-200">
                              <FontAwesomeIcon icon={faTag} />
                              Promo
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="mb-2">{getStatusBadge(item)}</div>

                        {/* Expiry */}
                        {item?.expired_at && (
                          <div className="flex items-center gap-1 text-xs">
                            <FontAwesomeIcon icon={faClock} className="text-red-500" />
                            <span className="text-red-600 font-medium">{getTimeRemaining(item.expired_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faWallet} className="text-slate-400 text-3xl" />
                </div>
                <h3 className="font-semibold text-slate-600 mb-2">Saku Promo Kosong</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-4">
                  Jelajahi komunitas dan kumpulkan promo untuk mengisi saku Anda
                </p>
                <button
                  onClick={() => router.push('/app/komunitas')}
                  className="bg-primary text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-opacity-90 transition-all"
                >
                  Cari Promo
                </button>
              </div>
            )}
          </div>
        </div>

        <BottomBarComponent active={'save'} />
      </div>

      {/* Modal Bottom Sheet */}
      <BottomSheetComponent
        title={selected?.voucher_item || selected?.type === 'voucher' || selected?.voucher ? 'Detail Voucher' : 'Detail Promo'}
        show={modalValidation}
        onClose={() => {
          setModalValidation(false);
          setSelected(null);
        }}
        height={600}
      >
        {/* ======== Modal Content ======== */}
        <div className="p-4 space-y-4">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-xl text-slate-800 leading-tight mb-2">
                  {selected?.ad?.title || selected?.voucher?.name || 'Detail'}
                </h4>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTag} className="text-primary text-sm" />
                  <span className="text-sm font-medium text-slate-600">
                    {selected?.voucher_item || selected?.type === 'voucher' || selected?.voucher ? 'Voucher' : 'Promo'}
                  </span>
                </div>
              </div>

              <Link
                href={
                  selected?.type === 'voucher' || selected?.voucher_item || selected?.voucher
                    ? `/app/voucher/${selected?.voucher?.id || selected?.ad?.id || selected?.voucher_item?.voucher_id}`
                    : `/app/komunitas/promo/${selected?.ad?.id}?communityId=${selected?.ad?.cube?.community_id || 1}&from=saku`
                }
              >
                <div className="flex items-center gap-1 text-sm text-primary font-medium bg-primary/10 px-3 py-2 rounded-full text-xs hover:bg-primary/20 transition-colors">
                  Detail
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </div>
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h5 className="font-semibold text-slate-800 mb-3">Informasi Kontak</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Pemilik</span>
                <span className="text-slate-800 font-medium text-sm">
                  {(() => {
                    if (selected?.type === 'voucher' || selected?.voucher_item || selected?.voucher) {
                      return selected?.voucher?.community?.name || selected?.ad?.community?.name || selected?.ad?.cube?.user?.name || 'Merchant';
                    }
                    return selected?.ad?.owner_name || selected?.ad?.cube?.user?.name || selected?.ad?.cube?.corporate?.name || '-';
                  })()}
                </span>
              </div>
              {/* Nomor telp hanya untuk promo */}
              {!(selected?.type === 'voucher' || selected?.voucher_item || selected?.voucher) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">No. Telepon</span>
                  <span className="text-slate-800 font-medium text-sm">
                    {selected?.ad?.owner_contact || selected?.ad?.cube?.user?.phone || selected?.ad?.cube?.corporate?.phone || '-'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lokasi / Link */}
          {(selected?.ad?.cube?.tags?.at(0)?.address || selected?.ad?.cube?.tags?.at(0)?.link) && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h5 className="font-semibold text-slate-800 mb-3">Lokasi/Link</h5>

              {selected?.ad?.cube?.tags?.at(0)?.address && (
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <span className="text-sm text-slate-600">Alamat:</span>
                    <p className="text-slate-800 text-sm font-medium">{selected?.ad?.cube?.tags?.at(0)?.address}</p>
                  </div>
                  <a
                    href={`http://www.google.com/maps/place/${selected?.ad?.cube?.tags?.at(0)?.map_lat},${selected?.ad?.cube?.tags?.at(0)?.map_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <FontAwesomeIcon icon={faRoute} className="text-primary" />
                  </a>
                </div>
              )}

              {selected?.ad?.cube?.tags?.at(0)?.link && (
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="text-sm text-slate-600">Online Store:</span>
                    <p className="text-slate-800 text-sm font-medium truncate">{selected?.ad?.cube?.tags?.at(0)?.link}</p>
                  </div>
                  <a
                    href={selected?.ad?.cube?.tags?.at(0)?.link}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowRight} className="text-primary" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QR / Status */}
        <div className="px-4 pb-6">
          {selected?.validation_at ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl py-8">
              <div className="text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl mb-3" />
                <div className="font-bold text-green-700 text-lg">
                  {selected?.voucher_item || selected?.type === 'voucher' || selected?.voucher ? 'Voucher Telah Digunakan' : 'Promo Telah Digunakan'}
                </div>
                <p className="text-green-600 text-sm mt-1">Terima kasih</p>
              </div>
            </div>
          ) : selected?.type === 'voucher' || selected?.voucher ? (
            (() => {
              const voucher = selected?.voucher || selected?.ad;
              const isVoucherActive =
                (voucher?.stock === undefined || voucher?.stock > 0) &&
                (!voucher?.valid_until || new Date(voucher.valid_until) > new Date());

              if (!isVoucherActive) {
                return (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl py-8">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-4xl mb-3" />
                      <div className="font-bold text-red-700 text-lg">Voucher Tidak Tersedia</div>
                      <p className="text-red-600 text-sm mt-1">
                        {voucher?.stock !== undefined && voucher?.stock <= 0 ? 'Stok habis' : 'Voucher kedaluwarsa'}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="text-center">
                    <div className="mb-4">
                      <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                        {selected?.voucher_item?.code ? 'Kode Voucher' : 'QR Code'}
                      </span>
                    </div>

                    {selected?.voucher_item?.code ? (
                      <>
                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <QRCodeSVG
                            value={selected?.voucher_item?.code}
                            size={180}
                            bgColor="#f8fafc"
                            fgColor="#0f172a"
                            level="H"
                            includeMargin={true}
                            className="mx-auto rounded-lg"
                          />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-800 mb-4">{selected?.voucher_item?.code}</h4>
                      </>
                    ) : (
                      <>
                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <QRCodeSVG
                            value={selected?.code}
                            size={180}
                            bgColor="#f8fafc"
                            fgColor="#0f172a"
                            className="mx-auto rounded-lg"
                          />
                        </div>
                        <div className="text-xl font-bold text-slate-600 mb-4">{selected?.code}</div>
                      </>
                    )}

                    <button
                      className="w-full bg-gradient-to-r from-primary to-primary/90 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                      onClick={() => {
                        // no-alert versi: tinggal trigger validasi flow-mu di sini
                        console.log('QR siap untuk divalidasi.');
                      }}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      Validasi Voucher
                    </button>
                    <p className="text-slate-500 text-xs mt-3">Tunjukkan kode ini kepada merchant</p>
                  </div>
                </div>
              );
            })()
          ) : !(
              selected?.ad?.status === 'active' ||
              selected?.ad?.status === 'available' ||
              (!selected?.ad?.status && selected?.ad?.id)
            ) ? (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl py-8">
              <div className="text-center">
                <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-4xl mb-3" />
                <div className="font-bold text-red-700 text-lg">Promo Tidak Tersedia</div>
                <p className="text-red-600 text-sm mt-1">Promo sudah berakhir</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="text-center">
                <div className="mb-4">
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">QR Code</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <QRCodeSVG value={selected?.code} size={180} bgColor="#f8fafc" fgColor="#0f172a" className="mx-auto rounded-lg" />
                </div>

                <p className="text-slate-500 text-xs mt-3">Tunjukkan kode ini kepada merchant</p>
              </div>
            </div>
          )}
        </div>
      </BottomSheetComponent>
    </>
  );
}
