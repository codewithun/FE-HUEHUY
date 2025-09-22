/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeftLong,
  faCheckCircle,
  faQrcode,
  faShieldCheck,
  faFlashlight,
  faFlashlightSlash,
  faCamera,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import { token_cookie_name, Decrypt } from '../../helpers';
import { useUserContext } from '../../context/user.context';
import { ButtonComponent, IconButtonComponent } from '../../components/base.components';
import { ModalConfirmComponent } from '../../components/base.components';
import QrScannerComponent from '../../components/construct.components/QrScannerComponent';

// ✅ Pastikan base URL tanpa /api di akhir
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

// Batasi console log hanya saat dev
const dev = process.env.NODE_ENV !== 'production';
// eslint-disable-next-line no-console
const dlog = (...args) => dev && console.log(...args);

export default function ScanValidasi() {
  const router = useRouter();
  const { profile, loading, fetchProfile } = useUserContext();

  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalFailed, setModalFailed] = useState(false);
  const [modalFailedMessage, setModalFailedMessage] = useState('Kode Tidak Valid / Sudah Digunakan');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lastItemType, setLastItemType] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [scannedCode, setScannedCode] = useState(''); // Store the actual code for display

  useEffect(() => {
    const token = Cookies.get(token_cookie_name);
    if (token && !profile && !loading) {
      fetchProfile();
    }
  }, [profile, loading, fetchProfile]);

  // Redirect jika bukan Manager Tenant
  useEffect(() => {
    if (profile && profile.role_id !== 6) {
      router.push('/app/akun');
    }
  }, [profile, router]);

  const isManagerTenant = profile?.role_id === 6;

  // Helper: ekstrak data dari hasil scan QR
  const extractValidationCode = (qrResult) => {
    dlog('🔍 Raw QR Scan Result:', qrResult);

    if (!qrResult || typeof qrResult !== 'string') {
      dlog('❌ Invalid QR result format');
      return null;
    }

    // 1) Coba parse JSON (format baru dengan metadata)
    try {
      const parsed = JSON.parse(qrResult);
      dlog('📦 Parsed JSON from QR:', parsed);

      if (parsed && typeof parsed === 'object' && parsed.code) {
        dlog('✅ Found structured QR data:', {
          code: parsed.code,
          type: parsed.type,
          item_id: parsed.item_id,
          user_id: parsed.user_id,
          owner_validation: parsed.owner_validation,
          validation_purpose: parsed.validation_purpose,
        });

        return {
          code: parsed.code,
          type: parsed.type || 'unknown',
          item_id: parsed.item_id,
          user_id: parsed.user_id,
          owner_validation: parsed.owner_validation,
          validation_purpose: parsed.validation_purpose,
          owner_only: parsed.owner_only,
          timestamp: parsed.timestamp,
          isStructured: true,
        };
      }

      // Legacy JSON fallback
      if (parsed.code) {
        dlog('✅ Found code in legacy JSON:', parsed.code);
        return { code: parsed.code, type: parsed.type || 'unknown', isStructured: false };
      }
      if (parsed.type === 'voucher' && parsed.id) {
        dlog('✅ Found voucher ID in JSON:', parsed.id);
        return { code: parsed.id, type: 'voucher', isStructured: false };
      }
      if (parsed.type === 'promo' && parsed.id) {
        dlog('✅ Found promo ID in JSON:', parsed.id);
        return { code: parsed.id, type: 'promo', isStructured: false };
      }
    } catch {
      dlog('📝 QR is not JSON, treating as plain text');
    }

    // 2) Jika URL → coba ekstrak
    if (qrResult.includes('http')) {
      dlog('🔗 QR contains URL:', qrResult);

      const urlMatch = qrResult.match(/\/(voucher|promo)\/(\d+)/);
      if (urlMatch) {
        const code = urlMatch[2];
        dlog(`✅ Extracted ${urlMatch[1]} ID from URL:`, code);
        return { code, type: urlMatch[1], isStructured: false };
      }

      const codeMatch = qrResult.match(/[?&]code=([^&]+)/);
      if (codeMatch) {
        const code = decodeURIComponent(codeMatch[1]);
        dlog('✅ Extracted code from URL query:', code);
        return { code, type: 'unknown', isStructured: false };
      }
    }

    // 3) Pipe format "type|code"
    if (qrResult.includes('|')) {
      const parts = qrResult.split('|');
      dlog('📋 Pipe-separated QR parts:', parts);

      if (parts.length >= 2 && (parts[0] === 'voucher' || parts[0] === 'promo')) {
        const code = parts[1];
        dlog(`✅ Extracted ${parts[0]} code:`, code);
        return { code, type: parts[0], isStructured: false };
      }
    }

    // 4) Direct code
    if (/^[A-Z0-9]{6,}$/i.test(qrResult.trim())) {
      dlog('✅ QR appears to be direct validation code:', qrResult.trim());
      return { code: qrResult.trim(), type: 'unknown', isStructured: false };
    }

    // 5) Default
    const trimmedResult = qrResult.trim();
    dlog('⚠️ Using QR result as-is (no specific pattern found):', trimmedResult);
    return { code: trimmedResult, type: 'unknown', isStructured: false };
  };

  // Validasi tenant + sinkronisasi item user agar “Saku” langsung updated
  const submitValidate = async (qrData) => {
    setSubmitLoading(true);
    setIsScanning(false);

    dlog('🚀 STARTING VALIDATION PROCESS:', {
      qrData,
      tenant: {
        id: profile?.id,
        name: profile?.fullname,
        email: profile?.email,
        role_id: profile?.role_id,
      },
      timestamp: new Date().toISOString(),
    });

    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : null;

      if (!token) {
        setModalFailedMessage('Sesi login berakhir. Silakan login kembali.');
        setModalFailed(true);
        setSubmitLoading(false);
        setIsScanning(true);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Extract dari QR
      const validationData = extractValidationCode(qrData);

      if (!validationData || !validationData.code) {
        setModalFailedMessage('QR Code tidak valid atau tidak mengandung kode validasi yang dapat dibaca.');
        setModalFailed(true);
        setSubmitLoading(false);
        setIsScanning(true);
        return;
      }

      const codeToValidate = validationData.code;
      const qrItemType = validationData.type;
      const itemId = validationData.item_id;
      const userId = validationData.user_id;
      const isStructured = validationData.isStructured;

      setScannedCode(codeToValidate);

      if (!codeToValidate || codeToValidate.trim() === '') {
        setModalFailedMessage('Kode validasi tidak boleh kosong.');
        setModalFailed(true);
        setSubmitLoading(false);
        setIsScanning(true);
        return;
      }

      dlog('🔍 Validating code:', codeToValidate);
      dlog('📋 QR metadata:', { type: qrItemType, item_id: itemId, user_id: userId, isStructured });
      dlog('🔐 Validation request headers:', headers);

      // Tenant sebagai validator
      let res,
        result,
        itemType = 'promo',
        promoError = null,
        voucherError = null;

      const tenantPayload = {
        code: codeToValidate.trim(),
        tenant_id: profile?.id,
        validation_source: 'qr_scan',
        is_tenant_validation: true,
        validator_role: 'tenant',
      };

      if (userId) tenantPayload.item_owner_id = userId;
      if (itemId) tenantPayload.item_id = itemId;
      if (qrItemType && qrItemType !== 'unknown') tenantPayload.expected_type = qrItemType;
      if (validationData.validation_purpose) tenantPayload.validation_purpose = validationData.validation_purpose;
      if (validationData.timestamp) tenantPayload.qr_timestamp = validationData.timestamp;

      dlog('🏢 Enhanced tenant validation payload:', tenantPayload);

      // Prioritas: pakai hint type dari QR → coba itu dulu
      if (qrItemType === 'voucher') {
        dlog('🎫 QR indicates voucher - trying voucher validation first...');

        res = await fetch(`${apiUrl}/api/vouchers/validate`, {
          method: 'POST',
          headers,
          body: JSON.stringify(tenantPayload),
        });
        result = await res.json().catch(() => null);
        itemType = 'voucher';

        dlog('📡 Voucher validation response:', { status: res.status, ok: res.ok, result });

        if (!res.ok) {
          voucherError = { status: res.status, message: result?.message, result };
          dlog('🔍 Voucher failed, trying promo validation as fallback...');

          res = await fetch(`${apiUrl}/api/promos/validate`, {
            method: 'POST',
            headers,
            body: JSON.stringify(tenantPayload),
          });
          result = await res.json().catch(() => null);
          itemType = 'promo';

          dlog('📡 Promo validation response (fallback):', { status: res.status, ok: res.ok, result });
        }
      } else {
        // Default: promo dulu
        dlog('🎁 Trying promo validation first (default or QR indicates promo)...');

        res = await fetch(`${apiUrl}/api/promos/validate`, {
          method: 'POST',
          headers,
          body: JSON.stringify(tenantPayload),
        });
        result = await res.json().catch(() => null);
        itemType = 'promo';

        dlog('📡 Promo validation response:', { status: res.status, ok: res.ok, result });

        if (!res.ok) {
          promoError = { status: res.status, message: result?.message, result };
          dlog('🔍 Promo failed, trying voucher validation...');

          res = await fetch(`${apiUrl}/api/vouchers/validate`, {
            method: 'POST',
            headers,
            body: JSON.stringify(tenantPayload),
          });
          result = await res.json().catch(() => null);
          itemType = 'voucher';

          dlog('📡 Voucher validation response:', { status: res.status, ok: res.ok, result });
        }
      }

      if (res?.status === 401) {
        setModalFailedMessage('Sesi login berakhir. Silakan login kembali.');
        setModalFailed(true);
      } else if (res?.ok) {
        // === SUKSES VALIDASI TENANT ===
        // Ambil item id yang benar dari backend
        const respItemId =
          result?.data?.promo_item_id ||
          result?.data?.voucher_item_id ||
          result?.data?.promo?.id ||
          result?.data?.voucher?.id;

        if (isStructured && itemId && respItemId && String(respItemId) !== String(itemId)) {
          dlog('ℹ️ ID Info:', {
            qr_item_id: itemId,
            resp_item_id: respItemId,
            note: 'Backend handles correct item association',
          });
        }

        // Tampilkan sukses ke tenant
        setLastItemType(itemType);
        setModalSuccess(true);

        dlog('✅ VALIDATION SUCCESSFUL:', {
          itemType,
          itemId: respItemId,
          code: codeToValidate,
          tenantId: profile?.id,
          tenantName: profile?.fullname,
          timestamp: new Date().toISOString(),
          validationResponse: result,
        });

        // === Sinkronisasi (idempotent) ke baris item user supaya Saku user langsung updated ===
        // Aman dipanggil 2x, backend seharusnya mengabaikan kalau sudah used/redeemed.
        try {
          const idToRedeem = respItemId || itemId;
          if (idToRedeem) {
            if (itemType === 'voucher') {
              await fetch(`${apiUrl}/api/admin/voucher-items/${idToRedeem}/redeem`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ code: codeToValidate }),
              });
            } else {
              await fetch(`${apiUrl}/api/admin/promo-items/${idToRedeem}/redeem`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ code: codeToValidate }),
              });
            }
          }
        } catch {
          // Dibiarkan silent; ini hanya langkah sinkronisasi tambahan
        }
      } else {
        // === Error handling dengan pesan informatif ===
        let errorMsg = 'Kode tidak valid atau tidak ditemukan';

        const isAlreadyValidated = (status, message) =>
          status === 400 ||
          status === 409 ||
          (message &&
            (message.toLowerCase().includes('sudah') ||
              message.toLowerCase().includes('digunakan') ||
              message.toLowerCase().includes('divalidasi') ||
              message.toLowerCase().includes('already') ||
              message.toLowerCase().includes('used')));

        const isNotFound = (status, message) =>
          status === 404 ||
          (message &&
            (message.toLowerCase().includes('tidak ditemukan') ||
              message.toLowerCase().includes('not found') ||
              message.toLowerCase().includes('invalid')));

        if (promoError && isAlreadyValidated(promoError.status, promoError.message)) {
          errorMsg = `Promo dengan kode "${codeToValidate}" sudah pernah divalidasi sebelumnya.`;
        } else if (isAlreadyValidated(res?.status, result?.message)) {
          errorMsg = `${lastItemType === 'promo' ? 'Promo' : 'Voucher'} dengan kode "${codeToValidate}" sudah pernah divalidasi sebelumnya.`;
        } else if (promoError && promoError.status === 404 && res?.status === 404) {
          errorMsg = `Kode "${codeToValidate}" tidak ditemukan. Pastikan kode yang Anda masukkan sudah benar.`;
        } else if (isNotFound(res?.status, result?.message)) {
          errorMsg = `${lastItemType === 'promo' ? 'Promo' : 'Voucher'} dengan kode "${codeToValidate}" tidak ditemukan.`;
        } else if (res?.status === 422) {
          errorMsg = result?.message || `Kode "${codeToValidate}" tidak valid atau format salah.`;
        } else if (result?.message) {
          errorMsg = result.message;
        }

        setModalFailedMessage(errorMsg);
        setModalFailed(true);
      }
    } catch (err) {
      // Simpan error ke console saat dev saja
      // eslint-disable-next-line no-console
      if (dev) console.error('Validation error:', err);
      setModalFailedMessage('Terjadi kesalahan saat validasi. Silakan coba lagi.');
      setModalFailed(true);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleScanResult = async (result) => {
    // Hindari multiple triggers
    if (!result || submitLoading || !isScanning) {
      dlog('🚫 Scan blocked:', { hasResult: !!result, isLoading: submitLoading, isScanning });
      return;
    }

    setIsScanning(false);
    dlog('🎯 QR SCAN RESULT:', result);

    let qrDataToProcess = result;

    // Library scanner sering memberi objek { text: '...' }
    if (result?.text) {
      dlog('📱 QR Code Text Found:', result.text);
      qrDataToProcess = result.text;
    } else if (typeof result === 'string') {
      dlog('➡️ Direct String QR Code:', result);
      qrDataToProcess = result;
    }

    // Ekstrak & validasi
    const validationData = extractValidationCode(qrDataToProcess);

    dlog('🧪 Extracted Validation Data:', {
      originalQR: qrDataToProcess,
      validationData,
      isValidData: validationData && validationData.code,
    });

    if (validationData && validationData.code) {
      setScannedCode(validationData.code);
      setScanResult(result);
      await submitValidate(qrDataToProcess); // kirim raw QR agar parser seragam
    } else {
      dlog('❌ Failed to extract validation code from QR');
      setModalFailedMessage('QR Code tidak valid atau tidak mengandung kode validasi.');
      setModalFailed(true);
      setSubmitLoading(false);
      setIsScanning(true);
    }
  };

  const resetScanner = () => {
    dlog('🔄 RESETTING SCANNER at', new Date().toISOString());
    setScanResult(null);
    setScannedCode(null);
    setIsScanning(true);
    setSubmitLoading(false);
    setModalSuccess(false);
    setModalFailed(false);
    setLastItemType(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10" />
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-3 border-gray-200 border-t-primary mx-auto" />
            <p className="text-gray-700 mt-3 font-medium">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  // Jika bukan Manager Tenant
  if (!isManagerTenant) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10" />
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldCheck} className="text-2xl text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600 text-sm mb-4">Fitur ini hanya tersedia untuk Manager Tenant.</p>
            <ButtonComponent label="Kembali" onClick={() => router.push('/app/akun')} size="md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10" />
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
          <div className="flex justify-between items-center gap-2 p-2 sticky top-0 z-30 bg-white bg-opacity-40 backdrop-blur-sm border-b">
            <div className="px-2">
              <IconButtonComponent icon={faArrowLeftLong} variant="simple" size="lg" onClick={() => router.back()} />
            </div>
            <div className="font-semibold w-full text-lg">Scan QR Validasi</div>
            <div className="w-12" />
          </div>

          <div className="bg-background bg-gradient-to-br -mt-4 rounded-t-[15px] pt-2 from-cyan-50 relative z-50 px-4">
            <div className="flex justify-center items-center gap-4 my-6">
              <div className="w-1/5 h-0.5 bg-gray-300" />
              <p className="text-slate-400 font-medium text-center">Scan QR Code</p>
              <div className="w-1/5 h-0.5 bg-gray-300" />
            </div>

            {/* Scanner Area */}
            <div className="mb-6">
              {/* Kode yang di-scan */}
              {scannedCode && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faEye} className="text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">Kode yang di-scan:</p>
                  </div>
                  <p className="text-lg font-mono text-blue-900 break-all bg-white p-2 rounded border">
                    {scannedCode}
                  </p>
                </div>
              )}

              <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                {isScanning ? (
                  <div className="relative">
                    <QrScannerComponent onScan={handleScanResult} />
                    <div className="absolute inset-0 border-2 border-white/30 rounded-[20px]">
                      <div className="absolute top-3 left-3 w-5 h-5 border-l-3 border-t-3 border-white rounded-tl-lg" />
                      <div className="absolute top-3 right-3 w-5 h-5 border-r-3 border-t-3 border-white rounded-tr-lg" />
                      <div className="absolute bottom-3 left-3 w-5 h-5 border-l-3 border-b-3 border-white rounded-bl-lg" />
                      <div className="absolute bottom-3 right-3 w-5 h-5 border-r-3 border-b-3 border-white rounded-br-lg" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center p-6">
                    {submitLoading ? (
                      <div className="text-center">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-16 w-16 border-3 border-gray-200 border-t-primary mx-auto" />
                          <FontAwesomeIcon icon={faQrcode} className="absolute inset-0 m-auto text-xl text-primary" />
                        </div>
                        <p className="text-gray-700 mt-3 font-medium text-sm">Memvalidasi...</p>
                        <p className="text-gray-400 text-xs">Mohon tunggu sebentar</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <FontAwesomeIcon icon={faShieldCheck} className="text-2xl text-primary" />
                        </div>
                        <p className="text-gray-800 font-medium text-sm">QR Code Berhasil Dipindai!</p>
                        <p className="text-gray-500 text-xs">Memproses validasi...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setFlashOn(!flashOn)}
                className={`flex-1 py-3 px-3 rounded-[15px] flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-sm ${
                  flashOn
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white bg-opacity-40 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FontAwesomeIcon icon={flashOn ? faFlashlightSlash : faFlashlight} className="text-base" />
                <span>{flashOn ? 'Matikan Flash' : 'Flash'}</span>
              </button>

              {!isScanning && (
                <button
                  onClick={resetScanner}
                  className="flex-1 bg-primary text-white py-3 px-3 rounded-[15px] font-medium text-sm shadow-sm hover:shadow-md transition-all"
                >
                  <FontAwesomeIcon icon={faCamera} className="mr-2" />
                  Scan Lagi
                </button>
              )}
            </div>

            {/* Hasil Scan (raw) */}
            {scanResult && (
              <div className="mb-6">
                <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] p-4 shadow-sm border border-gray-100 border-l-4 border-l-primary">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={faShieldCheck} className="text-primary" />
                    Hasil Scan
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-[12px]">
                    <p className="text-xs text-gray-700 font-mono break-all">
                      {typeof scanResult === 'string' ? scanResult : JSON.stringify(scanResult)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalConfirmComponent
        show={modalSuccess}
        onClose={() => {
          setModalSuccess(false);
          resetScanner();
        }}
        paint="primary"
        icon={faCheckCircle}
        title={`Selamat, ${lastItemType === 'promo' ? 'Promo' : 'Voucher'} Berhasil di validasi`}
        onSubmit={async () => {
          setModalSuccess(false);
          resetScanner();
        }}
      />

      <ModalConfirmComponent
        show={modalFailed}
        onClose={() => {
          setModalFailed(false);
          resetScanner();
        }}
        paint="danger"
        icon={faCheckCircle}
        title={modalFailedMessage}
        onSubmit={async () => {
          setModalFailed(false);
          resetScanner();
        }}
      />
    </>
  );
}
