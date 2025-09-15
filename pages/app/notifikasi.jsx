/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
import { faCheckCircle, faExclamationTriangle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import React, { useEffect, useMemo, useState } from 'react';
import { DateFormatComponent } from '../../components/base.components';
import BottomBarComponent from '../../components/construct.components/BottomBarComponent';
import { token_cookie_name, useGet } from '../../helpers';
import { Decrypt } from '../../helpers/encryption.helpers';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

export default function NotificationPage() {
  const [type, setType] = useState('merchant'); // 'hunter' | 'merchant'
  const [version, setVersion] = useState(0);    // cache-buster
  const [localItems, setLocalItems] = useState([]);
  const [clearing, setClearing] = useState(false);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const path = useMemo(
    () => `notification${type ? `?type=${encodeURIComponent(type)}` : ''}&v=${version}`,
    [type, version]
  );

  const res = useGet({ path });
  const loading  = Array.isArray(res) ? Boolean(res[0]) : false;
  const httpCode = Array.isArray(res) ? res[1] : null;
  const payload  = Array.isArray(res) ? res[2] : null;

  const items = Array.isArray(payload?.data) ? payload.data : [];

  useEffect(() => {
    if (!loading) setLocalItems(items);
  }, [loading, items]);

  useEffect(() => {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.log('NOTIF DEBUG', { type, path, loading, httpCode, payload, items, localItems, version });
  }, [type, path, loading, httpCode, payload, items, localItems, version]);

  const authHeader = () => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function claimVoucher(voucherId, notificationId) {
    try {
      console.log('Claiming voucher:', { voucherId, notificationId }); // Debug log
      
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
      console.log('Response status:', res.status, 'Response text:', text); // Debug log
      
      let json = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }

      if (!res.ok) {
        console.error('Claim failed:', { status: res.status, response: json }); // Debug log
        
        // Handle specific SQL truncation error
        if (json?.message?.includes('Data too long for column')) {
          setModalMessage('Terjadi kesalahan sistem. Tim teknis sedang memperbaiki masalah ini.');
        } else {
          setModalMessage(json?.message || `HTTP ${res.status}: ${text || 'Server error'}`);
        }
        setShowErrorModal(true);
        return;
      }

      setLocalItems((prev) => prev.filter((n) => n.id !== notificationId));
      setVersion((v) => v + 1);

      setModalMessage('Voucher berhasil diklaim! Cek di Saku.');
      setShowSuccessModal(true);
    } catch (e) {
      console.error('Network error:', e); // Debug log
      setModalMessage('Gagal klaim: ' + (e?.message || 'Network error'));
      setShowErrorModal(true);
    }
  }

  async function clearAllNotifications() {
    setModalMessage(`Hapus semua notifikasi di tab "${type}"? Tindakan ini tidak bisa dibatalkan.`);
    setConfirmAction(() => () => {
      setClearing(true);

      fetch(
        `${apiBase}/api/notification?type=${encodeURIComponent(type)}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            ...authHeader(),
          },
        }
      )
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        setLocalItems([]);
        setVersion((v) => v + 1);
      })
      .catch((e) => {
        setModalMessage('Gagal menghapus notifikasi: ' + (e?.message || 'Network error'));
        setShowErrorModal(true);
      })
      .finally(() => {
        setClearing(false);
      });
    });
    setShowConfirmModal(true);
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
                  setModalMessage(`Hapus semua notifikasi di tab "${type}"? Tindakan ini tidak bisa dibatalkan.`);
                  setConfirmAction(clearAllNotifications);
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
                onClick={() => { setType('hunter'); setVersion((v) => v + 1); }}
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
                onClick={() => { setType('merchant'); setVersion((v) => v + 1); }}
              >
                Merchant
              </button>
            </div>
          </div>

          {/* List */}
          <div className="px-4">
            <div className="space-y-4">
              {loading ? (
                <>
                  {[1,2,3].map((i) => (
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
              ) : localItems.length > 0 ? (
                localItems.map((item, idx) => {
                  const { img, title, isVoucher } = cardMeta(item);
                  const isUnread = !item.read_at;

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
                                onError={(e) => { e.currentTarget.src = '/icons/icon-192x192.png'; }}
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
                              {title}
                            </h3>
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {item?.message || 'Tidak ada pesan'}
                          </p>

                          <div className="flex items-center justify-between">
                            <p className="text-gray-400 text-xs">
                              <DateFormatComponent date={item?.created_at} />
                            </p>

                            {isVoucher && item?.target_id && (
                              <button
                                onClick={() => claimVoucher(item.target_id, item.id)}
                                className="inline-flex items-center text-primary font-medium text-sm hover:text-primary-dark transition-colors"
                              >
                                Klaim voucher
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">{modalMessage}</p>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold border border-green-400 text-green-600 hover:bg-green-100 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">{modalMessage}</p>
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold border border-red-400 text-red-600 hover:bg-red-100 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faTimesCircle} className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-yellow-600 font-medium">{modalMessage}</p>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    confirmAction();
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border border-yellow-400 text-yellow-600 hover:bg-yellow-100 transition"
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                >
                  Tidak
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomBarComponent active="notification" />
      </div>
    </>
  );
}
