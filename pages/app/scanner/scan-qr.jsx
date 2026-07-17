/* eslint-disable no-console */
import { faArrowLeft, faCamera, faFlashlight, faFlashlightSlash, faQrcode, faShieldCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useState } from 'react';
import QrScannerComponent from '../../../components/construct.components/QrScannerComponent';
import { get } from '../../../helpers/api.helpers';
import { token_cookie_name } from '../../../helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';
import Cookies from 'js-cookie';
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import jsQR from "jsqr";

// ✅ Helper untuk mendapatkan auth header dari localStorage/cookie
const getAuthHeader = () => {
  if (typeof window === 'undefined') return {};
  
  let token = localStorage.getItem('huehuy_token_plain');

  if (!token) {
    const encrypted = Cookies.get(token_cookie_name || 'huehuy_token');
    if (encrypted) {
      try { token = Decrypt(encrypted); } catch { }
    }
  }
  
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function ScanQR() {
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

  // ✅ Helper: scale canvas dengan aspect ratio TERJAGA, tanpa smoothing
  const scaleCanvas = (sourceCanvas, factor) => {
    const w = Math.max(1, Math.round(sourceCanvas.width * factor));
    const h = Math.max(1, Math.round(sourceCanvas.height * factor));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, 0, 0, w, h);
    return canvas;
  };

  // ✅ Otsu's method: cari threshold biner optimal otomatis dari histogram
  const otsuThreshold = (grayData) => {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < grayData.length; i++) histogram[grayData[i]]++;

    const total = grayData.length;
    let sum = 0;
    for (let t = 0; t < 256; t++) sum += t * histogram[t];

    let sumB = 0, wB = 0, wF = 0, maxVar = 0, threshold = 128;

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const varBetween = wB * wF * (mB - mF) * (mB - mF);

      if (varBetween > maxVar) {
        maxVar = varBetween;
        threshold = t;
      }
    }
    return threshold;
  };

  // ✅ Helper: tingkatkan kontras secara adaptif untuk QR yang redup/blur
  const boostContrastAdaptive = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;
    const gray = new Uint8Array(width * height);

    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }

    const threshold = otsuThreshold(gray);

    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const v = gray[p] > threshold ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }

    ctx.putImageData(imageData, 0, 0);
    return imageData;
  };

  // ✅ Fallback ke ZXing jika jsQR gagal
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

  // ✅ Pipeline decoding multi-tahap untuk berbagai resolusi
  const tryDecodeAtScale = async (canvas) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const { width, height } = canvas;

    // 1. jsQR normal
    let data = ctx.getImageData(0, 0, width, height);
    let code = jsQR(data.data, width, height, { inversionAttempts: "attemptBoth" });
    if (code?.data) return code.data;

    // 2. jsQR + adaptive contrast (Otsu) - memodifikasi canvas in-place
    boostContrastAdaptive(ctx, width, height);
    data = ctx.getImageData(0, 0, width, height);
    code = jsQR(data.data, width, height, { inversionAttempts: "attemptBoth" });
    if (code?.data) return code.data;

    // 3. ZXing fallback pada canvas yang sudah ditingkatkan kontrasnya
    const zxingResult = await tryZxingFallback(canvas);
    if (zxingResult) return zxingResult;

    return null;
  };

  // ✅ Handle upload gambar dari galeri dengan pyramid scaling
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const bitmap = await loadImageFixedOrientation(reader.result);

        const baseCanvas = document.createElement("canvas");
        baseCanvas.width = bitmap.width;
        baseCanvas.height = bitmap.height;
        baseCanvas.getContext("2d").drawImage(bitmap, 0, 0);

        const longSide = Math.max(bitmap.width, bitmap.height);
        const targetSizes = [350, 500, 700, 1000, 1400];

        // Urutkan dari target yang paling dekat dengan ukuran asli (biar hemat & cepat)
        const scaleFactors = targetSizes
          .map((t) => t / longSide)
          .sort((a, b) => Math.abs(1 - a) - Math.abs(1 - b));

        let finalResult = null;
        for (const factor of scaleFactors) {
          const canvas = scaleCanvas(baseCanvas, factor);
          finalResult = await tryDecodeAtScale(canvas);
          if (finalResult) {
            console.log(`✅ Berhasil di skala ${factor.toFixed(2)}x (${canvas.width}x${canvas.height})`);
            break;
          }
        }

        if (finalResult) {
          console.log("QR RESULT:", finalResult);
          handleScanResult(finalResult);
        } else {
          console.error("QR gagal dibaca: semua level skala gagal");
          alert("QR Code tidak dapat dibaca. Pastikan QR tidak blur dan tidak terpotong.");
        }
      } catch (err) {
        console.error("QR gagal dibaca:", err);
        alert("QR Code tidak dapat dibaca");
      }
    };
    reader.onerror = () => alert("Gagal membaca file");
    reader.readAsDataURL(file);
  };

  // ✅ Function untuk handle QR validation (tenant_scan)
  const handleValidationScan = async (qrData) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');

      let endpoint = '';
      const payload = {
        code: qrData.code,
        item_id: qrData.item_id,
        item_owner_id: qrData.user_id,
        validator_role: 'tenant',
        validation_purpose: qrData.validation_purpose || 'tenant_scan',
        qr_timestamp: qrData.timestamp,
      };

      if (qrData.type === 'voucher') {
        endpoint = `${baseUrl}/api/vouchers/validate`;
      } else if (qrData.type === 'promo') {
        endpoint = `${baseUrl}/api/promos/validate`;
      } else {
        endpoint = `${baseUrl}/api/grabs/validate`;
      }

      console.log('🔍 Calling validation endpoint:', endpoint, payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('✅ Validation response:', result);

      if (response.ok) {
        setScanResult({
          type: 'validation_success',
          message: result.message || 'Validasi berhasil!',
          data: result.data,
          qrData,
        });
      } else {
        const errorMsg = result.message || 'Validasi gagal';
        let displayMessage = errorMsg;
        let displayType = 'validation_error';
        const lowerMsg = errorMsg.toLowerCase();

        if (lowerMsg.includes('sudah') || lowerMsg.includes('already') || lowerMsg.includes('redeemed') || lowerMsg.includes('digunakan')) {
          displayMessage = '⚠️ Promo ini sudah pernah divalidasi sebelumnya';
          displayType = 'validation_already_used';
        } else if (lowerMsg.includes('kadaluwarsa') || lowerMsg.includes('expired')) {
          displayMessage = '⏰ Promo sudah kadaluwarsa';
          displayType = 'validation_expired';
        } else if (lowerMsg.includes('tidak ditemukan') || lowerMsg.includes('not found')) {
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
        message: 'Error koneksi: ' + (error.message || 'Unknown error'),
        error: error,
        qrData,
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Main handler untuk hasil scan
  const handleScanResult = async (result) => {
    if (!result || loading) return;

    console.log('🔍 [SCAN RESULT] Raw data:', result);

    setLoading(true);
    setIsScanning(false);

    try {
      let qrData = null;
      try {
        qrData = typeof result === 'string' ? JSON.parse(result) : result;
        console.log('✅ [PARSE] Berhasil parse JSON:', qrData);
      } catch (parseError) {
        console.log('❌ [PARSE] Bukan JSON atau parse error:', parseError.message);
        qrData = null;
      }

      // 1. Cek apakah ini QR VALIDATION
      if (qrData) {
        const isValidationQR =
          qrData.validation_purpose === 'tenant_scan' ||
          qrData.validation_purpose === 'owner_validation' ||
          (qrData.type === 'promo' && qrData.item_id && qrData.code) ||
          (qrData.type === 'voucher' && qrData.item_id && qrData.code);

        if (isValidationQR && qrData.item_id && qrData.code) {
          console.log('✅ [DETECTED] Ini QR Validation! Memanggil handleValidationScan...');
          await handleValidationScan(qrData);
          return;
        }

        // Deteksi QR untuk redirect URL
        if (qrData.url && (qrData.url.startsWith('http://') || qrData.url.startsWith('https://'))) {
          console.log('✅ [DETECTED] Ini QR URL! Redirecting...');
          window.location.href = qrData.url;
          return;
        }
      }

      // 2. Cek apakah ini URL langsung (string)
      if (typeof result === 'string' && (result.startsWith('http://') || result.startsWith('https://'))) {
        console.log('✅ [DETECTED] Ini URL langsung! Redirecting...');

        if (result.includes('/profile/')) {
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
                    verified: !!profile.verified_at,
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

      // 3. FALLBACK: QR tidak dikenali
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
      setScanResult({
        type: 'validation_error',
        message: `Error: ${error.message || 'Unknown error processing QR code'}`,
        error: error,
      });
      setLoading(false);
      setIsScanning(true);
    }
  };

  // ✅ Download Contact Card sebagai gambar
  const downloadContactCard = () => {
    if (!contactData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Polyfill untuk roundRect jika browser lama
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
      const safeName = (contactData.name || 'user').replace(/\s+/g, '-');
      link.download = `contact-${safeName}-${contactData.code}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
    
    setShowContactConfirm(false);
    setContactData(null);
    resetScanner();
  };

  // ✅ Reset state scanner ke kondisi awal
  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
    setLoading(false);
    setShowContactConfirm(false);
    setContactData(null);
  };

  // ✅ Render hasil validasi dengan UI yang informatif
  const renderValidationResult = () => {
    if (!scanResult || typeof scanResult === 'string') return null;
    if (!scanResult.type?.startsWith('validation_')) return null;

    const isSuccess = scanResult.type === 'validation_success';
    const isAlreadyUsed = scanResult.type === 'validation_already_used';
    const isExpired = scanResult.type === 'validation_expired';
    const isInvalid = scanResult.type === 'validation_invalid';

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
            className={`w-full py-2 px-4 rounded-[12px] font-medium text-sm transition-colors ${
              isSuccess ? 'bg-green-600 text-white hover:bg-green-700' :
              isAlreadyUsed ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
              'bg-red-600 text-white hover:bg-red-700'
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
                {/* ✅ Pastikan komponen QrScannerComponent Anda mendukung prop 'torch' untuk senter */}
                <QrScannerComponent onScan={handleScanResult} torch={flashOn} />
                <div className="absolute inset-0 border-2 border-white/30 rounded-[20px] pointer-events-none">
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
              className={`flex-1 py-3 px-3 rounded-[15px] flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-sm ${
                flashOn
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white bg-opacity-40 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={flashOn ? faFlashlightSlash : faFlashlight} className="text-base" />
              <span>{flashOn ? 'Matikan Flash' : 'Flash'}</span>
            </button>

            {!isScanning && !loading && (
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
          className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer mx-4"
        >
          <FontAwesomeIcon icon={faCamera} />
          Upload QR dari Galeri
        </label>

        {/* Render hasil validasi khusus */}
        {renderValidationResult()}

        {/* Hasil Scan (untuk hasil non-validasi / raw string) */}
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
                    <span className="text-green-600 font-bold text-lg">{(contactData.name || 'U').charAt(0)}</span>
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
                      <span className="text-green-200 w-12">Email</span>
                      <span className="break-all">{contactData.email}</span>
                    </div>
                  )}
                  {contactData.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-200 w-12">Phone</span>
                      <span>{contactData.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-green-200 w-12">Code</span>
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