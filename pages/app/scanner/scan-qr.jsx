import { faArrowLeft, faCamera, faFlashlight, faFlashlightSlash, faQrcode, faShieldCheck, faUser, faGift } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import QrScannerComponent from '../../../components/construct.components/QrScannerComponent';
import { get } from '../../../helpers/api.helpers';
import { token_cookie_name } from '../../../helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';
import Cookies from 'js-cookie';
import { useUserContext } from '../../../context/user.context';

// ✅ Helper: Get auth header
const getAuthHeader = () => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('huehuy_token_plain');
    if (!token) {
      const encrypted = Cookies.get(token_cookie_name || 'huehuy_token');
      if (encrypted) {
        try { token = Decrypt(encrypted); } catch {}
      }
    }
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ✅ Helper: Deteksi tipe QR dari data JSON
const detectQRType = (qrData) => {
  if (!qrData || typeof qrData !== 'object') return 'unknown';
  
  // QR User/Profile
  if (
    qrData.type === 'user' || 
    qrData.type === 'profile' ||
    qrData.user_id ||
    (qrData.code && qrData.code.startsWith('HUEHUY-'))
  ) {
    return 'user';
  }
  
  // QR Promo/Voucher untuk validasi
  if (
    qrData.validation_purpose === 'tenant_scan' ||
    qrData.validation_purpose === 'owner_validation' ||
    qrData.type === 'promo' ||
    qrData.type === 'voucher' ||
    (qrData.item_id && qrData.code)
  ) {
    return 'validation';
  }
  
  // QR URL
  if (qrData.url && (qrData.url.startsWith('http://') || qrData.url.startsWith('https://'))) {
    return 'url';
  }
  
  return 'unknown';
};

export default function ScanQR() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserContext();
  
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const [contactData, setContactData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  // ✅ Handle QR User (contact card)
  const handleUserQR = async (qrData) => {
    try {
      const profileId = qrData.user_id || qrData.id;
      if (!profileId) throw new Error('User ID not found in QR');

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
          return { success: true, type: 'user' };
        }
      }
      throw new Error('Profil tidak ditemukan');
    } catch (error) {
      console.error('❌ [USER QR] Error:', error);
      return { success: false, error: error.message, type: 'user' };
    }
  };

  // ✅ Handle QR Validation (promo/voucher)
  const handleValidationQR = async (qrData) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');
      
      let endpoint = '';
      const payload = {
        code: qrData.code,
        item_id: qrData.item_id,
        item_owner_id: qrData.item_owner_id,
        validator_role: 'tenant',
        validation_purpose: qrData.validation_purpose || 'tenant_scan',
        qr_timestamp: qrData.timestamp,
      };

      if (qrData.type === 'voucher') {
        endpoint = `${baseUrl}/api/vouchers/validate`;
      } else if (qrData.type === 'promo') {
        endpoint = `${baseUrl}/api/promos/validate-code`;
      } else {
        endpoint = `${baseUrl}/api/grabs/validate`;
      }

      console.log('🔍 [VALIDATION] Calling:', endpoint, payload);

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
      console.log('✅ [VALIDATION] Response:', result);

      if (response.ok && result.success) {
        return { success: true, data: result.data, type: qrData.type };
      } else {
        const errorMsg = result.message || 'Validasi gagal';
        let displayMessage = errorMsg;
        
        if (errorMsg.toLowerCase().includes('sudah') || errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('redeemed')) {
          displayMessage = '⚠️ Sudah pernah divalidasi sebelumnya';
        } else if (errorMsg.toLowerCase().includes('kadaluwarsa') || errorMsg.toLowerCase().includes('expired')) {
          displayMessage = '⏰ Sudah kadaluwarsa';
        } else if (errorMsg.toLowerCase().includes('tidak ditemukan') || errorMsg.toLowerCase().includes('not found')) {
          displayMessage = '❌ Kode tidak valid';
        }
        
        return { success: false, error: displayMessage, type: qrData.type };
      }
    } catch (error) {
      console.error('❌ [VALIDATION] Error:', error);
      return { success: false, error: 'Error koneksi: ' + error.message, type: 'unknown' };
    }
  };

  // ✅ Main handler: deteksi & route
  const handleScanResult = async (result) => {
    if (!result || loading) return;
    
    console.log('🔍 [SCAN] Raw:', result);
    
    setLoading(true);
    setScanResult(result);
    setIsScanning(false);
    setValidationResult(null);

    try {
      // Parse JSON
      let qrData = null;
      try {
        qrData = typeof result === 'string' ? JSON.parse(result) : result;
        console.log('✅ [PARSE] JSON:', qrData);
      } catch {
        qrData = null;
      }

      // Deteksi tipe QR
      const qrType = qrData ? detectQRType(qrData) : 'unknown';
      console.log('🎯 [DETECT] Type:', qrType);

      // Route ke handler sesuai tipe
      if (qrType === 'user') {
        console.log('👤 [ROUTE] User QR');
        const userResult = await handleUserQR(qrData);
        if (!userResult.success) {
          setScanResult({ type: 'error', message: `❌ Gagal: ${userResult.error}`, qrData });
        }
        
      } else if (qrType === 'validation') {
        console.log('🎫 [ROUTE] Validation QR');
        
        // Cek role: hanya merchant yang boleh validasi
        const isMerchant = profile?.role_id === 6; // Sesuaikan dengan role_id merchant di sistem lu
        
        if (!isMerchant) {
          setScanResult({
            type: 'permission_denied',
            message: '❌ Fitur validasi promo/voucher hanya tersedia untuk akun merchant/tenant.\n\nSilakan login dengan akun merchant untuk melakukan validasi.',
            qrData,
          });
          setLoading(false);
          return;
        }
        
        // Lanjut validasi
        const validationResult = await handleValidationQR(qrData);
        setValidationResult(validationResult);
        
      } else if (qrType === 'url') {
        console.log('🔗 [ROUTE] URL QR');
        if (qrData.url) {
          window.location.href = qrData.url;
          return;
        }
        
      } else {
        console.warn('⚠️ [ROUTE] Unknown QR');
        setScanResult({
          type: 'unknown',
          message: '❌ QR Code tidak dikenali atau tidak didukung.\n\nPastikan QR Code yang discan adalah QR Profile User atau QR Promo/Voucher yang valid.',
          qrData: qrData || result,
        });
      }
      
    } catch (error) {
      console.error('❌ [FATAL] Error:', error);
      setScanResult({ type: 'error', message: `Error: ${error.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Render hasil validasi promo/voucher
  const renderValidationResult = () => {
    if (!validationResult) return null;
    
    const { success, error, data, type } = validationResult;
    const isPromo = type === 'promo';
    const title = isPromo ? 'Promo' : 'Voucher';
    
    if (success) {
      return (
        <div className="px-4 pb-20">
          <div className="rounded-[20px] p-4 shadow-sm border border-l-4 bg-green-50 border-l-green-500 border-green-200">
            <h3 className="font-semibold mb-2 text-sm flex items-center gap-2 text-green-800">
              <FontAwesomeIcon icon={faShieldCheck} className="text-green-600" />
              ✅ {title} Berhasil Divvalidasi
            </h3>
            <p className="text-sm text-green-800 mb-3">
              {data?.promo_item?.promo?.title || data?.voucher_item?.voucher?.name || 'Item berhasil divalidasi'}
            </p>
            {data?.promo_item?.code && (
              <div className="bg-white/50 rounded-[12px] p-3 text-xs space-y-1 mb-3">
                <p><strong>Kode:</strong> {data.promo_item.code}</p>
                {data.promo_item.redeemed_at && (
                  <p><strong>Divvalidasi:</strong> {new Date(data.promo_item.redeemed_at).toLocaleString('id-ID')}</p>
                )}
              </div>
            )}
            <button
              onClick={() => { setValidationResult(null); resetScanner(); }}
              className="w-full py-2 px-4 rounded-[12px] font-medium text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Scan Lagi
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="px-4 pb-20">
          <div className="rounded-[20px] p-4 shadow-sm border border-l-4 bg-red-50 border-l-red-500 border-red-200">
            <h3 className="font-semibold mb-2 text-sm flex items-center gap-2 text-red-800">
              <FontAwesomeIcon icon={faQrcode} className="text-red-600" />
              ❌ Validasi Gagal
            </h3>
            <p className="text-sm text-red-800 mb-3">{error}</p>
            <button
              onClick={() => { setValidationResult(null); resetScanner(); }}
              className="w-full py-2 px-4 rounded-[12px] font-medium text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Scan Lagi
            </button>
          </div>
        </div>
      );
    }
  };

  // ✅ Render hasil scan biasa (error, unknown, permission denied)
  const renderScanResult = () => {
    if (!scanResult || typeof scanResult === 'string' || showContactConfirm || validationResult) return null;
    
    const { type, message } = scanResult;
    
    if (type === 'permission_denied') {
      return (
        <div className="px-4 pb-20">
          <div className="rounded-[20px] p-4 shadow-sm border border-l-4 bg-orange-50 border-l-orange-500 border-orange-200">
            <h3 className="font-semibold mb-2 text-sm flex items-center gap-2 text-orange-800">
              <FontAwesomeIcon icon={faShieldCheck} className="text-orange-600" />
              ⚠️ Akses Ditolak
            </h3>
            <p className="text-sm text-orange-800 mb-3 whitespace-pre-line">{message}</p>
            <button
              onClick={resetScanner}
              className="w-full py-2 px-4 rounded-[12px] font-medium text-sm bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              Scan Lagi
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="px-4 pb-20">
        <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] p-4 shadow-sm border border-gray-100 border-l-4 border-l-primary">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldCheck} className="text-primary" />
            Hasil Scan
          </h3>
          <div className="bg-gray-50 p-3 rounded-[12px]">
            <p className="text-xs text-gray-700 font-mono break-all whitespace-pre-line">{message || (typeof scanResult === 'string' ? scanResult : JSON.stringify(scanResult))}</p>
          </div>
        </div>
      </div>
    );
  };

  const resetScanner = () => {
    setScanResult(null);
    setValidationResult(null);
    setIsScanning(true);
    setLoading(false);
  };

  // Loading state
  if (profileLoading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 min-h-screen bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-slate-600">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-lg font-semibold text-white">Universal QR Scanner</h1>
              <p className="text-sm text-white/90">
                {isScanning ? 'Arahkan ke QR User atau Promo' : loading ? 'Memproses...' : 'Selesai'}
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
                    <p className="text-gray-700 mt-3 font-medium text-sm">Memproses QR Code...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <FontAwesomeIcon icon={faShieldCheck} className="text-2xl text-primary" />
                    </div>
                    <p className="text-gray-800 font-medium text-sm">QR Code Berhasil Dipindai!</p>
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

        {/* Render validation result (promo/voucher) */}
        {renderValidationResult()}

        {/* Render scan result (error, unknown, permission) */}
        {renderScanResult()}

        {/* Contact Confirmation Modal (for user QR) */}
        {showContactConfirm && contactData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faUser} className="text-2xl text-green-600" />
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
                  Contact card akan diunduh sebagai file gambar PNG.
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
                  onClick={() => {
                    // Download contact card logic here
                    setShowContactConfirm(false);
                    setContactData(null);
                    resetScanner();
                  }}
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