/* eslint-disable no-console */
import { faArrowLeft, faCamera, faFlashlight, faFlashlightSlash, faQrcode, faShieldCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import QrScannerComponent from '../../../components/construct.components/QrScannerComponent';
import { get, post } from '../../../helpers/api.helpers';
import { token_cookie_name } from '../../../helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';
import Cookies from 'js-cookie';
import { useUserContext } from '../../../context/user.context';
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import jsQR from "jsqr";

// ✅ Helper untuk mendapatkan auth header dari localStorage/cookie
const getAuthHeader = () => {
  let token = null;
  if (typeof window !== 'undefined') {
    // Prioritas: plain token dari localStorage
    token = localStorage.getItem('huehuy_token_plain');

    // Fallback: decrypt token dari cookie
    if (!token) {
      const encrypted = Cookies.get(token_cookie_name || 'huehuy_token');
      if (encrypted) {
        try { token = Decrypt(encrypted); } catch { }
      }
    }
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function ScanQR() {
  const router = useRouter();
  const { profile } = useUserContext();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const [contactData, setContactData] = useState(null);

// ✅ Helper: load image dengan EXIF orientation otomatis diperbaiki
const loadImageFixedOrientation = (dataUrl) =>
  new Promise((resolve, reject) => {
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) => createImageBitmap(blob, { imageOrientation: "from-image" }))
      .then(resolve)
      .catch(reject);
  });

// ✅ Helper: tingkatkan kontras jadi B/W tegas (bantu banget buat foto low-contrast)
const boostContrast = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = gray > 128 ? 255 : 0; // threshold sederhana
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  return imageData;
};

const tryJsQR = (canvas, ctx) => {
  const { width, height } = canvas;
  // Percobaan 1: normal
  let data = ctx.getImageData(0, 0, width, height);
  let code = jsQR(data.data, width, height, { inversionAttempts: "attemptBoth" });
  if (code?.data) return code.data;

  // Percobaan 2: kontras tinggi
  const boosted = boostContrast(ctx, width, height);
  code = jsQR(boosted.data, width, height, { inversionAttempts: "attemptBoth" });
  if (code?.data) return code.data;

  return null;
};

const tryZxingFallback = async (canvas) => {
  try {
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);

    const codeReader = new BrowserMultiFormatReader(hints);
    const result = await codeReader.decodeFromCanvas(canvas);
    return result?.getText() || null;
  } catch {
    return null;
  }
};

const handleImageUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      // ✅ Load dengan orientasi EXIF sudah diperbaiki
      const bitmap = await loadImageFixedOrientation(reader.result);

      const attempts = [1000, bitmap.width]; // coba resize dulu, lalu resolusi asli
      let finalResult = null;

      for (const maxDim of attempts) {
        const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        // Strategi 1: jsQR (normal + kontras tinggi)
        finalResult = tryJsQR(canvas, ctx);
        if (finalResult) break;

        // Strategi 2: fallback zxing TRY_HARDER
        finalResult = await tryZxingFallback(canvas);
        if (finalResult) break;
      }

      if (finalResult) {
        console.log("QR RESULT:", finalResult);
        handleScanResult(finalResult);
      } else {
        console.error("QR gagal dibaca: semua strategi gagal");
        alert(
          "QR Code tidak dapat dibaca. Coba foto ulang dengan QR menghadap lurus ke kamera, pencahayaan cukup, dan tidak blur."
        );
      }
    } catch (err) {
      console.error("QR gagal dibaca:", err);
      alert("QR Code tidak dapat dibaca");
    }
  };

  reader.onerror = () => alert("Gagal membaca file");
  reader.readAsDataURL(file);
};

  // ✅ BARU: Function untuk handle QR validation (tenant_scan)
  const handleValidationScan = async (qrData) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');

      // Tentukan endpoint berdasarkan type
      let endpoint = '';
      let payload = {
        code: qrData.code,
        item_id: qrData.item_id,
        item_owner_id: qrData.user_id,
        validator_role: 'tenant',  // ← WAJIB: backend cek role ini
        validation_purpose: qrData.validation_purpose || 'tenant_scan',
        qr_timestamp: qrData.timestamp,
      };

      if (qrData.type === 'voucher') {
        endpoint = `${baseUrl}/api/vouchers/validate`;
      } else if (qrData.type === 'promo') {
        endpoint = `${baseUrl}/api/promos/validate`;
      } else {
        // Fallback ke grabs/validate untuk general validation
        endpoint = `${baseUrl}/api/grabs/validate`;
      }

      console.log('🔍 Calling validation endpoint:', endpoint, payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader(),  // ← Kirim token auth
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('✅ Validation response:', result);

      if (response.ok) {
        // Validasi berhasil
        setScanResult({
          type: 'validation_success',
          message: result.message || 'Validasi berhasil!',
          data: result.data,
          qrData,
        });
      } else {
        // Validasi gagal (tapi response 200/4xx dari backend)
        const errorMsg = result.message || 'Validasi gagal';

        // ✅ Deteksi pesan "sudah divalidasi" untuk UX yang lebih jelas
        let displayMessage = errorMsg;
        let displayType = 'validation_error';

        if (errorMsg.toLowerCase().includes('sudah') ||
          errorMsg.toLowerCase().includes('already') ||
          errorMsg.toLowerCase().includes('redeemed') ||
          errorMsg.toLowerCase().includes('digunakan')) {
          displayMessage = '⚠️ Promo ini sudah pernah divalidasi sebelumnya';
          displayType = 'validation_already_used';
        } else if (errorMsg.toLowerCase().includes('kadaluwarsa') || errorMsg.toLowerCase().includes('expired')) {
          displayMessage = '⏰ Promo sudah kadaluwarsa';
          displayType = 'validation_expired';
        } else if (errorMsg.toLowerCase().includes('tidak ditemukan') || errorMsg.toLowerCase().includes('not found')) {
          displayMessage = '❌ Kode promo tidak valid';
          displayType = 'validation_invalid';
        }

        setScanResult({
          type: displayType,
          message: displayMessage,
          error: result,
          qrData,
        });
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      setScanResult({
        type: 'validation_error',
        message: 'Error koneksi: ' + error.message,
        error: error,
        qrData,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = async (result) => {
    if (!result || loading) return;

    console.log('🔍 [SCAN RESULT] Raw data:', result);

    setLoading(true);
    setScanResult(result);
    setIsScanning(false);

    try {
      // ============================================
      // ✅ PRIORITAS 1: Coba parse sebagai JSON dulu
      // ============================================
      let qrData = null;

      try {
        qrData = typeof result === 'string' ? JSON.parse(result) : result;
        console.log('✅ [PARSE] Berhasil parse JSON:', qrData);
      } catch (parseError) {
        console.log('❌ [PARSE] Bukan JSON atau parse error:', parseError.message);
        qrData = null;
      }

      // ============================================
      // ✅ PRIORITAS 2: Cek apakah ini QR VALIDATION
      // ============================================
      if (qrData) {
        console.log('🔍 [CHECK] Validation purpose:', qrData.validation_purpose);
        console.log('🔍 [CHECK] Type:', qrData.type);
        console.log('🔍 [CHECK] Item ID:', qrData.item_id);
        console.log('🔍 [CHECK] Code:', qrData.code);

        // Deteksi QR untuk validasi promo/voucher
        const isValidationQR =
          qrData.validation_purpose === 'tenant_scan' ||
          qrData.validation_purpose === 'owner_validation' ||
          (qrData.type === 'promo' && qrData.item_id && qrData.code) ||
          (qrData.type === 'voucher' && qrData.item_id && qrData.code);

        if (isValidationQR && qrData.item_id && qrData.code) {
          console.log('✅ [DETECTED] Ini QR Validation! Memanggil handleValidationScan...');
          await handleValidationScan(qrData);
          return; // ✅ EXIT - Jangan lanjut ke logic lain
        }

        // Deteksi QR untuk redirect URL
        if (qrData.url && (qrData.url.startsWith('http://') || qrData.url.startsWith('https://'))) {
          console.log('✅ [DETECTED] Ini QR URL! Redirecting...');
          window.location.href = qrData.url;
          return;
        }
      }

      // ============================================
      // ✅ PRIORITAS 3: Cek apakah ini URL langsung
      // ============================================
      if (typeof result === 'string' && (result.startsWith('http://') || result.startsWith('https://'))) {
        console.log('✅ [DETECTED] Ini URL langsung! Redirecting...');

        if (result.includes('/profile/')) {
          // Handle profile URL
          const profileMatch = result.match(/\/profile\/(\d+)/);
          if (profileMatch) {
            const profileId = profileMatch[1];
            try {
              const profileResponse = await get({ path: `users/${profileId}/public` });
              if (profileResponse?.status === 200 && profileResponse?.data) {
                const profile = profileResponse?.data?.data || null;
                if (profile) {
                  setContactData({
                    id: profile.id,
                    name: profile.name || 'Nama tidak tersedia',
                    email: profile.email || null,
                    phone: profile.phone || profile.handphone || null,
                    code: profile.code || `HUEHUY-${String(profile.id).padStart(6, '0')}`,
                    verified: profile.verified_at ? true : false,
                    avatar: profile.picture_source || '/avatar.jpg'
                  });
                  setShowContactConfirm(true);
                  setLoading(false);
                  return;
                }
              }
            } catch (error) {
              console.error('❌ [ERROR] Gagal ambil data profil:', error);
            }
          }
        }

        // Redirect langsung untuk URL promo/voucher
        if (result.includes('/app/komunitas/promo/') || result.includes('/app/komunitas/voucher/') || result.includes('/app/voucher/')) {
          window.location.href = result;
          return;
        }
      }

      // ============================================
      // ⚠️ FALLBACK: QR tidak dikenali
      // ============================================
      console.warn('⚠️ [FALLBACK] QR tidak dikenali, tampilkan pesan error');
      setScanResult({
        type: 'validation_error',
        message: '❌ QR Code tidak valid atau tidak didukung',
        error: { message: 'Unrecognized QR format' },
        qrData: qrData || result,
      });
      setLoading(false);

    } catch (error) {
      console.error('❌ [ERROR] Fatal error di handleScanResult:', error);
      setScanResult(`Error: ${error.message || 'Unknown error processing QR code'}`);
      setLoading(false);
      setIsScanning(true);
    }
  };
  // Note: removed duplicate older handleScanResult to avoid redeclaration error.

  const downloadContactCard = () => {
    if (!contactData) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx.roundRect) {
      ctx.roundRect = function (x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
      };
    }
    canvas.width = 600;
    canvas.height = 400;
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#059669');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = 'white';
    ctx.roundRect(30, 30, 540, 340, 20);
    ctx.fill();
    ctx.fillStyle = '#059669';
    ctx.roundRect(50, 50, 500, 80, 15);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(90, 90, 25, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('H', 90, 96);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HUEHUY CONTACT', 130, 85);
    ctx.font = '14px Arial';
    ctx.fillText('Digital Business Card', 130, 105);
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(contactData.name, 70, 180);
    ctx.font = '16px Arial';
    ctx.fillStyle = contactData.verified ? '#10b981' : '#6b7280';
    ctx.fillText(contactData.verified ? '✓ Verified Member' : 'Member', 70, 205);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Email: ' + (contactData.email || 'Tidak tersedia'), 70, 245);
    ctx.fillText('Phone: ' + (contactData.phone || 'Tidak tersedia'), 70, 275);
    ctx.fillText('Code: ' + contactData.code, 70, 305);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by HUEHUY Platform', 300, 350);
    ctx.fillText(new Date().toLocaleDateString('id-ID'), 300, 365);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `contact-${contactData.name.replace(/\s+/g, '-')}-${contactData.code}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
    setShowContactConfirm(false);
    setContactData(null);
    resetScanner();
  };

  const parseQRCode = (qrText) => {
    try {
      const data = JSON.parse(qrText);
      return data;
    } catch {
      if (qrText.includes('event') || qrText.includes('booth') || qrText.includes('curiosity')) {
        return { type: 'event_booth', boothId: extractBoothId(qrText) || 'CURIOSITY2024' };
      } else if (qrText.includes('tenant') || qrText.includes('promo') || qrText.includes('resto') || qrText.includes('food')) {
        return { type: 'tenant_promo', tenantId: extractTenantId(qrText) || 'FOODCOURT01' };
      }
      return { type: 'event_booth', boothId: 'CURIOSITY2024', data: qrText };
    }
  };

  const extractBoothId = (qrText) => {
    const match = qrText.match(/booth[_-](\w+)/i);
    return match ? match[1] : null;
  };

  const extractTenantId = (qrText) => {
    const match = qrText.match(/tenant[_-](\w+)/i);
    return match ? match[1] : null;
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
    setLoading(false);
  };

  // ✅ BARU: Render hasil validasi dengan UI yang lebih informatif
  const renderValidationResult = () => {
    if (!scanResult || typeof scanResult === 'string') return null;
    if (!scanResult.type?.startsWith('validation_')) return null;

    const isSuccess = scanResult.type === 'validation_success';
    const isAlreadyUsed = scanResult.type === 'validation_already_used';
    const isExpired = scanResult.type === 'validation_expired';
    const isInvalid = scanResult.type === 'validation_invalid';

    // Tentukan warna & icon berdasarkan tipe
    let bgColor, borderColor, textColor, icon, title;

    if (isSuccess) {
      bgColor = 'bg-green-50'; borderColor = 'border-green-200 border-l-green-500'; textColor = 'text-green-800';
      icon = faShieldCheck; title = '✅ Validasi Berhasil';
    } else if (isAlreadyUsed) {
      bgColor = 'bg-yellow-50'; borderColor = 'border-yellow-200 border-l-yellow-500'; textColor = 'text-yellow-800';
      icon = faQrcode; title = '⚠️ Sudah Divalidasi';
    } else if (isExpired) {
      bgColor = 'bg-orange-50'; borderColor = 'border-orange-200 border-l-orange-500'; textColor = 'text-orange-800';
      icon = faQrcode; title = '⏰ Kadaluwarsa';
    } else {
      bgColor = 'bg-red-50'; borderColor = 'border-red-200 border-l-red-500'; textColor = 'text-red-800';
      icon = faQrcode; title = '❌ Validasi Gagal';
    }

    return (
      <div className="px-4 pb-20">
        <div className={`rounded-[20px] p-4 shadow-sm border border-l-4 ${bgColor} ${borderColor}`}>
          <h3 className={`font-semibold mb-2 text-sm flex items-center gap-2 ${textColor}`}>
            <FontAwesomeIcon icon={icon} className={isSuccess ? 'text-green-600' : 'text-yellow-600'} />
            {title}
          </h3>
          <p className={`text-sm ${textColor} mb-3`}>{scanResult.message}</p>

          {/* Tampilkan detail promo jika ada */}
          {scanResult.data?.promo_item && (
            <div className="bg-white/50 rounded-[12px] p-3 text-xs space-y-1 mb-3">
              {scanResult.data.promo_item.promo?.title && (
                <p><strong>Promo:</strong> {scanResult.data.promo_item.promo.title}</p>
              )}
              {scanResult.data.promo_item.code && (
                <p><strong>Kode:</strong> {scanResult.data.promo_item.code}</p>
              )}
              {scanResult.data.promo_item.redeemed_at && (
                <p><strong>Divalidasi:</strong> {new Date(scanResult.data.promo_item.redeemed_at).toLocaleString('id-ID')}</p>
              )}
              {scanResult.data.promo_item.expires_at && (
                <p><strong>Berlaku hingga:</strong> {new Date(scanResult.data.promo_item.expires_at).toLocaleDateString('id-ID')}</p>
              )}
            </div>
          )}

          <button
            onClick={resetScanner}
            className={`w-full py-2 px-4 rounded-[12px] font-medium text-sm transition-colors ${isSuccess
                ? 'bg-green-600 text-white hover:bg-green-700'
                : isAlreadyUsed
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
          >
            Scan Lagi
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      <div className="container mx-auto relative z-10 min-h-screen bg-gradient-to-br from-cyan-50">
        {/* Header */}
        <div className="bg-primary px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FontAwesomeIcon icon={faArrowLeft} className="text-lg text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">QR Scanner</h1>
              <p className="text-sm text-white/90">
                {isScanning ? 'Arahkan kamera ke QR Code' : loading ? 'Memvalidasi...' : 'Selesai'}
              </p>
            </div>
            <FontAwesomeIcon icon={faQrcode} className="text-xl text-white/80" />
          </div>
        </div>

        {/* Scanner Area */}
        <div className="px-4 pb-4 mt-4">
          <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
            {isScanning ? (
              <div className="relative">
                <QrScannerComponent onScan={handleScanResult} />
                <div className="absolute inset-0 border-2 border-white/30 rounded-[20px]">
                  <div className="absolute top-3 left-3 w-5 h-5 border-l-3 border-t-3 border-white rounded-tl-lg"></div>
                  <div className="absolute top-3 right-3 w-5 h-5 border-r-3 border-t-3 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-l-3 border-b-3 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-3 right-3 w-5 h-5 border-r-3 border-b-3 border-white rounded-br-lg"></div>
                </div>
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center p-6">
                {loading ? (
                  <div className="text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-3 border-gray-200 border-t-primary mx-auto"></div>
                      <FontAwesomeIcon icon={faQrcode} className="absolute inset-0 m-auto text-xl text-primary" />
                    </div>
                    <p className="text-gray-700 mt-3 font-medium text-sm">Memvalidasi QR Code...</p>
                    <p className="text-gray-400 text-xs">Mohon tunggu sebentar</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <FontAwesomeIcon icon={faShieldCheck} className="text-2xl text-primary" />
                    </div>
                    <p className="text-gray-800 font-medium text-sm">QR Code Berhasil Dipindai!</p>
                    <p className="text-gray-500 text-xs">Menampilkan hasil...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4">
          <div className="flex gap-3">
            <button
              onClick={() => setFlashOn(!flashOn)}
              className={`flex-1 py-3 px-3 rounded-[15px] flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-sm ${flashOn
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
        </div>

        <input
            type="file"
            id="upload-qr"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
        />

        <label
          htmlFor="upload-qr"
          className="w-full mt-4 flex items-center justify-center gap-2
                     bg-primary text-white py-4 rounded-2xl
                     shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
            <FontAwesomeIcon icon={faCamera}/>
            Upload QR dari Galeri
        </label>

        {/* ✅ BARU: Render hasil validasi khusus */}
        {renderValidationResult()}

        {/* Hasil Scan (untuk hasil non-validasi) */}
        {scanResult && typeof scanResult === 'string' && (
          <div className="px-4 pb-20">
            <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] p-4 shadow-sm border border-gray-100 border-l-4 border-l-primary">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldCheck} className="text-primary" />
                Hasil Scan
              </h3>
              <div className="bg-gray-50 p-3 rounded-[12px]">
                <p className="text-xs text-gray-700 font-mono break-all">{scanResult}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Confirmation Modal */}
        {showContactConfirm && contactData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faQrcode} className="text-2xl text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Kontak Ditemukan!</h3>
                <p className="text-sm text-gray-600 mt-1">Apakah Anda ingin mengunduh contact card?</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">{contactData.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-base">{contactData.name}</h4>
                    {contactData.verified && (
                      <span className="text-xs text-green-100 flex items-center gap-1">
                        <FontAwesomeIcon icon={faShieldCheck} className="text-xs" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-white text-sm">
                  {contactData.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-200">Email</span>
                      <span className="break-all">{contactData.email}</span>
                    </div>
                  )}
                  {contactData.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-200">Phone</span>
                      <span>{contactData.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-green-200">Code</span>
                    <span>{contactData.code}</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-700 text-center">
                  Contact card akan diunduh sebagai file gambar PNG yang dapat Anda simpan di galeri atau bagikan.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowContactConfirm(false); setContactData(null); resetScanner(); }}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={downloadContactCard}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  Unduh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
