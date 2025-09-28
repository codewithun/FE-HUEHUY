/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
import { faCheckCircle, faExclamationTriangle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { DateFormatComponent } from '../../components/base.components';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { token_cookie_name } from '../../helpers';
import { Decrypt } from '../../helpers/encryption.helpers';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

export default function NotificationPage() {
  const [type, setType] = useState('merchant');
  const [version, setVersion] = useState(0);
  const [localItems, setLocalItems] = useState([]);
  const [clearing, setClearing] = useState(false);
  
  // Infinite scroll states
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showVoucherOutOfStockModal, setShowVoucherOutOfStockModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // NEW: modal expired
  const [showVoucherExpiredModal, setShowVoucherExpiredModal] = useState(false);
  // NEW: disable button while verifying/claiming
  const [claimingId, setClaimingId] = useState(null);

  const authHeader = () => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // helper tanggal kadaluwarsa (ambil dari berbagai kemungkinan field)
  const parseExpiry = (raw) => {
    if (!raw) return null;
    const s = String(raw).trim();
    // Jika format hanya YYYY-MM-DD, anggap akhir hari lokal
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d, 23, 59, 59, 999);
    }
    const t = new Date(s);
    return Number.isFinite(t.getTime()) ? t : null;
  };

  // Update getVoucherEndDate untuk prioritaskan data live
  const getVoucherEndDate = (n) => {
    if (!n || typeof n !== 'object') return null;

    // PRIORITAS 1: Data live dari backend (paling akurat)
    if (n.live_valid_until) {
      return n.live_valid_until;
    }

    // PRIORITAS 2: Meta dari notifikasi (bisa stale)
    let meta = n?.meta;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { meta = null; }
    }

    return (
      n?.voucher_end_date ||
      n?.valid_until ||
      n?.end_date ||
      n?.expired_at ||
      n?.expires_at ||
      n?.expiry_date ||
      n?.voucher?.valid_until ||
      n?.voucher?.end_date ||
      meta?.valid_until ||
      meta?.end_date ||
      meta?.voucher?.valid_until ||
      meta?.voucher?.end_date ||
      null
    );
  };

  const isVoucherExpired = (n) => {
    // PRIORITAS 1: Gunakan status live dari backend
    if (typeof n?.live_expired === 'boolean') {
      return n.live_expired;
    }

    // PRIORITAS 2: Fallback ke parsing manual
    const raw = getVoucherEndDate(n);
    const dt = parseExpiry(raw);
    return !!dt && dt.getTime() < Date.now();
  };

  const isVoucherAvailable = (n) => {
    // PRIORITAS 1: Gunakan status live dari backend (kombinasi semua faktor)
    if (typeof n?.live_available === 'boolean') {
      return n.live_available;
    }

    // PRIORITAS 2: Fallback ke cek manual
    if (n?.live_expired === true) return false;
    if (n?.live_out_of_stock === true) return false;
    if (n?.live_inactive === true) return false;
    
    // Fallback ke logika lama
    return !isVoucherExpired(n);
  };

  // Reset data saat ganti tab
  const resetData = useCallback(() => {
    console.log('🔄 Resetting data for tab:', type);
    setLocalItems([]);
    setCursor(null);
    setHasMore(true);
    setInitialLoad(true);
    setVersion(v => v + 1);
  }, [type]);

  // Load notifications dengan cursor-based pagination
  const loadNotifications = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) {
      console.log('⏸️ Skip loading:', { loading, hasMore, reset });
      return;
    }

    console.log('📥 Loading notifications:', { type, cursor, reset });
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        type: type,
        paginate: 'smart',
        limit: '20', // Load 20 per batch
        sortBy: 'created_at',
        sortDirection: 'DESC',
        v: version.toString(),
      });

      if (cursor && !reset) {
        params.append('cursor', cursor);
      }

      const res = await fetch(`${apiBase}/api/notification?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...authHeader(),
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      
      const data = await res.json();
      const newItems = Array.isArray(data.data) ? data.data : [];

      console.log('✅ Loaded notifications:', {
        newCount: newItems.length,
        hasMore: data.meta?.has_more,
        nextCursor: data.meta?.next_cursor
      });

      if (reset) {
        setLocalItems(newItems);
      } else {
        setLocalItems(prev => [...prev, ...newItems]);
      }

      setHasMore(Boolean(data.meta?.has_more));
      setCursor(data.meta?.next_cursor || null);
      setInitialLoad(false);

    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
      setHasMore(false);
      if (reset) {
        setLocalItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [type, cursor, hasMore, loading, version]);

  // Initial load & reload saat ganti tab
  useEffect(() => {
    loadNotifications(true);
  }, [type]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loading || !hasMore || initialLoad) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // Load more saat hampir sampai bawah (85%)
    if (scrollTop + clientHeight >= scrollHeight * 0.85) {
      console.log('🔄 Trigger infinite scroll');
      loadNotifications(false);
    }
  }, [loading, hasMore, loadNotifications, initialLoad]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Tab change handler
  const handleTabChange = (newType) => {
    if (newType === type) return;
    console.log('🔄 Changing tab from', type, 'to', newType);
    setType(newType);
    resetData();
  };

  // Debug logging
  useEffect(() => {
    if (!DEBUG) return;
    console.log('NOTIF DEBUG', { 
      type, loading, hasMore, cursor, 
      itemsCount: localItems.length, 
      initialLoad, version 
    });
  }, [type, loading, hasMore, cursor, localItems.length, initialLoad, version]);

  // NEW: fetch live voucher detail to avoid stale meta in notifications
  const fetchVoucherDetail = useCallback(async (voucherId) => {
    if (!voucherId) return null;
    try {
      const res = await fetch(`${apiBase}/api/vouchers/${voucherId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...authHeader(),
        },
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const voucher = data?.data || data || null;
      
      // Konsistensi dengan format live dari notifikasi
      if (voucher) {
        const validUntil = voucher.valid_until;
        const expired = validUntil ? new Date(validUntil).getTime() < Date.now() : false;
        const stock = voucher.stock ?? 0;
        const outOfStock = !isNaN(stock) && stock <= 0;
        
        voucher.live_expired = expired;
        voucher.live_out_of_stock = outOfStock;
        voucher.live_available = !expired && !outOfStock;
      }
      
      return voucher;
    } catch {
      return null;
    }
  }, []);

  async function claimVoucher(voucherId, notificationId) {
    try {
      console.log('Claiming voucher:', { voucherId, notificationId });
      setClaimingId(notificationId);

      // Pre-check dari payload notifikasi (mungkin stale)
      const notif = localItems.find((n) => n.id === notificationId);
      if (notif && isVoucherExpired(notif)) {
        setShowVoucherExpiredModal(true);
        setTimeout(() => {
          setShowVoucherExpiredModal(false);
          setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
          setVersion((v) => v + 1);
        }, 3000);
        return;
      }

      // NEW: cek status voucher terbaru dari server
      const live = await fetchVoucherDetail(voucherId);
      if (live) {
        const expiredLive =
          isVoucherExpired(live) ||
          live?.expired === true ||
          live?.is_expired === true ||
          String(live?.status || '').toLowerCase() === 'expired';
        if (expiredLive) {
          setShowVoucherExpiredModal(true);
          setTimeout(() => {
            setShowVoucherExpiredModal(false);
            setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
            setVersion((v) => v + 1);
          }, 3000);
          return;
        }

        // Optional: guard jika stok sudah habis
        const stockLeft = Number(live?.stock ?? live?.remaining ?? live?.quota_remaining ?? NaN);
        if (Number.isFinite(stockLeft) && stockLeft <= 0) {
          setShowVoucherOutOfStockModal(true);
          setTimeout(() => {
            setShowVoucherOutOfStockModal(false);
            setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
            setVersion((v) => v + 1);
          }, 3000);
          return;
        }
      }

      const res = await fetch(`${apiBase}/api/vouchers/${voucherId}/claim`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      const text = await res.text();
      console.log('Response status:', res.status, 'Response text:', text);
      let json = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }

      if (!res.ok) {
        console.error('Claim failed:', { status: res.status, response: json });
        const msg = String(json?.message || '').toLowerCase();

        // NEW: treat 422/403 as expired too
        if (
          res.status === 422 ||
          res.status === 403 ||
          msg.includes('expired') ||
          msg.includes('kadaluwarsa') ||
          msg.includes('kadaluarsa')
        ) {
          setShowVoucherExpiredModal(true);
          setTimeout(() => {
            setShowVoucherExpiredModal(false);
            setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
            setVersion((v) => v + 1);
          }, 3000);
          return;
        }

        if (
          json?.message?.includes('out of stock') || 
          json?.message?.includes('stok habis') || 
          json?.message?.includes('voucher habis') || 
          res.status === 410
        ) {
          setShowVoucherOutOfStockModal(true);
          setTimeout(() => {
            setShowVoucherOutOfStockModal(false);
            setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
            setVersion((v) => v + 1);
          }, 3000);
          return;
        }

        setModalMessage(json?.message || `HTTP ${res.status}: ${text || 'Server error'}`);
        setShowErrorModal(true);
        return;
      }

      setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
      setVersion((v) => v + 1);
      setModalMessage('Voucher berhasil diklaim! Cek di Saku.');
      setShowSuccessModal(true);
    } catch (e) {
      console.error('Network error:', e);
      setModalMessage('Gagal klaim: ' + (e?.message || 'Network error'));
      setShowErrorModal(true);
    } finally {
      setClaimingId(null);
    }
  }

  async function doClearAll(tab) {
    setShowConfirmModal(false);
    setShowVoucherOutOfStockModal(false);
    setShowErrorModal(false);
    setShowSuccessModal(false);
    setClearing(true);
    
    try {
      const res = await fetch(`${apiBase}/api/notification?type=${encodeURIComponent(tab)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.text();
      
      setLocalItems([]);
      setCursor(null);
      setHasMore(true);
      setVersion(v => v + 1);
    } catch (e) {
      setModalMessage('Gagal menghapus notifikasi: ' + (e?.message || 'Network error'));
      setShowErrorModal(true);
    } finally {
      setClearing(false);
    }
  }

  const cardMeta = (n) => {
    if (!n || typeof n !== 'object') {
      return { img: null, title: 'Notifikasi', isVoucher: false, isPromo: false };
    }
    const img =
      n.image_url ||
      n?.grab?.ad?.picture_source ||
      n?.ad?.picture_source ||
      n?.ad?.image_url ||
      n?.cube?.logo || null;

    const title =
      n.title || n?.grab?.ad?.title || n?.ad?.title || n?.cube?.name || 'Notifikasi';

    const isVoucher = n.type === 'voucher' || n.target_type === 'voucher';
    const isPromo   = n.type === 'promo'   || n.target_type === 'promo';
    return { img, title, isVoucher, isPromo };
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        {/* Header */}
        <div className="bg-primary w-full px-4 pt-6 pb-16">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-2xl">Notifikasi</h1>
              <p className="text-white text-sm mt-1">Lihat pembaruan dan aktivitas terbaru</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalMessage(`Hapus semua notifikasi di tab "${type}"?`);
                  setConfirmAction(() => () => doClearAll(type));
                  setShowConfirmModal(true);
                }}
                disabled={clearing}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border border-white/40 text-white hover:bg-white/15 transition ${
                  clearing ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                title="Hapus semua notifikasi"
              >
                {clearing ? 'Menghapus…' : 'Hapus semua'}
              </button>

              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-gray-50 min-h-screen w-full relative z-20 pb-28">
          {/* Tabs */}
          <div className="-mt-12 mx-4 mb-6">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                className={`text-center py-4 font-medium rounded-t-xl transition-colors duration-200 ${
                  type === 'hunter'
                    ? 'bg-white text-primary border-b-2 border-primary'
                    : 'bg-white/80 text-gray-600'
                }`}
                onClick={() => handleTabChange('hunter')}
                disabled={loading && initialLoad}
              >
                Hunter
              </button>
              <button
                type="button"
                className={`text-center py-4 font-medium rounded-t-xl transition-colors duration-200 ${
                  type === 'merchant'
                    ? 'bg-white text-primary border-b-2 border-primary'
                    : 'bg-white/80 text-gray-600'
                }`}
                onClick={() => handleTabChange('merchant')}
                disabled={loading && initialLoad}
              >
                Merchant
              </button>
            </div>
          </div>

          {/* List */}
          <div className="px-4">
            <div className="space-y-4">
              {localItems.length > 0 ? (
                <>
                  {localItems.map((item, idx) => {
                    const { img, title, isVoucher } = cardMeta(item);
                    const isUnread = !item.read_at;

                    // NEW: gunakan status live yang lebih akurat
                    const expired = isVoucher && isVoucherExpired(item);
                    const available = isVoucher ? isVoucherAvailable(item) : true;
                    const outOfStock = isVoucher && item.live_out_of_stock === true;

                    return (
                      <div
                        className={`bg-white rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                          isUnread ? 'border-l-4 border-primary' : ''
                        }`}
                        key={item?.id ?? `notif-${idx}`}
                      >
                        <div className="flex gap-4">
                          <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
                              {img ? (
                                <img
                                  src={img}
                                  className="w-full h-full object-cover"
                                  alt={title}
                                  onError={(e) => { 
                                    // Gunakan base64 placeholder atau SVG inline untuk menghindari 404 berulang
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNCAzQTIgMiAwIDAwMiA1VjE5QTIgMiAwIDAwNCAyMUgyMEEyIDIgMCAwMDIyIDE5VjVBMiAyIDAgMDAyMCAzSDRaTTIwIDE5SDRWNUgyMFYxOVoiIGZpbGw9IiM5Q0E0QjAiLz4KPHBhdGggZD0iTTggOUMxMC4yMDkxIDkgMTIgMTAuNzkwOSAxMiAxM0MxMiAxNS4yMDkxIDEwLjIwOTEgMTcgOCAxN0M1Ljc5MDg2IDE3IDQgMTUuMjA5MSA0IDEzQzQgMTAuNzkwOSA1Ljc5MDg2IDkgOCA9WiIgZmlsbD0iIzlDQTNCMCIvPgo8L3N2Zz4K';
                                  }}
                                />
                              ) : (
                                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            {isUnread && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <h3 className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'} line-clamp-2`}>
                                {item.live_voucher_name || title}
                              </h3>
                            </div>

                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {item?.message || 'Tidak ada pesan'}
                            </p>

                            <div className="flex items-center justify-between">
                              <p className="text-gray-400 text-xs">
                                <DateFormatComponent date={item?.created_at} />
                              </p>

                              {/* Kondisi tombol berdasarkan status live */}
                              {isVoucher && item?.target_id && available && (
                                <button
                                  type="button"
                                  onClick={() => claimVoucher(item.target_id, item.id)}
                                  disabled={claimingId === item.id}
                                  className={`inline-flex items-center font-medium text-sm transition-colors ${
                                    claimingId === item.id ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:text-primary-dark'
                                  }`}
                                >
                                  {claimingId === item.id ? 'Memproses…' : 'Klaim voucher'}
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}

                              {/* Status indicator berdasarkan kondisi live */}
                              {isVoucher && !available && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-500">
                                  {expired ? 'Voucher kadaluwarsa' : 
                                   outOfStock ? 'Voucher habis' : 
                                   'Voucher tidak tersedia'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Loading indicator untuk infinite scroll */}
                  {loading && !initialLoad && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-200 rounded-lg animate-pulse" />
                          <div className="h-3 bg-gray-100 rounded-lg animate-pulse" />
                          <div className="h-3 w-2/3 bg-gray-100 rounded-lg animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* End indicator */}
                  {!hasMore && !loading && localItems.length > 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-px bg-gray-300"></div>
                        <span>Semua notifikasi telah dimuat</span>
                        <div className="w-8 h-px bg-gray-300"></div>
                      </div>
                    </div>
                  )}
                </>
              ) : loading && initialLoad ? (
                <>
                  {[1,2,3,4,5].map((i) => (
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
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-4z" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Belum ada notifikasi</h3>
                  <p className="text-gray-500 text-sm">Notifikasi baru akan muncul di sini</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-md mx-4 max-w-sm w-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-600 font-medium mb-4">{modalMessage}</p>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-md mx-4 max-w-sm w-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 font-medium mb-4">{modalMessage}</p>
                <button
                  type="button"
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-lg mx-4 max-w-sm w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faTimesCircle} className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Konfirmasi Hapus</h3>
                <p className="text-gray-600 text-sm mb-6">{modalMessage}</p>
                
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const fn = confirmAction;
                      setShowConfirmModal(false);
                      fn && fn();
                    }}
                    disabled={clearing}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition ${
                      clearing ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {clearing ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={clearing}
                    className="px-6 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showVoucherOutOfStockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-lg mx-4 max-w-sm w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Voucher Sudah Habis</h3>
                <p className="text-gray-600 text-sm mb-4">Maaf, voucher ini sudah tidak tersedia lagi. Notifikasi akan dihapus otomatis.</p>
                <div className="text-orange-600 text-xs font-medium">
                  Popup akan tertutup otomatis dalam 3 detik
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: modal voucher kadaluwarsa */}
        {showVoucherExpiredModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-lg mx-4 max-w-sm w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Voucher Kadaluwarsa</h3>
                <p className="text-gray-600 text-sm mb-2">Maaf, voucher ini sudah tidak berlaku.</p>
                <div className="text-gray-500 text-xs font-medium">
                  Popup akan tertutup otomatis dalam 3 detik
                </div>
              </div>
            </div>
          </div>
        )}

        <BottomBarComponent active="notification" />
      </div>
    </>
  );
}
