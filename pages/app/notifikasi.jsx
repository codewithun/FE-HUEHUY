/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
import { faCheckCircle, faExclamationTriangle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { DateFormatComponent } from '../../components/base.components';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { token_cookie_name } from '../../helpers';
import { Decrypt } from '../../helpers/encryption.helpers';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

export default function NotificationPage() {
  const router = useRouter();
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
  // ✅ NEW: simpan ID notifikasi yang sedang diproses untuk modal
  const [processingNotificationId, setProcessingNotificationId] = useState(null);
  // Guard concurrent loads and apply cooldown to avoid 429
  const inFlightRef = useRef(false);
  const cooldownRef = useRef(0);

  const authHeader = () => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // helper tanggal kadaluwarsa (ambil dari berbagai kemungkinan field)
  const parseExpiry = (raw) => {
    if (!raw) return null;
    if (raw instanceof Date && Number.isFinite(raw.getTime())) return raw;
    const s = String(raw).trim();

    // Case 1: YYYY-MM-DD (treat as end of local day)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d, 23, 59, 59, 999);
    }

    // Case 2: UNIX timestamp (seconds or ms)
    if (/^\d{10,13}$/.test(s)) {
      const n = Number(s);
      return new Date(s.length === 13 ? n : n * 1000);
    }

    // Case 3: "YYYY-MM-DD HH:mm:ss" (Safari can't parse this reliably)
    const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
    if (m1) {
      const [, y, mo, d, hh, mm, ss] = m1.map(Number);
      return new Date(y, mo - 1, d, hh, mm, ss, 0); // interpret as local time
    }

    // Case 4: ISO-like string is generally parseable
    const t = new Date(s.replace(' ', 'T'));
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

  // Fungsi baru untuk mendapatkan start_validate
  const getVoucherStartDate = (n) => {
    if (!n || typeof n !== 'object') return null;

    // PRIORITAS 1: Data live dari backend
    if (n.live_start_validate) {
      return n.live_start_validate;
    }

    // PRIORITAS 2: Meta dari notifikasi
    let meta = n?.meta;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { meta = null; }
    }

    return (
      n?.start_validate ||
      n?.voucher?.start_validate ||
      meta?.start_validate ||
      meta?.voucher?.start_validate ||
      null
    );
  };

  // Fungsi baru untuk mendapatkan finish_validate
  const getVoucherFinishDate = (n) => {
    if (!n || typeof n !== 'object') return null;

    // PRIORITAS 1: Data live dari backend
    if (n.live_finish_validate) {
      return n.live_finish_validate;
    }

    // PRIORITAS 2: Meta dari notifikasi
    let meta = n?.meta;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { meta = null; }
    }

    return (
      n?.finish_validate ||
      n?.voucher?.finish_validate ||
      meta?.finish_validate ||
      meta?.voucher?.finish_validate ||
      null
    );
  };

  // Fungsi baru untuk mendapatkan validation_time_limit
  const getValidationTimeLimit = (n) => {
    if (!n || typeof n !== 'object') return null;

    // PRIORITAS 1: Data live dari backend
    if (n.live_validation_time_limit) {
      return n.live_validation_time_limit;
    }

    // PRIORITAS 2: Meta dari notifikasi
    let meta = n?.meta;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { meta = null; }
    }

    return (
      n?.validation_time_limit ||
      n?.voucher?.validation_time_limit ||
      meta?.validation_time_limit ||
      meta?.voucher?.validation_time_limit ||
      null
    );
  };

  // Fungsi untuk mendapatkan jam_mulai
  const getJamMulai = (n) => {
    if (!n || typeof n !== 'object') return null;

    let meta = n?.meta;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { meta = null; }
    }

    return (
      n?.jam_mulai ||
      n?.voucher?.jam_mulai ||
      meta?.jam_mulai ||
      meta?.voucher?.jam_mulai ||
      null
    );
  };

  // Fungsi untuk mendapatkan jam_berakhir
  const getJamBerakhir = (n) => {
    if (!n || typeof n !== 'object') return null;

    let meta = n?.meta;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch { meta = null; }
    }

    return (
      n?.jam_berakhir ||
      n?.voucher?.jam_berakhir ||
      meta?.jam_berakhir ||
      meta?.voucher?.jam_berakhir ||
      null
    );
  };

  const isVoucherExpired = (n) => {
    // PRIORITAS 1: Gunakan status live dari backend
    if (typeof n?.live_expired === 'boolean') {
      return n.live_expired;
    }

    // PRIORITAS 2: Cek berdasarkan start_validate dan finish_validate (HANYA TANGGAL, ABAIKAN JAM)
    const finishRaw = getVoucherFinishDate(n);
    const startRaw = getVoucherStartDate(n);
    const now = new Date();

    // Normalisasi ke tanggal saja (set ke awal hari untuk perbandingan)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (finishRaw) {
      const finishDt = parseExpiry(finishRaw);
      if (finishDt) {
        // Set ke awal hari untuk tanggal finish
        const finishDayStart = new Date(finishDt.getFullYear(), finishDt.getMonth(), finishDt.getDate());
        // Voucher expired jika hari ini >= tanggal finish (karena voucher berlaku sampai 1 hari sebelum finish di jam 23:59)
        if (todayStart >= finishDayStart) return true;
      }
    }

    if (startRaw) {
      const startDt = parseExpiry(startRaw);
      if (startDt) {
        // Set ke awal hari untuk tanggal start
        const startDayStart = new Date(startDt.getFullYear(), startDt.getMonth(), startDt.getDate());
        // Voucher belum bisa diklaim jika hari ini < tanggal start
        if (todayStart < startDayStart) return true;
      }
    }

    // PRIORITAS 3: Fallback ke parsing manual lama (juga abaikan jam)
    const raw = getVoucherEndDate(n);
    if (raw) {
      const dt = parseExpiry(raw);
      if (dt) {
        const endDayStart = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        return todayStart >= endDayStart;
      }
    }

    return false;
  };

  const isVoucherNotStarted = (n) => {
    // PRIORITAS 1: Gunakan status live dari backend
    if (typeof n?.live_not_started === 'boolean') {
      return n.live_not_started;
    }

    // PRIORITAS 2: Cek manual berdasarkan start_validate (DENGAN JAM untuk akurasi)
    const startRaw = getVoucherStartDate(n);
    if (startRaw) {
      const startDt = parseExpiry(startRaw);
      if (startDt) {
        const now = new Date();
        // Jika ada jam di data, gunakan perbandingan lengkap dengan jam
        // Jika tidak ada jam (hanya tanggal), default ke awal hari
        return now.getTime() < startDt.getTime();
      }
    }

    return false;
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
    if (isVoucherNotStarted(n)) return false; // Tambahkan cek belum dimulai

    // Fallback ke logika lama
    return !isVoucherExpired(n);
  };

  // Helpers to mark notification handled on server and notify UI for badge refresh
  async function markNotificationHandled(notificationId) {
    if (!notificationId) return;
    // Use DELETE to mark as handled instead of PATCH
    try {
      await fetch(`${apiBase}/api/notification/${notificationId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', ...authHeader() },
      });
    } catch { }
  }

  function emitNotificationChanged(type, id) {
    try {
      window.dispatchEvent(new CustomEvent('notifications:changed', { detail: { type, id, delta: -1 } }));
    } catch { }
    try {
      // Optional cross-tab signal
      localStorage.setItem('notifications:lastChange', JSON.stringify({ t: Date.now(), type, id, delta: -1 }));
    } catch { }
  }

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
    const now = Date.now();
    if (now < cooldownRef.current) return;
    if (inFlightRef.current || loading || (!hasMore && !reset)) {
      console.log('⏸️ Skip loading:', { loading, hasMore, reset });
      return;
    }

    console.log('📥 Loading notifications:', { type, cursor, reset });
    inFlightRef.current = true;
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
          ...authHeader(),
        },
      });

      if (!res.ok) {
        if (res.status === 429) {
          const ra = Number(res.headers.get('Retry-After'));
          const delaySec = Number.isFinite(ra) && ra > 0 ? ra : 2;
          console.warn(`⏳ Throttled, retrying in ${delaySec}s`);
          cooldownRef.current = Date.now() + delaySec * 1000;
          return; // gracefully exit; finally will unset loading and inflight
        }
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
      inFlightRef.current = false;
      // apply a tiny cooldown to prevent burst
      cooldownRef.current = Date.now() + 500;
    }
  }, [type, cursor, hasMore, loading, version]);

  // Initial load & reload saat ganti tab
  useEffect(() => {
    loadNotifications(true);
  }, [type, loadNotifications]);

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

  // Listen for notification changes from other pages
  useEffect(() => {
    const handleNotificationChange = (e) => {
      const { type: eventType, id, delta } = e.detail;
      console.log('🔔 Notification changed event received:', { eventType, id, delta, currentType: type });

      if ((eventType === 'merchant' || eventType === 'hunter' || eventType === 'delete') && id) {
        // Remove the notification from local state
        setLocalItems((prev) => prev.filter((n) => n.id !== id));
        console.log('🗑️ Removed notification from local state:', id);
      }
    };

    window.addEventListener('notifications:changed', handleNotificationChange);
    return () => window.removeEventListener('notifications:changed', handleNotificationChange);
  }, [type]);

  // Check for pending notification deletions on mount and visibility change
  useEffect(() => {
    const checkPendingDeletions = () => {
      try {
        const stored = localStorage.getItem('notifications:changed');
        if (stored) {
          const { type: eventType, id, timestamp } = JSON.parse(stored);
          if ((eventType === 'merchant' || eventType === 'hunter' || eventType === 'delete') && id && Date.now() - timestamp < 5000) {
            console.log('� Processing stored notification deletion:', { eventType, id });
            setLocalItems((prev) => prev.filter((n) => n.id !== id));
            localStorage.removeItem('notifications:changed');
          }
        }
      } catch (error) {
        console.log('❌ Error processing stored notification change:', error);
      }
    };

    // Check on mount
    checkPendingDeletions();

    // Check when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Tab became visible, checking for pending deletions');
        checkPendingDeletions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  async function fetchVoucherDetail(voucherId) {
    try {
      const res = await fetch(`${apiBase}/api/ads/${voucherId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...authHeader(),
        },
      });

      if (!res.ok) {
        console.error('fetchVoucherDetail error:', res.status);
        return null;
      }

      const json = await res.json();
      return json?.data || null;
    } catch (e) {
      console.error('fetchVoucherDetail failed:', e);
      return null;
    }
  }

  async function claimVoucher(voucherId, notificationId) {
    try {
      console.log('Claiming voucher:', { voucherId, notificationId });
      setClaimingId(notificationId);
      setProcessingNotificationId(notificationId); // ✅ Simpan untuk digunakan di modal

      // Pre-check dari payload notifikasi (mungkin stale)
      const notif = localItems.find((n) => n.id === notificationId);
      if (notif && isVoucherExpired(notif)) {
        setShowVoucherExpiredModal(true);
        // ✅ PERBAIKAN: Hanya hapus notifikasi jika BUKAN voucher harian
        const isDaily = notif?.live_is_daily_grab === true || notif?.is_daily_grab === true;
        if (!isDaily) {
          markNotificationHandled(notificationId).then(() => emitNotificationChanged(type, notificationId));
        }
        setTimeout(() => {
          setShowVoucherExpiredModal(false);
          if (!isDaily) {
            setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
            setVersion((v) => v + 1);
          }
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
          // ✅ PERBAIKAN: Hanya hapus notifikasi jika BUKAN voucher harian
          const isDaily = live?.is_daily_grab === true;
          if (!isDaily) {
            markNotificationHandled(notificationId).then(() => emitNotificationChanged(type, notificationId));
          }
          setTimeout(() => {
            setShowVoucherExpiredModal(false);
            if (!isDaily) {
              setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
              setVersion((v) => v + 1);
            }
          }, 3000);
          return;
        }

        // ✅ PERBAIKAN: Guard jika stok sudah habis
        const stockLeft = Number(live?.stock ?? live?.remaining ?? live?.quota_remaining ?? live?.total_remaining ?? NaN);
        const isDaily = live?.is_daily_grab === true;

        if (Number.isFinite(stockLeft) && stockLeft <= 0) {
          setShowVoucherOutOfStockModal(true);
          // ✅ JANGAN hapus notifikasi jika voucher harian (akan restock besok)
          if (!isDaily) {
            markNotificationHandled(notificationId).then(() => emitNotificationChanged(type, notificationId));
          }
          // ✅ Modal akan ditutup manual oleh user, tidak auto-close
          return;
        }
      }

      const res = await fetch(`${apiBase}/api/ads/${voucherId}/claim`, {
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

        // NEW: Check jika voucher belum dimulai (JANGAN HAPUS NOTIFIKASI, karena bisa diklaim nanti)
        if (
          res.status === 422 &&
          (msg.includes('belum dimulai') ||
            msg.includes('belum mulai') ||
            msg.includes('not started yet') ||
            msg.includes('tanggal mulai'))
        ) {
          // Ambil info jam mulai dan jam berakhir
          const jamMulai = getJamMulai(live || notif);
          const jamBerakhir = getJamBerakhir(live || notif);

          let timeInfo = '';
          if (jamMulai && jamBerakhir) {
            timeInfo = ` Voucher bisa diklaim dari jam ${jamMulai} sampai ${jamBerakhir}.`;
          } else if (jamMulai) {
            timeInfo = ` Voucher bisa diklaim mulai jam ${jamMulai}.`;
          }

          setModalMessage(`Voucher ini belum bisa diklaim. Silakan coba lagi setelah jam mulai voucher.${timeInfo}`);
          setShowErrorModal(true);
          return;
        }        // NEW: treat 422/403 as expired
        if (
          res.status === 422 ||
          res.status === 403 ||
          msg.includes('expired') ||
          msg.includes('kadaluwarsa') ||
          msg.includes('kadaluarsa') ||
          msg.includes('tidak berlaku') ||
          msg.includes('sudah berakhir')
        ) {
          setShowVoucherExpiredModal(true);
          // ✅ PERBAIKAN: Hanya hapus notifikasi jika BUKAN voucher harian
          const notif = localItems.find((n) => n.id === notificationId);
          const isDaily = notif?.live_is_daily_grab === true || notif?.is_daily_grab === true;
          if (!isDaily) {
            markNotificationHandled(notificationId).then(() => emitNotificationChanged(type, notificationId));
          }
          setTimeout(() => {
            setShowVoucherExpiredModal(false);
            if (!isDaily) {
              setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
              setVersion((v) => v + 1);
            }
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
          // ✅ PERBAIKAN: JANGAN hapus notifikasi jika voucher harian (akan restock besok)
          const notif = localItems.find((n) => n.id === notificationId);
          const isDaily = notif?.live_is_daily_grab === true || notif?.is_daily_grab === true;
          if (!isDaily) {
            markNotificationHandled(notificationId).then(() => emitNotificationChanged(type, notificationId));
          }
          // ✅ Modal akan ditutup manual oleh user via tombol Tutup
          return;
        }

        setModalMessage(json?.message || `HTTP ${res.status}: ${text || 'Server error'}`);
        setShowErrorModal(true);
        return;
      }

      // Success: mark as handled on server so it won't reappear and update badge
      await markNotificationHandled(notificationId);
      emitNotificationChanged(type, notificationId);
      setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
      setVersion((v) => v + 1);

      // Ambil batas waktu validasi
      const timeLimit = getValidationTimeLimit(live || localItems.find(n => n.id === notificationId));
      const timeLimitText = timeLimit ? ` Batas waktu validasi: ${timeLimit}.` : '';

      setModalMessage(`Voucher berhasil diklaim! Cek di Saku.${timeLimitText}`);
      setShowSuccessModal(true);
    } catch (e) {
      console.error('Network error:', e);
      setModalMessage('Gagal klaim: ' + (e?.message || 'Network error'));
      setShowErrorModal(true);
    } finally {
      // ✅ Reset hanya claimingId, tapi pertahankan processingNotificationId untuk modal
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

    // Ambil gambar dengan prioritas baru (ads.image_1 > ads.picture_source > image_url)
    const ad = n?.ad || n?.grab?.ad || n?.promo?.ad || n?.voucher?.ad;
    const img =
      n?.live_status?.image_url ||
      n?.ad_picture || // dari accessor backend
      ad?.image_1 ||
      ad?.image_2 ||
      ad?.image_3 ||
      ad?.picture_source ||
      n?.image_url ||
      n?.cube?.logo ||
      null;

    const title =
      n?.live_voucher_name ||
      n?.ad_title ||
      n?.title ||
      ad?.title ||
      n?.cube?.name ||
      'Notifikasi';

    const isVoucher = n.type === 'voucher' || n.target_type === 'voucher';
    const isPromo = n.type === 'promo' || n.target_type === 'promo';

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
                className={`px-3 py-2 rounded-lg text-sm font-semibold border border-white/40 text-white hover:bg-white/15 transition ${clearing ? 'opacity-60 cursor-not-allowed' : ''
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
                className={`text-center py-4 font-medium rounded-t-xl transition-colors duration-200 ${type === 'hunter'
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
                className={`text-center py-4 font-medium rounded-t-xl transition-colors duration-200 ${type === 'merchant'
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
                    const notStarted = isVoucher && isVoucherNotStarted(item);
                    const expired = isVoucher && isVoucherExpired(item);
                    const available = isVoucher ? isVoucherAvailable(item) : true;
                    const outOfStock = isVoucher && item.live_out_of_stock === true;

                    // Get start date/time dan jam operasional untuk info tambahan
                    const startRaw = getVoucherStartDate(item);
                    const startDt = startRaw ? parseExpiry(startRaw) : null;
                    const startTimeInfo = startDt ? new Intl.DateTimeFormat('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(startDt) : '';

                    // Get jam_mulai dan jam_berakhir
                    const jamMulai = getJamMulai(item);
                    const jamBerakhir = getJamBerakhir(item);
                    const jamOperasional = (jamMulai && jamBerakhir)
                      ? `${jamMulai} - ${jamBerakhir}`
                      : jamMulai
                        ? `Mulai ${jamMulai}`
                        : '';

                    return (
                      <div
                        className={`bg-white rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer ${isUnread ? 'border-l-4 border-primary' : ''
                          }`}
                        key={item?.id ?? `notif-${idx}`}
                        onClick={() => {
                          if (isVoucher && item?.target_id) {
                            router.push(`/app/komunitas/promo/${item.target_id}?notificationId=${item.id}`);
                          }
                        }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    claimVoucher(item.target_id, item.id);
                                  }}
                                  disabled={claimingId === item.id}
                                  className={`inline-flex items-center font-medium text-sm transition-colors ${claimingId === item.id ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:text-primary-dark'
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
                                <div className="flex flex-col items-end">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-500">
                                    {notStarted ? 'Belum dimulai' :
                                      expired ? 'Kadaluwarsa' :
                                        outOfStock ? 'Stok habis' :
                                          'Tidak tersedia'}
                                  </span>
                                  {notStarted && (startTimeInfo || jamOperasional) && (
                                    <div className="flex flex-col items-end mt-1">
                                      {startTimeInfo && (
                                        <span className="text-xs text-blue-600">
                                          Mulai: {startTimeInfo}
                                        </span>
                                      )}
                                      {jamOperasional && (
                                        <span className="text-xs text-gray-500">
                                          Jam: {jamOperasional}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
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
                  {[1, 2, 3, 4, 5].map((i) => (
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
                    className={`px-6 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition ${clearing ? 'opacity-60 cursor-not-allowed' : ''
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stok Voucher Habis</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Maaf, stok voucher ini sudah habis untuk hari ini.
                  {/* ✅ Tampilkan info restock untuk voucher harian */}
                  {(() => {
                    const notif = localItems.find((n) => n.id === processingNotificationId);
                    const isDaily = notif?.live_is_daily_grab === true || notif?.is_daily_grab === true;
                    return isDaily ? (
                      <span className="block mt-2 text-blue-600 font-medium text-xs">
                        💡 Voucher harian akan restock otomatis besok!
                      </span>
                    ) : null;
                  })()}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowVoucherOutOfStockModal(false);
                    // ✅ Hapus dari list HANYA jika bukan voucher harian
                    const notif = localItems.find((n) => n.id === processingNotificationId);
                    const isDaily = notif?.live_is_daily_grab === true || notif?.is_daily_grab === true;
                    if (!isDaily) {
                      setLocalItems((prev) => prev.filter((n) => n.id !== processingNotificationId));
                      setVersion((v) => v + 1);
                    }
                    setProcessingNotificationId(null); // ✅ Reset setelah tutup modal
                  }}
                  className="px-6 py-2 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition"
                >
                  Tutup
                </button>
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
