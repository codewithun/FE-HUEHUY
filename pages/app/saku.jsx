/* eslint-disable no-console */
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import { token_cookie_name } from '../../helpers';
import { Decrypt } from '../../helpers/encryption.helpers';

// Pastikan base URL tanpa /api di akhir
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

// === Helper: parse validation_time_limit (m/h/s atau angka menit) ===
const parseTimeLimitMs = (raw) => {
  if (raw == null) return 0;
  const s = String(raw).trim().toLowerCase();
  if (!s) return 0;
  // format HH:mm:ss atau HH:mm
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(':').map((v) => Number(v));
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const sec = parts[2] || 0;
    const hours = Number.isFinite(h) ? h : 0;
    const minutes = Number.isFinite(m) ? m : 0;
    const seconds = Number.isFinite(sec) ? sec : 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  // format berakhiran huruf: 90m, 2h, 3600s
  const m = s.match(/^(\d+(?:\.\d+)?)([smh])$/);
  if (m) {
    const val = parseFloat(m[1]);
    const unit = m[2];
    if (unit === 's') return val * 1000;
    if (unit === 'm') return val * 60 * 1000;
    if (unit === 'h') return val * 60 * 60 * 1000;
  }
  // angka polos → asumsikan MENIT
  const num = Number(s);
  if (!Number.isNaN(num) && num > 0) return num * 60 * 1000;
  return 0;
};

// === Helper: tentukan expired_at promo berbasis time limit sejak claimedAt ===
const resolvePromoExpiry = (ad, claimedAtIso, fallbackExpiredIso) => {
  const limitMs = parseTimeLimitMs(ad?.validation_time_limit);
  if (limitMs > 0 && claimedAtIso) {
    const t = new Date(claimedAtIso).getTime();
    if (!Number.isNaN(t)) {
      return new Date(t + limitMs).toISOString();
    }
  }
  return fallbackExpiredIso || null;
};

// Resolve the correct ad id from a promo/voucher item
// Prioritize nested ad.id over other ambiguous id fields (some payloads contain promo.id which is not an ad id)
const resolveAdId = (row) => {
  if (!row) return null;
  const pick = (v) => (v === 0 || v ? Number(v) : null);
  // New priority (most reliable first):
  // 1) ad.id (nested ad object)
  // 2) promo.ad.id (promo object that contains ad)
  // 3) promo_item.ad_id (item-level ad reference)
  // 4) promo_item.promo_id (item-level promo reference — can still resolve to ad)
  // 5) promo.id (sometimes confusingly named)
  // 6) promo_id (legacy)
  // 7) ad_id (last resort)
  const cand = [
    pick(row?.ad?.id),
    pick(row?.promo?.ad?.id),
    pick(row?.promo_item?.ad_id),
    pick(row?.promo_item?.promo_id),
    pick(row?.promo?.id),
    pick(row?.promo_id),
    pick(row?.ad_id),
  ].filter((v) => Number.isFinite(v) && v > 0);
  return cand[0] ?? null;
};

// +++ Tambah helper normalisasi URL media +++
const toAbsMediaUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();
  if (!s) return null;
  // absolute?
  if (/^https?:\/\//i.test(s)) return s;
  // hilangkan leading slash
  s = s.replace(/^\/+/, '');
  // handle api/storage
  s = s.replace(/^api\/storage\//i, 'storage/');
  // jika sudah storage/ → gabungkan dengan base
  if (/^storage\//i.test(s)) return `${apiUrl}/${s}`;
  // jika path folder file storage laravel → prefiks storage/
  if (/^(ads|promos|uploads|images|files|banners)\//i.test(s)) {
    return `${apiUrl}/storage/${s}`;
  }
  // fallback
  return `${apiUrl}/${s}`;
};

// === Helper konsisten ambil expired_at item (voucher/promo) ===
const getExpiredAt = (item) => {
  if (!item) return null;
  // Voucher: prioritas expired_at (hasil perhitungan claimed_at + ad_limit), fallback ke valid_until
  if (item?.type === 'voucher' || item?.voucher) {
    return item?.expired_at || item?.voucher?.valid_until || null;
  }
  // Promo: expired_at dari mapping
  return item?.expired_at || null;
};

const isExpiredItem = (item) => {
  const ea = getExpiredAt(item);
  return ea ? new Date(ea) < new Date() : false;
};

export default function Save() {
  const router = useRouter();
  const [modalValidation, setModalValidation] = useState(false);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState({ data: [] });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State untuk validasi
  const [validationCode, setValidationCode] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);
  const [showValidationSuccess, setShowValidationSuccess] = useState(false);
  const [showValidationFailed, setShowValidationFailed] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // === currentUserId dari token (sekadar pengaman ekstra saat filter FE) ===
  const currentUserId = useMemo(() => {
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : null;
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id || payload.id || null;
    } catch {
      return null;
    }
  }, []);

  // Ambil data saku: HANYA untuk user saat ini
  const fetchData = useCallback(async () => {
    const controller = new AbortController();

    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';

      if (!token) {
        console.warn('No token found, cannot fetch user-specific data');
        setData({ data: [] });
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Ambil data user-scoped (BUKAN admin/global) dengan cache busting dan filter user
      const timestamp = Date.now();

      const [promoRes, voucherRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/admin/promo-items?user_scope=true&_t=${timestamp}`, {
          headers,
          signal: controller.signal,
        }),
        fetch(`${apiUrl}/api/vouchers/voucher-items?user_scope=true&_t=${timestamp}`, {
          headers,
          signal: controller.signal,
        }),
      ]);

      let allItems = [];

      // === PROMO ITEMS (untuk user) ===
      if (promoRes.status === 'fulfilled' && promoRes.value.ok) {
        const promoJson = await promoRes.value.json().catch(() => ({}));
        const rows = Array.isArray(promoJson) ? promoJson : promoJson?.data || [];

        // Filter tambahan (aman) → pastikan hanya item milik current user
        const userFilteredRows = rows.filter(
          (it) => !currentUserId || String(it.user_id) === String(currentUserId)
        );

        // === PROMO ITEMS mapping (async karena bisa fetch meta)
        const mapped = await Promise.all(userFilteredRows.map(async (it) => {
          // Fetch detail promo-item untuk mendapat ID ads/promo yang tepat
          let detailedItem = it;
          let actualAdId = null;

          try {
            const detailRes = await fetch(`${apiUrl}/api/admin/promo-items/${it.id}`, {
              headers,
              signal: controller.signal,
            });

            if (detailRes.ok) {
              const detailData = await detailRes.json();
              detailedItem = detailData?.data || detailData || it;

              // Coba ambil ID dari berbagai sumber di detail response
              actualAdId =
                detailedItem?.ad?.id ||
                detailedItem?.promo?.ad?.id ||
                detailedItem?.ad_id ||
                detailedItem?.promo_id ||
                it.promo_id;

              // CRITICAL: Cek apakah ada cube_id yang bisa kita gunakan untuk fetch ads yang benar
              const cubeId = detailedItem?.cube_id || it?.cube_id ||
                detailedItem?.promo?.cube_id || it?.promo?.cube_id ||
                detailedItem?.ad?.cube_id || it?.ad?.cube_id;

              console.log('✅ Detail promo-item fetched:', {
                promo_item_id: it.id,
                original_promo_id: it.promo_id,
                cube_id: cubeId,
                detail_ad_id: detailedItem?.ad?.id,
                detail_promo_ad_id: detailedItem?.promo?.ad?.id,
                resolved_actual_ad_id: actualAdId,
                detail_response: detailedItem
              });

              // WORKAROUND: Jika ada cube_id, coba fetch cube untuk mendapat ads yang benar
              if (cubeId) {
                try {
                  const cubeRes = await fetch(`${apiUrl}/api/cubes/${cubeId}`, {
                    headers,
                    signal: controller.signal,
                  });

                  if (cubeRes.ok) {
                    const cubeData = await cubeRes.json();
                    const cube = cubeData?.data || cubeData;

                    // Ambil ads dari cube
                    const cubeAds = cube?.ads || cube?.ad;
                    const cubeAdId = Array.isArray(cubeAds)
                      ? cubeAds.find(a => a.id)?.id // ambil ads pertama yang ada
                      : cubeAds?.id;

                    if (cubeAdId) {
                      actualAdId = cubeAdId;
                      console.log('🎯 FOUND CORRECT ID FROM CUBE:', {
                        promo_item_id: it.id,
                        wrong_promo_id: it.promo_id,
                        correct_ad_id_from_cube: cubeAdId,
                        cube_data: cube
                      });
                    }
                  }
                } catch (cubeErr) {
                  console.warn(`Failed to fetch cube ${cubeId}:`, cubeErr);
                }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch detail for promo-item ${it.id}:`, err);
            // Fallback ke data original
            actualAdId = it.promo?.id || it.ad?.id || it.promo_id;
          }

          // Debug payload dari backend - cari SEMUA kemungkinan field yang berisi ID
          console.log('🔍 Saku promo-item raw payload:', {
            promo_item_id: it.id,
            promo_id: it.promo_id,
            ad_id: it.ad_id,
            cube_id: it.cube_id || it.promo?.cube_id || it.ad?.cube_id,
            actual_ad_id_resolved: actualAdId,
            has_promo_object: !!it.promo,
            has_ad_object: !!it.ad,
            promo_object_id: it.promo?.id,
            ad_object_id: it.ad?.id,
            // Cek nested cube
            promo_cube_id: it.promo?.cube?.id,
            promo_cube_ad_id: it.promo?.cube?.ad_id,
            ad_cube_id: it.ad?.cube?.id,
            ad_cube_ad_id: it.ad?.cube?.ad_id,
            // Cek semua key yang mengandung 'id'
            all_keys: Object.keys(it),
            full_item: it
          });

          const adFromDetail = detailedItem?.ad || detailedItem?.promo?.ad || it?.ad || it?.promo?.ad || {};
          const ad = { ...adFromDetail };
          const claimedAt = it.created_at || it.reserved_at || null;

          // ✅ ambil limit dari field yang benar (prioritas: it.ad_limit, it.promo?.validation_time_limit, ad.validation_time_limit)
          const limitStr =
            it.ad_limit ??
            it?.promo?.validation_time_limit ??
            ad?.validation_time_limit ??
            null;

          // minimal meta object only contains validation_time_limit when available
          const meta = limitStr ? { validation_time_limit: limitStr } : {};

          // ⛔️ jangan fetch /api/ads using promo_id — expired_at must be derived from claimedAt + validation_time_limit
          const expiredAt = resolvePromoExpiry(meta, claimedAt, it.expires_at || null);

          // Resolve ad id for debugging (uses only ad_id/ad.id per resolveAdId)
          const adIdResolved = resolveAdId(it);

          // Pastikan ad.id menggunakan nilai yang benar (utamakan detail.ad.id / detail.promo.ad.id)
          // Jangan set dari promo.id (nama promo sering rancu)
          const correctAdId =
            adFromDetail?.id ||
            detailedItem?.ad?.id ||
            detailedItem?.promo?.ad?.id ||
            it?.ad_id ||
            null;

          // DEBUG: tunjukkan sumber limit dan hasilnya (sertakan resolver info)
          // eslint-disable-next-line no-console
          console.log('🧪Saku limit check', {
            ad_id: adIdResolved,
            actualAdId,
            correctAdId,
            raw: {
              promo_item_id: it?.id,
              promo_id_col: it?.promo_id,
              ad_id_col: it?.ad_id,
              ad_id_in_object: ad?.id,
            },
            sources: {
              from_promo_object: it?.promo?.id,
              from_ad_object: it?.ad?.id,
              direct_promo_id: it?.promo_id,
              direct_ad_id: it?.ad_id,
            },
            resolution: actualAdId ? 'using actualAdId (from detail API)' :
              ad.id ? 'using ad.id' :
                it.promo_id ? 'using promo_id' :
                  'using ad_id (fallback)',
            claimedAt,
            limit: meta?.validation_time_limit,
            expiredAt,
          });

          return {
            id: it.id,
            type: 'promo',
            code: it.code,
            claimed_at: claimedAt,
            expired_at: expiredAt,
            validated_at: it.redeemed_at || null,
            validation_type: ad.validation_type || it.validation_type || 'auto',
            user_id: it.user_id,
            promo_id: correctAdId, // tambahkan field promo_id di top level
            ad_id: it.ad_id || null,  // simpan juga ad_id mentah untuk tracking
            promo_item: {
              id: it.id, code: it.code, user_id: it.user_id,
              promo_id: correctAdId,
              status: it.status || 'available',
              redeemed_at: it.redeemed_at, reserved_at: it.reserved_at,
            },
            voucher_item: null,
            voucher: null,
            ad: {
              id: correctAdId,      // ← ini kunci: pakai ad.id yang benar
              title: ad.title || ad.name || 'Promo',
              picture_source:
                toAbsMediaUrl([ad.picture_source, ad.image_1, ad.image_2, ad.image_3, ad.image]
                  .find(u => u && String(u).trim() !== '')) || '/default-avatar.png',
              status: ad.status || 'active',
              description: ad.description,
              validation_type: ad.validation_type || it.validation_type || 'auto',
              owner_name: ad.owner_name || ad?.cube?.user?.name || ad?.cube?.corporate?.name || 'Merchant',
              owner_contact: ad.owner_contact || ad?.cube?.user?.phone || ad?.cube?.corporate?.phone || '',
              cube: {
                community_id: ad.community_id || ad?.cube?.community_id || 1,
                user: { name: ad?.cube?.user?.name || 'Merchant', phone: ad?.cube?.user?.phone || '' },
                corporate: ad?.cube?.corporate || null,
                tags: [{
                  address: ad.location || ad?.cube?.tags?.[0]?.address || '',
                  link: ad?.cube?.tags?.[0]?.link || null,
                  map_lat: ad?.cube?.tags?.[0]?.map_lat || null,
                  map_lng: ad?.cube?.tags?.[0]?.map_lng || null,
                }],
              },
            },
          };
        }));

        allItems = allItems.concat(mapped);
      }

      // === VOUCHER ITEMS (untuk user) ===
      if (voucherRes.status === 'fulfilled' && voucherRes.value.ok) {
        const voucherJson = await voucherRes.value.json().catch(() => ({}));
        const rows = Array.isArray(voucherJson) ? voucherJson : voucherJson?.data || [];

        // Filter tambahan (aman) → pastikan hanya item milik current user
        const userFilteredRows = rows.filter(
          (it) => !currentUserId || String(it.user_id) === String(currentUserId)
        );

        // VOUCHER ITEMS: pakai ad_limit dari BE untuk expired_at (fallback ke valid_until)
        const mapped = userFilteredRows.map((it) => {
          const voucher = it.voucher || {};
          const validation_type = voucher.validation_type || it.validation_type || 'auto';

          // Hitung expired_at: claimed_at + ad_limit; fallback ke voucher.valid_until
          const expiredAt = resolvePromoExpiry(
            { validation_time_limit: it.ad_limit },          // <- dari BE (HH:mm:ss / 90m / 2h / angka=menit)
            it.created_at,                                   // claimed_at
            voucher.valid_until || null                      // fallback jika tidak ada limit
          );

          // Gambar
          const imgCandidates = [voucher.image, voucher.image_1, voucher.image_2, voucher.image_3];
          const picture =
            toAbsMediaUrl(imgCandidates.find((u) => u && String(u).trim() !== '')) || '/default-avatar.png';

          const usedAt = it.used_at || null;

          return {
            id: it.id,
            type: 'voucher',
            code: it.code,
            claimed_at: it.created_at,
            expired_at: expiredAt,                            // <- now uses ad_limit
            validated_at: usedAt,
            validation_type,
            user_id: it.user_id,
            voucher_item: {
              id: it.id,
              code: it.code,
              user_id: it.user_id,
              voucher_id: it.voucher_id,
              used_at: usedAt,
            },
            voucher,
            // sisipkan info ad minimal (optional)
            ad: {
              id: it.ad_id || voucher.id,                    // ad_id dari BE bila ada
              title: voucher.name || voucher.title || 'Voucher',
              picture_source: picture,
              status: 'active',
              description: voucher.description,
              type: voucher.type,
              tenant_location: voucher.tenant_location,
              delivery: voucher.delivery,
              stock: voucher.stock,
              community: voucher.community,
              validation_type,
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
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Polling khusus QR (validation_type !== 'manual') saat modal terbuka
  useEffect(() => {
    if (!modalValidation || !selected) return;
    const vt = getValidationType(selected);
    const isManual = vt === 'manual';
    if (isManual) return;

    // Skip polling saat tab tidak aktif untuk hemat beban
    let intervalId = null;
    const tick = () => {
      if (document.hidden) return;
      setRefreshTrigger((p) => p + 1);
    };

    // Poll tiap 3 detik
    intervalId = setInterval(tick, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [modalValidation, selected]);

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

  useEffect(() => {
    if (!modalValidation || !selected) return;
    const vt = getValidationType(selected);
    const isManual = vt === 'manual'; // hanya QR yang auto-redirect
    if (isManual) return;

    const selVoucherId = selected?.voucher_item?.id;
    const selPromoId = selected?.promo_item?.id;

    // Cari item yang sama di state terbaru
    const found = (data?.data || []).find((it) => {
      if (selVoucherId) return String(it?.voucher_item?.id) === String(selVoucherId);
      if (selPromoId) return String(it?.promo_item?.id) === String(selPromoId);
      return false;
    });

    // Jika ditemukan & sudah validated → redirect
    if (found && isItemValidated(found)) {
      setModalValidation(false);
      setSelected(null);
      router.replace('/app/riwayat-validasi');
      return;
    }

    // Jika tidak ditemukan lagi → anggap sudah diproses (BE bisa menghapus dari saku)
    if (!found) {
      setModalValidation(false);
      setSelected(null);
      router.replace('/app/riwayat-validasi');
    }
  }, [data, modalValidation, selected, router]);

  // ====== Helpers ======
  const isItemValidatable = (item) => {
    if (!item) return false;
    // VOUCHER: cek used_at
    // PROMO: cek redeemed_at/status
    const isValidated =
      item?.validated_at ||
      (item?.type === 'voucher' && item?.voucher_item?.used_at) ||
      item?.voucher_item?.used_at ||
      (item?.type === 'voucher' && item?.used_at) ||
      (item?.type === 'promo' && item?.promo_item?.redeemed_at) ||
      item?.promo_item?.redeemed_at ||
      item?.redeemed_at ||
      item?.promo_item?.status === 'redeemed' ||
      (item?.status === 'redeemed' && (item?.type === 'promo' || item?.ad));

    if (isValidated) return false;

    // kadaluwarsa? stop (gunakan helper konsisten)
    if (isExpiredItem(item)) return false;

    if (item?.type === 'voucher' || item?.voucher) {
      if (item?.voucher_item) return true;
      const voucher = item?.voucher || item?.ad;
      const hasStock = voucher?.stock === undefined || voucher?.stock > 0;
      const isVoucherActive = voucher?.status !== 'inactive' && voucher?.status !== 'disabled';
      return hasStock && isVoucherActive;
    }

    const promo = item?.ad;
    const isPromoActive =
      promo?.status === 'active' || promo?.status === 'available' || (!promo?.status && promo?.id);
    const hasPromoStock = promo?.stock === undefined || promo?.stock > 0;

    return isPromoActive && hasPromoStock;
  };

  // Cek status validated pada item (voucher/promo)
  const isItemValidated = (item) => {
    if (!item) return false;
    return Boolean(
      item?.validated_at ||
      // Voucher
      item?.voucher_item?.used_at ||
      (item?.type === 'voucher' && (item?.used_at || item?.status === 'used')) ||
      // Promo
      item?.promo_item?.redeemed_at ||
      (item?.type === 'promo' && item?.promo_item?.status === 'redeemed') ||
      // Fallback
      item?.promo_item?.status === 'redeemed' ||
      item?.status === 'redeemed'
    );
  };

  const getTimeRemaining = (expiredAt) => {
    if (!expiredAt) return null;

    const now = moment();
    const end = moment(expiredAt);
    let ms = end.diff(now);

    if (ms <= 0) return 'Sudah kedaluwarsa';

    const dur = moment.duration(ms);

    // Hari & minggu
    const days = Math.floor(dur.asDays());
    if (days >= 7) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 minggu lagi' : `${weeks} minggu lagi`;
    }
    if (days >= 1) {
      const remHours = Math.floor(dur.asHours()) % 24;
      return remHours ? `${days} hari ${remHours} jam lagi` : `${days} hari lagi`;
    }

    // < 24 jam → tampilkan jam + menit
    const hours = Math.floor(dur.asHours());
    const minutes = Math.floor(dur.asMinutes()) % 60;
    if (hours > 0) return `${hours} jam ${minutes} menit lagi`;

    // < 1 jam → menit + detik
    const mins = Math.floor(dur.asMinutes());
    const secs = Math.floor(dur.asSeconds()) % 60;
    if (mins > 0) return `${mins} menit ${secs} detik lagi`;

    return `${secs} detik lagi`;
  };

  const isRecentlyClaimed = (claimedAt) => {
    if (!claimedAt) return false;
    const now = moment();
    const claimed = moment(claimedAt);
    return now.diff(claimed, 'hours') < 1;
  };

  const getStatusBadge = (item) => {
    const isValidated =
      item?.validated_at ||
      (item?.type === 'voucher' && item?.voucher_item?.used_at) ||
      item?.voucher_item?.used_at ||
      (item?.type === 'voucher' && item?.used_at) ||
      (item?.type === 'promo' && item?.promo_item?.redeemed_at) ||
      item?.promo_item?.redeemed_at ||
      item?.redeemed_at ||
      item?.promo_item?.status === 'redeemed' ||
      (item?.status === 'redeemed' && (item?.type === 'promo' || item?.ad));

    if (isValidated) {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faCheckCircle} className="text-success text-xs" />
          <span className="font-medium text-success bg-green-50 px-2 py-1 rounded-full text-xs">
            Sudah divalidasi
          </span>
        </div>
      );
    }

    const isExpired = isExpiredItem(item);

    if (isExpired) {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faTimesCircle} className="text-danger text-xs" />
          <span className="font-medium text-danger bg-red-50 px-2 py-1 rounded-full text-xs">
            {item?.type === 'voucher' ? 'Voucher' : 'Promo'} Kadaluwarsa
          </span>
        </div>
      );
    }

    if (item?.type === 'voucher' || item?.voucher) {
      const voucher = item?.voucher || item?.ad;
      const hasStock = voucher?.stock === undefined || voucher?.stock > 0;
      const isVoucherActive = voucher?.status !== 'inactive' && voucher?.status !== 'disabled';

      if (!hasStock || !isVoucherActive) {
        return (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faTimesCircle} className="text-danger text-xs" />
            <span className="font-medium text-danger bg-red-50 px-2 py-1 rounded-full text-xs">
              {!hasStock ? 'Voucher Habis' : 'Voucher Tidak Tersedia'}
            </span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning text-xs" />
          <span className="font-medium text-warning bg-yellow-50 px-2 py-1 rounded-full text-xs">
            Belum divalidasi
          </span>
        </div>
      );
    }

    const promo = item?.ad;
    const isPromoActive =
      promo?.status === 'active' || promo?.status === 'available' || (!promo?.status && promo?.id);

    const hasPromoStock = promo?.stock === undefined || promo?.stock > 0;

    if (!isPromoActive || !hasPromoStock) {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faTimesCircle} className="text-danger text-xs" />
          <span className="font-medium text-danger bg-red-50 px-2 py-1 rounded-full text-xs">
            {!hasPromoStock ? 'Promo Habis' : 'Promo Ditutup'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning text-xs" />
        <span className="font-medium text-warning bg-yellow-50 px-2 py-1 rounded-full text-xs">
          Belum divalidasi
        </span>
      </div>
    );
  };

  // Helper: baca jenis validasi
  const getValidationType = (item) =>
    item?.validation_type || item?.voucher?.validation_type || item?.ad?.validation_type || 'auto';

  // Submit validasi (manual oleh pemilik di modal)
  const submitValidation = async (valCode) => {
    const codeToValidate = (valCode || '').trim();

    if (!codeToValidate) {
      setValidationMessage('Kode unik wajib diisi.');
      setShowValidationFailed(true);
      return;
    }

    setValidationLoading(true);
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : null;

      if (!token) {
        setValidationMessage('Sesi login telah berakhir. Silakan login kembali.');
        setShowValidationFailed(true);
        setValidationLoading(false);
        return;
      }

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const isPromoItem =
        !!(selected?.promo || selected?.promo_id || selected?.promo_item || selected?.type === 'promo');
      const isVoucherItem =
        !!(selected?.voucher || selected?.voucher_id || selected?.voucher_item || selected?.type === 'voucher');

      let res, result;

      if (isPromoItem) {
        // harus pakai promo_item.id (bukan ad.id)
        const targetId = selected?.promo_item?.id;
        if (!targetId) {
          setValidationMessage('Promo tidak valid atau tidak ditemukan.');
          setShowValidationFailed(true);
          setValidationLoading(false);
          return;
        }

        let url = `${apiUrl}/api/promos/validate`;
        res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: codeToValidate.trim(),
            item_id: targetId,
            item_owner_id: selected?.promo_item?.user_id,
            expected_type: 'promo',
            validation_purpose: 'manual_input',
          }),
        });
        result = await res.json().catch(() => null);
      } else if (isVoucherItem) {
        // harus pakai voucher_item.id (bukan voucher/ad.id)
        const targetId = selected?.voucher_item?.id;
        if (!targetId) {
          setValidationMessage('Voucher tidak valid atau tidak ditemukan.');
          setShowValidationFailed(true);
          setValidationLoading(false);
          return;
        }

        res = await fetch(`${apiUrl}/api/vouchers/validate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: codeToValidate.trim(),
            item_id: targetId,
            item_owner_id: selected?.voucher_item?.user_id,
            expected_type: 'voucher',
            validation_purpose: 'manual_input',
          }),
        });
        result = await res.json().catch(() => null);
      } else {
        setValidationMessage('Item tidak dikenali.');
        setShowValidationFailed(true);
        setValidationLoading(false);
        return;
      }

      // ✅ FIXED: Handle response berdasarkan success flag dari backend
      if (res && res.ok && result?.success) {
        // Backend return success: true - validasi berhasil atau sudah divalidasi sebelumnya
        const msg = result?.message || '';

        if (msg.toLowerCase().includes('sudah') && msg.toLowerCase().includes('sebelum')) {
          // Case: sudah divalidasi sebelumnya
          setValidationMessage(`${selected?.type === 'voucher' ? 'Voucher' : 'Promo'} dengan kode "${codeToValidate}" sudah pernah divalidasi sebelumnya.`);
          setShowValidationFailed(true);
        } else {
          // Case: validasi berhasil baru
          setValidationMessage('Berhasil divalidasi.');
          setShowValidationSuccess(true);

          // Update local state untuk UX cepat
          if (selected) {
            const now = new Date().toISOString();
            setData((prev) => ({
              ...prev,
              data: prev.data.map((it) => {
                const sameItem =
                  it.promo_item?.id === selected?.promo_item?.id ||
                  it.voucher_item?.id === selected?.voucher_item?.id;
                if (!sameItem) return it;

                if (it.type === 'promo' && it.promo_item) {
                  return {
                    ...it,
                    validated_at: now,
                    promo_item: { ...it.promo_item, redeemed_at: now, status: 'redeemed' },
                  };
                }
                if (it.type === 'voucher' && it.voucher_item) {
                  return {
                    ...it,
                    validated_at: now,
                    voucher_item: { ...it.voucher_item, used_at: now },
                  };
                }
                return { ...it, validated_at: now };
              }),
            }));
          }

          // Refresh dari server
          setTimeout(() => {
            setRefreshTrigger((p) => p + 1);
            fetchData();
          }, 100);
        }
        setValidationCode('');
      } else {
        // ✅ FIXED: Handle response berdasarkan success flag dan status code
        const msg = (result?.message || '').toString();
        let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';

        // Check jika backend return success: false dengan pesan khusus
        if (result?.success === false) {
          if (msg.toLowerCase().includes('sudah') && (msg.toLowerCase().includes('divalidasi') || msg.toLowerCase().includes('digunakan'))) {
            errorMessage = `${selected?.type === 'voucher' ? 'Voucher' : 'Promo'} dengan kode "${codeToValidate}" sudah pernah divalidasi sebelumnya.`;
          } else if (msg.toLowerCase().includes('tidak ditemukan') || msg.toLowerCase().includes('not found')) {
            errorMessage = `${selected?.type === 'voucher' ? 'Voucher' : 'Promo'} dengan kode "${codeToValidate}" tidak ditemukan.`;
          } else if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('kedaluwarsa')) {
            errorMessage = `${selected?.type === 'voucher' ? 'Voucher' : 'Promo'} dengan kode "${codeToValidate}" sudah kedaluwarsa.`;
          } else {
            errorMessage = result?.message || 'Validasi gagal. Silakan periksa kode Anda.';
          }
        } else {
          // Handle berdasarkan HTTP status code untuk kasus lain
          if (res?.status === 409) {
            errorMessage = /stok/i.test(msg) ? 'Stok promo habis.' : 'Kode unik sudah pernah divalidasi.';
          } else if (res?.status === 404) {
            errorMessage = `${selected?.type === 'voucher' ? 'Voucher' : 'Promo'} dengan kode "${codeToValidate}" tidak ditemukan.`;
          } else if (res?.status === 422) {
            errorMessage = result?.message || 'Kode unik tidak valid atau format salah.';
          } else if (res?.status === 400) {
            if (msg.toLowerCase().includes('sudah') || msg.toLowerCase().includes('digunakan') || msg.toLowerCase().includes('already')) {
              errorMessage = `${selected?.type === 'voucher' ? 'Voucher' : 'Promo'} dengan kode "${codeToValidate}" sudah pernah divalidasi sebelumnya.`;
            } else {
              errorMessage = result?.message || 'Kode unik tidak valid.';
            }
          } else {
            errorMessage = result?.message || 'Terjadi kesalahan saat validasi.';
          }
        }

        setValidationMessage(errorMessage);
        setShowValidationFailed(true);
      }
    } catch (e) {
      console.error('Validation error:', e);
      setValidationMessage('Terjadi kesalahan. Silakan coba lagi.');
      setShowValidationFailed(true);
    } finally {
      setValidationLoading(false);
    }
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
                {data?.data?.map((item, key) => {
                  const canValidate = !item?.validated_at && isItemValidatable(item);

                  return (
                    <div
                      className={`bg-white rounded-2xl p-4 shadow-lg border transition-all duration-300 group ${isRecentlyClaimed(item.claimed_at) ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-white' : 'border-slate-100'
                        } ${canValidate ? 'hover:shadow-xl cursor-pointer' : 'opacity-75 cursor-default'}`}
                      key={key}
                      onClick={() => {
                        if (canValidate) {
                          console.log('🎯 KLIK ITEM SAKU:', {
                            item_id: item?.id,
                            type: item?.type,
                            promo_id: item?.promo_id,
                            ad_id: item?.ad_id,
                            ad_object_id: item?.ad?.id,
                            promo_item: item?.promo_item,
                            title: item?.ad?.title || item?.name,
                            FULL_ITEM: item
                          });
                          setModalValidation(true);
                          setSelected(item);
                        }
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
                      {item.validated_at && (
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
                              imageSource = item?.voucher?.image
                                ? `${base}/storage/${item.voucher.image}`
                                : item?.ad?.picture_source;
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
                          {getExpiredAt(item) && (
                            <div className="flex items-center gap-1 text-xs">
                              <FontAwesomeIcon icon={faClock} className="text-red-500" />
                              <span className="text-red-600 font-medium">{getTimeRemaining(getExpiredAt(item))}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
        title={
          selected?.voucher_item || selected?.type === 'voucher' || selected?.voucher
            ? 'Detail Voucher'
            : 'Detail Promo'
        }
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
                    {selected?.voucher_item || selected?.type === 'voucher' || selected?.voucher
                      ? 'Voucher'
                      : 'Promo'}
                  </span>
                </div>
              </div>

              {/* Perbaiki urutan sumber id untuk detail dengan logging debug */}
              {(() => {
                const ad = selected?.ad;
                const normBool = (v) => {
                  if (v === true || v === 1) return true;
                  if (typeof v === 'string') {
                    const s = v.trim().toLowerCase();
                    return ['1', 'true', 'y', 'yes', 'ya', 'iya', 'on'].includes(s);
                  }
                  return !!v;
                };
                const contentType = String(ad?.cube?.content_type || ad?.content_type || '').toLowerCase();
                const typeStr = String(ad?.type || ad?.cube?.type || '').toLowerCase();
                const isInformation =
                  normBool(ad?.cube?.is_information) ||
                  normBool(ad?.is_information) ||
                  contentType === 'information' ||
                  contentType === 'kubus-informasi' ||
                  typeStr === 'information' ||
                  typeStr === 'informasi';

                if (isInformation) {
                  const code = ad?.cube?.code || ad?.code;
                  const href = code ? `/app/kubus-informasi/kubus-infor?code=${encodeURIComponent(code)}` : '#';
                  console.debug('saku: detail render (information)', { selected, ad, href });
                  return (
                    <Link href={href}>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-3 py-2 rounded-full hover:bg-primary/20 transition-colors" onClick={() => console.debug('saku: detail click (information)', { selected, ad, href })}>
                        Detail
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                      </div>
                    </Link>
                  );
                }

                // Untuk voucher: gunakan resolveAdId
                if (selected?.type === 'voucher' || selected?.voucher_item || selected?.voucher) {
                  const href = `/app/komunitas/promo/${resolveAdId(selected)}?source=home&from=saku&claimed=true`;
                  console.debug('saku: detail render (voucher)', { selected, ad, href, resolvedPromoId: resolveAdId(selected) });
                  return (
                    <Link href={href}>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-3 py-2 rounded-full hover:bg-primary/20 transition-colors" onClick={() => console.debug('saku: detail click (voucher)', { selected, ad, href, resolvedPromoId: resolveAdId(selected) })}>
                        Detail
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                      </div>
                    </Link>
                  );
                }

                // Untuk promo: resolve id secara konsisten.
                // Prioritas yang lebih aman berdasarkan temuan debug:
                // 1) ad?.id (nested object, paling akurat)
                // 2) selected?.promo?.ad?.id (promo object that points to ad)
                // 3) selected?.promo_item?.ad_id (item-level ad reference)
                // 4) selected?.promo_item?.promo_id (fallback raw promo_id on item, can be wrong)
                // 5) selected?.promo_id (legacy)
                // 6) selected?.ad_id (last resort)
                const resolvedPromoId =
                  ad?.id ||
                  selected?.promo?.ad?.id ||
                  selected?.promo_item?.ad_id ||
                  selected?.promo_item?.promo_id ||
                  selected?.promo_id ||
                  selected?.ad_id ||
                  null;
                // Gunakan format URL yang sama seperti voucher (?source=home)
                const href = resolvedPromoId
                  ? `/app/komunitas/promo/${resolvedPromoId}?source=home&from=saku&claimed=true`
                  : '#';

                // Render button yang melakukan navigation programatik (lebih mudah dilacak)
                console.debug('saku: detail render (promo)', {
                  resolvedPromoId,
                  href,
                  id_sources: {
                    ad_id_object: ad?.id,
                    promo_item_promo_id: selected?.promo_item?.promo_id,
                    selected_promo_id: selected?.promo_id,
                    selected_ad_id: selected?.ad_id,
                  },
                  selected,
                  ad
                });
                return (
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-3 py-2 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                    onClick={() => {
                      // Debug: print all candidate id fields so we can trace which source is used
                      const debugIds = {
                        selected_id: selected?.id ?? null,
                        selected_ad_id_field: selected?.ad_id ?? null,
                        selected_ad_id_object: selected?.ad?.id ?? null,
                        selected_promo_item_id: selected?.promo_item?.id ?? null,
                        selected_promo_item_promo_id: selected?.promo_item?.promo_id ?? null,
                        selected_promo_id_field: selected?.promo_id ?? null,
                        resolvedPromoId,
                        resolutionSource: ad?.id ? 'ad.id' :
                          selected?.promo_item?.promo_id ? 'promo_item.promo_id' :
                            selected?.promo_id ? 'promo_id' :
                              selected?.ad_id ? 'ad_id (fallback)' : 'none',
                        href,
                      };
                      console.debug('saku: detail click (promo) - ids', debugIds);
                      console.debug('saku: detail click (promo) - full selected object', selected);
                      try {
                        if (!resolvedPromoId) return;
                        router.push(href);
                      } catch (e) {
                        console.error('Navigation error (promo detail):', e, { href, resolvedPromoId });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        try {
                          if (!resolvedPromoId) return;
                          router.push(href);
                        } catch (err) {
                          console.error('Navigation error (promo detail):', err, { href, resolvedPromoId });
                        }
                      }
                    }}
                  >
                    Detail
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                  </div>
                );
              })()}
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
                      return (
                        selected?.voucher?.community?.name ||
                        selected?.ad?.community?.name ||
                        selected?.ad?.cube?.user?.name ||
                        'Merchant'
                      );
                    }
                    return (
                      selected?.ad?.owner_name ||
                      selected?.ad?.cube?.user?.name ||
                      selected?.ad?.cube?.corporate?.name ||
                      '-'
                    );
                  })()}
                </span>
              </div>
              {/* Nomor telp hanya untuk promo */}
              {!(selected?.type === 'voucher' || selected?.voucher_item || selected?.voucher) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">No. Telepon</span>
                  <span className="text-slate-800 font-medium text-sm">
                    {selected?.ad?.owner_contact ||
                      selected?.ad?.cube?.user?.phone ||
                      selected?.ad?.cube?.corporate?.phone ||
                      '-'}
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
                    <p className="text-slate-800 text-sm font-medium truncate">
                      {selected?.ad?.cube?.tags?.at(0)?.link}
                    </p>
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
          {(() => {
            // Status validasi pakai field backend yang benar
            const isValidated =
              selected?.validated_at ||
              (selected?.type === 'voucher' && selected?.voucher_item?.used_at) ||
              (selected?.type === 'promo' && selected?.promo_item?.redeemed_at) ||
              selected?.voucher_item?.status === 'used' ||
              selected?.promo_item?.status === 'redeemed';

            if (isValidated) {
              return (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl py-8">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl mb-3" />
                    <div className="font-bold text-green-700 text-lg">
                      {selected?.voucher_item || selected?.type === 'voucher' || selected?.voucher
                        ? 'Voucher Telah Digunakan'
                        : 'Promo Telah Digunakan'}
                    </div>
                    <p className="text-green-600 text-sm mt-1">Terima kasih</p>
                  </div>
                </div>
              );
            }

            // Voucher section
            if (selected?.type === 'voucher' || selected?.voucher) {
              const isVoucherExpired = isExpiredItem(selected);

              if (isVoucherExpired) {
                return (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl py-8">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-4xl mb-3" />
                      <div className="font-bold text-red-700 text-lg">Voucher Kadaluwarsa</div>
                      <p className="text-red-600 text-sm mt-1">Tidak bisa divalidasi</p>
                    </div>
                  </div>
                );
              }

              const vt = getValidationType(selected);
              const isManual = vt === 'manual';

              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="text-center">
                    <div className="mb-4">
                      <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                        {isManual ? 'Validasi Kode Voucher' : 'QR Code Voucher'}
                      </span>
                    </div>

                    {/* AUTO → QR; MANUAL → input */}
                    {!isManual ? (
                      <>
                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <QRCodeSVG
                            value={JSON.stringify({
                              code: selected?.voucher_item?.code || selected?.code || 'NO_CODE',
                              type: 'voucher',
                              // ⛔️ JANGAN pakai fallback selain voucher_item.id
                              item_id: selected?.voucher_item?.id || null,
                              user_id: selected?.voucher_item?.user_id || null,
                              item_owner_id: selected?.voucher_item?.user_id || null,
                              owner_validation: true,
                              timestamp: Date.now(),
                              validation_purpose: 'tenant_scan',
                              owner_only: false,
                            })}
                            size={180}
                            bgColor="#f8fafc"
                            fgColor="#0f172a"
                            level="H"
                            includeMargin={true}
                            className="mx-auto rounded-lg"
                          />
                        </div>
                        <p className="text-slate-500 text-sm">Tunjukkan QR ini ke merchant untuk dipindai.</p>
                      </>
                    ) : (
                      <div className="space-y-4">
                        {!isItemValidatable(selected) && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />
                              <span className="text-red-700 text-sm font-medium">
                                {selected?.validated_at
                                  ? 'Item ini sudah divalidasi sebelumnya'
                                  : 'Item ini tidak dapat divalidasi (habis, kadaluwarsa, atau ditutup)'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FontAwesomeIcon icon={faGift} className="text-primary text-3xl" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Masukkan Kode Validasi
                          </label>
                          <input
                            type="text"
                            placeholder="Masukkan kode validasi..."
                            value={validationCode}
                            onChange={(e) => setValidationCode(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center text-lg font-mono tracking-wider"
                            disabled={validationLoading}
                          />
                        </div>

                        <button
                          className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 ${validationLoading
                            ? 'bg-slate-400 text-white cursor-not-allowed'
                            : isItemValidatable(selected)
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-xl transform hover:scale-[1.02]'
                              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            }`}
                          onClick={() => {
                            if (isItemValidatable(selected)) {
                              submitValidation(validationCode);
                            }
                          }}
                          disabled={validationLoading || !isItemValidatable(selected)}
                        >
                          {validationLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Memvalidasi...
                            </div>
                          ) : (
                            'Validasi Voucher'
                          )}
                        </button>

                        <p className="text-slate-500 text-xs">Masukkan kode validasi untuk memproses voucher ini</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Promo status aktif?
            if (
              !(
                selected?.ad?.status === 'active' ||
                selected?.ad?.status === 'available' ||
                (!selected?.ad?.status && selected?.ad?.id)
              )
            ) {
              return (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl py-8">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-4xl mb-3" />
                    <div className="font-bold text-red-700 text-lg">Promo Tidak Tersedia</div>
                    <p className="text-red-600 text-sm mt-1">Promo sudah berakhir</p>
                  </div>
                </div>
              );
            }

            // Promo section
            const vt = getValidationType(selected);
            const isManual = vt === 'manual';

            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                      {isManual ? 'Validasi Kode Promo' : 'QR Code Promo'}
                    </span>
                  </div>

                  {!isManual ? (
                    <>
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <QRCodeSVG
                          value={JSON.stringify({
                            code: selected?.promo_item?.code || selected?.code || 'NO_CODE',
                            type: 'promo',
                            // ⛔️ Hanya promo_item.id
                            item_id: selected?.promo_item?.id || null,
                            user_id: selected?.promo_item?.user_id || null,
                            item_owner_id: selected?.promo_item?.user_id || null,
                            owner_validation: true,
                            timestamp: Date.now(),
                            validation_purpose: 'tenant_scan',
                            owner_only: false,
                          })}
                          size={180}
                          bgColor="#f8fafc"
                          fgColor="#0f172a"
                          level="H"
                          includeMargin={true}
                          className="mx-auto rounded-lg"
                        />
                      </div>
                      <p className="text-slate-500 text-sm">Tunjukkan QR ini ke merchant untuk dipindai.</p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {!isItemValidatable(selected) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />
                            <span className="text-red-700 text-sm font-medium">
                              {selected?.validated_at
                                ? 'Item ini sudah divalidasi sebelumnya'
                                : 'Item ini tidak dapat divalidasi (habis, kadaluwarsa, atau ditutup)'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faTag} className="text-primary text-3xl" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Masukkan Kode Validasi
                        </label>
                        <input
                          type="text"
                          placeholder="Masukkan kode validasi..."
                          value={validationCode}
                          onChange={(e) => setValidationCode(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center text-lg font-mono tracking-wider"
                          disabled={validationLoading}
                        />
                      </div>

                      <button
                        className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 ${validationLoading
                          ? 'bg-slate-400 text-white cursor-not-allowed'
                          : isItemValidatable(selected)
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-xl transform hover:scale-[1.02]'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                        onClick={() => {
                          if (isItemValidatable(selected)) {
                            submitValidation(validationCode);
                          }
                        }}
                        disabled={validationLoading || !isItemValidatable(selected)}
                      >
                        {validationLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Memvalidasi...
                          </div>
                        ) : (
                          'Validasi Promo'
                        )}
                      </button>

                      <p className="text-slate-500 text-xs">Masukkan kode validasi untuk memproses promo ini</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </BottomSheetComponent>

      {/* Modal Validasi Berhasil */}
      {showValidationSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Validasi Berhasil!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{validationMessage}</p>
            <button
              onClick={() => {
                setShowValidationSuccess(false);
                setModalValidation(false);
                setSelected(null);
                setValidationCode('');
                // Langsung ke halaman riwayat TANPA query agar ambil semua
                router.replace('/app/riwayat-validasi');
              }}
              className="w-full bg-green-500 text-white py-3 rounded-[12px] font-semibold hover:bg-green-600 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Modal Validasi Gagal */}
      {showValidationFailed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Validasi Gagal</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{validationMessage}</p>
            <button
              onClick={() => {
                setShowValidationFailed(false);
                setValidationCode('');
              }}
              className="w-full bg-red-500 text-white py-3 rounded-[12px] font-semibold hover:bg-red-600 transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </>
  );
}
