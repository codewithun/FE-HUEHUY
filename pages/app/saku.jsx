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
import { useCallback, useEffect, useState } from 'react';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import BottomSheetComponent from '../../components/construct.components/BottomSheetComponent';
import { token_cookie_name } from '../../helpers';
import { Decrypt } from '../../helpers/encryption.helpers';

// Pastikan base URL tanpa /api di akhir
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api$/, '');

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
        fetch(`${apiUrl}/api/admin/promo-items?user_scope=true&_t=${timestamp}`, { headers, signal: controller.signal }),
        fetch(`${apiUrl}/api/vouchers/voucher-items?user_scope=true&_t=${timestamp}`, { headers, signal: controller.signal }),
      ]);

      let allItems = [];

      // === PROMO ITEMS (untuk user) ===
      if (promoRes.status === 'fulfilled' && promoRes.value.ok) {
        const promoJson = await promoRes.value.json().catch(() => ({}));
        const rows = Array.isArray(promoJson) ? promoJson : (promoJson?.data || []);

        // Filter tambahan untuk memastikan hanya data user yang login
        const userFilteredRows = rows.filter(it => {
          // Pastikan item ini milik user yang sedang login
          // Tambahan: validasi dengan token untuk double-check
          return it.user_id || it.owner_id || it.claimed_by;
        });

        const mapped = userFilteredRows.map((it) => {
          const ad = it.promo || it.ad || {};
          const claimedAt = it.created_at || it.claimed_at || it.validated_at || it.claimedAt || null;
          const expiredAt = it.expires_at || it.expired_at || it.expiry || ad.valid_until || null;
          const validatedAt = it.validated_at || it.used_at || it.redeemed_at || it.validation_at || null;

          // tipe validasi (fallback ke 'auto' jika tidak ada)
          const validation_type = ad.validation_type || it.validation_type || 'auto';

          const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
            .replace(/\/api\/?$/, '')
            .replace(/\/$/, '');

          return {
            id: it.id,
            type: 'promo',
            code: it.code || it.qr || it.token || null,
            claimed_at: claimedAt,
            expired_at: expiredAt,
            validated_at: validatedAt,
            validation_type,
            user_id: it.user_id, // Pastikan user_id tetap ada untuk validasi
            promo_item: { 
              id: it.id, 
              code: it.code || it.qr || it.token, 
              user_id: it.user_id, 
              promo_id: it.promo_id || ad.id, 
              validated_at: validatedAt 
            },
            voucher_item: null,
            voucher: null,
            ad: {
              id: ad.id,
              title: ad.title || ad.name || 'Promo',
              picture_source: ad.image ? `${base}/storage/${ad.image}` : (ad.picture_source || '/default-avatar.png'),
              status: ad.status || 'active',
              description: ad.description,
              validation_type,
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

        // Filter tambahan untuk memastikan hanya data user yang login
        const userFilteredRows = rows.filter(it => {
          // Pastikan item ini milik user yang sedang login
          // Tambahan: validasi dengan token untuk double-check
          return it.user_id || it.owner_id || it.claimed_by;
        });

        const mapped = userFilteredRows.map((it) => {
          const voucher = it.voucher || {};
          const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
            .replace(/\/api\/?$/, '')
            .replace(/\/$/, '');

          const validation_type = voucher.validation_type || it.validation_type || 'auto';

          return {
            id: it.id,
            type: 'voucher',
            code: it.code,
            claimed_at: it.created_at,
            expired_at: voucher.valid_until || null,
            validated_at: it.validated_at || it.used_at || null,
            validation_type,
            user_id: it.user_id, // Pastikan user_id tetap ada untuk validasi
            voucher_item: { 
              id: it.id, 
              code: it.code, 
              user_id: it.user_id, 
              voucher_id: it.voucher_id, 
              used_at: it.used_at 
            },
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Auto-refresh saat focus & route change (tanpa localStorage)
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
  const isItemValidatable = (item) => {
    if (item?.validated_at) return false;

    const expiredAt = item?.expired_at || item?.ad?.valid_until || item?.voucher?.valid_until;
    const isExpired = expiredAt && new Date(expiredAt) < new Date();
    if (isExpired) return false;

    if (item?.type === 'voucher' || item?.voucher) {
      if (item?.voucher_item) return true;
      const voucher = item?.voucher || item?.ad;
      const hasStock = voucher?.stock === undefined || voucher?.stock > 0;
      const isVoucherActive = voucher?.status !== 'inactive' && voucher?.status !== 'disabled';
      return hasStock && isVoucherActive;
    }

    const promo = item?.ad;
    const isPromoActive =
      promo?.status === 'active' ||
      promo?.status === 'available' ||
      (!promo?.status && promo?.id);
    const hasPromoStock = promo?.stock === undefined || promo?.stock > 0;

    return isPromoActive && hasPromoStock;
  };

  const getTimeRemaining = (expiredAt) => {
    if (!expiredAt) return null;
    const now = moment();
    const expired = moment(expiredAt);
    const duration = moment.duration(expired.diff(now));

    if (duration.asMilliseconds() <= 0) return 'Sudah kedaluwarsa';

    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours()) % 24;

    if (days > 0) {
      if (days === 1) return '1 hari lagi';
      if (days < 7) return `${days} hari lagi`;
      const weeks = Math.floor(days / 7);
      if (weeks === 1) return '1 minggu lagi';
      if (weeks < 4) return `${weeks} minggu lagi`;
      const months = Math.floor(days / 30);
      return `${months} bulan lagi`;
    }

    if (hours > 0) return `${hours} jam lagi`;

    const minutes = Math.floor(duration.asMinutes());
    if (minutes > 0) return `${minutes} menit lagi`;

    return 'Segera berakhir';
  };

  const isRecentlyClaimed = (claimedAt) => {
    if (!claimedAt) return false;
    const now = moment();
    const claimed = moment(claimedAt);
    return now.diff(claimed, 'hours') < 1;
  };

  const getStatusBadge = (item) => {
    if (item?.validated_at) {
      return (
        <div className="flex items-center gap-1">
          <FontAwesomeIcon icon={faCheckCircle} className="text-success text-xs" />
          <span className="font-medium text-success bg-green-50 px-2 py-1 rounded-full text-xs">Sudah divalidasi</span>
        </div>
      );
    }

    const expiredAt = item?.expired_at || item?.ad?.valid_until || item?.voucher?.valid_until;
    const isExpired = expiredAt && new Date(expiredAt) < new Date();

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
          <span className="font-medium text-warning bg-yellow-50 px-2 py-1 rounded-full text-xs">Belum divalidasi</span>
        </div>
      );
    }

    const promo = item?.ad;
    const isPromoActive =
      promo?.status === 'active' ||
      promo?.status === 'available' ||
      (!promo?.status && promo?.id);

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
        <span className="font-medium text-warning bg-yellow-50 px-2 py-1 rounded-full text-xs">Belum divalidasi</span>
      </div>
    );
  };

  // Helper: baca jenis validasi
  const getValidationType = (item) =>
    item?.validation_type || item?.voucher?.validation_type || item?.ad?.validation_type || 'auto';

  // Submit validasi
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
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const isPromoItem =
        !!(selected?.promo || selected?.promo_id || selected?.promo_item || selected?.type === 'promo');
      const isVoucherItem =
        !!(selected?.voucher || selected?.voucher_id || selected?.voucher_item || selected?.type === 'voucher');

      let res, result;

      if (isPromoItem) {
        // Untuk promo, pastikan validasi dilakukan pada item milik user yang benar
        const targetId = selected?.promo_item?.id || selected?.id;
        const userId = selected?.promo_item?.user_id || selected?.user_id;
        
        if (!targetId) {
          setValidationMessage('Promo tidak valid atau tidak ditemukan.');
          setShowValidationFailed(true);
          setValidationLoading(false);
          return;
        }

        // CRITICAL: Validasi ownership sebelum API call
        // Jangan biarkan tenant validasi promo yang bukan miliknya
        const encryptedToken = Cookies.get(token_cookie_name);
        const currentToken = encryptedToken ? Decrypt(encryptedToken) : null;
        
        let currentUserId = null;
        try {
          if (currentToken) {
            const tokenPayload = JSON.parse(atob(currentToken.split('.')[1]));
            currentUserId = tokenPayload.sub || tokenPayload.user_id || tokenPayload.id;
          }
        } catch (e) {
          console.warn('Cannot decode token for ownership validation');
        }
        
        // Validasi: Jika current user bukan pemilik promo, maka ini adalah validasi oleh tenant
        const isOwner = currentUserId && userId && (currentUserId.toString() === userId.toString());
        
        if (!isOwner) {
          // Ini adalah scan QR oleh tenant - gunakan endpoint yang tersedia di backend
          res = await fetch(`${apiUrl}/api/promos/validate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
              code: codeToValidate,
              tenant_id: currentUserId, // ID tenant yang melakukan validasi
              item_owner_id: userId,    // ID pemilik promo  
              is_tenant_validation: true,
              validation_source: 'qr_scan'
            }),
          });
          result = await res.json().catch(() => null);
        } else {
          // Ini adalah validasi oleh pemilik promo - gunakan endpoint biasa
          res = await fetch(`${apiUrl}/api/admin/promo-items/${targetId}/redeem`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
              code: codeToValidate,
              validate_user: true,
              user_id: userId,
              validation_type: 'owner_self'
            }),
          });
          result = await res.json().catch(() => null);

          // Fallback untuk validasi owner
          if (res.status === 404 || res.status === 405) {
            res = await fetch(`${apiUrl}/api/promos/validate`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ 
                code: codeToValidate,
                promo_item_id: targetId,
                user_id: userId,
                validate_ownership: true,
                validation_type: 'owner_self'
              }),
            });
            result = await res.json().catch(() => null);
          }
        }
      } else if (isVoucherItem) {
        const targetId = selected?.voucher_item?.id || selected?.id;
        const userId = selected?.voucher_item?.user_id || selected?.user_id;
        
        if (!targetId) {
          setValidationMessage('Voucher tidak valid atau tidak ditemukan.');
          setShowValidationFailed(true);
          setValidationLoading(false);
          return;
        }

        // CRITICAL: Validasi ownership sebelum API call untuk voucher
        const encryptedToken = Cookies.get(token_cookie_name);
        const currentToken = encryptedToken ? Decrypt(encryptedToken) : null;
        
        let currentUserId = null;
        try {
          if (currentToken) {
            const tokenPayload = JSON.parse(atob(currentToken.split('.')[1]));
            currentUserId = tokenPayload.sub || tokenPayload.user_id || tokenPayload.id;
          }
        } catch (e) {
          console.warn('Cannot decode token for ownership validation');
        }
        
        // Validasi: Jika current user bukan pemilik voucher, maka ini adalah validasi oleh tenant
        const isOwner = currentUserId && userId && (currentUserId.toString() === userId.toString());
        
        if (!isOwner) {
          // Ini adalah scan QR oleh tenant - gunakan endpoint yang tersedia di backend
          res = await fetch(`${apiUrl}/api/vouchers/validate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
              code: codeToValidate,
              tenant_id: currentUserId, // ID tenant yang melakukan validasi
              item_owner_id: userId,    // ID pemilik voucher
              is_tenant_validation: true,
              validation_source: 'qr_scan'
            }),
          });
          result = await res.json().catch(() => null);
        } else {
          // Ini adalah validasi oleh pemilik voucher - gunakan endpoint biasa
          res = await fetch(`${apiUrl}/api/admin/voucher-items/${targetId}/redeem`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
              code: codeToValidate,
              validate_user: true,
              user_id: userId,
              validation_type: 'owner_self'
            }),
          });
          result = await res.json().catch(() => null);

          // Fallback untuk validasi owner
          if (res.status === 404 || res.status === 405) {
            res = await fetch(`${apiUrl}/api/vouchers/validate`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ 
                code: codeToValidate,
                voucher_item_id: targetId,
                user_id: userId,
                validate_ownership: true,
                validation_type: 'owner_self'
              }),
            });
            result = await res.json().catch(() => null);
          }
        }
      } else {
        setValidationMessage('Item tidak dikenali.');
        setShowValidationFailed(true);
        setValidationLoading(false);
        return;
      }

      if (res && res.ok) {
        setValidationMessage('Berhasil divalidasi.');
        setShowValidationSuccess(true);
        setValidationCode('');
        
        // Update status item di local state dengan validasi yang lebih ketat
        if (selected) {
          const now = new Date().toISOString();
          
          // CRITICAL: Hanya update local state jika user yang login adalah PEMILIK promo/voucher
          // Jangan update jika user adalah tenant yang melakukan scan
          const encryptedToken = Cookies.get(token_cookie_name);
          const currentToken = encryptedToken ? Decrypt(encryptedToken) : null;
          
          // Decode user info dari token untuk memastikan ownership
          let currentUserId = null;
          try {
            if (currentToken) {
              // Ambil user ID dari token jika tersedia dalam payload
              const tokenPayload = JSON.parse(atob(currentToken.split('.')[1]));
              currentUserId = tokenPayload.sub || tokenPayload.user_id || tokenPayload.id;
            }
          } catch (e) {
            console.warn('Cannot decode token for user validation');
          }
          
          // Validasi ownership: hanya update jika current user adalah pemilik item
          const itemOwnerId = selected?.user_id || selected?.promo_item?.user_id || selected?.voucher_item?.user_id;
          const isOwner = currentUserId && itemOwnerId && (currentUserId.toString() === itemOwnerId.toString());
          
          // HANYA update local state jika user adalah pemilik promo/voucher
          if (isOwner) {
            setData((prev) => ({
              ...prev,
              data: prev.data.map((it) => {
                // Pastikan update hanya dilakukan pada item yang sama persis
                if (it.id === selected.id && 
                    ((it.type === selected.type) || 
                     (it.promo_item?.id === selected.promo_item?.id) || 
                     (it.voucher_item?.id === selected.voucher_item?.id))) {
                  
                  // Update untuk promo milik user
                  if (it.type === 'promo' && it.promo_item) {
                    return {
                      ...it,
                      validated_at: now,
                      promo_item: {
                        ...it.promo_item,
                        validated_at: now,
                        validation_date: now
                      }
                    };
                  }
                  // Update untuk voucher milik user
                  else if (it.type === 'voucher' && it.voucher_item) {
                    return {
                      ...it,
                      validated_at: now,
                      voucher_item: {
                        ...it.voucher_item,
                        used_at: now,
                        validation_date: now
                      }
                    };
                  }
                  // Fallback update dengan validasi tambahan
                  return { 
                    ...it, 
                    validated_at: now, 
                    used_at: now, 
                    redeemed_at: now,
                    validation_date: now 
                  };
                }
                return it;
              }),
            }));
            
            console.log('Local state updated for item owner:', itemOwnerId);
          } else {
            console.log('Skipping local state update - current user is not the owner:', {
              currentUserId,
              itemOwnerId,
              isOwner
            });
          }
        }
        
        // ALWAYS refresh data dari server untuk memastikan sinkronisasi
        // Ini penting untuk semua user, bukan hanya pemilik item
        setTimeout(() => {
          setRefreshTrigger((p) => p + 1);
          fetchData(); // Fetch ulang data untuk memastikan status terupdate
        }, 500); // Kurangi delay untuk response yang lebih cepat
      } else {
        const msg = (result?.message || '').toString();
        if (res?.status === 409) {
          setValidationMessage(/stok/i.test(msg) ? 'Stok promo habis.' : 'Kode unik sudah pernah divalidasi.');
        } else if (res?.status === 404) {
          setValidationMessage('Kode unik tidak ditemukan.');
        } else if (res?.status === 422) {
          setValidationMessage(result?.message || 'Kode unik tidak valid atau format salah.');
        } else {
          setValidationMessage('Terjadi kesalahan. Silakan coba lagi.');
        }
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
                      className={`bg-white rounded-2xl p-4 shadow-lg border transition-all duration-300 group ${
                        isRecentlyClaimed(item.claimed_at)
                          ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-white'
                          : 'border-slate-100'
                      } ${
                        canValidate ? 'hover:shadow-xl cursor-pointer' : 'opacity-75 cursor-default'
                      }`}
                      key={key}
                      onClick={() => {
                        if (canValidate) {
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
                          {item?.expired_at && (
                            <div className="flex items-center gap-1 text-xs">
                              <FontAwesomeIcon icon={faClock} className="text-red-500" />
                              <span className="text-red-600 font-medium">{getTimeRemaining(item.expired_at)}</span>
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
                <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-3 py-2 rounded-full hover:bg-primary/20 transition-colors">
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
          {selected?.validated_at ? (
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
          ) : selected?.type === 'voucher' || selected?.voucher ? (
            (() => {
              const voucher = selected?.voucher || selected?.ad;
              const isVoucherExpired = voucher?.valid_until && new Date(voucher.valid_until) < new Date();

              if (isVoucherExpired) {
                return (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl py-8">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-4xl mb-3" />
                      <div className="font-bold text-red-700 text-lg">Voucher Tidak Tersedia</div>
                      <p className="text-red-600 text-sm mt-1">Voucher kedaluwarsa</p>
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

                    {/* AUTO → QR saja; MANUAL → tampilkan input & tombol */}
                    {!isManual ? (
                      <>
                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <QRCodeSVG
                            value={JSON.stringify({
                              code: selected?.voucher_item?.code || selected?.code || 'NO_CODE',
                              type: 'voucher',
                              item_id: selected?.voucher_item?.id || selected?.id,
                              user_id: selected?.voucher_item?.user_id || selected?.user_id,
                              owner_validation: true, // Flag untuk menandakan ini QR milik user
                              timestamp: Date.now(), // Tambah timestamp untuk keamanan
                              validation_purpose: 'tenant_scan', // Tujuan validasi oleh tenant
                              owner_only: false // Bisa divalidasi oleh tenant
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

                        {/* Icon untuk manual validation */}
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
                          className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 ${
                            validationLoading
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

                        <p className="text-slate-500 text-xs">
                          Masukkan kode validasi untuk memproses voucher ini
                        </p>
                      </div>
                    )}
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
            (() => {
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

                    {/* AUTO → QR saja; MANUAL → tampilkan input & tombol */}
                    {!isManual ? (
                      // Tampilkan QR Code untuk auto validation
                      <>
                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <QRCodeSVG
                            value={JSON.stringify({
                              code: selected?.promo_item?.code || selected?.code || 'NO_CODE',
                              type: 'promo',
                              item_id: selected?.promo_item?.id || selected?.id,
                              user_id: selected?.promo_item?.user_id || selected?.user_id,
                              owner_validation: true, // Flag untuk menandakan ini QR milik user
                              timestamp: Date.now(), // Tambah timestamp untuk keamanan
                              validation_purpose: 'tenant_scan', // Tujuan validasi oleh tenant
                              owner_only: false // Bisa divalidasi oleh tenant
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
                      // Tampilkan input dan tombol untuk manual validation
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

                        {/* Icon untuk manual validation */}
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
                          className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 ${
                            validationLoading
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

                        <p className="text-slate-500 text-xs">
                          Masukkan kode validasi untuk memproses promo ini
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
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
                setTimeout(() => {
                  setRefreshTrigger((p) => p + 1);
                }, 100);
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
